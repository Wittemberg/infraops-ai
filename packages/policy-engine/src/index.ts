export enum ActorType {
  USER = "user",
  AI = "ai",
  AGENT = "agent",
  SYSTEM = "system",
  INTEGRATION = "integration",
}

export enum Role {
  VIEWER = "viewer",
  OPERATOR = "operator",
  ADMINISTRATOR = "administrator",
  OWNER = "owner",
}

export enum Permission {
  NODE_READ = "node.read",
  NODE_MANAGE = "node.manage",
  METRICS_READ = "metrics.read",
  LOGS_READ = "logs.read",
  BACKUP_READ = "backup.read",
  BACKUP_CREATE = "backup.create",
  BACKUP_DELETE = "backup.delete",
  BACKUP_RESTORE = "backup.restore",
  SYSTEM_DIAGNOSTICS = "system.diagnostics",
  SYSTEM_PACKAGES_UPDATE = "system.packages.update",
  SYSTEM_PACKAGES_UPGRADE = "system.packages.upgrade",
  SYSTEM_REBOOT = "system.reboot",
  SERVICE_READ = "service.read",
  SERVICE_RESTART = "service.restart",
  VM_READ = "vm.read",
  VM_POWER = "vm.power",
  VM_MIGRATE = "vm.migrate",
  STORAGE_READ = "storage.read",
  STORAGE_CLEANUP = "storage.cleanup",
  POLICY_MANAGE = "policy.manage",
  AUDIT_READ = "audit.read",
  INTEGRATION_MANAGE = "integration.manage",
  AI_USE = "ai.use",
  APPROVAL_DECIDE = "approval.decide",
}

export const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  [Role.VIEWER]: [
    Permission.NODE_READ,
    Permission.METRICS_READ,
    Permission.LOGS_READ,
    Permission.BACKUP_READ,
    Permission.SERVICE_READ,
    Permission.VM_READ,
    Permission.STORAGE_READ,
    Permission.AUDIT_READ,
  ],
  [Role.OPERATOR]: [
    Permission.NODE_READ,
    Permission.METRICS_READ,
    Permission.LOGS_READ,
    Permission.BACKUP_READ,
    Permission.SERVICE_READ,
    Permission.VM_READ,
    Permission.STORAGE_READ,
    Permission.AUDIT_READ,
    Permission.SYSTEM_DIAGNOSTICS,
    Permission.SYSTEM_PACKAGES_UPDATE,
    Permission.SERVICE_RESTART,
    Permission.BACKUP_CREATE,
    Permission.AI_USE,
  ],
  [Role.ADMINISTRATOR]: [
    Permission.NODE_READ,
    Permission.METRICS_READ,
    Permission.LOGS_READ,
    Permission.BACKUP_READ,
    Permission.SERVICE_READ,
    Permission.VM_READ,
    Permission.STORAGE_READ,
    Permission.AUDIT_READ,
    Permission.SYSTEM_DIAGNOSTICS,
    Permission.SYSTEM_PACKAGES_UPDATE,
    Permission.SERVICE_RESTART,
    Permission.BACKUP_CREATE,
    Permission.AI_USE,
    Permission.NODE_MANAGE,
    Permission.SYSTEM_PACKAGES_UPGRADE,
    Permission.SYSTEM_REBOOT,
    Permission.BACKUP_RESTORE,
    Permission.VM_POWER,
    Permission.VM_MIGRATE,
    Permission.STORAGE_CLEANUP,
    Permission.POLICY_MANAGE,
    Permission.INTEGRATION_MANAGE,
    Permission.APPROVAL_DECIDE,
  ],
  [Role.OWNER]: Object.values(Permission),
};

export enum PolicyDecision {
  ALLOW = "allow",
  DENY = "deny",
  REQUIRES_APPROVAL = "requires_approval",
}

export interface PolicyRule {
  id: string;
  effect: PolicyDecision;
  actorType?: ActorType;
  permission?: Permission;
  tenantId?: string;
  nodeId?: string;
}

export interface MaintenanceWindow {
  daysOfWeek: number[]; // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
  startHour: number;    // 0 - 23
  endHour: number;      // 0 - 23
}

export interface DetailedPolicyEvaluationContext {
  tenantId: string;
  actorType: ActorType;
  actorId: string;
  userRole?: Role;
  requestedPermission: Permission;
  actionRisk: "read" | "low" | "medium" | "high" | "critical";
  approvalPolicy: "none" | "default" | "always";
  nodeId?: string;
  policies?: PolicyRule[];
  userPermissions?: Permission[];
  aiPermissions?: Permission[];
  maintenanceWindow?: MaintenanceWindow;
  evaluationTime?: Date;
}

export interface PolicyEvaluationResult {
  decision: PolicyDecision;
  reason: string;
  requiredApprovals: number;
}

