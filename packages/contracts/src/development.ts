export type DevelopmentStatus =
  | "PLANNED"
  | "READY"
  | "IN_PROGRESS"
  | "IMPLEMENTED"
  | "VALIDATION"
  | "HOMOLOGATED"
  | "FROZEN"
  | "BLOCKED"
  | "UNMAPPED";

export type HealthState = "PASS" | "WARNING" | "FAIL" | "UNKNOWN";

export interface DevelopmentCapability {
  id: string;
  moduleId: string;
  phaseId: string;
  name: string;
  description: string;
  weight: number;
  status: DevelopmentStatus;
  mvp: boolean;
  priority?: "P0" | "P1" | "P2" | "P3";
  checkpoint?: string;
  notes?: string[];
  dependencies?: string[];
  humanTestId?: string;
}

export interface DevelopmentModule {
  id: string;
  name: string;
  description?: string;
  order: number;
}

export interface DevelopmentPhase {
  id: string;
  name: string;
  description?: string;
  order: number;
  status: DevelopmentStatus;
}

export interface FrozenComponent {
  id: string;
  name: string;
  description: string;
  frozenAt: string;
  checkpoint?: string;
  reason: string;
  protectedPaths?: string[];
}

export interface DevelopmentCheckpoint {
  sha: string;
  shortSha: string;
  date: string;
  title: string;
  description?: string;
  phaseId?: string;
  patch?: string;
  type: "FEATURE" | "FIX" | "HARDENING" | "RELEASE" | "CHECKPOINT";
}

export interface HumanTestResult {
  testId: string;
  name: string;
  capabilityId: string;
  status: "PASSED" | "FAILED" | "PENDING";
  testedAt?: string;
  testedBy?: string;
  notes?: string;
}

export interface HumanValidationSession {
  sessionId: string;
  date: string;
  environment: string;
  evaluator: string;
  results: HumanTestResult[];
}

export interface HumanValidationOverview {
  totalWeight: number;
  testedWeight: number;
  approvedWeight: number;
  failedWeight: number;
  coveragePercent: number;
}

export interface DevelopmentProgressBreakdown {
  totalWeight: number;
  implementedWeight: number;
  homologatedWeight: number;
  implementationPercent: number;
  readinessPercent: number;
}

export interface DevelopmentControlOverview {
  project: {
    id: string;
    name: string;
    version: string;
    environment: string;
    currentPhaseId: string;
    currentPhaseName: string;
    developmentControlVersion: string;
  };
  mvp: DevelopmentProgressBreakdown;
  fullRoadmap: DevelopmentProgressBreakdown;
  humanValidation: HumanValidationOverview;
  statusCounts: Record<DevelopmentStatus, number>;
  modules: Array<{
    id: string;
    name: string;
    totalWeight: number;
    implementedWeight: number;
    homologatedWeight: number;
    implementationPercent: number;
    readinessPercent: number;
    status: DevelopmentStatus;
  }>;
  pendingMvp: DevelopmentCapability[];
  futureBacklog: DevelopmentCapability[];
  frozenComponents: FrozenComponent[];
  checkpoints: DevelopmentCheckpoint[];
  health: {
    code: HealthState;
    tests: HealthState;
    build: HealthState;
    deployment: HealthState;
    documentation: HealthState;
    manualValidation: HealthState;
  };
  drift: {
    detected: boolean;
    items: string[];
  };
}
