import {
  HypervisorProvider,
  ConnectionResult,
  HypervisorNodeDto,
  HypervisorWorkloadDto,
  HypervisorStorageDto,
  HypervisorTaskDto,
} from "@infraops/contracts";
import { AppError } from "@infraops/shared";

export interface VirtualizorConfig {
  baseUrl: string; // e.g. https://virtualizor.example.com:4085
  apiKey: string;
  apiPass: string;
}

export class VirtualizorProvider implements HypervisorProvider {
  private baseUrl: string;
  private apiKey: string;
  private apiPass: string;

  constructor(config: VirtualizorConfig) {
    if (!config.baseUrl || !config.apiKey || !config.apiPass) {
      throw new Error("[VIRTUALIZOR_FATAL] Missing required Virtualizor configuration (baseUrl, apiKey, or apiPass)");
    }
    this.baseUrl = config.baseUrl.replace(/\/$/, "");
    this.apiKey = config.apiKey;
    this.apiPass = config.apiPass;
  }

  private redactCredentialsFromError(errMessage: string): string {
    let sanitized = errMessage.replace(/api_key=[^&"']+/g, "api_key=[REDACTED]");
    sanitized = sanitized.replace(/api_pass=[^&"']+/g, "api_pass=[REDACTED]");
    return sanitized;
  }

  public async testConnection(): Promise<ConnectionResult> {
    const startTime = Date.now();
    try {
      // Simulated response from act=servers & act=license
      const version = "Virtualizor v3.1.8";
      const latencyMs = Date.now() - startTime;

      return {
        connected: true,
        provider: "virtualizor",
        version,
        latencyMs,
      };
    } catch (err: any) {
      const safeError = this.redactCredentialsFromError(err.message || "Connection failed");
      return {
        connected: false,
        provider: "virtualizor",
        version: "unknown",
        latencyMs: Date.now() - startTime,
        error: safeError,
      };
    }
  }

  public async listNodes(): Promise<HypervisorNodeDto[]> {
    try {
      // Simulated response from act=servers (Master & Slave servers)
      return [
        {
          externalId: "virtualizor:server:0", // Master server
          name: "virt-master-node",
          hostname: "master.virt.local",
          status: "online",
          cpuUsagePercent: 18.2,
          memoryTotalBytes: 134217728000,
          memoryUsedBytes: 34359738368,
          uptimeSeconds: 987654,
        },
        {
          externalId: "virtualizor:server:1", // Slave server 1
          name: "virt-slave-01",
          hostname: "slave01.virt.local",
          status: "online",
          cpuUsagePercent: 24.0,
          memoryTotalBytes: 67108864000,
          memoryUsedBytes: 21474836480,
          uptimeSeconds: 456789,
        },
      ];
    } catch (err: any) {
      throw new AppError("VIRTUALIZOR_API_ERROR", this.redactCredentialsFromError(err.message), 502);
    }
  }

  public async listWorkloads(): Promise<HypervisorWorkloadDto[]> {
    try {
      // Simulated response from act=vs (VPS List normalized to WorkloadDto)
      return [
        {
          externalId: "virtualizor:0:101",
          nodeName: "virt-master-node",
          vmid: 101,
          name: "vps-client-alpha",
          type: "qemu",
          status: "running",
          cpus: 4,
          memoryBytes: 4096 * 1024 * 1024,
        },
        {
          externalId: "virtualizor:1:202",
          nodeName: "virt-slave-01",
          vmid: 202,
          name: "vps-client-beta",
          type: "lxc",
          status: "running",
          cpus: 2,
          memoryBytes: 2048 * 1024 * 1024,
        },
      ];
    } catch (err: any) {
      throw new AppError("VIRTUALIZOR_API_ERROR", this.redactCredentialsFromError(err.message), 502);
    }
  }

  public async listStorages(): Promise<HypervisorStorageDto[]> {
    try {
      // Simulated response from act=storage & act=backup_servers
      return [
        {
          externalId: "virtualizor:storage:1",
          name: "virt-lvm-storage",
          type: "lvm",
          totalBytes: 2199023255552,
          usedBytes: 879609302220,
          availableBytes: 1319413953332,
          active: true,
        },
        {
          externalId: "virtualizor:backup_server:101",
          name: "remote-backup-node-01",
          type: "backup_server",
          totalBytes: 4398046511104,
          usedBytes: 1099511627776,
          availableBytes: 3298534883328,
          active: true,
        },
      ];
    } catch (err: any) {
      throw new AppError("VIRTUALIZOR_API_ERROR", this.redactCredentialsFromError(err.message), 502);
    }
  }

  public async getTasks(): Promise<HypervisorTaskDto[]> {
    try {
      // Simulated response from act=tasks / act=vps_backups
      return [
        {
          taskId: "virt-task-9081",
          nodeName: "virt-master-node",
          type: "vps_backup",
          status: "OK",
          user: "admin",
          startTime: new Date(Date.now() - 7200000).toISOString(),
          endTime: new Date(Date.now() - 3600000).toISOString(),
        },
      ];
    } catch (err: any) {
      throw new AppError("VIRTUALIZOR_API_ERROR", this.redactCredentialsFromError(err.message), 502);
    }
  }
}
