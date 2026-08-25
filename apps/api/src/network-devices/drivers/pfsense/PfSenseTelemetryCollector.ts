import { PfSenseWebGuiClient, TlsMode } from "./PfSenseWebGuiClient";
import { PfSenseSession } from "./PfSenseSession";
import { PfSenseTelemetryParser } from "./PfSenseTelemetryParser";
import { PfSenseTelemetryNormalizer, NormalizedPfSenseTelemetry } from "./PfSenseTelemetryNormalizer";
import { PfSenseTelemetryDiagnosticReport } from "./PfSenseTelemetryDiagnostic";

export class PfSenseTelemetryCollector {
  private host: string;
  private port: number;
  private tlsMode: TlsMode;

  constructor(host: string, port: number = 8181, tlsMode: TlsMode = "ALLOW_SELF_SIGNED") {
    this.host = host;
    this.port = port;
    this.tlsMode = tlsMode;
  }

  public async collect(user: string, pass: string): Promise<{ success: boolean; error?: string; telemetry?: NormalizedPfSenseTelemetry }> {
    const client = new PfSenseWebGuiClient(this.host, this.port, 8000, this.tlsMode);
    const sessionManager = new PfSenseSession(client);

    const authRes = await sessionManager.authenticate(user, pass);
    if (!authRes.success) {
      return {
        success: false,
        error: authRes.error || "Falha ao autenticar no pfSense.",
      };
    }

    // 1. Query AJAX /getstats.php
    let getStatsPayload = "";
    try {
      const ajaxRes = await client.makeRequest("/getstats.php", "GET", undefined, authRes.cookie, {
        "X-Requested-With": "XMLHttpRequest",
      });
      if (ajaxRes.statusCode === 200 && ajaxRes.data) {
        getStatsPayload = ajaxRes.data;
      }
    } catch (e) {
      // Ignore ajax error, fallback to dashboard
    }

    // 2. Query Dashboard HTML /index.php
    let dashboardHtml = "";
    try {
      const dashRes = await client.makeRequest("/index.php", "GET", undefined, authRes.cookie);
      if (dashRes.statusCode === 200 && dashRes.data) {
        dashboardHtml = dashRes.data;
      }
    } catch (e) {
      // Ignore dashboard error
    }

    // 3. Extract Firmware Version
    let firmwareVersion = "pfSense 2.7.2-RELEASE";
    if (dashboardHtml) {
      const verMatch =
        dashboardHtml.match(/2\.[0-9]+\.[0-9]+-RELEASE/i) ||
        dashboardHtml.match(/pfSense\s*Plus\s*[0-9\.-]+/i) ||
        dashboardHtml.match(/pfSense\s*([0-9\.-]+[A-Z]*)/i);
      if (verMatch) {
        firmwareVersion = verMatch[0].startsWith("pfSense") ? verMatch[0] : `pfSense ${verMatch[0]}`;
      }
    }

    // 4. Parse & Normalize
    const parseResult = PfSenseTelemetryParser.parsePayload(getStatsPayload, dashboardHtml);
    const normalized = PfSenseTelemetryNormalizer.normalize(
      parseResult,
      parseResult.parserId.startsWith("getstats") ? "PFSENSE_GETSTATS" : "PFSENSE_DASHBOARD",
      firmwareVersion
    );

    if (normalized.cpu.value === null && normalized.memory.value === null) {
      return {
        success: false,
        error: `Não foi possível extrair a telemetria do pfSense (verifique usuário e senha no Vault).`,
      };
    }

    return {
      success: true,
      telemetry: normalized,
    };
  }

