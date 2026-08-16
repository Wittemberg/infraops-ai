import {
  HypervisorProvider,
  ConnectionResult,
  HypervisorNodeDto,
  HypervisorWorkloadDto,
  HypervisorStorageDto,
  HypervisorTaskDto,
} from "@infraops/contracts";
import { AppError } from "@infraops/shared";

export interface ProxmoxConfig {
  baseUrl: string; // e.g. https://pve.example.com:8006
  apiToken: string; // e.g. PVEAPIToken=infraops@pam!tokenid=secret
  allowSelfSigned?: boolean;
}

export class ProxmoxProvider implements HypervisorProvider {
  private baseUrl: string;
  private apiToken: string;

  constructor(config: ProxmoxConfig) {
    if (!config.baseUrl || !config.apiToken) {
      throw new Error("[PROXMOX_FATAL] Missing required Proxmox configuration (baseUrl or apiToken)");
    }
    this.baseUrl = config.baseUrl.replace(/\/$/, "");
    this.apiToken = config.apiToken;
  }

  private redactTokenFromError(errMessage: string): string {
    return errMessage.replace(/PVEAPIToken=[^\s&"']+/g, "PVEAPIToken=[REDACTED]");
  }

  public async testConnection(): Promise<ConnectionResult> {
    const startTime = Date.now();
    try {
      // Mock/simulated fetch call for Proxmox VE API version check
      const version = "Proxmox VE 8.1.4";
      const latencyMs = Date.now() - startTime;

      return {
        connected: true,
        provider: "proxmox",
        version,
        latencyMs,
      };
    } catch (err: any) {
      const safeError = this.redactTokenFromError(err.message || "Connection failed");
      return {
        connected: false,
        provider: "proxmox",
        version: "unknown",
        latencyMs: Date.now() - startTime,
        error: safeError,
      };
    }
  }

  public async listNodes(): Promise<HypervisorNodeDto[]> {
    try {
      // Simulated response from GET /api2/json/nodes
      return [
        {
          externalId: "proxmox:pve01",
          name: "pve01",
          hostname: "pve01.local",
          status: "online",
          cpuUsagePercent: 12.5,
          memoryTotalBytes: 67108864000,
          memoryUsedBytes: 16106127360,
          uptimeSeconds: 1234567,
        },
      ];
    } catch (err: any) {
      throw new AppError("PROXMOX_API_ERROR", this.redactTokenFromError(err.message), 502);
    }
  }

  public async listWorkloads(): Promise<HypervisorWorkloadDto[]> {
    try {
      // Simulated response from GET /api2/json/cluster/resources?type=vm
      return [
        {
          externalId: "proxmox:pve01:100",
          nodeName: "pve01",
          vmid: 100,
          name: "web-server-01",
          type: "qemu",
          status: "running",
          cpus: 4,
          memoryBytes: 8589934592,
        },
        {
          externalId: "proxmox:pve01:101",
          nodeName: "pve01",
          vmid: 101,
          name: "redis-container",
          type: "lxc",
          status: "running",
          cpus: 2,
          memoryBytes: 2097152000,
        },
      ];
    } catch (err: any) {
      throw new AppError("PROXMOX_API_ERROR", this.redactTokenFromError(err.message), 502);
    }
  }

  public async listStorages(): Promise<HypervisorStorageDto[]> {
    try {
      // Simulated response from GET /api2/json/storage
      return [
        {
          externalId: "proxmox:pve01:local-zfs",
          name: "local-zfs",
          type: "zfspool",
          totalBytes: 1099511627776,
          usedBytes: 329853488332,
          availableBytes: 769658139444,
          active: true,
        },
      ];
    } catch (err: any) {
      throw new AppError("PROXMOX_API_ERROR", this.redactTokenFromError(err.message), 502);
    }
  }

  public async getTasks(): Promise<HypervisorTaskDto[]> {
    try {
      // Simulated response from GET /api2/json/cluster/tasks
      return [
        {
          taskId: "UPID:pve01:00001234:00112233:vzdump:100:root@pam:",
          nodeName: "pve01",
          type: "vzdump",
          status: "OK",
          user: "root@pam",
          startTime: new Date(Date.now() - 3600000).toISOString(),
          endTime: new Date().toISOString(),
        },
      ];
    } catch (err: any) {
      throw new AppError("PROXMOX_API_ERROR", this.redactTokenFromError(err.message), 502);
    }
  }
}
