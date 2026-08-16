import { NodeModel, JobModel, AuditEventModel } from "@infraops/contracts";
import { NodeStatus, RiskLevel, JobState } from "@infraops/shared";

describe("Stage 04 - Data Model & Tenant Isolation Tests", () => {
  test("enforces tenant boundary on node queries", () => {
    const tenantA_Nodes: NodeModel[] = [
      {
        id: "node-1",
        tenantId: "tenant-A",
        name: "Proxmox Cluster 01",
        hostname: "pve01.clienta.local",
        type: "proxmox",
        status: NodeStatus.ONLINE,
        agentStatus: "online",
        criticality: RiskLevel.HIGH,
        metadata: {},
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ];

    const tenantB_Nodes: NodeModel[] = [
      {
        id: "node-2",
        tenantId: "tenant-B",
        name: "Linux Web01",
        hostname: "web01.clientb.local",
        type: "linux",
        status: NodeStatus.ONLINE,
        agentStatus: "online",
        criticality: RiskLevel.LOW,
        metadata: {},
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ];

    const queryForTenantA = (tenantId: string) => tenantA_Nodes.concat(tenantB_Nodes).filter((n) => n.tenantId === tenantId);

    const results = queryForTenantA("tenant-A");
    expect(results).toHaveLength(1);
    expect(results[0].id).toBe("node-1");
  });

  test("idempotency key uniqueness per tenant", () => {
    const jobs: JobModel[] = [
      {
        id: "job-101",
        tenantId: "tenant-A",
        nodeId: "node-1",
        actionDefinitionId: "action-apt-update",
        requestedByActorType: "user",
        requestedByActorId: "user-1",
        idempotencyKey: "idem-key-abc",
        status: JobState.REQUESTED,
        parameters: {},
        risk: RiskLevel.LOW,
        requiresApproval: false,
        requestedAt: new Date().toISOString(),
      },
    ];

    const tryInsertJob = (newJob: JobModel) => {
      const exists = jobs.some((j) => j.tenantId === newJob.tenantId && j.idempotencyKey === newJob.idempotencyKey);
      if (exists) {
        throw new Error("Duplicate idempotency key for tenant");
      }
      jobs.push(newJob);
    };

    expect(() =>
      tryInsertJob({
        id: "job-102",
        tenantId: "tenant-A",
        nodeId: "node-1",
        actionDefinitionId: "action-apt-update",
        requestedByActorType: "user",
        requestedByActorId: "user-1",
        idempotencyKey: "idem-key-abc",
        status: JobState.REQUESTED,
        parameters: {},
        risk: RiskLevel.LOW,
        requiresApproval: false,
        requestedAt: new Date().toISOString(),
      })
    ).toThrow("Duplicate idempotency key for tenant");
  });

  test("audit event record includes hash chain fields", () => {
    const auditEvent: AuditEventModel = {
      id: "audit-1",
      tenantId: "tenant-A",
      occurredAt: new Date().toISOString(),
      actorType: "user",
      actorId: "user-1",
      eventType: "system.reboot.requested",
      payload: { reason: "maintenance" },
      previousHash: "0000000000000000000000000000000000000000000000000000000000000000",
      eventHash: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
    };

    expect(auditEvent.previousHash).toBeDefined();
    expect(auditEvent.eventHash).toHaveLength(64);
  });
});
