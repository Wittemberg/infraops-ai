import { ParseResult } from "./GetStatsPipeParser";

export class DashboardSemanticParser {
  public static parse(html: string): ParseResult {
    if (!html || typeof html !== "string") {
      return { matched: false, cpuValue: null, memoryValue: null, swapValue: null, storageValue: null, parserId: "dashboard-semantic-v1", confidence: "LOW" };
    }

    let cpuValue: number | null = null;
    let memoryValue: number | null = null;
    let swapValue: number | null = null;
    let storageValue: number | null = null;

    // CPU Anchor: utiliza...cpu OR cpu usage
    const cpuPart = html.split(/utiliza.*?cpu|cpu\s*usage/i)[1];
    if (cpuPart) {
      const windowText = cpuPart.substring(0, 300);
      const valMatch = windowText.match(/(\d+)%/);
      if (valMatch) {
        const val = Number(valMatch[1]);
        if (val >= 0 && val <= 100) cpuValue = val;
      }
    }

    // Memory Anchor: utiliza...memoria OR memory usage
    const memPart = html.split(/utiliza.*?memor|memory\s*usage/i)[1];
    if (memPart) {
      const windowText = memPart.substring(0, 300);
      const valMatch = windowText.match(/(\d+)%/);
      if (valMatch) {
        const val = Number(valMatch[1]);
        if (val >= 0 && val <= 100) memoryValue = val;
      }
    }

    // SWAP Anchor: utiliza...swap OR swap usage OR pattern e.g. "0% of 1024 MiB"
    const swapPart = html.split(/utiliza.*?swap|swap\s*usage|swap/i)[1];
    if (swapPart) {
      const windowText = swapPart.substring(0, 300);
      const valMatch = windowText.match(/(\d+)%/);
      if (valMatch) {
        const val = Number(valMatch[1]);
        if (val >= 0 && val <= 100) swapValue = val;
      }
    }
    if (swapValue === null) {
      const directSwapMatch = html.match(/swap[\s\S]{0,300}?(\d+)%\s*(of|de|\s*)\s*[\d\.\,]+\s*MiB/i);
      if (directSwapMatch) {
        const val = Number(directSwapMatch[1]);
        if (val >= 0 && val <= 100) swapValue = val;
      }
    }

    // Storage / Disk Anchor: disks OR mount OR pattern e.g. "9% of 30G (ufs)"
    const diskPart = html.split(/disks|tabela\s*de\s*discos|mount/i)[1];
    if (diskPart) {
      const windowText = diskPart.substring(0, 500);
      const valMatch = windowText.match(/(\d+)%\s*of/i) || windowText.match(/(\d+)%/);
      if (valMatch) {
        const val = Number(valMatch[1]);
        if (val >= 0 && val <= 100) storageValue = val;
      }
    }
    if (storageValue === null) {
      const directDiskMatch =
        html.match(/(\d+)%\s*of\s*[\d\.\,]+\s*[MGT]b?\s*\([a-z0-9]+\)/i) ||
        html.match(/(\d+)%\s*of\s*[\d\.\,]+\s*[MGT]b?/i);
      if (directDiskMatch) {
        const val = Number(directDiskMatch[1]);
        if (val >= 0 && val <= 100) storageValue = val;
      }
    }

    const matched = cpuValue !== null || memoryValue !== null || swapValue !== null || storageValue !== null;

    return {
      matched,
      cpuValue,
      memoryValue,
      swapValue,
      storageValue,
      parserId: "dashboard-semantic-v1",
      confidence: matched ? "HIGH" : "LOW",
    };
  }
}
