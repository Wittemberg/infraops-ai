import React, { useState, useEffect } from "react";
import { DashboardView } from "./components/DashboardView.jsx";
import { NodeDetailView } from "./components/NodeDetailView.jsx";
import { AiConsoleView } from "./components/AiConsoleView.jsx";
import { ApprovalsAuditView } from "./components/ApprovalsAuditView.jsx";
import { TenantsUsersView } from "./components/TenantsUsersView.jsx";
import { IntegrationsView } from "./components/IntegrationsView.jsx";
import { ActionModal } from "./components/ActionModal.jsx";
import { EnrollAgentModal } from "./components/EnrollAgentModal.jsx";
import { AddWorkloadModal } from "./components/AddWorkloadModal.jsx";

const API_BASE = "https://infraopsai.awecloudsolution.com";

const defaultTenants = [
  { id: "tenant-default", name: "Default Tenant (infraops-prod)", domain: "infraopsai.awecloudsolution.com", createdAt: new Date().toISOString() },
  { id: "tenant-wrtec", name: "WR Tecnologia", domain: "wrtec.com.br", createdAt: new Date().toISOString() },
];

const defaultUsers = [
  { id: "usr-admin", tenantId: "tenant-default", name: "Wittemberg Admin", email: "admin@wrtec.com.br", role: "owner" },
  { id: "usr-op1", tenantId: "tenant-default", name: "Operador NOC", email: "noc@wrtec.com.br", role: "operator" },
];

const defaultIntegrations = [
  {
    id: "int-pve-01",
    tenantId: "tenant-default",
    name: "Cluster Proxmox Principal",
    provider: "proxmox",
    baseUrl: "https://pve01.awecloudsolution.com:8006",
    status: "active",
    lastSyncAt: new Date().toISOString(),
    discoveredNodesCount: 2,
    discoveredVmsCount: 14,
  },
];

