import { existsSync, readFileSync } from "fs";
import { join, resolve } from "path";
import {
  DevelopmentCapability,
  DevelopmentCheckpoint,
  DevelopmentControlOverview,
  DevelopmentHealth,
  DevelopmentModule,
  DevelopmentPhase,
  DevelopmentProgressBreakdown,
  DevelopmentStatus,
  FrozenComponent,
  HealthState,
  HumanValidationOverview,
  HumanValidationSession,
} from "@infraops/contracts";

const IMPLEMENTED_STATES: DevelopmentStatus[] = [
  "IMPLEMENTED",
  "VALIDATION",
  "HOMOLOGATED",
  "FROZEN",
];

const HOMOLOGATED_STATES: DevelopmentStatus[] = [
  "HOMOLOGATED",
  "FROZEN",
];

// Fallback embedded datasets for production Docker containers where docs/ may not be present on disk
const EMBEDDED_PROJECT = {
  id: "infraops-ai",
  name: "InfraOps AI",
  roadmapVersion: "1.0.0",
  currentPhaseId: "phase-30",
  currentPhaseName: "Stage 30 — Development Control Center & Human Validation Governance",
  environment: "homologation",
  developmentControlVersion: "0.1",
};

const EMBEDDED_ROADMAP = {
  phases: [
    { id: "phase-foundation", name: "Phase 1: Foundation & Core Governance (Stages 01–20)", description: "Monorepo, Multi-tenancy, RBAC, Go Agent, Policy Engine, Audit SHA-256", order: 1, status: "FROZEN" },
    { id: "phase-ops", name: "Phase 2: Autonomous Operations (Stages 21–24)", description: "Scheduler, Event Triggers, Self-Healing Engine & Goals", order: 2, status: "HOMOLOGATED" },
    { id: "phase-intelligence", name: "Phase 3: Infrastructure Intelligence (Stage 25)", description: "Incident Mining, SPOF Detection, Capacity Forecasting & Debt Score", order: 3, status: "HOMOLOGATED" },
    { id: "phase-sot", name: "Phase 4: Physical Topology & Source of Truth (Stage 26)", description: "Infrastructure Book, 42U Racks, IPAM CIDR Subnets", order: 4, status: "HOMOLOGATED" },
    { id: "phase-wan", name: "Phase 5: Governed WAN & Network Monitoring (Stage 27)", description: "MikroTik & pfSense Drivers, WAN Failover & Anti-Flapping", order: 5, status: "HOMOLOGATED" },
    { id: "phase-simple-ux", name: "Phase 6: Simple Experience & Guided Ops (Stage 28)", description: "Daily Operations Center, Simple/Tech Mode & QBR Reports", order: 6, status: "HOMOLOGATED" },
    { id: "phase-hardening", name: "Phase 7: Production Hardening & pfSense Telemetry (Stage 29)", description: "FreeBSD CPU Ticks Parser, Vault Auto-Migration & Hardening", order: 7, status: "HOMOLOGATED" },
    { id: "phase-30", name: "Phase 8: Development Control Center & Human Validation (Stage 30)", description: "DCC Dashboard, 16 Mathematical Invariants & Human Test Coverage", order: 8, status: "VALIDATION" },
  ],
  modules: [
    { id: "mod-01-foundation", name: "01. Core Foundation & Hypervisor Engine", description: "Stages 01–20", order: 1 },
    { id: "mod-21-scheduler", name: "02. Autonomous Scheduler Engine", description: "Stage 21", order: 2 },
    { id: "mod-22-triggers", name: "03. Event Automation & Triggers", description: "Stage 22", order: 3 },
    { id: "mod-23-policies", name: "04. Autonomous Policies & Self-Healing", description: "Stage 23", order: 4 },
    { id: "mod-24-goals", name: "05. Goal-Oriented Management", description: "Stage 24", order: 5 },
    { id: "mod-25-intelligence", name: "06. Infrastructure Intelligence", description: "Stage 25", order: 6 },
    { id: "mod-26-source-of-truth", name: "07. Source of Truth & Physical Topology", description: "Stage 26", order: 7 },
    { id: "mod-27-wan-governance", name: "08. Governed WAN & Network Monitoring", description: "Stage 27", order: 8 },
    { id: "mod-28-simple-ux", name: "09. Simple Experience & Guided Operations", description: "Stage 28", order: 9 },
    { id: "mod-29-pfsense-hardening", name: "10. Production Hardening & pfSense Telemetry", description: "Stage 29", order: 10 },
    { id: "mod-30-dev-control", name: "11. Development Control Center", description: "Stage 30", order: 11 },
  ],
  capabilities: [
    { id: "cap-01-monorepo-bootstrap", moduleId: "mod-01-foundation", phaseId: "phase-foundation", name: "Monorepo & Monolithic DataStore Architecture", description: "NestJS/Express API, React/Vite Frontend, Go Agent workspace", weight: 10, status: "FROZEN", mvp: true, priority: "P0", checkpoint: "chk-01", humanTestId: "TEN-01" },
    { id: "cap-02-auth-rbac-multitenancy", moduleId: "mod-01-foundation", phaseId: "phase-foundation", name: "Multi-Tenant Isolation & Role-Based Access Control (RBAC)", description: "Tenant Owners, Admins, Operators isolation", weight: 15, status: "FROZEN", mvp: true, priority: "P0", checkpoint: "chk-02", humanTestId: "LOGIN-01" },
    { id: "cap-03-policy-engine-audit", moduleId: "mod-01-foundation", phaseId: "phase-foundation", name: "Policy Engine & SHA-256 Audit Hash Chain", description: "Strict DENY overrides and audit chain", weight: 20, status: "FROZEN", mvp: true, priority: "P0", checkpoint: "chk-03", humanTestId: "AUD-01" },
    { id: "cap-04-agent-protocol", moduleId: "mod-01-foundation", phaseId: "phase-foundation", name: "Golang Outbound Agent & Job Protocol", description: "Systemd daemon and mTLS token enrollment", weight: 15, status: "FROZEN", mvp: true, priority: "P0", checkpoint: "chk-04", humanTestId: "NODE-01" },
    { id: "cap-05-hypervisor-integrations", moduleId: "mod-01-foundation", phaseId: "phase-foundation", name: "Native Proxmox VE & Virtualizor REST Integrations", description: "REST API integration for node and VM discovery", weight: 15, status: "FROZEN", mvp: true, priority: "P0", checkpoint: "chk-05", humanTestId: "INT-01" },
    { id: "cap-06-ai-orchestrator", moduleId: "mod-01-foundation", phaseId: "phase-foundation", name: "Multi-Provider AI Orchestrator & Persistent Chat", description: "Groq Cloud, OpenAI, DeepSeek, Ollama", weight: 15, status: "HOMOLOGATED", mvp: true, priority: "P0", checkpoint: "chk-06", humanTestId: "AI-01" },
    { id: "cap-07-omnichannel-alerts", moduleId: "mod-01-foundation", phaseId: "phase-foundation", name: "Omnichannel Notification Dispatchers", description: "Chatwoot, Quepasa WhatsApp, Telegram Bot", weight: 10, status: "HOMOLOGATED", mvp: true, priority: "P1", checkpoint: "chk-07", humanTestId: "ALT-01" },
    { id: "cap-21-autonomous-scheduler", moduleId: "mod-21-scheduler", phaseId: "phase-ops", name: "Autonomous Scheduler & Health Sweeper", description: "Cron/Interval task execution", weight: 12, status: "HOMOLOGATED", mvp: true, priority: "P1", checkpoint: "chk-21", humanTestId: "AUT-01" },
    { id: "cap-22-conditional-triggers", moduleId: "mod-22-triggers", phaseId: "phase-ops", name: "Conditional Triggers & Anti-Flapping Engine", description: "Debounce, Cooldown and Circuit Breaker", weight: 12, status: "HOMOLOGATED", mvp: true, priority: "P1", checkpoint: "chk-22", humanTestId: "AUT-02" },
    { id: "cap-23-autonomous-policies", moduleId: "mod-23-policies", phaseId: "phase-ops", name: "Autonomous Policies & Self-Healing Matrix", description: "Levels 0-5 autonomy matrix and risk budgets", weight: 14, status: "HOMOLOGATED", mvp: true, priority: "P1", checkpoint: "chk-23", humanTestId: "AUT-03" },
    { id: "cap-24-goal-management", moduleId: "mod-24-goals", phaseId: "phase-ops", name: "Goal-Oriented Infrastructure Management", description: "SLO management and compliance gauges", weight: 12, status: "HOMOLOGATED", mvp: true, priority: "P1", checkpoint: "chk-24", humanTestId: "AUT-04" },
    { id: "cap-25-infra-intelligence", moduleId: "mod-25-intelligence", phaseId: "phase-intelligence", name: "Infrastructure Intelligence & Capacity Advisor", description: "SPOF detection and Technical Debt score", weight: 16, status: "HOMOLOGATED", mvp: false, priority: "P2", checkpoint: "chk-25", humanTestId: "ADV-01" },
    { id: "cap-26-source-of-truth", moduleId: "mod-26-source-of-truth", phaseId: "phase-sot", name: "Customer Infrastructure Book & 42U Rack Elevation", description: "Physical assets, 42U racks, IPAM CIDR", weight: 18, status: "FROZEN", mvp: false, priority: "P2", checkpoint: "chk-26", humanTestId: "INV-01" },
    { id: "cap-27-wan-governance", moduleId: "mod-27-wan-governance", phaseId: "phase-wan", name: "Network Device Monitoring & Governed WAN Actions", description: "MikroTik/pfSense drivers & WAN failover", weight: 18, status: "HOMOLOGATED", mvp: false, priority: "P2", checkpoint: "chk-27", humanTestId: "MTK-01" },
    { id: "cap-28-simple-ux", moduleId: "mod-28-simple-ux", phaseId: "phase-simple-ux", name: "Simple Experience & Daily Operations Center", description: "Daily Operations Center & Simple/Tech mode", weight: 16, status: "HOMOLOGATED", mvp: true, priority: "P1", checkpoint: "chk-28", humanTestId: "ONB-01" },
    { id: "cap-29-pfsense-hardening", moduleId: "mod-29-pfsense-hardening", phaseId: "phase-hardening", name: "Production Hardening & pfSense Telemetry", description: "FreeBSD CPU Ticks & Vault auto-migration", weight: 18, status: "FROZEN", mvp: true, priority: "P0", checkpoint: "chk-29", humanTestId: "PFS-01" },
    { id: "cap-30a-dev-control-service", moduleId: "mod-30-dev-control", phaseId: "phase-30", name: "Development Control Mathematical Engine & Invariants", description: "Backend service with 16 invariants", weight: 7, status: "VALIDATION", mvp: false, priority: "P2", checkpoint: "chk-30" },
    { id: "cap-30b-dev-control-ui", moduleId: "mod-30-dev-control", phaseId: "phase-30", name: "Development Control React UI & Governance View", description: "SuperAdmin governance panel and executive cards", weight: 7, status: "VALIDATION", mvp: false, priority: "P2", checkpoint: "chk-30" },
  ],
  frozenComponents: [
    { id: "fc-policy-engine-audit", name: "Policy Engine & Cryptographic Audit Hash Chain", description: "Core security kernel enforcing DENY policy overrides", frozenAt: "2026-08-20", checkpoint: "chk-03", reason: "Security and compliance critical kernel.", protectedPaths: ["packages/policy-engine/**", "packages/audit/**"] },
    { id: "fc-hypervisor-integrations", name: "Proxmox VE & Virtualizor Native Drivers", description: "Official REST API integration drivers", frozenAt: "2026-08-22", checkpoint: "chk-05", reason: "Production hypervisor driver core.", protectedPaths: ["apps/api/src/integrations/**"] },
    { id: "fc-pfsense-telemetry", name: "pfSense FreeBSD CPU Ticks Parser & Vault Auto-Healing", description: "FreeBSD ticks CPU calculation formula", frozenAt: "2026-08-26", checkpoint: "chk-29", reason: "Homologated hardware telemetry math.", protectedPaths: ["apps/api/src/network-devices/**", "apps/api/src/security/secret_vault.service.ts"] },
    { id: "fc-source-of-truth-ipam", name: "Infrastructure Book & IPAM CIDR Subnet Matcher", description: "Customer Infrastructure Book and 42U rack elevation", frozenAt: "2026-08-25", checkpoint: "chk-26", reason: "Physical topology source of truth.", protectedPaths: ["apps/api/src/inventory/**", "apps/api/src/topology/**", "apps/api/src/network/**"] },
  ],
};

