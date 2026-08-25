import { ParseResult } from "./GetStatsPipeParser";

export class DashboardSemanticParser {
  public static parse(html: string): ParseResult {
    if (!html || typeof html !== "string") {
      return { matched: false, cpuValue: null, memoryValue: null, parserId: "dashboard-semantic-v1", confidence: "LOW" };
    }

    let cpuValue: number | null = null;
    let memoryValue: number | null = null;

    // CPU Anchor: utiliza[cç][aã]o do cpu OR cpu usage
    const cpuPart = html.split(/utiliza[cç][aã]o\s*do\s*cpu|cpu\s*usage/i)[1];
    if (cpuPart) {
      const windowText = cpuPart.substring(0, 300);
      const valMatch = windowText.match(/(\d+)%/);
      if (valMatch) {
        const val = Number(valMatch[1]);
        if (val >= 0 && val <= 100) {
          cpuValue = val;
        }
      }
    }

    // Memory Anchor: utiliza[cç][aã]o da memoria OR memory usage
    const memPart = html.split(/utiliza[cç][aã]o\s*da\s*memoria|memory\s*usage/i)[1];
    if (memPart) {
      const windowText = memPart.substring(0, 300);
      const valMatch = windowText.match(/(\d+)%/);
      if (valMatch) {
        const val = Number(valMatch[1]);
        if (val >= 0 && val <= 100) {
          memoryValue = val;
        }
      }
    }

    const matched = cpuValue !== null || memoryValue !== null;

    return {
      matched,
      cpuValue,
      memoryValue,
      parserId: "dashboard-semantic-v1",
      confidence: matched ? "HIGH" : "LOW",
    };
  }
}
