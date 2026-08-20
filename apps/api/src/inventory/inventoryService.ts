import { Site, Location, Rack, Asset, AssetDocument, AssetTimelineEvent, AssetResourceLink } from "./types";

export interface InventoryStoreData {
  sites: Site[];
  locations: Location[];
  racks: Rack[];
  assets: Asset[];
  documents: AssetDocument[];
  timelineEvents: AssetTimelineEvent[];
  resourceLinks: AssetResourceLink[];
}

export function normalizeMac(mac?: string): string | undefined {
  if (!mac) return undefined;
  const cleaned = mac.replace(/[^a-fA-F0-9]/g, "").toLowerCase();
  if (cleaned.length !== 12) return mac; // Return original if not 12 hex chars
  return cleaned.match(/.{1,2}/g)?.join(":") || mac;
}

export function validateRackOverlap(
  racks: Rack[],
  assets: Asset[],
  rackId: string,
  startU: number,
  heightU: number,
  face: "front" | "rear" | "both",
  currentAssetId?: string
): { valid: boolean; error?: string } {
  const rack = racks.find((r) => r.id === rackId);
  if (!rack) return { valid: false, error: "Rack não encontrado." };

  if (startU < 1 || startU + heightU - 1 > rack.heightU) {
    return {
      valid: false,
      error: `Posição U inválida. O rack possui ${rack.heightU}U (solicitado: U${startU} até U${startU + heightU - 1}).`,
    };
  }

  const endU = startU + heightU - 1;
  const occupyingAssets = assets.filter(
    (a) => a.rackId === rackId && a.rackPosition && a.id !== currentAssetId
  );

  for (const existing of occupyingAssets) {
    const exPos = existing.rackPosition!;
    const exEnd = exPos.startU + exPos.heightU - 1;

    // Check U interval overlap
    const overlapsU = startU <= exEnd && endU >= exPos.startU;
    if (overlapsU) {
      // Check face overlap
      const overlapsFace =
        face === "both" ||
        exPos.face === "both" ||
        face === exPos.face;

      if (overlapsFace) {
        return {
          valid: false,
          error: `Conflito de espaço no rack: a posição U${startU}–U${endU} (${face}) colide com o ativo '${existing.name}' (U${exPos.startU}–U${exEnd}, ${exPos.face}).`,
        };
      }
    }
  }

  return { valid: true };
}

export class InventoryService {
  // Sites
  static getSites(store: InventoryStoreData, tenantId: string): Site[] {
    return (store.sites || []).filter((s) => s.tenantId === tenantId);
  }

  static createSite(store: InventoryStoreData, tenantId: string, payload: Partial<Site>): Site {
    const now = new Date().toISOString();
    const site: Site = {
      id: `site-${Math.random().toString(36).substring(2, 8)}`,
      tenantId,
      name: payload.name || "Novo Site",
      code: payload.code,
      address: payload.address,
      contactName: payload.contactName,
      contactPhone: payload.contactPhone,
      contactEmail: payload.contactEmail,
      isPrimary: Boolean(payload.isPrimary),
      notes: payload.notes,
      createdAt: now,
      updatedAt: now,
    };
    if (!store.sites) store.sites = [];
    store.sites.push(site);
    return site;
  }

  static updateSite(store: InventoryStoreData, tenantId: string, id: string, payload: Partial<Site>): Site | null {
    const site = (store.sites || []).find((s) => s.id === id && s.tenantId === tenantId);
    if (!site) return null;
    Object.assign(site, payload, { updatedAt: new Date().toISOString() });
    return site;
  }

  static deleteSite(store: InventoryStoreData, tenantId: string, id: string): { success: boolean; error?: string } {
    const hasLocations = (store.locations || []).some((l) => l.siteId === id && l.tenantId === tenantId);
    const hasAssets = (store.assets || []).some((a) => a.siteId === id && a.tenantId === tenantId);
    if (hasLocations || hasAssets) {
      return { success: false, error: "Não é possível excluir um site que possui locais ou ativos vinculados." };
    }
    store.sites = (store.sites || []).filter((s) => !(s.id === id && s.tenantId === tenantId));
    return { success: true };
  }