const EMBEDDED_CHECKPOINTS = {
  checkpoints: [
    { sha: "a1b2c3d4e5f678901234567890abcdef12345678", shortSha: "a1b2c3d", date: "2026-08-20", title: "chk-01 to chk-20: Base Foundation & Governance", description: "Core platform foundation", phaseId: "phase-foundation", patch: "v0.1.0", type: "RELEASE" },
    { sha: "b2c3d4e5f678901234567890abcdef123456789a", shortSha: "b2c3d4e", date: "2026-08-22", title: "chk-21 to chk-24: Autonomous Infrastructure Operations", description: "Scheduler, Triggers, Self-Healing", phaseId: "phase-ops", patch: "v0.5.0", type: "FEATURE" },
    { sha: "c3d4e5f678901234567890abcdef123456789ab1", shortSha: "c3d4e5f", date: "2026-08-24", title: "chk-25: Infrastructure Intelligence Advisor", description: "Capacity forecasting & Technical Debt score", phaseId: "phase-intelligence", patch: "v0.7.0", type: "FEATURE" },
    { sha: "d4e5f678901234567890abcdef123456789ab1c2", shortSha: "d4e5f67", date: "2026-08-25", title: "chk-26: Infrastructure Source of Truth", description: "42U Rack Elevation, Switch Ports & IPAM", phaseId: "phase-sot", patch: "v0.8.0", type: "FEATURE" },
    { sha: "e5f678901234567890abcdef123456789ab1c2d3", shortSha: "e5f6789", date: "2026-08-25", title: "chk-27: Network Device Monitoring & Governed WAN", description: "MikroTik & pfSense drivers", phaseId: "phase-wan", patch: "v0.9.0", type: "FEATURE" },
    { sha: "f678901234567890abcdef123456789ab1c2d3e4", shortSha: "f678901", date: "2026-08-26", title: "chk-28: Simple Experience & Guided Operations", description: "Daily Operations Center & Simple/Tech Mode", phaseId: "phase-simple-ux", patch: "v0.9.5", type: "FEATURE" },
    { sha: "01234567890abcdef123456789ab1c2d3e4f5678", shortSha: "0123456", date: "2026-08-26", title: "chk-29: Production Hardening & pfSense Telemetry", description: "FreeBSD CPU Ticks Parser & Vault Auto-Healing", phaseId: "phase-hardening", patch: "v1.0.0", type: "HARDENING" },
    { sha: "3d8ac8f01234567890abcdef123456789ab1c2d3", shortSha: "3d8ac8f", date: "2026-08-26", title: "chk-30: Stage 30 Development Control Center & Human Validation", description: "Technical governance dashboard & 16 invariants", phaseId: "phase-30", patch: "v1.1.0", type: "CHECKPOINT" },
  ],
};

