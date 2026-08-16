import { createServer, IncomingMessage, ServerResponse } from "http";
import { handleReadiness, handleMetricsScrape } from "./health/health.controller.js";
import { SecretVaultService } from "./security/secret_vault.service.js";
import { ProxmoxProvider } from "./integrations/proxmox/proxmox_provider.js";
import { VirtualizorProvider } from "./integrations/virtualizor/virtualizor_provider.js";
import { generateEnrollmentToken } from "./agent/agent.controller.js";

const port = Number(process.env.PORT) || 3000;
const secretVault = new SecretVaultService(process.env.ENCRYPTION_MASTER_KEY || "master_key_1234567890_32bytes_sec!");

// In-Memory Operational Store
const tenantsStore = [
  { id: "tenant-default", name: "Default Tenant (infraops-prod)", domain: "infraopsai.awecloudsolution.com", createdAt: new Date().toISOString() },
  { id: "tenant-wrtec", name: "WR Tecnologia", domain: "wrtec.com.br", createdAt: new Date().toISOString() },
];

const usersStore = [
  { id: "usr-admin", tenantId: "tenant-default", name: "Wittemberg Admin", email: "admin@wrtec.com.br", role: "owner" },
  { id: "usr-op1", tenantId: "tenant-default", name: "Operador NOC", email: "noc@wrtec.com.br", role: "operator" },
];

const integrationsStore: Array<{
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
}> = [
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
];

const nodesStore: Array<{
  id: string;
  tenantId: string;
  name: string;
  hostname: string;
  provider: string;
  status: "online" | "degraded" | "offline";
  ipAddress: string;
  os: string;
  lastHeartbeatAt: string;
}> = [
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
];

const workloadsStore: Array<{
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
}> = [
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
];

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

  if (url === "/health" || url === "/health/live" || url === "/health/ready") {
    const ready = handleReadiness(true, true);
    sendJson(res, ready.statusCode, ready.body);
    return;
  }

  // --- TENANTS ENDPOINTS ---
  if (url === "/api/v1/tenants" && method === "GET") {
    sendJson(res, 200, { tenants: tenantsStore });
    return;
  }

  if (url === "/api/v1/tenants" && method === "POST") {
    const body = await parseJsonBody(req);
    const newTenant = {
      id: `tenant-${Math.random().toString(36).substring(2, 8)}`,
      name: body.name || "Novo Cliente",
      domain: body.domain || "empresa.com.br",
      createdAt: new Date().toISOString(),
    };
    tenantsStore.push(newTenant);
    sendJson(res, 201, { tenant: newTenant });
    return;
  }

  if (url.startsWith("/api/v1/tenants/") && (method === "PUT" || method === "POST")) {
    const tenantId = url.replace("/api/v1/tenants/", "");
    const body = await parseJsonBody(req);
    const index = tenantsStore.findIndex((t) => t.id === tenantId);
    if (index !== -1) {
      tenantsStore[index] = { ...tenantsStore[index], ...body };
      sendJson(res, 200, { tenant: tenantsStore[index] });
    } else {
      sendJson(res, 404, { error: "Tenant not found" });
    }
    return;
  }

  // --- USERS ENDPOINTS ---
  if (url === "/api/v1/users" && method === "GET") {
    sendJson(res, 200, { users: usersStore });
    return;
  }

  if (url === "/api/v1/users" && method === "POST") {
    const body = await parseJsonBody(req);
    const newUser = {
      id: `usr-${Math.random().toString(36).substring(2, 8)}`,
      tenantId: body.tenantId || "tenant-default",
      name: body.name,
      email: body.email,
      role: body.role || "operator",
    };
    usersStore.push(newUser);
    sendJson(res, 201, { user: newUser });
    return;
  }

  if (url.startsWith("/api/v1/users/") && (method === "PUT" || method === "POST")) {
    const userId = url.replace("/api/v1/users/", "");
    const body = await parseJsonBody(req);
    const index = usersStore.findIndex((u) => u.id === userId);
    if (index !== -1) {
      usersStore[index] = { ...usersStore[index], ...body };
      sendJson(res, 200, { user: usersStore[index] });
    } else {
      sendJson(res, 404, { error: "User not found" });
    }
    return;
  }

  // --- INTEGRATIONS ENDPOINTS ---
  if (url === "/api/v1/integrations" && method === "GET") {
    sendJson(res, 200, { integrations: integrationsStore });
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
      body.apiToken || body.apiKeyPass
    );

    const newInt = {
      id: `int-${Math.random().toString(36).substring(2, 8)}`,
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

    integrationsStore.push(newInt);
    sendJson(res, 201, { integration: newInt });
    return;
  }

  if (url.startsWith("/api/v1/integrations/") && !url.endsWith("/sync") && (method === "PUT" || method === "POST")) {
    const intId = url.replace("/api/v1/integrations/", "");
    const body = await parseJsonBody(req);
    const index = integrationsStore.findIndex((i) => i.id === intId);
    if (index !== -1) {
      if (body.apiToken) {
        const secretMeta = secretVault.storeSecret(
          integrationsStore[index].tenantId,
          `API Credential for ${body.name || integrationsStore[index].name}`,
          body.provider === "proxmox" ? "token" : "api_key",
          body.apiToken
        );
        body.secretId = secretMeta.id;
      }
      delete body.apiToken;
      integrationsStore[index] = { ...integrationsStore[index], ...body };
      sendJson(res, 200, { integration: integrationsStore[index] });
    } else {
      sendJson(res, 404, { error: "Integration not found" });
    }
    return;
  }

  if (url.match(/\/api\/v1\/integrations\/.*\/sync/) && method === "POST") {
    const intId = url.split("/")[4];
    const integration = integrationsStore.find((i) => i.id === intId);

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
    sendJson(res, 200, { nodes: nodesStore });
    return;
  }

  if (url === "/api/v1/nodes" && method === "POST") {
    const body = await parseJsonBody(req);
    const newNode = {
      id: `node-${Math.random().toString(36).substring(2, 8)}`,
      tenantId: body.tenantId || "tenant-default",
      name: body.name,
      hostname: body.hostname || body.name,
      provider: body.provider || "linux-agent",
      status: "online" as const,
      ipAddress: body.ipAddress || "192.168.1.100",
      os: body.os || "Linux / Systemd",
      lastHeartbeatAt: new Date().toISOString(),
    };
    nodesStore.push(newNode);
    sendJson(res, 201, { node: newNode });
    return;
  }

  // --- WORKLOADS ENDPOINTS ---
  if (url === "/api/v1/workloads" && method === "GET") {
    sendJson(res, 200, { workloads: workloadsStore });
    return;
  }

  if (url === "/api/v1/workloads" && method === "POST") {
    const body = await parseJsonBody(req);
    const newWl = {
      id: `wl-${Math.random().toString(36).substring(2, 8)}`,
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
    workloadsStore.push(newWl);
    sendJson(res, 201, { workload: newWl });
    return;
  }

  // Default Fallback
  const ready = handleReadiness(true, true);
  sendJson(res, ready.statusCode, ready.body);
});

server.listen(port, "0.0.0.0", () => {
  console.log(`[INFRAOPS_API] Central Operational REST API listening on 0.0.0.0:${port}`);
});
