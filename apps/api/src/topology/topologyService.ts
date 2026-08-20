export interface AssetInterface {
  id: string;
  tenantId: string;
  assetId: string;
  name: string; // e.g. "port1", "eth0", "Gi0/1", "SFP+ 1"
  type: "ethernet_copper" | "ethernet_fiber" | "sfp" | "sfp_plus" | "qsfp" | "mgmt" | "serial" | "other";
  speedMbps?: number; // 1000, 10000, etc.
  macAddress?: string;
  vlanId?: number;
  ipAddress?: string;
  status: "up" | "down" | "disabled" | "unknown";
  notes?: string;
  createdAt: string;
}

export interface Connection {
  id: string;
  tenantId: string;
  sourceAssetId: string;
  sourceInterfaceId: string;
  targetAssetId: string;
  targetInterfaceId: string;
  cableType: "cat5e" | "cat6" | "cat6a" | "cat7" | "fiber_sm" | "fiber_mm" | "dac" | "other";
  cableColor?: string; // e.g. "blue", "yellow", "red"
  lengthMeters?: number;
  notes?: string;
  source: "MANUAL" | "DISCOVERED" | "VERIFIED";
  createdAt: string;
  updatedAt: string;
}

export interface SwitchPortWizardOptions {
  assetId: string;
  tenantId: string;
  copperPortCount: number; // e.g. 24 or 48
  copperPrefix?: string; // "Gi0/" or "Port " or "eth"
  copperSpeedMbps?: number; // 1000
  fiberPortCount?: number; // e.g. 2 or 4
  fiberPrefix?: string; // "SFP+ "
  fiberSpeedMbps?: number; // 10000
}

export interface TopologyStoreData {
  interfaces: AssetInterface[];
  connections: Connection[];
}

export class TopologyService {
  // Interfaces
  static getInterfaces(store: TopologyStoreData, tenantId: string, assetId?: string): AssetInterface[] {
    let list = (store.interfaces || []).filter((i) => i.tenantId === tenantId);
    if (assetId) {
      list = list.filter((i) => i.assetId === assetId);
    }
    return list;
  }

  static createInterface(store: TopologyStoreData, tenantId: string, payload: Partial<AssetInterface>): AssetInterface {
    const now = new Date().toISOString();
    const iface: AssetInterface = {
      id: `if-${Math.random().toString(36).substring(2, 8)}`,
      tenantId,
      assetId: payload.assetId || "",
      name: payload.name || "eth0",
      type: payload.type || "ethernet_copper",
      speedMbps: payload.speedMbps || 1000,
      macAddress: payload.macAddress,
      vlanId: payload.vlanId,
      ipAddress: payload.ipAddress,
      status: payload.status || "up",
      notes: payload.notes,
      createdAt: now,
    };
    if (!store.interfaces) store.interfaces = [];
    store.interfaces.push(iface);
    return iface;
  }

  static generateSwitchPorts(store: TopologyStoreData, opts: SwitchPortWizardOptions): AssetInterface[] {
    const created: AssetInterface[] = [];
    const now = new Date().toISOString();
    if (!store.interfaces) store.interfaces = [];

    // Copper ports
    const copperPrefix = opts.copperPrefix || "Port ";
    const copperSpeed = opts.copperSpeedMbps || 1000;
    for (let i = 1; i <= opts.copperPortCount; i++) {
      const iface: AssetInterface = {
        id: `if-${Math.random().toString(36).substring(2, 8)}`,
        tenantId: opts.tenantId,
        assetId: opts.assetId,
        name: `${copperPrefix}${i}`,
        type: "ethernet_copper",
        speedMbps: copperSpeed,
        status: "up",
        createdAt: now,
      };
      store.interfaces.push(iface);
      created.push(iface);
    }

    // Fiber / SFP ports
    if (opts.fiberPortCount && opts.fiberPortCount > 0) {
      const fiberPrefix = opts.fiberPrefix || "SFP+ ";
      const fiberSpeed = opts.fiberSpeedMbps || 10000;
      for (let i = 1; i <= opts.fiberPortCount; i++) {
        const iface: AssetInterface = {
          id: `if-${Math.random().toString(36).substring(2, 8)}`,
          tenantId: opts.tenantId,
          assetId: opts.assetId,
          name: `${fiberPrefix}${i}`,
          type: "sfp_plus",
          speedMbps: fiberSpeed,
          status: "up",
          createdAt: now,
        };
        store.interfaces.push(iface);
        created.push(iface);
      }
    }

    return created;
  }

