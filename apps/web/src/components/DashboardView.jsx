import React from "react";

export function DashboardView({ onOpenActionModal }) {
  const attentionItems = [
    { id: "att-1", target: "node-pve02", type: "Node", issue: "Heartbeat delayed > 120s", severity: "high", age: "4m ago" },
    { id: "att-2", target: "backup-vps-101", type: "Backup", issue: "Backup missing in 24h window", severity: "critical", age: "12m ago" },
    { id: "att-3", target: "storage-local-zfs", type: "Storage", issue: "Capacity pressure > 88%", severity: "medium", age: "1h ago" },
  ];

  return (
    <div>
      {/* KPI Cards */}
      <div className="kpi-grid">
        <div className="glass-panel kpi-card">
          <div className="kpi-title">Nós Registrados</div>
          <div className="kpi-value" style={{ color: "var(--accent-indigo)" }}>12</div>
          <div style={{ fontSize: "0.8rem", color: "var(--text-secondary)", marginTop: "0.4rem" }}>
            <span style={{ color: "var(--accent-emerald)" }}>10 Online</span> • <span style={{ color: "var(--accent-amber)" }}>1 Degraded</span> • <span style={{ color: "var(--accent-rose)" }}>1 Offline</span>
          </div>
        </div>

        <div className="glass-panel kpi-card">
          <div className="kpi-title">Status de Backups (24h)</div>
          <div className="kpi-value" style={{ color: "var(--accent-emerald)" }}>94%</div>
          <div style={{ fontSize: "0.8rem", color: "var(--text-secondary)", marginTop: "0.4rem" }}>
            <span>42 Válidos</span> • <span style={{ color: "var(--accent-rose)" }}>1 Ausente</span>
          </div>
        </div>

        <div className="glass-panel kpi-card">
          <div className="kpi-title">Pressão de Storage</div>
          <div className="kpi-value" style={{ color: "var(--accent-amber)" }}>78%</div>
          <div style={{ fontSize: "0.8rem", color: "var(--text-secondary)", marginTop: "0.4rem" }}>
            <span>3 pools &gt; 80% ocupação</span>
          </div>
        </div>

        <div className="glass-panel kpi-card">
          <div className="kpi-title">Aprovações Pendentes</div>
          <div className="kpi-value" style={{ color: "var(--accent-purple)" }}>2</div>
          <div style={{ fontSize: "0.8rem", color: "var(--text-secondary)", marginTop: "0.4rem" }}>
            <span>Aguardando revisão de risco</span>
          </div>
        </div>
      </div>

      {/* Table Precisa de Atenção */}
      <div className="table-container">
        <div className="glass-panel" style={{ padding: "1.5rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem" }}>
            <h2 style={{ fontFamily: "var(--font-heading)", fontSize: "1.2rem", fontWeight: 700 }}>
              ⚠️ Precisa de Atenção (Prioridade por Risco)
            </h2>
            <button className="btn btn-primary" onClick={() => onOpenActionModal("node-pve02", "service.restart")}>
              + Executar Ação
            </button>
          </div>

          <table className="custom-table">
            <thead>
              <tr>
                <th>Recurso Alvo</th>
                <th>Tipo</th>
                <th>Exceção Detectada</th>
                <th>Severidade</th>
                <th>Tempo</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {attentionItems.map((item) => (
                <tr key={item.id}>
                  <td style={{ fontWeight: 600 }}>{item.target}</td>
                  <td style={{ color: "var(--text-secondary)" }}>{item.type}</td>
                  <td style={{ color: "var(--text-primary)" }}>{item.issue}</td>
                  <td>
                    <span className={`badge badge-${item.severity === "critical" || item.severity === "high" ? "offline" : "degraded"}`}>
                      {item.severity}
                    </span>
                  </td>
                  <td style={{ color: "var(--text-muted)" }}>{item.age}</td>
                  <td>
                    <button
                      className="btn btn-secondary"
                      style={{ padding: "0.35rem 0.75rem", fontSize: "0.8rem" }}
                      onClick={() => onOpenActionModal(item.target, "system.packages_update")}
                    >
                      Investigar / Agir
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
