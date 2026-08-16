export interface ClaimJobsRequest {
  agentId: string;
  maxJobs?: number;
  capabilities: string[];
}

export interface AgentJobPayload {
  jobId: string;
  nodeId: string;
  tenantId: string;
  idempotencyKey: string;
  action: string;
  actionVersion: string;
  parameters: Record<string, unknown>;
  timeoutSeconds: number;
  issuedAt: string;
  expiresAt: string;
}

export interface ClaimJobsResponse {
  jobs: AgentJobPayload[];
}

export interface JobStatusUpdateRequest {
  jobId: string;
  agentId: string;
  status: "accepted" | "running" | "progress" | "succeeded" | "failed" | "cancelled";
  progressPercent?: number;
  phase?: string;
  message?: string;
  result?: Record<string, unknown>;
  resultDigest?: string;
  largeOutputS3Key?: string;
}

export interface JobStatusUpdateResponse {
  jobId: string;
  acknowledged: boolean;
  cancelRequested: boolean;
}
