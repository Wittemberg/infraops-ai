export interface ParseResult {
  matched: boolean;
  cpuValue: number | null;
  memoryValue: number | null;
  parserId: string;
  confidence: "HIGH" | "MEDIUM" | "LOW";
}

export class GetStatsPipeParser {
  public static parse(payload: string): ParseResult {
    const trimmed = payload.trim();
    if (trimmed.startsWith("<") || trimmed.includes("SESSION_TIMEOUT") || !trimmed.includes("|")) {
      return { matched: false, cpuValue: null, memoryValue: null, parserId: "getstats-pipe-v1", confidence: "LOW" };
    }

    const parts = trimmed.split("|");
    if (parts.length < 2) {
      return { matched: false, cpuValue: null, memoryValue: null, parserId: "getstats-pipe-v1", confidence: "LOW" };
    }

    const rawCpu = parseFloat(parts[0]);
    const rawMem = parseFloat(parts[1]);

    const validCpu = !isNaN(rawCpu) && rawCpu >= 0 && rawCpu <= 100;
    const validMem = !isNaN(rawMem) && rawMem >= 0 && rawMem <= 100;

    if (validCpu || validMem) {
      return {
        matched: true,
        cpuValue: validCpu ? Math.round(rawCpu) : null,
        memoryValue: validMem ? Math.round(rawMem) : null,
        parserId: "getstats-pipe-v1",
        confidence: "HIGH",
      };
    }

    return { matched: false, cpuValue: null, memoryValue: null, parserId: "getstats-pipe-v1", confidence: "LOW" };
  }
}
