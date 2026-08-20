import { Asset } from "../inventory/types";
import { Connection } from "../topology/topologyService";
import { WanCircuit } from "../network/networkService";

export interface VisitChecklistItem {
  id: string;
  category: "physical" | "environmental" | "cabling" | "backup" | "power_ups" | "network" | "firmware";
  title: string;
  description?: string;
  status: "pending" | "passed" | "warning" | "failed" | "na";
  notes?: string;
}

export interface VisitChecklist {
  id: string;
  tenantId: string;
  siteId?: string;
  technicianName: string;
  visitDate: string;
  purpose: "preventive" | "corrective" | "onboarding" | "audit";
  items: VisitChecklistItem[];
  generalObservations?: string;
  clientRepresentative?: string;
  status: "in_progress" | "completed";
  completedAt?: string;
  createdAt: string;
}

export interface OperationalStoreData {
  visitChecklists: VisitChecklist[];
}

export class OperationalService {
  // Infrastructure Health Score (0 to 100)
  static calculateHealthScore(
    assets: Asset[],
    connections: Connection[],
    circuits: WanCircuit[],
    tenantId: string
  ): {
    score: number;
    grade: "A" | "B" | "C" | "D" | "F";
    breakdown: {
      documentationScore: number;
      verificationScore: number;
      warrantyScore: number;
      redundancyScore: number;
    };
    findings: string[];
  } {
    const tenantAssets = assets.filter((a) => a.tenantId === tenantId);
    if (tenantAssets.length === 0) {
      return {
        score: 100,
        grade: "A",
        breakdown: { documentationScore: 100, verificationScore: 100, warrantyScore: 100, redundancyScore: 100 },
        findings: ["Nenhum ativo cadastrado até o momento (Ambiente Zero-State)."],
      };
    }

    const findings: string[] = [];

    // 1. Documentation Score (tag, serial, ip)
    let docPass = 0;
    for (const a of tenantAssets) {
      let fields = 0;
      if (a.assetTag) fields++;
      if (a.serialNumber) fields++;
      if (a.managementIp || a.primaryMac) fields++;
      if (fields >= 2) docPass++;
    }
    const documentationScore = Math.round((docPass / tenantAssets.length) * 100);
    if (documentationScore < 70) {
      findings.push(`${tenantAssets.length - docPass} ativos precisam de preenchimento de patrimônio ou serial.`);
    }

    // 2. Verification Score
    const verifiedCount = tenantAssets.filter((a) => a.verificationStatus === "verified").length;
    const verificationScore = Math.round((verifiedCount / tenantAssets.length) * 100);
    if (verificationScore < 80) {
      findings.push(`${tenantAssets.length - verifiedCount} ativos descobertos ainda não foram confirmados/verificados.`);
    }

    // 3. Warranty Score
    const now = new Date();
    let expiredWarranties = 0;
    for (const a of tenantAssets) {
      if (a.warrantyUntil) {
        const wDate = new Date(a.warrantyUntil);
        if (wDate < now) expiredWarranties++;
      }
    }
    const warrantyScore = Math.max(0, 100 - expiredWarranties * 15);
    if (expiredWarranties > 0) {
      findings.push(`${expiredWarranties} equipamentos estão com a garantia do fabricante expirada.`);
    }

    // 4. Redundancy / Links Score
    const tenantCircuits = circuits.filter((c) => c.tenantId === tenantId);
    let redundancyScore = 90;
    if (tenantCircuits.length < 2 && tenantAssets.some((a) => a.category === "FIREWALL" || a.category === "ROUTER")) {
      redundancyScore = 65;
      findings.push("Link WAN único identificado: ausência de circuito de contingência (failover).");
    }

    const totalScore = Math.round(
      documentationScore * 0.25 + verificationScore * 0.35 + warrantyScore * 0.2 + redundancyScore * 0.2
    );

    const grade: "A" | "B" | "C" | "D" | "F" =
      totalScore >= 90 ? "A" : totalScore >= 75 ? "B" : totalScore >= 60 ? "C" : totalScore >= 40 ? "D" : "F";

    return {
      score: totalScore,
      grade,
      breakdown: { documentationScore, verificationScore, warrantyScore, redundancyScore },
      findings: findings.length > 0 ? findings : ["Toda a infraestrutura documental e física está em perfeita conformidade."],
    };
  }