export function isWithinMaintenanceWindow(window: MaintenanceWindow, now: Date = new Date()): boolean {
  const day = now.getUTCDay();
  const hour = now.getUTCHours();

  if (!window.daysOfWeek.includes(day)) {
    return false;
  }

  if (window.startHour <= window.endHour) {
    return hour >= window.startHour && hour < window.endHour;
  } else {
    // Overnight window (e.g. 22:00 to 06:00)
    return hour >= window.startHour || hour < window.endHour;
  }
}

export function evaluateJobPolicy(ctx: DetailedPolicyEvaluationContext): PolicyEvaluationResult {
  const { tenantId, actorType, userRole, requestedPermission, actionRisk, approvalPolicy, nodeId, policies = [] } = ctx;
  const now = ctx.evaluationTime || new Date();

  // 1. Explicit DENY Rule (Precedence #1)
  const explicitDeny = policies.find(
    (rule) =>
      rule.effect === PolicyDecision.DENY &&
      (!rule.tenantId || rule.tenantId === tenantId) &&
      (!rule.nodeId || rule.nodeId === nodeId) &&
      (!rule.actorType || rule.actorType === actorType) &&
      (!rule.permission || rule.permission === requestedPermission)
  );

  if (explicitDeny) {
    return {
      decision: PolicyDecision.DENY,
      reason: `Explicit DENY by policy rule: ${explicitDeny.id}`,
      requiredApprovals: 0,
    };
  }

  // 2. AI Actor Permission Check (user INTERSECT ai)
  if (actorType === ActorType.AI) {
    const userPerms = ctx.userPermissions || (userRole ? ROLE_PERMISSIONS[userRole] : []);
    const aiPerms = ctx.aiPermissions || ROLE_PERMISSIONS[Role.OPERATOR];

    if (!userPerms.includes(requestedPermission)) {
      return {
        decision: PolicyDecision.DENY,
        reason: `AI actor denied: User does not possess requested permission '${requestedPermission}'`,
        requiredApprovals: 0,
      };
    }

    if (!aiPerms.includes(requestedPermission)) {
      return {
        decision: PolicyDecision.DENY,
        reason: `AI actor denied: Permission '${requestedPermission}' is not granted to AI actor`,
        requiredApprovals: 0,
      };
    }

    // Critical actions are forbidden for autonomous AI execution in MVP
    if (actionRisk === "critical") {
      return {
        decision: PolicyDecision.DENY,
        reason: "Autonomous AI execution of critical risk actions is forbidden in MVP",
        requiredApprovals: 0,
      };
    }
  }

  // 3. User Permission Check
  if (actorType === ActorType.USER) {
    if (!userRole) {
      return { decision: PolicyDecision.DENY, reason: "User has no assigned role", requiredApprovals: 0 };
    }

    const rolePerms = ROLE_PERMISSIONS[userRole] || [];
    if (!rolePerms.includes(requestedPermission)) {
      return {
        decision: PolicyDecision.DENY,
        reason: `Role '${userRole}' does not grant permission '${requestedPermission}'`,
        requiredApprovals: 0,
      };
    }
  }

  // 4. Maintenance Window Evaluation for Disruptive Actions
  if (ctx.maintenanceWindow && (actionRisk === "medium" || actionRisk === "high" || actionRisk === "critical")) {
    const insideWindow = isWithinMaintenanceWindow(ctx.maintenanceWindow, now);
    if (!insideWindow) {
      return {
        decision: PolicyDecision.REQUIRES_APPROVAL,
        reason: `Action '${requestedPermission}' with risk '${actionRisk}' requested outside designated maintenance window`,
        requiredApprovals: 1,
      };
    }
  }

  // 5. Approval Policy Check
  if (approvalPolicy === "always" || actionRisk === "high") {
    return {
      decision: PolicyDecision.REQUIRES_APPROVAL,
      reason: `Action requires mandatory approval (risk: ${actionRisk}, approvalPolicy: ${approvalPolicy})`,
      requiredApprovals: 1,
    };
  }

  return {
    decision: PolicyDecision.ALLOW,
    reason: "Access granted and policy evaluation passed",
    requiredApprovals: 0,
  };
}

export function evaluatePolicy(ctx: any): any {
  return evaluateJobPolicy({
    tenantId: ctx.tenantId,
    actorType: ctx.actorType,
    actorId: ctx.actorId,
    userRole: ctx.userRole,
    requestedPermission: ctx.requestedPermission,
    actionRisk: "low",
    approvalPolicy: "none",
    nodeId: ctx.nodeId,
    policies: ctx.policies,
    userPermissions: ctx.userPermissions,
    aiPermissions: ctx.aiPermissions,
  });
}
