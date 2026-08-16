import { ActionRegistryService } from "../action_registry.service.js";

describe("Stage 08 - Action Framework & Security Acceptance Tests", () => {
  let service: ActionRegistryService;

  beforeEach(() => {
    service = new ActionRegistryService();
  });

  test("1. Unknown or unregistered actions are strictly rejected", () => {
    expect(() => service.getActionDefinition("system.custom_shell", "1.0.0")).toThrow("Action 'system.custom_shell:1.0.0' is not registered in the system catalog");
  });

  test("2. Shell injection payloads are detected and blocked", () => {
    const maliciousParams = {
      serviceName: "nginx; cat /etc/passwd",
    };

    expect(() => service.validateActionParameters("service.restart", "1.0.0", maliciousParams)).toThrow("Forbidden character/pattern ';' detected");
  });

  test("3. backup.cleanup rejects arbitrary file path parameters", () => {
    const invalidParams = {
      policyId: "pol-123",
      olderThanDays: 7,
      minimumCopies: 2,
      path: "/var/data/raw", // Arbitrary path!
    };

    expect(() => service.validateActionParameters("backup.cleanup", "1.0.0", invalidParams)).toThrow("Action 'backup.cleanup' does not accept arbitrary path parameters");
  });

  test("4. Valid action parameters pass validation", () => {
    const validParams = {
      serviceName: "postgresql",
    };

    expect(() => service.validateActionParameters("service.restart", "1.0.0", validParams)).not.toThrow();
  });
});
