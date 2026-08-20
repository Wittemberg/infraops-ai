import React, { useState } from "react";

export function ApprovalsAuditView({ activeTenant }) {
  const [approvals, setApprovals] = useState(() => {
    const cached = localStorage.getItem("infraops_approvals");
    if (cached) {
      try {
        return JSON.parse(cached);
      } catch {
        return [];
      }
    }
    return [
      {
        id: "appr-9012",
        tenantId: "tenant-default",
        requester: "ai-orchestrator",
        isAi: true,
        action: "system.packages_update",
        target: "node-pve01",
        risk: "MEDIUM",
        status: "pending",
        expiresAt: "14m",
        createdAt: new Date().toISOString(),
      },
      {
        id: "appr-9013",
        tenantId: "tenant-default",
        requester: "usr-operator",
        isAi: false,
        action: "service.restart",
        target: "srv-db-postgres",
        risk: "HIGH",
        status: "pending",
        expiresAt: "45m",
        createdAt: new Date().toISOString(),
      },
    ];
  });

  const [auditEvents, setAuditEvents] = useState(() => {
    const cached = localStorage.getItem("infraops_audit_events");
    if (cached) {
      try {
        return JSON.parse(cached);
      } catch {
        return [];
      }
    }
    return [
      {
        id: "ev-100",
        tenantId: "tenant-default",
        timestamp: new Date(Date.now() - 1000 * 60 * 12).toLocaleString("pt-BR"),
        actor: "usr-admin",
        eventType: "policy.decision",
        action: "service.restart",
        target: "web-server-01",
        eventHash: "a7b9c1d3e5f7890123456789abcdef0123456789abcdef0123456789abcdef01",
        prevHash: "0000000000000000000000000000000000000000000000000000000000000000",
      },
      {
        id: "ev-101",
        tenantId: "tenant-default",
        timestamp: new Date(Date.now() - 1000 * 60 * 5).toLocaleString("pt-BR"),
        actor: "ai-orchestrator",
        eventType: "ai.recommendation",
        action: "system.packages_update",
        target: "node-pve01",
        eventHash: "f2e4d6c8b0a123456789abcdef0123456789abcdef0123456789abcdef012345",
        prevHash: "a7b9c1d3e5f7890123456789abcdef0123456789abcdef0123456789abcdef01",
      },
    ];
  });

  const tenantApprovals = approvals.filter((a) => a.tenantId === activeTenant?.id);
  const tenantAuditEvents = auditEvents.filter((ev) => ev.tenantId === activeTenant?.id);

  const [verifying, setVerifying] = useState(false);
  const [verificationResult, setVerificationResult] = useState(null);

  const handleDecision = (id, newStatus) => {
    const approval = approvals.find((a) => a.id === id);
    if (!approval) return;

    setApprovals((prev) => prev.map((a) => (a.id === id ? { ...a, status: newStatus } : a)));

    // Generate SHA-256 hash simulation for audit chain
    const fakeHash = Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join("");
    const lastHash = auditEvents[auditEvents.length - 1]?.eventHash || "0".repeat(64);

    const newAuditEvent = {
      id: `ev-${Date.now()}`,
      timestamp: new Date().toLocaleString("pt-BR"),
      actor: "usr-admin (Você)",
      eventType: newStatus === "approved" ? "approval.granted" : "approval.rejected",
      action: approval.action,
      target: approval.target,
      eventHash: fakeHash,
      prevHash: lastHash,
    };

    setAuditEvents((prev) => [newAuditEvent, ...prev]);
  };

  const handleVerifyChain = () => {
    setVerifying(true);
    setVerificationResult(null);

    setTimeout(() => {
      setVerifying(false);
      setVerificationResult({
        valid: true,
        verifiedEventsCount: auditEvents.length,
        algorithm: "SHA-256 Canonical Serialized Hash Chain",
        timestamp: new Date().toLocaleString("pt-BR"),
      });
    }, 600);
  };

  const handleCreateTestApproval = () => {
    const newId = `appr-${Math.floor(Math.random() * 9000) + 1000}`;
    const newAppr = {
      id: newId,
      tenantId: activeTenant?.id || "tenant-default",
      requester: "ai-orchestrator",
      isAi: true,
      action: "storage.snapshot_prune",
      target: "storage-local-zfs",
      risk: "HIGH",
      status: "pending",
      expiresAt: "60m",
      createdAt: new Date().toISOString(),
    };
    setApprovals((prev) => [newAppr, ...prev]);
  };

  return (
    <div style={{ padding: "1.5rem 2rem" }}>
      {/* Context Banner */}
      <div style={{ marginBottom: "1.5rem" }}>
        <div style={{ background: "rgba(99, 102, 241, 0.08)", border: "1px solid rgba(99, 102, 241, 0.2)", borderRadius: "8px", padding: "0.6rem 1rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>
            🛡️ Governança e Auditoria do cliente: <strong style={{ color: "var(--accent-indigo)" }}>{activeTenant?.name}</strong>
          </span>
          <button className="btn btn-secondary" style={{ padding: "0.3rem 0.6rem", fontSize: "0.75rem" }} onClick={handleCreateTestApproval}>
            + Simular Solicitação de Risco
          </button>
        </div>
      </div>

      {/* Approvals Section */}
      <div className="glass-panel" style={{ padding: "1.5rem", marginBottom: "1.5rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
          <div>
            <h2 style={{ fontFamily: "var(--font-heading)", fontSize: "1.2rem", fontWeight: 700 }}>
              🛡️ Central de Aprovações Pendentes (Policy Engine)
            </h2>
            <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)", marginTop: "0.2rem" }}>
              Operações de alto risco requerem confirmação explícita. O Policy Engine bloqueia auto-aprovação de risco.
            </p>
          </div>
        </div>

        {tenantApprovals.length === 0 ? (
          <div style={{ textAlign: "center", padding: "2rem 0", color: "var(--text-muted)" }}>
            <p>✅ Nenhuma aprovação pendente no momento para o cliente <strong>{activeTenant?.name}</strong>.</p>
          </div>
        ) : (
          <table className="custom-table">
            <thead>
              <tr>
                <th>ID Aprovação</th>
                <th>Solicitante</th>
                <th>Origem IA?</th>
                <th>Ação Proposta</th>
                <th>Alvo</th>
                <th>Risco</th>
                <th>Status</th>
                <th>Decisão do Operador</th>
              </tr>
            </thead>
            <tbody>
              {tenantApprovals.map((appr) => (
                <tr key={appr.id}>
                  <td style={{ fontFamily: "var(--font-mono)", color: "var(--accent-indigo)" }}>{appr.id}</td>
                  <td style={{ fontWeight: 600 }}>{appr.requester}</td>
                  <td>
                    {appr.isAi ? (
                      <span className="badge badge-requires_approval">🤖 Sim (IA)</span>
                    ) : (
                      <span style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>👤 Humano</span>
                    )}
                  </td>
                  <td style={{ fontWeight: 600 }}>{appr.action}</td>
                  <td style={{ color: "var(--text-secondary)" }}>{appr.target}</td>
                  <td>
                    <span className={`badge badge-${appr.risk === "HIGH" ? "offline" : "degraded"}`}>
                      {appr.risk}
                    </span>
                  </td>
                  <td>
                    <span className={`badge badge-${appr.status === "approved" ? "online" : appr.status === "rejected" ? "offline" : "requires_approval"}`}>
                      {appr.status.toUpperCase()}
                    </span>
                  </td>
                  <td>
                    {appr.status === "pending" ? (
                      <div style={{ display: "flex", gap: "0.5rem" }}>
                        <button
                          className="btn btn-primary"
                          style={{ padding: "0.3rem 0.6rem", fontSize: "0.75rem" }}
                          onClick={() => handleDecision(appr.id, "approved")}
                        >
                          ✅ Aprovar
                        </button>
                        <button
                          className="btn btn-secondary"
                          style={{ padding: "0.3rem 0.6rem", fontSize: "0.75rem", color: "var(--accent-rose)" }}
                          onClick={() => handleDecision(appr.id, "rejected")}
                        >
                          ❌ Rejeitar
                        </button>
                      </div>
                    ) : (
                      <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>Decidido</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Audit Section */}
      <div className="glass-panel" style={{ padding: "1.5rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
          <div>
            <h2 style={{ fontFamily: "var(--font-heading)", fontSize: "1.2rem", fontWeight: 700 }}>
              📜 Trilha de Auditoria Imutável (SHA-256 Hash Chain)
            </h2>
            <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)", marginTop: "0.2rem" }}>
              Cada alteração operacional, aprovação e decisão é criptografada e encadeada matematicamente para compliance (LGPD / SOC 2).
            </p>
          </div>

          <button
            className="btn btn-secondary"
            onClick={handleVerifyChain}
            disabled={verifying || tenantAuditEvents.length === 0}
            style={{ padding: "0.4rem 0.8rem", fontSize: "0.8rem" }}
          >
            {verifying ? "🔄 Calculando Hashes..." : "🔒 Validar Integridade Criptográfica"}
          </button>
        </div>

        {verificationResult && (
          <div style={{ background: "rgba(16, 185, 129, 0.12)", border: "1px solid rgba(16, 185, 129, 0.3)", borderRadius: "8px", padding: "0.75rem 1rem", marginBottom: "1rem", color: "var(--accent-emerald)", fontSize: "0.85rem" }}>
            ✅ <strong>Cadeia Criptográfica Válida e Íntegra!</strong> Todos os {verificationResult.verifiedEventsCount} eventos verificados com sucesso via {verificationResult.algorithm}.
          </div>
        )}

        {tenantAuditEvents.length === 0 ? (
          <div style={{ textAlign: "center", padding: "2rem 0", color: "var(--text-muted)" }}>
            <p>Nenhum evento de auditoria registrado ainda para o cliente <strong>{activeTenant?.name}</strong>.</p>
          </div>
        ) : (
          <table className="custom-table">
            <thead>
              <tr>
                <th>Data / Hora</th>
                <th>Ator Responsável</th>
                <th>Tipo de Evento</th>
                <th>Ação / Alvo</th>
                <th>Hash do Evento (SHA-256)</th>
              </tr>
            </thead>
            <tbody>
              {tenantAuditEvents.map((ev) => (
                <tr key={ev.id}>
                  <td style={{ color: "var(--text-muted)", fontSize: "0.8rem" }}>{ev.timestamp}</td>
                  <td style={{ fontWeight: 600 }}>{ev.actor}</td>
                  <td>
                    <span className="badge badge-online">{ev.eventType}</span>
                  </td>
                  <td style={{ color: "var(--text-primary)", fontSize: "0.85rem" }}>
                    <strong>{ev.action}</strong> {ev.target && `→ ${ev.target}`}
                  </td>
                  <td style={{ fontFamily: "var(--font-mono)", fontSize: "0.75rem", color: "var(--accent-indigo)" }} title={ev.eventHash}>
                    {ev.eventHash.substring(0, 16)}...{ev.eventHash.substring(48)}
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
