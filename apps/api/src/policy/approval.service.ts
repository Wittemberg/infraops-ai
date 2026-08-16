import { AppError } from "@infraops/shared";
import { ResourceLockService, LockType } from "./resource_lock.service.js";

export interface ApprovalRecord {
  id: string;
  jobId: string;
  tenantId: string;
  requestedByActorId: string;
  actionKey: string;
  targetId: string;
  parameters: Record<string, unknown>;
  planSummary: string;
  risk: string;
  status: "pending" | "approved" | "rejected" | "expired";
  requestedAt: Date;
  expiresAt: Date;
  decidedAt?: Date;
  decidedByUserId?: string;
  decisionReason?: string;
}

export class ApprovalService {
  private approvals: Map<string, ApprovalRecord> = new Map();

  public createApproval(request: {
    jobId: string;
    tenantId: string;
    requestedByActorId: string;
    actionKey: string;
    targetId: string;
    parameters: Record<string, unknown>;
    planSummary: string;
    risk: string;
    ttlMinutes?: number;
  }): ApprovalRecord {
    const ttl = request.ttlMinutes || 60;
    const now = new Date();

    const record: ApprovalRecord = {
      id: `appr-${Math.random().toString(36).substring(2, 10)}`,
      jobId: request.jobId,
      tenantId: request.tenantId,
      requestedByActorId: request.requestedByActorId,
      actionKey: request.actionKey,
      targetId: request.targetId,
      parameters: request.parameters,
      planSummary: request.planSummary,
      risk: request.risk,
      status: "pending",
      requestedAt: now,
      expiresAt: new Date(now.getTime() + ttl * 60 * 1000),
    };

    this.approvals.set(record.id, record);
    return record;
  }

  public decideApproval(
    approvalId: string,
    decidingUserId: string,
    decision: "approved" | "rejected",
    reason: string,
    now: Date = new Date()
  ): ApprovalRecord {
    const approval = this.approvals.get(approvalId);

    if (!approval) {
      throw new AppError("APPROVAL_NOT_FOUND", "Approval request not found", 404);
    }

    if (approval.status !== "pending") {
      throw new AppError("APPROVAL_ALREADY_DECIDED", `Approval request is already ${approval.status}`, 400);
    }

    if (now > approval.expiresAt) {
      approval.status = "expired";
      throw new AppError("APPROVAL_EXPIRED", "Approval request has expired", 400);
    }

    // Anti-Self-Approval Defense
    if (approval.requestedByActorId === decidingUserId) {
      throw new AppError("SELF_APPROVAL_FORBIDDEN", "Self-approval is forbidden: The job requester cannot approve their own high-risk job", 403);
    }

    approval.status = decision;
    approval.decidedAt = now;
    approval.decidedByUserId = decidingUserId;
    approval.decisionReason = reason;

    return approval;
  }

  // TOCTOU (Time-of-Check to Time-of-Use) Revalidation before job dispatch
  public revalidateBeforeExecution(
    approvalId: string,
    lockService: ResourceLockService,
    resourceKey: string,
    lockType: LockType
  ): void {
    const approval = this.approvals.get(approvalId);

    if (!approval || approval.status !== "approved") {
      throw new AppError("TOCTOU_VALIDATION_FAILED", "Job approval is invalid or not approved", 400);
    }

    // Revalidate Lock
    lockService.acquireLock(resourceKey, lockType, approval.jobId);
  }

  public getApproval(approvalId: string): ApprovalRecord | undefined {
    return this.approvals.get(approvalId);
  }
}
