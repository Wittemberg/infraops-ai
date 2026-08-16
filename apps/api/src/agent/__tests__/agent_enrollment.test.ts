import { createEnrollmentToken, handleEnrollment, handleHeartbeat, registeredAgents, enrollmentTokens } from "../agent.controller.js";
import { evaluateNodeStatus } from "../heartbeat_evaluator.js";
import { NodeStatus } from "@infraops/shared";

describe("Stage 06 - Agent Enrollment & Heartbeat Acceptance Tests", () => {
  beforeEach(() => {
    registeredAgents.clear();
    enrollmentTokens.clear();
  });

  test("1. Enrollment token is single-use and cannot be consumed twice", () => {
    const token = createEnrollmentToken("node-101", "tenant-A");

    const payload = {
      enrollmentToken: token,
      agentVersion: "0.1.0",
      hostname: "pve01",
      machineIdHash: "hash123",
    };

    // First attempt succeeds
    const resp = handleEnrollment(payload);
    expect(resp.agentId).toBeDefined();

    // Second attempt fails
    expect(() => handleEnrollment(payload)).toThrow("Enrollment token has already been consumed");
  });

  test("2. Expired enrollment token is rejected", () => {
    const token = createEnrollmentToken("node-102", "tenant-A", -1); // Expired 1 min ago

    const payload = {
      enrollmentToken: token,
      agentVersion: "0.1.0",
      hostname: "pve02",
      machineIdHash: "hash456",
    };

    expect(() => handleEnrollment(payload)).toThrow("Enrollment token has expired");
  });

  test("3. Registered agent heartbeat marks node as online", () => {
    const token = createEnrollmentToken("node-103", "tenant-A");
    const enrollResp = handleEnrollment({
      enrollmentToken: token,
      agentVersion: "0.1.0",
      hostname: "web01",
      machineIdHash: "hash789",
    });

    const hbResp = handleHeartbeat(enrollResp.agentId, enrollResp.agentToken);
    expect(hbResp.status).toBe("ok");

    const agent = registeredAgents.get(enrollResp.agentId)!;
    const status = evaluateNodeStatus({ nodeId: agent.nodeId, lastSeenAt: agent.lastSeenAt });
    expect(status).toBe(NodeStatus.ONLINE);
  });

  test("4. Revoked agent credentials block heartbeat", () => {
    const token = createEnrollmentToken("node-104", "tenant-A");
    const enrollResp = handleEnrollment({
      enrollmentToken: token,
      agentVersion: "0.1.0",
      hostname: "db01",
      machineIdHash: "hash321",
    });

    // Revoke agent identity
    const agent = registeredAgents.get(enrollResp.agentId)!;
    agent.status = "revoked";

    expect(() => handleHeartbeat(enrollResp.agentId, enrollResp.agentToken)).toThrow("Agent identity has been revoked");
  });

  test("5. Node transitions to degraded (>90s) and offline (>180s) when heartbeats cease", () => {
    const now = new Date();

    const nodeRecent = { nodeId: "node-1", lastSeenAt: new Date(now.getTime() - 30 * 1000) }; // 30s ago
    const nodeDegraded = { nodeId: "node-2", lastSeenAt: new Date(now.getTime() - 100 * 1000) }; // 100s ago
    const nodeOffline = { nodeId: "node-3", lastSeenAt: new Date(now.getTime() - 200 * 1000) }; // 200s ago

    expect(evaluateNodeStatus(nodeRecent, now)).toBe(NodeStatus.ONLINE);
    expect(evaluateNodeStatus(nodeDegraded, now)).toBe(NodeStatus.DEGRADED);
    expect(evaluateNodeStatus(nodeOffline, now)).toBe(NodeStatus.OFFLINE);
  });
});