  // Locations
  static getLocations(store: InventoryStoreData, tenantId: string, siteId?: string): Location[] {
    return (store.locations || []).filter(
      (l) => l.tenantId === tenantId && (!siteId || l.siteId === siteId)
    );
  }

  static createLocation(store: InventoryStoreData, tenantId: string, payload: Partial<Location>): Location {
    const now = new Date().toISOString();
    const loc: Location = {
      id: `loc-${Math.random().toString(36).substring(2, 8)}`,
      tenantId,
      siteId: payload.siteId || "",
      name: payload.name || "Sala do Servidor / CPD",
      floor: payload.floor,
      room: payload.room,
      notes: payload.notes,
      createdAt: now,
      updatedAt: now,
    };
    if (!store.locations) store.locations = [];
    store.locations.push(loc);
    return loc;
  }

  // Racks
  static getRacks(store: InventoryStoreData, tenantId: string): Rack[] {
    return (store.racks || []).filter((r) => r.tenantId === tenantId);
  }

  static createRack(store: InventoryStoreData, tenantId: string, payload: Partial<Rack>): Rack {
    const now = new Date().toISOString();
    const rack: Rack = {
      id: `rack-${Math.random().toString(36).substring(2, 8)}`,
      tenantId,
      siteId: payload.siteId || "",
      locationId: payload.locationId || "",
      name: payload.name || "Rack Principal 42U",
      heightU: Number(payload.heightU) || 42,
      widthMm: payload.widthMm || 600,
      depthMm: payload.depthMm || 1000,
      maxWeightKg: payload.maxWeightKg,
      status: payload.status || "active",
      notes: payload.notes,
      createdAt: now,
      updatedAt: now,
    };
    if (!store.racks) store.racks = [];
    store.racks.push(rack);
    return rack;
  }

  // Assets
  static getAssets(store: InventoryStoreData, tenantId: string, filter?: { query?: string; category?: string; status?: string }): Asset[] {
    let list = (store.assets || []).filter((a) => a.tenantId === tenantId);
    if (filter?.category) {
      list = list.filter((a) => a.category === filter.category);
    }
    if (filter?.status) {
      list = list.filter((a) => a.status === filter.status);
    }
    if (filter?.query) {
      const q = filter.query.toLowerCase();
      list = list.filter(
        (a) =>
          a.name.toLowerCase().includes(q) ||
          (a.assetTag && a.assetTag.toLowerCase().includes(q)) ||
          (a.serialNumber && a.serialNumber.toLowerCase().includes(q)) ||
          (a.hostname && a.hostname.toLowerCase().includes(q)) ||
          (a.managementIp && a.managementIp.includes(q)) ||
          (a.primaryMac && a.primaryMac.toLowerCase().includes(q))
      );
    }
    return list;
  }

  static getAssetById(store: InventoryStoreData, tenantId: string, id: string): Asset | null {
    return (store.assets || []).find((a) => a.id === id && a.tenantId === tenantId) || null;
  }