const defaultNodes = [
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

const defaultWorkloads = [
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
];

export function App() {
  const [currentNav, setCurrentNav] = useState("dashboard");

  // Theme Management (Light / Dark)
  const [theme, setTheme] = useState(() => localStorage.getItem("infraops_theme") || "dark");

  useEffect(() => {
    document.body.setAttribute("data-theme", theme);
    localStorage.setItem("infraops_theme", theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === "dark" ? "light" : "dark"));
  };

  // Operational State with LocalStorage Caching
  const [tenants, setTenants] = useState(() => {
    const cached = localStorage.getItem("infraops_tenants");
    return cached ? JSON.parse(cached) : defaultTenants;
  });
  const [activeTenant, setActiveTenant] = useState(() => tenants[0] || defaultTenants[0]);

  const [users, setUsers] = useState(() => {
    const cached = localStorage.getItem("infraops_users");
    return cached ? JSON.parse(cached) : defaultUsers;
  });

  const [integrations, setIntegrations] = useState(() => {
    const cached = localStorage.getItem("infraops_integrations");
    return cached ? JSON.parse(cached) : defaultIntegrations;
  });

  const [nodes, setNodes] = useState(() => {
    const cached = localStorage.getItem("infraops_nodes");
    return cached ? JSON.parse(cached) : defaultNodes;
  });

  const [workloads, setWorkloads] = useState(() => {
    const cached = localStorage.getItem("infraops_workloads");
    return cached ? JSON.parse(cached) : defaultWorkloads;
  });

  // Save to LocalStorage whenever state changes
  useEffect(() => {
    localStorage.setItem("infraops_tenants", JSON.stringify(tenants));
  }, [tenants]);

  useEffect(() => {
    localStorage.setItem("infraops_users", JSON.stringify(users));
  }, [users]);

  useEffect(() => {
    localStorage.setItem("infraops_integrations", JSON.stringify(integrations));
  }, [integrations]);

  useEffect(() => {
    localStorage.setItem("infraops_nodes", JSON.stringify(nodes));
  }, [nodes]);

  useEffect(() => {
    localStorage.setItem("infraops_workloads", JSON.stringify(workloads));
  }, [workloads]);

  // Safe merger preventing data loss
  const mergeLists = (localList, remoteList, syncEndpoint) => {
    const map = new Map();
    remoteList.forEach((item) => map.set(item.id, item));
    localList.forEach((item) => {
      if (!map.has(item.id)) {
        map.set(item.id, item);
        // Resync local item to backend if missing on backend
        if (syncEndpoint) {
          fetch(`${API_BASE}${syncEndpoint}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(item),
          }).catch(() => {});
        }
      }
    });
    return Array.from(map.values());
  };

  // Load from API on mount and merge safely
  useEffect(() => {
    fetch(`${API_BASE}/api/v1/tenants`)
      .then((res) => res.json())
      .then((data) => {
        if (data.tenants && data.tenants.length > 0) {
          setTenants((prev) => {
            const merged = mergeLists(prev, data.tenants, "/api/v1/tenants");
            return merged;
          });
        }
      })
      .catch(() => {});

    fetch(`${API_BASE}/api/v1/users`)
      .then((res) => res.json())
      .then((data) => {
        if (data.users && data.users.length > 0) {
          setUsers((prev) => mergeLists(prev, data.users, "/api/v1/users"));
        }
      })
      .catch(() => {});

    fetch(`${API_BASE}/api/v1/integrations`)
      .then((res) => res.json())
      .then((data) => {
        if (data.integrations && data.integrations.length > 0) {
          setIntegrations((prev) => mergeLists(prev, data.integrations, "/api/v1/integrations"));
        }
      })
      .catch(() => {});

    fetch(`${API_BASE}/api/v1/nodes`)
      .then((res) => res.json())
      .then((data) => {
        if (data.nodes && data.nodes.length > 0) {
          setNodes((prev) => mergeLists(prev, data.nodes, "/api/v1/nodes"));
        }
      })
      .catch(() => {});

    fetch(`${API_BASE}/api/v1/workloads`)
      .then((res) => res.json())
      .then((data) => {
        if (data.workloads && data.workloads.length > 0) {
          setWorkloads((prev) => mergeLists(prev, data.workloads, "/api/v1/workloads"));
        }
      })
      .catch(() => {});
  }, []);

  // Modals state
  const [actionModalOpen, setActionModalOpen] = useState(false);
  const [modalTargetId, setModalTargetId] = useState("");
  const [modalActionKey, setModalActionKey] = useState("");

  const [enrollModalOpen, setEnrollModalOpen] = useState(false);
  const [workloadModalOpen, setWorkloadModalOpen] = useState(false);

  const handleAddTenant = async (tenantData) => {
    const newTenant = {
      id: `tenant-${Math.random().toString(36).substring(2, 8)}`,
      ...tenantData,
      createdAt: new Date().toISOString(),
    };
    setTenants((prev) => [...prev, newTenant]);
    setActiveTenant(newTenant);

    try {
      await fetch(`${API_BASE}/api/v1/tenants`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newTenant),
      });
    } catch (err) {
      console.warn("Offline fallback saved to LocalStorage:", err);
    }
  };

  const handleUpdateTenant = async (updatedTenant) => {
    setTenants((prev) => prev.map((t) => (t.id === updatedTenant.id ? updatedTenant : t)));
    if (activeTenant.id === updatedTenant.id) {
      setActiveTenant(updatedTenant);
    }

    try {
      await fetch(`${API_BASE}/api/v1/tenants/${updatedTenant.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedTenant),
      });
    } catch (err) {
      console.warn("Offline fallback saved to LocalStorage:", err);
    }
  };

  const handleAddUser = async (userData) => {
    const newUser = {
      id: `usr-${Math.random().toString(36).substring(2, 8)}`,
      ...userData,
    };
    setUsers((prev) => [...prev, newUser]);

    try {
      await fetch(`${API_BASE}/api/v1/users`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newUser),
      });
    } catch (err) {
      console.warn("Offline fallback saved to LocalStorage:", err);
    }
  };

  const handleUpdateUser = async (updatedUser) => {
    setUsers((prev) => prev.map((u) => (u.id === updatedUser.id ? updatedUser : u)));

    try {
      await fetch(`${API_BASE}/api/v1/users/${updatedUser.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedUser),
      });
    } catch (err) {
      console.warn("Offline fallback saved to LocalStorage:", err);
    }
  };

  const handleAddIntegration = async (intData) => {
    const newInt = {
      id: `int-${Math.random().toString(36).substring(2, 8)}`,
      ...intData,
      status: "active",
      lastSyncAt: new Date().toISOString(),
      discoveredNodesCount: 0,
      discoveredVmsCount: 0,
    };
    setIntegrations((prev) => [...prev, newInt]);

    try {
      await fetch(`${API_BASE}/api/v1/integrations`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newInt),
      });
    } catch (err) {
      console.warn("Offline fallback saved to LocalStorage:", err);
    }
  };

  const handleUpdateIntegration = async (updatedInt) => {
    setIntegrations((prev) => prev.map((i) => (i.id === updatedInt.id ? updatedInt : i)));

    try {
      await fetch(`${API_BASE}/api/v1/integrations/${updatedInt.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedInt),
      });
    } catch (err) {
      console.warn("Offline fallback saved to LocalStorage:", err);
    }
  };

  const handleTriggerSync = async (id) => {
    try {
      const res = await fetch(`${API_BASE}/api/v1/integrations/${id}/sync`, { method: "POST" });
      const data = await res.json();
      if (data.integration) {
        setIntegrations((prev) => prev.map((i) => (i.id === id ? data.integration : i)));
      }
    } catch {
      setIntegrations((prev) =>
        prev.map((i) =>
          i.id === id
            ? { ...i, lastSyncAt: new Date().toISOString(), discoveredNodesCount: 2, discoveredVmsCount: 8 }
            : i
        )
      );
    }
  };

  const handleAddWorkload = async (wlData) => {
    const newWl = {
      id: `wl-${Math.random().toString(36).substring(2, 8)}`,
      ...wlData,
      vmid: Number(wlData.vmid) || 200,
      cpus: Number(wlData.cpus) || 4,
      memoryBytes: (Number(wlData.memoryGb) || 8) * 1024 * 1024 * 1024,
      status: "running",
      provider: "custom",
    };
    setWorkloads((prev) => [...prev, newWl]);

    try {
      await fetch(`${API_BASE}/api/v1/workloads`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newWl),
      });
    } catch (err) {
      console.warn("Offline fallback saved to LocalStorage:", err);
    }
  };

  const handleOpenActionModal = (targetId, actionKey) => {
    setModalTargetId(targetId);
    setModalActionKey(actionKey);
    setActionModalOpen(true);
  };

  return (
    <div className="app-container">
      {/* Sidebar Navigation */}
      <aside className="sidebar">
        <div className="brand">
          <span>⚡ InfraOps AI</span>
        </div>

        <ul className="nav-list">
          <li className={`nav-item ${currentNav === "dashboard" ? "active" : ""}`} onClick={() => setCurrentNav("dashboard")}>
            📊 Dashboard
          </li>
          <li className={`nav-item ${currentNav === "tenants" ? "active" : ""}`} onClick={() => setCurrentNav("tenants")}>
            🏢 Clientes & Usuários
          </li>
          <li className={`nav-item ${currentNav === "integrations" ? "active" : ""}`} onClick={() => setCurrentNav("integrations")}>
            🔌 Hipervisores (PVE/Virt)
          </li>
          <li className={`nav-item ${currentNav === "nodes" ? "active" : ""}`} onClick={() => setCurrentNav("nodes")}>
            🖥️ Nós & Workloads
          </li>
          <li className={`nav-item ${currentNav === "ai" ? "active" : ""}`} onClick={() => setCurrentNav("ai")}>
            🤖 Console IA
          </li>
          <li className={`nav-item ${currentNav === "approvals" ? "active" : ""}`} onClick={() => setCurrentNav("approvals")}>
            🛡️ Aprovações & Auditoria
          </li>
        </ul>
      </aside>

      {/* Main Content Area */}
      <main className="main-content">
        <header className="top-bar">
          <h1 className="page-title">
            {currentNav === "dashboard" && "Dashboard Operacional"}
            {currentNav === "tenants" && "Gestão de Clientes & Usuários (RBAC)"}
            {currentNav === "integrations" && "Integrações Proxmox & Virtualizor"}
            {currentNav === "nodes" && "Inventário de Nós & Workloads"}
            {currentNav === "ai" && "Console Operacional de IA"}
            {currentNav === "approvals" && "Central de Aprovações & Auditoria"}
          </h1>

          <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
            {/* Theme Switcher */}
            <button
              className="btn btn-secondary"
              onClick={toggleTheme}
              style={{ padding: "0.4rem 0.8rem", fontSize: "0.8rem", display: "flex", alignItems: "center", gap: "0.4rem" }}
              title="Alternar Tema Claro / Escuro"
            >
              {theme === "dark" ? "☀️ Modo Claro" : "🌙 Modo Escuro"}
            </button>

            {/* Action Triggers */}
            <button className="btn btn-secondary" style={{ padding: "0.4rem 0.8rem", fontSize: "0.8rem" }} onClick={() => setEnrollModalOpen(true)}>
              🐧 + Instalar Agente Linux
            </button>
            <button className="btn btn-secondary" style={{ padding: "0.4rem 0.8rem", fontSize: "0.8rem" }} onClick={() => setWorkloadModalOpen(true)}>
              🖥️ + Cadastrar VM
            </button>

            {/* Dynamic Tenant Switcher */}
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <span style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>Tenant:</span>
              <select
                value={activeTenant.id}
                onChange={(e) => {
                  const t = tenants.find((item) => item.id === e.target.value);
                  if (t) setActiveTenant(t);
                }}
                style={{ background: "rgba(99, 102, 241, 0.15)", border: "1px solid rgba(99, 102, 241, 0.3)", color: "var(--accent-indigo)", padding: "0.4rem 0.8rem", borderRadius: "8px", fontWeight: 600, fontSize: "0.85rem", cursor: "pointer" }}
              >
                {tenants.map((t) => (
                  <option key={t.id} value={t.id} style={{ background: "#121824", color: "#fff" }}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </header>

        {/* View Switcher */}
        {currentNav === "dashboard" && (
          <DashboardView
            activeTenant={activeTenant}
            nodes={nodes}
            workloads={workloads}
            integrations={integrations}
            onOpenActionModal={handleOpenActionModal}
          />
        )}
        {currentNav === "tenants" && (
          <TenantsUsersView
            tenants={tenants}
            users={users}
            activeTenant={activeTenant}
            onSelectTenant={(t) => setActiveTenant(t)}
            onAddTenant={handleAddTenant}
            onUpdateTenant={handleUpdateTenant}
            onAddUser={handleAddUser}
            onUpdateUser={handleUpdateUser}
          />
        )}
        {currentNav === "integrations" && (
          <IntegrationsView
            integrations={integrations}
            activeTenant={activeTenant}
            onAddIntegration={handleAddIntegration}
            onUpdateIntegration={handleUpdateIntegration}
            onTriggerSync={handleTriggerSync}
          />
        )}
        {currentNav === "nodes" && (
          <NodeDetailView
            activeTenant={activeTenant}
            nodes={nodes}
            workloads={workloads}
            onOpenActionModal={handleOpenActionModal}
            onOpenAddWorkload={() => setWorkloadModalOpen(true)}
            onOpenEnrollAgent={() => setEnrollModalOpen(true)}
          />
        )}
        {currentNav === "ai" && <AiConsoleView activeTenant={activeTenant} onOpenActionModal={handleOpenActionModal} />}
        {currentNav === "approvals" && <ApprovalsAuditView activeTenant={activeTenant} />}
      </main>

      {/* Action Modals */}
      <ActionModal isOpen={actionModalOpen} targetId={modalTargetId} defaultActionKey={modalActionKey} onClose={() => setActionModalOpen(false)} />
      <EnrollAgentModal isOpen={enrollModalOpen} activeTenant={activeTenant} onClose={() => setEnrollModalOpen(false)} />
      <AddWorkloadModal isOpen={workloadModalOpen} nodes={nodes} activeTenant={activeTenant} onAddWorkload={handleAddWorkload} onClose={() => setWorkloadModalOpen(false)} />
    </div>
  );
}
export default App;
