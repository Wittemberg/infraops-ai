import { GetStatsPipeParser, ParseResult } from "./parsers/GetStatsPipeParser";
import { DashboardSemanticParser } from "./parsers/DashboardSemanticParser";
import { DashboardLegacyParser } from "./parsers/DashboardLegacyParser";

export class PfSenseTelemetryParser {
  public static parsePayload(getStatsPayload?: string, dashboardHtml?: string): ParseResult {
    let pipeRes: ParseResult | null = null;
    if (getStatsPayload) {
      pipeRes = GetStatsPipeParser.parse(getStatsPayload);
    }

    let semanticRes: ParseResult | null = null;
    if (dashboardHtml) {
      semanticRes = DashboardSemanticParser.parse(dashboardHtml);
    }

    // If pipe parser returned 0% CPU but semantic parser extracted a real non-zero CPU (e.g. 23%), prefer semantic parser
    if (
      pipeRes &&
      pipeRes.matched &&
      pipeRes.cpuValue === 0 &&
      semanticRes &&
      semanticRes.matched &&
      semanticRes.cpuValue !== null &&
      semanticRes.cpuValue > 0
    ) {
      return semanticRes;
    }

    // Priority 1: AJAX /getstats.php pipe format
    if (pipeRes && pipeRes.matched && pipeRes.cpuValue !== null && pipeRes.memoryValue !== null) {
      return pipeRes;
    }

    // Priority 2: Dashboard Semantic Text Anchor Parser
    if (semanticRes && semanticRes.matched && (semanticRes.cpuValue !== null || semanticRes.memoryValue !== null)) {
      return semanticRes;
    }

    if (pipeRes && pipeRes.matched) {
      return pipeRes;
    }

    // Priority 3: Dashboard Legacy ID/Row Parser
    if (dashboardHtml) {
      const legacyRes = DashboardLegacyParser.parse(dashboardHtml);
      if (legacyRes.matched) {
        return legacyRes;
      }
    }

    return {
      matched: false,
      cpuValue: null,
      memoryValue: null,
      parserId: "none",
      confidence: "LOW",
    };
  }
}
