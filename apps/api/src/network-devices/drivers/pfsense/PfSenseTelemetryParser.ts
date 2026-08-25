import { GetStatsPipeParser, ParseResult } from "./parsers/GetStatsPipeParser";
import { DashboardSemanticParser } from "./parsers/DashboardSemanticParser";
import { DashboardLegacyParser } from "./parsers/DashboardLegacyParser";

export class PfSenseTelemetryParser {
  public static parsePayload(getStatsPayload?: string, dashboardHtml?: string): ParseResult {
    // Priority 1: AJAX /getstats.php pipe format
    if (getStatsPayload) {
      const pipeRes = GetStatsPipeParser.parse(getStatsPayload);
      if (pipeRes.matched && pipeRes.cpuValue !== null && pipeRes.memoryValue !== null) {
        return pipeRes;
      }
    }

    // Priority 2: Dashboard Semantic Text Anchor Parser
    if (dashboardHtml) {
      const semanticRes = DashboardSemanticParser.parse(dashboardHtml);
      if (semanticRes.matched && (semanticRes.cpuValue !== null || semanticRes.memoryValue !== null)) {
        return semanticRes;
      }

      // Priority 3: Dashboard Legacy ID/Row Parser
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
