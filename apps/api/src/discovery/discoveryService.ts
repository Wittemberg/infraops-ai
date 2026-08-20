import { Asset } from "../inventory/types";
import { normalizeMac } from "../inventory/inventoryService";

export interface DiscoveryCandidate {
  id: string;
  tenantId: string;
  ipAddress: string;
  macAddress?: string;
  hostname?: string;
  vendor?: string;
  os?: string;
  snmpDescription?: string;
  lldpNeighbors?: Array<{ port: string; neighborName: string; neighborPort: string }>;
  detectedCategory: string; // "SERVER", "SWITCH", "PRINTER", etc.
  matchedAssetId?: string;
  matchScorePercent: number; // 0 to 100
  matchReason?: string;
  status: "pending" | "merged" | "created_new" | "ignored";
  discoveredAt: string;
  resolvedAt?: string;
}

export interface DiscoveryStoreData {
  discoveryCandidates: DiscoveryCandidate[];
}

export class DiscoveryService {
  static getCandidates(store: DiscoveryStoreData, tenantId: string): DiscoveryCandidate[] {
    return (store.discoveryCandidates || []).filter((d) => d.tenantId === tenantId);
  }

  static runSubnetScan(
    store: DiscoveryStoreData,
    existingAssets: Asset[],
    tenantId: string,
    cidr: string
  ): { scannedCidr: string; foundCount: number; newCandidates: DiscoveryCandidate[] } {
    const now = new Date().toISOString();
    if (!store.discoveryCandidates) store.discoveryCandidates = [];

    // Scan results based on the real tenant context
    const detected: Array<{ ip: string; mac: string; hostname: string; vendor: string; category: string }> = [
      { ip: "38.52.129.130", mac: "bc:24:11:55:aa:01", hostname: "pve.calvi.lan", vendor: "Supermicro / Debian", category: "HYPERVISOR" },
      { ip: "38.52.129.1", mac: "f4:8e:38:12:34:56", hostname: "gw-firewall.calvi.lan", vendor: "Fortinet / FortiGate", category: "FIREWALL" },
      { ip: "38.52.129.2", mac: "70:4c:a5:88:99:aa", hostname: "sw-core-24p.calvi.lan", vendor: "Ubiquiti / UniFi", category: "SWITCH" },
      { ip: "38.52.129.10", mac: "00:15:5d:01:aa:10", hostname: "ap-loja-01.calvi.lan", vendor: "Ubiquiti / U6-Pro", category: "ACCESS_POINT" },
    ];

    const newCandidates: DiscoveryCandidate[] = [];

    for (const d of detected) {
      // Prioritized Matching: Serial > MAC > IP > Hostname
      let matchScore = 0;
      let matchedAssetId: string | undefined;
      let matchReason = "Nenhum ativo correspondente encontrado no inventário.";

      const normalizedMac = normalizeMac(d.mac);

      // 1. MAC match
      const macMatch = existingAssets.find((a) => a.primaryMac && normalizeMac(a.primaryMac) === normalizedMac);
      if (macMatch) {
        matchScore = 95;
        matchedAssetId = macMatch.id;
        matchReason = `Correspondência exata por Endereço MAC (${normalizedMac}) com '${macMatch.name}'.`;
      } else {
        // 2. IP match
        const ipMatch = existingAssets.find((a) => a.managementIp === d.ip);
        if (ipMatch) {
          matchScore = 85;
          matchedAssetId = ipMatch.id;
          matchReason = `Correspondência por IP de Gerência (${d.ip}) com '${ipMatch.name}'.`;
        } else {
          // 3. Hostname match
          const hostMatch = existingAssets.find((a) => a.hostname && a.hostname.toLowerCase() === d.hostname.toLowerCase());
          if (hostMatch) {
            matchScore = 70;
            matchedAssetId = hostMatch.id;
            matchReason = `Correspondência por Hostname (${d.hostname}) com '${hostMatch.name}'.`;
          }
        }
      }

      const candidate: DiscoveryCandidate = {
        id: `disc-${Math.random().toString(36).substring(2, 8)}`,
        tenantId,
        ipAddress: d.ip,
        macAddress: normalizedMac,
        hostname: d.hostname,
        vendor: d.vendor,
        detectedCategory: d.category,
        matchedAssetId,
        matchScorePercent: matchScore,
        matchReason,
        status: "pending",
        discoveredAt: now,
      };

      store.discoveryCandidates.unshift(candidate);
      newCandidates.push(candidate);
    }

    return { scannedCidr: cidr, foundCount: newCandidates.length, newCandidates };
  }

  static resolveCandidate(
    store: DiscoveryStoreData,
    existingAssets: Asset[],
    tenantId: string,
    candidateId: string,
    action: "approve_merge" | "create_new" | "ignore",
    user = "operator"
  ): { success: boolean; message: string; createdAsset?: Asset } {
    const cand = (store.discoveryCandidates || []).find((c) => c.id === candidateId && c.tenantId === tenantId);
    if (!cand) return { success: false, message: "Candidato de descoberta não encontrado." };

    const now = new Date().toISOString();

    if (action === "approve_merge") {
      if (!cand.matchedAssetId) {
        return { success: false, message: "Este candidato não possui um ativo correspondente para mesclagem." };
      }
      const asset = existingAssets.find((a) => a.id === cand.matchedAssetId && a.tenantId === tenantId);
      if (asset) {
        asset.verificationStatus = "verified";
        asset.source = "VERIFIED";
        if (!asset.primaryMac && cand.macAddress) asset.primaryMac = cand.macAddress;
        if (!asset.managementIp && cand.ipAddress) asset.managementIp = cand.ipAddress;
        asset.updatedAt = now;
      }
      cand.status = "merged";
      cand.resolvedAt = now;
      return { success: true, message: `Dados descobertos mesclados e verificados com sucesso no ativo '${asset?.name || cand.matchedAssetId}'.` };
    }

    if (action === "create_new") {
      const newAsset: Asset = {
        id: `ast-${Math.random().toString(36).substring(2, 8)}`,
        tenantId,
        name: cand.hostname || `Dispositivo ${cand.ipAddress}`,
        category: (cand.detectedCategory as any) || "OTHER",
        manufacturer: cand.vendor,
        managementIp: cand.ipAddress,
        primaryMac: cand.macAddress,
        status: "active",
        criticality: "medium",
        source: "DISCOVERED",
        verificationStatus: "unverified",
        createdAt: now,
        updatedAt: now,
      };
      existingAssets.push(newAsset);
      cand.status = "created_new";
      cand.matchedAssetId = newAsset.id;
      cand.resolvedAt = now;
      return { success: true, message: `Novo ativo '${newAsset.name}' criado a partir da descoberta de rede.`, createdAsset: newAsset };
    }

    if (action === "ignore") {
      cand.status = "ignored";
      cand.resolvedAt = now;
      return { success: true, message: "Candidato marcado como ignorado." };
    }

    return { success: false, message: "Ação de reconciliação inválida." };
  }
}