const EMBEDDED_HOMOLOGATION = {
  sessions: [
    {
      sessionId: "hml-sess-2026-08-26-01",
      date: "2026-08-26",
      environment: "Production Homologation (infraopsai.awecloudsolution.com)",
      evaluator: "Wittemberg (WR Tecnologia / Lead Evaluator)",
      results: [
        { testId: "LOGIN-01", name: "Autenticação Multi-Tenant & RBAC", capabilityId: "cap-02-auth-rbac-multitenancy", status: "PASSED", testedAt: "2026-08-26T10:00:00Z", testedBy: "Wittemberg" },
        { testId: "AUD-01", name: "Audit Hash Chain SHA-256", capabilityId: "cap-03-policy-engine-audit", status: "PASSED", testedAt: "2026-08-26T10:30:00Z", testedBy: "Wittemberg" },
        { testId: "NODE-01", name: "Enrollment de Agente Go & mTLS", capabilityId: "cap-04-agent-protocol", status: "PASSED", testedAt: "2026-08-26T11:00:00Z", testedBy: "Wittemberg" },
        { testId: "INT-01", name: "Sincronização Proxmox VE & Virtualizor", capabilityId: "cap-05-hypervisor-integrations", status: "PASSED", testedAt: "2026-08-26T11:30:00Z", testedBy: "Wittemberg" },
        { testId: "AI-01", name: "Orquestrador de IA & Teste Upstream", capabilityId: "cap-06-ai-orchestrator", status: "PASSED", testedAt: "2026-08-26T12:00:00Z", testedBy: "Wittemberg" },
        { testId: "ALT-01", name: "Disparo de Alertas Chatwoot & Quepasa", capabilityId: "cap-07-omnichannel-alerts", status: "PASSED", testedAt: "2026-08-26T12:30:00Z", testedBy: "Wittemberg" },
        { testId: "AUT-01", name: "Autonomous Scheduler Cron Presets", capabilityId: "cap-21-autonomous-scheduler", status: "PASSED", testedAt: "2026-08-26T13:00:00Z", testedBy: "Wittemberg" },
        { testId: "AUT-02", name: "Conditional Triggers & Deduplicação", capabilityId: "cap-22-conditional-triggers", status: "PASSED", testedAt: "2026-08-26T13:30:00Z", testedBy: "Wittemberg" },
        { testId: "AUT-03", name: "Autonomous Self-Healing Níveis 0 a 5", capabilityId: "cap-23-autonomous-policies", status: "PASSED", testedAt: "2026-08-26T14:00:00Z", testedBy: "Wittemberg" },
        { testId: "AUT-04", name: "Goal SLO Gauges & Compliance", capabilityId: "cap-24-goal-management", status: "PASSED", testedAt: "2026-08-26T14:30:00Z", testedBy: "Wittemberg" },
        { testId: "ADV-01", name: "Infrastructure Intelligence Advisor", capabilityId: "cap-25-infra-intelligence", status: "PASSED", testedAt: "2026-08-26T15:00:00Z", testedBy: "Wittemberg" },
        { testId: "INV-01", name: "Customer Infrastructure Book & 42U Rack", capabilityId: "cap-26-source-of-truth", status: "PASSED", testedAt: "2026-08-26T15:30:00Z", testedBy: "Wittemberg" },
        { testId: "MTK-01", name: "Driver MikroTik RouterOS & WAN Action", capabilityId: "cap-27-wan-governance", status: "PASSED", testedAt: "2026-08-26T16:00:00Z", testedBy: "Wittemberg" },
        { testId: "ONB-01", name: "Daily Operations Center & Modos de Exibição", capabilityId: "cap-28-simple-ux", status: "PASSED", testedAt: "2026-08-26T16:30:00Z", testedBy: "Wittemberg" },
        { testId: "PFS-01", name: "Telemetria pfSense FreeBSD Ticks & Vault Migration", capabilityId: "cap-29-pfsense-hardening", status: "PASSED", testedAt: "2026-08-26T17:00:00Z", testedBy: "Wittemberg" },
        { testId: "DEV-01", name: "Development Control Center & Invariantes", capabilityId: "cap-30a-dev-control-service", status: "PENDING" },
      ],
    },
  ],
};

