import { ActorType, Role, Permission, evaluatePolicy, PolicyDecision } from "@infraops/policy-engine";
import { AppError } from "@infraops/shared";

export interface AuthContext {
  actorType: ActorType;
  actorId: string;
  tenantId: string;
  userRole?: Role;
  agentId?: string;
}

export function validateAgentToken(token: string): { agentId: string; tenantId: string; nodeId: string } {
  if (!token || !token.startsWith("agent-token-")) {
    throw new AppError("UNAUTHORIZED_AGENT", "Invalid or missing Agent credentials", 401);
  }
  // Simulated token validation
  return {
    agentId: "agent-001",
    tenantId: "tenant-A",
    nodeId: "node-101",
  };
}

export function validateUserToken(token: string): AuthContext {
  if (!token || !token.startsWith("Bearer ")) {
    throw new AppError("UNAUTHORIZED_USER", "Invalid or missing Bearer token", 401);
  }

  // Check if someone passed an agent token to a user endpoint
  if (token.includes("agent-token-")) {
    throw new AppError("INVALID_CREDENTIAL_TYPE", "Agent token cannot be used as user authentication token", 403);
  }

  return {
    actorType: ActorType.USER,
    actorId: "user-123",
    tenantId: "tenant-A",
    userRole: Role.OPERATOR,
  };
}

export function authorizeAction(ctx: AuthContext, requestedPermission: Permission, targetTenantId: string, nodeId?: string): void {
  // Enforce Tenant Isolation
  if (ctx.tenantId !== targetTenantId) {
    throw new AppError("TENANT_ACCESS_DENIED", `Cross-tenant access forbidden: Cannot access tenant '${targetTenantId}' from tenant '${ctx.tenantId}'`, 403);
  }

  // Evaluate Policy
  const result = evaluatePolicy({
    tenantId: ctx.tenantId,
    actorType: ctx.actorType,
    actorId: ctx.actorId,
    userRole: ctx.userRole,
    requestedPermission,
    nodeId,
  });

  if (result.decision === PolicyDecision.DENY) {
    throw new AppError("PERMISSION_DENIED", result.reason, 403);
  }
}
