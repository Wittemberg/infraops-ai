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

    const p0 = parseFloat(parts[0]);
    const p1 = parseFloat(parts[1]);
    const p2 = parts.length >= 3 ? parseFloat(parts[2]) : NaN;

    let rawCpu: number | null = null;
    let rawMem: number | null = null;

    // Case 1: FreeBSD CPU Ticks (p0 = Total Ticks, p1 = Idle Ticks, p2 = Memory %)
    if (!isNaN(p0) && !isNaN(p1) && p0 > 100 && p1 > 100 && p0 >= p1) {
      const busyTicks = p0 - p1;
      rawCpu = (busyTicks / p0) * 100;
      if (!isNaN(p2) && p2 >= 0 && p2 <= 100) {
        rawMem = p2;
      }
    } else {
      // Case 2: Direct percentages (p0 = CPU %, p1 = Memory %)
      if (!isNaN(p0) && p0 >= 0 && p0 <= 100) {
        rawCpu = p0;
      }
      if (!isNaN(p1) && p1 >= 0 && p1 <= 100) {
        rawMem = p1;
      }
    }

    const validCpu = rawCpu !== null && !isNaN(rawCpu) && rawCpu >= 0 && rawCpu <= 100;
    const validMem = rawMem !== null && !isNaN(rawMem) && rawMem >= 0 && rawMem <= 100;

    if (validCpu || validMem) {
      return {
        matched: true,
        cpuValue: validCpu ? Math.round(rawCpu as number) : null,
        memoryValue: validMem ? Math.round(rawMem as number) : null,
        parserId: "getstats-pipe-v1",
        confidence: "HIGH",
      };
    }

    return { matched: false, cpuValue: null, memoryValue: null, parserId: "getstats-pipe-v1", confidence: "LOW" };
  }
}
