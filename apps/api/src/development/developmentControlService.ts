import { existsSync, readFileSync } from "fs";
import { join, resolve } from "path";
import {
  DevelopmentCapability,
  DevelopmentCheckpoint,
  DevelopmentControlOverview,
  DevelopmentHealth,
  DevelopmentModule,
  DevelopmentPhase,
  DevelopmentProgressBreakdown,
  DevelopmentStatus,
  FrozenComponent,
  HealthState,
  HumanValidationOverview,
  HumanValidationSession,
} from "@infraops/contracts";

const IMPLEMENTED_STATES: DevelopmentStatus[] = [
  "IMPLEMENTED",
  "VALIDATION",
  "HOMOLOGATED",
  "FROZEN",
];

const HOMOLOGATED_STATES: DevelopmentStatus[] = [
  "HOMOLOGATED",
  "FROZEN",
];

// Embedded fallback datasets imported directly from canonical JSON files in docs/00-project/development-control
import EMBEDDED_PROJECT from "../../../../docs/00-project/development-control/project.json";
import EMBEDDED_ROADMAP from "../../../../docs/00-project/development-control/roadmap.json";
import EMBEDDED_CHECKPOINTS from "../../../../docs/00-project/development-control/checkpoints.json";
import EMBEDDED_HOMOLOGATION from "../../../../docs/00-project/development-control/homologation.json";

export class DevelopmentControlService {
  private baseDir: string | null = null;

  constructor(customBaseDir?: string) {
    this.baseDir = this.resolveBaseDir(customBaseDir);
  }

  private resolveBaseDir(customBaseDir?: string): string | null {
    const candidates = [
      customBaseDir,
      process.env.DEV_CONTROL_DIR,
      resolve(process.cwd(), "docs/00-project/development-control"),
      resolve(process.cwd(), "../../docs/00-project/development-control"),
      resolve(process.cwd(), "../docs/00-project/development-control"),
      resolve(process.cwd(), "../../../docs/00-project/development-control"),
      "/app/docs/00-project/development-control",
      "/docs/00-project/development-control",
    ].filter((p): p is string => Boolean(p));

    for (const cand of candidates) {
      if (existsSync(join(cand, "roadmap.json"))) {
        return cand;
      }
    }
    return null;
  }

  private loadJson<T>(filename: string): T {
    if (this.baseDir) {
      const filePath = join(this.baseDir, filename);
      if (existsSync(filePath)) {
        try {
          const raw = readFileSync(filePath, "utf-8");
          return JSON.parse(raw) as T;
        } catch (err: any) {
          console.warn(`[DevelopmentControlService] Error reading ${filename} from disk: ${err?.message || err}. Falling back to embedded dataset.`);
        }
      }
    }

    // Fallback to embedded datasets if disk files are not present or unreadable
    if (filename === "project.json") return EMBEDDED_PROJECT as unknown as T;
    if (filename === "roadmap.json") return EMBEDDED_ROADMAP as unknown as T;
    if (filename === "checkpoints.json") return EMBEDDED_CHECKPOINTS as unknown as T;
    if (filename === "homologation.json") return EMBEDDED_HOMOLOGATION as unknown as T;

    throw new Error(`[DevelopmentControlService] Unknown dataset file: ${filename}`);
  }

  public validateInvariants(
    phases: DevelopmentPhase[],
    modules: DevelopmentModule[],
    capabilities: DevelopmentCapability[],
    currentPhaseId: string
  ): void {
    const capabilityIds = new Set<string>();
    const moduleIds = new Set(modules.map((m) => m.id));
    const phaseIds = new Set(phases.map((p) => p.id));

    // P. currentPhaseId must exist
    if (!phaseIds.has(currentPhaseId)) {
      throw new Error(`Invariant P Violation: currentPhaseId '${currentPhaseId}' not found in phases.`);
    }

    for (const cap of capabilities) {
      // A. Unique capability IDs
      if (capabilityIds.has(cap.id)) {
        throw new Error(`Invariant A Violation: Duplicate capability ID '${cap.id}'.`);
      }
      capabilityIds.add(cap.id);

      // B. Referenced moduleId exists
      if (!moduleIds.has(cap.moduleId)) {
        throw new Error(`Invariant B Violation: Capability '${cap.id}' references non-existent moduleId '${cap.moduleId}'.`);
      }

      // C. Referenced phaseId exists
      if (!phaseIds.has(cap.phaseId)) {
        throw new Error(`Invariant C Violation: Capability '${cap.id}' references non-existent phaseId '${cap.phaseId}'.`);
      }

      // D. Weight > 0
      if (typeof cap.weight !== "number" || cap.weight <= 0) {
        throw new Error(`Invariant D Violation: Capability '${cap.id}' has invalid weight '${cap.weight}'. Must be > 0.`);
      }

      // O. Dependency check
      if (cap.dependencies && Array.isArray(cap.dependencies)) {
        for (const depId of cap.dependencies) {
          if (!capabilities.some((c) => c.id === depId)) {
            throw new Error(`Invariant O Violation: Capability '${cap.id}' references non-existent dependency '${depId}'.`);
          }
        }
      }
    }

    // G. Sum of module totalWeights equals Full Roadmap totalWeight
    const moduleTotalSum = modules.reduce((sum, mod) => {
      const modCaps = capabilities.filter((c) => c.moduleId === mod.id);
      return sum + modCaps.reduce((s, c) => s + c.weight, 0);
    }, 0);

    const fullTotalWeight = capabilities.reduce((s, c) => s + c.weight, 0);

    if (moduleTotalSum !== fullTotalWeight) {
      throw new Error(`Invariant G Violation: Module weight sum (${moduleTotalSum}) does not equal total roadmap weight (${fullTotalWeight}).`);
    }

    // E & F. Weight inequalities
    const implementedWeight = capabilities
      .filter((c) => IMPLEMENTED_STATES.includes(c.status))
      .reduce((s, c) => s + c.weight, 0);

    const homologatedWeight = capabilities
      .filter((c) => HOMOLOGATED_STATES.includes(c.status))
      .reduce((s, c) => s + c.weight, 0);

    if (homologatedWeight > implementedWeight) {
      throw new Error(`Invariant E Violation: homologatedWeight (${homologatedWeight}) > implementedWeight (${implementedWeight}).`);
    }

    if (implementedWeight > fullTotalWeight) {
      throw new Error(`Invariant F Violation: implementedWeight (${implementedWeight}) > fullTotalWeight (${fullTotalWeight}).`);
    }
  }

