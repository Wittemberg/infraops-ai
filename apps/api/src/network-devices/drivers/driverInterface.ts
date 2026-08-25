import {
  NetworkDeviceProfile,
  NetworkDeviceCapability,
  WanLink,
  DeviceInterface,
  RouteEntry,
  NetworkChangeSnapshot,
} from "../types";

export interface DeviceIdentity {
  name: string;
  vendor: string;
  model: string;
  firmwareVersion: string;
  serialNumber?: string;
  uptimeSeconds: number;
}

export interface DeviceSystemHealth {
  cpuUsagePercent: number;
  memoryUsagePercent: number;
  temperatureCelsius?: number;
  storageUsagePercent?: number;
  voltageVolts?: number;
  firmwareVersion?: string;
  model?: string;
}

export interface ActionResult {
  success: boolean;
  message: string;
  error?: string;
  changesApplied?: Record<string, any>;
}

export interface ValidationResult {
  passed: boolean;
  activeGateway: string;
  egressWorking: boolean;
  dnsWorking: boolean;
  managementAccessible: boolean;
  checks: Array<{ name: string; status: "pass" | "fail"; details: string }>;
  error?: string;
}

export interface RollbackResult {
  success: boolean;
  message: string;
  error?: string;
}

export interface INetworkDeviceDriver {
  vendor: string;

  testConnection(device: NetworkDeviceProfile, credentials?: Record<string, any>): Promise<boolean>;

  detectCapabilities(device: NetworkDeviceProfile): NetworkDeviceCapability[];

  getIdentity(device: NetworkDeviceProfile): Promise<DeviceIdentity>;

  getSystemHealth(device: NetworkDeviceProfile, credentials?: Record<string, any>): Promise<DeviceSystemHealth>;

  listInterfaces(device: NetworkDeviceProfile): Promise<DeviceInterface[]>;

  listWanLinks(device: NetworkDeviceProfile): Promise<WanLink[]>;

  getRoutingTable(device: NetworkDeviceProfile): Promise<RouteEntry[]>;

  snapshotWanConfig(device: NetworkDeviceProfile, actionKey: string): Promise<NetworkChangeSnapshot>;

  setPrimaryWan(
    device: NetworkDeviceProfile,
    targetWanId: string,
    allWanLinks: WanLink[],
    options?: { failoverSecondaryId?: string }
  ): Promise<ActionResult>;

  setWanFailover(
    device: NetworkDeviceProfile,
    primaryWanId: string,
    backupWanId: string,
    allWanLinks: WanLink[]
  ): Promise<ActionResult>;

  setWanBalance(
    device: NetworkDeviceProfile,
    weights: Record<string, number>,
    allWanLinks: WanLink[]
  ): Promise<ActionResult>;

  enableWan(device: NetworkDeviceProfile, wanId: string, allWanLinks: WanLink[]): Promise<ActionResult>;

  disableWan(device: NetworkDeviceProfile, wanId: string, allWanLinks: WanLink[]): Promise<ActionResult>;

  validatePostChange(
    device: NetworkDeviceProfile,
    targetWan: WanLink,
    allWanLinks: WanLink[]
  ): Promise<ValidationResult>;

  rollbackWanChange(
    device: NetworkDeviceProfile,
    snapshot: NetworkChangeSnapshot,
    allWanLinks: WanLink[]
  ): Promise<RollbackResult>;
}
