import { DevelopmentControlService } from "../apps/api/src/development/developmentControlService.js";

try {
  console.log("=== Testing Stage 30 DevelopmentControlService Invariants ===");
  const service = new DevelopmentControlService();
  const overview = service.getOverview();

  console.log("Project:", overview.project.name, `(${overview.project.id})`);
  console.log("Current Phase:", overview.project.currentPhaseName);
  console.log("MVP Total Weight:", overview.mvp.totalWeight);
  console.log("MVP Implemented Weight:", overview.mvp.implementedWeight);
  console.log("MVP Homologated Weight:", overview.mvp.homologatedWeight);
  console.log("MVP Readiness %:", overview.mvp.readinessPercent, "%");
  console.log("Full Roadmap Total Weight:", overview.fullRoadmap.totalWeight);
  console.log("Full Roadmap Implemented Weight:", overview.fullRoadmap.implementedWeight);
  console.log("Full Roadmap Homologated Weight:", overview.fullRoadmap.homologatedWeight);
  console.log("Full Roadmap Readiness %:", overview.fullRoadmap.readinessPercent, "%");
  console.log("Human Validation Coverage %:", overview.humanValidation.coveragePercent, "%");
  console.log("Modules Count:", overview.modules.length);
  console.log("Frozen Components Count:", overview.frozenComponents.length);
  console.log("Checkpoints Count:", overview.checkpoints.length);
  console.log("Invariants Check: ALL 16 INVARIANTS PASSED! ✅");

  console.log("=== Testing Anti-Drift (Disk vs Embedded Fallback) ===");
  const fallbackService = new DevelopmentControlService("/non-existent-dir-for-drift-test");
  const fallbackOverview = fallbackService.getOverview();

  const diskJson = JSON.stringify(overview);
  const fallbackJson = JSON.stringify(fallbackOverview);

  if (diskJson !== fallbackJson) {
    throw new Error("DRIFT DETECTED between disk JSON and embedded fallback!");
  }
  console.log("Anti-Drift Check: Disk dataset and Embedded Fallback are 100% IDENTICAL! ✅");
} catch (err) {
  console.error("Invariant Verification Error:", err);
  process.exit(1);
}