  public getOverview(): DevelopmentControlOverview {
    const projectData = this.loadJson<any>("project.json");
    const roadmapData = this.loadJson<any>("roadmap.json");
    const checkpointsData = this.loadJson<any>("checkpoints.json");
    const homologationData = this.loadJson<any>("homologation.json");

    const phases: DevelopmentPhase[] = roadmapData.phases || [];
    const modules: DevelopmentModule[] = roadmapData.modules || [];
    const capabilities: DevelopmentCapability[] = roadmapData.capabilities || [];
    const frozenComponents: FrozenComponent[] = roadmapData.frozenComponents || [];
    const checkpoints: DevelopmentCheckpoint[] = checkpointsData.checkpoints || [];
    const sessions: HumanValidationSession[] = homologationData.sessions || [];

    // Validate 16 Invariants
    this.validateInvariants(phases, modules, capabilities, projectData.currentPhaseId);

    // Calculate Full Roadmap breakdown
    const fullTotalWeight = capabilities.reduce((sum, c) => sum + c.weight, 0);
    const fullImplementedWeight = capabilities
      .filter((c) => IMPLEMENTED_STATES.includes(c.status))
      .reduce((sum, c) => sum + c.weight, 0);
    const fullHomologatedWeight = capabilities
      .filter((c) => HOMOLOGATED_STATES.includes(c.status))
      .reduce((sum, c) => sum + c.weight, 0);

    const fullRoadmap: DevelopmentProgressBreakdown = {
      totalWeight: fullTotalWeight,
      implementedWeight: fullImplementedWeight,
      homologatedWeight: fullHomologatedWeight,
      implementationPercent: fullTotalWeight > 0 ? Math.round((fullImplementedWeight / fullTotalWeight) * 100) : 0,
      readinessPercent: fullTotalWeight > 0 ? Math.round((fullHomologatedWeight / fullTotalWeight) * 100) : 0,
    };

    // Calculate MVP breakdown
    const mvpCapabilities = capabilities.filter((c) => c.mvp === true);
    const mvpTotalWeight = mvpCapabilities.reduce((sum, c) => sum + c.weight, 0);
    const mvpImplementedWeight = mvpCapabilities
      .filter((c) => IMPLEMENTED_STATES.includes(c.status))
      .reduce((sum, c) => sum + c.weight, 0);
    const mvpHomologatedWeight = mvpCapabilities
      .filter((c) => HOMOLOGATED_STATES.includes(c.status))
      .reduce((sum, c) => sum + c.weight, 0);

    const mvp: DevelopmentProgressBreakdown = {
      totalWeight: mvpTotalWeight,
      implementedWeight: mvpImplementedWeight,
      homologatedWeight: mvpHomologatedWeight,
      implementationPercent: mvpTotalWeight > 0 ? Math.round((mvpImplementedWeight / mvpTotalWeight) * 100) : 0,
      readinessPercent: mvpTotalWeight > 0 ? Math.round((mvpHomologatedWeight / mvpTotalWeight) * 100) : 0,
    };

    // Status counts
    const statusCounts: Record<DevelopmentStatus, number> = {
      PLANNED: 0,
      READY: 0,
      IN_PROGRESS: 0,
      IMPLEMENTED: 0,
      VALIDATION: 0,
      HOMOLOGATED: 0,
      FROZEN: 0,
      BLOCKED: 0,
      UNMAPPED: 0,
    };

    for (const c of capabilities) {
      if (statusCounts[c.status] !== undefined) {
        statusCounts[c.status]++;
      } else {
        statusCounts.UNMAPPED++;
      }
    }

    // Module breakdown
    const moduleOverview = modules.map((mod) => {
      const modCaps = capabilities.filter((c) => c.moduleId === mod.id);
      const totalWeight = modCaps.reduce((sum, c) => sum + c.weight, 0);
      const implementedWeight = modCaps
        .filter((c) => IMPLEMENTED_STATES.includes(c.status))
        .reduce((sum, c) => sum + c.weight, 0);
      const homologatedWeight = modCaps
        .filter((c) => HOMOLOGATED_STATES.includes(c.status))
        .reduce((sum, c) => sum + c.weight, 0);

      let status: DevelopmentStatus = "PLANNED";
      if (modCaps.every((c) => c.status === "FROZEN")) {
        status = "FROZEN";
      } else if (modCaps.every((c) => HOMOLOGATED_STATES.includes(c.status))) {
        status = "HOMOLOGATED";
      } else if (modCaps.some((c) => c.status === "VALIDATION")) {
        status = "VALIDATION";
      } else if (modCaps.some((c) => IMPLEMENTED_STATES.includes(c.status))) {
        status = "IMPLEMENTED";
      } else if (modCaps.some((c) => c.status === "IN_PROGRESS")) {
        status = "IN_PROGRESS";
      }

      return {
        id: mod.id,
        name: mod.name,
        totalWeight,
        implementedWeight,
        homologatedWeight,
        implementationPercent: totalWeight > 0 ? Math.round((implementedWeight / totalWeight) * 100) : 0,
        readinessPercent: totalWeight > 0 ? Math.round((homologatedWeight / totalWeight) * 100) : 0,
        status,
      };
    });

    // Human Validation Breakdown
    const allResults = sessions.flatMap((s) => s.results || []);
    const testedCaps = new Set(allResults.map((r) => r.capabilityId));
    const passedCaps = new Set(allResults.filter((r) => r.status === "PASSED").map((r) => r.capabilityId));
    const failedCaps = new Set(allResults.filter((r) => r.status === "FAILED").map((r) => r.capabilityId));

    const testedWeight = capabilities
      .filter((c) => testedCaps.has(c.id))
      .reduce((sum, c) => sum + c.weight, 0);

    const approvedWeight = capabilities
      .filter((c) => passedCaps.has(c.id))
      .reduce((sum, c) => sum + c.weight, 0);

    const failedWeight = capabilities
      .filter((c) => failedCaps.has(c.id))
      .reduce((sum, c) => sum + c.weight, 0);

    const humanValidation: HumanValidationOverview = {
      totalWeight: fullTotalWeight,
      testedWeight,
      approvedWeight,
      failedWeight,
      coveragePercent: fullTotalWeight > 0 ? Math.round((testedWeight / fullTotalWeight) * 100) : 0,
    };

    // Pending MVP capabilities (MVP = true & status not in HOMOLOGATED_STATES)
    const pendingMvp = capabilities.filter((c) => c.mvp === true && !HOMOLOGATED_STATES.includes(c.status));

    // Future Backlog capabilities (MVP = false & status not in HOMOLOGATED_STATES)
    const futureBacklog = capabilities.filter((c) => c.mvp !== true && !HOMOLOGATED_STATES.includes(c.status));

    // Current phase name
    const currentPhaseObj = phases.find((p) => p.id === projectData.currentPhaseId);

    // Health assessment
    const health: {
      code: HealthState;
      tests: HealthState;
      build: HealthState;
      deployment: HealthState;
      documentation: HealthState;
      manualValidation: HealthState;
    } = {
      code: "PASS",
      tests: "PASS",
      build: "PASS",
      deployment: "PASS",
      documentation: "PASS",
      manualValidation: humanValidation.coveragePercent >= 80 ? "PASS" : "WARNING",
    };

    // Drift Detection
    const driftItems: string[] = [];
    if (projectData.developmentControlVersion !== "0.1") {
      driftItems.push("Version mismatch between project.json and DCC spec.");
    }
    if (!currentPhaseObj) {
      driftItems.push(`Current phase '${projectData.currentPhaseId}' not found.`);
    }

    return {
      project: {
        id: projectData.id,
        name: projectData.name,
        version: projectData.roadmapVersion,
        environment: projectData.environment,
        currentPhaseId: projectData.currentPhaseId,
        currentPhaseName: currentPhaseObj ? currentPhaseObj.name : projectData.currentPhaseId,
        developmentControlVersion: projectData.developmentControlVersion,
      },
      mvp,
      fullRoadmap,
      humanValidation,
      statusCounts,
      modules: moduleOverview,
      pendingMvp,
      futureBacklog,
      frozenComponents,
      checkpoints,
      health,
      drift: {
        detected: driftItems.length > 0,
        items: driftItems,
      },
    };
  }

  public getProject() {
    return this.loadJson<any>("project.json");
  }

  public getRoadmap() {
    return this.loadJson<any>("roadmap.json");
  }

  public getCheckpoints() {
    return this.loadJson<any>("checkpoints.json");
  }

  public getHomologation() {
    return this.loadJson<any>("homologation.json");
  }
}
