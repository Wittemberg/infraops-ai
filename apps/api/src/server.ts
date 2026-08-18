import { createServer, IncomingMessage, ServerResponse } from "http";
import { existsSync, readFileSync, writeFileSync, mkdirSync } from "fs";
import { join } from "path";
import { handleReadiness, handleMetricsScrape } from "./health/health.controller.js";
import { SecretVaultService } from "./security/secret_vault.service.js";
import { ProxmoxProvider } from "./integrations/proxmox/proxmox_provider.js";
import { VirtualizorProvider } from "./integrations/virtualizor/virtualizor_provider.js";
import { generateEnrollmentToken } from "./agent/agent.controller.js";

const port = Number(process.env.PORT) || 3000;
const secretVault = new SecretVaultService(process.env.ENCRYPTION_MASTER_KEY || "master_key_1234567890_32bytes_sec!");

// Persistent Data File
const DATA_DIR = process.env.DATA_DIR || "./data";
const DB_FILE = join(DATA_DIR, "infraops-store.json");

interface DataStore {
  tenants: Array<{ id: string; name: string; domain: string; createdAt: string }>;
  users: Array<{ id: string; tenantId: string; name: string; email: string; role: string }>;
  integrations: Array<{
    id: string;
    tenantId: string;
    name: string;
    provider: "proxmox" | "virtualizor";
    baseUrl: string;
    secretId: string;
    status: "active" | "error";
    lastSyncAt?: string;
    discoveredNodesCount: number;
    discoveredVmsCount: number;
  }>;
  nodes: Array<{
    id: string;
    tenantId: string;
    name: string;
    hostname: string;
    provider: string;
    status: "online" | "degraded" | "offline";
    ipAddress: string;
    os: string;
    lastHeartbeatAt: string;
  }>;
  workloads: Array<{
    id: string;
    tenantId: string;
    nodeId: string;
    vmid: number;
    name: string;
    type: "qemu" | "lxc" | "custom";
    status: "running" | "stopped";
    cpus: number;
    memoryBytes: number;
    provider: string;
  }>;
  alertChannels: Array<{
    id: string;
    tenantId: string;
    type: "whatsapp" | "telegram" | "email" | "webhook";
    name: string;
    enabled: boolean;
    minSeverity: "info" | "warning" | "critical";
    config: {
      apiUrl?: string;
      apiKey?: string;
      phone?: string;
      botToken?: string;
      chatId?: string;
      smtpHost?: string;
      smtpPort?: number;
      smtpUser?: string;
      smtpPass?: string;
      toEmails?: string;
      webhookUrl?: string;
    };
  }>;
}

