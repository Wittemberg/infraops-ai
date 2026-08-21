import React from "react";

export function SimpleModeToggle({ displayMode, onToggleMode }) {
  const isSimple = displayMode === "simple";

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        background: "var(--bg-primary, rgba(0, 0, 0, 0.2))",
        borderRadius: "20px",
        padding: "2px",
        border: "1px solid var(--border-color)",
      }}
    >
      <button
        type="button"
        onClick={() => onToggleMode("simple")}
        style={{
          display: "flex",
          alignItems: "center",
          gap: "5px",
          padding: "4px 10px",
          borderRadius: "16px",
          border: "none",
          background: isSimple ? "var(--accent-color, #3b82f6)" : "transparent",
          color: isSimple ? "#ffffff" : "var(--text-secondary)",
          fontWeight: isSimple ? "600" : "400",
          fontSize: "12px",
          cursor: "pointer",
          transition: "all 0.15s ease",
        }}
        title="Modo Simples: Foco nas operações do dia a dia e linguagem clara"
      >
        <span>🟢</span>
        Modo Simples
      </button>

      <button
        type="button"
        onClick={() => onToggleMode("technical")}
        style={{
          display: "flex",
          alignItems: "center",
          gap: "5px",
          padding: "4px 10px",
          borderRadius: "16px",
          border: "none",
          background: !isSimple ? "var(--accent-color, #3b82f6)" : "transparent",
          color: !isSimple ? "#ffffff" : "var(--text-secondary)",
          fontWeight: !isSimple ? "600" : "400",
          fontSize: "12px",
          cursor: "pointer",
          transition: "all 0.15s ease",
        }}
        title="Modo Técnico: Exibe métricas detalhadas, hashes de auditoria e configurações avançadas"
      >
        <span>🛠️</span>
        Modo Técnico
      </button>
    </div>
  );
}

export default SimpleModeToggle;
