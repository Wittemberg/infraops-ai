import { NodeStatus, RiskLevel, JobState } from "@infraops/shared";

export interface TenantModel {
  id: string;
  name: string;
  slug: string;
  status: "active" | "suspended" | "archived";
  timezone: string;
  createdAt: string;
  updatedAt: string;
}

export interface UserModel {
  id: string;
  email: string;
  name: string;
  passwordHash?: string;
  externalSubject?: string;
  status: "active" | "inactive" | "suspended";
  lastLoginAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface NodeModel {
  id: string;
  tenantId: string;
  siteId?: string;
  name: string;
  hostname: string;
  type: "linux" | "proxmox" | "virtualizor";
  status: NodeStatus;
  agentStatus: "online" | "offline" | "enrolling";
  criticality: RiskLevel;
  lastSeenAt?: string;
  maintenanceUntil?: string;
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface WorkloadModel {
  id: string;
  tenantId: string;
  nodeId: string;
  externalId: string;
  type: "vm" | "container" | "vps";
  name: string;
  status: "running" | "stopped" | "paused" | "unknown";
  criticality: RiskLevel;
  cpuAllocated: number;
  memoryBytes: number;
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface StorageModel {
  id: string;
  tenantId: string;
  nodeId: string;
  externalId: string;
  name: string;
  type: "filesystem" | "pool" | "datastore" | "remote";
  totalBytes: number;
  usedBytes: number;
  availableBytes: number;
  status: "healthy" | "degraded" | "full" | "unknown";
  metadata: Record<string, unknown>;
  lastObservedAt: string;
}

export interface JobModel {
  id: string;
  tenantId: string;
  nodeId: string;
  actionDefinitionId: string;
  requestedByActorType: "user" | "ai" | "agent" | "system";
  requestedByActorId: string;
  idempotencyKey: string;
  status: JobState;
  parameters: Record<string, unknown>;
  plan?: Record<string, unknown>;
  result?: Record<string, unknown>;
  risk: RiskLevel;
  requiresApproval: boolean;
  requestedAt: string;
  startedAt?: string;
  finishedAt?: string;
  expiresAt?: string;
  traceId?: string;
}

export interface AuditEventModel {
  id: string;
  tenantId: string;
  occurredAt: string;
  actorType: "user" | "ai" | "agent" | "system";
  actorId: string;
  userId?: string;
  nodeId?: string;
  jobId?: string;
  eventType: string;
  actionKey?: string;
  requestId?: string;
  traceId?: string;
  payload: Record<string, unknown>;
  previousHash?: string;
  eventHash: string;
}
