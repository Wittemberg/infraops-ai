import {
  NetworkDeviceProfile,
  NetworkDeviceCapability,
  WanLink,
  DeviceInterface,
  RouteEntry,
  NetworkChangeSnapshot,
  NetworkActionRun,
} from "./types";
import { INetworkDeviceDriver } from "./drivers/driverInterface";
import { MikroTikDriver } from "./drivers/mikrotikDriver";
import { PfSenseDriver } from "./drivers/pfsenseDriver";
import crypto from "crypto";

export interface NetworkDeviceStoreData {
  networkDevices: NetworkDeviceProfile[];
  wanLinks: WanLink[];
  networkSnapshots: NetworkChangeSnapshot[];
  networkActionRuns: NetworkActionRun[];
}

export class NetworkDeviceService {
  private static drivers: Map<string, INetworkDeviceDriver> = new Map([
    ["mikrotik", new MikroTikDriver()],
    ["pfsense", new PfSenseDriver()],
  ]);

  static getDriver(vendor: string): INetworkDeviceDriver {
    const driver = this.drivers.get(vendor.toLowerCase());
    if (!driver) {
      // Default to MikroTik driver logic as fallback
      return this.drivers.get("mikrotik")!;
    }
    return driver;
  }

  // --- CRUD Network Devices ---
  static getDevices(store: NetworkDeviceStoreData, tenantId: string): NetworkDeviceProfile[] {
    return (store.networkDevices || []).filter((d) => d.tenantId === tenantId);
  }

  static getDeviceById(
    store: NetworkDeviceStoreData,
    tenantId: string,
    id: string
  ): NetworkDeviceProfile | undefined {
    return (store.networkDevices || []).find((d) => d.id === id && d.tenantId === tenantId);
  }

