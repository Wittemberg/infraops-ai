import React, { useState } from "react";

export function NodeDetailView({ activeTenant, nodes = [], workloads = [], onOpenActionModal, onOpenAddWorkload, onOpenEnrollAgent }) {
  const [activeSubTab, setActiveSubTab] = useState("all");

  const tenantNodes = nodes.filter((n) => n.tenantId === activeTenant?.id);
  const tenantWorkloads = workloads.filter((w) => w.tenantId === activeTenant?.id);

  const displayedWorkloads = activeSubTab === "all"
    ? tenantWorkloads
    : activeSubTab === "standalone"
    ? tenantWorkloads.filter((w) => w.nodeId === "standalone" || w.environment === "on-premise" || w.environment === "cloud")
    : tenantWorkloads.filter((w) => w.nodeId !== "standalone");

  return (
    <div style={{ padding: "1.5rem 2rem" }}>
      {/* Active Tenant Context Banner */}
      <div style={{ marginBottom: "1.5rem" }}>
        <div style={{ background: "rgba(99, 102, 241, 0.08)", border: "1px solid rgba(99, 102, 241, 0.2)", borderRadius: "8px", padding: "0.6rem 1rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>
            🏢 Inventário de infraestrutura do cliente: <strong style={{ color: "var(--accent-indigo)" }}>{activeTenant?.name}</strong>
          </span>
          <div style={{ display: "flex", gap: "0.5rem" }}>
            <button className="btn btn-secondary" style={{ padding: "0.3rem 0.6rem", fontSize: "0.75rem" }} onClick={onOpenEnrollAgent}>
              🐧 + Instalar Agente no Servidor
            </button>
            <button className="btn btn-primary" style={{ padding: "0.3rem 0.6rem", fontSize: "0.75rem" }} onClick={onOpenAddWorkload}>
              🖥️ + Cadastrar Servidor / VM
            </button>
          </div>
        </div>
      </div>

      {/* Hipervisores & Nós Físicos Section */}
      {tenantNodes.length > 0 && (
        <div className="glass-panel" style={{ padding: "1.5rem", marginBottom: "1.5rem" }}>
          <h2 style={{ fontFamily: "var(--font-heading)", fontSize: "1.2rem", fontWeight: 700, marginBottom: "1rem" }}>
            ⚡ Hipervisores & Nós de Cluster (Proxmox / Virtualizor / Bare-Metal)
          </h2>
          <table className="custom-table">
            <thead>
              <tr>
                <th>Nome do Nó</th>
                <th>Provedor</th>
                <th>Endereço IP</th>
                <th>Sistema Operacional</th>
                <th>Status</th>
                <th>Último Heartbeat</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {tenantNodes.map((n) => (
                <tr key={n.id}>
                  <td style={{ fontWeight: 600 }}>{n.name}</td>
                  <td>
                    <span className="badge badge-online">{n.provider}</span>
                  </td>
                  <td style={{ fontFamily: "var(--font-mono)", fontSize: "0.85rem", color: "var(--text-secondary)" }}>{n.ipAddress}</td>
                  <td style={{ fontSize: "0.85rem" }}>{n.os}</td>
                  <td>
                    <span className={`badge badge-${n.status === "online" ? "online" : "offline"}`}>{n.status}</span>
                  </td>
                  <td style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>
                    {n.lastHeartbeatAt ? new Date(n.lastHeartbeatAt).toLocaleTimeString("pt-BR") : "Agora"}
                  </td>
                  <td>
                    <button
                      className="btn btn-secondary"
                      style={{ padding: "0.3rem 0.6rem", fontSize: "0.75rem" }}
                      onClick={() => onOpenActionModal(n.name, "node.health")}
                    >
                      🏥 Health Check
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Servidores Locais & VMs Section */}
      <div className="glass-panel" style={{ padding: "1.5rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
          <div>
            <h2 style={{ fontFamily: "var(--font-heading)", fontSize: "1.2rem", fontWeight: 700 }}>
              🖥️ Servidores Locais (On-Premise), Cloud & VMs Monitoradas
            </h2>
            <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)", marginTop: "0.2rem" }}>
              Servidores monitorados diretamente via agente ou sintéticos sem necessidade de hipervisor próprio.
            </p>
          </div>

          <div style={{ display: "flex", gap: "0.5rem" }}>
            <button
              className={`btn ${activeSubTab === "all" ? "btn-primary" : "btn-secondary"}`}
              style={{ padding: "0.35rem 0.75rem", fontSize: "0.8rem" }}
              onClick={() => setActiveSubTab("all")}
            >
              Todos ({tenantWorkloads.length})
            </button>
            <button
              className={`btn ${activeSubTab === "standalone" ? "btn-primary" : "btn-secondary"}`}
              style={{ padding: "0.35rem 0.75rem", fontSize: "0.8rem" }}
              onClick={() => setActiveSubTab("standalone")}
            >
              🏢 Locais / Standalone ({tenantWorkloads.filter((w) => w.nodeId === "standalone" || w.environment === "on-premise").length})
            </button>
            <button
              className={`btn ${activeSubTab === "cluster" ? "btn-primary" : "btn-secondary"}`}
              style={{ padding: "0.35rem 0.75rem", fontSize: "0.8rem" }}
              onClick={() => setActiveSubTab("cluster")}
            >
              ⚡ Cluster VMs ({tenantWorkloads.filter((w) => w.nodeId !== "standalone").length})
            </button>
          </div>
        </div>

        {displayedWorkloads.length === 0 ? (
          <div style={{ textAlign: "center", padding: "2.5rem 0", color: "var(--text-secondary)" }}>
            <span style={{ fontSize: "2rem" }}>🏢</span>
            <p style={{ fontSize: "1rem", fontWeight: 600, marginTop: "0.5rem" }}>
              Nenhum servidor ou VM cadastrada para {activeTenant?.name}.
            </p>
            <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginTop: "0.25rem" }}>
              Você pode cadastrar servidores locais instalados no escritório/datacenter do cliente para monitoramento.
            </p>
            <button className="btn btn-primary" style={{ marginTop: "1rem" }} onClick={onOpenAddWorkload}>
              + Cadastrar Primeiro Servidor / VM
            </button>
          </div>
        ) : (
          <table className="custom-table">
            <thead>
              <tr>
                <th>Nome do Servidor / VM</th>
                <th>Ambiente</th>
                <th>IP / Hostname</th>
                <th>Nó Hospedeiro</th>
                <th>Recursos</th>
                <th>Status</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {displayedWorkloads.map((w) => (
                <tr key={w.id}>
                  <td style={{ fontWeight: 600 }}>{w.name}</td>
                  <td>
                    <span className={`badge badge-${w.nodeId === "standalone" || w.environment === "on-premise" ? "requires_approval" : "online"}`}>
                      {w.nodeId === "standalone" || w.environment === "on-premise" ? "🏢 ON-PREMISE" : "⚡ CLUSTER"}
                    </span>
                  </td>
                  <td style={{ fontFamily: "var(--font-mono)", fontSize: "0.85rem", color: "var(--text-secondary)" }}>
                    {w.ipAddress || "192.168.1.x"}
                  </td>
                  <td>
                    {w.nodeId === "standalone" ? (
                      <span style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>Standalone (Local)</span>
                    ) : (
                      <span style={{ color: "var(--accent-indigo)", fontWeight: 500 }}>{w.nodeId}</span>
                    )}
                  </td>
                  <td style={{ fontSize: "0.85rem" }}>
                    <strong>{w.cpus || 2} vCPU</strong> • <strong>{Math.round((w.memoryBytes || 4294967296) / (1024 * 1024 * 1024))} GB RAM</strong>
                  </td>
                  <td>
                    <span className={`badge badge-${w.status === "running" ? "online" : "offline"}`}>{w.status || "running"}</span>
                  </td>
                  <td>
                    <button
                      className="btn btn-secondary"
                      style={{ padding: "0.3rem 0.6rem", fontSize: "0.75rem" }}
                      onClick={() => onOpenActionModal(w.name, "service.restart")}
                    >
                      🔄 Ações
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
