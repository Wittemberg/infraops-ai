export enum AppEnv {
  DEVELOPMENT = "development",
  TEST = "test",
  STAGING = "staging",
  PRODUCTION = "production",
}

export enum NodeStatus {
  UNKNOWN = "unknown",
  ONLINE = "online",
  DEGRADED = "degraded",
  OFFLINE = "offline",
  MAINTENANCE = "maintenance",
  DISABLED = "disabled",
}

export enum RiskLevel {
  READ = "read",
  LOW = "low",
  MEDIUM = "medium",
  HIGH = "high",
  CRITICAL = "critical",
}

export enum JobState {
  REQUESTED = "requested",
  VALIDATING = "validating",
  PLANNED = "planned",
  AWAITING_APPROVAL = "awaiting_approval",
  QUEUED = "queued",
  DISPATCHED = "dispatched",
  RUNNING = "running",
  VALIDATING_RESULT = "validating_result",
  SUCCEEDED = "succeeded",
  FAILED = "failed",
  PARTIAL = "partial",
  CANCELLED = "cancelled",
  EXPIRED = "expired",
}