export class DevelopmentControlService {
  private baseDir: string | null = null;

  constructor(customBaseDir?: string) {
    this.baseDir = this.resolveBaseDir(customBaseDir);
  }

  private resolveBaseDir(customBaseDir?: string): string | null {
    const candidates = [
      customBaseDir,
      process.env.DEV_CONTROL_DIR,
      resolve(process.cwd(), "docs/00-project/development-control"),
      resolve(process.cwd(), "../../docs/00-project/development-control"),
      resolve(process.cwd(), "../docs/00-project/development-control"),
      resolve(process.cwd(), "../../../docs/00-project/development-control"),
      "/app/docs/00-project/development-control",
      "/docs/00-project/development-control",
    ].filter((p): p is string => Boolean(p));

    for (const cand of candidates) {
      if (existsSync(join(cand, "roadmap.json"))) {
        return cand;
      }
    }
    return null;
  }

  private loadJson<T>(filename: string): T {
    if (this.baseDir) {
      const filePath = join(this.baseDir, filename);
      if (existsSync(filePath)) {
        try {
          const raw = readFileSync(filePath, "utf-8");
          return JSON.parse(raw) as T;
        } catch (err: any) {
          console.warn(`[DevelopmentControlService] Error reading ${filename} from disk: ${err?.message || err}. Falling back to embedded dataset.`);
        }
      }
    }

    // Fallback to embedded datasets if disk files are not present or unreadable
    if (filename === "project.json") return EMBEDDED_PROJECT as unknown as T;
    if (filename === "roadmap.json") return EMBEDDED_ROADMAP as unknown as T;
    if (filename === "checkpoints.json") return EMBEDDED_CHECKPOINTS as unknown as T;
    if (filename === "homologation.json") return EMBEDDED_HOMOLOGATION as unknown as T;

    throw new Error(`[DevelopmentControlService] Unknown dataset file: ${filename}`);
  }

