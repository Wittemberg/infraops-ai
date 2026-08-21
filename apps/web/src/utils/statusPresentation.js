/**
 * Mapeamento Humanizado de Status e Níveis de Risco
 * InfraOps AI — Stage 28A
 */

export function formatStatus(status, mode = "simple") {
  const normalized = (status || "").toLowerCase();

  const statusMap = {
    // Status de Nós e Serviços
    running: { label: mode === "simple" ? "Em Execução" : "Running", color: "#10b981", bg: "rgba(16, 185, 129, 0.15)" },
    online: { label: mode === "simple" ? "Online / Ativo" : "Online", color: "#10b981", bg: "rgba(16, 185, 129, 0.15)" },
    stopped: { label: mode === "simple" ? "Parado" : "Stopped", color: "#64748b", bg: "rgba(100, 116, 139, 0.15)" },
    offline: { label: mode === "simple" ? "Desconectado" : "Offline", color: "#ef4444", bg: "rgba(239, 68, 68, 0.15)" },
    error: { label: mode === "simple" ? "Com Falha" : "Error", color: "#ef4444", bg: "rgba(239, 68, 68, 0.15)" },
    degraded: { label: mode === "simple" ? "Instável / Atenção" : "Degraded", color: "#f59e0b", bg: "rgba(245, 158, 11, 0.15)" },

    // Status de Links WAN
    up: { label: mode === "simple" ? "Conectado" : "UP (Ativo)", color: "#10b981", bg: "rgba(16, 185, 129, 0.15)" },
    down: { label: mode === "simple" ? "Sem Internet" : "DOWN (Inativo)", color: "#ef4444", bg: "rgba(239, 68, 68, 0.15)" },

    // Status de Ações e Execuções
    success: { label: mode === "simple" ? "Concluído com Sucesso" : "Success", color: "#10b981", bg: "rgba(16, 185, 129, 0.15)" },
    completed: { label: mode === "simple" ? "Concluído" : "Completed", color: "#10b981", bg: "rgba(16, 185, 129, 0.15)" },
    failed: { label: mode === "simple" ? "Falhou" : "Failed", color: "#ef4444", bg: "rgba(239, 68, 68, 0.15)" },
    pending: { label: mode === "simple" ? "Pendente" : "Pending", color: "#f59e0b", bg: "rgba(245, 158, 11, 0.15)" },
    in_progress: { label: mode === "simple" ? "Executando..." : "In Progress", color: "#3b82f6", bg: "rgba(59, 130, 246, 0.15)" },
  };

  return statusMap[normalized] || {
    label: status || "Desconhecido",
    color: "#64748b",
    bg: "rgba(100, 116, 139, 0.15)",
  };
}

export function formatRiskLevel(risk, mode = "simple") {
  const normalized = (risk || "").toLowerCase();

  const riskMap = {
    low: { label: mode === "simple" ? "Baixo Risco (Seguro)" : "Low Risk", color: "#10b981" },
    medium: { label: mode === "simple" ? "Atenção (Risco Médio)" : "Medium Risk", color: "#f59e0b" },
    high: { label: mode === "simple" ? "Alto Risco (Crítico)" : "High Risk", color: "#ef4444" },
    critical: { label: mode === "simple" ? "Crítico (Requer Validação)" : "Critical", color: "#dc2626" },
  };

  return riskMap[normalized] || { label: risk || "Indefinido", color: "#64748b" };
}