  public async runSanitizedDiagnostic(deviceId: string, user: string, pass: string): Promise<PfSenseTelemetryDiagnosticReport> {
    const client = new PfSenseWebGuiClient(this.host, this.port, 8000, this.tlsMode);
    const sessionManager = new PfSenseSession(client);
    const timestamp = new Date().toISOString();

    const report: PfSenseTelemetryDiagnosticReport = {
      timestamp,
      deviceId,
      login: {
        authenticated: false,
        csrfDetected: false,
        sessionCookieDetected: false,
      },
      getStats: {
        responseFormat: "UNKNOWN",
        fieldCount: 0,
        payloadLength: 0,
      },
      dashboard: {
        payloadLength: 0,
        cpuMarkerDetected: false,
        memoryMarkerDetected: false,
        ptBrLabelsDetected: false,
        enLabelsDetected: false,
      },
      telemetry: {
        cpuFound: false,
        memoryFound: false,
        cpuValue: null,
        memoryValue: null,
        status: "UNAVAILABLE",
      },
    };

    try {
      const authRes = await sessionManager.authenticate(user, pass);
      report.login.initialStatus = authRes.initialStatusCode;
      report.login.postStatus = authRes.postStatusCode;
      report.login.csrfDetected = !!authRes.csrfToken;
      report.login.sessionCookieDetected = !!authRes.cookie;
      report.login.authenticated = authRes.success;

      if (!authRes.success) {
        report.login.errorDetails = authRes.error;
        report.errorCode = authRes.errorCode || "AUTH_ERROR";
        return report;
      }

      // Test getstats
      try {
        const ajaxRes = await client.makeRequest("/getstats.php", "GET", undefined, authRes.cookie, {
          "X-Requested-With": "XMLHttpRequest",
        });
        report.getStats.statusCode = ajaxRes.statusCode;
        report.getStats.payloadLength = ajaxRes.data ? ajaxRes.data.length : 0;
        report.getStats.contentType = ajaxRes.headers["content-type"] as string;

        if (ajaxRes.data) {
          const sample = ajaxRes.data.substring(0, 100).replace(/[\r\n]+/g, " ");
          report.getStats.samplePayload = sample;

          if (ajaxRes.data.includes("|") && !ajaxRes.data.includes("<html")) {
            report.getStats.responseFormat = "PIPE";
            report.getStats.fieldCount = ajaxRes.data.split("|").length;
          } else if (ajaxRes.data.includes("<html")) {
            report.getStats.responseFormat = "HTML";
          } else if (ajaxRes.data.includes("SESSION_TIMEOUT")) {
            report.getStats.responseFormat = "EMPTY";
          }
        }
      } catch (e: any) {
        report.getStats.responseFormat = "EMPTY";
      }

      // Test Dashboard
      let dashboardHtml = "";
      try {
        const dashRes = await client.makeRequest("/index.php", "GET", undefined, authRes.cookie);
        report.dashboard.statusCode = dashRes.statusCode;
        report.dashboard.payloadLength = dashRes.data ? dashRes.data.length : 0;
        dashboardHtml = dashRes.data || "";

        if (dashboardHtml) {
          report.dashboard.cpuMarkerDetected = /utiliza[cç][aã]o\s*do\s*cpu|cpu\s*usage/i.test(dashboardHtml);
          report.dashboard.memoryMarkerDetected = /utiliza[cç][aã]o\s*da\s*memoria|memory\s*usage/i.test(dashboardHtml);
          report.dashboard.ptBrLabelsDetected = /utiliza[cç][aã]o\s*do\s*cpu/i.test(dashboardHtml);
          report.dashboard.enLabelsDetected = /cpu\s*usage/i.test(dashboardHtml);

          const verMatch =
            dashboardHtml.match(/2\.[0-9]+\.[0-9]+-RELEASE/i) ||
            dashboardHtml.match(/pfSense\s*Plus\s*[0-9\.-]+/i) ||
            dashboardHtml.match(/pfSense\s*([0-9\.-]+[A-Z]*)/i);
          if (verMatch) {
            report.firmwareVersion = verMatch[0].startsWith("pfSense") ? verMatch[0] : `pfSense ${verMatch[0]}`;
          }
        }
      } catch (e: any) {
        // Ignore dashboard err
      }

      // Run Parser
      const parseResult = PfSenseTelemetryParser.parsePayload(report.getStats.samplePayload, dashboardHtml);
      const norm = PfSenseTelemetryNormalizer.normalize(parseResult, "PFSENSE_DIAGNOSTIC", report.firmwareVersion);

      report.telemetry.cpuFound = norm.cpu.value !== null;
      report.telemetry.memoryFound = norm.memory.value !== null;
      report.telemetry.cpuValue = norm.cpu.value;
      report.telemetry.memoryValue = norm.memory.value;
      report.telemetry.cpuSource = norm.cpu.source;
      report.telemetry.memorySource = norm.memory.source;
      report.telemetry.status = norm.overallStatus;
    } catch (e: any) {
      report.errorCode = `DIAGNOSTIC_ERROR: ${e.message}`;
    }

    return report;
  }
}
