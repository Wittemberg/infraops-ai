export type BackupState =
  | "discovered"
  | "running"
  | "succeeded"
  | "failed"
  | "missing"
  | "expired"
  | "invalid"
  | "unknown";

export interface BackupArtifact {
  id: string;
  policyId: string;
  targetId: string;
  sizeBytes: number;
  status: "succeeded" | "failed";
  createdAt: Date;
  integrityStatus: "not_checked" | "valid" | "invalid";
}

export interface BackupPolicyConfig {
  id: string;
  expectedFrequencyHours: number;
  retentionDays: number;
  minValidCopies: number;
  sizeDeviationThresholdPercent: number; // e.g. 50%
}

export interface ExpectationEvaluationResult {
  state: BackupState;
  latestArtifact?: BackupArtifact;
  reason: string;
  alertType?: "backup_missing" | "backup_too_old" | "backup_failed" | "backup_size_anomaly";
}

export class BackupEngineService {
  public evaluateExpectations(
    policy: BackupPolicyConfig,
    artifacts: BackupArtifact[],
    now: Date = new Date()
  ): ExpectationEvaluationResult {
    if (artifacts.length === 0) {
      return {
        state: "missing",
        reason: "No backup artifacts found for policy",
        alertType: "backup_missing",
      };
    }

    // Sort by createdAt descending
    const sorted = [...artifacts].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    const latest = sorted[0];

    if (latest.status === "failed") {
      return {
        state: "failed",
        latestArtifact: latest,
        reason: "Latest backup execution failed",
        alertType: "backup_failed",
      };
    }

    const ageHours = (now.getTime() - latest.createdAt.getTime()) / (1000 * 60 * 60);

    if (ageHours > policy.expectedFrequencyHours) {
      return {
        state: "expired",
        latestArtifact: latest,
        reason: `Latest backup is ${ageHours.toFixed(1)}h old, exceeding expected frequency of ${policy.expectedFrequencyHours}h`,
        alertType: "backup_too_old",
      };
    }

    return {
      state: "succeeded",
      latestArtifact: latest,
      reason: "Backup expectation satisfied",
    };
  }

  public detectSizeAnomaly(
    currentSizeBytes: number,
    historyArtifacts: BackupArtifact[],
    maxDeviationPercent = 50
  ): { isAnomaly: boolean; medianSizeBytes: number; dropPercentage: number } {
    const validHistory = historyArtifacts.filter((a) => a.status === "succeeded" && a.sizeBytes > 0);

    if (validHistory.length === 0) {
      return { isAnomaly: false, medianSizeBytes: currentSizeBytes, dropPercentage: 0 };
    }

    const sizes = validHistory.map((a) => a.sizeBytes).sort((a, b) => a - b);
    const mid = Math.floor(sizes.length / 2);
    const medianSizeBytes = sizes.length % 2 !== 0 ? sizes[mid] : (sizes[mid - 1] + sizes[mid]) / 2;

    if (currentSizeBytes >= medianSizeBytes) {
      return { isAnomaly: false, medianSizeBytes, dropPercentage: 0 };
    }

    const dropPercentage = ((medianSizeBytes - currentSizeBytes) / medianSizeBytes) * 100;
    const isAnomaly = dropPercentage >= maxDeviationPercent;

    return {
      isAnomaly,
      medianSizeBytes,
      dropPercentage: Math.round(dropPercentage * 10) / 10,
    };
  }
}
