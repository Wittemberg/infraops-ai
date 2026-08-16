import { createHash } from "crypto";

export interface AuditEvent {
  id: string;
  tenantId: string;
  occurredAt: string;
  actorType: "user" | "ai" | "agent" | "system" | "integration";
  actorId: string;
  userId?: string;
  nodeId?: string;
  jobId?: string;
  eventType: string;
  actionKey?: string;
  requestId?: string;
  traceId?: string;
  payload: Record<string, unknown>;
  previousHash?: string;
  eventHash: string;
}

export function canonicalSerialize(obj: unknown): string {
  if (obj === null || typeof obj !== "object") {
    return JSON.stringify(obj);
  }

  if (Array.isArray(obj)) {
    return "[" + obj.map(canonicalSerialize).join(",") + "]";
  }

  const keys = Object.keys(obj as Record<string, unknown>).sort();
  const entries = keys.map((key) => {
    const val = (obj as Record<string, unknown>)[key];
    return JSON.stringify(key) + ":" + canonicalSerialize(val);
  });

  return "{" + entries.join(",") + "}";
}

export function computeEventHash(payload: Record<string, unknown>, previousHash = "0".repeat(64)): string {
  const canonicalPayload = canonicalSerialize(payload);
  const dataToHash = canonicalPayload + previousHash;
  return createHash("sha256").update(dataToHash, "utf8").digest("hex");
}

export function createAuditEvent(
  id: string,
  tenantId: string,
  actorType: "user" | "ai" | "agent" | "system" | "integration",
  actorId: string,
  eventType: string,
  payload: Record<string, unknown>,
  previousHash = "0".repeat(64),
  overrides: Partial<AuditEvent> = {}
): AuditEvent {
  const occurredAt = overrides.occurredAt || new Date().toISOString();
  const fullPayload = {
    id,
    tenantId,
    occurredAt,
    actorType,
    actorId,
    eventType,
    payload,
    ...overrides,
  };

  const eventHash = computeEventHash(fullPayload, previousHash);

  return {
    id,
    tenantId,
    occurredAt,
    actorType,
    actorId,
    eventType,
    payload,
    previousHash,
    eventHash,
    ...overrides,
  };
}

export function verifyAuditChain(events: AuditEvent[]): { valid: boolean; brokenAtIndex?: number; reason?: string } {
  if (events.length === 0) return { valid: true };

  let expectedPreviousHash = events[0].previousHash || "0".repeat(64);

  for (let i = 0; i < events.length; i++) {
    const event = events[i];

    if (event.previousHash !== expectedPreviousHash) {
      return {
        valid: false,
        brokenAtIndex: i,
        reason: `Previous hash mismatch at index ${i}: expected '${expectedPreviousHash}', got '${event.previousHash}'`,
      };
    }

    const fullPayload = {
      id: event.id,
      tenantId: event.tenantId,
      occurredAt: event.occurredAt,
      actorType: event.actorType,
      actorId: event.actorId,
      eventType: event.eventType,
      payload: event.payload,
      userId: event.userId,
      nodeId: event.nodeId,
      jobId: event.jobId,
      actionKey: event.actionKey,
      requestId: event.requestId,
      traceId: event.traceId,
    };

    const computedHash = computeEventHash(fullPayload, event.previousHash);

    if (computedHash !== event.eventHash) {
      return {
        valid: false,
        brokenAtIndex: i,
        reason: `Event hash mismatch at index ${i}: event payload was tampered with`,
      };
    }

    expectedPreviousHash = event.eventHash;
  }

  return { valid: true };
}
