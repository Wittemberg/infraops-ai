import { evaluateJobPolicy, PolicyDecision, ActorType, Role, Permission } from "@infraops/policy-engine";
import { ResourceLockService } from "../resource_lock.service.js";
import { ApprovalService } from "../approval.service.js";

describe("Stage 09 - Policy Engine, Approvals & Resource Locks Acceptance Tests", () => {
  let lockService: ResourceLockService;
  let approvalService: ApprovalService;

  beforeEach(() => {
    lockService = new ResourceLockService();
    approvalService = new ApprovalService();
  });

  test("1. Explicit DENY beats ALLOW in Policy Engine precedence", () => {
    const res = evaluateJobPolicy({
      tenantId: "tenant-A",
      actorType: ActorType.USER,
      actorId: "user-admin",
      userRole: Role.ADMINISTRATOR,
      requestedPermission: Permission.SYSTEM_REBOOT,
      actionRisk: "high",
      approvalPolicy: "always",
      policies: [
        {
          id: "rule-hard-deny",
          effect: PolicyDecision.DENY,
          tenantId: "tenant-A",
          permission: Permission.SYSTEM_REBOOT,
        },
      ],
    });

    expect(res.decision).toBe(PolicyDecision.DENY);
    expect(res.reason).toContain("Explicit DENY by policy rule: rule-hard-deny");
  });

  test("2. High-risk actions outside maintenance window require approval or are blocked", () => {
    // Window: Sunday 02:00 to 04:00 UTC (day 0)
    const window = { daysOfWeek: [0], startHour: 2, endHour: 4 };

    // Test time: Wednesday (day 3) 14:00 UTC (outside window)
    const outsideTime = new Date("2026-08-12T14:00:00Z");

    const res = evaluateJobPolicy({
      tenantId: "tenant-A",
      actorType: ActorType.USER,
      actorId: "user-operator",
      userRole: Role.ADMINISTRATOR,
      requestedPermission: Permission.SYSTEM_PACKAGES_UPGRADE,
      actionRisk: "medium",
      approvalPolicy: "default",
      maintenanceWindow: window,
      evaluationTime: outsideTime,
    });

    expect(res.decision).toBe(PolicyDecision.REQUIRES_APPROVAL);
    expect(res.reason).toContain("outside designated maintenance window");
  });

  test("3. Approval request expires after TTL", () => {
    const approval = approvalService.createApproval({
      jobId: "job-reboot",
      tenantId: "tenant-A",
      requestedByActorId: "user-operator",
      actionKey: "system.reboot",
      targetId: "node-101",
      parameters: { reason: "kernel update" },
      planSummary: "Reboot node-101",
      risk: "high",
      ttlMinutes: 15,
    });

    // Attempt decision 20 minutes later (past TTL)
    const futureTime = new Date(Date.now() + 20 * 60 * 1000);

    expect(() => approvalService.decideApproval(approval.id, "user-admin", "approved", "LGTM", futureTime)).toThrow("Approval request has expired");
  });

  test("4. Two exclusive locks on same resource cannot run concurrently", () => {
    lockService.acquireLock("node:101", "exclusive", "job-first", 300);

    expect(() => lockService.acquireLock("node:101", "exclusive", "job-second", 300)).toThrow("Resource 'node:101' is locked by job 'job-first'");
  });

  test("5. Anti-Self-Approval defense prevents job requester from approving their own job", () => {
    const approval = approvalService.createApproval({
      jobId: "job-high-risk",
      tenantId: "tenant-A",
      requestedByActorId: "user-same-person",
      actionKey: "backup.cleanup",
      targetId: "storage-01",
      parameters: { policyId: "pol-1" },
      planSummary: "Cleanup backups",
      risk: "high",
    });

    expect(() => approvalService.decideApproval(approval.id, "user-same-person", "approved", "Self approving")).toThrow("Self-approval is forbidden");
  });

  test("6. TOCTOU revalidation acquires lock and verifies approval before execution", () => {
    const approval = approvalService.createApproval({
      jobId: "job-toctou",
      tenantId: "tenant-A",
      requestedByActorId: "user-op",
      actionKey: "system.reboot",
      targetId: "node-202",
      parameters: {},
      planSummary: "Reboot node-202",
      risk: "high",
    });

    approvalService.decideApproval(approval.id, "user-admin", "approved", "Approved by admin");

    expect(() => approvalService.revalidateBeforeExecution(approval.id, lockService, "node:202", "exclusive")).not.toThrow();
  });
});
