import { RiskLevel, Permission } from "@infraops/shared";

export type LockStrategy = "none" | "shared" | "exclusive";
export type ApprovalPolicy = "none" | "default" | "always";

export interface ActionDefinition {
  key: string;
  version: string;
  name: string;
  description: string;
  risk: RiskLevel;
  parameterSchema: Record<string, unknown>;
  requiredPermissions: Permission[];
  supportsDryRun: boolean;
  supportsCancel: boolean;
  timeoutSeconds: number;
  lockStrategy: LockStrategy;
  approvalPolicy: ApprovalPolicy;
  requiredCapabilities: string[];
}

export const MVP_ACTION_DEFINITIONS: Record<string, ActionDefinition> = {
  "node.health:1.0.0": {
    key: "node.health",
    version: "1.0.0",
    name: "Node Health Diagnostic",
    description: "Returns uptime, load, memory, disk usage, and failed systemd units",
    risk: RiskLevel.READ,
    parameterSchema: { type: "object", properties: {} },
    requiredPermissions: [Permission.NODE_READ],
    supportsDryRun: false,
    supportsCancel: false,
    timeoutSeconds: 30,
    lockStrategy: "none",
    approvalPolicy: "none",
    requiredCapabilities: ["node.health:v1"],
  },
  "node.inventory:1.0.0": {
    key: "node.inventory",
    version: "1.0.0",
    name: "Node Hardware & Software Inventory",
    description: "Collects system hardware, CPU, RAM, network interfaces, and OS packages",
    risk: RiskLevel.READ,
    parameterSchema: { type: "object", properties: {} },
    requiredPermissions: [Permission.NODE_READ],
    supportsDryRun: false,
    supportsCancel: false,
    timeoutSeconds: 60,
    lockStrategy: "none",
    approvalPolicy: "none",
    requiredCapabilities: ["node.inventory:v1"],
  },
  "system.apt_update:1.0.0": {
    key: "system.apt_update",
    version: "1.0.0",
    name: "Update Package Index (apt-get update)",
    description: "Updates package repository index without upgrading packages",
    risk: RiskLevel.LOW,
    parameterSchema: { type: "object", properties: {} },
    requiredPermissions: [Permission.SYSTEM_PACKAGES_UPDATE],
    supportsDryRun: false,
    supportsCancel: true,
    timeoutSeconds: 300,
    lockStrategy: "exclusive",
    approvalPolicy: "none",
    requiredCapabilities: ["system.apt_update:v1"],
  },
  "system.apt_upgrade:1.0.0": {
    key: "system.apt_upgrade",
    version: "1.0.0",
    name: "Upgrade Safe Packages (apt-get upgrade)",
    description: "Upgrades installed packages using safe upgrade policy",
    risk: RiskLevel.MEDIUM,
    parameterSchema: {
      type: "object",
      properties: {
        dryRun: { type: "boolean", default: true },
      },
    },
    requiredPermissions: [Permission.SYSTEM_PACKAGES_UPGRADE],
    supportsDryRun: true,
    supportsCancel: true,
    timeoutSeconds: 900,
    lockStrategy: "exclusive",
    approvalPolicy: "default",
    requiredCapabilities: ["system.apt_upgrade:v1"],
  },
  "system.reboot:1.0.0": {
    key: "system.reboot",
    version: "1.0.0",
    name: "System Reboot",
    description: "Reboots the target node after validating maintenance and cluster state",
    risk: RiskLevel.HIGH,
    parameterSchema: {
      type: "object",
      properties: {
        reason: { type: "string" },
        delaySeconds: { type: "integer", default: 10 },
      },
      required: ["reason"],
    },
    requiredPermissions: [Permission.SYSTEM_REBOOT],
    supportsDryRun: false,
    supportsCancel: true,
    timeoutSeconds: 60,
    lockStrategy: "exclusive",
    approvalPolicy: "always",
    requiredCapabilities: ["system.reboot:v1"],
  },
  "service.status:1.0.0": {
    key: "service.status",
    version: "1.0.0",
    name: "Service Status",
    description: "Queries active status of a systemd service",
    risk: RiskLevel.READ,
    parameterSchema: {
      type: "object",
      properties: {
        serviceName: { type: "string", pattern: "^[a-zA-Z0-9_-]+$" },
      },
      required: ["serviceName"],
    },
    requiredPermissions: [Permission.SERVICE_READ],
    supportsDryRun: false,
    supportsCancel: false,
    timeoutSeconds: 30,
    lockStrategy: "none",
    approvalPolicy: "none",
    requiredCapabilities: ["service.status:v1"],
  },
  "service.restart:1.0.0": {
    key: "service.restart",
    version: "1.0.0",
    name: "Restart Service",
    description: "Restarts a specified allowed systemd service",
    risk: RiskLevel.MEDIUM,
    parameterSchema: {
      type: "object",
      properties: {
        serviceName: { type: "string", pattern: "^[a-zA-Z0-9_-]+$" },
      },
      required: ["serviceName"],
    },
    requiredPermissions: [Permission.SERVICE_RESTART],
    supportsDryRun: false,
    supportsCancel: false,
    timeoutSeconds: 120,
    lockStrategy: "shared",
    approvalPolicy: "default",
    requiredCapabilities: ["service.restart:v1"],
  },
  "backup.cleanup:1.0.0": {
    key: "backup.cleanup",
    version: "1.0.0",
    name: "Prune Expired Backup Artifacts",
    description: "Prunes expired backups based on policy retention. NO arbitrary file paths allowed.",
    risk: RiskLevel.HIGH,
    parameterSchema: {
      type: "object",
      properties: {
        policyId: { type: "string" },
        olderThanDays: { type: "integer", minimum: 1 },
        minimumCopies: { type: "integer", minimum: 1 },
        dryRun: { type: "boolean", default: true },
      },
      required: ["policyId", "olderThanDays", "minimumCopies"],
    },
    requiredPermissions: [Permission.BACKUP_DELETE],
    supportsDryRun: true,
    supportsCancel: true,
    timeoutSeconds: 600,
    lockStrategy: "exclusive",
    approvalPolicy: "always",
    requiredCapabilities: ["backup.cleanup:v1"],
  },
};
