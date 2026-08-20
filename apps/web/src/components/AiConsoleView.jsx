import React, { useState, useEffect, useRef } from "react";

const getInitialMessages = (tenant) => [
  {
    id: "m1",
    sender: "ai",
    text: `Olá! Sou o assistente operacional do InfraOps AI. Estou conectado ao ambiente de ${tenant?.name || "produção"}. Como posso ajudar com diagnósticos de nós, servidores locais, análise de backups, links WAN ou execução de rotinas?`,
    timestamp: new Date().toLocaleTimeString("pt-BR"),
  },
];

export function AiConsoleView({ activeTenant, onOpenActionModal }) {
  const [messages, setMessages] = useState(() => {
    const storageKey = `infraops_ai_chat_${activeTenant?.id || "default"}`;
    const saved = localStorage.getItem(storageKey);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch {}
    }
    return getInitialMessages(activeTenant);
  });
  const [inputText, setInputText] = useState("");
  const [loading, setLoading] = useState(false);
  const [configModalOpen, setConfigModalOpen] = useState(false);
  const [testingConnection, setTestingConnection] = useState(false);
  const [testFeedback, setTestFeedback] = useState(null);
  const [cloudSynced, setCloudSynced] = useState(false);

  // Sync / switch chat history when tenant changes (load local immediately, then sync with cloud)
  useEffect(() => {
    const tenantId = activeTenant?.id || "tenant-default";
    const storageKey = `infraops_ai_chat_${tenantId}`;
    const saved = localStorage.getItem(storageKey);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setMessages(parsed);
        }
      } catch {}
    } else {
      setMessages(getInitialMessages(activeTenant));
    }

    // Fetch cloud-persisted history for multi-device sync
    fetch(`https://infraopsai.awecloudsolution.com/api/v1/ai/chat/history`, {
      headers: { "x-tenant-id": tenantId },
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.messages && Array.isArray(data.messages) && data.messages.length > 0) {
          setMessages(data.messages);
          localStorage.setItem(storageKey, JSON.stringify(data.messages));
          setCloudSynced(true);
        } else {
          setCloudSynced(true);
        }
      })
      .catch(() => setCloudSynced(false));
  }, [activeTenant?.id]);

  // Persist messages whenever they change
  useEffect(() => {
    if (messages && messages.length > 0) {
      const storageKey = `infraops_ai_chat_${activeTenant?.id || "default"}`;
      localStorage.setItem(storageKey, JSON.stringify(messages));
    }
  }, [messages, activeTenant?.id]);

  const handleClearChat = async () => {
    const tenantId = activeTenant?.id || "tenant-default";
    const storageKey = `infraops_ai_chat_${tenantId}`;
    localStorage.removeItem(storageKey);
    setMessages(getInitialMessages(activeTenant));

    try {
      await fetch(`https://infraopsai.awecloudsolution.com/api/v1/ai/chat/history`, {
        method: "DELETE",
        headers: { "x-tenant-id": tenantId },
      });
    } catch {}
  };

  // AI Configuration State (Persisted in localStorage with separate keys per provider)
  const [aiSettings, setAiSettings] = useState(() => {
    const saved = localStorage.getItem("infraops_ai_config_v2");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {}
    }

    // Migration from old single-key config if exists
    const legacy = localStorage.getItem("infraops_ai_config");
    let legacyKey = "";
    let legacyProv = "groq";
    if (legacy) {
      try {
        const parsed = JSON.parse(legacy);
        legacyProv = parsed.provider || "groq";
        legacyKey = parsed.apiKey || "";
      } catch {}
    }

    return {
      activeProvider: legacyProv || "groq",
      keys: {
        groq: legacyProv === "groq" ? legacyKey : "",
        openai: legacyProv === "openai" ? legacyKey : "",
        gemini: legacyProv === "gemini" ? legacyKey : "",
        anthropic: legacyProv === "anthropic" ? legacyKey : "",
        deepseek: legacyProv === "deepseek" ? legacyKey : "",
      },
      models: {
        groq: "llama-3.3-70b-versatile",
        openai: "gpt-4o",
        gemini: "gemini-1.5-pro",
        anthropic: "claude-3-5-sonnet",
        deepseek: "deepseek-r1",
        ollama: "llama3:latest",
      },
      baseUrl: {
        ollama: "http://localhost:11434",
      },
    };
  });

  const chatEndRef = useRef(null);

  const activeProv = aiSettings.activeProvider || "groq";
  const activeModel = aiSettings.models[activeProv] || "llama-3.3-70b-versatile";
  const activeKey = (aiSettings.keys[activeProv] || "").trim();
  const activeBaseUrl = aiSettings.baseUrl[activeProv] || "";

  // The active provider has a valid key ONLY if that specific provider has a non-empty key (or is local ollama)
  const hasActiveKey = Boolean(activeProv === "ollama" || (activeKey && activeKey.length > 0));

  useEffect(() => {
    localStorage.setItem("infraops_ai_config_v2", JSON.stringify(aiSettings));
  }, [aiSettings]);

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

    if (!hasActiveKey) {
      const aiMsg = {
        id: `a-${Date.now()}`,
        sender: "ai",
        text: `⚠️ **Chave de IA não configurada para ${activeProv.toUpperCase()}.**\n\nPara que o assistente operacional possa analisar a infraestrutura do tenant **${activeTenant?.name || "ativo"}** e responder suas perguntas com inteligência generativa em tempo real, é necessário configurar sua chave de API.\n\n👉 Clique no botão **\`⚙️ Configurar Modelo / Chave de API\`** no topo desta tela para inserir sua chave (OpenAI, Groq, DeepSeek, Anthropic, Gemini ou Ollama local).`,
        toolCall: null,
        timestamp: new Date().toLocaleTimeString("pt-BR"),
      };
      setMessages((prev) => [...prev, aiMsg]);
      return;
    }

    setLoading(true);

    try {
      // Build previous conversation history (up to last 10 messages)
      const history = messages
        .filter((m) => m.text && !m.text.startsWith("⚠️"))
        .slice(-10)
        .map((m) => ({
          role: m.sender === "user" ? "user" : "assistant",
          content: m.text,
        }));

      // Call backend AI Chat endpoint with active provider and its own key
      const response = await fetch("https://infraopsai.awecloudsolution.com/api/v1/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: userText,
          tenantId: activeTenant?.id,
          history,
          config: {
            provider: activeProv,
            model: activeModel,
            apiKey: activeKey,
            baseUrl: activeBaseUrl,
          },
        }),
      });

      const data = await response.json();

      const aiMsg = {
        id: `a-${Date.now()}`,
        sender: "ai",
        text: data.response || `⚠️ Não foi possível obter resposta do provedor ${activeProv.toUpperCase()}.`,
        toolCall: data.toolCall || null,
        timestamp: new Date().toLocaleTimeString("pt-BR"),
      };

      setMessages((prev) => [...prev, aiMsg]);
    } catch (err) {
      const aiMsg = {
        id: `a-${Date.now()}`,
        sender: "ai",
        text: `⚠️ **Erro de Comunicação:** Não foi possível conectar ao serviço de IA (${err.message || err}). Verifique se sua chave de API é válida e se possui saldo/créditos ativos.`,
        toolCall: null,
        timestamp: new Date().toLocaleTimeString("pt-BR"),
      };
      setMessages((prev) => [...prev, aiMsg]);
    }

    setLoading(false);
  };

  const handleTestApiConnection = async () => {
    if (!hasActiveKey) {
      setTestFeedback({
        success: false,
        message: `Nenhuma chave de API configurada para o provedor ${activeProv.toUpperCase()}. Digite a chave antes de testar.`,
      });
      return;
    }

    setTestingConnection(true);
    setTestFeedback(null);

    try {
      const response = await fetch("https://infraopsai.awecloudsolution.com/api/v1/ai/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          config: {
            provider: activeProv,
            model: activeModel,
            apiKey: activeKey,
            baseUrl: activeBaseUrl,
          },
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setTestFeedback({
          success: true,
          message: data.message || `Conexão validada com sucesso! (${data.latencyMs}ms)`,
        });
      } else {
        setTestFeedback({
          success: false,
          message: data.error || `Falha ao validar chave com ${activeProv.toUpperCase()}.`,
        });
      }
    } catch (err) {
      setTestFeedback({
        success: false,
        message: `Erro de rede ao conectar com o backend: ${err.message || err}`,
      });
    }

    setTestingConnection(false);
  };

  const getMaskedKey = (key) => {
    if (!key || key.length < 8) return "••••••••";
    return `${key.substring(0, 4)}••••••••${key.slice(-4)}`;
  };

  return (
    <div style={{ padding: "1.5rem 2rem", height: "calc(100vh - 70px)", display: "flex", flexDirection: "column" }}>
      <div className="glass-panel" style={{ flex: 1, padding: "1.5rem", display: "flex", flexDirection: "column" }}>
        {/* Header with AI Model Badge & Settings Button */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem", paddingBottom: "0.75rem", borderBottom: "1px solid var(--border-subtle)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flexWrap: "wrap" }}>
            <h2 style={{ fontFamily: "var(--font-heading)", fontSize: "1.2rem", fontWeight: 700 }}>
              🤖 Console Operacional de IA
            </h2>

            {/* Visual Status Indicator: Active vs Unconfigured */}
            {hasActiveKey ? (
              <span
                className="badge badge-online"
                style={{
                  textTransform: "none",
                  fontSize: "0.8rem",
                  padding: "0.3rem 0.75rem",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.45rem",
                  border: "1px solid rgba(16, 185, 129, 0.4)",
                  background: "rgba(16, 185, 129, 0.15)",
                }}
                title={`Chave configurada: ${getMaskedKey(activeKey)}`}
              >
                <span style={{ fontSize: "0.65rem" }}>🟢</span>
                <strong>{activeProv.toUpperCase()}</strong>: {activeModel}
                <span style={{ background: "rgba(16, 185, 129, 0.3)", padding: "0.1rem 0.4rem", borderRadius: "4px", fontSize: "0.7rem", fontWeight: 700 }}>
                  ✓ CHAVE ATIVA
                </span>
              </span>
            ) : (
              <span
                className="badge"
                style={{
                  textTransform: "none",
                  fontSize: "0.8rem",
                  padding: "0.3rem 0.75rem",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.45rem",
                  background: "rgba(245, 158, 11, 0.15)",
                  color: "var(--accent-amber)",
                  border: "1px solid rgba(245, 158, 11, 0.3)",
                }}
                title={`Chave de API não informada para ${activeProv.toUpperCase()}`}
              >
                <span style={{ fontSize: "0.65rem" }}>⚠️</span>
                <strong>{activeProv.toUpperCase()}</strong> ({activeModel})
                <span style={{ background: "rgba(245, 158, 11, 0.25)", padding: "0.1rem 0.4rem", borderRadius: "4px", fontSize: "0.7rem", fontWeight: 700 }}>
                  CHAVE PENDENTE
                </span>
              </span>
            )}

            <span
              className="badge"
              style={{
                textTransform: "none",
                fontSize: "0.75rem",
                padding: "0.25rem 0.6rem",
                display: "flex",
                alignItems: "center",
                gap: "0.35rem",
                background: "rgba(59, 130, 246, 0.12)",
                color: "#3b82f6",
                border: "1px solid rgba(59, 130, 246, 0.25)",
              }}
              title="Histórico de mensagens sincronizado e persistido na nuvem"
            >
              ☁️ Nuvem Sincronizada
            </span>
          </div>

          <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
            <button
              className="btn btn-secondary"
              onClick={handleClearChat}
              title="Limpar mensagens e reiniciar a conversa para este tenant"
              style={{ padding: "0.4rem 0.8rem", fontSize: "0.8rem", display: "flex", alignItems: "center", gap: "0.4rem" }}
            >
              🗑️ Limpar Conversa
            </button>
            <button
              className="btn btn-secondary"
              onClick={() => {
                setTestFeedback(null);
                setConfigModalOpen(true);
              }}
              style={{ padding: "0.4rem 0.8rem", fontSize: "0.8rem", display: "flex", alignItems: "center", gap: "0.4rem" }}
            >
              ⚙️ Configurar Modelo / Chave de API
            </button>
          </div>
        </div>

        {/* Chat Messages List */}
        <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: "1rem", marginBottom: "1rem", paddingRight: "0.5rem" }}>
          {messages.map((msg) => {
            const isUser = msg.sender === "user";
            return (
              <div
                key={msg.id}
                style={{
                  alignSelf: isUser ? "flex-end" : "flex-start",
                  maxWidth: "80%",
                  background: isUser
                    ? "linear-gradient(135deg, #4f46e5 0%, #2563eb 100%)"
                    : "var(--bg-card, rgba(30, 41, 59, 0.85))",
                  border: isUser ? "none" : "1px solid var(--border-subtle, rgba(255, 255, 255, 0.12))",
                  color: isUser ? "#ffffff" : "var(--text-primary, #0f172a)",
                  padding: "1rem 1.35rem",
                  borderRadius: isUser ? "16px 16px 2px 16px" : "16px 16px 16px 2px",
                  fontSize: "0.92rem",
                  lineHeight: "1.6",
                  boxShadow: "0 4px 12px rgba(0, 0, 0, 0.08)",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: "0.45rem",
                    fontSize: "0.78rem",
                    fontWeight: 600,
                    color: isUser ? "rgba(255, 255, 255, 0.85)" : "var(--accent-indigo, #6366f1)",
                  }}
                >
                  <span>{isUser ? "👤 Você" : `🤖 InfraOps AI (${activeModel})`}</span>
                  <span style={{ fontSize: "0.72rem", opacity: 0.8, color: isUser ? "#ffffff" : "var(--text-muted, #64748b)" }}>
                    {msg.timestamp}
                  </span>
                </div>

                <div style={{ whiteSpace: "pre-wrap", color: isUser ? "#ffffff" : "var(--text-primary, #1e293b)" }}>
                  {msg.text}
                </div>

                {msg.toolCall && (
                  <div style={{ marginTop: "0.85rem", paddingTop: "0.85rem", borderTop: "1px solid rgba(148, 163, 184, 0.2)" }}>
                    <div style={{ fontSize: "0.75rem", color: "var(--accent-amber)", fontWeight: 700, marginBottom: "0.35rem", display: "flex", alignItems: "center", gap: "0.35rem" }}>
                      🛠️ PROPOSIÇÃO DE ACTION VALIDADA PELO POLICY ENGINE
                    </div>
                    <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.8rem", background: "rgba(0,0,0,0.08)", padding: "0.45rem 0.65rem", borderRadius: "6px", border: "1px solid var(--border-subtle)" }}>
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
            );
          })}

          {loading && (
            <div style={{ alignSelf: "flex-start", background: "var(--bg-card, rgba(30, 41, 59, 0.7))", border: "1px solid var(--border-subtle)", padding: "0.75rem 1.25rem", borderRadius: "12px", fontSize: "0.85rem", color: "var(--text-secondary)" }}>
              🤖 Consultando {activeModel} e avaliando políticas de infraestrutura...
            </div>
          )}
          <div ref={chatEndRef} />
        </div>

        {/* Input Bar */}
        <div style={{ display: "flex", gap: "0.75rem" }}>
          <input
            type="text"
            placeholder="Pergunte sobre seus servidores, peça diagnósticos ou solicite ações (Ex: 'gere um relatório do nó pve')..."
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            disabled={loading}
            style={{
              flex: 1,
              padding: "0.85rem 1.15rem",
              background: "var(--bg-card, #ffffff)",
              border: "1px solid var(--border-subtle, #cbd5e1)",
              color: "var(--text-primary, #0f172a)",
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
        <div
          className="modal-overlay"
          onClick={(e) => {
            if (e.target === e.currentTarget) setConfigModalOpen(false);
          }}
        >
          <div className="glass-panel modal-content" style={{ maxWidth: "620px", position: "relative" }}>
            <button
              type="button"
              onClick={() => setConfigModalOpen(false)}
              style={{
                position: "absolute",
                top: "1.25rem",
                right: "1.25rem",
                background: "none",
                border: "none",
                color: "var(--text-muted)",
                fontSize: "1.25rem",
                cursor: "pointer",
                padding: "0.2rem 0.5rem",
                lineHeight: 1,
              }}
              title="Fechar"
            >
              ✖
            </button>
            <h3 style={{ fontFamily: "var(--font-heading)", fontSize: "1.3rem", marginBottom: "0.5rem", paddingRight: "2rem" }}>
              ⚙️ Configurar Provedor de IA / Modelo de Linguagem (LLM)
            </h3>
            <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)", marginBottom: "1rem" }}>
              Escolha qual provedor de IA deseja utilizar no InfraOps AI. As chaves são armazenadas de forma independente por provedor.
            </p>

            {/* Visual Identification Banner: Active Key vs Pending */}
            <div
              style={{
                background: hasActiveKey ? "rgba(16, 185, 129, 0.1)" : "rgba(245, 158, 11, 0.1)",
                border: `1px solid ${hasActiveKey ? "rgba(16, 185, 129, 0.3)" : "rgba(245, 158, 11, 0.3)"}`,
                borderRadius: "8px",
                padding: "0.75rem 1rem",
                marginBottom: "1.25rem",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: "0.75rem",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
                <span style={{ fontSize: "1.3rem" }}>{hasActiveKey ? "🟢" : "⚠️"}</span>
                <div>
                  <div style={{ fontSize: "0.85rem", fontWeight: 700, color: hasActiveKey ? "var(--accent-emerald)" : "var(--accent-amber)" }}>
                    {hasActiveKey
                      ? `Chave Ativa: ${activeProv.toUpperCase()} (${activeModel})`
                      : `Chave de API Pendente para ${activeProv.toUpperCase()}`}
                  </div>
                  <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>
                    {hasActiveKey
                      ? activeProv === "ollama"
                        ? "Servidor Local conectado para inferência 100% privada."
                        : `Chave configurada: ${getMaskedKey(activeKey)} • Pronta para inferência.`
                      : `Insira sua chave de API abaixo para habilitar o provedor ${activeProv.toUpperCase()}.`}
                  </div>
                </div>
              </div>

              {hasActiveKey && (
                <span className="badge badge-online" style={{ fontSize: "0.7rem", padding: "0.2rem 0.5rem", whiteSpace: "nowrap" }}>
                  ✓ ATIVO
                </span>
              )}
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                setConfigModalOpen(false);
              }}
            >
              {/* Provider Selection */}
              <div style={{ marginBottom: "1rem" }}>
                <label style={{ display: "block", fontSize: "0.85rem", color: "var(--text-secondary)", marginBottom: "0.35rem" }}>
                  Provedor de IA
                </label>
                <select
                  value={activeProv}
                  onChange={(e) => {
                    const newProv = e.target.value;
                    setAiSettings((prev) => ({
                      ...prev,
                      activeProvider: newProv,
                    }));
                    setTestFeedback(null);
                  }}
                  style={{ width: "100%", padding: "0.6rem", background: "rgba(0,0,0,0.3)", border: "1px solid var(--border-subtle)", color: "#fff", borderRadius: "6px" }}
                >
                  <option value="groq">
                    ⚡ GroqCloud (Inferência Ultra-Rápida LPU - Llama 3.3 70B, DeepSeek R1) {aiSettings.keys.groq ? "🟢" : "⚪"}
                  </option>
                  <option value="openai">
                    🟣 OpenAI (ChatGPT - GPT-4o, o3-mini) {aiSettings.keys.openai ? "🟢" : "⚪"}
                  </option>
                  <option value="gemini">
                    🔵 Google Gemini (Gemini 1.5 Pro, 2.0 Flash) {aiSettings.keys.gemini ? "🟢" : "⚪"}
                  </option>
                  <option value="anthropic">
                    🟠 Anthropic (Claude 3.5 Sonnet) {aiSettings.keys.anthropic ? "🟢" : "⚪"}
                  </option>
                  <option value="deepseek">
                    ⚡ DeepSeek (DeepSeek R1 / V3) {aiSettings.keys.deepseek ? "🟢" : "⚪"}
                  </option>
                  <option value="ollama">
                    🦙 Ollama / Local LLM (100% On-Premise / Privado) 🟢
                  </option>
                </select>
              </div>

              {/* Model Selection with Visual Active Indicators */}
              <div style={{ marginBottom: "1rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.35rem" }}>
                  <label style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>
                    Modelo de LLM
                  </label>
                  {activeProv === "groq" && (
                    <div style={{ display: "flex", gap: "0.35rem", flexWrap: "wrap" }}>
                      <button
                        type="button"
                        onClick={() => {
                          setAiSettings((prev) => ({
                            ...prev,
                            models: { ...prev.models, groq: "llama-3.1-8b-instant" },
                          }));
                          setTestFeedback(null);
                        }}
                        style={{
                          fontSize: "0.7rem",
                          fontWeight: 600,
                          background: activeModel === "llama-3.1-8b-instant" ? "rgba(16, 185, 129, 0.25)" : "rgba(99, 102, 241, 0.15)",
                          color: activeModel === "llama-3.1-8b-instant" ? "var(--accent-emerald)" : "var(--accent-indigo)",
                          border: activeModel === "llama-3.1-8b-instant" ? "1px solid var(--accent-emerald)" : "1px solid transparent",
                          borderRadius: "4px",
                          padding: "0.2rem 0.45rem",
                          cursor: "pointer",
                        }}
                      >
                        {activeModel === "llama-3.1-8b-instant" ? "✓ ⚡ 8B Instant (Padrão)" : "⚡ 8B Instant"}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setAiSettings((prev) => ({
                            ...prev,
                            models: { ...prev.models, groq: "llama-3.3-70b-versatile" },
                          }));
                          setTestFeedback(null);
                        }}
                        style={{
                          fontSize: "0.7rem",
                          fontWeight: 600,
                          background: activeModel === "llama-3.3-70b-versatile" ? "rgba(16, 185, 129, 0.25)" : "rgba(99, 102, 241, 0.15)",
                          color: activeModel === "llama-3.3-70b-versatile" ? "var(--accent-emerald)" : "var(--accent-indigo)",
                          border: activeModel === "llama-3.3-70b-versatile" ? "1px solid var(--accent-emerald)" : "1px solid transparent",
                          borderRadius: "4px",
                          padding: "0.2rem 0.45rem",
                          cursor: "pointer",
                        }}
                      >
                        {activeModel === "llama-3.3-70b-versatile" ? "✓ Llama 3.3 70B" : "Llama 3.3 70B"}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setAiSettings((prev) => ({
                            ...prev,
                            models: { ...prev.models, groq: "llama-3.1-70b-versatile" },
                          }));
                          setTestFeedback(null);
                        }}
                        style={{
                          fontSize: "0.7rem",
                          fontWeight: 600,
                          background: activeModel === "llama-3.1-70b-versatile" ? "rgba(16, 185, 129, 0.25)" : "rgba(99, 102, 241, 0.15)",
                          color: activeModel === "llama-3.1-70b-versatile" ? "var(--accent-emerald)" : "var(--accent-indigo)",
                          border: activeModel === "llama-3.1-70b-versatile" ? "1px solid var(--accent-emerald)" : "1px solid transparent",
                          borderRadius: "4px",
                          padding: "0.2rem 0.45rem",
                          cursor: "pointer",
                        }}
                      >
                        {activeModel === "llama-3.1-70b-versatile" ? "✓ Llama 3.1 70B" : "Llama 3.1 70B"}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setAiSettings((prev) => ({
                            ...prev,
                            models: { ...prev.models, groq: "deepseek-r1-distill-llama-70b" },
                          }));
                          setTestFeedback(null);
                        }}
                        style={{
                          fontSize: "0.7rem",
                          fontWeight: 600,
                          background: activeModel === "deepseek-r1-distill-llama-70b" ? "rgba(16, 185, 129, 0.25)" : "rgba(99, 102, 241, 0.15)",
                          color: activeModel === "deepseek-r1-distill-llama-70b" ? "var(--accent-emerald)" : "var(--accent-indigo)",
                          border: activeModel === "deepseek-r1-distill-llama-70b" ? "1px solid var(--accent-emerald)" : "1px solid transparent",
                          borderRadius: "4px",
                          padding: "0.2rem 0.45rem",
                          cursor: "pointer",
                        }}
                      >
                        {activeModel === "deepseek-r1-distill-llama-70b" ? "✓ DeepSeek R1" : "DeepSeek R1"}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setAiSettings((prev) => ({
                            ...prev,
                            models: { ...prev.models, groq: "mixtral-8x7b-32768" },
                          }));
                          setTestFeedback(null);
                        }}
                        style={{
                          fontSize: "0.7rem",
                          fontWeight: 600,
                          background: activeModel === "mixtral-8x7b-32768" ? "rgba(16, 185, 129, 0.25)" : "rgba(99, 102, 241, 0.15)",
                          color: activeModel === "mixtral-8x7b-32768" ? "var(--accent-emerald)" : "var(--accent-indigo)",
                          border: activeModel === "mixtral-8x7b-32768" ? "1px solid var(--accent-emerald)" : "1px solid transparent",
                          borderRadius: "4px",
                          padding: "0.2rem 0.45rem",
                          cursor: "pointer",
                        }}
                      >
                        {activeModel === "mixtral-8x7b-32768" ? "✓ Mixtral 8x7B" : "Mixtral 8x7B"}
                      </button>
                    </div>
                  )}
                </div>
                <input
                  type="text"
                  required
                  placeholder={activeProv === "groq" ? "llama-3.3-70b-versatile" : "Ex: gpt-4o, gemini-1.5-pro"}
                  value={activeModel}
                  onChange={(e) => {
                    const newModel = e.target.value;
                    setAiSettings((prev) => ({
                      ...prev,
                      models: { ...prev.models, [activeProv]: newModel },
                    }));
                    setTestFeedback(null);
                  }}
                  style={{ width: "100%", padding: "0.6rem", background: "rgba(0,0,0,0.3)", border: "1px solid var(--border-subtle)", color: "#fff", borderRadius: "6px" }}
                />
              </div>

              {/* API Key Input - Specific to Active Provider */}
              {activeProv !== "ollama" ? (
                <div style={{ marginBottom: "1rem" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.35rem" }}>
                    <label style={{ fontSize: "0.85rem", color: "var(--text-secondary)", display: "flex", alignItems: "center", gap: "0.4rem" }}>
                      Chave de API para {activeProv.toUpperCase()}
                      {activeKey && activeKey.length > 0 ? (
                        <span style={{ fontSize: "0.7rem", color: "var(--accent-emerald)", fontWeight: 600 }}>
                          🟢 Configurada ({getMaskedKey(activeKey)})
                        </span>
                      ) : (
                        <span style={{ fontSize: "0.7rem", color: "var(--accent-amber)", fontWeight: 600 }}>
                          ⚠️ Não Informada
                        </span>
                      )}
                    </label>
                    {activeProv === "groq" && (
                      <a
                        href="https://console.groq.com/keys"
                        target="_blank"
                        rel="noreferrer"
                        style={{ fontSize: "0.75rem", color: "var(--accent-amber)", textDecoration: "underline" }}
                      >
                        Obter chave no GroqCloud ↗
                      </a>
                    )}
                  </div>
                  <input
                    type="password"
                    placeholder={
                      activeProv === "groq"
                        ? "gsk_..."
                        : activeProv === "openai"
                        ? "sk-proj-..."
                        : activeProv === "gemini"
                        ? "AIzaSy..."
                        : "Chave de API do provedor..."
                    }
                    value={activeKey}
                    onChange={(e) => {
                      const newKey = e.target.value;
                      setAiSettings((prev) => ({
                        ...prev,
                        keys: { ...prev.keys, [activeProv]: newKey },
                      }));
                      setTestFeedback(null);
                    }}
                    style={{
                      width: "100%",
                      padding: "0.6rem",
                      background: "rgba(0,0,0,0.3)",
                      border: activeKey ? "1px solid var(--accent-emerald)" : "1px solid var(--border-subtle)",
                      color: "#fff",
                      borderRadius: "6px",
                    }}
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
                    value={activeBaseUrl || "http://localhost:11434"}
                    onChange={(e) => {
                      const newUrl = e.target.value;
                      setAiSettings((prev) => ({
                        ...prev,
                        baseUrl: { ...prev.baseUrl, ollama: newUrl },
                      }));
                      setTestFeedback(null);
                    }}
                    style={{ width: "100%", padding: "0.6rem", background: "rgba(0,0,0,0.3)", border: "1px solid var(--border-subtle)", color: "#fff", borderRadius: "6px" }}
                  />
                </div>
              )}

              {/* Test Connection Feedback */}
              {testFeedback && (
                <div
                  style={{
                    marginBottom: "1rem",
                    padding: "0.6rem 0.85rem",
                    borderRadius: "6px",
                    fontSize: "0.8rem",
                    background: testFeedback.success ? "rgba(16, 185, 129, 0.15)" : "rgba(244, 63, 94, 0.15)",
                    border: `1px solid ${testFeedback.success ? "rgba(16, 185, 129, 0.3)" : "rgba(244, 63, 94, 0.3)"}`,
                    color: testFeedback.success ? "var(--accent-emerald)" : "var(--accent-rose)",
                  }}
                >
                  {testFeedback.success ? "✅ " : "❌ "}
                  {testFeedback.message}
                </div>
              )}

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "1.5rem", gap: "0.75rem" }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={handleTestApiConnection}
                  disabled={testingConnection || !hasActiveKey}
                  style={{ fontSize: "0.8rem", padding: "0.45rem 0.75rem" }}
                >
                  {testingConnection ? "🔄 Validando..." : `🧪 Testar Conexão (${activeProv.toUpperCase()})`}
                </button>

                <div style={{ display: "flex", gap: "0.75rem" }}>
                  <button type="button" className="btn btn-secondary" onClick={() => setConfigModalOpen(false)}>
                    Cancelar
                  </button>
                  <button type="submit" className="btn btn-primary">
                    Salvar Configurações de IA
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
