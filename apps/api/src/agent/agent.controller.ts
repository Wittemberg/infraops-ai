import { AppError } from "@infraops/shared";

export interface EnrollmentTokenStore {
  token: string;
  nodeId: string;
  tenantId: string;
  expiresAt: Date;
  used: boolean;
}

export interface RegisteredAgent {
  agentId: string;
  nodeId: string;
  tenantId: string;
  agentToken: string;
  status: "enrolled" | "revoked";
  lastSeenAt?: Date;
}

// In-memory state for demonstration and testing
export const enrollmentTokens: Map<string, EnrollmentTokenStore> = new Map();
export const registeredAgents: Map<string, RegisteredAgent> = new Map();

export function createEnrollmentToken(nodeId: string, tenantId: string, ttlMinutes = 15): string {
  const token = `enroll-token-${Math.random().toString(36).substring(2, 10)}`;
  const expiresAt = new Date(Date.now() + ttlMinutes * 60 * 1000);

  enrollmentTokens.set(token, {
    token,
    nodeId,
    tenantId,
    expiresAt,
    used: false,
  });

  return token;
}

export function handleEnrollment(payload: {
  enrollmentToken: string;
  agentVersion: string;
  hostname: string;
  machineIdHash: string;
}): { agentId: string; nodeId: string; agentToken: string; apiBaseUrl: string; heartbeatIntervalSeconds: number } {
  const store = enrollmentTokens.get(payload.enrollmentToken);

  if (!store) {
    throw new AppError("ENROLLMENT_TOKEN_INVALID", "Invalid enrollment token", 400);
  }

  if (store.used) {
    throw new AppError("ENROLLMENT_TOKEN_ALREADY_USED", "Enrollment token has already been consumed (single-use enforced)", 400);
  }

  if (new Date() > store.expiresAt) {
    throw new AppError("ENROLLMENT_TOKEN_EXPIRED", "Enrollment token has expired (15 minute TTL)", 400);
  }

  // Consume token
  store.used = true;

  const agentId = `agent-${Math.random().toString(36).substring(2, 8)}`;
  const agentToken = `agent-secret-token-${Math.random().toString(36).substring(2, 12)}`;

  registeredAgents.set(agentId, {
    agentId,
    nodeId: store.nodeId,
    tenantId: store.tenantId,
    agentToken,
    status: "enrolled",
    lastSeenAt: new Date(),
  });

  return {
    agentId,
    nodeId: store.nodeId,
    agentToken,
    apiBaseUrl: "https://infraopsai.awecloudsolution.com/api",
    heartbeatIntervalSeconds: 30,
  };
}

export function handleHeartbeat(agentId: string, token: string): { status: string; timestamp: string } {
  const agent = registeredAgents.get(agentId);

  if (!agent) {
    throw new AppError("AGENT_NOT_FOUND", "Agent identity not registered", 404);
  }

  if (agent.status === "revoked") {
    throw new AppError("AGENT_REVOKED", "Agent identity has been revoked. Access denied.", 403);
  }

  if (agent.agentToken !== token) {
    throw new AppError("UNAUTHORIZED_AGENT", "Invalid agent authorization token", 401);
  }

  agent.lastSeenAt = new Date();

  return {
    status: "ok",
    timestamp: new Date().toISOString(),
  };
}
