import { BackupArtifact, BackupPolicyConfig } from "./backup_engine.service.js";

export interface CleanupPlanItem {
  artifact: BackupArtifact;
  reason: string;
}

export interface CleanupPlanReport {
  candidatesForDeletion: CleanupPlanItem[];
  protectedArtifacts: BackupArtifact[];
  reclaimableBytes: number;
  totalArtifactsAnalyzed: number;
}

export class BackupCleanupService {
  public generateCleanupPlan(
    policy: BackupPolicyConfig,
    artifacts: BackupArtifact[],
    now: Date = new Date()
  ): CleanupPlanReport {
    if (artifacts.length === 0) {
      return {
        candidatesForDeletion: [],
        protectedArtifacts: [],
        reclaimableBytes: 0,
        totalArtifactsAnalyzed: 0,
      };
    }

    // Sort by createdAt descending (newest first)
    const sorted = [...artifacts].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    const retentionCutoffMs = now.getTime() - policy.retentionDays * 24 * 60 * 60 * 1000;

    const protectedList: BackupArtifact[] = [];
    const candidateItems: CleanupPlanItem[] = [];

    // Protection Rule #1: Unconditionally protect the latest valid backup
    const latestValidIndex = sorted.findIndex((a) => a.status === "succeeded");

    sorted.forEach((artifact, index) => {
      // Latest valid backup is protected
      if (index === latestValidIndex) {
        protectedList.push(artifact);
        return;
      }

      // Check retention age
      const isOlderThanRetention = artifact.createdAt.getTime() < retentionCutoffMs;

      if (!isOlderThanRetention) {
        protectedList.push(artifact);
        return;
      }

      // Protection Rule #2: Ensure minValidCopies count is satisfied
      const validProtectedCount = protectedList.filter((a) => a.status === "succeeded").length;
      const remainingValidCandidates = sorted.slice(index).filter((a) => a.status === "succeeded").length;

      if (validProtectedCount + remainingValidCandidates <= policy.minValidCopies && artifact.status === "succeeded") {
        protectedList.push(artifact);
        return;
      }

      candidateItems.push({
        artifact,
        reason: `Artifact age exceeds retention policy of ${policy.retentionDays} days`,
      });
    });

    const reclaimableBytes = candidateItems.reduce((acc, item) => acc + item.artifact.sizeBytes, 0);

    return {
      candidatesForDeletion: candidateItems,
      protectedArtifacts: protectedList,
      reclaimableBytes,
      totalArtifactsAnalyzed: artifacts.length,
    };
  }
}
