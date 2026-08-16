import { ActorType, Role, Permission, evaluatePolicy, PolicyDecision } from "@infraops/policy-engine";
import { validateUserToken, validateAgentToken, authorizeAction } from "../auth.guard.js";

describe("Stage 05 - RBAC & Multi-Tenancy Mandatory Safety Tests", () => {
  // Test 1: Viewer role cannot execute mutable action (e.g. system.reboot)
  test("1. Viewer role cannot execute mutable actions", () => {
    const ctx = {
      tenantId: "tenant-A",
      actorType: ActorType.USER,
      actorId: "user-viewer",
      userRole: Role.VIEWER,
      requestedPermission: Permission.SYSTEM_REBOOT,
    };

    const result = evaluatePolicy(ctx);
    expect(result.decision).toBe(PolicyDecision.DENY);
    expect(result.reason).toContain("Role 'viewer' does not grant permission");
  });

  // Test 2: Operator of Tenant A cannot access Node B of Tenant B
  test("2. Operator of Tenant A cannot access Node B of Tenant B", () => {
    const authContext = {
      actorType: ActorType.USER,
      actorId: "user-op-A",
      tenantId: "tenant-A",
      userRole: Role.OPERATOR,
    };

    expect(() => authorizeAction(authContext, Permission.NODE_READ, "tenant-B", "node-B")).toThrow("Cross-tenant access forbidden");
  });

  // Test 3: Admin of Tenant A cannot access Tenant B resources
  test("3. Admin of Tenant A cannot query Tenant B resources", () => {
    const adminContext = {
      actorType: ActorType.USER,
      actorId: "user-admin-A",
      tenantId: "tenant-A",
      userRole: Role.ADMINISTRATOR,
    };

    expect(() => authorizeAction(adminContext, Permission.NODE_MANAGE, "tenant-B")).toThrow("Cross-tenant access forbidden");
  });

  // Test 4: AI cannot execute permissions not held by the user (effective = user INTERSECT ai INTERSECT policy)
  test("4. AI cannot execute permission not held by the user", () => {
    const result = evaluatePolicy({
      tenantId: "tenant-A",
      actorType: ActorType.AI,
      actorId: "ai-orchestrator",
      userRole: Role.VIEWER, // User is Viewer (no reboot permission)
      userPermissions: [Permission.NODE_READ],
      aiPermissions: [Permission.NODE_READ, Permission.SYSTEM_REBOOT], // AI has reboot, but user does not!
      requestedPermission: Permission.SYSTEM_REBOOT,
    });

    expect(result.decision).toBe(PolicyDecision.DENY);
    expect(result.reason).toContain("User does not possess requested permission");
  });

  // Test 5: Explicit DENY always prevails
  test("5. Explicit DENY in policy overrides ALLOW", () => {
    const result = evaluatePolicy({
      tenantId: "tenant-A",
      actorType: ActorType.USER,
      actorId: "user-admin-A",
      userRole: Role.ADMINISTRATOR, // Admin has SYSTEM_REBOOT permission by default
      requestedPermission: Permission.SYSTEM_REBOOT,
      policies: [
        {
          id: "deny-reboot-during-peak",
          effect: PolicyDecision.DENY,
          tenantId: "tenant-A",
          permission: Permission.SYSTEM_REBOOT,
        },
      ],
    });

    expect(result.decision).toBe(PolicyDecision.DENY);
    expect(result.reason).toContain("Explicit DENY by policy rule: deny-reboot-during-peak");
  });

  // Test 6: Agent token cannot be used as user token and vice-versa
  test("6. Agent token cannot authenticate user API endpoints", () => {
    expect(() => validateUserToken("Bearer agent-token-12345")).toThrow("Agent token cannot be used as user authentication token");
  });

  test("6. User token cannot authenticate agent endpoints", () => {
    expect(() => validateAgentToken("Bearer user-jwt-token")).toThrow("Invalid or missing Agent credentials");
  });
});