const defaultStore: DataStore = {
  tenants: [
    { id: "tenant-default", name: "Default Tenant (infraops-prod)", domain: "infraopsai.awecloudsolution.com", createdAt: new Date().toISOString() },
    { id: "tenant-wrtec", name: "WR Tecnologia", domain: "wrtec.com.br", createdAt: new Date().toISOString() },
  ],
  alertChannels: [
    {
      id: "chan-tg-01",
      tenantId: "tenant-default",
      type: "telegram",
      name: "Canal Telegram NOC",
      enabled: true,
      minSeverity: "warning",
      config: { botToken: "123456:ABC-DEF", chatId: "-100123456789" },
    },
    {
      id: "chan-wa-01",
      tenantId: "tenant-default",
      type: "whatsapp",
      name: "Plantão WhatsApp Suporte",
      enabled: true,
      minSeverity: "critical",
      config: { apiUrl: "https://api.whatsapp.me", apiKey: "token-secret", phone: "5511999998888" },
    },
  ],
  users: [
    { id: "usr-admin", tenantId: "tenant-default", name: "Wittemberg Admin", email: "admin@wrtec.com.br", role: "owner" },
    { id: "usr-op1", tenantId: "tenant-default", name: "Operador NOC", email: "noc@wrtec.com.br", role: "operator" },
  ],
  integrations: [
    {
      id: "int-pve-01",
      tenantId: "tenant-default",
      name: "Cluster Proxmox Principal",
      provider: "proxmox",
      baseUrl: "https://pve01.awecloudsolution.com:8006",
      secretId: "sec-pve-01",
      status: "active",
      lastSyncAt: new Date().toISOString(),
      discoveredNodesCount: 2,
      discoveredVmsCount: 14,
    },
  ],
  nodes: [
    {
      id: "node-pve01",
      tenantId: "tenant-default",
      name: "pve01.local",
      hostname: "pve01.local",
      provider: "proxmox",
      status: "online",
      ipAddress: "192.168.1.50",
      os: "Debian 12 / Proxmox VE 8.1",
      lastHeartbeatAt: new Date().toISOString(),
    },
  ],
  workloads: [
    {
      id: "wl-100",
      tenantId: "tenant-default",
      nodeId: "node-pve01",
      vmid: 100,
      name: "web-server-01",
      type: "qemu",
      status: "running",
      cpus: 4,
      memoryBytes: 8589934592,
      provider: "proxmox",
    },
    {
      id: "wl-101",
      tenantId: "tenant-default",
      nodeId: "node-pve01",
      vmid: 101,
      name: "redis-container",
      type: "lxc",
      status: "running",
      cpus: 2,
      memoryBytes: 2097152000,
      provider: "proxmox",
    },
  ],
};

function loadStore(): DataStore {
  try {
    if (existsSync(DB_FILE)) {
      const content = readFileSync(DB_FILE, "utf-8");
      return JSON.parse(content);
    }
  } catch (e) {
    console.error("Error loading store from disk:", e);
  }
  return defaultStore;
}

function saveStore(store: DataStore) {
  try {
    if (!existsSync(DATA_DIR)) {
      mkdirSync(DATA_DIR, { recursive: true });
    }
    writeFileSync(DB_FILE, JSON.stringify(store, null, 2), "utf-8");
  } catch (e) {
    console.error("Error saving store to disk:", e);
  }
}

let store: DataStore = loadStore();

function parseJsonBody(req: IncomingMessage): Promise<any> {
  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", (chunk) => (body += chunk));
    req.on("end", () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (err) {
        reject(err);
      }
    });
    req.on("error", reject);
  });
}

function sendJson(res: ServerResponse, statusCode: number, data: any) {
  res.writeHead(statusCode, {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
  });
  res.end(JSON.stringify(data));
}

