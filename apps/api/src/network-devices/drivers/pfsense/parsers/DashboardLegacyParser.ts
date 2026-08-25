import { ParseResult } from "./GetStatsPipeParser";

export class DashboardLegacyParser {
  public static parse(html: string): ParseResult {
    if (!html || typeof html !== "string") {
      return { matched: false, cpuValue: null, memoryValue: null, parserId: "dashboard-legacy-v1", confidence: "LOW" };
    }

    let cpuValue: number | null = null;
    let memoryValue: number | null = null;

    // Row ID <tr id="cpu">
    const cpuRow = html.match(/<tr[^>]*id=["']cpu["'][\s\S]*?<\/tr>/i);
    if (cpuRow) {
      const valMatch =
        cpuRow[0].match(/aria-valuenow=["'](\d+)["']/i) ||
        cpuRow[0].match(/style=["']width:\s*(\d+)%/i) ||
        cpuRow[0].match(/>\s*(\d+)%\s*</i) ||
        cpuRow[0].match(/(\d+)%/i);
      if (valMatch) {
        const v = Number(valMatch[1]);
        if (v >= 0 && v <= 100) cpuValue = v;
      }
    }

    // Row ID <tr id="memory">
    const memRow = html.match(/<tr[^>]*id=["']memory["'][\s\S]*?<\/tr>/i);
    if (memRow) {
      const valMatch =
        memRow[0].match(/aria-valuenow=["'](\d+)["']/i) ||
        memRow[0].match(/style=["']width:\s*(\d+)%/i) ||
        memRow[0].match(/(\d+)%\s*of/i) ||
        memRow[0].match(/>\s*(\d+)%\s*</i) ||
        memRow[0].match(/(\d+)%/i);
      if (valMatch) {
        const v = Number(valMatch[1]);
        if (v >= 0 && v <= 100) memoryValue = v;
      }
    }

    // ID attributes: #cpubars, #cpumeter, #memusagemeter
    if (cpuValue === null) {
      const match =
        html.match(/id=["']cpubars["'][\s\S]*?>\s*(\d+)%/i) ||
        html.match(/id=["']cpumeter["'][\s\S]*?width:\s*(\d+)%/i);
      if (match) {
        const v = Number(match[1]);
        if (v >= 0 && v <= 100) cpuValue = v;
      }
    }

    if (memoryValue === null) {
      const match = html.match(/id=["']memusagemeter["'][\s\S]*?width:\s*(\d+)%/i);
      if (match) {
        const v = Number(match[1]);
        if (v >= 0 && v <= 100) memoryValue = v;
      }
    }

    let swapValue: number | null = null;
    let storageValue: number | null = null;

    // Row ID <tr id="swap">
    const swapRow = html.match(/<tr[^>]*id=["']swap["'][\s\S]*?<\/tr>/i);
    if (swapRow) {
      const valMatch = swapRow[0].match(/(\d+)%/i);
      if (valMatch) {
        const v = Number(valMatch[1]);
        if (v >= 0 && v <= 100) swapValue = v;
      }
    }

    // Row ID <tr id="disk"> or diskusagemeter
    const diskRow = html.match(/<tr[^>]*id=["']disk["'][\s\S]*?<\/tr>/i) || html.match(/id=["']diskusagemeter["'][\s\S]*?width:\s*(\d+)%/i);
    if (diskRow) {
      const valMatch = diskRow[0].match(/(\d+)%/i);
      if (valMatch) {
        const v = Number(valMatch[1]);
        if (v >= 0 && v <= 100) storageValue = v;
      }
    }

    const matched = cpuValue !== null || memoryValue !== null || swapValue !== null || storageValue !== null;

    return {
      matched,
      cpuValue,
      memoryValue,
      swapValue,
      storageValue,
      parserId: "dashboard-legacy-v1",
      confidence: matched ? "MEDIUM" : "LOW",
    };
  }
}