  static createDevice(
    store: NetworkDeviceStoreData,
    tenantId: string,
    data: Partial<NetworkDeviceProfile>
  ): NetworkDeviceProfile {
    if (!store.networkDevices) store.networkDevices = [];

    const driver = this.getDriver(data.vendor || "mikrotik");
    const capabilities = driver.detectCapabilities(data as NetworkDeviceProfile);

    const newDevice: NetworkDeviceProfile = {
      id: `netdev-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      tenantId,
      siteId: data.siteId,
      name: data.name || "Novo Roteador",
      vendor: data.vendor || "mikrotik",
      model: data.model || "Router",
      firmwareVersion: data.firmwareVersion || "v1.0",
      serialNumber: data.serialNumber || `SN-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
      ipAddress: data.ipAddress || "192.168.1.1",
      managementPort: data.managementPort || (data.vendor === "pfsense" ? 443 : 8728),
      apiProtocol: data.apiProtocol || (data.vendor === "pfsense" ? "xmlrpc" : "rest_https"),
      credentialsSecretId: data.credentialsSecretId,
      status: "online",
      capabilities,
      lastSeenAt: new Date().toISOString(),
      uptimeSeconds: data.uptimeSeconds || 3600 * 24 * 7,
      systemHealth: {
        cpuUsagePercent: 12.0,
        memoryUsagePercent: 32.0,
        temperatureCelsius: 42.0,
        storageUsagePercent: 25.0,
      },
      notes: data.notes,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    store.networkDevices.push(newDevice);
    return newDevice;
  }

  static updateDevice(
    store: NetworkDeviceStoreData,
    tenantId: string,
    id: string,
    data: Partial<NetworkDeviceProfile>
  ): { device?: NetworkDeviceProfile; error?: string } {
    const device = this.getDeviceById(store, tenantId, id);
    if (!device) return { error: "Dispositivo de rede não encontrado." };

    Object.assign(device, data, { updatedAt: new Date().toISOString() });
    return { device };
  }

  static deleteDevice(
    store: NetworkDeviceStoreData,
    tenantId: string,
    id: string
  ): { success: boolean; error?: string } {
    const idx = (store.networkDevices || []).findIndex((d) => d.id === id && d.tenantId === tenantId);
    if (idx === -1) return { success: false, error: "Dispositivo não encontrado." };

    store.networkDevices.splice(idx, 1);
    // Cascade remove WAN links
    if (store.wanLinks) {
      store.wanLinks = store.wanLinks.filter((w) => w.deviceId !== id);
    }
    return { success: true };
  }

  // --- CRUD & Telemetry for WAN Links ---
  static getWanLinks(store: NetworkDeviceStoreData, tenantId: string, deviceId?: string): WanLink[] {
    let links = (store.wanLinks || []).filter((w) => w.tenantId === tenantId);
    if (deviceId) {
      links = links.filter((w) => w.deviceId === deviceId);
    }
    return links;
  }

  static getWanLinkById(store: NetworkDeviceStoreData, tenantId: string, id: string): WanLink | undefined {
    return (store.wanLinks || []).find((w) => w.id === id && w.tenantId === tenantId);
  }

  static createWanLink(
    store: NetworkDeviceStoreData,
    tenantId: string,
    data: Partial<WanLink>
  ): { wanLink?: WanLink; error?: string } {
    if (!store.wanLinks) store.wanLinks = [];
    if (!data.deviceId) return { error: "ID do dispositivo é obrigatório." };

    const newWan: WanLink = {
      id: `wan-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      deviceId: data.deviceId,
      tenantId,
      name: data.name || "Link Internet",
      provider: data.provider || "Operadora",
      interfaceName: data.interfaceName || "ether1",
      ipAddress: data.ipAddress || "189.40.100.22",
      gatewayIp: data.gatewayIp || "189.40.100.1",
      monitorIp: data.monitorIp || "8.8.8.8",
      isPrimary: !!data.isPrimary,
      tier: data.tier || (data.isPrimary ? 1 : 2),
      weight: data.weight || 1,
      status: data.status || "up",
      latencyMs: data.latencyMs || 12.4,
      packetLossPercent: data.packetLossPercent || 0.0,
      rxBps: data.rxBps || 45000000,
      txBps: data.txBps || 12000000,
      circuitId: data.circuitId,
      contractSpeedMbps: data.contractSpeedMbps || 500,
      lastCheckedAt: new Date().toISOString(),
    };

    if (newWan.isPrimary) {
      // Set other WANs for this device as secondary
      store.wanLinks
        .filter((w) => w.deviceId === data.deviceId)
        .forEach((w) => {
          w.isPrimary = false;
          w.tier = 2;
        });
    }

    store.wanLinks.push(newWan);
    return { wanLink: newWan };
  }

  static updateWanLink(
    store: NetworkDeviceStoreData,
    tenantId: string,
    id: string,
    data: Partial<WanLink>
  ): { wanLink?: WanLink; error?: string } {
    const wan = this.getWanLinkById(store, tenantId, id);
    if (!wan) return { error: "Link WAN não encontrado." };

    if (data.isPrimary && !wan.isPrimary) {
      store.wanLinks
        .filter((w) => w.deviceId === wan.deviceId && w.id !== id)
        .forEach((w) => {
          w.isPrimary = false;
          w.tier = 2;
        });
    }

    Object.assign(wan, data, { lastCheckedAt: new Date().toISOString() });
    return { wanLink: wan };
  }

  static deleteWanLink(store: NetworkDeviceStoreData, tenantId: string, id: string): { success: boolean; error?: string } {
    const idx = (store.wanLinks || []).findIndex((w) => w.id === id && w.tenantId === tenantId);
    if (idx === -1) return { success: false, error: "Link WAN não encontrado." };
    store.wanLinks.splice(idx, 1);
    return { success: true };
  }

  // --- Snapshots ---
  static getSnapshots(store: NetworkDeviceStoreData, tenantId: string, deviceId?: string): NetworkChangeSnapshot[] {
    let snaps = (store.networkSnapshots || []).filter((s) => s.tenantId === tenantId);
    if (deviceId) {
      snaps = snaps.filter((s) => s.deviceId === deviceId);
    }
    return snaps.sort((a, b) => new Date(b.capturedAt).getTime() - new Date(a.capturedAt).getTime());
  }

  static captureSnapshot(
    store: NetworkDeviceStoreData,
    tenantId: string,
    deviceId: string,
    actionKey: string
  ): NetworkChangeSnapshot {
    if (!store.networkSnapshots) store.networkSnapshots = [];
    const device = this.getDeviceById(store, tenantId, deviceId);
    const allWans = this.getWanLinks(store, tenantId, deviceId);
    const currentPrimary = allWans.find((w) => w.isPrimary);

    const snapshot: NetworkChangeSnapshot = {
      id: `snap-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      deviceId,
      tenantId,
      actionKey,
      capturedAt: new Date().toISOString(),
      routesBefore: [
        { destination: "0.0.0.0/0", gateway: currentPrimary?.gatewayIp || "189.40.100.1", distance: 1, active: true },
      ],
      primaryWanIdBefore: currentPrimary?.id || "",
      wanStatesBefore: allWans.map((w) => ({
        wanId: w.id,
        isPrimary: w.isPrimary,
        tier: w.tier,
        status: w.status,
      })),
    };

    store.networkSnapshots.unshift(snapshot);
    if (store.networkSnapshots.length > 50) store.networkSnapshots.pop();
    return snapshot;
  }
}