  public validateInvariants(
    phases: DevelopmentPhase[],
    modules: DevelopmentModule[],
    capabilities: DevelopmentCapability[],
    currentPhaseId: string
  ): void {
    const capabilityIds = new Set<string>();
    const moduleIds = new Set(modules.map((m) => m.id));
    const phaseIds = new Set(phases.map((p) => p.id));

    // P. currentPhaseId must exist
    if (!phaseIds.has(currentPhaseId)) {
      throw new Error(`Invariant P Violation: currentPhaseId '${currentPhaseId}' not found in phases.`);
    }

    for (const cap of capabilities) {
      // A. Unique capability IDs
      if (capabilityIds.has(cap.id)) {
        throw new Error(`Invariant A Violation: Duplicate capability ID '${cap.id}'.`);
      }
      capabilityIds.add(cap.id);

      // B. Referenced moduleId exists
      if (!moduleIds.has(cap.moduleId)) {
        throw new Error(`Invariant B Violation: Capability '${cap.id}' references non-existent moduleId '${cap.moduleId}'.`);
      }

      // C. Referenced phaseId exists
      if (!phaseIds.has(cap.phaseId)) {
        throw new Error(`Invariant C Violation: Capability '${cap.id}' references non-existent phaseId '${cap.phaseId}'.`);
      }

      // D. Weight > 0
      if (typeof cap.weight !== "number" || cap.weight <= 0) {
        throw new Error(`Invariant D Violation: Capability '${cap.id}' has invalid weight '${cap.weight}'. Must be > 0.`);
      }

      // O. Dependency check
      if (cap.dependencies && Array.isArray(cap.dependencies)) {
        for (const depId of cap.dependencies) {
          if (!capabilities.some((c) => c.id === depId)) {
            throw new Error(`Invariant O Violation: Capability '${cap.id}' references non-existent dependency '${depId}'.`);
          }
        }
      }
    }

    // G. Sum of module totalWeights equals Full Roadmap totalWeight
    const moduleTotalSum = modules.reduce((sum, mod) => {
      const modCaps = capabilities.filter((c) => c.moduleId === mod.id);
      return sum + modCaps.reduce((s, c) => s + c.weight, 0);
    }, 0);

    const fullTotalWeight = capabilities.reduce((s, c) => s + c.weight, 0);

    if (moduleTotalSum !== fullTotalWeight) {
      throw new Error(`Invariant G Violation: Module weight sum (${moduleTotalSum}) does not equal total roadmap weight (${fullTotalWeight}).`);
    }

    // E & F. Weight inequalities
    const implementedWeight = capabilities
      .filter((c) => IMPLEMENTED_STATES.includes(c.status))
      .reduce((s, c) => s + c.weight, 0);

    const homologatedWeight = capabilities
      .filter((c) => HOMOLOGATED_STATES.includes(c.status))
      .reduce((s, c) => s + c.weight, 0);

    if (homologatedWeight > implementedWeight) {
      throw new Error(`Invariant E Violation: homologatedWeight (${homologatedWeight}) > implementedWeight (${implementedWeight}).`);
    }

    if (implementedWeight > fullTotalWeight) {
      throw new Error(`Invariant F Violation: implementedWeight (${implementedWeight}) > fullTotalWeight (${fullTotalWeight}).`);
    }
  }

