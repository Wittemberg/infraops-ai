import React from "react";

export function DashboardView({ activeTenant, nodes = [], workloads = [], integrations = [], onOpenActionModal }) {
  const tenantNodes = nodes.filter((n) => n.tenantId === activeTenant?.id);
  const tenantWorkloads = workloads.filter((w) => w.tenantId === activeTenant?.id);
  const tenantIntegrations = integrations.filter((i) => i.tenantId === activeTenant?.id);

  const onlineNodes = tenantNodes.filter((n) => n.status === "online").length;
  const offlineNodes = tenantNodes.filter((n) => n.status === "offline").length;
  const degradedNodes = tenantNodes.filter((n) => n.status === "degraded").length;

  const runningWorkloads = tenantWorkloads.filter((w) => w.status === "running").length;

  // Generate dynamic exception items based on real tenant resources
  const attentionItems = [];
  tenantNodes.forEach((node) => {
    if (node.status === "offline" || node.status === "degraded") {
      attentionItems.push({
        id: `att-${node.id}`,
        target: node.name,
        type: "Nó Host",
        issue: node.status === "offline" ? "Heartbeat ausente / Nó inacessível" : "Pressão de memória / Carga elevada",
        severity: node.status === "offline" ? "critical" : "high",
        age: "Recente",
      });
    }
  });

  return (
    <div>
      {/* Active Tenant Context Banner */}
      <div style={{ padding: "0.75rem 2rem 0 2rem" }}>
        <div style={{ background: "rgba(99, 102, 241, 0.08)", border: "1px solid rgba(99, 102, 241, 0.2)", borderRadius: "8px", padding: "0.6rem 1rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>
            🏢 Visualizando ambiente do cliente: <strong style={{ color: "var(--accent-indigo)" }}>{activeTenant?.name}</strong> ({activeTenant?.domain || "Domínio padrão"})
          </span>
          <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>ID: {activeTenant?.id}</span>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="kpi-grid">
        <div className="glass-panel kpi-card">
          <div className="kpi-title">Nós Registrados</div>
          <div className="kpi-value" style={{ color: "var(--accent-indigo)" }}>{tenantNodes.length}</div>
          <div style={{ fontSize: "0.8rem", color: "var(--text-secondary)", marginTop: "0.4rem" }}>
            <span style={{ color: "var(--accent-emerald)" }}>{onlineNodes} Online</span> •{" "}
            <span style={{ color: "var(--accent-amber)" }}>{degradedNodes} Degraded</span> •{" "}
            <span style={{ color: "var(--accent-rose)" }}>{offlineNodes} Offline</span>
          </div>
        </div>

        <div className="glass-panel kpi-card">
          <div className="kpi-title">VMs & Workloads</div>
          <div className="kpi-value" style={{ color: "var(--accent-emerald)" }}>{tenantWorkloads.length}</div>
          <div style={{ fontSize: "0.8rem", color: "var(--text-secondary)", marginTop: "0.4rem" }}>
            <span>{runningWorkloads} em Execução</span> • <span>{tenantWorkloads.length - runningWorkloads} Paradas</span>
          </div>
        </div>

        <div className="glass-panel kpi-card">
          <div className="kpi-title">Hipervisores Conectados</div>
          <div className="kpi-value" style={{ color: "var(--accent-blue)" }}>{tenantIntegrations.length}</div>
          <div style={{ fontSize: "0.8rem", color: "var(--text-secondary)", marginTop: "0.4rem" }}>
            <span>{tenantIntegrations.map((i) => i.provider).join(", ") || "Nenhuma integração"}</span>
          </div>
        </div>

        <div className="glass-panel kpi-card">
          <div className="kpi-title">Status de Saúde</div>
          <div className="kpi-value" style={{ color: offlineNodes === 0 ? "var(--accent-emerald)" : "var(--accent-rose)" }}>
            {offlineNodes === 0 ? "100%" : `${Math.round(((tenantNodes.length - offlineNodes) / (tenantNodes.length || 1)) * 100)}%`}
          </div>
          <div style={{ fontSize: "0.8rem", color: "var(--text-secondary)", marginTop: "0.4rem" }}>
            <span>{offlineNodes === 0 ? "Todos os nós saudáveis" : `${offlineNodes} com alerta`}</span>
          </div>
        </div>
      </div>

      {/* Table Precisa de Atenção */}
      <div className="table-container">
        <div className="glass-panel" style={{ padding: "1.5rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem" }}>
            <div>
              <h2 style={{ fontFamily: "var(--font-heading)", fontSize: "1.2rem", fontWeight: 700 }}>
                ⚠️ Precisa de Atenção (Prioridade por Risco)
              </h2>
              <p style={{ fontSize: "0.8rem", color: "var(--text-secondary)", marginTop: "0.2rem" }}>
                Exceções e alertas detectados em recursos deste cliente.
              </p>
            </div>
            <button className="btn btn-primary" onClick={() => onOpenActionModal(tenantNodes[0]?.name || "node-default", "service.restart")}>
              + Executar Ação
            </button>
          </div>

          {attentionItems.length === 0 ? (
            <div style={{ textAlign: "center", padding: "2rem 0", color: "var(--text-secondary)" }}>
              <span style={{ fontSize: "2rem" }}>✅</span>
              <p style={{ marginTop: "0.5rem", fontWeight: 600, color: "var(--accent-emerald)" }}>
                Nenhuma anomalia detectada para o cliente {activeTenant?.name}!
              </p>
              <p style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>
                Todos os nós e workloads estão operando normalmente dentro dos parâmetros de conformidade.
              </p>
            </div>
          ) : (
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
          )}
        </div>
      </div>
    </div>
  );
}
