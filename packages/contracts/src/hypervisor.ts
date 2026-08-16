export interface ConnectionResult {
  connected: boolean;
  provider: "proxmox" | "virtualizor" | "custom";
  version: string;
  latencyMs: number;
  error?: string;
}

export interface HypervisorNodeDto {
  externalId: string;
  name: string;
  hostname: string;
  status: "online" | "offline" | "unknown";
  cpuUsagePercent: number;
  memoryTotalBytes: number;
  memoryUsedBytes: number;
  uptimeSeconds: number;
}

export interface HypervisorWorkloadDto {
  externalId: string;
  nodeName: string;
  vmid: number;
  name: string;
  type: "qemu" | "lxc";
  status: "running" | "stopped" | "paused" | "unknown";
  cpus: number;
  memoryBytes: number;
}

export interface HypervisorStorageDto {
  externalId: string;
  name: string;
  type: string;
  totalBytes: number;
  usedBytes: number;
  availableBytes: number;
  active: boolean;
}

export interface HypervisorTaskDto {
  taskId: string;
  nodeName: string;
  type: string;
  status: "running" | "OK" | "ERROR";
  user: string;
  startTime: string;
  endTime?: string;
}

export interface HypervisorProvider {
  testConnection(): Promise<ConnectionResult>;
  listNodes(): Promise<HypervisorNodeDto[]>;
  listWorkloads(): Promise<HypervisorWorkloadDto[]>;
  listStorages(): Promise<HypervisorStorageDto[]>;
  getTasks(): Promise<HypervisorTaskDto[]>;
}
