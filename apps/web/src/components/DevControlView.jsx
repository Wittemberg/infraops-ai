import React, { useState, useEffect } from "react";
import { fetchDevControlOverview } from "../services/devControlApi.js";

export function DevControlView({ currentUser }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadOverview();
  }, []);

  const loadOverview = async () => {
    setLoading(true);
    setError(null);
    try {
      const overview = await fetchDevControlOverview();
      setData(overview);
    } catch (err) {
      setError(err?.message || "Não foi possível carregar os dados do Development Control Center.");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: "3rem", textAlign: "center", color: "var(--text-secondary)" }}>
        <div
          style={{
            display: "inline-block",
            width: "32px",
            height: "32px",
            border: "3px solid rgba(99, 102, 241, 0.2)",
            borderTopColor: "var(--accent-indigo)",
            borderRadius: "50%",
            animation: "spin 1s linear infinite",
            marginBottom: "1rem",
          }}
        ></div>
        <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
        <p style={{ fontSize: "0.9rem", fontWeight: 500 }}>Carregando dados do Development Control Center...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div
        style={{
          margin: "2rem auto",
          maxWidth: "800px",
          padding: "1.5rem",
          borderRadius: "12px",
          background: "rgba(239, 68, 68, 0.1)",
          border: "1px solid rgba(239, 68, 68, 0.3)",
          color: "var(--accent-rose)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.5rem" }}>
          <span style={{ fontSize: "1.5rem" }}>⚠️</span>
          <h3 style={{ fontSize: "1.1rem", fontWeight: 700 }}>Acesso Restrito ou Erro de Servidor</h3>
        </div>
        <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)", marginBottom: "1rem" }}>{error}</p>
        <button
          onClick={loadOverview}
          style={{
            padding: "0.5rem 1rem",
            background: "rgba(239, 68, 68, 0.2)",
            border: "1px solid rgba(239, 68, 68, 0.4)",
            color: "#fff",
            borderRadius: "8px",
            fontSize: "0.85rem",
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          🔄 Tentar Novamente
        </button>
      </div>
    );
  }

  if (!data) return null;

  const { project, mvp, fullRoadmap, humanValidation, statusCounts, modules, pendingMvp, futureBacklog, frozenComponents, checkpoints, health, drift } = data;

  const getStatusBadge = (status) => {
    const colorMap = {
      FROZEN: { bg: "rgba(6, 182, 212, 0.15)", border: "rgba(6, 182, 212, 0.4)", text: "#22d3ee" },
      HOMOLOGATED: { bg: "rgba(16, 185, 129, 0.15)", border: "rgba(16, 185, 129, 0.4)", text: "#34d399" },
      VALIDATION: { bg: "rgba(245, 158, 11, 0.15)", border: "rgba(245, 158, 11, 0.4)", text: "#fbbf24" },
      IMPLEMENTED: { bg: "rgba(59, 130, 246, 0.15)", border: "rgba(59, 130, 246, 0.4)", text: "#60a5fa" },
      IN_PROGRESS: { bg: "rgba(168, 85, 247, 0.15)", border: "rgba(168, 85, 247, 0.4)", text: "#c084fc" },
      PLANNED: { bg: "rgba(107, 114, 128, 0.15)", border: "rgba(107, 114, 128, 0.3)", text: "#9ca3af" },
      BLOCKED: { bg: "rgba(239, 68, 68, 0.15)", border: "rgba(239, 68, 68, 0.4)", text: "#f87171" },
    };
    const style = colorMap[status] || colorMap.PLANNED;
    return (
      <span
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "0.25rem",
          padding: "0.2rem 0.6rem",
          fontSize: "0.75rem",
          fontWeight: 700,
          borderRadius: "9999px",
          background: style.bg,
          border: `1px solid ${style.border}`,
          color: style.text,
        }}
      >
        {status === "FROZEN" && "🔒 "}
        {status}
      </span>
    );
  };

  const renderHealthChip = (name, state) => {
    const bg =
      state === "PASS"
        ? "rgba(16, 185, 129, 0.12)"
        : state === "WARNING"
        ? "rgba(245, 158, 11, 0.12)"
        : "rgba(239, 68, 68, 0.12)";
    const border =
      state === "PASS"
        ? "rgba(16, 185, 129, 0.3)"
        : state === "WARNING"
        ? "rgba(245, 158, 11, 0.3)"
        : "rgba(239, 68, 68, 0.3)";
    const color =
      state === "PASS" ? "#34d399" : state === "WARNING" ? "#fbbf24" : "#f87171";

    return (
      <div
        key={name}
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "0.6rem 0.85rem",
          background: bg,
          border: `1px solid ${border}`,
          borderRadius: "8px",
          fontSize: "0.8rem",
          fontWeight: 500,
          color: "var(--text-primary)",
        }}
      >
        <span>{name}</span>
        <span style={{ fontWeight: 800, color }}>{state}</span>
      </div>
    );
  };

  return (
    <div style={{ padding: "1.25rem 1.5rem", display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      {/* Header Banner */}
      <div
        className="glass-panel"
        style={{
          padding: "1.5rem",
          background: "linear-gradient(135deg, rgba(18, 24, 36, 0.95) 0%, rgba(15, 23, 42, 0.95) 100%)",
          border: "1px solid var(--border-subtle)",
          borderRadius: "14px",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.35rem" }}>
              <span style={{ fontSize: "1.6rem" }}>🛠️</span>
              <h1
                style={{
                  fontSize: "1.5rem",
                  fontWeight: 800,
                  fontFamily: "var(--font-heading)",
                  background: "linear-gradient(135deg, #a855f7 0%, #6366f1 50%, #3b82f6 100%)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                }}
              >
                {project.name} — Development Control Center
              </h1>
              <span
                style={{
                  padding: "0.2rem 0.6rem",
                  background: "rgba(6, 182, 212, 0.15)",
                  border: "1px solid rgba(6, 182, 212, 0.4)",
                  color: "#22d3ee",
                  fontSize: "0.75rem",
                  fontWeight: 700,
                  borderRadius: "9999px",
                }}
              >
                HOMOLOGAÇÃO v{project.developmentControlVersion}
              </span>
            </div>
            <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>
              Painel de Governança Técnica, Invariantes Matemáticas e Cobertura de Homologação Humana.
            </p>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", fontFamily: "var(--font-mono)", marginBottom: "0.25rem" }}>
              FASE ATUAL DO PRODUTO
            </div>
            <div
              style={{
                fontSize: "0.85rem",
                fontWeight: 700,
                color: "#22d3ee",
                background: "rgba(6, 182, 212, 0.1)",
                border: "1px solid rgba(6, 182, 212, 0.3)",
                padding: "0.4rem 0.85rem",
                borderRadius: "8px",
                display: "inline-block",
              }}
            >
              {project.currentPhaseName}
            </div>
          </div>
        </div>
      </div>

      {/* Drift Alert (if detected) */}
      {drift && drift.detected && (
        <div
          style={{
            padding: "1rem",
            background: "rgba(245, 158, 11, 0.12)",
            border: "1px solid rgba(245, 158, 11, 0.3)",
            borderRadius: "10px",
            color: "#fbbf24",
            fontSize: "0.85rem",
          }}
        >
          <strong style={{ display: "block", marginBottom: "0.3rem" }}>⚠️ Drift Documental Detectado:</strong>
          <ul style={{ paddingLeft: "1.25rem", margin: 0 }}>
            {drift.items.map((item, idx) => (
              <li key={idx}>{item}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Executive KPI Cards (4 Cards Grid) */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(230px, 1fr))",
          gap: "1.25rem",
        }}
      >
        {/* Card 1: Prontidão MVP */}
        <div
          className="glass-panel"
          style={{
            padding: "1.25rem",
            background: "linear-gradient(135deg, rgba(16, 185, 129, 0.08) 0%, rgba(18, 24, 36, 0.9) 100%)",
            border: "1px solid rgba(16, 185, 129, 0.3)",
          }}
        >
          <div style={{ fontSize: "0.75rem", fontWeight: 700, color: "#34d399", textTransform: "uppercase", tracking: "0.05em", marginBottom: "0.35rem" }}>
            🎯 Prontidão MVP
          </div>
          <div style={{ fontSize: "2.2rem", fontWeight: 800, color: "var(--text-primary)", marginBottom: "0.5rem" }}>
            {mvp.readinessPercent}%
          </div>
          <div style={{ width: "100%", height: "8px", background: "rgba(255, 255, 255, 0.08)", borderRadius: "4px", overflow: "hidden", marginBottom: "0.5rem" }}>
            <div style={{ width: `${mvp.readinessPercent}%`, height: "100%", background: "linear-gradient(90deg, #10b981, #34d399)", borderRadius: "4px" }}></div>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.75rem", color: "var(--text-secondary)" }}>
            <span>Homologado: {mvp.homologatedWeight} / {mvp.totalWeight} pts</span>
            <span>Impl: {mvp.implementationPercent}%</span>
          </div>
        </div>

        {/* Card 2: Roadmap Implementado */}
        <div
          className="glass-panel"
          style={{
            padding: "1.25rem",
            background: "linear-gradient(135deg, rgba(59, 130, 246, 0.08) 0%, rgba(18, 24, 36, 0.9) 100%)",
            border: "1px solid rgba(59, 130, 246, 0.3)",
          }}
        >
          <div style={{ fontSize: "0.75rem", fontWeight: 700, color: "#60a5fa", textTransform: "uppercase", tracking: "0.05em", marginBottom: "0.35rem" }}>
            📈 Roadmap Implementado
          </div>
          <div style={{ fontSize: "2.2rem", fontWeight: 800, color: "var(--text-primary)", marginBottom: "0.5rem" }}>
            {fullRoadmap.implementationPercent}%
          </div>
          <div style={{ width: "100%", height: "8px", background: "rgba(255, 255, 255, 0.08)", borderRadius: "4px", overflow: "hidden", marginBottom: "0.5rem" }}>
            <div style={{ width: `${fullRoadmap.implementationPercent}%`, height: "100%", background: "linear-gradient(90deg, #3b82f6, #60a5fa)", borderRadius: "4px" }}></div>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.75rem", color: "var(--text-secondary)" }}>
            <span>Peso: {fullRoadmap.implementedWeight} / {fullRoadmap.totalWeight} pts</span>
            <span>Full Specs</span>
          </div>
        </div>

        {/* Card 3: Roadmap Homologado */}
        <div
          className="glass-panel"
          style={{
            padding: "1.25rem",
            background: "linear-gradient(135deg, rgba(168, 85, 247, 0.08) 0%, rgba(18, 24, 36, 0.9) 100%)",
            border: "1px solid rgba(168, 85, 247, 0.3)",
          }}
        >
          <div style={{ fontSize: "0.75rem", fontWeight: 700, color: "#c084fc", textTransform: "uppercase", tracking: "0.05em", marginBottom: "0.35rem" }}>
            🏆 Roadmap Homologado
          </div>
          <div style={{ fontSize: "2.2rem", fontWeight: 800, color: "var(--text-primary)", marginBottom: "0.5rem" }}>
            {fullRoadmap.readinessPercent}%
          </div>
          <div style={{ width: "100%", height: "8px", background: "rgba(255, 255, 255, 0.08)", borderRadius: "4px", overflow: "hidden", marginBottom: "0.5rem" }}>
            <div style={{ width: `${fullRoadmap.readinessPercent}%`, height: "100%", background: "linear-gradient(90deg, #a855f7, #c084fc)", borderRadius: "4px" }}></div>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.75rem", color: "var(--text-secondary)" }}>
            <span>Validados: {fullRoadmap.homologatedWeight} / {fullRoadmap.totalWeight} pts</span>
            <span>Full Readiness</span>
          </div>
        </div>

        {/* Card 4: Cobertura de Validação Humana */}
        <div
          className="glass-panel"
          style={{
            padding: "1.25rem",
            background: "linear-gradient(135deg, rgba(245, 158, 11, 0.08) 0%, rgba(18, 24, 36, 0.9) 100%)",
            border: "1px solid rgba(245, 158, 11, 0.3)",
          }}
        >
          <div style={{ fontSize: "0.75rem", fontWeight: 700, color: "#fbbf24", textTransform: "uppercase", tracking: "0.05em", marginBottom: "0.35rem" }}>
            🧪 Validação Humana
          </div>
          <div style={{ fontSize: "2.2rem", fontWeight: 800, color: "var(--text-primary)", marginBottom: "0.5rem" }}>
            {humanValidation.coveragePercent}%
          </div>
          <div style={{ width: "100%", height: "8px", background: "rgba(255, 255, 255, 0.08)", borderRadius: "4px", overflow: "hidden", marginBottom: "0.5rem" }}>
            <div style={{ width: `${humanValidation.coveragePercent}%`, height: "100%", background: "linear-gradient(90deg, #f59e0b, #fbbf24)", borderRadius: "4px" }}></div>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.75rem", color: "var(--text-secondary)" }}>
            <span>Aprovados: {humanValidation.approvedWeight} pts</span>
            <span>Testados: {humanValidation.testedWeight} pts</span>
          </div>
        </div>
      </div>

      {/* Status Distribution & Health */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "1.25rem" }}>
        {/* Status Counts Panel */}
        <div className="glass-panel" style={{ padding: "1.25rem" }}>
          <h3 style={{ fontSize: "0.95rem", fontWeight: 700, marginBottom: "1rem", color: "var(--text-primary)", display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <span>📊</span> Distribuição de Status por Capability
          </h3>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "0.75rem" }}>
            <div style={{ background: "rgba(6, 182, 212, 0.08)", border: "1px solid rgba(6, 182, 212, 0.25)", borderRadius: "8px", padding: "0.6rem", textAlign: "center" }}>
              <div style={{ fontSize: "0.7rem", color: "#22d3ee", fontWeight: 600 }}>🔒 Frozen</div>
              <div style={{ fontSize: "1.3rem", fontWeight: 800, color: "#fff" }}>{statusCounts.FROZEN || 0}</div>
            </div>
            <div style={{ background: "rgba(16, 185, 129, 0.08)", border: "1px solid rgba(16, 185, 129, 0.25)", borderRadius: "8px", padding: "0.6rem", textAlign: "center" }}>
              <div style={{ fontSize: "0.7rem", color: "#34d399", fontWeight: 600 }}>Homologated</div>
              <div style={{ fontSize: "1.3rem", fontWeight: 800, color: "#fff" }}>{statusCounts.HOMOLOGATED || 0}</div>
            </div>
            <div style={{ background: "rgba(245, 158, 11, 0.08)", border: "1px solid rgba(245, 158, 11, 0.25)", borderRadius: "8px", padding: "0.6rem", textAlign: "center" }}>
              <div style={{ fontSize: "0.7rem", color: "#fbbf24", fontWeight: 600 }}>Validation</div>
              <div style={{ fontSize: "1.3rem", fontWeight: 800, color: "#fff" }}>{statusCounts.VALIDATION || 0}</div>
            </div>
            <div style={{ background: "rgba(59, 130, 246, 0.08)", border: "1px solid rgba(59, 130, 246, 0.25)", borderRadius: "8px", padding: "0.6rem", textAlign: "center" }}>
              <div style={{ fontSize: "0.7rem", color: "#60a5fa", fontWeight: 600 }}>Implemented</div>
              <div style={{ fontSize: "1.3rem", fontWeight: 800, color: "#fff" }}>{statusCounts.IMPLEMENTED || 0}</div>
            </div>
            <div style={{ background: "rgba(168, 85, 247, 0.08)", border: "1px solid rgba(168, 85, 247, 0.25)", borderRadius: "8px", padding: "0.6rem", textAlign: "center" }}>
              <div style={{ fontSize: "0.7rem", color: "#c084fc", fontWeight: 600 }}>In Progress</div>
              <div style={{ fontSize: "1.3rem", fontWeight: 800, color: "#fff" }}>{statusCounts.IN_PROGRESS || 0}</div>
            </div>
            <div style={{ background: "rgba(107, 114, 128, 0.08)", border: "1px solid rgba(107, 114, 128, 0.25)", borderRadius: "8px", padding: "0.6rem", textAlign: "center" }}>
              <div style={{ fontSize: "0.7rem", color: "#9ca3af", fontWeight: 600 }}>Planned</div>
              <div style={{ fontSize: "1.3rem", fontWeight: 800, color: "#fff" }}>{statusCounts.PLANNED || 0}</div>
            </div>
            <div style={{ background: "rgba(239, 68, 68, 0.08)", border: "1px solid rgba(239, 68, 68, 0.25)", borderRadius: "8px", padding: "0.6rem", textAlign: "center" }}>
              <div style={{ fontSize: "0.7rem", color: "#f87171", fontWeight: 600 }}>Blocked</div>
              <div style={{ fontSize: "1.3rem", fontWeight: 800, color: "#fff" }}>{statusCounts.BLOCKED || 0}</div>
            </div>
            <div style={{ background: "rgba(255, 255, 255, 0.03)", border: "1px solid var(--border-subtle)", borderRadius: "8px", padding: "0.6rem", textAlign: "center" }}>
              <div style={{ fontSize: "0.7rem", color: "var(--text-muted)", fontWeight: 600 }}>Unmapped</div>
              <div style={{ fontSize: "1.3rem", fontWeight: 800, color: "var(--text-muted)" }}>{statusCounts.UNMAPPED || 0}</div>
            </div>
          </div>
        </div>

        {/* Health Panel */}
        <div className="glass-panel" style={{ padding: "1.25rem" }}>
          <h3 style={{ fontSize: "0.95rem", fontWeight: 700, marginBottom: "1rem", color: "var(--text-primary)", display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <span>🛡️</span> Saúde do Projeto
          </h3>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "0.6rem" }}>
            {renderHealthChip("Código fonte", health.code)}
            {renderHealthChip("Testes Invariantes", health.tests)}
            {renderHealthChip("Build Produção", health.build)}
            {renderHealthChip("Deploy Portainer", health.deployment)}
            {renderHealthChip("Documentação", health.documentation)}
            {renderHealthChip("Validação Humana", health.manualValidation)}
          </div>
        </div>
      </div>

      {/* Modules Table */}
      <div className="glass-panel" style={{ padding: "1.25rem" }}>
        <h3 style={{ fontSize: "1rem", fontWeight: 700, marginBottom: "1rem", color: "var(--text-primary)", display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <span>📦</span> Progresso por Módulo ({modules.length} Módulos)
        </h3>
        <div style={{ overflowX: "auto" }}>
          <table className="custom-table" style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.85rem" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid var(--border-subtle)", color: "var(--text-muted)", fontSize: "0.75rem", textTransform: "uppercase" }}>
                <th style={{ padding: "0.75rem 1rem", textAlign: "left" }}>Módulo</th>
                <th style={{ padding: "0.75rem 1rem", textAlign: "center" }}>Status</th>
                <th style={{ padding: "0.75rem 1rem", textAlign: "center" }}>Peso</th>
                <th style={{ padding: "0.75rem 1rem", textAlign: "left", minWidth: "150px" }}>Implementação</th>
                <th style={{ padding: "0.75rem 1rem", textAlign: "left", minWidth: "150px" }}>Homologação</th>
              </tr>
            </thead>
            <tbody>
              {modules.map((mod) => (
                <tr key={mod.id} style={{ borderBottom: "1px solid var(--border-subtle)" }}>
                  <td style={{ padding: "0.75rem 1rem", fontWeight: 600, color: "var(--text-primary)" }}>{mod.name}</td>
                  <td style={{ padding: "0.75rem 1rem", textAlign: "center" }}>{getStatusBadge(mod.status)}</td>
                  <td style={{ padding: "0.75rem 1rem", textAlign: "center", fontFamily: "var(--font-mono)", fontSize: "0.8rem", color: "var(--text-secondary)" }}>
                    {mod.homologatedWeight} / {mod.totalWeight} pts
                  </td>
                  <td style={{ padding: "0.75rem 1rem" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                      <div style={{ flex: 1, height: "6px", background: "rgba(255,255,255,0.08)", borderRadius: "3px", overflow: "hidden" }}>
                        <div style={{ width: `${mod.implementationPercent}%`, height: "100%", background: "var(--accent-blue)" }}></div>
                      </div>
                      <span style={{ fontSize: "0.75rem", fontFamily: "var(--font-mono)", color: "var(--text-muted)", width: "35px", textAlign: "right" }}>
                        {mod.implementationPercent}%
                      </span>
                    </div>
                  </td>
                  <td style={{ padding: "0.75rem 1rem" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                      <div style={{ flex: 1, height: "6px", background: "rgba(255,255,255,0.08)", borderRadius: "3px", overflow: "hidden" }}>
                        <div style={{ width: `${mod.readinessPercent}%`, height: "100%", background: "var(--accent-emerald)" }}></div>
                      </div>
                      <span style={{ fontSize: "0.75rem", fontFamily: "var(--font-mono)", color: "#34d399", width: "35px", textAlign: "right" }}>
                        {mod.readinessPercent}%
                      </span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Frozen Components Grid */}
      <div className="glass-panel" style={{ padding: "1.25rem" }}>
        <h3 style={{ fontSize: "1rem", fontWeight: 700, marginBottom: "1rem", color: "var(--text-primary)", display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <span>🔒</span> Componentes Congelados & Protegidos (Frozen Components)
        </h3>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "1rem" }}>
          {frozenComponents.map((fc) => (
            <div
              key={fc.id}
              style={{
                padding: "1rem",
                background: "rgba(6, 182, 212, 0.05)",
                border: "1px solid rgba(6, 182, 212, 0.25)",
                borderRadius: "10px",
                display: "flex",
                flexDirection: "column",
                gap: "0.5rem",
              }}
            >
              <div style={{ display: "flex", justify: "space-between", alignItems: "center" }}>
                <strong style={{ color: "#22d3ee", fontSize: "0.9rem", display: "flex", alignItems: "center", gap: "0.35rem" }}>
                  <span>🔒</span> {fc.name}
                </strong>
                <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>{fc.frozenAt}</span>
              </div>
              <p style={{ fontSize: "0.8rem", color: "var(--text-secondary)", margin: 0 }}>{fc.description}</p>
              <div
                style={{
                  fontSize: "0.75rem",
                  color: "#fbbf24",
                  background: "rgba(245, 158, 11, 0.1)",
                  padding: "0.4rem 0.6rem",
                  borderRadius: "6px",
                  border: "1px solid rgba(245, 158, 11, 0.2)",
                }}
              >
                <strong>Motivo da Proteção:</strong> {fc.reason}
              </div>
              {fc.protectedPaths && (
                <div style={{ fontSize: "0.7rem", fontFamily: "var(--font-mono)", color: "var(--text-muted)" }}>
                  Paths: {fc.protectedPaths.join(", ")}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Pending MVP vs Backlog */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "1.25rem" }}>
        {/* Pending MVP */}
        <div className="glass-panel" style={{ padding: "1.25rem" }}>
          <h3 style={{ fontSize: "0.9rem", fontWeight: 700, color: "#fbbf24", textTransform: "uppercase", marginBottom: "1rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <span>⏳</span> Pendências do MVP ({pendingMvp.length})
          </h3>
          {pendingMvp.length === 0 ? (
            <div style={{ padding: "1rem", background: "rgba(16, 185, 129, 0.1)", border: "1px solid rgba(16, 185, 129, 0.3)", color: "#34d399", borderRadius: "8px", textAlign: "center", fontSize: "0.85rem", fontWeight: 600 }}>
              🎉 Todas as capacidades do MVP estão 100% homologadas!
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              {pendingMvp.map((cap) => (
                <div key={cap.id} style={{ padding: "0.75rem", background: "rgba(255,255,255,0.03)", border: "1px solid var(--border-subtle)", borderRadius: "8px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <div style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--text-primary)" }}>{cap.name}</div>
                    <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>{cap.description}</div>
                  </div>
                  {getStatusBadge(cap.status)}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Future Backlog */}
        <div className="glass-panel" style={{ padding: "1.25rem" }}>
          <h3 style={{ fontSize: "0.9rem", fontWeight: 700, color: "#c084fc", textTransform: "uppercase", marginBottom: "1rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <span>🚀</span> Backlog Pós-MVP ({futureBacklog.length})
          </h3>
          {futureBacklog.length === 0 ? (
            <div style={{ padding: "1rem", background: "rgba(255, 255, 255, 0.02)", border: "1px solid var(--border-subtle)", color: "var(--text-muted)", borderRadius: "8px", textAlign: "center", fontSize: "0.85rem" }}>
              Nenhum item pendente no backlog futuro.
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              {futureBacklog.map((cap) => (
                <div key={cap.id} style={{ padding: "0.75rem", background: "rgba(255,255,255,0.03)", border: "1px solid var(--border-subtle)", borderRadius: "8px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <div style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--text-primary)" }}>{cap.name}</div>
                    <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>{cap.description}</div>
                  </div>
                  {getStatusBadge(cap.status)}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Checkpoints Timeline */}
      <div className="glass-panel" style={{ padding: "1.25rem" }}>
        <h3 style={{ fontSize: "1rem", fontWeight: 700, marginBottom: "1rem", color: "var(--text-primary)", display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <span>🚩</span> Linha do Tempo de Checkpoints & Releases ({checkpoints.length} Checkpoints)
        </h3>
        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          {checkpoints.map((chk, idx) => (
            <div
              key={idx}
              style={{
                padding: "0.85rem 1rem",
                background: "rgba(255, 255, 255, 0.02)",
                border: "1px solid var(--border-subtle)",
                borderRadius: "8px",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                flexWrap: "wrap",
                gap: "0.5rem",
              }}
            >
              <div>
                <div style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--text-primary)" }}>{chk.title}</div>
                {chk.description && <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)", marginTop: "0.15rem" }}>{chk.description}</div>}
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <span style={{ fontSize: "0.75rem", fontFamily: "var(--font-mono)", color: "#22d3ee", background: "rgba(6, 182, 212, 0.1)", padding: "0.2rem 0.5rem", borderRadius: "4px", border: "1px solid rgba(6, 182, 212, 0.3)" }}>
                  {chk.shortSha}
                </span>
                <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>{chk.date}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
