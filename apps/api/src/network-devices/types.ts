export type NetworkVendor = "mikrotik" | "pfsense" | "generic";

export type NetworkDeviceCapability =
  | "SYSTEM_HEALTH"
  | "INTERFACES"
  | "WAN_HEALTH"
  | "ROUTING"
  | "WAN_PRIMARY_CHANGE"
  | "WAN_FAILOVER"
  | "WAN_BALANCE"
  | "VPN_HEALTH";

export interface NetworkDeviceProfile {
  id: string;
  tenantId: string;
  siteId?: string;
  name: string; // e.g. "MikroTik CCR2004 - Matriz"
  vendor: NetworkVendor;
  model: string;
  firmwareVersion: string;
  serialNumber?: string;
  ipAddress: string;
  managementPort: number;
  apiProtocol: "rest_https" | "api_native" | "xmlrpc" | "snmp";
  credentialsSecretId?: string;
  status: "online" | "degraded" | "offline" | "unreachable";
  capabilities: NetworkDeviceCapability[];
  lastSeenAt: string;
  uptimeSeconds?: number;
  systemHealth?: {
    cpuUsagePercent: number;
    memoryUsagePercent: number;
    temperatureCelsius?: number;
    storageUsagePercent?: number;
  };
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface WanLink {
  id: string;
  deviceId: string;
  tenantId: string;
  name: string; // e.g. "Vivo Fibra 500M"
  provider: string; // "Vivo", "Claro", "Starlink", "Algar", etc.
  interfaceName: string; // "ether1", "igb0", "pppoe-out1"
  ipAddress?: string;
  gatewayIp: string;
  monitorIp: string; // e.g. "8.8.8.8" or "1.1.1.1"
  isPrimary: boolean;
  tier: number; // 1 = Primary, 2 = Secondary/Backup, 3 = Standby
  weight?: number; // e.g. 1, 2, 5 for load balancing
  status: "up" | "down" | "degraded" | "disabled";
  latencyMs: number;
  packetLossPercent: number;
  rxBps: number;
  txBps: number;
  circuitId?: string; // Link to Stage 26 WanCircuit if available
  contractSpeedMbps?: number;
  lastCheckedAt: string;
}

export interface DeviceInterface {
  name: string;
  type: string;
  macAddress?: string;
  ipAddress?: string;
  status: "up" | "down" | "disabled";
  rxBytes?: number;
  txBytes?: number;
  rxBps?: number;
  txBps?: number;
  comment?: string;
}

export interface RouteEntry {
  destination: string; // "0.0.0.0/0"
  gateway: string;
  distance: number;
  active: boolean;
  routingTable?: string;
  comment?: string;
}

export interface NetworkChangeSnapshot {
  id: string;
  deviceId: string;
  tenantId: string;
  actionKey: string;
  capturedAt: string;
  routesBefore: RouteEntry[];
  primaryWanIdBefore: string;
  wanStatesBefore: Array<{
    wanId: string;
    isPrimary: boolean;
    tier: number;
    status: string;
    distance?: number;
  }>;
  systemStateBefore?: Record<string, any>;
}

export interface NetworkActionRun {
  id: string;
  deviceId: string;
  tenantId: string;
  actionKey: string;
  requestedBy: string;
  executedAt: string;
  completedAt?: string;
  status: "success" | "failed" | "rolled_back" | "in_progress";
  snapshotId: string;
  precheck: {
    passed: boolean;
    checks: Array<{ name: string; status: "pass" | "fail"; details: string }>;
  };
  postcheck?: {
    passed: boolean;
    checks: Array<{ name: string; status: "pass" | "fail"; details: string }>;
  };
  rollbackDetails?: {
    triggeredAt: string;
    success: boolean;
    error?: string;
  };
  eventHash: string;
}

export interface WanFailoverPolicy {
  id: string;
  deviceId: string;
  tenantId: string;
  name: string;
  enabled: boolean;
  triggerType: "loss" | "latency" | "down" | "combined";
  maxPacketLossPercent: number; // e.g. 15%
  maxLatencyMs: number; // e.g. 250ms
  debounceSeconds: number; // e.g. 60s (must remain degraded for 60s)
  hysteresisSeconds: number; // e.g. 120s (recovery must be stable for 120s)
  cooldownMinutes: number; // e.g. 15m (prevent repeated switches)
  circuitBreakerMaxPerHour: number; // e.g. 3 changes/hour max
  autoReturnToPrimary: boolean;
  minPrimaryHealthyMinutes: number; // e.g. 10m before return
  lastTriggeredAt?: string;
  switchesLastHour: number;
}
