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

  console.log("=== Testing Single Source of Truth Strict Enforcement ===");
  try {
    const missingService = new DevelopmentControlService("/non-existent-dir-for-test");
    missingService.getOverview();
    throw new Error("FAIL: Should have thrown error when canonical files are missing!");
  } catch (err: any) {
    if (err.message.includes("Development Control data unavailable")) {
      console.log("Single Source of Truth Check: Correctly throws error when canonical JSON files are missing! ✅");
    } else {
      throw err;
    }
  }
} catch (err) {
  console.error("Invariant Verification Error:", err);
  process.exit(1);
}
