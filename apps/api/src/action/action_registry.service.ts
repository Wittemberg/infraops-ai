import { MVP_ACTION_DEFINITIONS, ActionDefinition } from "@infraops/action-schema";
import { AppError } from "@infraops/shared";

const DANGEROUS_SHELL_PATTERNS = [
  ";",
  "&&",
  "||",
  "|",
  "`",
  "$(",
  ">",
  "<",
  "rm -",
  "eval",
  "exec",
];

export class ActionRegistryService {
  public getActionDefinition(key: string, version = "1.0.0"): ActionDefinition {
    const id = `${key}:${version}`;
    const def = MVP_ACTION_DEFINITIONS[id];

    if (!def) {
      throw new AppError("UNKNOWN_ACTION", `Action '${id}' is not registered in the system catalog. Arbitrary command execution is strictly forbidden.`, 400);
    }

    return def;
  }

  public validateActionParameters(key: string, version: string, params: Record<string, unknown>): void {
    const def = this.getActionDefinition(key, version);

    // 1. Check for shell injection patterns in string values
    this.checkForShellInjection(params);

    // 2. Action specific validations
    if (key === "backup.cleanup" && "path" in params) {
      throw new AppError("INVALID_ACTION_PARAM", "Action 'backup.cleanup' does not accept arbitrary path parameters", 400);
    }

    if (key === "service.restart") {
      const serviceName = params.serviceName;
      if (typeof serviceName !== "string" || !/^[a-zA-Z0-9_-]+$/.test(serviceName)) {
        throw new AppError("INVALID_SERVICE_NAME", "Parameter 'serviceName' contains invalid or dangerous characters", 400);
      }
    }
  }

  private checkForShellInjection(obj: unknown): void {
    if (typeof obj === "string") {
      for (const pattern of DANGEROUS_SHELL_PATTERNS) {
        if (obj.includes(pattern)) {
          throw new AppError("SHELL_INJECTION_DETECTED", `Forbidden character/pattern '${pattern}' detected in parameters`, 400);
        }
      }
    } else if (typeof obj === "object" && obj !== null) {
      for (const val of Object.values(obj as Record<string, unknown>)) {
        this.checkForShellInjection(val);
      }
    }
  }
}
