import { MetricsRegistry } from "@infraops/observability";

export const globalMetrics = new MetricsRegistry();

// Initialize default platform metrics
globalMetrics.setGauge("infraops_agent_info", "Agent release version and platform info", { agent_version: "0.1.0", os: "linux", arch: "amd64" }, 1);

export interface HealthResponse {
  status: "ok" | "degraded" | "error";
  service: string;
  timestamp: string;
  checks?: Record<string, { status: "ok" | "error"; message?: string }>;
}

export function handleLiveness(): HealthResponse {
  return {
    status: "ok",
    service: "infraops-api",
    timestamp: new Date().toISOString(),
  };
}

export function handleReadiness(dbHealthy = true, redisHealthy = true): { statusCode: number; body: HealthResponse } {
  const isHealthy = dbHealthy && redisHealthy;
  const statusCode = isHealthy ? 200 : 503;

  return {
    statusCode,
    body: {
      status: isHealthy ? "ok" : "degraded",
      service: "infraops-api",
      timestamp: new Date().toISOString(),
      checks: {
        postgresql: { status: dbHealthy ? "ok" : "error" },
        redis: { status: redisHealthy ? "ok" : "error" },
      },
    },
  };
}

export function handleMetricsScrape(): string {
  return globalMetrics.exportPrometheusFormat();
}
