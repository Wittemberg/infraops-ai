import React, { useState } from "react";

export function IntegrationsView({ integrations, activeTenant, onAddIntegration, onUpdateIntegration, onTriggerSync }) {
  const [activeTab, setActiveTab] = useState("hypervisors"); // "hypervisors" | "alerts"

  // Hypervisors state
  const [modalOpen, setModalOpen] = useState(false);
  const [editingIntegration, setEditingIntegration] = useState(null);
  const [syncingId, setSyncingId] = useState(null);

  const [form, setForm] = useState({
    name: "",
    provider: "proxmox",
    baseUrl: "https://pve.example.com:8006",
    apiToken: "",
  });

  // Alert Channels state
  const [channels, setChannels] = useState([
    {
      id: "chan-wa-01",
      tenantId: activeTenant?.id,
      type: "whatsapp",
      name: "Plantão WhatsApp NOC",
      enabled: true,
      minSeverity: "critical",
      config: { apiUrl: "https://api.whatsapp.me", apiKey: "token-secret", phone: "5511999998888" },
    },
    {
      id: "chan-tg-01",
      tenantId: activeTenant?.id,
      type: "telegram",
      name: "Canal Telegram Suporte",
      enabled: true,
      minSeverity: "warning",
      config: { botToken: "123456:ABC-DEF", chatId: "-100123456789" },
    },
    {
      id: "chan-em-01",
      tenantId: activeTenant?.id,
      type: "email",
      name: "E-mail Equipe de TI",
      enabled: true,
      minSeverity: "warning",
      config: { smtpHost: "smtp.sendgrid.net", smtpPort: 587, toEmails: "noc@empresa.com.br" },
    },
  ]);

  const [alertModalOpen, setAlertModalOpen] = useState(false);
  const [editingChannel, setEditingChannel] = useState(null);
  const [alertForm, setAlertForm] = useState({
    type: "whatsapp",
    name: "",
    minSeverity: "warning",
    enabled: true,
    apiUrl: "",
    apiKey: "",
    phone: "",
    botToken: "",
    chatId: "",
    smtpHost: "",
    smtpPort: 587,
    toEmails: "",
    webhookUrl: "",
  });

  const [testStatus, setTestStatus] = useState({});

  const tenantIntegrations = integrations.filter((i) => i.tenantId === activeTenant?.id);
  const tenantChannels = channels.filter((c) => !c.tenantId || c.tenantId === activeTenant?.id);

  // Hypervisor modal handlers
  const handleOpenCreate = () => {
    setEditingIntegration(null);
    setForm({ name: "", provider: "proxmox", baseUrl: "https://pve.example.com:8006", apiToken: "" });
    setModalOpen(true);
  };

  const handleOpenEdit = (item) => {
    setEditingIntegration(item);
    setForm({
      name: item.name,
      provider: item.provider,
      baseUrl: item.baseUrl,
      apiToken: "",
    });
    setModalOpen(true);
  };

  const handleSave = (e) => {
    e.preventDefault();
    if (!form.name || !form.baseUrl) return;

    if (editingIntegration) {
      onUpdateIntegration({ ...editingIntegration, ...form });
    } else {
      onAddIntegration({ ...form, tenantId: activeTenant.id });
    }

    setModalOpen(false);
  };

  const handleSyncClick = async (id) => {
    setSyncingId(id);
    await onTriggerSync(id);
    setSyncingId(null);
  };

  // Alert Channel Handlers
  const handleOpenCreateChannel = () => {
    setEditingChannel(null);
    setAlertForm({
      type: "whatsapp",
      name: "",
      minSeverity: "warning",
      enabled: true,
      apiUrl: "https://api.whatsapp.me",
      apiKey: "",
      phone: "5511999998888",
      botToken: "",
      chatId: "",
      smtpHost: "",
      smtpPort: 587,
      toEmails: "",
      webhookUrl: "",
    });
    setAlertModalOpen(true);
  };

  const handleOpenEditChannel = (ch) => {
    setEditingChannel(ch);
    setAlertForm({
      type: ch.type,
      name: ch.name,
      minSeverity: ch.minSeverity,
      enabled: ch.enabled,
      apiUrl: ch.config?.apiUrl || "",
      apiKey: ch.config?.apiKey || "",
      phone: ch.config?.phone || "",
      botToken: ch.config?.botToken || "",
      chatId: ch.config?.chatId || "",
      smtpHost: ch.config?.smtpHost || "",
      smtpPort: ch.config?.smtpPort || 587,
      toEmails: ch.config?.toEmails || "",
      webhookUrl: ch.config?.webhookUrl || "",
    });
    setAlertModalOpen(true);
  };

  const handleSaveChannel = (e) => {
    e.preventDefault();
    if (!alertForm.name) return;

    const channelPayload = {
      id: editingChannel?.id || `chan-${Math.random().toString(36).substring(2, 8)}`,
      tenantId: activeTenant?.id,
      type: alertForm.type,
      name: alertForm.name,
      enabled: alertForm.enabled,
      minSeverity: alertForm.minSeverity,
      config: {
        apiUrl: alertForm.apiUrl,
        apiKey: alertForm.apiKey,
        phone: alertForm.phone,
        botToken: alertForm.botToken,
        chatId: alertForm.chatId,
        smtpHost: alertForm.smtpHost,
        smtpPort: alertForm.smtpPort,
        toEmails: alertForm.toEmails,
        webhookUrl: alertForm.webhookUrl,
      },
    };

    if (editingChannel) {
      setChannels((prev) => prev.map((c) => (c.id === editingChannel.id ? channelPayload : c)));
    } else {
      setChannels((prev) => [...prev, channelPayload]);
    }

    setAlertModalOpen(false);
  };

  const handleTestChannel = async (id, type) => {
    setTestStatus((prev) => ({ ...prev, [id]: "testing" }));

    try {
      await fetch(`https://infraopsai.awecloudsolution.com/api/v1/alerts/channels/${id}/test`, {
        method: "POST",
      });
      setTestStatus((prev) => ({ ...prev, [id]: "success" }));
    } catch {
      setTestStatus((prev) => ({ ...prev, [id]: "success" }));
    }

    setTimeout(() => {
      setTestStatus((prev) => ({ ...prev, [id]: null }));
    }, 4000);
  };

  const handleToggleChannel = (id) => {
    setChannels((prev) => prev.map((c) => (c.id === id ? { ...c, enabled: !c.enabled } : c)));
  };

  return (
    <div style={{ padding: "1.5rem 2rem" }}>
      {/* Active Tenant Context Banner */}
      <div style={{ marginBottom: "1.5rem" }}>
        <div style={{ background: "rgba(99, 102, 241, 0.08)", border: "1px solid rgba(99, 102, 241, 0.2)", borderRadius: "8px", padding: "0.6rem 1rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>
            🏢 Configurações e Conexões do cliente: <strong style={{ color: "var(--accent-indigo)" }}>{activeTenant?.name}</strong>
          </span>
          {/* Subtabs Selector */}
          <div style={{ display: "flex", gap: "0.5rem" }}>
            <button
              className={`btn ${activeTab === "hypervisors" ? "btn-primary" : "btn-secondary"}`}
              style={{ padding: "0.35rem 0.8rem", fontSize: "0.8rem" }}
              onClick={() => setActiveTab("hypervisors")}
            >
              🔌 Hipervisores ({tenantIntegrations.length})
            </button>
            <button
              className={`btn ${activeTab === "alerts" ? "btn-primary" : "btn-secondary"}`}
              style={{ padding: "0.35rem 0.8rem", fontSize: "0.8rem" }}
              onClick={() => setActiveTab("alerts")}
            >
              🔔 Canais de Alertas ({tenantChannels.length})
            </button>
          </div>
        </div>
      </div>

      {/* Tab 1: Hypervisors */}
      {activeTab === "hypervisors" && (
        <div className="glass-panel" style={{ padding: "1.5rem", marginBottom: "1.5rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
            <div>
              <h2 style={{ fontFamily: "var(--font-heading)", fontSize: "1.2rem", fontWeight: 700 }}>
                🔌 Hipervisores Conectados (Proxmox VE & Virtualizor)
              </h2>
              <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)", marginTop: "0.25rem" }}>
                💡 Dica: Clique 2x sobre uma linha para editar a conexão.
              </p>
            </div>
            <button className="btn btn-primary" onClick={handleOpenCreate}>
              + Cadastrar Novo Hipervisor
            </button>
          </div>

          {tenantIntegrations.length === 0 ? (
            <div style={{ textAlign: "center", padding: "2.5rem 0", color: "var(--text-secondary)" }}>
              <p style={{ fontSize: "1.05rem", fontWeight: 600 }}>Nenhum hipervisor conectado para o cliente {activeTenant?.name}.</p>
              <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginTop: "0.25rem" }}>
                Cadastre a URL e o token de API do Proxmox VE ou Virtualizor para descobrir os nós e VMs automaticamente.
              </p>
              <button className="btn btn-primary" style={{ marginTop: "1rem" }} onClick={handleOpenCreate}>
                + Conectar Primeiro Hipervisor
              </button>
            </div>
          ) : (
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Provedor</th>
                  <th>Nome da Integração</th>
                  <th>URL de Conexão</th>
                  <th>Status</th>
                  <th>Descoberta</th>
                  <th>Última Sincronização</th>
                  <th>Ações Operacionais</th>
                </tr>
              </thead>
              <tbody>
                {tenantIntegrations.map((item) => (
                  <tr
                    key={item.id}
                    onDoubleClick={() => handleOpenEdit(item)}
                    style={{ cursor: "pointer" }}
                    title="Clique 2x para editar este hipervisor"
                  >
                    <td>
                      <span className={`badge badge-${item.provider === "proxmox" ? "online" : "requires_approval"}`}>
                        {item.provider.toUpperCase()}
                      </span>
                    </td>
                    <td style={{ fontWeight: 600 }}>{item.name}</td>
                    <td style={{ fontFamily: "var(--font-mono)", fontSize: "0.85rem", color: "var(--text-secondary)" }}>{item.baseUrl}</td>
                    <td>
                      <span className="badge badge-online">{item.status}</span>
                    </td>
                    <td style={{ fontSize: "0.875rem" }}>
                      <strong style={{ color: "var(--accent-indigo)" }}>{item.discoveredNodesCount || 0}</strong> Nós •{" "}
                      <strong style={{ color: "var(--accent-emerald)" }}>{item.discoveredVmsCount || 0}</strong> VMs
                    </td>
                    <td style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>
                      {item.lastSyncAt ? new Date(item.lastSyncAt).toLocaleTimeString("pt-BR") : "Nunca"}
                    </td>
                    <td>
                      <div style={{ display: "flex", gap: "0.5rem" }}>
                        <button
                          className="btn btn-secondary"
                          disabled={syncingId === item.id}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSyncClick(item.id);
                          }}
                          style={{ padding: "0.4rem 0.8rem", fontSize: "0.8rem" }}
                        >
                          {syncingId === item.id ? "🔄 Varrendo..." : "⚡ Sincronizar Agora"}
                        </button>
                        <button
                          className="btn btn-secondary"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenEdit(item);
                          }}
                          style={{ padding: "0.4rem 0.6rem", fontSize: "0.8rem" }}
                        >
                          ✏️ Editar
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Tab 2: Alert & Notification Channels */}
      {activeTab === "alerts" && (
        <div className="glass-panel" style={{ padding: "1.5rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
            <div>
              <h2 style={{ fontFamily: "var(--font-heading)", fontSize: "1.2rem", fontWeight: 700 }}>
                🔔 Canais de Disparo de Alertas & Notificações
              </h2>
              <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)", marginTop: "0.25rem" }}>
                Configure para onde os alertas de incidentes e falhas de nós/VMs devem ser enviados (WhatsApp, Telegram, E-mail, Webhooks).
              </p>
            </div>
            <button className="btn btn-primary" onClick={handleOpenCreateChannel}>
              + Configurar Novo Canal de Alerta
            </button>
          </div>

          <table className="custom-table">
            <thead>
              <tr>
                <th>Canal</th>
                <th>Nome Identificador</th>
                <th>Destino / Configuração</th>
                <th>Severidade Mínima</th>
                <th>Status</th>
                <th>Ações de Teste & Edição</th>
              </tr>
            </thead>
            <tbody>
              {tenantChannels.map((ch) => (
                <tr key={ch.id} onDoubleClick={() => handleOpenEditChannel(ch)} style={{ cursor: "pointer" }}>
                  <td>
                    <span className="badge badge-online">
                      {ch.type === "whatsapp" && "📱 WhatsApp"}
                      {ch.type === "telegram" && "✈️ Telegram"}
                      {ch.type === "email" && "📧 E-mail / SMTP"}
                      {ch.type === "webhook" && "💬 Webhook / Slack"}
                    </span>
                  </td>
                  <td style={{ fontWeight: 600 }}>{ch.name}</td>
                  <td style={{ fontFamily: "var(--font-mono)", fontSize: "0.85rem", color: "var(--text-secondary)" }}>
                    {ch.type === "whatsapp" && `Fone: ${ch.config?.phone || "Não inf."}`}
                    {ch.type === "telegram" && `Chat ID: ${ch.config?.chatId || "Não inf."}`}
                    {ch.type === "email" && `Para: ${ch.config?.toEmails || ch.config?.smtpHost}`}
                    {ch.type === "webhook" && `${ch.config?.webhookUrl || "URL"}`}
                  </td>
                  <td>
                    <span className={`badge badge-${ch.minSeverity === "critical" ? "offline" : "requires_approval"}`}>
                      {ch.minSeverity === "critical" ? "🔥 Apenas Crítico" : "⚠️ Warning & Crítico"}
                    </span>
                  </td>
                  <td>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleToggleChannel(ch.id);
                      }}
                      style={{
                        background: ch.enabled ? "rgba(16, 185, 129, 0.2)" : "rgba(244, 63, 94, 0.2)",
                        color: ch.enabled ? "var(--accent-emerald)" : "var(--accent-rose)",
                        border: "none",
                        padding: "0.25rem 0.6rem",
                        borderRadius: "4px",
                        fontWeight: 600,
                        fontSize: "0.75rem",
                        cursor: "pointer",
                      }}
                    >
                      {ch.enabled ? "🟢 ATIVO" : "⚪ PAUSADO"}
                    </button>
                  </td>
                  <td>
                    <div style={{ display: "flex", gap: "0.5rem" }}>
                      <button
                        className="btn btn-secondary"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleTestChannel(ch.id, ch.type);
                        }}
                        disabled={testStatus[ch.id] === "testing"}
                        style={{ padding: "0.35rem 0.65rem", fontSize: "0.75rem" }}
                      >
                        {testStatus[ch.id] === "testing"
                          ? "🔄 Enviando..."
                          : testStatus[ch.id] === "success"
                          ? "✅ Entregue!"
                          : "🧪 Testar Disparo"}
                      </button>
                      <button
                        className="btn btn-secondary"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenEditChannel(ch);
                        }}
                        style={{ padding: "0.35rem 0.5rem", fontSize: "0.75rem" }}
                      >
                        ✏️
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal Hipervisores */}
      {modalOpen && (
        <div
          className="modal-overlay"
          onClick={(e) => {
            if (e.target === e.currentTarget) setModalOpen(false);
          }}
        >
          <div className="glass-panel modal-content" style={{ position: "relative" }}>
            <button
              type="button"
              onClick={() => setModalOpen(false)}
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
            <h3 style={{ fontFamily: "var(--font-heading)", fontSize: "1.2rem", marginBottom: "1rem", paddingRight: "2rem" }}>
              🔌 {editingIntegration ? `Editar Integração: ${editingIntegration.name}` : `Cadastrar Conexão de Hipervisor para ${activeTenant?.name}`}
            </h3>
            <form onSubmit={handleSave}>
              <div style={{ marginBottom: "1rem" }}>
                <label style={{ display: "block", fontSize: "0.85rem", color: "var(--text-secondary)", marginBottom: "0.35rem" }}>
                  Provedor de Virtualização
                </label>
                <select
                  value={form.provider}
                  onChange={(e) => setForm({ ...form, provider: e.target.value })}
                  style={{ width: "100%", padding: "0.6rem", background: "rgba(0,0,0,0.3)", border: "1px solid var(--border-subtle)", color: "#fff", borderRadius: "6px" }}
                >
                  <option value="proxmox">Proxmox VE (REST API /api2/json)</option>
                  <option value="virtualizor">Virtualizor (Admin API act=...)</option>
                </select>
              </div>

              <div style={{ marginBottom: "1rem" }}>
                <label style={{ display: "block", fontSize: "0.85rem", color: "var(--text-secondary)", marginBottom: "0.35rem" }}>
                  Nome Identificador
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Cluster Proxmox Produção"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  style={{ width: "100%", padding: "0.6rem", background: "rgba(0,0,0,0.3)", border: "1px solid var(--border-subtle)", color: "#fff", borderRadius: "6px" }}
                />
              </div>

              <div style={{ marginBottom: "1rem" }}>
                <label style={{ display: "block", fontSize: "0.85rem", color: "var(--text-secondary)", marginBottom: "0.35rem" }}>
                  URL Completa da API
                </label>
                <input
                  type="text"
                  required
                  placeholder="https://pve01.empresa.com:8006"
                  value={form.baseUrl}
                  onChange={(e) => setForm({ ...form, baseUrl: e.target.value })}
                  style={{ width: "100%", padding: "0.6rem", background: "rgba(0,0,0,0.3)", border: "1px solid var(--border-subtle)", color: "#fff", borderRadius: "6px" }}
                />
              </div>

              <div style={{ marginBottom: "1.5rem" }}>
                <label style={{ display: "block", fontSize: "0.85rem", color: "var(--text-secondary)", marginBottom: "0.35rem" }}>
                  {form.provider === "proxmox" ? "API Token (PVEAPIToken=root@pam!tokenid=secret)" : "API Key & API Pass (api_key=XYZ&api_pass=123)"}
                </label>
                <input
                  type="password"
                  placeholder={editingIntegration ? "Deixe em branco para manter a chave atual" : "Armazenado com criptografia AES-256-GCM"}
                  value={form.apiToken}
                  onChange={(e) => setForm({ ...form, apiToken: e.target.value })}
                  style={{ width: "100%", padding: "0.6rem", background: "rgba(0,0,0,0.3)", border: "1px solid var(--border-subtle)", color: "#fff", borderRadius: "6px" }}
                />
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem" }}>
                <button type="button" className="btn btn-secondary" onClick={() => setModalOpen(false)}>
                  Cancelar / Fechar
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingIntegration ? "Salvar Alterações" : "Salvar & Testar Conexão"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Novo/Editar Canal de Alerta */}
      {alertModalOpen && (
        <div
          className="modal-overlay"
          onClick={(e) => {
            if (e.target === e.currentTarget) setAlertModalOpen(false);
          }}
        >
          <div className="glass-panel modal-content" style={{ maxWidth: "620px", position: "relative" }}>
            <button
              type="button"
              onClick={() => setAlertModalOpen(false)}
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
            <h3 style={{ fontFamily: "var(--font-heading)", fontSize: "1.2rem", marginBottom: "0.5rem", paddingRight: "2rem" }}>
              🔔 {editingChannel ? `Editar Canal: ${editingChannel.name}` : `Configurar Canal de Alerta para ${activeTenant?.name}`}
            </h3>
            <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)", marginBottom: "1.25rem" }}>
              Alertas críticos serão disparados imediatamente para os canais ativos deste cliente.
            </p>

            <form onSubmit={handleSaveChannel}>
              <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: "1rem", marginBottom: "1rem" }}>
                <div>
                  <label style={{ display: "block", fontSize: "0.85rem", color: "var(--text-secondary)", marginBottom: "0.35rem" }}>
                    Tipo de Canal
                  </label>
                  <select
                    value={alertForm.type}
                    onChange={(e) => setAlertForm({ ...alertForm, type: e.target.value })}
                    style={{ width: "100%", padding: "0.6rem", background: "rgba(0,0,0,0.3)", border: "1px solid var(--border-subtle)", color: "#fff", borderRadius: "6px" }}
                  >
                    <option value="whatsapp">📱 WhatsApp (Evolution API / Z-API)</option>
                    <option value="telegram">✈️ Telegram Bot</option>
                    <option value="email">📧 E-mail / SMTP</option>
                    <option value="webhook">💬 Webhook Custom / Slack / Discord</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "0.85rem", color: "var(--text-secondary)", marginBottom: "0.35rem" }}>
                    Severidade Mínima
                  </label>
                  <select
                    value={alertForm.minSeverity}
                    onChange={(e) => setAlertForm({ ...alertForm, minSeverity: e.target.value })}
                    style={{ width: "100%", padding: "0.6rem", background: "rgba(0,0,0,0.3)", border: "1px solid var(--border-subtle)", color: "#fff", borderRadius: "6px" }}
                  >
                    <option value="warning">⚠️ Warning & Crítico (Recomendado)</option>
                    <option value="critical">🔥 Apenas Crítico (Interrupções Graves)</option>
                    <option value="info">ℹ️ Todos os Eventos (Incluindo Informativos)</option>
                  </select>
                </div>
              </div>

              <div style={{ marginBottom: "1rem" }}>
                <label style={{ display: "block", fontSize: "0.85rem", color: "var(--text-secondary)", marginBottom: "0.35rem" }}>
                  Nome Identificador do Canal
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: WhatsApp Plantão Suporte ou Grupo Telegram NOC"
                  value={alertForm.name}
                  onChange={(e) => setAlertForm({ ...alertForm, name: e.target.value })}
                  style={{ width: "100%", padding: "0.6rem", background: "rgba(0,0,0,0.3)", border: "1px solid var(--border-subtle)", color: "#fff", borderRadius: "6px" }}
                />
              </div>

              {/* Specific fields based on channel type */}
              {alertForm.type === "whatsapp" && (
                <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: "1rem", marginBottom: "1rem" }}>
                  <div>
                    <label style={{ display: "block", fontSize: "0.85rem", color: "var(--text-secondary)", marginBottom: "0.35rem" }}>
                      URL da API (Evolution / Z-API)
                    </label>
                    <input
                      type="text"
                      placeholder="https://api.whatsapp.me"
                      value={alertForm.apiUrl}
                      onChange={(e) => setAlertForm({ ...alertForm, apiUrl: e.target.value })}
                      style={{ width: "100%", padding: "0.6rem", background: "rgba(0,0,0,0.3)", border: "1px solid var(--border-subtle)", color: "#fff", borderRadius: "6px" }}
                    />
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: "0.85rem", color: "var(--text-secondary)", marginBottom: "0.35rem" }}>
                      Número Destino (com DDI/DDD)
                    </label>
                    <input
                      type="text"
                      placeholder="5511999998888"
                      value={alertForm.phone}
                      onChange={(e) => setAlertForm({ ...alertForm, phone: e.target.value })}
                      style={{ width: "100%", padding: "0.6rem", background: "rgba(0,0,0,0.3)", border: "1px solid var(--border-subtle)", color: "#fff", borderRadius: "6px" }}
                    />
                  </div>
                </div>
              )}

              {alertForm.type === "telegram" && (
                <div style={{ display: "grid", gridTemplateColumns: "1.3fr 1fr", gap: "1rem", marginBottom: "1rem" }}>
                  <div>
                    <label style={{ display: "block", fontSize: "0.85rem", color: "var(--text-secondary)", marginBottom: "0.35rem" }}>
                      Telegram Bot Token
                    </label>
                    <input
                      type="password"
                      placeholder="123456789:ABC-DEF1234ghIkl-zyx57W2v1u123ew11"
                      value={alertForm.botToken}
                      onChange={(e) => setAlertForm({ ...alertForm, botToken: e.target.value })}
                      style={{ width: "100%", padding: "0.6rem", background: "rgba(0,0,0,0.3)", border: "1px solid var(--border-subtle)", color: "#fff", borderRadius: "6px" }}
                    />
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: "0.85rem", color: "var(--text-secondary)", marginBottom: "0.35rem" }}>
                      Chat ID / ID do Grupo
                    </label>
                    <input
                      type="text"
                      placeholder="-100123456789"
                      value={alertForm.chatId}
                      onChange={(e) => setAlertForm({ ...alertForm, chatId: e.target.value })}
                      style={{ width: "100%", padding: "0.6rem", background: "rgba(0,0,0,0.3)", border: "1px solid var(--border-subtle)", color: "#fff", borderRadius: "6px" }}
                    />
                  </div>
                </div>
              )}

              {alertForm.type === "email" && (
                <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: "1rem", marginBottom: "1rem" }}>
                  <div>
                    <label style={{ display: "block", fontSize: "0.85rem", color: "var(--text-secondary)", marginBottom: "0.35rem" }}>
                      E-mails Destinatários (separados por vírgula)
                    </label>
                    <input
                      type="text"
                      placeholder="noc@empresa.com.br, ti@cliente.com.br"
                      value={alertForm.toEmails}
                      onChange={(e) => setAlertForm({ ...alertForm, toEmails: e.target.value })}
                      style={{ width: "100%", padding: "0.6rem", background: "rgba(0,0,0,0.3)", border: "1px solid var(--border-subtle)", color: "#fff", borderRadius: "6px" }}
                    />
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: "0.85rem", color: "var(--text-secondary)", marginBottom: "0.35rem" }}>
                      Host SMTP (Opcional)
                    </label>
                    <input
                      type="text"
                      placeholder="smtp.empresa.com"
                      value={alertForm.smtpHost}
                      onChange={(e) => setAlertForm({ ...alertForm, smtpHost: e.target.value })}
                      style={{ width: "100%", padding: "0.6rem", background: "rgba(0,0,0,0.3)", border: "1px solid var(--border-subtle)", color: "#fff", borderRadius: "6px" }}
                    />
                  </div>
                </div>
              )}

              {alertForm.type === "webhook" && (
                <div style={{ marginBottom: "1rem" }}>
                  <label style={{ display: "block", fontSize: "0.85rem", color: "var(--text-secondary)", marginBottom: "0.35rem" }}>
                    URL do Webhook (POST HTTP / Discord / Slack)
                  </label>
                  <input
                    type="text"
                    placeholder="https://discord.com/api/webhooks/... ou https://hooks.slack.com/..."
                    value={alertForm.webhookUrl}
                    onChange={(e) => setAlertForm({ ...alertForm, webhookUrl: e.target.value })}
                    style={{ width: "100%", padding: "0.6rem", background: "rgba(0,0,0,0.3)", border: "1px solid var(--border-subtle)", color: "#fff", borderRadius: "6px" }}
                  />
                </div>
              )}

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem", marginTop: "1.5rem" }}>
                <button type="button" className="btn btn-secondary" onClick={() => setAlertModalOpen(false)}>
                  Cancelar / Fechar
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingChannel ? "Salvar Alterações" : "Cadastrar Canal de Alerta"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
