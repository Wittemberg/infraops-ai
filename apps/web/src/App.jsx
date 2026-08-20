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
import { LoginView } from "./components/LoginView.jsx";
import { ActionCatalogView } from "./components/ActionCatalogView.jsx";
import { AutomationsSchedulerView } from "./components/AutomationsSchedulerView.jsx";
import { AlertChannelsView } from "./components/AlertChannelsView.jsx";
import { InfrastructureIntelligenceView } from "./components/InfrastructureIntelligenceView.jsx";
import { SystemSettingsView } from "./components/SystemSettingsView.jsx";

const API_BASE = "https://infraopsai.awecloudsolution.com";

const defaultTenants = [
  { id: "tenant-default", name: "Default Tenant (infraops-prod)", domain: "infraopsai.awecloudsolution.com", createdAt: new Date().toISOString() },
  { id: "tenant-wrtec", name: "WR Tecnologia", domain: "wrtec.com.br", createdAt: new Date().toISOString() },
];

const defaultUsers = [
  { id: "usr-admin", tenantId: "tenant-default", name: "Wittemberg Admin", email: "admin@wrtec.com.br", role: "superadmin" },
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
  // Authentication State
  const [currentUser, setCurrentUser] = useState(() => {
    const cached = localStorage.getItem("infraops_user");
    return cached ? JSON.parse(cached) : null;
  });

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

  const handleLogout = () => {
    localStorage.removeItem("infraops_user");
    localStorage.removeItem("infraops_token");
    setCurrentUser(null);
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
          setTenants((prev) => mergeLists(prev, data.tenants, "/api/v1/tenants"));
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

  // Handlers for Add/Update mutations
  const handleAddTenant = async (tenantData) => {
    const newTenant = {
      id: `tenant-${Math.random().toString(36).substring(2, 8)}`,
      name: tenantData.name,
      domain: tenantData.domain,
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
      tenantId: userData.tenantId || activeTenant?.id || "tenant-default",
      name: userData.name,
      email: userData.email,
      role: userData.role,
      password: userData.password,
      mustChangePassword: userData.mustChangePassword !== false,
      createdAt: new Date().toISOString(),
    };
    setUsers((prev) => [...prev.filter((u) => u.id !== newUser.id), newUser]);

    // If user was created for a specific tenant, ensure activeTenant is synchronized
    const targetTenant = tenants.find((t) => t.id === newUser.tenantId);
    if (targetTenant && activeTenant?.id !== targetTenant.id) {
      setActiveTenant(targetTenant);
    }

    try {
      const res = await fetch(`${API_BASE}/api/v1/users`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newUser),
      });
      const data = await res.json();
      if (data.user) {
        setUsers((prev) => [...prev.filter((u) => u.id !== newUser.id && u.id !== data.user.id), data.user]);
      }
    } catch (err) {
      console.warn("Offline fallback saved to LocalStorage:", err);
    }
  };

  const handleUpdateUser = async (updatedUser) => {
    setUsers((prev) => prev.map((u) => (u.id === updatedUser.id ? { ...u, ...updatedUser } : u)));
    try {
      const res = await fetch(`${API_BASE}/api/v1/users/${updatedUser.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedUser),
      });
      const data = await res.json();
      if (data.user) {
        setUsers((prev) => prev.map((u) => (u.id === data.user.id ? data.user : u)));
      }
  const handleDeleteUser = async (userId) => {
    setUsers((prev) => prev.filter((u) => u.id !== userId));
    try {
      await fetch(`${API_BASE}/api/v1/users/${userId}`, {
        method: "DELETE",
      });
    } catch (err) {
      console.warn("Offline fallback delete user:", err);
    }
  };

  const handleAddIntegration = async (integrationData) => {
    const newIntegration = {
      id: `int-${Math.random().toString(36).substring(2, 8)}`,
      tenantId: activeTenant.id,
      name: integrationData.name,
      provider: integrationData.provider,
      baseUrl: integrationData.baseUrl,
      status: "active",
      lastSyncAt: new Date().toISOString(),
      discoveredNodesCount: integrationData.provider === "proxmox" ? 2 : 1,
      discoveredVmsCount: integrationData.provider === "proxmox" ? 8 : 4,
    };
    setIntegrations((prev) => [...prev, newIntegration]);

    try {
      await fetch(`${API_BASE}/api/v1/integrations`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newIntegration),
      });
    } catch (err) {
      console.warn("Offline fallback saved to LocalStorage:", err);
    }
  };

  const handleUpdateIntegration = async (updatedIntegration) => {
    setIntegrations((prev) => prev.map((i) => (i.id === updatedIntegration.id ? updatedIntegration : i)));
    try {
      await fetch(`${API_BASE}/api/v1/integrations/${updatedIntegration.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedIntegration),
      });
    } catch (err) {
      console.warn("Offline fallback saved to LocalStorage:", err);
    }
  };

  const handleTriggerSync = async (integrationId) => {
    const found = integrations.find((i) => i.id === integrationId);
    if (!found) return;

    try {
      const res = await fetch(`${API_BASE}/api/v1/integrations/${integrationId}/sync`, { method: "POST" });
      const data = await res.json();
      if (data.discoveredNodes) {
        setNodes((prev) => [...prev.filter((n) => !data.discoveredNodes.some((dn) => dn.id === n.id)), ...data.discoveredNodes]);
      }
      if (data.discoveredWorkloads) {
        setWorkloads((prev) => [...prev.filter((w) => !data.discoveredWorkloads.some((dw) => dw.id === w.id)), ...data.discoveredWorkloads]);
      }
    } catch {
      // Offline fallback simulation
      const newDiscoveredNodes = [
        {
          id: `node-${found.provider}-01`,
          tenantId: found.tenantId,
          name: `${found.provider}-node-master`,
          hostname: `${found.provider}-master.local`,
          provider: found.provider,
          status: "online",
          ipAddress: "192.168.1.100",
          os: "Linux / Proxmox VE",
          lastHeartbeatAt: new Date().toISOString(),
        },
      ];
      setNodes((prev) => [...prev, ...newDiscoveredNodes]);
    }

    setIntegrations((prev) =>
      prev.map((item) => (item.id === integrationId ? { ...item, lastSyncAt: new Date().toISOString(), status: "active" } : item))
    );
  };

  const handleAddWorkload = async (workloadData) => {
    const newWl = {
      id: `wl-${Math.random().toString(36).substring(2, 8)}`,
      tenantId: workloadData.tenantId || activeTenant.id,
      nodeId: workloadData.nodeId,
      environment: workloadData.environment || "on-premise",
      ipAddress: workloadData.ipAddress || "192.168.1.50",
      os: workloadData.os || "Linux",
      vmid: Number(workloadData.vmid) || 100,
      name: workloadData.name,
      type: workloadData.type || "qemu",
      status: "running",
      cpus: Number(workloadData.cpus) || 2,
      memoryBytes: (Number(workloadData.memoryGb) || 4) * 1024 * 1024 * 1024,
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

  // If user is not logged in, render the Modern Minimalist Login View with System Health Check
  if (!currentUser) {
    return (
      <LoginView
        onLoginSuccess={(user, token) => {
          setCurrentUser(user);
          localStorage.setItem("infraops_user", JSON.stringify(user));
          localStorage.setItem("infraops_token", token);
        }}
      />
    );
  }

  const isSuperAdmin = currentUser.role === "superadmin";
  const isAdmin = currentUser.role === "admin" || currentUser.role === "owner" || isSuperAdmin;
  const isOperator = currentUser.role === "operator" || isAdmin;

  return (
    <div className="app-container">
      {/* Sidebar Navigation */}
      <aside className="sidebar">
        <div className="brand" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingRight: "1rem" }}>
          <span>⚡ InfraOps AI</span>
        </div>

        <ul className="nav-list">
          <li className={`nav-item ${currentNav === "dashboard" ? "active" : ""}`} onClick={() => setCurrentNav("dashboard")}>
            📊 Dashboard
          </li>
          {isAdmin && (
            <li className={`nav-item ${currentNav === "tenants" ? "active" : ""}`} onClick={() => setCurrentNav("tenants")}>
              🏢 Clientes & Usuários
            </li>
          )}
          {isAdmin && (
            <li className={`nav-item ${currentNav === "integrations" ? "active" : ""}`} onClick={() => setCurrentNav("integrations")}>
              🔌 Hipervisores (PVE/Virt)
            </li>
          )}
          {isAdmin && (
            <li className={`nav-item ${currentNav === "alerts" ? "active" : ""}`} onClick={() => setCurrentNav("alerts")}>
              🔔 Canais de Alerta
            </li>
          )}
          <li className={`nav-item ${currentNav === "nodes" ? "active" : ""}`} onClick={() => setCurrentNav("nodes")}>
            🖥️ Nós & Workloads
          </li>
          {isOperator && (
            <li className={`nav-item ${currentNav === "ai" ? "active" : ""}`} onClick={() => setCurrentNav("ai")}>
              🤖 Console IA
            </li>
          )}
          <li className={`nav-item ${currentNav === "approvals" ? "active" : ""}`} onClick={() => setCurrentNav("approvals")}>
            🛡️ Aprovações & Auditoria
          </li>
          {isOperator && (
            <li className={`nav-item ${currentNav === "actions" ? "active" : ""}`} onClick={() => setCurrentNav("actions")}>
              ⚡ Catálogo de Actions
            </li>
          )}
          {isOperator && (
            <li className={`nav-item ${currentNav === "automations" ? "active" : ""}`} onClick={() => setCurrentNav("automations")}>
              ⏰ Automações & Schedules
            </li>
          )}
          {isOperator && (
            <li className={`nav-item ${currentNav === "intelligence" ? "active" : ""}`} onClick={() => setCurrentNav("intelligence")}>
              💡 Inteligência & Advisor
            </li>
          )}
          {isAdmin && (
            <li className={`nav-item ${currentNav === "settings" ? "active" : ""}`} onClick={() => setCurrentNav("settings")}>
              ⚙️ Configurações Gerais
            </li>
          )}
        </ul>

        {/* User Card in Sidebar Bottom */}
        <div style={{ marginTop: "auto", padding: "1rem", borderTop: "1px solid var(--border-subtle)", background: "rgba(0,0,0,0.2)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.4rem" }}>
            <span style={{ fontSize: "1.1rem" }}>{isSuperAdmin ? "👑" : "👤"}</span>
            <div style={{ overflow: "hidden" }}>
              <div style={{ fontSize: "0.85rem", fontWeight: 700, textOverflow: "ellipsis", overflow: "hidden", whiteSpace: "nowrap" }}>
                {currentUser.name}
              </div>
              <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", textOverflow: "ellipsis", overflow: "hidden", whiteSpace: "nowrap" }}>
                {currentUser.email}
              </div>
            </div>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "0.5rem" }}>
            <span
              className={`badge badge-${isSuperAdmin ? "online" : "requires_approval"}`}
              style={{ fontSize: "0.7rem", padding: "0.15rem 0.4rem" }}
            >
              {isSuperAdmin ? "SUPERADMIN" : currentUser.role?.toUpperCase()}
            </span>
            <button
              onClick={handleLogout}
              style={{
                background: "none",
                border: "none",
                color: "var(--accent-rose)",
                fontSize: "0.75rem",
                cursor: "pointer",
                padding: "0.2rem 0.4rem",
              }}
            >
              🚪 Sair
            </button>
          </div>
        </div>
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

          <div style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
            {/* Theme Switcher */}
            <button
              className="btn btn-secondary"
              onClick={toggleTheme}
              style={{ padding: "0.4rem 0.8rem", fontSize: "0.8rem", display: "flex", alignItems: "center", gap: "0.4rem" }}
              title="Alternar Tema Claro / Escuro"
            >
              {theme === "dark" ? "☀️ Claro" : "🌙 Escuro"}
            </button>

            {/* Action Triggers */}
            {isOperator && (
              <button className="btn btn-secondary" style={{ padding: "0.4rem 0.8rem", fontSize: "0.8rem" }} onClick={() => setEnrollModalOpen(true)}>
                🐧 + Agente
              </button>
            )}
            {isOperator && (
              <button className="btn btn-secondary" style={{ padding: "0.4rem 0.8rem", fontSize: "0.8rem" }} onClick={() => setWorkloadModalOpen(true)}>
                🖥️ + VM
              </button>
            )}

            {/* Dynamic Tenant Switcher */}
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <span style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>Tenant:</span>
              <select
                value={activeTenant.id}
                disabled={!isSuperAdmin && currentUser.tenantId !== "global"}
                onChange={(e) => {
                  const t = tenants.find((item) => item.id === e.target.value);
                  if (t) setActiveTenant(t);
                }}
                style={{
                  background: "rgba(99, 102, 241, 0.15)",
                  border: "1px solid rgba(99, 102, 241, 0.3)",
                  color: "var(--accent-indigo)",
                  padding: "0.4rem 0.8rem",
                  borderRadius: "8px",
                  fontWeight: 600,
                  fontSize: "0.85rem",
                  cursor: isSuperAdmin ? "pointer" : "default",
                }}
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
        {currentNav === "tenants" && isAdmin && (
          <TenantsUsersView
            tenants={tenants}
            users={users}
            activeTenant={activeTenant}
            isSuperAdmin={isSuperAdmin}
            onSelectTenant={(t) => setActiveTenant(t)}
            onAddTenant={handleAddTenant}
            onUpdateTenant={handleUpdateTenant}
            onAddUser={handleAddUser}
            onUpdateUser={handleUpdateUser}
            onDeleteUser={handleDeleteUser}
          />
        )}
        {currentNav === "integrations" && isAdmin && (
          <IntegrationsView
            integrations={integrations}
            activeTenant={activeTenant}
            onAddIntegration={handleAddIntegration}
            onUpdateIntegration={handleUpdateIntegration}
            onTriggerSync={handleTriggerSync}
          />
        )}
        {currentNav === "alerts" && isAdmin && <AlertChannelsView activeTenant={activeTenant} />}
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
        {currentNav === "ai" && isOperator && <AiConsoleView activeTenant={activeTenant} onOpenActionModal={handleOpenActionModal} />}
        {currentNav === "approvals" && <ApprovalsAuditView activeTenant={activeTenant} />}
        {currentNav === "actions" && isOperator && <ActionCatalogView activeTenant={activeTenant} onOpenActionModal={handleOpenActionModal} />}
        {currentNav === "automations" && isOperator && <AutomationsSchedulerView activeTenant={activeTenant} />}
        {currentNav === "intelligence" && isOperator && <InfrastructureIntelligenceView activeTenant={activeTenant} />}
        {currentNav === "settings" && isAdmin && <SystemSettingsView isSuperAdmin={isSuperAdmin} activeTenant={activeTenant} />}
      </main>

      {/* Action Modals */}
      <ActionModal isOpen={actionModalOpen} targetId={modalTargetId} defaultActionKey={modalActionKey} onClose={() => setActionModalOpen(false)} />
      <EnrollAgentModal isOpen={enrollModalOpen} activeTenant={activeTenant} onClose={() => setEnrollModalOpen(false)} />
      <AddWorkloadModal isOpen={workloadModalOpen} nodes={nodes} activeTenant={activeTenant} onAddWorkload={handleAddWorkload} onClose={() => setWorkloadModalOpen(false)} />
    </div>
  );
}
export default App;