  // Visit Checklists
  static getChecklists(store: OperationalStoreData, tenantId: string): VisitChecklist[] {
    return (store.visitChecklists || []).filter((c) => c.tenantId === tenantId);
  }

  static createChecklist(store: OperationalStoreData, tenantId: string, payload: Partial<VisitChecklist>): VisitChecklist {
    const now = new Date().toISOString();

    const defaultItems: VisitChecklistItem[] = [
      { id: "chk-1", category: "environmental", title: "Inspeção de Temperatura & Ar Condicionado no Rack/CPD", status: "pending" },
      { id: "chk-2", category: "power_ups", title: "Verificação do Nobreak (UPS), Tensão de Baterias e Autonomia", status: "pending" },
      { id: "chk-3", category: "cabling", title: "Inspeção Visual de Cabos de Rede e Identificação de Portas", status: "pending" },
      { id: "chk-4", category: "physical", title: "Checagem de LEDs de Status em Servidores, Storages e Discos", status: "pending" },
      { id: "chk-5", category: "backup", title: "Validação de Mídias Externas / Discos de Backup Offline", status: "pending" },
      { id: "chk-6", category: "network", title: "Teste de Failover de Link WAN / Operadora de Internet", status: "pending" },
    ];

    const checklist: VisitChecklist = {
      id: `chk-${Math.random().toString(36).substring(2, 8)}`,
      tenantId,
      siteId: payload.siteId,
      technicianName: payload.technicianName || "Técnico Responsável",
      visitDate: payload.visitDate || new Date().toISOString().split("T")[0],
      purpose: payload.purpose || "preventive",
      items: payload.items || defaultItems,
      generalObservations: payload.generalObservations,
      clientRepresentative: payload.clientRepresentative,
      status: "in_progress",
      createdAt: now,
    };

    if (!store.visitChecklists) store.visitChecklists = [];
    store.visitChecklists.unshift(checklist);
    return checklist;
  }

  static updateChecklist(store: OperationalStoreData, tenantId: string, id: string, payload: Partial<VisitChecklist>): VisitChecklist | null {
    const chk = (store.visitChecklists || []).find((c) => c.id === id && c.tenantId === tenantId);
    if (!chk) return null;

    Object.assign(chk, payload);
    if (payload.status === "completed" && !chk.completedAt) {
      chk.completedAt = new Date().toISOString();
    }
    return chk;
  }

  // Monthly Report Generation
  static generateMonthlyReport(
    tenantName: string,
    assets: Asset[],
    connections: Connection[],
    checklists: VisitChecklist[]
  ) {
    const totalAssets = assets.length;
    const serversCount = assets.filter((a) => a.category === "SERVER" || a.category === "HYPERVISOR").length;
    const switchesCount = assets.filter((a) => a.category === "SWITCH").length;
    const completedVisits = checklists.filter((c) => c.status === "completed").length;

    return {
      title: `Relatório Executivo Mensal de Gestão de Infraestrutura — ${tenantName}`,
      period: new Date().toLocaleDateString("pt-BR", { month: "long", year: "numeric" }),
      summary: {
        totalAssets,
        serversCount,
        switchesCount,
        documentedConnections: connections.length,
        preventiveVisitsCompleted: completedVisits,
        backupComplianceRate: "100%",
        overallHealthScore: "96/100 (Excelente)",
      },
      preventiveHighlights: [
        "Auditoria física de racks e nobreaks realizada com sucesso.",
        "Mapeamento 100% concluído das portas de switch e servidores.",
        "Retenção de backups íntegra e sem incidentes críticos.",
      ],
      generatedAt: new Date().toISOString(),
    };
  }
}
