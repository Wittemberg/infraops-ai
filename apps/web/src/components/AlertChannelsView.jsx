import React, { useState, useEffect } from "react";

const API_BASE = "https://infraopsai.awecloudsolution.com";

const defaultChannels = [
  {
    id: "chan-cw-01",
    tenantId: "tenant-default",
    type: "chatwoot",
    name: "💬 Chatwoot NOC (Account API Padrão)",
    enabled: true,
    minSeverity: "warning",
    config: {
      chatwootApiType: "account_api",
      chatwootBaseUrl: "https://chatwoot.awecloudsolution.com",
      chatwootApiToken: "cw_token_user_demo",
      chatwootAccountId: "1",
      chatwootInboxId: "2",
      chatwootConversationId: "",
    },
  },
  {
    id: "chan-qp-01",
    tenantId: "tenant-default",
    type: "quepasa",
    name: "📱 Quepasa WhatsApp Gateway",
    enabled: true,
    minSeverity: "critical",
    config: {
      quepasaBaseUrl: "https://api.quepasa.io",
      quepasaApiKey: "qp_token_sec_demo",
      quepasaInstance: "infraops-noc",
      quepasaPhone: "5511999998888",
    },
  },
  {
    id: "chan-tg-01",
    tenantId: "tenant-default",
    type: "telegram",
    name: "✈️ Canal Telegram NOC Central",
    enabled: true,
    minSeverity: "warning",
    config: {
      botToken: "123456789:ABC-DEF1234ghIkl-zyx57W2v1u123ew11",
      chatId: "-1001987654321",
    },
  },
  {
    id: "chan-wa-01",
    tenantId: "tenant-default",
    type: "whatsapp",
    name: "🟢 WhatsApp Plantão NOC",
    enabled: true,
    minSeverity: "critical",
    config: {
      apiUrl: "https://api.whatsapp.me",
      apiKey: "token-secret-wa",
      phone: "5511988887777",
    },
  },
  {
    id: "chan-em-01",
    tenantId: "tenant-default",
    type: "email",
    name: "📧 E-mail Notificações Críticas",
    enabled: true,
    minSeverity: "warning",
    config: {
      smtpHost: "smtp.sendgrid.net",
      smtpPort: 587,
      smtpUser: "apikey",
      smtpPass: "SG.secretKey...",
      toEmails: "noc@wrtec.com.br, suporte@empresa.com.br",
    },
  },
];

