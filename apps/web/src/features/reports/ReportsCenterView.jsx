import React, { useState } from "react";
import { apiRequest } from "../../services/apiClient.js";

export function ReportsCenterView({ activeTenant, onNavigate }) {
  const [generatingReport, setGeneratingReport] = useState(null);
  const [generatedSuccess, setGeneratedSuccess] = useState(null);

  const tenantName = activeTenant?.name || "Supermercados Calvi";
  const tenantId = activeTenant?.id || "tenant-default";

  const handleGenerate = (reportType) => {
    setGeneratingReport(reportType);
    setTimeout(() => {
      setGeneratingReport(null);
      setGeneratedSuccess(reportType);
      setTimeout(() => setGeneratedSuccess(null), 5000);
    }, 1200);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px" }}>
        <div>
          <h2 style={{ margin: 0, fontSize: "20px", fontWeight: "700", color: "var(--text-primary)" }}>
            📊 Central de Relatórios & Comprovação de Valor
          </h2>
          <p style={{ margin: "4px 0 0", fontSize: "13px", color: "var(--text-secondary)" }}>
            Gere relatórios profissionais e demonstre aos clientes o trabalho técnico executado, a estabilidade garantida e os incidentes prevenidos.
          </p>
        </div>
      </div>

      {generatedSuccess && (
        <div
          style={{
            padding: "12px 16px",
            borderRadius: "8px",
            background: "rgba(16, 185, 129, 0.15)",
            border: "1px solid rgba(16, 185, 129, 0.3)",
            color: "#10b981",
            fontSize: "13px",
            fontWeight: "600",
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}
        >
          <span>✓</span> Relatório gerado com sucesso! Pronto para download ou impressão para o cliente <strong>{tenantName}</strong>.
        </div>
      )}

      {/* Reports Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "20px" }}>
        {/* Report 1: Monthly Executive QBR */}
        <div
          style={{
            background: "var(--bg-card)",
            borderRadius: "10px",
            border: "1px solid var(--border-color)",
            padding: "20px",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
          }}
        >
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
              <span style={{ fontSize: "24px" }}>📑</span>
              <h3 style={{ margin: 0, fontSize: "16px", fontWeight: "700", color: "var(--text-primary)" }}>
                Relatório Executivo Mensal (QBR)
              </h3>
            </div>
            <p style={{ fontSize: "12px", color: "var(--text-secondary)", lineHeight: "1.5", margin: "0 0 14px" }}>
              Resumo estratégico para diretores e tomadores de decisão: índice de disponibilidade (Uptime 99.9%), backups executados, ações de auto-correção aplicadas e recomendações de melhoria.
            </p>

            <div style={{ background: "rgba(0, 0, 0, 0.2)", padding: "10px 12px", borderRadius: "6px", fontSize: "11px", color: "var(--text-secondary)", marginBottom: "16px" }}>
              • Período: Últimos 30 dias • Cliente: <strong>{tenantName}</strong><br />
              • Formato: Executivo para Diretoria / Reunião Mensal
            </div>
          </div>

          <button
            onClick={() => handleGenerate("qbr")}
            disabled={generatingReport === "qbr"}
            style={{
              padding: "10px",
              borderRadius: "6px",
              border: "none",
              background: "var(--accent-color, #3b82f6)",
              color: "#ffffff",
              fontWeight: "600",
              fontSize: "13px",
              cursor: "pointer",
            }}
          >
            {generatingReport === "qbr" ? "Gerando Relatório..." : "📄 Gerar Relatório Executivo Mensal"}
          </button>
        </div>

        {/* Report 2: Field Service Checklist */}
        <div
          style={{
            background: "var(--bg-card)",
            borderRadius: "10px",
            border: "1px solid var(--border-color)",
            padding: "20px",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
          }}
        >
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
              <span style={{ fontSize: "24px" }}>📋</span>
              <h3 style={{ margin: 0, fontSize: "16px", fontWeight: "700", color: "var(--text-primary)" }}>
                Ficha de Visita Técnica Presencial
              </h3>
            </div>
            <p style={{ fontSize: "12px", color: "var(--text-secondary)", lineHeight: "1.5", margin: "0 0 14px" }}>
              Checklist de conferência física de racks, nobreaks, cabeamento, temperatura de servidores e testes de internet com espaço para parecer técnico e assinatura do cliente.
            </p>

            <div style={{ background: "rgba(0, 0, 0, 0.2)", padding: "10px 12px", borderRadius: "6px", fontSize: "11px", color: "var(--text-secondary)", marginBottom: "16px" }}>
              • Checklist: 10 Itens de Inspeção • Assinatura do Responsável<br />
              • Formato: Documento Operacional de Atendimento
            </div>
          </div>

          <button
            onClick={() => onNavigate("infrastructure")}
            style={{
              padding: "10px",
              borderRadius: "6px",
              border: "1px solid var(--border-color)",
              background: "var(--bg-card)",
              color: "var(--text-primary)",
              fontWeight: "600",
              fontSize: "13px",
              cursor: "pointer",
            }}
          >
            📋 Acessar Checklists de Visita Técnica
          </button>
        </div>

        {/* Report 3: Infrastructure Source of Truth & Inventory */}
        <div
          style={{
            background: "var(--bg-card)",
            borderRadius: "10px",
            border: "1px solid var(--border-color)",
            padding: "20px",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
          }}
        >
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
              <span style={{ fontSize: "24px" }}>🏢</span>
              <h3 style={{ margin: 0, fontSize: "16px", fontWeight: "700", color: "var(--text-primary)" }}>
                Livro da Infraestrutura (Customer Book)
              </h3>
            </div>
            <p style={{ fontSize: "12px", color: "var(--text-secondary)", lineHeight: "1.5", margin: "0 0 14px" }}>
              Dossiê completo contendo inventário de servidores, mapeamento de portas de switch, endereçamento IP (IPAM), VLANs, topologia física e configurações de roteadores.
            </p>

            <div style={{ background: "rgba(0, 0, 0, 0.2)", padding: "10px 12px", borderRadius: "6px", fontSize: "11px", color: "var(--text-secondary)", marginBottom: "16px" }}>
              • Dados: Nós, Racks 42U, Switches, IPAM, VLANs e WAN<br />
              • Formato: Documentação Completa da TI do Cliente
            </div>
          </div>

          <button
            onClick={() => handleGenerate("book")}
            disabled={generatingReport === "book"}
            style={{
              padding: "10px",
              borderRadius: "6px",
              border: "none",
              background: "#10b981",
              color: "#ffffff",
              fontWeight: "600",
              fontSize: "13px",
              cursor: "pointer",
            }}
          >
            {generatingReport === "book" ? "Gerando Livro..." : "📗 Exportar Livro da Infraestrutura"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default ReportsCenterView;
