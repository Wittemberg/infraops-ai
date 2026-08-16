import { registeredAgents, createEnrollmentToken, handleEnrollment } from "../agent.controller.js";
import { pendingJobs, createPendingJob, handleClaimJobs, handleJobStatusUpdate } from "../agent_jobs.controller.js";

describe("Stage 07 - Agent Job Protocol Acceptance Tests", () => {
  beforeEach(() => {
    registeredAgents.clear();
    pendingJobs.clear();
  });

  test("1. Agent X cannot claim jobs assigned to Node Y / Tenant Y", () => {
    // Register Agent X for Node X
    const tokenX = createEnrollmentToken("node-X", "tenant-A");
    const agentX = handleEnrollment({
      enrollmentToken: tokenX,
      agentVersion: "0.1.0",
      hostname: "host-x",
      machineIdHash: "hashX",
    });

    // Create job assigned to Node Y
    createPendingJob({
      jobId: "job-Y",
      tenantId: "tenant-A",
      nodeId: "node-Y", // Different node!
      idempotencyKey: "idem-Y",
      action: "system.apt_update",
      actionVersion: "1.0.0",
      parameters: {},
      timeoutSeconds: 300,
      expiresAt: new Date(Date.now() + 600000),
    });

    // Claim jobs by Agent X
    const claimResp = handleClaimJobs(agentX.agentId, agentX.agentToken, {
      agentId: agentX.agentId,
      capabilities: ["system.apt_update"],
    });

    expect(claimResp.jobs).toHaveLength(0); // Cannot claim Node Y job!
  });

  test("2. Expired jobs are rejected during claim", () => {
    const token = createEnrollmentToken("node-101", "tenant-A");
    const agent = handleEnrollment({
      enrollmentToken: token,
      agentVersion: "0.1.0",
      hostname: "host-1",
      machineIdHash: "hash1",
    });

    createPendingJob({
      jobId: "job-expired",
      tenantId: "tenant-A",
      nodeId: "node-101",
      idempotencyKey: "idem-expired",
      action: "system.apt_update",
      actionVersion: "1.0.0",
      parameters: {},
      timeoutSeconds: 300,
      expiresAt: new Date(Date.now() - 10000), // Expired 10s ago!
    });

    const claimResp = handleClaimJobs(agent.agentId, agent.agentToken, {
      agentId: agent.agentId,
      capabilities: ["system.apt_update"],
    });

    expect(claimResp.jobs).toHaveLength(0);
  });

  test("3. Large job output (>10KB) is offloaded to S3 storage reference", () => {
    const token = createEnrollmentToken("node-102", "tenant-A");
    const agent = handleEnrollment({
      enrollmentToken: token,
      agentVersion: "0.1.0",
      hostname: "host-2",
      machineIdHash: "hash2",
    });

    const job = createPendingJob({
      jobId: "job-large",
      tenantId: "tenant-A",
      nodeId: "node-102",
      idempotencyKey: "idem-large",
      action: "storage.analyze",
      actionVersion: "1.0.0",
      parameters: {},
      timeoutSeconds: 300,
      expiresAt: new Date(Date.now() + 600000),
    });

    // Generate large result string > 10KB
    const largeContent = "X".repeat(15 * 1024);

    const updateResp = handleJobStatusUpdate("job-large", agent.agentId, agent.agentToken, {
      jobId: "job-large",
      agentId: agent.agentId,
      status: "succeeded",
      result: { rawData: largeContent },
      resultDigest: "sha256-digest-abc",
    });

    expect(updateResp.acknowledged).toBe(true);

    const storedJob = pendingJobs.get("job-large")!;
    expect(storedJob.largeOutputS3Key).toBe("artifacts/tenant-A/job-large_result.json");
    expect(storedJob.result).toHaveProperty("_offloaded", true);
  });
});
