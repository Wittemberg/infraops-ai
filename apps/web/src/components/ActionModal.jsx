import React, { useState } from "react";

export function ActionModal({ isOpen, targetId, defaultActionKey, onClose }) {
  const [step, setStep] = useState(1);
  const [actionKey, setActionKey] = useState(defaultActionKey || "service.restart");
  const [paramValue, setParamValue] = useState("nginx");
  const [planGenerated, setPlanGenerated] = useState(false);

  if (!isOpen) return null;

  const handleGeneratePlan = () => {
    setPlanGenerated(true);
    setStep(2);
  };

  const handleExecuteAction = () => {
    setStep(3);
  };

  return (
    <div className="modal-overlay">
      <div className="glass-panel modal-content">
        <h2 style={{ fontFamily: "var(--font-heading)", fontSize: "1.3rem", marginBottom: "1rem" }}>
          ⚡ Executar Ação Operacional Segura
        </h2>

        {step === 1 && (
          <div>
            <div style={{ marginBottom: "1rem" }}>
              <label style={{ display: "block", color: "var(--text-secondary)", fontSize: "0.85rem", marginBottom: "0.35rem" }}>
                Alvo (Target ID)
              </label>
              <input
                type="text"
                value={targetId || "node-101"}
                disabled
                style={{ width: "100%", padding: "0.6rem", background: "rgba(0,0,0,0.3)", border: "1px solid var(--border-subtle)", color: "#fff", borderRadius: "6px" }}
              />
            </div>

            <div style={{ marginBottom: "1rem" }}>
              <label style={{ display: "block", color: "var(--text-secondary)", fontSize: "0.85rem", marginBottom: "0.35rem" }}>
                Ação Registrada (Action Catalog)
              </label>
              <select
                value={actionKey}
                onChange={(e) => setActionKey(e.target.value)}
                style={{ width: "100%", padding: "0.6rem", background: "rgba(0,0,0,0.3)", border: "1px solid var(--border-subtle)", color: "#fff", borderRadius: "6px" }}
              >
                <option value="service.restart">service.restart (Restart Systemd Service)</option>
                <option value="node.health">node.health (Node Diagnostics)</option>
                <option value="system.packages_update">system.packages_update (Apt Update)</option>
                <option value="backup.cleanup">backup.cleanup (Safe Retention Expurge)</option>
              </select>
            </div>

            <div style={{ marginBottom: "1.5rem" }}>
              <label style={{ display: "block", color: "var(--text-secondary)", fontSize: "0.85rem", marginBottom: "0.35rem" }}>
                Parâmetros
              </label>
              <input
                type="text"
                value={paramValue}
                onChange={(e) => setParamValue(e.target.value)}
                style={{ width: "100%", padding: "0.6rem", background: "rgba(0,0,0,0.3)", border: "1px solid var(--border-subtle)", color: "#fff", borderRadius: "6px" }}
              />
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem" }}>
              <button className="btn btn-secondary" onClick={onClose}>Cancelar</button>
              <button className="btn btn-primary" onClick={handleGeneratePlan}>Gerar Plano / Dry-Run</button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div>
            <div style={{ background: "rgba(99, 102, 241, 0.1)", border: "1px solid rgba(99, 102, 241, 0.3)", padding: "1rem", borderRadius: "8px", marginBottom: "1.25rem" }}>
              <h4 style={{ color: "var(--accent-indigo)", marginBottom: "0.5rem" }}>📋 Resumo do Plano & Risco</h4>
              <p style={{ fontSize: "0.875rem", color: "var(--text-primary)" }}>
                Ação: <strong>{actionKey}</strong> no alvo <strong>{targetId}</strong>.
              </p>
              <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)", marginTop: "0.25rem" }}>
                Nível de Risco: <span className="badge badge-degraded">MEDIUM</span> • Validação da Policy Engine: <strong>ALLOW</strong>
              </p>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem" }}>
              <button className="btn btn-secondary" onClick={() => setStep(1)}>Voltar</button>
              <button className="btn btn-primary" onClick={handleExecuteAction}>Confirmar & Executar Job</button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div style={{ textAlign: "center", padding: "1.5rem 0" }}>
            <div style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>✅</div>
            <h3 style={{ fontFamily: "var(--font-heading)", fontSize: "1.2rem", marginBottom: "0.5rem" }}>
              Job Despachado com Sucesso!
            </h3>
            <p style={{ fontSize: "0.875rem", color: "var(--text-secondary)", marginBottom: "1.5rem" }}>
              ID do Job: <span style={{ fontFamily: "var(--font-mono)", color: "var(--accent-indigo)" }}>job-890123</span>
            </p>
            <button className="btn btn-primary" onClick={onClose}>Fechar</button>
          </div>
        )}
      </div>
    </div>
  );
}
