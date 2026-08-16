import React from "react";

export function ApprovalsAuditView() {
  return (
    <div style={{ padding: "1.5rem 2rem" }}>
      {/* Approvals Section */}
      <div className="glass-panel" style={{ padding: "1.5rem", marginBottom: "1.5rem" }}>
        <h2 style={{ fontFamily: "var(--font-heading)", fontSize: "1.2rem", marginBottom: "1rem" }}>
          🛡️ Central de Aprovações Pendentes (Policy Engine)
        </h2>

        <table className="custom-table">
          <thead>
            <tr>
              <th>ID Aprovação</th>
              <th>Solicitante</th>
              <th>Origem IA?</th>
              <th>Ação</th>
              <th>Alvo</th>
              <th>Risco</th>
              <th>Expira em</th>
              <th>Ação</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style={{ fontFamily: "var(--font-mono)" }}>appr-9012</td>
              <td>user-operator</td>
              <td><span className="badge badge-requires_approval">Sim (AI)</span></td>
              <td style={{ fontWeight: 600 }}>system.packages_update</td>
              <td>node-pve02</td>
              <td><span className="badge badge-degraded">MEDIUM</span></td>
              <td style={{ color: "var(--text-muted)" }}>14m</td>
              <td>
                <div style={{ display: "flex", gap: "0.5rem" }}>
                  <button className="btn btn-primary" style={{ padding: "0.3rem 0.6rem", fontSize: "0.75rem" }}>
                    Aprovar
                  </button>
                  <button className="btn btn-secondary" style={{ padding: "0.3rem 0.6rem", fontSize: "0.75rem", color: "var(--accent-rose)" }}>
                    Rejeitar
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Audit Section */}
      <div className="glass-panel" style={{ padding: "1.5rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
          <h2 style={{ fontFamily: "var(--font-heading)", fontSize: "1.2rem" }}>
            📜 Trilha de Auditoria Imutável (SHA-256 Hash Chain)
          </h2>
          <span className="badge badge-online">🔒 Status: Corrente de Hashes Válida</span>
        </div>

        <table className="custom-table">
          <thead>
            <tr>
              <th>Data / Hora</th>
              <th>Ator</th>
              <th>Tipo de Evento</th>
              <th>Ação</th>
              <th>Event Hash (SHA-256)</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style={{ color: "var(--text-muted)", fontSize: "0.8rem" }}>2026-08-15 22:14:02</td>
              <td>user-admin</td>
              <td>policy.decision</td>
              <td>service.restart</td>
              <td style={{ fontFamily: "var(--font-mono)", fontSize: "0.75rem", color: "var(--accent-blue)" }}>
                a7b9c1d3...e5f7
              </td>
            </tr>
            <tr>
              <td style={{ color: "var(--text-muted)", fontSize: "0.8rem" }}>2026-08-15 22:12:45</td>
              <td>ai-model-gemini</td>
              <td>ai.interpretation</td>
              <td>system.packages_update</td>
              <td style={{ fontFamily: "var(--font-mono)", fontSize: "0.75rem", color: "var(--accent-blue)" }}>
                f2e4d6c8...b0a1
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
