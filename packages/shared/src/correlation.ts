import { crypto } from "./utils.js";

export interface RequestContext {
  requestId: string;
  tenantId?: string;
  actorId?: string;
  jobId?: string;
  traceId?: string;
}

export function createRequestContext(overrides: Partial<RequestContext> = {}): RequestContext {
  return {
    requestId: overrides.requestId || generateUUID(),
    tenantId: overrides.tenantId,
    actorId: overrides.actorId,
    jobId: overrides.jobId,
    traceId: overrides.traceId,
  };
}

export function generateUUID(): string {
  if (typeof globalThis.crypto !== "undefined" && globalThis.crypto.randomUUID) {
    return globalThis.crypto.randomUUID();
  }
  // Fallback simple UUID generator
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}
