import { AppError } from "@infraops/shared";

export type LockType = "shared" | "exclusive";

export interface LockEntry {
  id: string;
  resourceKey: string;
  lockType: LockType;
  jobId: string;
  acquiredAt: Date;
  expiresAt: Date;
}

export class ResourceLockService {
  private locks: Map<string, LockEntry> = new Map();

  public acquireLock(resourceKey: string, lockType: LockType, jobId: string, ttlSeconds = 300): LockEntry {
    this.cleanOrphanedLocks();

    const now = new Date();
    const existingLocks = Array.from(this.locks.values()).filter((l) => l.resourceKey === resourceKey && l.expiresAt > now);

    for (const lock of existingLocks) {
      if (lock.jobId === jobId) continue;

      // Exclusive lock blocks any other lock
      if (lock.lockType === "exclusive" || lockType === "exclusive") {
        throw new AppError(
          "RESOURCE_LOCKED",
          `Resource '${resourceKey}' is locked by job '${lock.jobId}' (${lock.lockType} lock). Lock conflict for job '${jobId}' (${lockType}).`,
          409
        );
      }
    }

    const lockId = `lock-${Math.random().toString(36).substring(2, 10)}`;
    const entry: LockEntry = {
      id: lockId,
      resourceKey,
      lockType,
      jobId,
      acquiredAt: now,
      expiresAt: new Date(now.getTime() + ttlSeconds * 1000),
    };

    this.locks.set(lockId, entry);
    return entry;
  }

  public releaseLock(jobId: string): void {
    for (const [id, lock] of this.locks.entries()) {
      if (lock.jobId === jobId) {
        this.locks.delete(id);
      }
    }
  }

  public cleanOrphanedLocks(now: Date = new Date()): number {
    let cleaned = 0;
    for (const [id, lock] of this.locks.entries()) {
      if (now > lock.expiresAt) {
        this.locks.delete(id);
        cleaned++;
      }
    }
    return cleaned;
  }
}
