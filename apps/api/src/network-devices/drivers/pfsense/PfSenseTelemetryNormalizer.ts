import { MetricStatus, TelemetryMetric } from "../driverInterface";
import { ParseResult } from "./parsers/GetStatsPipeParser";

export interface NormalizedPfSenseTelemetry {
  cpu: TelemetryMetric;
  memory: TelemetryMetric;
  overallStatus: MetricStatus;
  source: string;
  parserId: string;
  collectedAt: string;
  firmwareVersion?: string;
}

export class PfSenseTelemetryNormalizer {
  public static normalize(
    parseResult: ParseResult,
    source: string,
    firmwareVersion?: string
  ): NormalizedPfSenseTelemetry {
    const collectedAt = new Date().toISOString();

    const validate = (val: number | null): { value: number | null; status: MetricStatus } => {
      if (val === null || val === undefined || isNaN(val)) {
        return { value: null, status: "UNAVAILABLE" };
      }
      if (val < 0 || val > 100) {
        return { value: null, status: "PARSE_ERROR" };
      }
      return { value: Math.round(val), status: "OK" };
    };

    const cpuNorm = validate(parseResult.cpuValue);
    const memNorm = validate(parseResult.memoryValue);

    const cpu: TelemetryMetric = {
      value: cpuNorm.value,
      unit: "%",
      status: cpuNorm.status,
      collectedAt,
      source,
      parserId: parseResult.parserId,
      confidence: parseResult.confidence,
    };

    const memory: TelemetryMetric = {
      value: memNorm.value,
      unit: "%",
      status: memNorm.status,
      collectedAt,
      source,
      parserId: parseResult.parserId,
      confidence: parseResult.confidence,
    };

    let overallStatus: MetricStatus = "OK";
    if (cpuNorm.status !== "OK" && memNorm.status !== "OK") {
      overallStatus = "UNAVAILABLE";
    } else if (cpuNorm.status !== "OK" || memNorm.status !== "OK") {
      overallStatus = "PARSE_ERROR";
    }

    return {
      cpu,
      memory,
      overallStatus,
      source,
      parserId: parseResult.parserId,
      collectedAt,
      firmwareVersion,
    };
  }
}
