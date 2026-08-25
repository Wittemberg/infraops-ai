import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";
import { GetStatsPipeParser } from "../parsers/GetStatsPipeParser";
import { DashboardSemanticParser } from "../parsers/DashboardSemanticParser";
import { DashboardLegacyParser } from "../parsers/DashboardLegacyParser";
import { PfSenseTelemetryParser } from "../PfSenseTelemetryParser";
import { PfSenseTelemetryNormalizer } from "../PfSenseTelemetryNormalizer";

const readFixture = (filename: string) => {
  return fs.readFileSync(path.join(__dirname, "fixtures", filename), "utf-8");
};

describe("PfSense Telemetry Parsers Unit Tests", () => {
  it("should parse getstats pipe payload correctly", () => {
    const payload = readFixture("pfsense-getstats-real.txt");
    const result = GetStatsPipeParser.parse(payload);

    expect(result.matched).toBe(true);
    expect(result.cpuValue).toBe(12);
    expect(result.memoryValue).toBe(41);
    expect(result.parserId).toBe("getstats-pipe-v1");
  });

  it("should calculate CPU percentage and Memory percentage from FreeBSD cumulative CPU ticks", () => {
    const ticksPayload = "394945926|390192739|12|17 Days 23 Hours 55 Minutes 06 Seconds|5076/300000||Tue Aug 25 13:17:34 -03 2";
    const result = GetStatsPipeParser.parse(ticksPayload);

    expect(result.matched).toBe(true);
    expect(result.cpuValue).toBe(1); // (394945926 - 390192739) / 394945926 * 100 = 1.20% -> 1%
    expect(result.memoryValue).toBe(12); // 12%
    expect(result.parserId).toBe("getstats-pipe-v1");
  });

  it("should parse PT-BR WebGUI HTML dashboard semantically", () => {
    const html = readFixture("pfsense-ptbr-dashboard.html");
    const result = DashboardSemanticParser.parse(html);

    expect(result.matched).toBe(true);
    expect(result.cpuValue).toBe(14);
    expect(result.memoryValue).toBe(38);
    expect(result.parserId).toBe("dashboard-semantic-v1");
  });

  it("should parse EN WebGUI HTML dashboard semantically", () => {
    const html = readFixture("pfsense-en-dashboard.html");
    const result = DashboardSemanticParser.parse(html);

    expect(result.matched).toBe(true);
    expect(result.cpuValue).toBe(22);
    expect(result.memoryValue).toBe(45);
    expect(result.parserId).toBe("dashboard-semantic-v1");
  });

  it("should parse legacy HTML row attributes", () => {
    const legacyHtml = '<table class="table"><tr id="cpu"><td>CPU</td><td>width: 18%</td></tr><tr id="memory"><td>RAM</td><td>width: 50%</td></tr></table>';
    const result = DashboardLegacyParser.parse(legacyHtml);

    expect(result.matched).toBe(true);
    expect(result.cpuValue).toBe(18);
    expect(result.memoryValue).toBe(50);
  });

  it("should route priority in PfSenseTelemetryParser correctly", () => {
    const getStats = "5|25|0|0";
    const ptHtml = readFixture("pfsense-ptbr-dashboard.html");

    const result = PfSenseTelemetryParser.parsePayload(getStats, ptHtml);
    expect(result.parserId).toBe("getstats-pipe-v1");
    expect(result.cpuValue).toBe(5);
    expect(result.memoryValue).toBe(25);
  });

  it("should normalize valid values and handle nulls correctly", () => {
    const parseRes = {
      matched: false,
      cpuValue: null,
      memoryValue: null,
      parserId: "test",
      confidence: "LOW" as const,
    };

    const norm = PfSenseTelemetryNormalizer.normalize(parseRes, "TEST_SOURCE");
    expect(norm.cpu.value).toBeNull();
    expect(norm.cpu.status).toBe("UNAVAILABLE");
    expect(norm.memory.value).toBeNull();
    expect(norm.memory.status).toBe("UNAVAILABLE");
    expect(norm.overallStatus).toBe("UNAVAILABLE");
  });
});
