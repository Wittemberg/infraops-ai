export * from "./schema.js";
export * from "./job_protocol.js";
export * from "./hypervisor.js";
export * from "./development.js";

export const PACKAGE_NAME = "@infraops/contracts";

export interface ApiErrorResponse {
  error: {
    code: string;
    message: string;
    requestId: string;
    details?: Record<string, unknown>;
  };
}

export interface HealthCheckResponse {
  status: "ok" | "degraded" | "error";
  timestamp: string;
  version: string;
}
