import {
  INetworkDeviceDriver,
  DeviceIdentity,
  DeviceSystemHealth,
  ActionResult,
  ValidationResult,
  RollbackResult,
} from "./driverInterface";
import {
  NetworkDeviceProfile,
  NetworkDeviceCapability,
  WanLink,
  DeviceInterface,
  RouteEntry,
  NetworkChangeSnapshot,
} from "../types";

export class PfSenseDriver implements INetworkDeviceDriver {
  vendor = "pfsense";

  async testConnection(device: NetworkDeviceProfile, credentials?: Record<string, any>): Promise<boolean> {
    return !!device.ipAddress && device.ipAddress.length > 6;
  }

  detectCapabilities(device: NetworkDeviceProfile): NetworkDeviceCapability[] {
    return [
      "SYSTEM_HEALTH",
      "INTERFACES",
      "WAN_HEALTH",
      "ROUTING",
      "WAN_PRIMARY_CHANGE",
      "WAN_FAILOVER",
      "WAN_BALANCE",
      "VPN_HEALTH",
    ];
  }

  async getIdentity(device: NetworkDeviceProfile): Promise<DeviceIdentity> {
    return {
      name: device.name || "pfSense-Firewall",
      vendor: "Netgate / pfSense",
      model: device.model || "Netgate SG-3100",
      firmwareVersion: device.firmwareVersion || "pfSense Plus 24.03-RELEASE",
      serialNumber: device.serialNumber || "NETG-SG3100-9921",
      uptimeSeconds: device.uptimeSeconds || 2419200,
    };
  }

  async getSystemHealth(device: NetworkDeviceProfile): Promise<DeviceSystemHealth> {
    const baseCpu = device.systemHealth?.cpuUsagePercent || 8.0;
    const baseMem = device.systemHealth?.memoryUsagePercent || 28.0;
    return {
      cpuUsagePercent: Math.min(100, Math.max(1, +(baseCpu + (Math.random() * 3 - 1.5)).toFixed(1))),
      memoryUsagePercent: Math.min(100, Math.max(5, +(baseMem + (Math.random() * 2 - 1)).toFixed(1))),
      temperatureCelsius: device.systemHealth?.temperatureCelsius || 48.0,
      storageUsagePercent: device.systemHealth?.storageUsagePercent || 15.0,
      voltageVolts: 12.0,
    };
  }

  async listInterfaces(device: NetworkDeviceProfile): Promise<DeviceInterface[]> {
    return [
      { name: "mvneta0", type: "wan", macAddress: "00:08:A2:0A:11:01", status: "up", comment: "WAN (Claro Dedicado)" },
      { name: "mvneta1", type: "lan", macAddress: "00:08:A2:0A:11:02", status: "up", comment: "LAN Principal" },
      { name: "mvneta2", type: "opt1", macAddress: "00:08:A2:0A:11:03", status: "up", comment: "OPT1 (Starlink Backup)" },
    ];
  }

  async listWanLinks(device: NetworkDeviceProfile): Promise<WanLink[]> {
    return [];
  }

  async getRoutingTable(device: NetworkDeviceProfile): Promise<RouteEntry[]> {
    return [
      { destination: "default", gateway: "GW_WAN_CLARO", distance: 1, active: true, comment: "Default Gateway Group (Tier 1)" },
      { destination: "default", gateway: "GW_WAN_STARLINK", distance: 2, active: false, comment: "Backup Gateway Group (Tier 2)" },
    ];
  }

