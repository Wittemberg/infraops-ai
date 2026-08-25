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

    let legacyRes: ParseResult | null = null;
    if (dashboardHtml && (!semanticRes || !semanticRes.matched)) {
      legacyRes = DashboardLegacyParser.parse(dashboardHtml);
    }

    const htmlRes = (semanticRes && semanticRes.matched ? semanticRes : legacyRes) || null;

    let baseRes: ParseResult | null = null;

    // If pipe parser returned 0% CPU but semantic parser extracted a real non-zero CPU (e.g. 23%), prefer semantic parser
    if (
      pipeRes &&
      pipeRes.matched &&
      pipeRes.cpuValue === 0 &&
      htmlRes &&
      htmlRes.matched &&
      htmlRes.cpuValue !== null &&
      htmlRes.cpuValue > 0
    ) {
      baseRes = htmlRes;
    } else if (pipeRes && pipeRes.matched && pipeRes.cpuValue !== null && pipeRes.memoryValue !== null) {
      baseRes = pipeRes;
    } else if (htmlRes && htmlRes.matched) {
      baseRes = htmlRes;
    } else if (pipeRes && pipeRes.matched) {
      baseRes = pipeRes;
    }

    if (!baseRes) {
      return {
        matched: false,
        cpuValue: null,
        memoryValue: null,
        swapValue: null,
        storageValue: null,
        parserId: "none",
        confidence: "LOW",
      };
    }

    // Merge SWAP and Storage from HTML if baseRes doesn't have them
    return {
      ...baseRes,
      swapValue: baseRes.swapValue !== null && baseRes.swapValue !== undefined ? baseRes.swapValue : (htmlRes?.swapValue ?? null),
      storageValue: baseRes.storageValue !== null && baseRes.storageValue !== undefined ? baseRes.storageValue : (htmlRes?.storageValue ?? null),
    };
  }
}
