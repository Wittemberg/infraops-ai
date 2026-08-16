import { BackupEngineService, BackupArtifact, BackupPolicyConfig } from "../backup_engine.service.js";
import { BackupCleanupService } from "../backup_cleanup.service.js";

describe("Stage 14 - Backup Engine Acceptance Tests", () => {
  let engine: BackupEngineService;
  let cleanup: BackupCleanupService;

  const samplePolicy: BackupPolicyConfig = {
    id: "pol-daily",
    expectedFrequencyHours: 24,
    retentionDays: 7,
    minValidCopies: 3,
    sizeDeviationThresholdPercent: 50,
  };

  beforeEach(() => {
    engine = new BackupEngineService();
    cleanup = new BackupCleanupService();
  });

  test("1. Missing backup detected when no artifacts exist for policy", () => {
    const res = engine.evaluateExpectations(samplePolicy, []);
    expect(res.state).toBe("missing");
    expect(res.alertType).toBe("backup_missing");
  });

  test("2. Expired backup detected when latest backup age exceeds expected frequency", () => {
    const oldDate = new Date(Date.now() - 36 * 60 * 60 * 1000); // 36 hours ago (frequency 24h)
    const artifacts: BackupArtifact[] = [
      {
        id: "art-1",
        policyId: "pol-daily",
        targetId: "node-101",
        sizeBytes: 100 * 1024 * 1024 * 1024,
        status: "succeeded",
        createdAt: oldDate,
        integrityStatus: "valid",
      },
    ];

    const res = engine.evaluateExpectations(samplePolicy, artifacts);
    expect(res.state).toBe("expired");
    expect(res.alertType).toBe("backup_too_old");
  });

  test("3. Size anomaly detector flags sudden 85% drop in backup size", () => {
    const history: BackupArtifact[] = [
      { id: "h1", policyId: "pol-1", targetId: "node-101", sizeBytes: 100 * 1024 * 1024 * 1024, status: "succeeded", createdAt: new Date(), integrityStatus: "valid" },
      { id: "h2", policyId: "pol-1", targetId: "node-101", sizeBytes: 105 * 1024 * 1024 * 1024, status: "succeeded", createdAt: new Date(), integrityStatus: "valid" },
      { id: "h3", policyId: "pol-1", targetId: "node-101", sizeBytes: 98 * 1024 * 1024 * 1024, status: "succeeded", createdAt: new Date(), integrityStatus: "valid" },
    ];

    const currentSizeBytes = 15 * 1024 * 1024 * 1024; // 15GB (median ~100GB, drop 85%)
    const result = engine.detectSizeAnomaly(currentSizeBytes, history, 50);

    expect(result.isAnomaly).toBe(true);
    expect(result.dropPercentage).toBeGreaterThanOrEqual(80);
  });

  test("4. Safe retention cleanup protects minimum valid copies count", () => {
    const now = new Date();
    // 5 old artifacts (10 days old, retention is 7 days)
    const artifacts: BackupArtifact[] = [1, 2, 3, 4, 5].map((i) => ({
      id: `art-old-${i}`,
      policyId: samplePolicy.id,
      targetId: "node-101",
      sizeBytes: 10 * 1024 * 1024 * 1024,
      status: "succeeded",
      createdAt: new Date(now.getTime() - (7 + i) * 24 * 60 * 60 * 1000),
      integrityStatus: "valid",
    }));

    // Policy requires min 3 valid copies
    const plan = cleanup.generateCleanupPlan(samplePolicy, artifacts, now);

    expect(plan.protectedArtifacts.length).toBeGreaterThanOrEqual(3);
    expect(plan.candidatesForDeletion.length).toBe(2);
  });

  test("5. Safe retention cleanup protects latest valid backup unconditionally", () => {
    const now = new Date();
    // Only 1 backup exists, but it's 30 days old (past retention 7 days)
    const artifacts: BackupArtifact[] = [
      {
        id: "art-only-one",
        policyId: samplePolicy.id,
        targetId: "node-101",
        sizeBytes: 50 * 1024 * 1024 * 1024,
        status: "succeeded",
        createdAt: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000),
        integrityStatus: "valid",
      },
    ];

    const plan = cleanup.generateCleanupPlan(samplePolicy, artifacts, now);

    expect(plan.candidatesForDeletion).toHaveLength(0);
    expect(plan.protectedArtifacts).toHaveLength(1);
    expect(plan.protectedArtifacts[0].id).toBe("art-only-one");
  });

  test("6. Cleanup dry-run returns candidate list and reclaimable bytes", () => {
    const now = new Date();
    const artifacts: BackupArtifact[] = [
      { id: "a1", policyId: samplePolicy.id, targetId: "n1", sizeBytes: 1000, status: "succeeded", createdAt: now, integrityStatus: "valid" },
      { id: "a2", policyId: samplePolicy.id, targetId: "n1", sizeBytes: 1000, status: "succeeded", createdAt: now, integrityStatus: "valid" },
      { id: "a3", policyId: samplePolicy.id, targetId: "n1", sizeBytes: 1000, status: "succeeded", createdAt: now, integrityStatus: "valid" },
      { id: "a4", policyId: samplePolicy.id, targetId: "n1", sizeBytes: 5000, status: "succeeded", createdAt: new Date(now.getTime() - 15 * 24 * 60 * 60 * 1000), integrityStatus: "valid" },
    ];

    const plan = cleanup.generateCleanupPlan(samplePolicy, artifacts, now);

    expect(plan.candidatesForDeletion).toHaveLength(1);
    expect(plan.reclaimableBytes).toBe(5000);
  });
});