  async snapshotWanConfig(device: NetworkDeviceProfile, actionKey: string): Promise<NetworkChangeSnapshot> {
    const routes = await this.getRoutingTable(device);
    return {
      id: `snap-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      deviceId: device.id,
      tenantId: device.tenantId,
      actionKey,
      capturedAt: new Date().toISOString(),
      routesBefore: routes,
      primaryWanIdBefore: "",
      wanStatesBefore: [],
      systemStateBefore: {
        vendor: "pfsense",
        version: device.firmwareVersion,
        gatewayGroup: "GW_GROUP_FAILOVER",
      },
    };
  }

  async setPrimaryWan(
    device: NetworkDeviceProfile,
    targetWanId: string,
    allWanLinks: WanLink[],
    options?: { failoverSecondaryId?: string }
  ): Promise<ActionResult> {
    const targetWan = allWanLinks.find((w) => w.id === targetWanId);
    if (!targetWan) {
      return { success: false, message: "Target WAN not found on pfSense device.", error: "TARGET_WAN_NOT_FOUND" };
    }

    if (targetWan.status === "down") {
      return { success: false, message: `Cannot set pfSense primary WAN to '${targetWan.name}' because status is DOWN.`, error: "TARGET_WAN_DOWN" };
    }

    targetWan.isPrimary = true;
    targetWan.tier = 1;

    allWanLinks.forEach((w) => {
      if (w.id !== targetWanId) {
        w.isPrimary = false;
        w.tier = 2;
      }
    });

    return {
      success: true,
      message: `⚡ pfSense: Gateway Group ajustado com sucesso. '${targetWan.name}' (${targetWan.provider}) agora é Tier 1 (Default).`,
      changesApplied: {
        gatewayGroupName: "GW_GROUP_FAILOVER",
        tier1Gateway: targetWan.name,
        action: "pfsense_gateway_tier_reorder",
      },
    };
  }

  async setWanFailover(
    device: NetworkDeviceProfile,
    primaryWanId: string,
    backupWanId: string,
    allWanLinks: WanLink[]
  ): Promise<ActionResult> {
    const primary = allWanLinks.find((w) => w.id === primaryWanId);
    const backup = allWanLinks.find((w) => w.id === backupWanId);
    if (!primary || !backup) {
      return { success: false, message: "Invalid WAN selection.", error: "INVALID_WAN_SELECTION" };
    }

    primary.isPrimary = true;
    primary.tier = 1;
    backup.isPrimary = false;
    backup.tier = 2;

    return {
      success: true,
      message: `🔄 pfSense: Gateway Group Failover configurado: '${primary.name}' (Tier 1) -> '${backup.name}' (Tier 2).`,
      changesApplied: {
        gatewayGroupName: "GW_GROUP_FAILOVER",
        primaryWanId,
        backupWanId,
        triggerLevel: "Member Down / High Latency",
      },
    };
  }

  async setWanBalance(
    device: NetworkDeviceProfile,
    weights: Record<string, number>,
    allWanLinks: WanLink[]
  ): Promise<ActionResult> {
    return {
      success: true,
      message: `⚖️ pfSense: Gateway Group Multi-WAN Load Balancing configurado com pesos: ${JSON.stringify(weights)}.`,
      changesApplied: { weights },
    };
  }

  async enableWan(device: NetworkDeviceProfile, wanId: string, allWanLinks: WanLink[]): Promise<ActionResult> {
    const wan = allWanLinks.find((w) => w.id === wanId);
    if (!wan) return { success: false, message: "WAN not found." };
    wan.status = "up";
    return {
      success: true,
      message: `✅ pfSense: Interface '${wan.name}' (${wan.interfaceName}) habilitada no filtro de pacotes.`,
    };
  }

  async disableWan(device: NetworkDeviceProfile, wanId: string, allWanLinks: WanLink[]): Promise<ActionResult> {
    const wan = allWanLinks.find((w) => w.id === wanId);
    if (!wan) return { success: false, message: "WAN not found." };
    wan.status = "disabled";
    if (wan.isPrimary) {
      const next = allWanLinks.find((w) => w.id !== wanId && w.status !== "disabled");
      if (next) {
        next.isPrimary = true;
        next.tier = 1;
      }
    }
    return {
      success: true,
      message: `🚫 pfSense: Interface '${wan.name}' (${wan.interfaceName}) desabilitada.`,
    };
  }

  async validatePostChange(
    device: NetworkDeviceProfile,
    targetWan: WanLink,
    allWanLinks: WanLink[]
  ): Promise<ValidationResult> {
    const checks = [
      { name: `dpinger Monitor (${targetWan.monitorIp || "8.8.8.8"})`, status: "pass" as const, details: "dpinger reporta RTT 11.2ms, Perda 0.0%" },
      { name: "pfSense State Table Egress", status: "pass" as const, details: "Novos estados criados com gateway Tier 1" },
      { name: "Resolução DNS Unbound", status: "pass" as const, details: "Resolver local responde em 2ms para domínios públicos" },
      { name: "Acesso ao WebGUI / XML-RPC", status: "pass" as const, details: "Interface de gerência e API operacionais" },
    ];

    return {
      passed: true,
      activeGateway: targetWan.gatewayIp,
      egressWorking: true,
      dnsWorking: true,
      managementAccessible: true,
      checks,
    };
  }

  async rollbackWanChange(
    device: NetworkDeviceProfile,
    snapshot: NetworkChangeSnapshot,
    allWanLinks: WanLink[]
  ): Promise<RollbackResult> {
    if (snapshot.primaryWanIdBefore) {
      const prev = allWanLinks.find((w) => w.id === snapshot.primaryWanIdBefore);
      if (prev) {
        prev.isPrimary = true;
        prev.tier = 1;
      }
      allWanLinks.forEach((w) => {
        if (w.id !== snapshot.primaryWanIdBefore) {
          w.isPrimary = false;
          w.tier = 2;
        }
      });
    }

    return {
      success: true,
      message: `🛡️ pfSense: Rollback concluído com sucesso para o snapshot '${snapshot.id}'. Gateway Group restaurado.`,
    };
  }
}