  // Connections
  static getConnections(store: TopologyStoreData, tenantId: string, assetId?: string): Connection[] {
    let list = (store.connections || []).filter((c) => c.tenantId === tenantId);
    if (assetId) {
      list = list.filter((c) => c.sourceAssetId === assetId || c.targetAssetId === assetId);
    }
    return list;
  }

  static createConnection(
    store: TopologyStoreData,
    tenantId: string,
    payload: Partial<Connection>
  ): { connection?: Connection; error?: string } {
    if (!payload.sourceAssetId || !payload.sourceInterfaceId || !payload.targetAssetId || !payload.targetInterfaceId) {
      return { error: "Ambos os ativos e portas de origem e destino devem ser especificados." };
    }

    if (payload.sourceInterfaceId === payload.targetInterfaceId) {
      return { error: "Uma porta não pode ser conectada a si mesma." };
    }

    // Check if either interface is already occupied
    const occupied = (store.connections || []).some(
      (c) =>
        c.tenantId === tenantId &&
        (c.sourceInterfaceId === payload.sourceInterfaceId ||
          c.targetInterfaceId === payload.sourceInterfaceId ||
          c.sourceInterfaceId === payload.targetInterfaceId ||
          c.targetInterfaceId === payload.targetInterfaceId)
    );

    if (occupied) {
      return { error: "Uma das portas selecionadas já possui um cabo ou conexão ativa registrada." };
    }

    const now = new Date().toISOString();
    const conn: Connection = {
      id: `conn-${Math.random().toString(36).substring(2, 8)}`,
      tenantId,
      sourceAssetId: payload.sourceAssetId,
      sourceInterfaceId: payload.sourceInterfaceId,
      targetAssetId: payload.targetAssetId,
      targetInterfaceId: payload.targetInterfaceId,
      cableType: payload.cableType || "cat6",
      cableColor: payload.cableColor || "blue",
      lengthMeters: payload.lengthMeters ? Number(payload.lengthMeters) : undefined,
      notes: payload.notes,
      source: payload.source || "MANUAL",
      createdAt: now,
      updatedAt: now,
    };

    if (!store.connections) store.connections = [];
    store.connections.push(conn);
    return { connection: conn };
  }

  static deleteConnection(store: TopologyStoreData, tenantId: string, id: string): { success: boolean; error?: string } {
    const exists = (store.connections || []).some((c) => c.id === id && c.tenantId === tenantId);
    if (!exists) return { success: false, error: "Conexão não encontrada." };
    store.connections = (store.connections || []).filter((c) => !(c.id === id && c.tenantId === tenantId));
    return { success: true };
  }

  // Topology Derivation
  static getTopologyGraph(store: TopologyStoreData, assets: Array<{ id: string; name: string; category: string }>, tenantId: string) {
    const tenantConns = (store.connections || []).filter((c) => c.tenantId === tenantId);
    const tenantIfaces = (store.interfaces || []).filter((i) => i.tenantId === tenantId);

    const nodes = assets.map((a) => ({
      id: a.id,
      label: a.name,
      category: a.category,
      interfacesCount: tenantIfaces.filter((i) => i.assetId === a.id).length,
    }));

    const edges = tenantConns.map((c) => {
      const srcIface = tenantIfaces.find((i) => i.id === c.sourceInterfaceId)?.name || "Port";
      const dstIface = tenantIfaces.find((i) => i.id === c.targetInterfaceId)?.name || "Port";
      return {
        id: c.id,
        source: c.sourceAssetId,
        target: c.targetAssetId,
        sourceInterface: srcIface,
        targetInterface: dstIface,
        label: `${srcIface} ↔ ${dstIface}`,
        cableType: c.cableType,
        cableColor: c.cableColor,
      };
    });

    return { nodes, edges };
  }
}