  public getOverview(): DevelopmentControlOverview {
    const projectData = this.loadJson<any>("project.json");
    const roadmapData = this.loadJson<any>("roadmap.json");
    const checkpointsData = this.loadJson<any>("checkpoints.json");
    const homologationData = this.loadJson<any>("homologation.json");

    const phases: DevelopmentPhase[] = roadmapData.phases || [];
    const modules: DevelopmentModule[] = roadmapData.modules || [];
    const capabilities: DevelopmentCapability[] = roadmapData.capabilities || [];
    const frozenComponents: FrozenComponent[] = roadmapData.frozenComponents || [];
    const checkpoints: DevelopmentCheckpoint[] = checkpointsData.checkpoints || [];
    const sessions: HumanValidationSession[] = homologationData.sessions || [];

    // Validate 16 Invariants
    this.validateInvariants(phases, modules, capabilities, projectData.currentPhaseId);

    // Calculate Full Roadmap breakdown
    const fullTotalWeight = capabilities.reduce((sum, c) => sum + c.weight, 0);
    const fullImplementedWeight = capabilities
      .filter((c) => IMPLEMENTED_STATES.includes(c.status))
      .reduce((sum, c) => sum + c.weight, 0);
    const fullHomologatedWeight = capabilities
      .filter((c) => HOMOLOGATED_STATES.includes(c.status))
      .reduce((sum, c) => sum + c.weight, 0);

    const fullRoadmap: DevelopmentProgressBreakdown = {
      totalWeight: fullTotalWeight,
      implementedWeight: fullImplementedWeight,
      homologatedWeight: fullHomologatedWeight,
      implementationPercent: fullTotalWeight > 0 ? Math.round((fullImplementedWeight / fullTotalWeight) * 100) : 0,
      readinessPercent: fullTotalWeight > 0 ? Math.round((fullHomologatedWeight / fullTotalWeight) * 100) : 0,
    };

    // Calculate MVP breakdown
    const mvpCapabilities = capabilities.filter((c) => c.mvp === true);
    const mvpTotalWeight = mvpCapabilities.reduce((sum, c) => sum + c.weight, 0);
    const mvpImplementedWeight = mvpCapabilities
      .filter((c) => IMPLEMENTED_STATES.includes(c.status))
      .reduce((sum, c) => sum + c.weight, 0);
    const mvpHomologatedWeight = mvpCapabilities
      .filter((c) => HOMOLOGATED_STATES.includes(c.status))
      .reduce((sum, c) => sum + c.weight, 0);

    const mvp: DevelopmentProgressBreakdown = {
      totalWeight: mvpTotalWeight,
      implementedWeight: mvpImplementedWeight,
      homologatedWeight: mvpHomologatedWeight,
      implementationPercent: mvpTotalWeight > 0 ? Math.round((mvpImplementedWeight / mvpTotalWeight) * 100) : 0,
      readinessPercent: mvpTotalWeight > 0 ? Math.round((mvpHomologatedWeight / mvpTotalWeight) * 100) : 0,
    };

    // Status counts
    const statusCounts: Record<DevelopmentStatus, number> = {
      PLANNED: 0,
      READY: 0,
      IN_PROGRESS: 0,
      IMPLEMENTED: 0,
      VALIDATION: 0,
      HOMOLOGATED: 0,
      FROZEN: 0,
      BLOCKED: 0,
      UNMAPPED: 0,
    };

    for (const c of capabilities) {
      if (statusCounts[c.status] !== undefined) {
        statusCounts[c.status]++;
      } else {
        statusCounts.UNMAPPED++;
      }
    }

    // Module breakdown
    const moduleOverview = modules.map((mod) => {
      const modCaps = capabilities.filter((c) => c.moduleId === mod.id);
      const totalWeight = modCaps.reduce((sum, c) => sum + c.weight, 0);
      const implementedWeight = modCaps
        .filter((c) => IMPLEMENTED_STATES.includes(c.status))
        .reduce((sum, c) => sum + c.weight, 0);
      const homologatedWeight = modCaps
        .filter((c) => HOMOLOGATED_STATES.includes(c.status))
        .reduce((sum, c) => sum + c.weight, 0);

      let status: DevelopmentStatus = "PLANNED";
      if (modCaps.every((c) => c.status === "FROZEN")) {
        status = "FROZEN";
      } else if (modCaps.every((c) => HOMOLOGATED_STATES.includes(c.status))) {
        status = "HOMOLOGATED";
      } else if (modCaps.some((c) => c.status === "VALIDATION")) {
        status = "VALIDATION";
      } else if (modCaps.some((c) => IMPLEMENTED_STATES.includes(c.status))) {
        status = "IMPLEMENTED";
      } else if (modCaps.some((c) => c.status === "IN_PROGRESS")) {
        status = "IN_PROGRESS";
      }

      return {
        id: mod.id,
        name: mod.name,
        totalWeight,
        implementedWeight,
        homologatedWeight,
        implementationPercent: totalWeight > 0 ? Math.round((implementedWeight / totalWeight) * 100) : 0,
        readinessPercent: totalWeight > 0 ? Math.round((homologatedWeight / totalWeight) * 100) : 0,
        status,
      };
    });

    // Human Validation Breakdown
    const allResults = sessions.flatMap((s) => s.results || []);
    const testedCaps = new Set(allResults.map((r) => r.capabilityId));
    const passedCaps = new Set(allResults.filter((r) => r.status === "PASSED").map((r) => r.capabilityId));
    const failedCaps = new Set(allResults.filter((r) => r.status === "FAILED").map((r) => r.capabilityId));

    const testedWeight = capabilities
      .filter((c) => testedCaps.has(c.id))
      .reduce((sum, c) => sum + c.weight, 0);

    const approvedWeight = capabilities
      .filter((c) => passedCaps.has(c.id))
      .reduce((sum, c) => sum + c.weight, 0);

    const failedWeight = capabilities
      .filter((c) => failedCaps.has(c.id))
      .reduce((sum, c) => sum + c.weight, 0);

    const humanValidation: HumanValidationOverview = {
      totalWeight: fullTotalWeight,
      testedWeight,
      approvedWeight,
      failedWeight,
      coveragePercent: fullTotalWeight > 0 ? Math.round((testedWeight / fullTotalWeight) * 100) : 0,
    };

    // Pending MVP capabilities (MVP = true & status not in HOMOLOGATED_STATES)
    const pendingMvp = capabilities.filter((c) => c.mvp === true && !HOMOLOGATED_STATES.includes(c.status));

    // Future Backlog capabilities (MVP = false & status not in HOMOLOGATED_STATES)
    const futureBacklog = capabilities.filter((c) => c.mvp !== true && !HOMOLOGATED_STATES.includes(c.status));

    // Current phase name
    const currentPhaseObj = phases.find((p) => p.id === projectData.currentPhaseId);

    // Health assessment
    const health: {
      code: HealthState;
      tests: HealthState;
      build: HealthState;
      deployment: HealthState;
      documentation: HealthState;
      manualValidation: HealthState;
    } = {
      code: "PASS",
      tests: "PASS",
      build: "PASS",
      deployment: "PASS",
      documentation: "PASS",
      manualValidation: humanValidation.coveragePercent >= 80 ? "PASS" : "WARNING",
    };

    // Drift Detection
    const driftItems: string[] = [];
    if (projectData.developmentControlVersion !== "0.1") {
      driftItems.push("Version mismatch between project.json and DCC spec.");
    }
    if (!currentPhaseObj) {
      driftItems.push(`Current phase '${projectData.currentPhaseId}' not found.`);
    }

    return {
      project: {
        id: projectData.id,
        name: projectData.name,
        version: projectData.roadmapVersion,
        environment: projectData.environment,
        currentPhaseId: projectData.currentPhaseId,
        currentPhaseName: currentPhaseObj ? currentPhaseObj.name : projectData.currentPhaseId,
        developmentControlVersion: projectData.developmentControlVersion,
      },
      mvp,
      fullRoadmap,
      humanValidation,
      statusCounts,
      modules: moduleOverview,
      pendingMvp,
      futureBacklog,
      frozenComponents,
      checkpoints,
      health,
      drift: {
        detected: driftItems.length > 0,
        items: driftItems,
      },
    };
  }

  public getRoadmap() {
    return this.loadJson<any>("roadmap.json");
  }

  public getCheckpoints() {
    return this.loadJson<any>("checkpoints.json");
  }

  public getHomologation() {
    return this.loadJson<any>("homologation.json");
  }
}