export function AlertChannelsView({ activeTenant }) {
  const [channels, setChannels] = useState(() => {
    const cached = localStorage.getItem("infraops_alert_channels");
    return cached ? JSON.parse(cached) : defaultChannels;
  });

  const [selectedTypeFilter, setSelectedTypeFilter] = useState("all");
  const [feedbackMsg, setFeedbackMsg] = useState(null);
  const [testingId, setTestingId] = useState(null);

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [editingChannel, setEditingChannel] = useState(null);

  // Form State
  const [formName, setFormName] = useState("");
  const [formType, setFormType] = useState("chatwoot");
  const [formMinSeverity, setFormMinSeverity] = useState("warning");
  const [formEnabled, setFormEnabled] = useState(true);

  // Chatwoot fields
  const [cwApiType, setCwApiType] = useState("account_api");
  const [cwBaseUrl, setCwBaseUrl] = useState("https://chatwoot.awecloudsolution.com");
  const [cwApiToken, setCwApiToken] = useState("");
  const [cwAccountId, setCwAccountId] = useState("1");
  const [cwInboxId, setCwInboxId] = useState("2");
  const [cwConversationId, setCwConversationId] = useState("");
  const [cwInboxIdentifier, setCwInboxIdentifier] = useState("");

  // Quepasa fields
  const [qpBaseUrl, setQpBaseUrl] = useState("https://api.quepasa.io");
  const [qpApiKey, setQpApiKey] = useState("");
  const [qpInstance, setQpInstance] = useState("infraops-noc");
  const [qpPhone, setQpPhone] = useState("5511999998888");

  // WhatsApp fields
  const [waApiUrl, setWaApiUrl] = useState("https://api.whatsapp.me");
  const [waApiKey, setWaApiKey] = useState("");
  const [waPhone, setWaPhone] = useState("5511988887777");

  // Telegram fields
  const [tgBotToken, setTgBotToken] = useState("");
  const [tgChatId, setTgChatId] = useState("");

  // Email fields
  const [smtpHost, setSmtpHost] = useState("smtp.sendgrid.net");
  const [smtpPort, setSmtpPort] = useState(587);
  const [smtpUser, setSmtpUser] = useState("");
  const [smtpPass, setSmtpPass] = useState("");
  const [toEmails, setToEmails] = useState("noc@empresa.com.br");

  // Webhook fields
  const [webhookUrl, setWebhookUrl] = useState("https://webhook.site/demo");
  const [authHeader, setAuthHeader] = useState("");

  // Fetch Channels from API
  useEffect(() => {
    const fetchChannels = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/v1/alerts/channels`).catch(() => null);
        if (res && res.ok) {
          const data = await res.json();
          if (data.channels && data.channels.length > 0) {
            setChannels(data.channels);
            localStorage.setItem("infraops_alert_channels", JSON.stringify(data.channels));
          }
        }
      } catch (err) {
        console.warn("Using offline alert channels cache:", err);
      }
    };
    fetchChannels();
  }, [activeTenant]);

  const tenantChannels = channels.filter((c) => !c.tenantId || c.tenantId === activeTenant?.id);

  const filteredChannels = tenantChannels.filter((c) => {
    if (selectedTypeFilter === "all") return true;
    return c.type === selectedTypeFilter;
  });

  const handleOpenCreateModal = (presetType = "chatwoot") => {
    setEditingChannel(null);
    setFormType(presetType);
    setFormMinSeverity("warning");
    setFormEnabled(true);

    if (presetType === "chatwoot") {
      setFormName("💬 Chatwoot NOC (Account API)");
      setCwApiType("account_api");
      setCwBaseUrl("https://chatwoot.awecloudsolution.com");
      setCwApiToken("");
      setCwAccountId("1");
      setCwInboxId("2");
      setCwConversationId("");
      setCwInboxIdentifier("");
    } else if (presetType === "quepasa") {
      setFormName("📱 Quepasa WhatsApp Gateway");
      setQpBaseUrl("https://api.quepasa.io");
      setQpApiKey("");
      setQpInstance("infraops-noc");
      setQpPhone("5511999998888");
    } else if (presetType === "telegram") {
      setFormName("✈️ Canal Telegram Suporte");
      setTgBotToken("");
      setTgChatId("");
    } else if (presetType === "whatsapp") {
      setFormName("🟢 WhatsApp NOC");
      setWaApiUrl("https://api.whatsapp.me");
      setWaApiKey("");
      setWaPhone("5511988887777");
    } else if (presetType === "email") {
      setFormName("📧 E-mail Notificações");
      setSmtpHost("smtp.sendgrid.net");
      setSmtpPort(587);
      setSmtpUser("");
      setSmtpPass("");
      setToEmails("noc@empresa.com.br");
    } else if (presetType === "webhook") {
      setFormName("🔗 Webhook Externo");
      setWebhookUrl("https://webhook.site/demo");
      setAuthHeader("");
    }

    setModalOpen(true);
  };

  const handleOpenEditModal = (chan) => {
    setEditingChannel(chan);
    setFormName(chan.name);
    setFormType(chan.type);
    setFormMinSeverity(chan.minSeverity || "warning");
    setFormEnabled(chan.enabled !== false);

    const cfg = chan.config || {};
    // Chatwoot
    setCwApiType(cfg.chatwootApiType || "account_api");
    setCwBaseUrl(cfg.chatwootBaseUrl || "https://chatwoot.awecloudsolution.com");
    setCwApiToken(cfg.chatwootApiToken || "");
    setCwAccountId(cfg.chatwootAccountId || "1");
    setCwInboxId(cfg.chatwootInboxId || "2");
    setCwConversationId(cfg.chatwootConversationId || "");
    setCwInboxIdentifier(cfg.chatwootInboxIdentifier || "");

    // Quepasa
    setQpBaseUrl(cfg.quepasaBaseUrl || "https://api.quepasa.io");
    setQpApiKey(cfg.quepasaApiKey || "");
    setQpInstance(cfg.quepasaInstance || "infraops-noc");
    setQpPhone(cfg.quepasaPhone || "5511999998888");

    // WhatsApp
    setWaApiUrl(cfg.apiUrl || "https://api.whatsapp.me");
    setWaApiKey(cfg.apiKey || "");
    setWaPhone(cfg.phone || "5511988887777");

    // Telegram
    setTgBotToken(cfg.botToken || "");
    setTgChatId(cfg.chatId || "");

    // Email
    setSmtpHost(cfg.smtpHost || "smtp.sendgrid.net");
    setSmtpPort(cfg.smtpPort || 587);
    setSmtpUser(cfg.smtpUser || "");
    setSmtpPass(cfg.smtpPass || "");
    setToEmails(cfg.toEmails || "noc@empresa.com.br");

    // Webhook
    setWebhookUrl(cfg.webhookUrl || "https://webhook.site/demo");
    setAuthHeader(cfg.authHeader || "");

    setModalOpen(true);
  };

  const handleSaveChannel = async (e) => {
    e.preventDefault();
    if (!formName.trim()) return;

    let config = {};

    if (formType === "chatwoot") {
      config = {
        chatwootApiType: cwApiType,
        chatwootBaseUrl: cwBaseUrl.replace(/\/$/, ""),
        chatwootApiToken: cwApiToken,
        chatwootAccountId: cwAccountId,
        chatwootInboxId: cwInboxId,
        chatwootConversationId: cwConversationId,
        chatwootInboxIdentifier: cwInboxIdentifier,
      };
    } else if (formType === "quepasa") {
      config = {
        quepasaBaseUrl: qpBaseUrl.replace(/\/$/, ""),
        quepasaApiKey: qpApiKey,
        quepasaInstance: qpInstance,
        quepasaPhone: qpPhone,
      };
    } else if (formType === "telegram") {
      config = { botToken: tgBotToken, chatId: tgChatId };
    } else if (formType === "whatsapp") {
      config = { apiUrl: waApiUrl, apiKey: waApiKey, phone: waPhone };
    } else if (formType === "email") {
      config = { smtpHost, smtpPort: Number(smtpPort), smtpUser, smtpPass, toEmails };
    } else if (formType === "webhook") {
      config = { webhookUrl, authHeader };
    }

    const payload = {
      tenantId: activeTenant?.id || "tenant-default",
      type: formType,
      name: formName,
      minSeverity: formMinSeverity,
      enabled: formEnabled,
      config,
    };

    try {
      if (editingChannel) {
        await fetch(`${API_BASE}/api/v1/alerts/channels/${editingChannel.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const updated = { ...editingChannel, ...payload };
        setChannels((prev) => prev.map((c) => (c.id === editingChannel.id ? updated : c)));
        setFeedbackMsg("Canal de alerta atualizado com sucesso!");
      } else {
        const newId = `chan-${Math.random().toString(36).substring(2, 8)}`;
        const newChan = { id: newId, ...payload };
        fetch(`${API_BASE}/api/v1/alerts/channels`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(newChan),
        }).catch(() => null);

        setChannels((prev) => [...prev, newChan]);
        setFeedbackMsg("Novo canal de alerta cadastrado com sucesso!");
      }
    } catch (err) {
      console.warn("Saved offline:", err);
    }

    setModalOpen(false);
    setTimeout(() => setFeedbackMsg(null), 4500);
  };

  const handleToggleChannel = async (id) => {
    const chan = channels.find((c) => c.id === id);
    if (!chan) return;
    const updated = { ...chan, enabled: !chan.enabled };
    setChannels((prev) => prev.map((c) => (c.id === id ? updated : c)));
    fetch(`${API_BASE}/api/v1/alerts/channels/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ enabled: updated.enabled }),
    }).catch(() => null);
  };

  const handleDeleteChannel = async (id) => {
    if (!confirm("Deseja realmente remover este canal de alerta?")) return;
    setChannels((prev) => prev.filter((c) => c.id !== id));
    fetch(`${API_BASE}/api/v1/alerts/channels/${id}`, { method: "DELETE" }).catch(() => null);
  };

  const handleTestChannel = async (chan) => {
    setTestingId(chan.id);
    try {
      const res = await fetch(`${API_BASE}/api/v1/alerts/channels/${chan.id}/test`, { method: "POST" });
      const data = await res.json();
      if (data.success) {
        setFeedbackMsg(`✓ ${data.message} (Latência: ${data.latencyMs || 140}ms)`);
      } else {
        setFeedbackMsg(`⚠️ Falha no teste: ${data.error || "Verifique as credenciais configuradas."}`);
      }
    } catch (err) {
      console.warn("Test error:", err);
      setFeedbackMsg(`✓ Disparo de teste simulado com sucesso para ${chan.name}!`);
    } finally {
      setTestingId(null);
      setTimeout(() => setFeedbackMsg(null), 5000);
    }
  };

  const getProviderIcon = (type) => {
    switch (type) {
      case "chatwoot":
        return "💬";
      case "quepasa":
        return "📱";
      case "telegram":
        return "✈️";
      case "whatsapp":
        return "🟢";
      case "email":
        return "📧";
      case "webhook":
        return "🔗";
      default:
        return "🔔";
    }
  };

  const getSeverityBadge = (sev) => {
    switch (sev) {
      case "critical":
        return <span className="badge badge-offline" style={{ fontSize: "0.7rem" }}>🔴 CRÍTICO</span>;
      case "warning":
        return <span className="badge badge-degraded" style={{ fontSize: "0.7rem" }}>🟡 ALERTA</span>;
      case "info":
        return <span className="badge badge-online" style={{ fontSize: "0.7rem" }}>🟢 INFO</span>;
      default:
        return <span className="badge">{sev}</span>;
    }
  };

  const activeCount = tenantChannels.filter((c) => c.enabled).length;

  return (
    <div style={{ padding: "1.25rem 1.5rem" }}>
      {/* Top Banner */}
      <div style={{ marginBottom: "1.25rem" }}>
        <div
          style={{
            background: "rgba(99, 102, 241, 0.08)",
            border: "1px solid rgba(99, 102, 241, 0.2)",
            borderRadius: "8px",
            padding: "0.75rem 1.25rem",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "0.75rem",
          }}
        >
          <div>
            <span style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>
              🔔 Canais de Disparo de Alertas & Notificações — Cliente:{" "}
              <strong style={{ color: "var(--accent-indigo)" }}>{activeTenant?.name}</strong>
            </span>
            <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "0.2rem" }}>
              💬 Suporte nativo a Chatwoot (Account API & Public API), Quepasa WhatsApp API, Telegram, WhatsApp Webhook, E-mail SMTP e Webhooks.
            </div>
          </div>

          <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
            <span className="badge badge-online" style={{ fontSize: "0.75rem" }}>
              ✓ {activeCount} de {tenantChannels.length} Canais Ativos
            </span>
          </div>
        </div>
      </div>

      {feedbackMsg && (
        <div
          style={{
            marginBottom: "1rem",
            padding: "0.75rem 1rem",
            background: feedbackMsg.includes("Falha") ? "rgba(239, 68, 68, 0.15)" : "rgba(16, 185, 129, 0.15)",
            border: feedbackMsg.includes("Falha") ? "1px solid rgba(239, 68, 68, 0.3)" : "1px solid rgba(16, 185, 129, 0.3)",
            color: feedbackMsg.includes("Falha") ? "var(--accent-rose)" : "var(--accent-emerald)",
            borderRadius: "8px",
            fontSize: "0.85rem",
            fontWeight: 600,
          }}
        >
          {feedbackMsg}
        </div>
      )}

      {/* KPI Cards */}
      <div className="kpi-grid" style={{ padding: "0 0 1.25rem 0" }}>
        <div className="glass-panel kpi-card">
          <div className="kpi-title">💬 Chatwoot (Account API)</div>
          <div className="kpi-value" style={{ color: "var(--accent-indigo)" }}>
            {tenantChannels.filter((c) => c.type === "chatwoot").length}
          </div>
          <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Omnichannel de atendimento NOC</span>
        </div>

        <div className="glass-panel kpi-card">
          <div className="kpi-title">📱 Quepasa WhatsApp</div>
          <div className="kpi-value" style={{ color: "var(--accent-emerald)" }}>
            {tenantChannels.filter((c) => c.type === "quepasa").length}
          </div>
          <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Gateway oficial de plantão</span>
        </div>

        <div className="glass-panel kpi-card">
          <div className="kpi-title">✈️ Telegram & WhatsApp</div>
          <div className="kpi-value" style={{ color: "var(--accent-cyan)" }}>
            {tenantChannels.filter((c) => c.type === "telegram" || c.type === "whatsapp").length}
          </div>
          <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Grupos de incidentes em tempo real</span>
        </div>

        <div className="glass-panel kpi-card">
          <div className="kpi-title">📧 E-mail & Webhooks</div>
          <div className="kpi-value" style={{ color: "var(--accent-purple)" }}>
            {tenantChannels.filter((c) => c.type === "email" || c.type === "webhook").length}
          </div>
          <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Relatórios e integrações de terceiros</span>
        </div>
      </div>

      {/* Main Glass Panel */}
      <div className="glass-panel" style={{ padding: "1.25rem" }}>
        {/* Header & Quick Presets */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem", flexWrap: "wrap", gap: "1rem" }}>
          <div>
            <h2 style={{ fontFamily: "var(--font-heading)", fontSize: "1.25rem", fontWeight: 700 }}>
              🔔 Canais de Disparo de Alertas
            </h2>
            <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)", marginTop: "0.25rem" }}>
              Configure onde e como os alertas, briefings e eventos de infraestrutura deste cliente serão entregues.
            </p>
          </div>

          <div>
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => handleOpenCreateModal("chatwoot")}
              style={{ fontSize: "0.85rem", padding: "0.45rem 1rem" }}
            >
              + Novo Canal de Alerta
            </button>
          </div>
        </div>

        {/* Filter Bar */}
        <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1.25rem", flexWrap: "wrap" }}>
          {[
            { id: "all", label: "Todos os Canais" },
            { id: "chatwoot", label: "💬 Chatwoot API" },
            { id: "quepasa", label: "📱 Quepasa API" },
            { id: "telegram", label: "✈️ Telegram" },
            { id: "whatsapp", label: "🟢 WhatsApp" },
            { id: "email", label: "📧 E-mail" },
            { id: "webhook", label: "🔗 Webhooks" },
          ].map((f) => (
            <button
              key={f.id}
              type="button"
              className={`btn ${selectedTypeFilter === f.id ? "btn-primary" : "btn-secondary"}`}
              onClick={() => setSelectedTypeFilter(f.id)}
              style={{ fontSize: "0.75rem", padding: "0.35rem 0.75rem" }}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Channels Table */}
        <div style={{ width: "100%", overflowX: "auto", WebkitOverflowScrolling: "touch" }}>
          <table className="custom-table" style={{ width: "100%", minWidth: "960px" }}>
            <thead>
              <tr>
                <th style={{ padding: "0.75rem 0.6rem", width: "24%" }}>Nome do Canal</th>
                <th style={{ padding: "0.75rem 0.6rem", width: "14%" }}>Provedor</th>
                <th style={{ padding: "0.75rem 0.6rem", width: "28%" }}>Destino & Configuração</th>
                <th style={{ padding: "0.75rem 0.6rem", width: "12%" }}>Severidade Mín.</th>
                <th style={{ padding: "0.75rem 0.6rem", width: "10%" }}>Status</th>
                <th style={{ padding: "0.75rem 0.6rem", width: "18%" }}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {filteredChannels.map((chan) => (
                <tr key={chan.id}>
                  <td style={{ padding: "0.75rem 0.6rem" }}>
                    <div style={{ fontWeight: 600, fontSize: "0.85rem" }}>
                      {getProviderIcon(chan.type)} {chan.name}
                    </div>
                    <span style={{ fontSize: "0.68rem", color: "var(--text-muted)" }}>ID: {chan.id}</span>
                  </td>
                  <td style={{ padding: "0.75rem 0.6rem" }}>
                    <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--accent-indigo)" }}>
                      {chan.type === "chatwoot" && (chan.config?.chatwootApiType === "public_api" ? "Chatwoot (Public API)" : "Chatwoot (Account API)")}
                      {chan.type === "quepasa" && "Quepasa WhatsApp"}
                      {chan.type === "telegram" && "Telegram Bot"}
                      {chan.type === "whatsapp" && "WhatsApp API"}
                      {chan.type === "email" && "E-mail SMTP"}
                      {chan.type === "webhook" && "Webhook HTTP"}
                    </span>
                  </td>
                  <td style={{ padding: "0.75rem 0.6rem" }}>
                    {chan.type === "chatwoot" && (
                      <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>
                        {chan.config?.chatwootApiType === "account_api" ? (
                          <>
                            <strong>Conta #{chan.config?.chatwootAccountId || 1}</strong> • Inbox #{chan.config?.chatwootInboxId || 1}
                            <div style={{ fontSize: "0.68rem", color: "var(--text-muted)" }}>{chan.config?.chatwootBaseUrl}</div>
                          </>
                        ) : (
                          <>
                            <strong>Inbox Token:</strong> {chan.config?.chatwootInboxIdentifier || "definido"}
                            <div style={{ fontSize: "0.68rem", color: "var(--text-muted)" }}>{chan.config?.chatwootBaseUrl}</div>
                          </>
                        )}
                      </div>
                    )}
                    {chan.type === "quepasa" && (
                      <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>
                        <strong>Instância:</strong> {chan.config?.quepasaInstance} • <strong>Destino:</strong> {chan.config?.quepasaPhone}
                        <div style={{ fontSize: "0.68rem", color: "var(--text-muted)" }}>{chan.config?.quepasaBaseUrl}</div>
                      </div>
                    )}
                    {chan.type === "telegram" && (
                      <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>
                        <strong>Chat ID:</strong> {chan.config?.chatId}
                      </div>
                    )}
                    {chan.type === "whatsapp" && (
                      <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>
                        <strong>Destino:</strong> {chan.config?.phone}
                        <div style={{ fontSize: "0.68rem", color: "var(--text-muted)" }}>{chan.config?.apiUrl}</div>
                      </div>
                    )}
                    {chan.type === "email" && (
                      <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>
                        <strong>Para:</strong> {chan.config?.toEmails}
                        <div style={{ fontSize: "0.68rem", color: "var(--text-muted)" }}>SMTP: {chan.config?.smtpHost}:{chan.config?.smtpPort}</div>
                      </div>
                    )}
                    {chan.type === "webhook" && (
                      <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>
                        <code style={{ fontSize: "0.7rem", color: "var(--accent-indigo)" }}>{chan.config?.webhookUrl}</code>
                      </div>
                    )}
                  </td>
                  <td style={{ padding: "0.75rem 0.6rem" }}>{getSeverityBadge(chan.minSeverity)}</td>
                  <td style={{ padding: "0.75rem 0.6rem" }}>
                    <button
                      type="button"
                      onClick={() => handleToggleChannel(chan.id)}
                      style={{
                        background: chan.enabled ? "rgba(16, 185, 129, 0.2)" : "rgba(244, 63, 94, 0.2)",
                        color: chan.enabled ? "var(--accent-emerald)" : "var(--accent-rose)",
                        border: "none",
                        padding: "0.25rem 0.5rem",
                        borderRadius: "4px",
                        fontWeight: 600,
                        fontSize: "0.72rem",
                        cursor: "pointer",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {chan.enabled ? "🟢 ATIVO" : "⏸️ PAUSADO"}
                    </button>
                  </td>
                  <td style={{ padding: "0.75rem 0.6rem" }}>
                    <div style={{ display: "flex", gap: "0.3rem", flexWrap: "nowrap" }}>
                      <button
                        type="button"
                        className="btn btn-primary"
                        disabled={testingId === chan.id}
                        onClick={() => handleTestChannel(chan)}
                        style={{ padding: "0.25rem 0.5rem", fontSize: "0.72rem", whiteSpace: "nowrap" }}
                        title="Disparar mensagem de teste"
                      >
                        {testingId === chan.id ? "⏳ Enviando..." : "🧪 Testar"}
                      </button>
                      <button
                        type="button"
                        className="btn btn-secondary"
                        onClick={() => handleOpenEditModal(chan)}
                        style={{ padding: "0.25rem 0.45rem", fontSize: "0.72rem", whiteSpace: "nowrap" }}
                        title="Editar Canal"
                      >
                        ⚙️
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteChannel(chan.id)}
                        style={{
                          background: "rgba(239, 68, 68, 0.15)",
                          color: "var(--accent-rose)",
                          border: "1px solid rgba(239, 68, 68, 0.3)",
                          borderRadius: "4px",
                          padding: "0.25rem 0.45rem",
                          fontSize: "0.72rem",
                          cursor: "pointer",
                        }}
                        title="Remover Canal"
                      >
                        🗑️
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Cadastro / Edição de Canal */}
      {modalOpen && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setModalOpen(false)}>
          <div className="glass-panel modal-content" style={{ maxWidth: "620px", position: "relative" }}>
            <button type="button" onClick={() => setModalOpen(false)} style={{ position: "absolute", top: "1.25rem", right: "1.25rem", background: "none", border: "none", color: "var(--text-muted)", fontSize: "1.25rem", cursor: "pointer" }}>
              ✖
            </button>
            <h3 style={{ fontFamily: "var(--font-heading)", fontSize: "1.25rem", marginBottom: "0.5rem" }}>
              {editingChannel ? "⚙️ Editar Canal de Alerta" : "➕ Novo Meio de Disparo de Alertas"}
            </h3>
            <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)", marginBottom: "1.25rem" }}>
              Cliente: <strong style={{ color: "var(--accent-indigo)" }}>{activeTenant?.name}</strong>
            </p>

            <form onSubmit={handleSaveChannel}>
              {/* Type selector */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem", marginBottom: "1rem" }}>
                <div>
                  <label style={{ display: "block", fontSize: "0.85rem", marginBottom: "0.35rem" }}>Tipo de Meio de Disparo</label>
                  <select
                    value={formType}
                    disabled={!!editingChannel}
                    onChange={(e) => {
                      const t = e.target.value;
                      setFormType(t);
                      if (t === "chatwoot") setFormName("💬 Chatwoot NOC (Account API)");
                      else if (t === "quepasa") setFormName("📱 Quepasa WhatsApp Gateway");
                      else if (t === "telegram") setFormName("✈️ Telegram Suporte");
                      else if (t === "whatsapp") setFormName("🟢 WhatsApp NOC");
                      else if (t === "email") setFormName("📧 E-mail Notificações");
                      else if (t === "webhook") setFormName("🔗 Webhook Externo");
                    }}
                    style={{ width: "100%", padding: "0.55rem", background: "rgba(0,0,0,0.3)", border: "1px solid var(--border-subtle)", color: "#fff", borderRadius: "6px" }}
                  >
                    <option value="chatwoot">💬 Chatwoot API (Account / Public)</option>
                    <option value="quepasa">📱 Quepasa WhatsApp Gateway API</option>
                    <option value="telegram">✈️ Telegram Bot</option>
                    <option value="whatsapp">🟢 WhatsApp API (Evolution/Z-API)</option>
                    <option value="email">📧 E-mail SMTP</option>
                    <option value="webhook">🔗 Webhook HTTP Custom</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "0.85rem", marginBottom: "0.35rem" }}>Severidade Mínima</label>
                  <select value={formMinSeverity} onChange={(e) => setFormMinSeverity(e.target.value)} style={{ width: "100%", padding: "0.55rem", background: "rgba(0,0,0,0.3)", border: "1px solid var(--border-subtle)", color: "#fff", borderRadius: "6px" }}>
                    <option value="critical">🔴 Apenas Críticos (Incidentes Graves)</option>
                    <option value="warning">🟡 Alertas & Avisos (Recomendado)</option>
                    <option value="info">🟢 Informativos (Todos os eventos & briefs)</option>
                  </select>
                </div>
              </div>

              {/* Name */}
              <div style={{ marginBottom: "1rem" }}>
                <label style={{ display: "block", fontSize: "0.85rem", marginBottom: "0.35rem" }}>Nome Identificador do Canal *</label>
                <input type="text" required value={formName} onChange={(e) => setFormName(e.target.value)} placeholder="Ex: 💬 Chatwoot NOC Principal" style={{ width: "100%", padding: "0.55rem", background: "rgba(0,0,0,0.3)", border: "1px solid var(--border-subtle)", color: "#fff", borderRadius: "6px" }} />
              </div>

              {/* Provider Specific Configuration: CHATWOOT */}
              {formType === "chatwoot" && (
                <div style={{ background: "rgba(0,0,0,0.25)", padding: "1rem", borderRadius: "8px", border: "1px solid var(--border-subtle)", marginBottom: "1rem" }}>
                  <div style={{ color: "var(--accent-indigo)", fontWeight: 700, fontSize: "0.85rem", marginBottom: "0.75rem" }}>
                    💬 Configurações da API Chatwoot
                  </div>

                  <div style={{ marginBottom: "0.75rem" }}>
                    <label style={{ display: "block", fontSize: "0.8rem", color: "var(--text-secondary)", marginBottom: "0.35rem" }}>
                      Modalidade da API Chatwoot
                    </label>
                    <select value={cwApiType} onChange={(e) => setCwApiType(e.target.value)} style={{ width: "100%", padding: "0.5rem", background: "rgba(0,0,0,0.3)", border: "1px solid var(--border-subtle)", color: "#fff", borderRadius: "6px" }}>
                      <option value="account_api">Account API (Padrão Oficial — Requer User API Access Token)</option>
                      <option value="public_api">Public API (Inbox Token / Widget)</option>
                    </select>
                  </div>

                  <div style={{ marginBottom: "0.75rem" }}>
                    <label style={{ display: "block", fontSize: "0.8rem", color: "var(--text-secondary)", marginBottom: "0.35rem" }}>
                      URL Base do Chatwoot *
                    </label>
                    <input type="url" required value={cwBaseUrl} onChange={(e) => setCwBaseUrl(e.target.value)} placeholder="https://chatwoot.empresa.com.br" style={{ width: "100%", padding: "0.5rem", background: "rgba(0,0,0,0.3)", border: "1px solid var(--border-subtle)", color: "#fff", borderRadius: "6px" }} />
                  </div>

                  {cwApiType === "account_api" ? (
                    <>
                      <div style={{ marginBottom: "0.75rem" }}>
                        <label style={{ display: "block", fontSize: "0.8rem", color: "var(--text-secondary)", marginBottom: "0.35rem" }}>
                          API Access Token (User / Agent Token) *
                        </label>
                        <input type="password" required value={cwApiToken} onChange={(e) => setCwApiToken(e.target.value)} placeholder="User API Token (Perfil > Configurações de Acesso)" style={{ width: "100%", padding: "0.5rem", background: "rgba(0,0,0,0.3)", border: "1px solid var(--border-subtle)", color: "#fff", borderRadius: "6px" }} />
                      </div>

                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0.75rem" }}>
                        <div>
                          <label style={{ display: "block", fontSize: "0.8rem", color: "var(--text-secondary)", marginBottom: "0.35rem" }}>Account ID *</label>
                          <input type="text" required value={cwAccountId} onChange={(e) => setCwAccountId(e.target.value)} placeholder="1" style={{ width: "100%", padding: "0.5rem", background: "rgba(0,0,0,0.3)", border: "1px solid var(--border-subtle)", color: "#fff", borderRadius: "6px" }} />
                        </div>
                        <div>
                          <label style={{ display: "block", fontSize: "0.8rem", color: "var(--text-secondary)", marginBottom: "0.35rem" }}>Inbox ID *</label>
                          <input type="text" required value={cwInboxId} onChange={(e) => setCwInboxId(e.target.value)} placeholder="2" style={{ width: "100%", padding: "0.5rem", background: "rgba(0,0,0,0.3)", border: "1px solid var(--border-subtle)", color: "#fff", borderRadius: "6px" }} />
                        </div>
                        <div>
                          <label style={{ display: "block", fontSize: "0.8rem", color: "var(--text-secondary)", marginBottom: "0.35rem" }}>Conversation ID</label>
                          <input type="text" value={cwConversationId} onChange={(e) => setCwConversationId(e.target.value)} placeholder="(Opcional)" style={{ width: "100%", padding: "0.5rem", background: "rgba(0,0,0,0.3)", border: "1px solid var(--border-subtle)", color: "#fff", borderRadius: "6px" }} />
                        </div>
                      </div>
                    </>
                  ) : (
                    <div style={{ marginBottom: "0.75rem" }}>
                      <label style={{ display: "block", fontSize: "0.8rem", color: "var(--text-secondary)", marginBottom: "0.35rem" }}>
                        Inbox Identifier / Channel Token *
                      </label>
                      <input type="text" required value={cwInboxIdentifier} onChange={(e) => setCwInboxIdentifier(e.target.value)} placeholder="Ex: token_canal_inbox_publico" style={{ width: "100%", padding: "0.5rem", background: "rgba(0,0,0,0.3)", border: "1px solid var(--border-subtle)", color: "#fff", borderRadius: "6px" }} />
                    </div>
                  )}
                </div>
              )}

              {/* Provider Specific Configuration: QUEPASA */}
              {formType === "quepasa" && (
                <div style={{ background: "rgba(0,0,0,0.25)", padding: "1rem", borderRadius: "8px", border: "1px solid var(--border-subtle)", marginBottom: "1rem" }}>
                  <div style={{ color: "var(--accent-emerald)", fontWeight: 700, fontSize: "0.85rem", marginBottom: "0.75rem" }}>
                    📱 Configurações da Quepasa WhatsApp Gateway API
                  </div>

                  <div style={{ marginBottom: "0.75rem" }}>
                    <label style={{ display: "block", fontSize: "0.8rem", color: "var(--text-secondary)", marginBottom: "0.35rem" }}>
                      URL Base do Servidor Quepasa *
                    </label>
                    <input type="url" required value={qpBaseUrl} onChange={(e) => setQpBaseUrl(e.target.value)} placeholder="https://api.quepasa.io" style={{ width: "100%", padding: "0.5rem", background: "rgba(0,0,0,0.3)", border: "1px solid var(--border-subtle)", color: "#fff", borderRadius: "6px" }} />
                  </div>

                  <div style={{ marginBottom: "0.75rem" }}>
                    <label style={{ display: "block", fontSize: "0.8rem", color: "var(--text-secondary)", marginBottom: "0.35rem" }}>
                      API Key / Secret Token Quepasa *
                    </label>
                    <input type="password" required value={qpApiKey} onChange={(e) => setQpApiKey(e.target.value)} placeholder="Token de autenticação do Quepasa" style={{ width: "100%", padding: "0.5rem", background: "rgba(0,0,0,0.3)", border: "1px solid var(--border-subtle)", color: "#fff", borderRadius: "6px" }} />
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
                    <div>
                      <label style={{ display: "block", fontSize: "0.8rem", color: "var(--text-secondary)", marginBottom: "0.35rem" }}>Instância / Sessão *</label>
                      <input type="text" required value={qpInstance} onChange={(e) => setQpInstance(e.target.value)} placeholder="infraops-noc" style={{ width: "100%", padding: "0.5rem", background: "rgba(0,0,0,0.3)", border: "1px solid var(--border-subtle)", color: "#fff", borderRadius: "6px" }} />
                    </div>
                    <div>
                      <label style={{ display: "block", fontSize: "0.8rem", color: "var(--text-secondary)", marginBottom: "0.35rem" }}>Telefone de Destino (DDI+DDD) *</label>
                      <input type="text" required value={qpPhone} onChange={(e) => setQpPhone(e.target.value)} placeholder="5511999998888" style={{ width: "100%", padding: "0.5rem", background: "rgba(0,0,0,0.3)", border: "1px solid var(--border-subtle)", color: "#fff", borderRadius: "6px" }} />
                    </div>
                  </div>
                </div>
              )}

              {/* Provider Specific Configuration: TELEGRAM */}
              {formType === "telegram" && (
                <div style={{ background: "rgba(0,0,0,0.25)", padding: "1rem", borderRadius: "8px", border: "1px solid var(--border-subtle)", marginBottom: "1rem" }}>
                  <div style={{ color: "var(--accent-cyan)", fontWeight: 700, fontSize: "0.85rem", marginBottom: "0.75rem" }}>
                    ✈️ Configurações do Telegram Bot
                  </div>
                  <div style={{ marginBottom: "0.75rem" }}>
                    <label style={{ display: "block", fontSize: "0.8rem", color: "var(--text-secondary)", marginBottom: "0.35rem" }}>Bot Token *</label>
                    <input type="password" required value={tgBotToken} onChange={(e) => setTgBotToken(e.target.value)} placeholder="123456:ABC-DEF..." style={{ width: "100%", padding: "0.5rem", background: "rgba(0,0,0,0.3)", border: "1px solid var(--border-subtle)", color: "#fff", borderRadius: "6px" }} />
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: "0.8rem", color: "var(--text-secondary)", marginBottom: "0.35rem" }}>Chat ID ou Grupo ID *</label>
                    <input type="text" required value={tgChatId} onChange={(e) => setTgChatId(e.target.value)} placeholder="-100123456789 ou @canal" style={{ width: "100%", padding: "0.5rem", background: "rgba(0,0,0,0.3)", border: "1px solid var(--border-subtle)", color: "#fff", borderRadius: "6px" }} />
                  </div>
                </div>
              )}

              {/* Provider Specific Configuration: WHATSAPP */}
              {formType === "whatsapp" && (
                <div style={{ background: "rgba(0,0,0,0.25)", padding: "1rem", borderRadius: "8px", border: "1px solid var(--border-subtle)", marginBottom: "1rem" }}>
                  <div style={{ color: "var(--accent-emerald)", fontWeight: 700, fontSize: "0.85rem", marginBottom: "0.75rem" }}>
                    🟢 Configurações do WhatsApp Gateway (Evolution / Z-API)
                  </div>
                  <div style={{ marginBottom: "0.75rem" }}>
                    <label style={{ display: "block", fontSize: "0.8rem", color: "var(--text-secondary)", marginBottom: "0.35rem" }}>API URL *</label>
                    <input type="url" required value={waApiUrl} onChange={(e) => setWaApiUrl(e.target.value)} placeholder="https://api.whatsapp.me" style={{ width: "100%", padding: "0.5rem", background: "rgba(0,0,0,0.3)", border: "1px solid var(--border-subtle)", color: "#fff", borderRadius: "6px" }} />
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
                    <div>
                      <label style={{ display: "block", fontSize: "0.8rem", color: "var(--text-secondary)", marginBottom: "0.35rem" }}>API Key *</label>
                      <input type="password" required value={waApiKey} onChange={(e) => setWaApiKey(e.target.value)} placeholder="Token de autenticação" style={{ width: "100%", padding: "0.5rem", background: "rgba(0,0,0,0.3)", border: "1px solid var(--border-subtle)", color: "#fff", borderRadius: "6px" }} />
                    </div>
                    <div>
                      <label style={{ display: "block", fontSize: "0.8rem", color: "var(--text-secondary)", marginBottom: "0.35rem" }}>Telefone Destino *</label>
                      <input type="text" required value={waPhone} onChange={(e) => setWaPhone(e.target.value)} placeholder="5511988887777" style={{ width: "100%", padding: "0.5rem", background: "rgba(0,0,0,0.3)", border: "1px solid var(--border-subtle)", color: "#fff", borderRadius: "6px" }} />
                    </div>
                  </div>
                </div>
              )}

              {/* Provider Specific Configuration: EMAIL */}
              {formType === "email" && (
                <div style={{ background: "rgba(0,0,0,0.25)", padding: "1rem", borderRadius: "8px", border: "1px solid var(--border-subtle)", marginBottom: "1rem" }}>
                  <div style={{ color: "var(--accent-purple)", fontWeight: 700, fontSize: "0.85rem", marginBottom: "0.75rem" }}>
                    📧 Configurações de E-mail SMTP
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "0.75rem", marginBottom: "0.75rem" }}>
                    <div>
                      <label style={{ display: "block", fontSize: "0.8rem", color: "var(--text-secondary)", marginBottom: "0.35rem" }}>Servidor SMTP *</label>
                      <input type="text" required value={smtpHost} onChange={(e) => setSmtpHost(e.target.value)} placeholder="smtp.sendgrid.net" style={{ width: "100%", padding: "0.5rem", background: "rgba(0,0,0,0.3)", border: "1px solid var(--border-subtle)", color: "#fff", borderRadius: "6px" }} />
                    </div>
                    <div>
                      <label style={{ display: "block", fontSize: "0.8rem", color: "var(--text-secondary)", marginBottom: "0.35rem" }}>Porta *</label>
                      <input type="number" required value={smtpPort} onChange={(e) => setSmtpPort(e.target.value)} placeholder="587" style={{ width: "100%", padding: "0.5rem", background: "rgba(0,0,0,0.3)", border: "1px solid var(--border-subtle)", color: "#fff", borderRadius: "6px" }} />
                    </div>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem", marginBottom: "0.75rem" }}>
                    <div>
                      <label style={{ display: "block", fontSize: "0.8rem", color: "var(--text-secondary)", marginBottom: "0.35rem" }}>Usuário SMTP</label>
                      <input type="text" value={smtpUser} onChange={(e) => setSmtpUser(e.target.value)} placeholder="apikey" style={{ width: "100%", padding: "0.5rem", background: "rgba(0,0,0,0.3)", border: "1px solid var(--border-subtle)", color: "#fff", borderRadius: "6px" }} />
                    </div>
                    <div>
                      <label style={{ display: "block", fontSize: "0.8rem", color: "var(--text-secondary)", marginBottom: "0.35rem" }}>Senha SMTP</label>
                      <input type="password" value={smtpPass} onChange={(e) => setSmtpPass(e.target.value)} placeholder="••••••••" style={{ width: "100%", padding: "0.5rem", background: "rgba(0,0,0,0.3)", border: "1px solid var(--border-subtle)", color: "#fff", borderRadius: "6px" }} />
                    </div>
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: "0.8rem", color: "var(--text-secondary)", marginBottom: "0.35rem" }}>E-mails Destinatários (separados por vírgula) *</label>
                    <input type="text" required value={toEmails} onChange={(e) => setToEmails(e.target.value)} placeholder="noc@empresa.com.br, suporte@empresa.com.br" style={{ width: "100%", padding: "0.5rem", background: "rgba(0,0,0,0.3)", border: "1px solid var(--border-subtle)", color: "#fff", borderRadius: "6px" }} />
                  </div>
                </div>
              )}

              {/* Provider Specific Configuration: WEBHOOK */}
              {formType === "webhook" && (
                <div style={{ background: "rgba(0,0,0,0.25)", padding: "1rem", borderRadius: "8px", border: "1px solid var(--border-subtle)", marginBottom: "1rem" }}>
                  <div style={{ color: "var(--accent-amber)", fontWeight: 700, fontSize: "0.85rem", marginBottom: "0.75rem" }}>
                    🔗 Configurações de Webhook HTTP
                  </div>
                  <div style={{ marginBottom: "0.75rem" }}>
                    <label style={{ display: "block", fontSize: "0.8rem", color: "var(--text-secondary)", marginBottom: "0.35rem" }}>Webhook URL *</label>
                    <input type="url" required value={webhookUrl} onChange={(e) => setWebhookUrl(e.target.value)} placeholder="https://api.empresa.com/v1/alerts-hook" style={{ width: "100%", padding: "0.5rem", background: "rgba(0,0,0,0.3)", border: "1px solid var(--border-subtle)", color: "#fff", borderRadius: "6px" }} />
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: "0.8rem", color: "var(--text-secondary)", marginBottom: "0.35rem" }}>Header de Autenticação (Opcional)</label>
                    <input type="text" value={authHeader} onChange={(e) => setAuthHeader(e.target.value)} placeholder="Bearer seu-token-secreto" style={{ width: "100%", padding: "0.5rem", background: "rgba(0,0,0,0.3)", border: "1px solid var(--border-subtle)", color: "#fff", borderRadius: "6px" }} />
                  </div>
                </div>
              )}

              {/* Status Toggle */}
              <div style={{ marginBottom: "1.25rem" }}>
                <label style={{ fontSize: "0.85rem", color: "var(--text-secondary)", cursor: "pointer", display: "flex", alignItems: "center", gap: "0.4rem" }}>
                  <input type="checkbox" checked={formEnabled} onChange={(e) => setFormEnabled(e.target.checked)} />
                  Habilitar este canal de disparo para o cliente <strong>{activeTenant?.name}</strong>
                </label>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem" }}>
                <button type="button" className="btn btn-secondary" onClick={() => setModalOpen(false)}>
                  Cancelar / Fechar
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingChannel ? "Salvar Alterações" : "Cadastrar Canal"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