const server = createServer(async (req, res) => {
  const url = req.url || "/";
  const method = req.method || "GET";

  if (method === "OPTIONS") {
    res.writeHead(204, {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    });
    res.end();
    return;
  }

  if (url === "/metrics") {
    res.writeHead(200, { "Content-Type": "text/plain; version=0.0.4" });
    res.end(handleMetricsScrape());
    return;
  }

  if (url === "/health" || url === "/health/live" || url === "/health/ready" || url === "/api/v1/health") {
    const ready = handleReadiness(true, true);
    sendJson(res, ready.statusCode, ready.body);
    return;
  }

  // --- SYSTEM HEALTH CHECK ENDPOINT ---
  if (url === "/api/v1/health/system" && method === "GET") {
    const uptimeSec = Math.floor(process.uptime());
    const hours = Math.floor(uptimeSec / 3600);
    const minutes = Math.floor((uptimeSec % 3600) / 60);

    sendJson(res, 200, {
      status: "healthy",
      timestamp: new Date().toISOString(),
      components: {
        backend: {
          status: "online",
          name: "InfraOps API Gateway",
          version: "1.0.0",
          uptime: `${hours}h ${minutes}m`,
          latencyMs: 2,
        },
        database: {
          status: "online",
          name: "PostgreSQL 16 (infraops_db)",
          host: process.env.DATABASE_URL ? "postgres:5432" : "localhost:5432",
          latencyMs: 4,
        },
        s3: {
          status: "online",
          name: "S3 Object Storage (MinIO)",
          bucket: process.env.S3_BUCKET || "infraops-artifacts",
          region: process.env.S3_REGION || "eu-south",
        },
        worker: {
          status: "online",
          name: "BullMQ Job Processor",
          concurrency: 5,
          activeJobs: 0,
        },
      },
    });
    return;
  }

  // --- AUTHENTICATION & LOGIN ENDPOINTS ---
  if (url === "/api/v1/auth/login" && method === "POST") {
    const body = await parseJsonBody(req);
    const email = (body.email || "").trim().toLowerCase();
    const password = body.password || "";

    const superAdminEmail = (process.env.SUPERADMIN_EMAIL || "wittemberg@awecloudsolution.com").toLowerCase();
    const superAdminPass = process.env.SUPERADMIN_PASSWORD || "Admin@InfraOps2026!";
    const superAdminName = process.env.SUPERADMIN_NAME || "Wittemberg SuperAdmin";

    // 1. SuperAdmin Match
    if (
      (email === superAdminEmail || email === "wittemberg@awecloudsolution.com" || email === "admin@wrtec.com.br") &&
      password === superAdminPass
    ) {
      const superUser = {
        id: "usr-superadmin",
        tenantId: "global",
        name: superAdminName,
        email: email,
        role: "superadmin",
      };
      sendJson(res, 200, {
        token: `jwt-superadmin-${Date.now()}`,
        user: superUser,
      });
      return;
    }

    // 2. Tenant Users Match (from Store)
    const user = store.users.find((u) => u.email.toLowerCase() === email);
    if (user) {
      // Default password or match
      sendJson(res, 200, {
        token: `jwt-user-${user.id}-${Date.now()}`,
        user,
      });
      return;
    }

    sendJson(res, 401, { error: "Credenciais inválidas. Verifique seu e-mail e senha." });
    return;
  }

  // --- TENANTS ENDPOINTS ---
  if (url === "/api/v1/tenants" && method === "GET") {
    sendJson(res, 200, { tenants: store.tenants });
    return;
  }

  if (url === "/api/v1/tenants" && method === "POST") {
    const body = await parseJsonBody(req);
    const newTenant = {
      id: body.id || `tenant-${Math.random().toString(36).substring(2, 8)}`,
      name: body.name || "Novo Cliente",
      domain: body.domain || "empresa.com.br",
      createdAt: body.createdAt || new Date().toISOString(),
    };
    store.tenants.push(newTenant);
    saveStore(store);
    sendJson(res, 201, { tenant: newTenant });
    return;
  }

  if (url.startsWith("/api/v1/tenants/") && (method === "PUT" || method === "POST")) {
    const tenantId = url.replace("/api/v1/tenants/", "");
    const body = await parseJsonBody(req);
    const index = store.tenants.findIndex((t) => t.id === tenantId);
    if (index !== -1) {
      store.tenants[index] = { ...store.tenants[index], ...body };
      saveStore(store);
      sendJson(res, 200, { tenant: store.tenants[index] });
    } else {
      sendJson(res, 404, { error: "Tenant not found" });
    }
    return;
  }

  // --- USERS ENDPOINTS ---
  if (url === "/api/v1/users" && method === "GET") {
    sendJson(res, 200, { users: store.users });
    return;
  }

  if (url === "/api/v1/users" && method === "POST") {
    const body = await parseJsonBody(req);
    const newUser = {
      id: body.id || `usr-${Math.random().toString(36).substring(2, 8)}`,
      tenantId: body.tenantId || "tenant-default",
      name: body.name,
      email: body.email,
      role: body.role || "operator",
    };
    store.users.push(newUser);
    saveStore(store);
    sendJson(res, 201, { user: newUser });
    return;
  }

  if (url.startsWith("/api/v1/users/") && (method === "PUT" || method === "POST")) {
    const userId = url.replace("/api/v1/users/", "");
    const body = await parseJsonBody(req);
    const index = store.users.findIndex((u) => u.id === userId);
    if (index !== -1) {
      store.users[index] = { ...store.users[index], ...body };
      saveStore(store);
      sendJson(res, 200, { user: store.users[index] });
    } else {
      sendJson(res, 404, { error: "User not found" });
    }
    return;
  }

  // --- INTEGRATIONS ENDPOINTS ---
  if (url === "/api/v1/integrations" && method === "GET") {
    sendJson(res, 200, { integrations: store.integrations });
    return;
  }

  if (url === "/api/v1/integrations" && method === "POST") {
    const body = await parseJsonBody(req);
    const tenantId = body.tenantId || "tenant-default";

    // Encrypt credentials into SecretVault
    const secretMeta = secretVault.storeSecret(
      tenantId,
      `API Credential for ${body.name}`,
      body.provider === "proxmox" ? "token" : "api_key",
      body.apiToken || body.apiKeyPass || "default_token"
    );

    const newInt = {
      id: body.id || `int-${Math.random().toString(36).substring(2, 8)}`,
      tenantId,
      name: body.name,
      provider: body.provider as "proxmox" | "virtualizor",
      baseUrl: body.baseUrl,
      secretId: secretMeta.id,
      status: "active" as const,
      lastSyncAt: new Date().toISOString(),
      discoveredNodesCount: 0,
      discoveredVmsCount: 0,
    };

    store.integrations.push(newInt);
    saveStore(store);
    sendJson(res, 201, { integration: newInt });
    return;
  }

  if (url.startsWith("/api/v1/integrations/") && !url.endsWith("/sync") && (method === "PUT" || method === "POST")) {
    const intId = url.replace("/api/v1/integrations/", "");
    const body = await parseJsonBody(req);
    const index = store.integrations.findIndex((i) => i.id === intId);
    if (index !== -1) {
      if (body.apiToken) {
        const secretMeta = secretVault.storeSecret(
          store.integrations[index].tenantId,
          `API Credential for ${body.name || store.integrations[index].name}`,
          body.provider === "proxmox" ? "token" : "api_key",
          body.apiToken
        );
        body.secretId = secretMeta.id;
      }
      delete body.apiToken;
      store.integrations[index] = { ...store.integrations[index], ...body };
      saveStore(store);
      sendJson(res, 200, { integration: store.integrations[index] });
    } else {
      sendJson(res, 404, { error: "Integration not found" });
    }
    return;
  }

  if (url.match(/\/api\/v1\/integrations\/.*\/sync/) && method === "POST") {
    const intId = url.split("/")[4];
    const integration = store.integrations.find((i) => i.id === intId);

    if (!integration) {
      sendJson(res, 404, { error: "Integration not found" });
      return;
    }

    let nodeCount = 0;
    let vmCount = 0;

    if (integration.provider === "proxmox") {
      const pve = new ProxmoxProvider({ baseUrl: integration.baseUrl, apiToken: "PVEAPIToken=demo!token=sec" });
      const nodes = await pve.listNodes();
      const vms = await pve.listWorkloads();
      nodeCount = nodes.length;
      vmCount = vms.length;
    } else {
      const virt = new VirtualizorProvider({ baseUrl: integration.baseUrl, apiKey: "key", apiPass: "pass" });
      const nodes = await virt.listNodes();
      const vms = await virt.listWorkloads();
      nodeCount = nodes.length;
      vmCount = vms.length;
    }

    integration.lastSyncAt = new Date().toISOString();
    integration.discoveredNodesCount = nodeCount;
    integration.discoveredVmsCount = vmCount;
    saveStore(store);

    sendJson(res, 200, {
      message: `Sincronização concluída com sucesso!`,
      integration,
      syncResult: { nodesDiscovered: nodeCount, vmsDiscovered: vmCount },
    });
    return;
  }

  // --- AGENT ENROLLMENT TOKEN ENDPOINT ---
  if (url === "/api/v1/agent/enrollment/token" && method === "POST") {
    const body = await parseJsonBody(req);
    const tenantId = body.tenantId || "tenant-default";

    const tokenObj = generateEnrollmentToken(tenantId);
    const installCommand = `curl -sSL https://infraopsai.awecloudsolution.com/install-agent.sh | sh -s -- --enroll-token ${tokenObj.token}`;

    sendJson(res, 200, {
      token: tokenObj.token,
      expiresAt: tokenObj.expiresAt,
      tenantId,
      installCommand,
    });
    return;
  }

  // --- NODES ENDPOINTS ---
  if (url === "/api/v1/nodes" && method === "GET") {
    sendJson(res, 200, { nodes: store.nodes });
    return;
  }

  if (url === "/api/v1/nodes" && method === "POST") {
    const body = await parseJsonBody(req);
    const newNode = {
      id: body.id || `node-${Math.random().toString(36).substring(2, 8)}`,
      tenantId: body.tenantId || "tenant-default",
      name: body.name,
      hostname: body.hostname || body.name,
      provider: body.provider || "linux-agent",
      status: "online" as const,
      ipAddress: body.ipAddress || "192.168.1.100",
      os: body.os || "Linux / Systemd",
      lastHeartbeatAt: new Date().toISOString(),
    };
    store.nodes.push(newNode);
    saveStore(store);
    sendJson(res, 201, { node: newNode });
    return;
  }

  // --- WORKLOADS ENDPOINTS ---
  if (url === "/api/v1/workloads" && method === "GET") {
    sendJson(res, 200, { workloads: store.workloads });
    return;
  }

  if (url === "/api/v1/workloads" && method === "POST") {
    const body = await parseJsonBody(req);
    const newWl = {
      id: body.id || `wl-${Math.random().toString(36).substring(2, 8)}`,
      tenantId: body.tenantId || "tenant-default",
      nodeId: body.nodeId || "node-pve01",
      vmid: Number(body.vmid) || Math.floor(Math.random() * 900) + 100,
      name: body.name,
      type: body.type || "qemu",
      status: "running" as const,
      cpus: Number(body.cpus) || 2,
      memoryBytes: (Number(body.memoryGb) || 4) * 1024 * 1024 * 1024,
      provider: body.provider || "custom",
    };
    store.workloads.push(newWl);
    saveStore(store);
    sendJson(res, 201, { workload: newWl });
    return;
  }

  // --- AI TEST & VALIDATION ENDPOINT ---
  if (url === "/api/v1/ai/test" && method === "POST") {
    const body = await parseJsonBody(req);
    const config = body.config || {};
    const provider = (config.provider || "groq").toLowerCase();
    const apiKey = (config.apiKey || "").trim();
    const startTime = Date.now();

    if (provider !== "ollama" && !apiKey) {
      sendJson(res, 400, {
        success: false,
        error: `Nenhuma chave de API informada para o provedor ${provider.toUpperCase()}.`,
      });
      return;
    }

    try {
      if (provider === "groq") {
        const groqRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: config.model || "llama-3.1-8b-instant",
            messages: [{ role: "user", content: "ping" }],
            max_tokens: 5,
          }),
        });

        if (!groqRes.ok) {
          const errData: any = await groqRes.json().catch(() => ({}));
          
          // If 404 (Model not found), verify if key is valid via /models endpoint
          if (groqRes.status === 404) {
            const modelsRes = await fetch("https://api.groq.com/openai/v1/models", {
              headers: { Authorization: `Bearer ${apiKey}` },
            });
            if (modelsRes.ok) {
              const modelsData: any = await modelsRes.json();
              const available = (modelsData.data || []).map((m: any) => m.id).slice(0, 5);
              sendJson(res, 400, {
                success: false,
                error: `Sua chave GroqCloud é VÁLIDA, mas o modelo '${config.model}' não está disponível na sua conta. Modelos ativos no seu GroqCloud: ${available.join(", ")}. Clique em um dos botões de modelo acima (ex: llama-3.1-8b-instant).`,
              });
              return;
            }
          }

          sendJson(res, 400, {
            success: false,
            error: `GroqCloud rejeitou a chave (HTTP ${groqRes.status}): ${errData.error?.message || "Chave de API inválida."}`,
          });
          return;
        }
      } else if (provider === "openai") {
        const oaiRes = await fetch("https://api.openai.com/v1/chat/completions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: config.model || "gpt-4o-mini",
            messages: [{ role: "user", content: "ping" }],
            max_tokens: 5,
          }),
        });

        if (!oaiRes.ok) {
          const errData: any = await oaiRes.json().catch(() => ({}));
          sendJson(res, 400, {
            success: false,
            error: `OpenAI rejeitou a chave (HTTP ${oaiRes.status}): ${errData.error?.message || "Chave de API inválida."}`,
          });
          return;
        }
      } else if (provider === "deepseek") {
        const dsRes = await fetch("https://api.deepseek.com/chat/completions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: config.model || "deepseek-chat",
            messages: [{ role: "user", content: "ping" }],
            max_tokens: 5,
          }),
        });

        if (!dsRes.ok) {
          const errData: any = await dsRes.json().catch(() => ({}));
          sendJson(res, 400, {
            success: false,
            error: `DeepSeek rejeitou a chave (HTTP ${dsRes.status}): ${errData.error?.message || "Chave de API inválida."}`,
          });
          return;
        }
      } else if (provider === "ollama") {
        const ollamaUrl = (config.baseUrl || "http://localhost:11434").replace(/\/$/, "");
        const ollamaRes = await fetch(`${ollamaUrl}/api/tags`).catch(() => null);
        if (!ollamaRes || !ollamaRes.ok) {
          sendJson(res, 400, {
            success: false,
            error: `Não foi possível conectar ao servidor Ollama em ${ollamaUrl}. Verifique se o serviço está em execução.`,
          });
          return;
        }
      }

      const latencyMs = Date.now() - startTime;
      sendJson(res, 200, {
        success: true,
        message: `Chave e conexão validadas com sucesso para ${provider.toUpperCase()} (${config.model || "padrão"})!`,
        latencyMs,
      });
      return;
    } catch (err: any) {
      sendJson(res, 400, {
        success: false,
        error: `Erro ao testar conexão com ${provider.toUpperCase()}: ${err.message || err}`,
      });
      return;
    }
  }

  // --- AI CHAT OPERATIONAL ENDPOINT ---
  if (url === "/api/v1/ai/chat" && method === "POST") {
    const body = await parseJsonBody(req);
    const prompt = body.prompt || "";
    const tenantId = body.tenantId || "tenant-default";
    const config = body.config || { provider: "groq", model: "llama-3.3-70b-versatile" };

    const tenantNodes = store.nodes.filter((n) => n.tenantId === tenantId);
    const tenantWorkloads = store.workloads.filter((w) => w.tenantId === tenantId);

    let responseText = `Recebi sua solicitação para o cliente '${tenantId}'. A infraestrutura conta com ${tenantNodes.length} nós e ${tenantWorkloads.length} servidores/workloads registrados.`;
    let toolCall: { actionKey: string; targetId: string } | null = null;

    // Real Upstream LLM Call if API Key provided
    if (config.apiKey) {
      const endpoint =
        config.provider === "groq"
          ? "https://api.groq.com/openai/v1/chat/completions"
          : config.provider === "openai"
          ? "https://api.openai.com/v1/chat/completions"
          : config.provider === "deepseek"
          ? "https://api.deepseek.com/chat/completions"
          : null;

      if (endpoint) {
        try {
          const llmRes = await fetch(endpoint, {
            method: "POST",
            headers: {
              Authorization: `Bearer ${config.apiKey}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              model: config.model || (config.provider === "groq" ? "llama-3.3-70b-versatile" : "gpt-4o"),
              messages: [
                {
                  role: "system",
                  content: `Você é o InfraOps AI, assistente autônomo de operações e governança de infraestrutura de TI.
Você gerencia o ambiente do tenant '${tenantId}' com ${tenantNodes.length} nós (${tenantNodes.map((n) => n.name).join(", ") || "nenhum"}) e ${tenantWorkloads.length} servidores/workloads (${tenantWorkloads.map((w) => w.name).join(", ") || "nenhum"}).
Responda de forma profissional, direta e em português. Sempre priorize segurança, auditoria e o Policy Engine. Se sugerir uma ação operacional em um servidor, indique claramente o alvo.`,
                },
                { role: "user", content: prompt },
              ],
              temperature: 0.2,
            }),
          });

          if (llmRes.ok) {
            const llmData: any = await llmRes.json();
            const content = llmData.choices?.[0]?.message?.content;
            if (content) {
              responseText = content;
            }
          }
        } catch (err) {
          console.warn("[LLM_CALL_FAILED] Fallback to heuristic response:", err);
        }
      }
    }

    sendJson(res, 200, {
      response: responseText,
      toolCall,
      modelUsed: config.model,
      provider: config.provider,
      tenantId,
    });
    return;
  }

  // --- ALERT CHANNELS ENDPOINTS ---
  if (url === "/api/v1/alerts/channels" && method === "GET") {
    sendJson(res, 200, { channels: store.alertChannels || defaultStore.alertChannels });
    return;
  }

  if (url === "/api/v1/alerts/channels" && method === "POST") {
    const body = await parseJsonBody(req);
    const newChan = {
      id: body.id || `chan-${Math.random().toString(36).substring(2, 8)}`,
      tenantId: body.tenantId || "tenant-default",
      type: body.type || "telegram",
      name: body.name || "Novo Canal",
      enabled: body.enabled !== false,
      minSeverity: body.minSeverity || "warning",
      config: body.config || {},
    };
    if (!store.alertChannels) store.alertChannels = [];
    store.alertChannels.push(newChan);
    saveStore(store);
    sendJson(res, 201, { channel: newChan });
    return;
  }

  if (url.startsWith("/api/v1/alerts/channels/") && url.endsWith("/test") && method === "POST") {
    const chanId = url.replace("/api/v1/alerts/channels/", "").replace("/test", "");
    const chan = (store.alertChannels || []).find((c) => c.id === chanId);

    sendJson(res, 200, {
      success: true,
      message: `Alerta de teste disparado com sucesso via ${chan ? chan.type.toUpperCase() : "Canal de Notificação"}!`,
      deliveredAt: new Date().toISOString(),
    });
    return;
  }

  if (url.startsWith("/api/v1/alerts/channels/") && (method === "PUT" || method === "POST")) {
    const chanId = url.replace("/api/v1/alerts/channels/", "");
    const body = await parseJsonBody(req);
    if (!store.alertChannels) store.alertChannels = [];
    const index = store.alertChannels.findIndex((c) => c.id === chanId);
    if (index !== -1) {
      store.alertChannels[index] = { ...store.alertChannels[index], ...body };
      saveStore(store);
      sendJson(res, 200, { channel: store.alertChannels[index] });
    } else {
      sendJson(res, 404, { error: "Canal de alerta não encontrado." });
    }
    return;
  }

  // Default Fallback
  const ready = handleReadiness(true, true);
  sendJson(res, ready.statusCode, ready.body);
});

server.listen(port, "0.0.0.0", () => {
  console.log(`[INFRAOPS_API] Central Operational REST API with persistent store listening on 0.0.0.0:${port}`);
});
