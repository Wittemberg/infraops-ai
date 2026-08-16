import React, { useState } from "react";

export function NodeDetailView({ nodeId = "node-pve01", onOpenActionModal }) {
  const [activeTab, setActiveTab] = useState("overview");

  const tabs = [
    { id: "overview", label: "Overview" },
    { id: "workloads", label: "Workloads (VMs/LXC)" },
    { id: "storage", label: "Storage" },
    { id: "backups", label: "Backups" },
    { id: "services", label: "Services" },
    { id: "jobs", label: "Jobs" },
    { id: "audit", label: "Audit" },
  ];

  return (
    <div style={{ padding: "1.5rem 2rem" }}>
      <div className="glass-panel" style={{ padding: "1.5rem", marginBottom: "1.5rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <h1 style={{ fontFamily: "var(--font-heading)", fontSize: "1.5rem", fontWeight: 800 }}>
              🖥️ Node: {nodeId}
            </h1>
            <p style={{ color: "var(--text-secondary)", fontSize: "0.875rem", marginTop: "0.25rem" }}>
              Proxmox VE 8.1.4 • Hostname: pve01.local • IP: 192.168.1.50
            </p>
          </div>
          <div style={{ display: "flex", gap: "0.75rem" }}>
            <button className="btn btn-secondary" onClick={() => onOpenActionModal(nodeId, "node.health")}>
              🏥 Health Check
            </button>
            <button className="btn btn-primary" onClick={() => onOpenActionModal(nodeId, "service.restart")}>
              🔄 Reiniciar Serviço
            </button>
          </div>
        </div>

        {/* Tab Header */}
        <div style={{ display: "flex", gap: "1rem", borderBottom: "1px solid var(--border-subtle)", marginTop: "1.5rem" }}>
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                background: "none",
                border: "none",
                color: activeTab === tab.id ? "var(--accent-indigo)" : "var(--text-secondary)",
                fontWeight: activeTab === tab.id ? 700 : 500,
                padding: "0.75rem 0.5rem",
                cursor: "pointer",
                borderBottom: activeTab === tab.id ? "2px solid var(--accent-indigo)" : "none",
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div className="glass-panel" style={{ padding: "1.5rem" }}>
        {activeTab === "overview" && (
          <div>
            <h3 style={{ fontSize: "1.1rem", marginBottom: "1rem" }}>Status de Recursos do Host</h3>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "1.5rem" }}>
              <div style={{ background: "rgba(255,255,255,0.03)", padding: "1rem", borderRadius: "8px" }}>
                <div style={{ color: "var(--text-secondary)", fontSize: "0.85rem" }}>Uso de CPU</div>
                <div style={{ fontSize: "1.5rem", fontWeight: 700, marginTop: "0.25rem", color: "var(--accent-emerald)" }}>14.2%</div>
                <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "0.25rem" }}>16 Cores Intel Xeon</div>
              </div>
              <div style={{ background: "rgba(255,255,255,0.03)", padding: "1rem", borderRadius: "8px" }}>
                <div style={{ color: "var(--text-secondary)", fontSize: "0.85rem" }}>Memória RAM</div>
                <div style={{ fontSize: "1.5rem", fontWeight: 700, marginTop: "0.25rem", color: "var(--accent-blue)" }}>24.8 GB / 64 GB</div>
                <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "0.25rem" }}>38% em uso</div>
              </div>
              <div style={{ background: "rgba(255,255,255,0.03)", padding: "1rem", borderRadius: "8px" }}>
                <div style={{ color: "var(--text-secondary)", fontSize: "0.85rem" }}>Agent Go Status</div>
                <div style={{ fontSize: "1.5rem", fontWeight: 700, marginTop: "0.25rem", color: "var(--accent-emerald)" }}>ONLINE</div>
                <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "0.25rem" }}>Heartbeat 14s atrás</div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "workloads" && (
          <div>
            <h3 style={{ fontSize: "1.1rem", marginBottom: "1rem" }}>Workloads Ativos (VMs & LXC)</h3>
            <table className="custom-table">
              <thead>
                <tr>
                  <th>VMID</th>
                  <th>Nome</th>
                  <th>Tipo</th>
                  <th>Status</th>
                  <th>CPUs</th>
                  <th>RAM</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>100</td>
                  <td style={{ fontWeight: 600 }}>web-server-01</td>
                  <td>QEMU</td>
                  <td><span className="badge badge-online">Running</span></td>
                  <td>4</td>
                  <td>8 GB</td>
                </tr>
                <tr>
                  <td>101</td>
                  <td style={{ fontWeight: 600 }}>redis-container</td>
                  <td>LXC</td>
                  <td><span className="badge badge-online">Running</span></td>
                  <td>2</td>
                  <td>2 GB</td>
                </tr>
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
