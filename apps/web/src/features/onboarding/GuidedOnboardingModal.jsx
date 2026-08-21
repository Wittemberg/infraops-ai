import React from "react";

export function GuidedOnboardingModal({ isOpen, onClose, onNavigate, activeTenant }) {
  if (!isOpen) return null;

  const tenantName = activeTenant?.name || "Ambiente Ativo";

  const steps = [
    {
      number: "1",
      title: "Conectar Servidor / Hipervisor Proxmox VE",
      desc: "Vincule o servidor Proxmox ou Virtualizor via API para monitorar nós, VMs e uso de recursos em tempo real.",
      icon: "🖥️",
      actionLabel: "Conectar Servidor",
      route: "settings",
      completed: true,
    },
    {
      number: "2",
      title: "Definir Rotina de Backup & Proteção",
      desc: "Configure a frequência de backups e a meta de RPO para garantir que os dados do cliente estejam sempre seguros.",
      icon: "💾",
      actionLabel: "Configurar Backups",
      route: "backups",
      completed: true,
    },
    {
      number: "3",
      title: "Cadastrar Roteador & Links de Internet",
      desc: "Adicione o roteador MikroTik ou pfSense para monitorar a qualidade do link WAN e permitir comutação segura.",
      icon: "🌐",
      actionLabel: "Cadastrar Roteador",
      route: "network",
      completed: true,
    },
    {
      number: "4",
      title: "Conectar Notificações WhatsApp / Telegram",
      desc: "Receba alertas críticos instantaneamente no WhatsApp do plantonista ou canal da equipe de suporte.",
      icon: "🔔",
      actionLabel: "Ativar Alertas",
      route: "alerts",
      completed: false,
    },
  ];

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: "rgba(0, 0, 0, 0.7)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 9999,
        padding: "20px",
      }}
    >
      <div
        style={{
          background: "var(--bg-card, #1e293b)",
          borderRadius: "12px",
          border: "1px solid var(--border-color)",
          maxWidth: "600px",
          width: "100%",
          padding: "24px",
          display: "flex",
          flexDirection: "column",
          gap: "18px",
          boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.5)",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span style={{ fontSize: "20px" }}>🧭</span>
              <h3 style={{ margin: 0, fontSize: "17px", fontWeight: "700", color: "var(--text-primary)" }}>
                Guia de Configuração Rápida
              </h3>
            </div>
            <p style={{ margin: "4px 0 0", fontSize: "12px", color: "var(--text-secondary)" }}>
              Checklist de 4 passos para colocar o cliente <strong>{tenantName}</strong> em monitoramento total.
            </p>
          </div>
          <button
            onClick={onClose}
            style={{ background: "none", border: "none", color: "var(--text-secondary)", fontSize: "18px", cursor: "pointer" }}
          >
            ✕
          </button>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          {steps.map((step) => (
            <div
              key={step.number}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "12px 14px",
                borderRadius: "8px",
                background: "rgba(0, 0, 0, 0.2)",
                border: "1px solid var(--border-color)",
                gap: "12px",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <span
                  style={{
                    width: "28px",
                    height: "28px",
                    borderRadius: "50%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "12px",
                    fontWeight: "700",
                    background: step.completed ? "rgba(16, 185, 129, 0.2)" : "rgba(59, 130, 246, 0.2)",
                    color: step.completed ? "#10b981" : "#3b82f6",
                    border: `1px solid ${step.completed ? "#10b981" : "#3b82f6"}`,
                  }}
                >
                  {step.completed ? "✓" : step.number}
                </span>
                <div>
                  <div style={{ fontSize: "13px", fontWeight: "600", color: "var(--text-primary)" }}>
                    {step.icon} {step.title}
                  </div>
                  <div style={{ fontSize: "11px", color: "var(--text-secondary)", marginTop: "2px" }}>
                    {step.desc}
                  </div>
                </div>
              </div>

              <button
                onClick={() => {
                  onClose();
                  onNavigate(step.route);
                }}
                style={{
                  padding: "6px 12px",
                  borderRadius: "6px",
                  border: step.completed ? "1px solid var(--border-color)" : "none",
                  background: step.completed ? "var(--bg-card)" : "var(--accent-color, #3b82f6)",
                  color: step.completed ? "var(--text-primary)" : "#ffffff",
                  fontSize: "12px",
                  fontWeight: "600",
                  cursor: "pointer",
                  whiteSpace: "nowrap",
                }}
              >
                {step.completed ? "Configurado" : step.actionLabel}
              </button>
            </div>
          ))}
        </div>

        <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "4px" }}>
          <button
            onClick={onClose}
            style={{
              padding: "8px 16px",
              borderRadius: "6px",
              border: "none",
              background: "var(--accent-color, #3b82f6)",
              color: "#ffffff",
              fontSize: "13px",
              fontWeight: "600",
              cursor: "pointer",
            }}
          >
            Entendido, Fechar Guia
          </button>
        </div>
      </div>
    </div>
  );
}

export default GuidedOnboardingModal;
