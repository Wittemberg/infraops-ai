import React, { useState } from "react";

export function AiConsoleView({ onOpenActionModal }) {
  const [messages, setMessages] = useState([
    {
      id: "m1",
      sender: "ai",
      text: "Olá! Sou o assistente operacional de infraestrutura do InfraOps AI. Como posso ajudar com seus nós, backups ou serviços hoje?",
    },
  ]);
  const [inputText, setInputText] = useState("");

  const handleSend = () => {
    if (!inputText.trim()) return;

    const userMsg = { id: `u-${Date.now()}`, sender: "user", text: inputText };
    setMessages((prev) => [...prev, userMsg]);
    setInputText("");

    setTimeout(() => {
      let aiMsg = {
        id: `a-${Date.now()}`,
        sender: "ai",
        text: "Analisei a infraestrutura. O nó node-pve01 está com todos os serviços operacionais. Deseja executar um health check detalhado?",
        toolCall: { actionKey: "node.health", targetId: "node-pve01" },
      };

      if (userMsg.text.toLowerCase().includes("restart")) {
        aiMsg = {
          id: `a-${Date.now()}`,
          sender: "ai",
          text: "Mapeei sua solicitação para a Action oficial 'service.restart'. Foi gerada uma proposição para o serviço nginx em node-101.",
          toolCall: { actionKey: "service.restart", targetId: "node-101" },
        };
      }

      setMessages((prev) => [...prev, aiMsg]);
    }, 600);
  };

  return (
    <div style={{ padding: "1.5rem 2rem", height: "calc(100vh - 70px)", display: "flex", flexDirection: "column" }}>
      <div className="glass-panel" style={{ flex: 1, padding: "1.5rem", display: "flex", flexDirection: "column" }}>
        <h2 style={{ fontFamily: "var(--font-heading)", fontSize: "1.2rem", marginBottom: "1rem" }}>
          🤖 Console Operacional de IA
        </h2>

        {/* Chat Message List */}
        <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: "1rem", marginBottom: "1rem" }}>
          {messages.map((msg) => (
            <div
              key={msg.id}
              style={{
                alignSelf: msg.sender === "user" ? "flex-end" : "flex-start",
                maxWidth: "75%",
                background: msg.sender === "user" ? "var(--accent-indigo)" : "rgba(255,255,255,0.05)",
                color: "#ffffff",
                padding: "0.85rem 1.15rem",
                borderRadius: msg.sender === "user" ? "16px 16px 2px 16px" : "16px 16px 16px 2px",
                fontSize: "0.9rem",
                lineHeight: "1.4",
              }}
            >
              {msg.text}

              {msg.toolCall && (
                <div style={{ marginTop: "0.75rem", paddingTop: "0.75rem", borderTop: "1px solid rgba(255,255,255,0.1)" }}>
                  <div style={{ fontSize: "0.75rem", color: "var(--accent-amber)", fontWeight: 600, marginBottom: "0.35rem" }}>
                    🛠️ Proposição de Ferramenta Estruturada
                  </div>
                  <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.8rem", background: "rgba(0,0,0,0.3)", padding: "0.4rem 0.6rem", borderRadius: "4px" }}>
                    Action: {msg.toolCall.actionKey} | Target: {msg.toolCall.targetId}
                  </div>
                  <button
                    className="btn btn-primary"
                    style={{ marginTop: "0.5rem", width: "100%", padding: "0.4rem", fontSize: "0.8rem" }}
                    onClick={() => onOpenActionModal(msg.toolCall.targetId, msg.toolCall.actionKey)}
                  >
                    Revisar & Executar Plano
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Input Bar */}
        <div style={{ display: "flex", gap: "0.75rem" }}>
          <input
            type="text"
            placeholder="Ex: 'faça restart no nginx do node-101'..."
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            style={{
              flex: 1,
              padding: "0.85rem 1rem",
              background: "rgba(0,0,0,0.3)",
              border: "1px solid var(--border-subtle)",
              color: "#fff",
              borderRadius: "8px",
              fontSize: "0.9rem",
            }}
          />
          <button className="btn btn-primary" onClick={handleSend}>
            Enviar
          </button>
        </div>
      </div>
    </div>
  );
}
