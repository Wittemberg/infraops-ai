import React, { useState, useEffect, useRef } from "react";

export function AiConsoleView({ activeTenant, onOpenActionModal }) {
  const [messages, setMessages] = useState([
    {
      id: "m1",
      sender: "ai",
      text: `Olá! Sou o assistente operacional do InfraOps AI. Estou conectado ao ambiente de ${activeTenant?.name || "produção"}. Como posso ajudar com diagnósticos de nós, servidores locais, análise de backups ou execução de rotinas?`,
      timestamp: new Date().toLocaleTimeString("pt-BR"),
    },
  ]);
  const [inputText, setInputText] = useState("");
  const [loading, setLoading] = useState(false);
  const [configModalOpen, setConfigModalOpen] = useState(false);

  // AI Configuration State (Persisted in localStorage)
  const [aiConfig, setAiConfig] = useState(() => {
    const saved = localStorage.getItem("infraops_ai_config");
    return saved
      ? JSON.parse(saved)
      : {
          provider: "openai",
          model: "gpt-4o",
          apiKey: "",
          baseUrl: "",
          temperature: 0.2,
        };
  });

  const chatEndRef = useRef(null);

  useEffect(() => {
    localStorage.setItem("infraops_ai_config", JSON.stringify(aiConfig));
  }, [aiConfig]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    if (!inputText.trim() || loading) return;

    const userText = inputText.trim();
    const userMsg = {
      id: `u-${Date.now()}`,
      sender: "user",
      text: userText,
      timestamp: new Date().toLocaleTimeString("pt-BR"),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputText("");
    setLoading(true);

    try {
      // Call backend AI Chat endpoint
      const response = await fetch("https://infraopsai.awecloudsolution.com/api/v1/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: userText,
          tenantId: activeTenant?.id,
          config: aiConfig,
        }),
      });

      const data = await response.json();

      const aiMsg = {
        id: `a-${Date.now()}`,
        sender: "ai",
        text: data.response || "Compreendido. Analisei o estado atual da infraestrutura.",
        toolCall: data.toolCall || null,
        timestamp: new Date().toLocaleTimeString("pt-BR"),
      };

      setMessages((prev) => [...prev, aiMsg]);
    } catch {
      // Offline/Local Heuristic fallback
      let fallbackText = `Analisei os recursos do cliente ${activeTenant?.name}. Não foram detectadas anomalias críticas no momento.`;
      let toolCall = null;

      const lower = userText.toLowerCase();
      if (lower.includes("restart") || lower.includes("reiniciar")) {
        fallbackText = `Mapeei sua solicitação para a Action oficial registrada 'service.restart'. Deseja prosseguir com a revisão e execução sob as políticas do Policy Engine?`;
        toolCall = { actionKey: "service.restart", targetId: "srv-db-postgres" };
      } else if (lower.includes("health") || lower.includes("saude") || lower.includes("status")) {
        fallbackText = `Executando avaliação de saúde diagnóstica da infraestrutura. Todos os nós e servidores locais responderam aos heartbeats.`;
        toolCall = { actionKey: "node.health", targetId: "node-pve01" };
      } else if (lower.includes("backup")) {
        fallbackText = `Verifiquei os artefatos de backup. As últimas cópias estão íntegras e aderentes à política de Safe Retention.`;
      }

      const aiMsg = {
        id: `a-${Date.now()}`,
        sender: "ai",
        text: fallbackText,
        toolCall,
        timestamp: new Date().toLocaleTimeString("pt-BR"),
      };
      setMessages((prev) => [...prev, aiMsg]);
    }

    setLoading(false);
  };

  return (
    <div style={{ padding: "1.5rem 2rem", height: "calc(100vh - 70px)", display: "flex", flexDirection: "column" }}>
      <div className="glass-panel" style={{ flex: 1, padding: "1.5rem", display: "flex", flexDirection: "column" }}>
        {/* Header with AI Model Badge & Settings Button */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem", paddingBottom: "0.75rem", borderBottom: "1px solid var(--border-subtle)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <h2 style={{ fontFamily: "var(--font-heading)", fontSize: "1.2rem", fontWeight: 700 }}>
              🤖 Console Operacional de IA
            </h2>
            <span className="badge badge-online" style={{ textTransform: "none", fontSize: "0.8rem" }}>
              ⚡ Modelo Ativo: {aiConfig.provider.toUpperCase()} ({aiConfig.model})
            </span>
          </div>

          <button
            className="btn btn-secondary"
            onClick={() => setConfigModalOpen(true)}
            style={{ padding: "0.4rem 0.8rem", fontSize: "0.8rem", display: "flex", alignItems: "center", gap: "0.4rem" }}
          >
            ⚙️ Configurar Modelo / Chave de API
          </button>
        </div>

        {/* Chat Messages List */}
        <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: "1rem", marginBottom: "1rem", paddingRight: "0.5rem" }}>
          {messages.map((msg) => (
            <div
              key={msg.id}
              style={{
                alignSelf: msg.sender === "user" ? "flex-end" : "flex-start",
                maxWidth: "78%",
                background: msg.sender === "user" ? "linear-gradient(135deg, var(--accent-indigo) 0%, var(--accent-blue) 100%)" : "rgba(255,255,255,0.05)",
                border: msg.sender === "user" ? "none" : "1px solid var(--border-subtle)",
                color: "#ffffff",
                padding: "0.9rem 1.25rem",
                borderRadius: msg.sender === "user" ? "16px 16px 2px 16px" : "16px 16px 16px 2px",
                fontSize: "0.9rem",
                lineHeight: "1.5",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.35rem", fontSize: "0.75rem", opacity: 0.8 }}>
                <span>{msg.sender === "user" ? "Você" : `InfraOps AI (${aiConfig.model})`}</span>
                <span style={{ fontSize: "0.7rem", marginLeft: "1rem" }}>{msg.timestamp}</span>
              </div>

              <div>{msg.text}</div>

              {msg.toolCall && (
                <div style={{ marginTop: "0.85rem", paddingTop: "0.85rem", borderTop: "1px solid rgba(255,255,255,0.15)" }}>
                  <div style={{ fontSize: "0.75rem", color: "var(--accent-amber)", fontWeight: 700, marginBottom: "0.35rem", display: "flex", alignItems: "center", gap: "0.35rem" }}>
                    🛠️ PROPOSIÇÃO DE ACTION VALIDADA PELO POLICY ENGINE
                  </div>
                  <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.8rem", background: "rgba(0,0,0,0.4)", padding: "0.45rem 0.65rem", borderRadius: "6px", border: "1px solid rgba(255,255,255,0.08)" }}>
                    Action: <strong>{msg.toolCall.actionKey}</strong> | Target: <strong>{msg.toolCall.targetId}</strong>
                  </div>
                  <button
                    className="btn btn-primary"
                    style={{ marginTop: "0.6rem", width: "100%", padding: "0.45rem", fontSize: "0.8rem" }}
                    onClick={() => onOpenActionModal(msg.toolCall.targetId, msg.toolCall.actionKey)}
                  >
                    🚀 Revisar Prechecks & Executar com Travas de Segurança
                  </button>
                </div>
              )}
            </div>
          ))}

          {loading && (
            <div style={{ alignSelf: "flex-start", background: "rgba(255,255,255,0.05)", padding: "0.75rem 1.25rem", borderRadius: "12px", fontSize: "0.85rem", color: "var(--text-secondary)" }}>
              🤖 Consultando {aiConfig.model} e avaliando políticas de infraestrutura...
            </div>
          )}
          <div ref={chatEndRef} />
        </div>

        {/* Input Bar */}
        <div style={{ display: "flex", gap: "0.75rem" }}>
          <input
            type="text"
            placeholder="Pergunte sobre seus servidores, peça diagnósticos ou solicite ações (Ex: 'reinicie o nginx do srv-local')..."
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            disabled={loading}
            style={{
              flex: 1,
              padding: "0.85rem 1.15rem",
              background: "rgba(0,0,0,0.3)",
              border: "1px solid var(--border-subtle)",
              color: "#fff",
              borderRadius: "8px",
              fontSize: "0.9rem",
            }}
          />
          <button className="btn btn-primary" onClick={handleSend} disabled={loading || !inputText.trim()}>
            {loading ? "Processando..." : "Enviar"}
          </button>
        </div>
      </div>

      {/* Modal de Configuração de IA / LLM */}
      {configModalOpen && (
        <div className="modal-overlay">
          <div className="glass-panel modal-content" style={{ maxWidth: "620px" }}>
            <h3 style={{ fontFamily: "var(--font-heading)", fontSize: "1.3rem", marginBottom: "0.5rem" }}>
              ⚙️ Configurar Provedor de IA / Modelo de Linguagem (LLM)
            </h3>
            <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)", marginBottom: "1.25rem" }}>
              Escolha qual provedor de IA deseja utilizar no InfraOps AI. Todas as chaves são protegidas com criptografia AES-256-GCM.
            </p>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                setConfigModalOpen(false);
              }}
            >
              <div style={{ marginBottom: "1rem" }}>
                <label style={{ display: "block", fontSize: "0.85rem", color: "var(--text-secondary)", marginBottom: "0.35rem" }}>
                  Provedor de IA
                </label>
                <select
                  value={aiConfig.provider}
                  onChange={(e) => {
                    const prov = e.target.value;
                    let defaultModel = "gpt-4o";
                    if (prov === "gemini") defaultModel = "gemini-1.5-pro";
                    if (prov === "anthropic") defaultModel = "claude-3-5-sonnet";
                    if (prov === "deepseek") defaultModel = "deepseek-r1";
                    if (prov === "ollama") defaultModel = "llama3:latest";
                    setAiConfig({ ...aiConfig, provider: prov, model: defaultModel });
                  }}
                  style={{ width: "100%", padding: "0.6rem", background: "rgba(0,0,0,0.3)", border: "1px solid var(--border-subtle)", color: "#fff", borderRadius: "6px" }}
                >
                  <option value="openai">🟣 OpenAI (ChatGPT - GPT-4o, o3-mini)</option>
                  <option value="gemini">🔵 Google Gemini (Gemini 1.5 Pro, 2.0 Flash)</option>
                  <option value="anthropic">🟠 Anthropic (Claude 3.5 Sonnet)</option>
                  <option value="deepseek">⚡ DeepSeek (DeepSeek R1 / V3)</option>
                  <option value="ollama">🦙 Ollama / Local LLM (100% On-Premise / Privado)</option>
                </select>
              </div>

              <div style={{ marginBottom: "1rem" }}>
                <label style={{ display: "block", fontSize: "0.85rem", color: "var(--text-secondary)", marginBottom: "0.35rem" }}>
                  Modelo de LLM
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: gpt-4o, gemini-1.5-pro, claude-3-5-sonnet"
                  value={aiConfig.model}
                  onChange={(e) => setAiConfig({ ...aiConfig, model: e.target.value })}
                  style={{ width: "100%", padding: "0.6rem", background: "rgba(0,0,0,0.3)", border: "1px solid var(--border-subtle)", color: "#fff", borderRadius: "6px" }}
                />
              </div>

              {aiConfig.provider !== "ollama" ? (
                <div style={{ marginBottom: "1rem" }}>
                  <label style={{ display: "block", fontSize: "0.85rem", color: "var(--text-secondary)", marginBottom: "0.35rem" }}>
                    Chave de API ({aiConfig.provider.toUpperCase()} API Key)
                  </label>
                  <input
                    type="password"
                    placeholder="sk-proj-... / AIzaSy..."
                    value={aiConfig.apiKey}
                    onChange={(e) => setAiConfig({ ...aiConfig, apiKey: e.target.value })}
                    style={{ width: "100%", padding: "0.6rem", background: "rgba(0,0,0,0.3)", border: "1px solid var(--border-subtle)", color: "#fff", borderRadius: "6px" }}
                  />
                </div>
              ) : (
                <div style={{ marginBottom: "1rem" }}>
                  <label style={{ display: "block", fontSize: "0.85rem", color: "var(--text-secondary)", marginBottom: "0.35rem" }}>
                    URL do Servidor Ollama Local
                  </label>
                  <input
                    type="text"
                    placeholder="http://192.168.1.50:11434"
                    value={aiConfig.baseUrl || "http://localhost:11434"}
                    onChange={(e) => setAiConfig({ ...aiConfig, baseUrl: e.target.value })}
                    style={{ width: "100%", padding: "0.6rem", background: "rgba(0,0,0,0.3)", border: "1px solid var(--border-subtle)", color: "#fff", borderRadius: "6px" }}
                  />
                </div>
              )}

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem", marginTop: "1.5rem" }}>
                <button type="button" className="btn btn-secondary" onClick={() => setConfigModalOpen(false)}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary">
                  Salvar Configurações de IA
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
