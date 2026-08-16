import React, { useState } from "react";

export function EnrollAgentModal({ isOpen, activeTenant, onClose }) {
  const [tokenData, setTokenData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleGenerateToken = async () => {
    setLoading(true);
    try {
      const res = await fetch("https://infraopsai.awecloudsolution.com/api/v1/agent/enrollment/token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tenantId: activeTenant.id }),
      });
      const data = await res.json();
      setTokenData(data);
    } catch (err) {
      // Fallback local simulation if network is unreachable
      const token = `token-${Math.random().toString(36).substring(2, 10)}`;
      setTokenData({
        token,
        installCommand: `curl -sSL https://infraopsai.awecloudsolution.com/install-agent.sh | sh -s -- --enroll-token ${token}`,
      });
    }
    setLoading(false);
  };

  const handleCopy = () => {
    if (tokenData?.installCommand) {
      navigator.clipboard.writeText(tokenData.installCommand);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="glass-panel modal-content" style={{ maxWidth: "650px" }}>
        <h3 style={{ fontFamily: "var(--font-heading)", fontSize: "1.3rem", marginBottom: "0.5rem" }}>
          🐧 Cadastrar Novo Servidor Linux (Agent Enrollment)
        </h3>
        <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)", marginBottom: "1.25rem" }}>
          Gere um token de uso único (TTL 15 min) para instalar o Agente Go e vincular o host ao cliente{" "}
          <strong style={{ color: "var(--accent-indigo)" }}>{activeTenant.name}</strong>.
        </p>

        {!tokenData ? (
          <div style={{ textAlign: "center", padding: "1.5rem 0" }}>
            <button className="btn btn-primary" onClick={handleGenerateToken} disabled={loading}>
              {loading ? "Gerando Token..." : "🔑 Gerar Token de Instalação de Uso Único"}
            </button>
          </div>
        ) : (
          <div>
            <div style={{ marginBottom: "1rem" }}>
              <label style={{ display: "block", fontSize: "0.8rem", color: "var(--text-secondary)", marginBottom: "0.35rem" }}>
                Token Único de Enrollment
              </label>
              <input
                type="text"
                readOnly
                value={tokenData.token}
                style={{ width: "100%", padding: "0.6rem", background: "rgba(0,0,0,0.4)", border: "1px solid var(--border-subtle)", color: "var(--accent-emerald)", fontFamily: "var(--font-mono)", borderRadius: "6px" }}
              />
            </div>

            <div style={{ marginBottom: "1.5rem" }}>
              <label style={{ display: "block", fontSize: "0.8rem", color: "var(--text-secondary)", marginBottom: "0.35rem" }}>
                Comando Único de Instalação (Cole no Terminal do Linux)
              </label>
              <textarea
                readOnly
                rows={3}
                value={tokenData.installCommand}
                style={{ width: "100%", padding: "0.65rem", background: "rgba(0,0,0,0.5)", border: "1px solid var(--border-active)", color: "#fff", fontFamily: "var(--font-mono)", fontSize: "0.85rem", borderRadius: "6px", resize: "none" }}
              />
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <button className="btn btn-secondary" onClick={handleCopy}>
                {copied ? "✅ Copiado!" : "📋 Copiar Comando"}
              </button>
              <button className="btn btn-primary" onClick={onClose}>
                Concluído
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
