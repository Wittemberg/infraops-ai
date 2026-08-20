export interface Vlan {
  id: string;
  tenantId: string;
  vlanId: number; // 1 to 4094
  name: string; // "Dados", "Voz/VoIP", "Gerência", "DMZ", "Visitantes"
  description?: string;
  createdAt: string;
}

export interface Subnet {
  id: string;
  tenantId: string;
  vlanId?: string; // reference to Vlan id
  cidr: string; // "192.168.1.0/24", "10.0.0.0/24"
  gateway?: string;
  dnsServers?: string[];
  description?: string;
  createdAt: string;
}

export type IpStatus = "USED" | "RESERVED" | "DHCP" | "AVAILABLE" | "CONFLICT" | "UNKNOWN";

export interface IpAddress {
  id: string;
  tenantId: string;
  subnetId: string;
  ipAddress: string;
  status: IpStatus;
  assetId?: string;
  hostname?: string;
  macAddress?: string;
  description?: string;
  updatedAt: string;
}

export interface WanCircuit {
  id: string;
  tenantId: string;
  siteId?: string;
  providerName: string; // e.g. "Claro Fibra", "Vivo Empresas", "Starlink"
  circuitId?: string; // Designador do circuito / ID do cliente
  bandwidthMbps: number; // e.g. 500, 1000
  ipType: "static" | "pppoe" | "dhcp";
  staticIp?: string;
  gateway?: string;
  dnsPrimary?: string;
  supportPhone?: string;
  contractNumber?: string;
  monthlyCostBrl?: number;
  status: "active" | "standby_backup" | "degraded" | "cancelled";
  notes?: string;
  createdAt: string;
}

export interface NetworkStoreData {
  vlans: Vlan[];
  subnets: Subnet[];
  ipAddresses: IpAddress[];
  wanCircuits: WanCircuit[];
}

export class NetworkService {
  // VLANs
  static getVlans(store: NetworkStoreData, tenantId: string): Vlan[] {
    return (store.vlans || []).filter((v) => v.tenantId === tenantId);
  }

  static createVlan(store: NetworkStoreData, tenantId: string, payload: Partial<Vlan>): { vlan?: Vlan; error?: string } {
    const vlanIdNum = Number(payload.vlanId);
    if (!vlanIdNum || vlanIdNum < 1 || vlanIdNum > 4094) {
      return { error: "VLAN ID deve ser um número entre 1 e 4094." };
    }

    const exists = (store.vlans || []).some((v) => v.tenantId === tenantId && v.vlanId === vlanIdNum);
    if (exists) {
      return { error: `VLAN ${vlanIdNum} já está cadastrada para este cliente.` };
    }

    const now = new Date().toISOString();
    const vlan: Vlan = {
      id: `vlan-${Math.random().toString(36).substring(2, 8)}`,
      tenantId,
      vlanId: vlanIdNum,
      name: payload.name || `VLAN ${vlanIdNum}`,
      description: payload.description,
      createdAt: now,
    };

    if (!store.vlans) store.vlans = [];
    store.vlans.push(vlan);
    return { vlan };
  }

  // Subnets
  static getSubnets(store: NetworkStoreData, tenantId: string): Subnet[] {
    return (store.subnets || []).filter((s) => s.tenantId === tenantId);
  }

  static createSubnet(store: NetworkStoreData, tenantId: string, payload: Partial<Subnet>): { subnet?: Subnet; error?: string } {
    if (!payload.cidr || !payload.cidr.includes("/")) {
      return { error: "Formato CIDR inválido. Exemplo: 192.168.10.0/24" };
    }

    const now = new Date().toISOString();
    const subnet: Subnet = {
      id: `sub-${Math.random().toString(36).substring(2, 8)}`,
      tenantId,
      vlanId: payload.vlanId,
      cidr: payload.cidr.trim(),
      gateway: payload.gateway?.trim(),
      dnsServers: payload.dnsServers || ["1.1.1.1", "8.8.8.8"],
      description: payload.description,
      createdAt: now,
    };

    if (!store.subnets) store.subnets = [];
    store.subnets.push(subnet);
    return { subnet };
  }

  // IPAM Addresses
  static getIpAddresses(store: NetworkStoreData, tenantId: string, subnetId?: string): IpAddress[] {
    let list = (store.ipAddresses || []).filter((i) => i.tenantId === tenantId);
    if (subnetId) {
      list = list.filter((i) => i.subnetId === subnetId);
    }
    return list;
  }

  static setIpAllocation(
    store: NetworkStoreData,
    tenantId: string,
    payload: Partial<IpAddress>
  ): { ip?: IpAddress; error?: string } {
    if (!payload.ipAddress || !payload.subnetId) {
      return { error: "Endereço IP e Subnet ID são obrigatórios." };
    }

    const now = new Date().toISOString();
    if (!store.ipAddresses) store.ipAddresses = [];

    let existing = store.ipAddresses.find(
      (i) => i.tenantId === tenantId && i.ipAddress === payload.ipAddress && i.subnetId === payload.subnetId
    );

    if (existing) {
      Object.assign(existing, payload, { updatedAt: now });
      return { ip: existing };
    }

    const newIp: IpAddress = {
      id: `ip-${Math.random().toString(36).substring(2, 8)}`,
      tenantId,
      subnetId: payload.subnetId,
      ipAddress: payload.ipAddress,
      status: payload.status || "USED",
      assetId: payload.assetId,
      hostname: payload.hostname,
      macAddress: payload.macAddress,
      description: payload.description,
      updatedAt: now,
    };

    store.ipAddresses.push(newIp);
    return { ip: newIp };
  }

  // WAN Circuits
  static getWanCircuits(store: NetworkStoreData, tenantId: string): WanCircuit[] {
    return (store.wanCircuits || []).filter((w) => w.tenantId === tenantId);
  }

  static createWanCircuit(store: NetworkStoreData, tenantId: string, payload: Partial<WanCircuit>): WanCircuit {
    const now = new Date().toISOString();
    const circuit: WanCircuit = {
      id: `wan-${Math.random().toString(36).substring(2, 8)}`,
      tenantId,
      siteId: payload.siteId,
      providerName: payload.providerName || "Operadora de Internet",
      circuitId: payload.circuitId,
      bandwidthMbps: Number(payload.bandwidthMbps) || 300,
      ipType: payload.ipType || "static",
      staticIp: payload.staticIp,
      gateway: payload.gateway,
      dnsPrimary: payload.dnsPrimary,
      supportPhone: payload.supportPhone,
      contractNumber: payload.contractNumber,
      monthlyCostBrl: payload.monthlyCostBrl ? Number(payload.monthlyCostBrl) : undefined,
      status: payload.status || "active",
      notes: payload.notes,
      createdAt: now,
    };

    if (!store.wanCircuits) store.wanCircuits = [];
    store.wanCircuits.push(circuit);
    return circuit;
  }
}
