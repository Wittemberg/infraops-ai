import { AgentJobPayload, ClaimJobsRequest, ClaimJobsResponse, JobStatusUpdateRequest, JobStatusUpdateResponse } from "@infraops/contracts";
import { AppError } from "@infraops/shared";
import { registeredAgents } from "./agent.controller.js";

export interface PendingJobStore {
  jobId: string;
  tenantId: string;
  nodeId: string;
  idempotencyKey: string;
  action: string;
  actionVersion: string;
  parameters: Record<string, unknown>;
  timeoutSeconds: number;
  status: string;
  progressPercent?: number;
  phase?: string;
  message?: string;
  result?: Record<string, unknown>;
  resultDigest?: string;
  largeOutputS3Key?: string;
  issuedAt: Date;
  expiresAt: Date;
}

export const pendingJobs: Map<string, PendingJobStore> = new Map();

export function createPendingJob(job: Omit<PendingJobStore, "status" | "issuedAt">): PendingJobStore {
  const store: PendingJobStore = {
    ...job,
    status: "queued",
    issuedAt: new Date(),
  };

  pendingJobs.set(job.jobId, store);
  return store;
}

export function handleClaimJobs(agentId: string, agentToken: string, payload: ClaimJobsRequest): ClaimJobsResponse {
  const agent = registeredAgents.get(agentId);

  if (!agent) {
    throw new AppError("AGENT_NOT_FOUND", "Agent not registered", 404);
  }

  if (agent.status === "revoked") {
    throw new AppError("AGENT_REVOKED", "Agent is revoked", 403);
  }

  if (agent.agentToken !== agentToken) {
    throw new AppError("UNAUTHORIZED_AGENT", "Invalid agent authorization token", 401);
  }

  const now = new Date();
  const matchedJobs: AgentJobPayload[] = [];
  const maxJobs = payload.maxJobs || 1;

  for (const job of pendingJobs.values()) {
    if (matchedJobs.length >= maxJobs) break;

    // Strict Node & Tenant Isolation: Agent X can ONLY claim jobs matching its registered nodeId
    if (job.nodeId !== agent.nodeId || job.tenantId !== agent.tenantId) {
      continue;
    }

    // Skip expired jobs
    if (now > job.expiresAt) {
      job.status = "expired";
      continue;
    }

    // Only claim queued jobs
    if (job.status === "queued") {
      job.status = "dispatched";

      matchedJobs.push({
        jobId: job.jobId,
        nodeId: job.nodeId,
        tenantId: job.tenantId,
        idempotencyKey: job.idempotencyKey,
        action: job.action,
        actionVersion: job.actionVersion,
        parameters: job.parameters,
        timeoutSeconds: job.timeoutSeconds,
        issuedAt: job.issuedAt.toISOString(),
        expiresAt: job.expiresAt.toISOString(),
      });
    }
  }

  return { jobs: matchedJobs };
}

export function handleJobStatusUpdate(jobId: string, agentId: string, agentToken: string, payload: JobStatusUpdateRequest): JobStatusUpdateResponse {
  const agent = registeredAgents.get(agentId);

  if (!agent || agent.status === "revoked" || agent.agentToken !== agentToken) {
    throw new AppError("UNAUTHORIZED_AGENT", "Unauthorized agent request", 401);
  }

  const job = pendingJobs.get(jobId);

  if (!job) {
    throw new AppError("JOB_NOT_FOUND", "Job not found", 404);
  }

  // Ensure Agent X cannot update status of job for Node Y
  if (job.nodeId !== agent.nodeId) {
    throw new AppError("JOB_ACCESS_DENIED", "Agent forbidden from updating jobs of another node", 403);
  }

  job.status = payload.status;
  if (payload.progressPercent !== undefined) job.progressPercent = payload.progressPercent;
  if (payload.phase) job.phase = payload.phase;
  if (payload.message) job.message = payload.message;
  if (payload.resultDigest) job.resultDigest = payload.resultDigest;

  // Offload large results (> 10 KB) to Object Storage to prevent bloating PostgreSQL
  if (payload.result) {
    const jsonStr = JSON.stringify(payload.result);
    if (jsonStr.length > 10 * 1024) {
      const s3Key = `artifacts/${job.tenantId}/${job.jobId}_result.json`;
      job.largeOutputS3Key = s3Key;
      job.result = { _offloaded: true, s3Key, digest: payload.resultDigest };
    } else {
      job.result = payload.result;
    }
  }

  return {
    jobId,
    acknowledged: true,
    cancelRequested: false,
  };
}
