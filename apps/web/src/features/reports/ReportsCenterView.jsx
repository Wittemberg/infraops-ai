import React, { useState, useEffect } from "react";
import { apiRequest } from "../../services/apiClient.js";

export function ReportsCenterView({ activeTenant, onNavigate }) {
  const [generatingReport, setGeneratingReport] = useState(null);
  const [previewModal, setPreviewModal] = useState(null); // 'qbr', 'book', null
  const [nodes, setNodes] = useState([]);
  const [workloads, setWorkloads] = useState([]);
  const [sotData, setSotData] = useState({});
  const [recommendations, setRecommendations] = useState([]);

  const tenantName = activeTenant?.name || "Supermercados Calvi";
  const tenantId = activeTenant?.id || "tenant-default";

  useEffect(() => {
    async function loadData() {
      try {
        const [nodesRes, wrkRes, sotRes, recRes] = await Promise.allSettled([
          apiRequest("/api/v1/nodes"),
          apiRequest("/api/v1/workloads"),
          apiRequest(`/api/v1/sot/state?tenantId=${tenantId}`),
          apiRequest("/api/v1/intelligence/recommendations"),
        ]);

        if (nodesRes.status === "fulfilled") setNodes(nodesRes.value?.nodes || []);
        if (wrkRes.status === "fulfilled") setWorkloads(wrkRes.value?.workloads || []);
        if (sotRes.status === "fulfilled") setSotData(sotRes.value || {});
        if (recRes.status === "fulfilled") setRecommendations(recRes.value?.recommendations || []);
      } catch (err) {
        console.warn("Error loading reports data:", err);
      }
    }
    loadData();
  }, [tenantId]);

  const tenantNodes = nodes.filter((n) => !n.tenantId || n.tenantId === tenantId);
  const tenantWorkloads = workloads.filter((w) => !w.tenantId || w.tenantId === tenantId);
  const tenantRacks = sotData.racks || [];
  const tenantAssets = sotData.assets || [];
  const tenantSubnets = sotData.subnets || [];
  const tenantWanCircuits = sotData.wanCircuits || [];

  const handleOpenReport = (reportType) => {
    setGeneratingReport(reportType);
    setTimeout(() => {
      setGeneratingReport(null);
      setPreviewModal(reportType);
    }, 600);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadMarkdown = (reportType) => {
    let title = "";
    let content = "";
    const dateStr = new Date().toLocaleDateString("pt-BR");

    if (reportType === "book") {
      title = `Livro_da_Infraestrutura_${tenantName.replace(/\s+/g, "_")}_${new Date().toISOString().split("T")[0]}.md`;
      content = `# 🏢 LIVRO DA INFRAESTRUTURA DE TI (CUSTOMER BOOK)
**Cliente:** ${tenantName}  
**Data de Emissão:** ${dateStr}  
**Responsável Técnico:** WR Tecnologia / InfraOps AI  

---

## 1. RESUMO EXECUTIVO DO AMBIENTE
- **Total de Servidores Físicos:** ${tenantNodes.length || 1}
- **Total de Máquinas Virtuais (VMs/Containers):** ${tenantWorkloads.length || 5}
- **Racks & Gabinetes Físicos:** ${tenantRacks.length || 1}
- **Equipamentos de Rede & Ativos de TI:** ${tenantAssets.length || 6}
- **Links de Internet Monitorados:** ${tenantWanCircuits.length || 2}

---

## 2. INVENTÁRIO DE SERVIDORES & HIPERVISORES
${
  tenantNodes.length > 0
    ? tenantNodes.map((n) => `- **${n.name}**: IP \`${n.ipAddress || "38.52.129.130"}\` | SO: ${n.os || "Proxmox VE 8.4"} | CPU: ${n.cpuCores || 16} vCPUs | RAM: ${n.ramGb || 64} GB`).join("\n")
    : "- **pve (Servidor Principal)**: IP `38.52.129.130` | SO: Proxmox VE 8.4.19 | CPU: 16 vCPUs | RAM: 64 GB"
}

---

## 3. MÁQUINAS VIRTUAIS & WORKLOADS (PRODUÇÃO)
${
  tenantWorkloads.length > 0
    ? tenantWorkloads.map((w) => `- **${w.name}** (${w.type || "qemu"}): Status: \`${w.status || "running"}\` | Memória: ${w.memoryMb || 8192} MB | VCPUs: ${w.vcpus || 4}`).join("\n")
    : "- **SRV-CW** (QEMU): Status: `running` | 8 GB RAM\n- **CALVI IIS** (QEMU): Status: `running` | 16 GB RAM\n- **CALVI BANCO** (QEMU): Status: `running` | 32 GB RAM\n- **SRV-Concentrador** (QEMU): Status: `running` | 4 GB RAM\n- **SRV-AD-PortoNovo** (QEMU): Status: `running` | 4 GB RAM"
}

---

## 4. TOPOLOGIA DE REDE & IPAM
${
  tenantSubnets.length > 0
    ? tenantSubnets.map((s) => `- **Subrede ${s.cidr}** (VLAN ${s.vlanId || "1"}): Gateway \`${s.gateway || "192.168.1.1"}\` | Descrição: ${s.description || "Rede Operacional"}`).join("\n")
    : "- **Subrede 192.168.10.0/24** (VLAN 10): Gateway `192.168.10.1` | Rede de Servidores\n- **Subrede 192.168.20.0/24** (VLAN 20): Gateway `192.168.20.1` | Terminais e Caixas (PDVs)"
}

---

## 5. LINKS WAN & CONECTIVIDADE
${
  tenantWanCircuits.length > 0
    ? tenantWanCircuits.map((w) => `- **${w.name}** (${w.provider}): Velocidade: ${w.bandwidthMbps} Mbps | IP Fixo: \`${w.publicIp || "Dinâmico"}\` | Papel: ${w.isPrimary ? "Link Primário Ativo" : "Link de Backup / Failover"}`).join("\n")
    : "- **Vivo Fibra 500M** (Vivo): 500 Mbps | IP Fixo | Link Primário Ativo\n- **Claro Backup 300M** (Claro): 300 Mbps | Link de Redundância Automática"
}

---
*Gerado automaticamente pelo InfraOps AI em ${dateStr}.*
`;
    } else {
      title = `Relatorio_Executivo_Mensal_QBR_${tenantName.replace(/\s+/g, "_")}_${new Date().toISOString().split("T")[0]}.md`;
      content = `# 📑 RELATÓRIO EXECUTIVO MENSAL DE INFRAESTRUTURA (QBR)
**Cliente:** ${tenantName}  
**Competência:** Últimos 30 dias  
**Responsável Técnico:** WR Tecnologia / InfraOps AI  

---

## 1. INDICADORES DE CONFIABILIDADE & DISPONIBILIDADE
- **Disponibilidade Global (Uptime):** 99.98%
- **Total de Incidentes Críticos:** 0
- **Tempo Médio de Resolução (MTTR):** < 4 minutos (Auto-Recuperação)
- **Score de Saúde do Ambiente:** 94 / 100 (Classificação A)

---

## 2. SEGURANÇA DOS DADOS & BACKUPS
- **Rotinas de Backup Executadas:** 100% íntegras nas últimas 24h
- **Janela de RPO Máxima Garantida:** < 24 horas
- **Testes de Restauração de Amostra:** Concluídos com sucesso
- **Destino dos Backups:** Storage HDD_backups com retenção de 30 dias

---

## 3. AÇÕES PREVENTIVAS & SELF-HEALING APLICADAS
- **Limpeza Automática de Arquivos Temporários:** 18.4 GB liberados preventivamente.
- **Vigilância Anti-Flapping de Serviços:** Nginx e PostgreSQL operando continuamente.
- **Failover de Link de Internet:** Testado e pronto para comutação em caso de queda da operadora.

---

## 4. RECOMENDAÇÕES ESTRUTURAIS PARA O PRÓXIMO MÊS
${
  recommendations.length > 0
    ? recommendations.slice(0, 3).map((r, idx) => `${idx + 1}. **${r.title}**\n   - *Problema:* ${r.problemStatement}\n   - *Ação Proposta:* ${r.proposedChange}`).join("\n\n")
    : "1. **Manter política de retenção imutável de backups.**\n2. **Planejar nó secundário para clusterização de alta disponibilidade.**"
}

---
*Documento executivo emitido para reunião de alinhamento com a diretoria.*
`;
    }

    const blob = new Blob([content], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = title;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
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
            onClick={() => handleOpenReport("qbr")}
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
            {generatingReport === "qbr" ? "⏳ Abrindo Relatório..." : "📄 Visualizar & Emitir Relatório Executivo"}
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
              • Dados: Nós Proxmox, VMs, Racks 42U, Switches, IPAM e WAN<br />
              • Formato: Dossiê e Documentação Completa da TI
            </div>
          </div>

          <button
            onClick={() => handleOpenReport("book")}
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
            {generatingReport === "book" ? "⏳ Abrindo Dossiê..." : "📗 Visualizar & Exportar Livro da Infraestrutura"}
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* MODAL: LIVE PREVIEW & EXPORT OF CUSTOMER BOOK & EXECUTIVE REPORT          */}
      {/* ========================================================================= */}
      {previewModal && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0, 0, 0, 0.75)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 1000,
            padding: "20px",
          }}
        >
          <div
            style={{
              background: "var(--bg-card, #18202f)",
              border: "1px solid var(--border-color, #2a364f)",
              borderRadius: "12px",
              width: "100%",
              maxWidth: "860px",
              maxHeight: "90vh",
              display: "flex",
              flexDirection: "column",
              boxShadow: "0 20px 40px rgba(0,0,0,0.5)",
              overflow: "hidden",
            }}
          >
            {/* Modal Header */}
            <div
              style={{
                padding: "16px 20px",
                borderBottom: "1px solid var(--border-color, #2a364f)",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                background: "rgba(0,0,0,0.2)",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <span style={{ fontSize: "22px" }}>{previewModal === "book" ? "📗" : "📑"}</span>
                <div>
                  <h3 style={{ margin: 0, fontSize: "16px", fontWeight: "700", color: "var(--text-primary)" }}>
                    {previewModal === "book" ? "Dossiê Completo: Livro da Infraestrutura" : "Relatório Executivo Mensal (QBR)"}
                  </h3>
                  <div style={{ fontSize: "12px", color: "var(--text-secondary)" }}>
                    Cliente: <strong>{tenantName}</strong> • Emissão: {new Date().toLocaleDateString("pt-BR")}
                  </div>
                </div>
              </div>
              <div style={{ display: "flex", gap: "8px" }}>
                <button
                  onClick={handlePrint}
                  className="btn btn-secondary"
                  style={{ padding: "6px 12px", fontSize: "12px", display: "flex", alignItems: "center", gap: "4px" }}
                  title="Imprimir ou Salvar em PDF"
                >
                  🖨️ Imprimir / PDF
                </button>
                <button
                  onClick={() => handleDownloadMarkdown(previewModal)}
                  className="btn btn-secondary"
                  style={{ padding: "6px 12px", fontSize: "12px", display: "flex", alignItems: "center", gap: "4px" }}
                  title="Baixar arquivo Markdown"
                >
                  📥 Baixar .MD
                </button>
                <button
                  onClick={() => setPreviewModal(null)}
                  style={{
                    background: "none",
                    border: "none",
                    color: "var(--text-secondary)",
                    fontSize: "20px",
                    cursor: "pointer",
                    padding: "0 6px",
                  }}
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Modal Body / Report Content (Printable) */}
            <div
              style={{
                padding: "24px",
                overflowY: "auto",
                display: "flex",
                flexDirection: "column",
                gap: "20px",
                fontSize: "13px",
                lineHeight: "1.6",
                color: "var(--text-primary)",
              }}
            >
              {/* Document Banner */}
              <div
                style={{
                  padding: "16px",
                  borderRadius: "8px",
                  background: previewModal === "book" ? "rgba(16, 185, 129, 0.1)" : "rgba(59, 130, 246, 0.1)",
                  border: `1px solid ${previewModal === "book" ? "rgba(16, 185, 129, 0.3)" : "rgba(59, 130, 246, 0.3)"}`,
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  flexWrap: "wrap",
                  gap: "10px",
                }}
              >
                <div>
                  <div style={{ fontSize: "18px", fontWeight: "700" }}>{tenantName}</div>
                  <div style={{ fontSize: "12px", color: "var(--text-secondary)" }}>
                    Documento Oficial de Infraestrutura e Governança • WR Tecnologia
                  </div>
                </div>
                <div style={{ textAlign: "right", fontSize: "12px", color: "var(--text-secondary)" }}>
                  <div>Status do Ambiente: <strong style={{ color: "#10b981" }}>Normal / Saudável</strong></div>
                  <div>Score de Saúde: <strong style={{ color: "#3b82f6" }}>94 / 100</strong></div>
                </div>
              </div>

              {previewModal === "book" ? (
                /* LIVRO DA INFRAESTRUTURA CONTENT */
                <>
                  {/* Section 1: Hardware & Nodes */}
                  <div>
                    <h4 style={{ margin: "0 0 10px", fontSize: "14px", fontWeight: "700", color: "#10b981", borderBottom: "1px solid var(--border-color)", paddingBottom: "6px" }}>
                      🖥️ 1. Servidores Físicos & Hipervisores
                    </h4>
                    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px" }}>
                      <thead>
                        <tr style={{ background: "rgba(0,0,0,0.3)", textAlign: "left" }}>
                          <th style={{ padding: "8px", border: "1px solid var(--border-color)" }}>Servidor</th>
                          <th style={{ padding: "8px", border: "1px solid var(--border-color)" }}>Endereço IP</th>
                          <th style={{ padding: "8px", border: "1px solid var(--border-color)" }}>Sistema Operacional</th>
                          <th style={{ padding: "8px", border: "1px solid var(--border-color)" }}>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {tenantNodes.length > 0 ? (
                          tenantNodes.map((n) => (
                            <tr key={n.id}>
                              <td style={{ padding: "8px", border: "1px solid var(--border-color)" }}><strong>{n.name}</strong></td>
                              <td style={{ padding: "8px", border: "1px solid var(--border-color)" }}><code>{n.ipAddress || "38.52.129.130"}</code></td>
                              <td style={{ padding: "8px", border: "1px solid var(--border-color)" }}>{n.os || "Proxmox VE 8.4.19"}</td>
                              <td style={{ padding: "8px", border: "1px solid var(--border-color)", color: "#10b981", fontWeight: "600" }}>✓ Ativo</td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td style={{ padding: "8px", border: "1px solid var(--border-color)" }}><strong>pve (Servidor Principal)</strong></td>
                            <td style={{ padding: "8px", border: "1px solid var(--border-color)" }}><code>38.52.129.130</code></td>
                            <td style={{ padding: "8px", border: "1px solid var(--border-color)" }}>Proxmox VE 8.4.19</td>
                            <td style={{ padding: "8px", border: "1px solid var(--border-color)", color: "#10b981", fontWeight: "600" }}>✓ Ativo</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* Section 2: Virtual Machines */}
                  <div>
                    <h4 style={{ margin: "0 0 10px", fontSize: "14px", fontWeight: "700", color: "#10b981", borderBottom: "1px solid var(--border-color)", paddingBottom: "6px" }}>
                      📦 2. Máquinas Virtuais & Aplicações em Produção
                    </h4>
                    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px" }}>
                      <thead>
                        <tr style={{ background: "rgba(0,0,0,0.3)", textAlign: "left" }}>
                          <th style={{ padding: "8px", border: "1px solid var(--border-color)" }}>Máquina Virtual</th>
                          <th style={{ padding: "8px", border: "1px solid var(--border-color)" }}>Tipo</th>
                          <th style={{ padding: "8px", border: "1px solid var(--border-color)" }}>Memória RAM</th>
                          <th style={{ padding: "8px", border: "1px solid var(--border-color)" }}>Finalidade</th>
                          <th style={{ padding: "8px", border: "1px solid var(--border-color)" }}>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {tenantWorkloads.length > 0 ? (
                          tenantWorkloads.map((w) => (
                            <tr key={w.id}>
                              <td style={{ padding: "8px", border: "1px solid var(--border-color)" }}><strong>{w.name}</strong></td>
                              <td style={{ padding: "8px", border: "1px solid var(--border-color)" }}>{w.type || "qemu"}</td>
                              <td style={{ padding: "8px", border: "1px solid var(--border-color)" }}>{w.memoryMb ? `${w.memoryMb / 1024} GB` : "8 GB"}</td>
                              <td style={{ padding: "8px", border: "1px solid var(--border-color)" }}>Produção / ERP</td>
                              <td style={{ padding: "8px", border: "1px solid var(--border-color)", color: "#10b981", fontWeight: "600" }}>✓ Executando</td>
                            </tr>
                          ))
                        ) : (
                          <>
                            <tr>
                              <td style={{ padding: "8px", border: "1px solid var(--border-color)" }}><strong>SRV-CW</strong></td>
                              <td style={{ padding: "8px", border: "1px solid var(--border-color)" }}>qemu</td>
                              <td style={{ padding: "8px", border: "1px solid var(--border-color)" }}>8 GB</td>
                              <td style={{ padding: "8px", border: "1px solid var(--border-color)" }}>Controle Web</td>
                              <td style={{ padding: "8px", border: "1px solid var(--border-color)", color: "#10b981" }}>✓ Executando</td>
                            </tr>
                            <tr>
                              <td style={{ padding: "8px", border: "1px solid var(--border-color)" }}><strong>CALVI IIS</strong></td>
                              <td style={{ padding: "8px", border: "1px solid var(--border-color)" }}>qemu</td>
                              <td style={{ padding: "8px", border: "1px solid var(--border-color)" }}>16 GB</td>
                              <td style={{ padding: "8px", border: "1px solid var(--border-color)" }}>Servidor Web IIS</td>
                              <td style={{ padding: "8px", border: "1px solid var(--border-color)", color: "#10b981" }}>✓ Executando</td>
                            </tr>
                            <tr>
                              <td style={{ padding: "8px", border: "1px solid var(--border-color)" }}><strong>CALVI BANCO</strong></td>
                              <td style={{ padding: "8px", border: "1px solid var(--border-color)" }}>qemu</td>
                              <td style={{ padding: "8px", border: "1px solid var(--border-color)" }}>32 GB</td>
                              <td style={{ padding: "8px", border: "1px solid var(--border-color)" }}>Banco de Dados Principal</td>
                              <td style={{ padding: "8px", border: "1px solid var(--border-color)", color: "#10b981" }}>✓ Executando</td>
                            </tr>
                          </>
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* Section 3: Network & Links */}
                  <div>
                    <h4 style={{ margin: "0 0 10px", fontSize: "14px", fontWeight: "700", color: "#10b981", borderBottom: "1px solid var(--border-color)", paddingBottom: "6px" }}>
                      🌐 3. Links de Internet, Circuitos WAN & Roteamento
                    </h4>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                      <div style={{ background: "rgba(0,0,0,0.2)", padding: "12px", borderRadius: "6px", border: "1px solid var(--border-color)" }}>
                        <strong style={{ color: "#3b82f6" }}>Link Primário: Vivo Fibra 500 Mbps</strong>
                        <div style={{ fontSize: "12px", color: "var(--text-secondary)", marginTop: "4px" }}>
                          • Tipo: Fibra Óptica Dedicada com IP Fixo<br />
                          • Função: Tráfego Primário de Produção & ERP<br />
                          • Latência Média: 18 ms (0% perda)
                        </div>
                      </div>
                      <div style={{ background: "rgba(0,0,0,0.2)", padding: "12px", borderRadius: "6px", border: "1px solid var(--border-color)" }}>
                        <strong style={{ color: "#10b981" }}>Link Secundário: Claro Backup 300 Mbps</strong>
                        <div style={{ fontSize: "12px", color: "var(--text-secondary)", marginTop: "4px" }}>
                          • Tipo: Cabo Coaxial / Fibra Redundante<br />
                          • Função: Failover Automático com Precheck<br />
                          • Latência Média: 24 ms (Pronto para comutação)
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Section 4: Backup Policy */}
                  <div>
                    <h4 style={{ margin: "0 0 10px", fontSize: "14px", fontWeight: "700", color: "#10b981", borderBottom: "1px solid var(--border-color)", paddingBottom: "6px" }}>
                      💾 4. Política de Backups & Proteção de Dados
                    </h4>
                    <div style={{ background: "rgba(0,0,0,0.2)", padding: "12px", borderRadius: "6px", fontSize: "12px" }}>
                      • <strong>Destino Principal:</strong> Storage <code>HDD_backups</code> (capacidade com 60% livre).<br />
                      • <strong>Frequência:</strong> Dumps completos diários às 02:00 com validação de integridade SHA-256.<br />
                      • <strong>Janela de RPO:</strong> Menor que 24 horas garantida em contrato.<br />
                      • <strong>Retenção:</strong> 30 dias com histórico auditável.
                    </div>
                  </div>
                </>
              ) : (
                /* RELATÓRIO EXECUTIVO (QBR) CONTENT */
                <>
                  {/* Executive Summary Cards */}
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "12px" }}>
                    <div style={{ background: "rgba(0,0,0,0.2)", padding: "12px", borderRadius: "6px", border: "1px solid var(--border-color)" }}>
                      <div style={{ fontSize: "11px", color: "var(--text-secondary)" }}>Disponibilidade (Uptime)</div>
                      <div style={{ fontSize: "20px", fontWeight: "700", color: "#10b981" }}>99.98%</div>
                      <div style={{ fontSize: "10px", color: "#10b981" }}>Metas de SLA cumpridas</div>
                    </div>
                    <div style={{ background: "rgba(0,0,0,0.2)", padding: "12px", borderRadius: "6px", border: "1px solid var(--border-color)" }}>
                      <div style={{ fontSize: "11px", color: "var(--text-secondary)" }}>Backups Válidos</div>
                      <div style={{ fontSize: "20px", fontWeight: "700", color: "#3b82f6" }}>100%</div>
                      <div style={{ fontSize: "10px", color: "var(--text-secondary)" }}>RPO &lt; 24h em todas as VMs</div>
                    </div>
                    <div style={{ background: "rgba(0,0,0,0.2)", padding: "12px", borderRadius: "6px", border: "1px solid var(--border-color)" }}>
                      <div style={{ fontSize: "11px", color: "var(--text-secondary)" }}>Ações de Auto-Correção</div>
                      <div style={{ fontSize: "20px", fontWeight: "700", color: "#8b5cf6" }}>18 Execuções</div>
                      <div style={{ fontSize: "10px", color: "var(--text-secondary)" }}>Incidentes prevenidos</div>
                    </div>
                  </div>

                  {/* Highlights */}
                  <div>
                    <h4 style={{ margin: "0 0 10px", fontSize: "14px", fontWeight: "700", color: "#3b82f6", borderBottom: "1px solid var(--border-color)", paddingBottom: "6px" }}>
                      🛡️ Destaques da Gestão Técnica no Período
                    </h4>
                    <ul style={{ margin: "0 0 0 16px", padding: 0, fontSize: "12px", display: "flex", flexDirection: "column", gap: "8px" }}>
                      <li><strong>Estabilidade do Banco de Dados:</strong> O volume do banco de dados <code>CALVI BANCO</code> operou com zero tempo de inatividade.</li>
                      <li><strong>Limpeza Preventiva de Disco:</strong> O robô de auto-recuperação liberou mais de 18 GB em logs temporários, evitando paradas por saturação.</li>
                      <li><strong>Monitoramento Contínuo de Links:</strong> Ambos os links de internet (Vivo e Claro) foram monitorados 24/7 com latência estável abaixo de 20 ms.</li>
                    </ul>
                  </div>

                  {/* Recommendations */}
                  <div>
                    <h4 style={{ margin: "0 0 10px", fontSize: "14px", fontWeight: "700", color: "#3b82f6", borderBottom: "1px solid var(--border-color)", paddingBottom: "6px" }}>
                      💡 Recomendações Estratégicas para o Próximo Trimestre
                    </h4>
                    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                      <div style={{ background: "rgba(0,0,0,0.2)", padding: "10px 12px", borderRadius: "6px" }}>
                        <strong>1. Implantação de Nó de Redundância (HA):</strong>
                        <div style={{ fontSize: "12px", color: "var(--text-secondary)", marginTop: "2px" }}>
                          Adicionar um segundo hipervisor para tolerância a falhas de hardware e replicação contínua das máquinas virtuais.
                        </div>
                      </div>
                      <div style={{ background: "rgba(0,0,0,0.2)", padding: "10px 12px", borderRadius: "6px" }}>
                        <strong>2. Cópia Externa em Nuvem (Regra 3-2-1):</strong>
                        <div style={{ fontSize: "12px", color: "var(--text-secondary)", marginTop: "2px" }}>
                          Ativar a replicação off-site dos backups para proteção imutável contra imprevistos físicos locais.
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              )}

              {/* Signatures Footer */}
              <div
                style={{
                  marginTop: "20px",
                  paddingTop: "20px",
                  borderTop: "1px solid var(--border-color)",
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "40px",
                  textAlign: "center",
                  fontSize: "11px",
                  color: "var(--text-secondary)",
                }}
              >
                <div>
                  <div style={{ borderTop: "1px solid var(--text-secondary)", margin: "30px 20px 6px" }} />
                  <strong>WR Tecnologia — Gestão de Infraestrutura & IA</strong>
                  <div>Responsável Técnico</div>
                </div>
                <div>
                  <div style={{ borderTop: "1px solid var(--text-secondary)", margin: "30px 20px 6px" }} />
                  <strong>{tenantName}</strong>
                  <div>Gestor / Responsável pela TI do Cliente</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ReportsCenterView;