  static createAsset(store: InventoryStoreData, tenantId: string, payload: Partial<Asset>, user = "system"): { asset?: Asset; error?: string } {
    if (!payload.name) return { error: "O nome do ativo é obrigatório." };

    // Check rack overlap if placed in a rack
    if (payload.rackId && payload.rackPosition) {
      const overlapCheck = validateRackOverlap(
        store.racks || [],
        store.assets || [],
        payload.rackId,
        payload.rackPosition.startU,
        payload.rackPosition.heightU,
        payload.rackPosition.face
      );
      if (!overlapCheck.valid) {
        return { error: overlapCheck.error };
      }
    }

    const now = new Date().toISOString();
    const asset: Asset = {
      id: `ast-${Math.random().toString(36).substring(2, 8)}`,
      tenantId,
      siteId: payload.siteId,
      locationId: payload.locationId,
      rackId: payload.rackId,
      rackPosition: payload.rackPosition,
      name: payload.name.trim(),
      assetTag: payload.assetTag?.trim(),
      category: payload.category || "SERVER",
      manufacturer: payload.manufacturer?.trim(),
      model: payload.model?.trim(),
      serialNumber: payload.serialNumber?.trim(),
      hostname: payload.hostname?.trim(),
      managementIp: payload.managementIp?.trim(),
      primaryMac: normalizeMac(payload.primaryMac),
      status: payload.status || "active",
      criticality: payload.criticality || "medium",
      purchaseDate: payload.purchaseDate,
      purchaseValue: payload.purchaseValue ? Number(payload.purchaseValue) : undefined,
      warrantyUntil: payload.warrantyUntil,
      supplier: payload.supplier?.trim(),
      notes: payload.notes?.trim(),
      source: payload.source || "MANUAL",
      verificationStatus: payload.verificationStatus || "verified",
      nodeLinkId: payload.nodeLinkId,
      createdAt: now,
      updatedAt: now,
    };

    if (!store.assets) store.assets = [];
    store.assets.push(asset);

    // Record timeline
    if (!store.timelineEvents) store.timelineEvents = [];
    store.timelineEvents.push({
      id: `evt-${Date.now()}`,
      tenantId,
      assetId: asset.id,
      eventType: "created",
      description: `Ativo '${asset.name}' cadastrado no inventário como ${asset.category}.`,
      performedBy: user,
      createdAt: now,
    });

    return { asset };
  }

  static updateAsset(store: InventoryStoreData, tenantId: string, id: string, payload: Partial<Asset>, user = "system"): { asset?: Asset; error?: string } {
    const asset = (store.assets || []).find((a) => a.id === id && a.tenantId === tenantId);
    if (!asset) return { error: "Ativo não encontrado." };

    if (payload.rackId && payload.rackPosition) {
      const overlapCheck = validateRackOverlap(
        store.racks || [],
        store.assets || [],
        payload.rackId,
        payload.rackPosition.startU,
        payload.rackPosition.heightU,
        payload.rackPosition.face,
        asset.id
      );
      if (!overlapCheck.valid) {
        return { error: overlapCheck.error };
      }
    }

    if (payload.primaryMac) {
      payload.primaryMac = normalizeMac(payload.primaryMac);
    }

    const now = new Date().toISOString();
    Object.assign(asset, payload, { updatedAt: now });

    if (!store.timelineEvents) store.timelineEvents = [];
    store.timelineEvents.push({
      id: `evt-${Date.now()}`,
      tenantId,
      assetId: asset.id,
      eventType: "updated",
      description: `Ativo '${asset.name}' atualizado.`,
      performedBy: user,
      createdAt: now,
    });

    return { asset };
  }

  static deleteAsset(store: InventoryStoreData, tenantId: string, id: string): { success: boolean; error?: string } {
    const asset = (store.assets || []).find((a) => a.id === id && a.tenantId === tenantId);
    if (!asset) return { success: false, error: "Ativo não encontrado." };

    store.assets = (store.assets || []).filter((a) => a.id !== id);
    store.timelineEvents = (store.timelineEvents || []).filter((t) => t.assetId !== id);
    store.documents = (store.documents || []).filter((d) => d.assetId !== id);
    return { success: true };
  }

  // QR Mobile Payload
  static getQrPayload(asset: Asset): { qrString: string; mobileUrl: string } {
    const baseUrl = "https://infraopsai.awecloudsolution.com";
    const mobileUrl = `${baseUrl}/inventory/asset/${asset.id}?tenant=${asset.tenantId}`;
    const qrString = JSON.stringify({
      infraops: "asset_v1",
      id: asset.id,
      name: asset.name,
      tag: asset.assetTag,
      serial: asset.serialNumber,
      ip: asset.managementIp,
      mac: asset.primaryMac,
      url: mobileUrl,
    });
    return { qrString, mobileUrl };
  }
}
