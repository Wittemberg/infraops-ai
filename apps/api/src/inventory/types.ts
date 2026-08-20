export type ProvenanceSource = "MANUAL" | "DISCOVERED" | "VERIFIED";
export type VerificationStatus = "unverified" | "verified" | "conflict";
export type AssetStatus = "active" | "maintenance" | "spare" | "decommissioned" | "failed";
export type AssetCriticality = "low" | "medium" | "high" | "critical";

export type AssetCategory =
  | "SERVER"
  | "HYPERVISOR"
  | "SWITCH"
  | "FIREWALL"
  | "ROUTER"
  | "ACCESS_POINT"
  | "STORAGE"
  | "NAS"
  | "UPS"
  | "PDU"
  | "PATCH_PANEL"
  | "MODEM"
  | "ONT"
  | "NVR"
  | "CAMERA"
  | "PRINTER"
  | "APPLIANCE"
  | "OTHER";

export interface Site {
  id: string;
  tenantId: string;
  name: string;
  code?: string;
  address?: string;
  contactName?: string;
  contactPhone?: string;
  contactEmail?: string;
  isPrimary?: boolean;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Location {
  id: string;
  tenantId: string;
  siteId: string;
  name: string;
  floor?: string;
  room?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Rack {
  id: string;
  tenantId: string;
  siteId: string;
  locationId: string;
  name: string;
  heightU: number; // e.g. 42
  widthMm?: number; // e.g. 600 or 800
  depthMm?: number; // e.g. 1000
  maxWeightKg?: number;
  status: "active" | "planned" | "reserved" | "decommissioned";
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface RackPosition {
  startU: number; // 1-indexed
  heightU: number; // e.g. 1, 2, 4
  face: "front" | "rear" | "both";
}

export interface Asset {
  id: string;
  tenantId: string;
  siteId?: string;
  locationId?: string;
  rackId?: string;
  rackPosition?: RackPosition;
  name: string;
  assetTag?: string;
  category: AssetCategory;
  manufacturer?: string;
  model?: string;
  serialNumber?: string;
  hostname?: string;
  managementIp?: string;
  primaryMac?: string;
  status: AssetStatus;
  criticality: AssetCriticality;
  purchaseDate?: string;
  purchaseValue?: number;
  warrantyUntil?: string;
  supplier?: string;
  notes?: string;
  source: ProvenanceSource;
  verificationStatus: VerificationStatus;
  nodeLinkId?: string; // Link to existing logical node (e.g. 'pve')
  createdAt: string;
  updatedAt: string;
}

export interface AssetDocument {
  id: string;
  tenantId: string;
  assetId: string;
  title: string;
  docType: "manual" | "invoice" | "diagram" | "warranty" | "contract" | "other";
  fileUrl: string;
  fileSizeBytes?: number;
  notes?: string;
  createdAt: string;
}

export interface AssetTimelineEvent {
  id: string;
  tenantId: string;
  assetId: string;
  eventType: "created" | "updated" | "moved" | "maintenance" | "incident" | "action_executed" | "verified";
  description: string;
  performedBy: string;
  createdAt: string;
}

export interface AssetResourceLink {
  id: string;
  tenantId: string;
  assetId: string;
  resourceType: "node" | "workload" | "storage";
  resourceId: string;
  notes?: string;
  createdAt: string;
}
