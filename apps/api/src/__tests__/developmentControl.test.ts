import { DevelopmentControlService } from "../development/developmentControlService";

describe("DevelopmentControlService (Stage 30)", () => {
  let service: DevelopmentControlService;

  beforeEach(() => {
    service = new DevelopmentControlService();
  });

  test("should successfully load overview and calculate metrics", () => {
    const overview = service.getOverview();

    expect(overview.project).toBeDefined();
    expect(overview.project.id).toBe("infraops-ai");
    expect(overview.project.currentPhaseId).toBe("phase-30");

    expect(overview.fullRoadmap).toBeDefined();
    expect(overview.fullRoadmap.totalWeight).toBeGreaterThan(0);
    expect(overview.fullRoadmap.implementedWeight).toBeGreaterThanOrEqual(overview.fullRoadmap.homologatedWeight);
    expect(overview.fullRoadmap.totalWeight).toBeGreaterThanOrEqual(overview.fullRoadmap.implementedWeight);

    expect(overview.fullRoadmap.implementationPercent).toBeGreaterThanOrEqual(0);
    expect(overview.fullRoadmap.implementationPercent).toBeLessThanOrEqual(100);
    expect(overview.fullRoadmap.readinessPercent).toBeGreaterThanOrEqual(0);
    expect(overview.fullRoadmap.readinessPercent).toBeLessThanOrEqual(100);
  });

  test("should correctly calculate MVP metrics", () => {
    const overview = service.getOverview();

    expect(overview.mvp).toBeDefined();
    expect(overview.mvp.totalWeight).toBeGreaterThan(0);
    expect(overview.mvp.implementedWeight).toBeGreaterThanOrEqual(overview.mvp.homologatedWeight);
    expect(overview.mvp.totalWeight).toBeGreaterThanOrEqual(overview.mvp.implementedWeight);

    expect(overview.mvp.implementationPercent).toBeGreaterThanOrEqual(0);
    expect(overview.mvp.implementationPercent).toBeLessThanOrEqual(100);
  });

  test("should verify that module weight sum equals full roadmap total weight", () => {
    const overview = service.getOverview();

    const moduleTotalSum = overview.modules.reduce((sum, mod) => sum + mod.totalWeight, 0);
    expect(moduleTotalSum).toBe(overview.fullRoadmap.totalWeight);
  });

  test("should contain human validation metrics", () => {
    const overview = service.getOverview();

    expect(overview.humanValidation).toBeDefined();
    expect(overview.humanValidation.totalWeight).toBe(overview.fullRoadmap.totalWeight);
    expect(overview.humanValidation.coveragePercent).toBeGreaterThanOrEqual(0);
    expect(overview.humanValidation.coveragePercent).toBeLessThanOrEqual(100);
  });

  test("should throw an error if invariant P (invalid currentPhaseId) is violated", () => {
    const invalidPhases: any[] = [{ id: "phase-1", name: "P1", order: 1, status: "PLANNED" }];
    const invalidModules: any[] = [{ id: "mod-1", name: "M1", order: 1 }];
    const invalidCapabilities: any[] = [];

    expect(() => {
      service.validateInvariants(invalidPhases, invalidModules, invalidCapabilities, "non-existent-phase");
    }).toThrow("Invariant P Violation");
  });

  test("should throw an error if invariant A (duplicate capability id) is violated", () => {
    const phases: any[] = [{ id: "phase-1", name: "P1", order: 1, status: "PLANNED" }];
    const modules: any[] = [{ id: "mod-1", name: "M1", order: 1 }];
    const capabilities: any[] = [
      { id: "cap-dup", moduleId: "mod-1", phaseId: "phase-1", name: "C1", description: "D", weight: 10, status: "PLANNED", mvp: true },
      { id: "cap-dup", moduleId: "mod-1", phaseId: "phase-1", name: "C2", description: "D", weight: 10, status: "PLANNED", mvp: true },
    ];

    expect(() => {
      service.validateInvariants(phases, modules, capabilities, "phase-1");
    }).toThrow("Invariant A Violation");
  });

  test("should load roadmap, checkpoints and homologation files", () => {
    const roadmap = service.getRoadmap();
    expect(roadmap.phases).toBeDefined();
    expect(roadmap.capabilities).toBeDefined();
    expect(roadmap.frozenComponents).toBeDefined();

    const checkpoints = service.getCheckpoints();
    expect(checkpoints.checkpoints).toBeDefined();

    const homologation = service.getHomologation();
    expect(homologation.sessions).toBeDefined();
  });
});
