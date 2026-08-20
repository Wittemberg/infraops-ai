import React, { useState, useEffect } from "react";

export function SystemSettingsView({ isSuperAdmin, activeTenant }) {
  const [activeTab, setActiveTab] = useState("smtp");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);

  const [settings, setSettings] = useState({
    smtp: {
      enabled: false,
      host: "smtp.sendgrid.net",
      port: 587,
      secure: false,
      user: "apikey",
      password: "",
      passwordMasked: "••••••••••••",
      fromName: "InfraOps AI Alert & Security",
      fromEmail: "noc@awecloudsolution.com",
    },
    s3: {
      enabled: true,
      endpoint: "https://s3.infraopsai.awecloudsolution.com",
      region: "us-east-1",
      bucket: "infraops-artifacts",
      accessKey: "infraops_minio_key",
      secretKey: "",
      secretKeyMasked: "••••••••••••",
      forcePathStyle: true,
      ssl: true,
    },
    database: {
      provider: "PostgreSQL 16",
      host: "localhost",
      port: 5432,
      database: "infraops_db",
      user: "infraops_app",
      sslMode: "prefer",
      maxConnections: 25,
      idleTimeoutSeconds: 60,
    },
    redis: {
      enabled: true,
      host: "localhost",
      port: 6379,
      password: "",
      passwordMasked: "••••••••••••",
      tls: false,
      dbIndex: 0,
      maxJobConcurrency: 5,
    },
    telemetry: {
      prometheusUrl: "http://localhost:9090",
      scrapeIntervalSeconds: 15,
      retentionDays: 30,
      grafanaBaseUrl: "https://grafana.infraopsai.awecloudsolution.com",
      victoriaMetricsEnabled: false,
    },
    ai: {
      defaultProvider: "openai",
      openaiModel: "gpt-4o",
      openaiApiKey: "",
      anthropicModel: "claude-3-5-sonnet-20241022",
      anthropicApiKey: "",
      geminiModel: "gemini-1.5-pro",
      geminiApiKey: "",
      ollamaBaseUrl: "http://localhost:11434",
      ollamaModel: "llama3.1:8b",
      temperature: 0.2,
      maxTokens: 4096,
    },
    agent: {
      defaultHeartbeatIntervalSeconds: 15,
      hostOfflineThresholdSeconds: 60,
      autoApproveEnrolledAgents: false,
      enrollmentEndpointUrl: "https://infraopsai.awecloudsolution.com/api/v1/agent/enroll",
      defaultAutonomyLevel: 2,
    },
    branding: {
      platformName: "InfraOps AI",
      companyName: "WR Tecnologia",
      logoUrl: "",
      supportEmail: "suporte@wrtec.com.br",
      supportWhatsapp: "5511999998888",
      customFooterText: "InfraOps AI — Governança Autônoma e Inteligência de Infraestrutura",
      primaryColor: "#6366f1",
    },
    security: {
      sessionTtlHours: 24,
      maxFailedLogins: 5,
      lockoutDurationMinutes: 15,
      requireMfa: false,
      minPasswordLength: 8,
      requirePasswordSpecialChar: true,
      ipWhitelist: [],
    },
  });

  const [showSmtpPass, setShowSmtpPass] = useState(false);
  const [showS3Secret, setShowS3Secret] = useState(false);
  const [showRedisPass, setShowRedisPass] = useState(false);
  const [showAiKey, setShowAiKey] = useState(false);

  const showToast = (text, type = "success") => {
    setToastMessage({ text, type });
    setTimeout(() => {
      setToastMessage(null);
    }, 5000);
  };

  useEffect(() => {
    fetch("https://infraopsai.awecloudsolution.com/api/v1/settings/system")
      .then((res) => res.json())
      .then((data) => {
        if (data.settings) {
          setSettings((prev) => ({
            ...prev,
            ...data.settings,
            smtp: { ...prev.smtp, ...(data.settings.smtp || {}) },
            s3: { ...prev.s3, ...(data.settings.s3 || {}) },
            database: { ...prev.database, ...(data.settings.database || {}) },
            redis: { ...prev.redis, ...(data.settings.redis || {}) },
            telemetry: { ...prev.telemetry, ...(data.settings.telemetry || {}) },
            ai: { ...prev.ai, ...(data.settings.ai || {}) },
            agent: { ...prev.agent, ...(data.settings.agent || {}) },
            branding: { ...prev.branding, ...(data.settings.branding || {}) },
            security: { ...prev.security, ...(data.settings.security || {}) },
          }));
        }
      })
      .catch((err) => console.warn("Failed to fetch system settings:", err))
      .finally(() => setLoading(false));
  }, []);

  const handleSaveSettings = async (e) => {
    if (e) e.preventDefault();
    setSaving(true);
    setTestResult(null);

    try {
      const res = await fetch("https://infraopsai.awecloudsolution.com/api/v1/settings/system", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro ao salvar configurações.");

      showToast("Configurações do sistema salvas e aplicadas com sucesso!");
    } catch (err) {
      showToast(err.message || "Erro ao salvar configurações.", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleTestSmtp = async () => {
    setTesting(true);
    setTestResult(null);

    try {
      const res = await fetch("https://infraopsai.awecloudsolution.com/api/v1/settings/system/test-smtp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          host: settings.smtp.host,
          port: settings.smtp.port,
          recipient: settings.smtp.fromEmail || "noc@wrtec.com.br",
        }),
      });

      const data = await res.json();
      setTestResult({
        type: res.ok ? "success" : "error",
        title: res.ok ? "SMTP Teste: OK" : "SMTP Teste: Falhou",
        message: data.message,
        details: data.details,
      });
    } catch (err) {
      setTestResult({
        type: "error",
        title: "Erro de Conexão SMTP",
        message: err.message || "Não foi possível conectar ao servidor SMTP.",
      });
    } finally {
      setTesting(false);
    }
  };

  const handleTestS3 = async () => {
    setTesting(true);
    setTestResult(null);

    try {
      const res = await fetch("https://infraopsai.awecloudsolution.com/api/v1/settings/system/test-s3", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          endpoint: settings.s3.endpoint,
          bucket: settings.s3.bucket,
        }),
      });

      const data = await res.json();
      setTestResult({
        type: res.ok ? "success" : "error",
        title: res.ok ? "Storage S3 Teste: OK" : "Storage S3 Teste: Falhou",
        message: data.message,
        details: data.details,
      });
    } catch (err) {
      setTestResult({
        type: "error",
        title: "Erro de Conexão S3",
        message: err.message || "Não foi possível alcançar o bucket S3 especificado.",
      });
    } finally {
      setTesting(false);
    }
  };

  const handleTestRedis = async () => {
    setTesting(true);
    setTestResult(null);

    try {
      const res = await fetch("https://infraopsai.awecloudsolution.com/api/v1/settings/system/test-redis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          host: settings.redis.host,
          port: settings.redis.port,
        }),
      });

      const data = await res.json();
      setTestResult({
        type: res.ok ? "success" : "error",
        title: res.ok ? "Redis Broker: Conectado" : "Redis Broker: Falha",
        message: data.message,
        details: data.details,
      });
    } catch (err) {
      setTestResult({
        type: "error",
        title: "Erro de Conexão Redis",
        message: err.message || "Não foi possível conectar ao Redis.",
      });
    } finally {
      setTesting(false);
    }
  };

  const handleTestTelemetry = async () => {
    setTesting(true);
    setTestResult(null);

    try {
      const res = await fetch("https://infraopsai.awecloudsolution.com/api/v1/settings/system/test-telemetry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prometheusUrl: settings.telemetry.prometheusUrl,
        }),
      });

      const data = await res.json();
      setTestResult({
        type: res.ok ? "success" : "error",
        title: res.ok ? "Prometheus Telemetria: OK" : "Prometheus: Falha",
        message: data.message,
        details: data.details,
      });
    } catch (err) {
      setTestResult({
        type: "error",
        title: "Erro de Telemetria",
        message: err.message || "Prometheus inacessível.",
      });
    } finally {
      setTesting(false);
    }
  };

  const handleTestAi = async () => {
    setTesting(true);
    setTestResult(null);

    try {
      const res = await fetch("https://infraopsai.awecloudsolution.com/api/v1/settings/system/test-ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider: settings.ai.defaultProvider,
        }),
      });

      const data = await res.json();
      setTestResult({
        type: res.ok ? "success" : "error",
        title: res.ok ? "Provedor IA: Ativo" : "Provedor IA: Falha",
        message: data.message,
        details: data.details,
      });
    } catch (err) {
      setTestResult({
        type: "error",
        title: "Erro no Provedor IA",
        message: err.message || "Falha na comunicação com o provedor de IA.",
      });
    } finally {
      setTesting(false);
    }
  };

  return (
    <div style={{ padding: "1.5rem 2rem", maxWidth: "1250px", margin: "0 auto" }}>
      {/* Toast Banner */}
      {toastMessage && (
        <div
          style={{
            background: toastMessage.type === "success" ? "rgba(16, 185, 129, 0.2)" : "rgba(244, 63, 94, 0.2)",
            border: `1px solid ${toastMessage.type === "success" ? "rgba(16, 185, 129, 0.5)" : "rgba(244, 63, 94, 0.5)"}`,
            color: toastMessage.type === "success" ? "var(--accent-emerald)" : "var(--accent-rose)",
            padding: "0.85rem 1.25rem",
            borderRadius: "8px",
            marginBottom: "1.5rem",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontWeight: 600 }}>
            <span>{toastMessage.type === "success" ? "✅" : "⚠️"}</span>
            <span>{toastMessage.text}</span>
          </div>
          <button
            onClick={() => setToastMessage(null)}
            style={{ background: "none", border: "none", color: "inherit", cursor: "pointer" }}
          >
            ✖
          </button>
        </div>
      )}

      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <h1 style={{ fontFamily: "var(--font-heading)", fontSize: "1.5rem", fontWeight: 800 }}>
            ⚙️ Configurações Gerais da Plataforma
          </h1>
          <p style={{ color: "var(--text-secondary)", fontSize: "0.85rem", marginTop: "0.25rem" }}>
            Painel mestre de conectividade, storage, telemetria, mensageria, IA, segurança e identidade visual para MSP.
          </p>
        </div>
        <button
          type="button"
          onClick={handleSaveSettings}
          disabled={saving}
          className="btn btn-primary"
          style={{ padding: "0.6rem 1.25rem", fontWeight: 700, display: "flex", alignItems: "center", gap: "0.5rem" }}
        >
          {saving ? "⏳ Salvando..." : "💾 Salvar Todas as Configurações"}
        </button>
      </div>

      {/* Navigation Tabs (9 Subsystems) */}
      <div style={{ display: "flex", gap: "0.35rem", borderBottom: "1px solid var(--border-subtle)", marginBottom: "1.5rem", flexWrap: "wrap" }}>
        {[
          { id: "smtp", label: "📧 Servidor SMTP" },
          { id: "s3", label: "🪣 Storage S3 / MinIO" },
          { id: "database", label: "🗄️ PostgreSQL" },
          { id: "redis", label: "⚡ Redis & Filas" },
          { id: "telemetry", label: "📊 Telemetria (Prometheus)" },
          { id: "ai", label: "🤖 Provedores de IA" },
          { id: "agent", label: "📦 Agente de Host" },
          { id: "branding", label: "🏢 White-Label & MSP" },
          { id: "security", label: "🔐 Segurança & Políticas" },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => {
              setActiveTab(tab.id);
              setTestResult(null);
            }}
            style={{
              padding: "0.6rem 1rem",
              background: activeTab === tab.id ? "rgba(99, 102, 241, 0.18)" : "transparent",
              border: "none",
              borderBottom: activeTab === tab.id ? "2px solid var(--accent-indigo)" : "2px solid transparent",
              color: activeTab === tab.id ? "#fff" : "var(--text-secondary)",
              fontWeight: activeTab === tab.id ? 700 : 500,
              cursor: "pointer",
              fontSize: "0.85rem",
              transition: "all 0.2s",
              borderRadius: "6px 6px 0 0",
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Test Result Box */}
      {testResult && (
        <div
          style={{
            background: testResult.type === "success" ? "rgba(16, 185, 129, 0.12)" : "rgba(244, 63, 94, 0.12)",
            border: `1px solid ${testResult.type === "success" ? "rgba(16, 185, 129, 0.3)" : "rgba(244, 63, 94, 0.3)"}`,
            padding: "1rem",
            borderRadius: "8px",
            marginBottom: "1.5rem",
          }}
        >
          <div style={{ fontWeight: 700, color: testResult.type === "success" ? "var(--accent-emerald)" : "var(--accent-rose)", marginBottom: "0.3rem" }}>
            {testResult.type === "success" ? "✅" : "⚠️"} {testResult.title}
          </div>
          <div style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>{testResult.message}</div>
          {testResult.details && (
            <pre
              style={{
                marginTop: "0.5rem",
                padding: "0.5rem",
                background: "rgba(0,0,0,0.3)",
                borderRadius: "4px",
                fontSize: "0.75rem",
                color: "#a5b4fc",
              }}
            >
              {JSON.stringify(testResult.details, null, 2)}
            </pre>
          )}
        </div>
      )}

      {/* TAB 1: SMTP CONFIGURATION */}
      {activeTab === "smtp" && (
        <div className="glass-panel" style={{ padding: "1.75rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem", flexWrap: "wrap", gap: "0.75rem" }}>
            <div>
              <h3 style={{ fontFamily: "var(--font-heading)", fontSize: "1.15rem", fontWeight: 700 }}>
                📧 Servidor SMTP / E-mail Transacional
              </h3>
              <p style={{ fontSize: "0.8rem", color: "var(--text-secondary)", marginTop: "0.2rem" }}>
                Envio de recuperação de senha, alertas de incidentes para administradores e relatórios executivos.
              </p>
            </div>
            <button type="button" onClick={handleTestSmtp} disabled={testing} className="btn btn-secondary" style={{ fontSize: "0.85rem" }}>
              {testing ? "⏳ Testando..." : "⚡ Testar Conexão SMTP"}
            </button>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "1.25rem" }}>
            <div>
              <label style={{ display: "block", fontSize: "0.85rem", color: "var(--text-secondary)", marginBottom: "0.35rem" }}>Status do Envio</label>
              <select
                value={settings.smtp.enabled ? "enabled" : "disabled"}
                onChange={(e) => setSettings({ ...settings, smtp: { ...settings.smtp, enabled: e.target.value === "enabled" } })}
                style={{ width: "100%", padding: "0.6rem", background: "rgba(0,0,0,0.3)", border: "1px solid var(--border-subtle)", color: "#fff", borderRadius: "6px" }}
              >
                <option value="enabled">🟢 Habilitado (Envio Ativo)</option>
                <option value="disabled">🔴 Desabilitado (Modo Simulação)</option>
              </select>
            </div>

            <div>
              <label style={{ display: "block", fontSize: "0.85rem", color: "var(--text-secondary)", marginBottom: "0.35rem" }}>Host SMTP *</label>
              <input
                type="text"
                value={settings.smtp.host}
                onChange={(e) => setSettings({ ...settings, smtp: { ...settings.smtp, host: e.target.value } })}
                placeholder="smtp.sendgrid.net"
                style={{ width: "100%", padding: "0.6rem", background: "rgba(0,0,0,0.3)", border: "1px solid var(--border-subtle)", color: "#fff", borderRadius: "6px" }}
              />
            </div>

            <div>
              <label style={{ display: "block", fontSize: "0.85rem", color: "var(--text-secondary)", marginBottom: "0.35rem" }}>Porta SMTP *</label>
              <input
                type="number"
                value={settings.smtp.port}
                onChange={(e) => setSettings({ ...settings, smtp: { ...settings.smtp, port: Number(e.target.value) } })}
                placeholder="587 ou 465"
                style={{ width: "100%", padding: "0.6rem", background: "rgba(0,0,0,0.3)", border: "1px solid var(--border-subtle)", color: "#fff", borderRadius: "6px" }}
              />
            </div>

            <div>
              <label style={{ display: "block", fontSize: "0.85rem", color: "var(--text-secondary)", marginBottom: "0.35rem" }}>Criptografia</label>
              <select
                value={settings.smtp.secure ? "ssl" : "starttls"}
                onChange={(e) => setSettings({ ...settings, smtp: { ...settings.smtp, secure: e.target.value === "ssl" } })}
                style={{ width: "100%", padding: "0.6rem", background: "rgba(0,0,0,0.3)", border: "1px solid var(--border-subtle)", color: "#fff", borderRadius: "6px" }}
              >
                <option value="starttls">STARTTLS (Porta 587 - Padrão)</option>
                <option value="ssl">SSL / TLS Direto (Porta 465)</option>
              </select>
            </div>

            <div>
              <label style={{ display: "block", fontSize: "0.85rem", color: "var(--text-secondary)", marginBottom: "0.35rem" }}>Usuário SMTP</label>
              <input
                type="text"
                value={settings.smtp.user}
                onChange={(e) => setSettings({ ...settings, smtp: { ...settings.smtp, user: e.target.value } })}
                placeholder="apikey ou usuario@empresa.com.br"
                style={{ width: "100%", padding: "0.6rem", background: "rgba(0,0,0,0.3)", border: "1px solid var(--border-subtle)", color: "#fff", borderRadius: "6px" }}
              />
            </div>

            <div>
              <label style={{ display: "block", fontSize: "0.85rem", color: "var(--text-secondary)", marginBottom: "0.35rem" }}>Senha / Chave API</label>
              <div style={{ display: "flex", gap: "0.5rem" }}>
                <input
                  type={showSmtpPass ? "text" : "password"}
                  value={settings.smtp.password}
                  onChange={(e) => setSettings({ ...settings, smtp: { ...settings.smtp, password: e.target.value } })}
                  placeholder="Deixe em branco para manter a atual"
                  style={{ flex: 1, padding: "0.6rem", background: "rgba(0,0,0,0.3)", border: "1px solid var(--border-subtle)", color: "#fff", borderRadius: "6px" }}
                />
                <button
                  type="button"
                  onClick={() => setShowSmtpPass(!showSmtpPass)}
                  style={{ padding: "0.5rem 0.75rem", background: "rgba(255,255,255,0.08)", border: "1px solid var(--border-subtle)", color: "#fff", borderRadius: "6px", cursor: "pointer" }}
                >
                  {showSmtpPass ? "🙈" : "👁️"}
                </button>
              </div>
            </div>

            <div>
              <label style={{ display: "block", fontSize: "0.85rem", color: "var(--text-secondary)", marginBottom: "0.35rem" }}>Nome do Remetente</label>
              <input
                type="text"
                value={settings.smtp.fromName}
                onChange={(e) => setSettings({ ...settings, smtp: { ...settings.smtp, fromName: e.target.value } })}
                placeholder="InfraOps AI Alerts"
                style={{ width: "100%", padding: "0.6rem", background: "rgba(0,0,0,0.3)", border: "1px solid var(--border-subtle)", color: "#fff", borderRadius: "6px" }}
              />
            </div>

            <div>
              <label style={{ display: "block", fontSize: "0.85rem", color: "var(--text-secondary)", marginBottom: "0.35rem" }}>E-mail do Remetente</label>
              <input
                type="email"
                value={settings.smtp.fromEmail}
                onChange={(e) => setSettings({ ...settings, smtp: { ...settings.smtp, fromEmail: e.target.value } })}
                placeholder="noc@empresa.com.br"
                style={{ width: "100%", padding: "0.6rem", background: "rgba(0,0,0,0.3)", border: "1px solid var(--border-subtle)", color: "#fff", borderRadius: "6px" }}
              />
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: S3 OBJECT STORAGE */}
      {activeTab === "s3" && (
        <div className="glass-panel" style={{ padding: "1.75rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem", flexWrap: "wrap", gap: "0.75rem" }}>
            <div>
              <h3 style={{ fontFamily: "var(--font-heading)", fontSize: "1.15rem", fontWeight: 700 }}>
                🪣 Armazenamento de Objetos (S3 / MinIO / Ceph)
              </h3>
              <p style={{ fontSize: "0.8rem", color: "var(--text-secondary)", marginTop: "0.2rem" }}>
                Destino seguro para logs de auditoria, backups de workloads e relatórios executivos.
              </p>
            </div>
            <button type="button" onClick={handleTestS3} disabled={testing} className="btn btn-secondary" style={{ fontSize: "0.85rem" }}>
              {testing ? "⏳ Testando..." : "⚡ Testar Conexão S3"}
            </button>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "1.25rem" }}>
            <div>
              <label style={{ display: "block", fontSize: "0.85rem", color: "var(--text-secondary)", marginBottom: "0.35rem" }}>Endpoint S3 Base *</label>
              <input
                type="text"
                value={settings.s3.endpoint}
                onChange={(e) => setSettings({ ...settings, s3: { ...settings.s3, endpoint: e.target.value } })}
                placeholder="https://s3.infraopsai.awecloudsolution.com"
                style={{ width: "100%", padding: "0.6rem", background: "rgba(0,0,0,0.3)", border: "1px solid var(--border-subtle)", color: "#fff", borderRadius: "6px" }}
              />
            </div>

            <div>
              <label style={{ display: "block", fontSize: "0.85rem", color: "var(--text-secondary)", marginBottom: "0.35rem" }}>Bucket Name *</label>
              <input
                type="text"
                value={settings.s3.bucket}
                onChange={(e) => setSettings({ ...settings, s3: { ...settings.s3, bucket: e.target.value } })}
                placeholder="infraops-artifacts"
                style={{ width: "100%", padding: "0.6rem", background: "rgba(0,0,0,0.3)", border: "1px solid var(--border-subtle)", color: "#fff", borderRadius: "6px" }}
              />
            </div>

            <div>
              <label style={{ display: "block", fontSize: "0.85rem", color: "var(--text-secondary)", marginBottom: "0.35rem" }}>Região S3</label>
              <input
                type="text"
                value={settings.s3.region}
                onChange={(e) => setSettings({ ...settings, s3: { ...settings.s3, region: e.target.value } })}
                placeholder="us-east-1"
                style={{ width: "100%", padding: "0.6rem", background: "rgba(0,0,0,0.3)", border: "1px solid var(--border-subtle)", color: "#fff", borderRadius: "6px" }}
              />
            </div>

            <div>
              <label style={{ display: "block", fontSize: "0.85rem", color: "var(--text-secondary)", marginBottom: "0.35rem" }}>Access Key</label>
              <input
                type="text"
                value={settings.s3.accessKey}
                onChange={(e) => setSettings({ ...settings, s3: { ...settings.s3, accessKey: e.target.value } })}
                style={{ width: "100%", padding: "0.6rem", background: "rgba(0,0,0,0.3)", border: "1px solid var(--border-subtle)", color: "#fff", borderRadius: "6px" }}
              />
            </div>

            <div>
              <label style={{ display: "block", fontSize: "0.85rem", color: "var(--text-secondary)", marginBottom: "0.35rem" }}>Secret Key</label>
              <div style={{ display: "flex", gap: "0.5rem" }}>
                <input
                  type={showS3Secret ? "text" : "password"}
                  value={settings.s3.secretKey}
                  onChange={(e) => setSettings({ ...settings, s3: { ...settings.s3, secretKey: e.target.value } })}
                  placeholder="Deixe em branco para manter a atual"
                  style={{ flex: 1, padding: "0.6rem", background: "rgba(0,0,0,0.3)", border: "1px solid var(--border-subtle)", color: "#fff", borderRadius: "6px" }}
                />
                <button
                  type="button"
                  onClick={() => setShowS3Secret(!showS3Secret)}
                  style={{ padding: "0.5rem 0.75rem", background: "rgba(255,255,255,0.08)", border: "1px solid var(--border-subtle)", color: "#fff", borderRadius: "6px", cursor: "pointer" }}
                >
                  {showS3Secret ? "🙈" : "👁️"}
                </button>
              </div>
            </div>

            <div>
              <label style={{ display: "block", fontSize: "0.85rem", color: "var(--text-secondary)", marginBottom: "0.35rem" }}>Path-Style</label>
              <select
                value={settings.s3.forcePathStyle ? "true" : "false"}
                onChange={(e) => setSettings({ ...settings, s3: { ...settings.s3, forcePathStyle: e.target.value === "true" } })}
                style={{ width: "100%", padding: "0.6rem", background: "rgba(0,0,0,0.3)", border: "1px solid var(--border-subtle)", color: "#fff", borderRadius: "6px" }}
              >
                <option value="true">Force Path Style (MinIO / Ceph)</option>
                <option value="false">Virtual Host Style (AWS S3)</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: DATABASE */}
      {activeTab === "database" && (
        <div className="glass-panel" style={{ padding: "1.75rem" }}>
          <div style={{ marginBottom: "1.5rem" }}>
            <h3 style={{ fontFamily: "var(--font-heading)", fontSize: "1.15rem", fontWeight: 700 }}>
              🗄️ PostgreSQL 16 & Pool de Conexões
            </h3>
            <p style={{ fontSize: "0.8rem", color: "var(--text-secondary)", marginTop: "0.2rem" }}>
              Armazenamento transacional de inventário, cadeias de auditoria SHA-256 e políticas.
            </p>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "1.25rem" }}>
            <div>
              <label style={{ display: "block", fontSize: "0.85rem", color: "var(--text-secondary)", marginBottom: "0.35rem" }}>Motor</label>
              <input type="text" disabled value={settings.database.provider} style={{ width: "100%", padding: "0.6rem", background: "rgba(0,0,0,0.4)", border: "1px solid var(--border-subtle)", color: "var(--accent-indigo)", fontWeight: 700, borderRadius: "6px" }} />
            </div>

            <div>
              <label style={{ display: "block", fontSize: "0.85rem", color: "var(--text-secondary)", marginBottom: "0.35rem" }}>Host</label>
              <input type="text" value={settings.database.host} onChange={(e) => setSettings({ ...settings, database: { ...settings.database, host: e.target.value } })} style={{ width: "100%", padding: "0.6rem", background: "rgba(0,0,0,0.3)", border: "1px solid var(--border-subtle)", color: "#fff", borderRadius: "6px" }} />
            </div>

            <div>
              <label style={{ display: "block", fontSize: "0.85rem", color: "var(--text-secondary)", marginBottom: "0.35rem" }}>Porta</label>
              <input type="number" value={settings.database.port} onChange={(e) => setSettings({ ...settings, database: { ...settings.database, port: Number(e.target.value) } })} style={{ width: "100%", padding: "0.6rem", background: "rgba(0,0,0,0.3)", border: "1px solid var(--border-subtle)", color: "#fff", borderRadius: "6px" }} />
            </div>

            <div>
              <label style={{ display: "block", fontSize: "0.85rem", color: "var(--text-secondary)", marginBottom: "0.35rem" }}>Database</label>
              <input type="text" value={settings.database.database} onChange={(e) => setSettings({ ...settings, database: { ...settings.database, database: e.target.value } })} style={{ width: "100%", padding: "0.6rem", background: "rgba(0,0,0,0.3)", border: "1px solid var(--border-subtle)", color: "#fff", borderRadius: "6px" }} />
            </div>

            <div>
              <label style={{ display: "block", fontSize: "0.85rem", color: "var(--text-secondary)", marginBottom: "0.35rem" }}>Usuário</label>
              <input type="text" value={settings.database.user} onChange={(e) => setSettings({ ...settings, database: { ...settings.database, user: e.target.value } })} style={{ width: "100%", padding: "0.6rem", background: "rgba(0,0,0,0.3)", border: "1px solid var(--border-subtle)", color: "#fff", borderRadius: "6px" }} />
            </div>

            <div>
              <label style={{ display: "block", fontSize: "0.85rem", color: "var(--text-secondary)", marginBottom: "0.35rem" }}>Conexões Máximas (Pool)</label>
              <input type="number" value={settings.database.maxConnections} onChange={(e) => setSettings({ ...settings, database: { ...settings.database, maxConnections: Number(e.target.value) } })} style={{ width: "100%", padding: "0.6rem", background: "rgba(0,0,0,0.3)", border: "1px solid var(--border-subtle)", color: "#fff", borderRadius: "6px" }} />
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: REDIS & QUEUES */}
      {activeTab === "redis" && (
        <div className="glass-panel" style={{ padding: "1.75rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem", flexWrap: "wrap", gap: "0.75rem" }}>
            <div>
              <h3 style={{ fontFamily: "var(--font-heading)", fontSize: "1.15rem", fontWeight: 700 }}>
                ⚡ Broker de Mensageria & Fila de Jobs (Redis / BullMQ)
              </h3>
              <p style={{ fontSize: "0.8rem", color: "var(--text-secondary)", marginTop: "0.2rem" }}>
                Processamento assíncrono de Schedules, Self-Healing, triggers e distribuição de Jobs operacionais.
              </p>
            </div>
            <button type="button" onClick={handleTestRedis} disabled={testing} className="btn btn-secondary" style={{ fontSize: "0.85rem" }}>
              {testing ? "⏳ Testando..." : "⚡ Testar Conexão Redis"}
            </button>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "1.25rem" }}>
            <div>
              <label style={{ display: "block", fontSize: "0.85rem", color: "var(--text-secondary)", marginBottom: "0.35rem" }}>Host do Redis *</label>
              <input type="text" value={settings.redis.host} onChange={(e) => setSettings({ ...settings, redis: { ...settings.redis, host: e.target.value } })} placeholder="localhost ou redis" style={{ width: "100%", padding: "0.6rem", background: "rgba(0,0,0,0.3)", border: "1px solid var(--border-subtle)", color: "#fff", borderRadius: "6px" }} />
            </div>

            <div>
              <label style={{ display: "block", fontSize: "0.85rem", color: "var(--text-secondary)", marginBottom: "0.35rem" }}>Porta Redis *</label>
              <input type="number" value={settings.redis.port} onChange={(e) => setSettings({ ...settings, redis: { ...settings.redis, port: Number(e.target.value) } })} placeholder="6379" style={{ width: "100%", padding: "0.6rem", background: "rgba(0,0,0,0.3)", border: "1px solid var(--border-subtle)", color: "#fff", borderRadius: "6px" }} />
            </div>

            <div>
              <label style={{ display: "block", fontSize: "0.85rem", color: "var(--text-secondary)", marginBottom: "0.35rem" }}>Senha do Redis</label>
              <div style={{ display: "flex", gap: "0.5rem" }}>
                <input type={showRedisPass ? "text" : "password"} value={settings.redis.password} onChange={(e) => setSettings({ ...settings, redis: { ...settings.redis, password: e.target.value } })} placeholder="Deixe em branco para sem senha" style={{ flex: 1, padding: "0.6rem", background: "rgba(0,0,0,0.3)", border: "1px solid var(--border-subtle)", color: "#fff", borderRadius: "6px" }} />
                <button type="button" onClick={() => setShowRedisPass(!showRedisPass)} style={{ padding: "0.5rem 0.75rem", background: "rgba(255,255,255,0.08)", border: "1px solid var(--border-subtle)", color: "#fff", borderRadius: "6px", cursor: "pointer" }}>
                  {showRedisPass ? "🙈" : "👁️"}
                </button>
              </div>
            </div>

            <div>
              <label style={{ display: "block", fontSize: "0.85rem", color: "var(--text-secondary)", marginBottom: "0.35rem" }}>Concorrência Máxima de Jobs</label>
              <input type="number" value={settings.redis.maxJobConcurrency} onChange={(e) => setSettings({ ...settings, redis: { ...settings.redis, maxJobConcurrency: Number(e.target.value) } })} style={{ width: "100%", padding: "0.6rem", background: "rgba(0,0,0,0.3)", border: "1px solid var(--border-subtle)", color: "#fff", borderRadius: "6px" }} />
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: TELEMETRY & PROMETHEUS */}
      {activeTab === "telemetry" && (
        <div className="glass-panel" style={{ padding: "1.75rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem", flexWrap: "wrap", gap: "0.75rem" }}>
            <div>
              <h3 style={{ fontFamily: "var(--font-heading)", fontSize: "1.15rem", fontWeight: 700 }}>
                📊 Telemetria, Métricas & Observabilidade (Prometheus / Grafana)
              </h3>
              <p style={{ fontSize: "0.8rem", color: "var(--text-secondary)", marginTop: "0.2rem" }}>
                Coleta temporal de CPU, RAM, IOPS, ZFS e rede (ADR-004: Dados temporais ficam no Prometheus).
              </p>
            </div>
            <button type="button" onClick={handleTestTelemetry} disabled={testing} className="btn btn-secondary" style={{ fontSize: "0.85rem" }}>
              {testing ? "⏳ Testando..." : "⚡ Testar Prometheus"}
            </button>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "1.25rem" }}>
            <div>
              <label style={{ display: "block", fontSize: "0.85rem", color: "var(--text-secondary)", marginBottom: "0.35rem" }}>URL do Prometheus Server *</label>
              <input type="text" value={settings.telemetry.prometheusUrl} onChange={(e) => setSettings({ ...settings, telemetry: { ...settings.telemetry, prometheusUrl: e.target.value } })} placeholder="http://localhost:9090" style={{ width: "100%", padding: "0.6rem", background: "rgba(0,0,0,0.3)", border: "1px solid var(--border-subtle)", color: "#fff", borderRadius: "6px" }} />
            </div>

            <div>
              <label style={{ display: "block", fontSize: "0.85rem", color: "var(--text-secondary)", marginBottom: "0.35rem" }}>Intervalo de Scrape (Segundos)</label>
              <input type="number" value={settings.telemetry.scrapeIntervalSeconds} onChange={(e) => setSettings({ ...settings, telemetry: { ...settings.telemetry, scrapeIntervalSeconds: Number(e.target.value) } })} style={{ width: "100%", padding: "0.6rem", background: "rgba(0,0,0,0.3)", border: "1px solid var(--border-subtle)", color: "#fff", borderRadius: "6px" }} />
            </div>

            <div>
              <label style={{ display: "block", fontSize: "0.85rem", color: "var(--text-secondary)", marginBottom: "0.35rem" }}>Retenção de Séries (Dias)</label>
              <input type="number" value={settings.telemetry.retentionDays} onChange={(e) => setSettings({ ...settings, telemetry: { ...settings.telemetry, retentionDays: Number(e.target.value) } })} style={{ width: "100%", padding: "0.6rem", background: "rgba(0,0,0,0.3)", border: "1px solid var(--border-subtle)", color: "#fff", borderRadius: "6px" }} />
            </div>

            <div>
              <label style={{ display: "block", fontSize: "0.85rem", color: "var(--text-secondary)", marginBottom: "0.35rem" }}>URL Base do Grafana (Embed)</label>
              <input type="text" value={settings.telemetry.grafanaBaseUrl} onChange={(e) => setSettings({ ...settings, telemetry: { ...settings.telemetry, grafanaBaseUrl: e.target.value } })} placeholder="https://grafana.infraopsai.awecloudsolution.com" style={{ width: "100%", padding: "0.6rem", background: "rgba(0,0,0,0.3)", border: "1px solid var(--border-subtle)", color: "#fff", borderRadius: "6px" }} />
            </div>
          </div>
        </div>
      )}

      {/* TAB 6: AI PROVIDERS */}
      {activeTab === "ai" && (
        <div className="glass-panel" style={{ padding: "1.75rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem", flexWrap: "wrap", gap: "0.75rem" }}>
            <div>
              <h3 style={{ fontFamily: "var(--font-heading)", fontSize: "1.15rem", fontWeight: 700 }}>
                🤖 Provedores de Inteligência Artificial & LLMs
              </h3>
              <p style={{ fontSize: "0.8rem", color: "var(--text-secondary)", marginTop: "0.2rem" }}>
                Inferência inteligente para o Console de IA, Advisor de Infraestrutura e Self-Healing.
              </p>
            </div>
            <button type="button" onClick={handleTestAi} disabled={testing} className="btn btn-secondary" style={{ fontSize: "0.85rem" }}>
              {testing ? "⏳ Testando..." : "⚡ Testar Provedor IA"}
            </button>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "1.25rem" }}>
            <div>
              <label style={{ display: "block", fontSize: "0.85rem", color: "var(--text-secondary)", marginBottom: "0.35rem" }}>Provedor Padrão</label>
              <select
                value={settings.ai.defaultProvider}
                onChange={(e) => setSettings({ ...settings, ai: { ...settings.ai, defaultProvider: e.target.value } })}
                style={{ width: "100%", padding: "0.6rem", background: "rgba(0,0,0,0.3)", border: "1px solid var(--border-subtle)", color: "#fff", borderRadius: "6px" }}
              >
                <option value="openai">OpenAI (GPT-4o)</option>
                <option value="anthropic">Anthropic (Claude 3.5 Sonnet)</option>
                <option value="gemini">Google Gemini (Gemini 1.5 Pro)</option>
                <option value="ollama">Ollama Local (On-Premise Llama 3.1)</option>
              </select>
            </div>

            <div>
              <label style={{ display: "block", fontSize: "0.85rem", color: "var(--text-secondary)", marginBottom: "0.35rem" }}>Chave API OpenAI</label>
              <input type="password" value={settings.ai.openaiApiKey} onChange={(e) => setSettings({ ...settings, ai: { ...settings.ai, openaiApiKey: e.target.value } })} placeholder="sk-proj-••••••••••••" style={{ width: "100%", padding: "0.6rem", background: "rgba(0,0,0,0.3)", border: "1px solid var(--border-subtle)", color: "#fff", borderRadius: "6px" }} />
            </div>

            <div>
              <label style={{ display: "block", fontSize: "0.85rem", color: "var(--text-secondary)", marginBottom: "0.35rem" }}>URL Ollama Local</label>
              <input type="text" value={settings.ai.ollamaBaseUrl} onChange={(e) => setSettings({ ...settings, ai: { ...settings.ai, ollamaBaseUrl: e.target.value } })} placeholder="http://localhost:11434" style={{ width: "100%", padding: "0.6rem", background: "rgba(0,0,0,0.3)", border: "1px solid var(--border-subtle)", color: "#fff", borderRadius: "6px" }} />
            </div>

            <div>
              <label style={{ display: "block", fontSize: "0.85rem", color: "var(--text-secondary)", marginBottom: "0.35rem" }}>Modelo Ollama</label>
              <input type="text" value={settings.ai.ollamaModel} onChange={(e) => setSettings({ ...settings, ai: { ...settings.ai, ollamaModel: e.target.value } })} placeholder="llama3.1:8b" style={{ width: "100%", padding: "0.6rem", background: "rgba(0,0,0,0.3)", border: "1px solid var(--border-subtle)", color: "#fff", borderRadius: "6px" }} />
            </div>
          </div>
        </div>
      )}

      {/* TAB 7: HOST AGENT */}
      {activeTab === "agent" && (
        <div className="glass-panel" style={{ padding: "1.75rem" }}>
          <div style={{ marginBottom: "1.5rem" }}>
            <h3 style={{ fontFamily: "var(--font-heading)", fontSize: "1.15rem", fontWeight: 700 }}>
              📦 Configurações Globais do Agente de Host (Outbound)
            </h3>
            <p style={{ fontSize: "0.8rem", color: "var(--text-secondary)", marginTop: "0.2rem" }}>
              Parâmetros de auto-registro (Enrollment), intervalos de heartbeat e nível padrão de autonomia.
            </p>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "1.25rem" }}>
            <div>
              <label style={{ display: "block", fontSize: "0.85rem", color: "var(--text-secondary)", marginBottom: "0.35rem" }}>Endpoint de Enrollment *</label>
              <input type="text" value={settings.agent.enrollmentEndpointUrl} onChange={(e) => setSettings({ ...settings, agent: { ...settings.agent, enrollmentEndpointUrl: e.target.value } })} style={{ width: "100%", padding: "0.6rem", background: "rgba(0,0,0,0.3)", border: "1px solid var(--border-subtle)", color: "#fff", borderRadius: "6px" }} />
            </div>

            <div>
              <label style={{ display: "block", fontSize: "0.85rem", color: "var(--text-secondary)", marginBottom: "0.35rem" }}>Intervalo de Heartbeat (Segundos)</label>
              <input type="number" value={settings.agent.defaultHeartbeatIntervalSeconds} onChange={(e) => setSettings({ ...settings, agent: { ...settings.agent, defaultHeartbeatIntervalSeconds: Number(e.target.value) } })} style={{ width: "100%", padding: "0.6rem", background: "rgba(0,0,0,0.3)", border: "1px solid var(--border-subtle)", color: "#fff", borderRadius: "6px" }} />
            </div>

            <div>
              <label style={{ display: "block", fontSize: "0.85rem", color: "var(--text-secondary)", marginBottom: "0.35rem" }}>Timeout de Host Offline (Segundos)</label>
              <input type="number" value={settings.agent.hostOfflineThresholdSeconds} onChange={(e) => setSettings({ ...settings, agent: { ...settings.agent, hostOfflineThresholdSeconds: Number(e.target.value) } })} style={{ width: "100%", padding: "0.6rem", background: "rgba(0,0,0,0.3)", border: "1px solid var(--border-subtle)", color: "#fff", borderRadius: "6px" }} />
            </div>

            <div>
              <label style={{ display: "block", fontSize: "0.85rem", color: "var(--text-secondary)", marginBottom: "0.35rem" }}>Nível de Autonomia Inicial</label>
              <select
                value={settings.agent.defaultAutonomyLevel}
                onChange={(e) => setSettings({ ...settings, agent: { ...settings.agent, defaultAutonomyLevel: Number(e.target.value) } })}
                style={{ width: "100%", padding: "0.6rem", background: "rgba(0,0,0,0.3)", border: "1px solid var(--border-subtle)", color: "#fff", borderRadius: "6px" }}
              >
                <option value={0}>L0: Somente Observação</option>
                <option value={1}>L1: Assistido (Aprovação Obrigatória)</option>
                <option value={2}>L2: Autônomo para Baixo Risco</option>
                <option value={3}>L3: Totalmente Autônomo sob Guardiões</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* TAB 8: BRANDING & WHITE-LABEL */}
      {activeTab === "branding" && (
        <div className="glass-panel" style={{ padding: "1.75rem" }}>
          <div style={{ marginBottom: "1.5rem" }}>
            <h3 style={{ fontFamily: "var(--font-heading)", fontSize: "1.15rem", fontWeight: 700 }}>
              🏢 Personalização Visual, White-Label & Suporte MSP
            </h3>
            <p style={{ fontSize: "0.8rem", color: "var(--text-secondary)", marginTop: "0.2rem" }}>
              Identidade visual para entrega de painéis personalizados e canais de contato da sua consultoria MSP.
            </p>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "1.25rem" }}>
            <div>
              <label style={{ display: "block", fontSize: "0.85rem", color: "var(--text-secondary)", marginBottom: "0.35rem" }}>Nome da Plataforma</label>
              <input type="text" value={settings.branding.platformName} onChange={(e) => setSettings({ ...settings, branding: { ...settings.branding, platformName: e.target.value } })} placeholder="InfraOps AI" style={{ width: "100%", padding: "0.6rem", background: "rgba(0,0,0,0.3)", border: "1px solid var(--border-subtle)", color: "#fff", borderRadius: "6px" }} />
            </div>

            <div>
              <label style={{ display: "block", fontSize: "0.85rem", color: "var(--text-secondary)", marginBottom: "0.35rem" }}>Nome da Empresa MSP</label>
              <input type="text" value={settings.branding.companyName} onChange={(e) => setSettings({ ...settings, branding: { ...settings.branding, companyName: e.target.value } })} placeholder="WR Tecnologia" style={{ width: "100%", padding: "0.6rem", background: "rgba(0,0,0,0.3)", border: "1px solid var(--border-subtle)", color: "#fff", borderRadius: "6px" }} />
            </div>

            <div>
              <label style={{ display: "block", fontSize: "0.85rem", color: "var(--text-secondary)", marginBottom: "0.35rem" }}>E-mail de Suporte ao Cliente</label>
              <input type="email" value={settings.branding.supportEmail} onChange={(e) => setSettings({ ...settings, branding: { ...settings.branding, supportEmail: e.target.value } })} placeholder="suporte@wrtec.com.br" style={{ width: "100%", padding: "0.6rem", background: "rgba(0,0,0,0.3)", border: "1px solid var(--border-subtle)", color: "#fff", borderRadius: "6px" }} />
            </div>

            <div>
              <label style={{ display: "block", fontSize: "0.85rem", color: "var(--text-secondary)", marginBottom: "0.35rem" }}>WhatsApp do Suporte</label>
              <input type="text" value={settings.branding.supportWhatsapp} onChange={(e) => setSettings({ ...settings, branding: { ...settings.branding, supportWhatsapp: e.target.value } })} placeholder="5511999998888" style={{ width: "100%", padding: "0.6rem", background: "rgba(0,0,0,0.3)", border: "1px solid var(--border-subtle)", color: "#fff", borderRadius: "6px" }} />
            </div>

            <div style={{ gridColumn: "1 / -1" }}>
              <label style={{ display: "block", fontSize: "0.85rem", color: "var(--text-secondary)", marginBottom: "0.35rem" }}>Texto de Rodapé Personalizado</label>
              <input type="text" value={settings.branding.customFooterText} onChange={(e) => setSettings({ ...settings, branding: { ...settings.branding, customFooterText: e.target.value } })} style={{ width: "100%", padding: "0.6rem", background: "rgba(0,0,0,0.3)", border: "1px solid var(--border-subtle)", color: "#fff", borderRadius: "6px" }} />
            </div>
          </div>
        </div>
      )}

      {/* TAB 9: SECURITY */}
      {activeTab === "security" && (
        <div className="glass-panel" style={{ padding: "1.75rem" }}>
          <div style={{ marginBottom: "1.5rem" }}>
            <h3 style={{ fontFamily: "var(--font-heading)", fontSize: "1.15rem", fontWeight: 700 }}>
              🔐 Políticas de Segurança, Chave Mestra & Sessões
            </h3>
            <p style={{ fontSize: "0.8rem", color: "var(--text-secondary)", marginTop: "0.2rem" }}>
              Parâmetros de conformidade, bloqueio por força bruta e auditoria criptográfica.
            </p>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "1.25rem" }}>
            <div>
              <label style={{ display: "block", fontSize: "0.85rem", color: "var(--text-secondary)", marginBottom: "0.35rem" }}>Duração da Sessão JWT (Horas)</label>
              <input type="number" value={settings.security.sessionTtlHours} onChange={(e) => setSettings({ ...settings, security: { ...settings.security, sessionTtlHours: Number(e.target.value) } })} style={{ width: "100%", padding: "0.6rem", background: "rgba(0,0,0,0.3)", border: "1px solid var(--border-subtle)", color: "#fff", borderRadius: "6px" }} />
            </div>

            <div>
              <label style={{ display: "block", fontSize: "0.85rem", color: "var(--text-secondary)", marginBottom: "0.35rem" }}>Tentativas Falhas Antes de Bloqueio</label>
              <input type="number" value={settings.security.maxFailedLogins} onChange={(e) => setSettings({ ...settings, security: { ...settings.security, maxFailedLogins: Number(e.target.value) } })} style={{ width: "100%", padding: "0.6rem", background: "rgba(0,0,0,0.3)", border: "1px solid var(--border-subtle)", color: "#fff", borderRadius: "6px" }} />
            </div>

            <div>
              <label style={{ display: "block", fontSize: "0.85rem", color: "var(--text-secondary)", marginBottom: "0.35rem" }}>Tempo de Bloqueio (Minutos)</label>
              <input type="number" value={settings.security.lockoutDurationMinutes} onChange={(e) => setSettings({ ...settings, security: { ...settings.security, lockoutDurationMinutes: Number(e.target.value) } })} style={{ width: "100%", padding: "0.6rem", background: "rgba(0,0,0,0.3)", border: "1px solid var(--border-subtle)", color: "#fff", borderRadius: "6px" }} />
            </div>

            <div>
              <label style={{ display: "block", fontSize: "0.85rem", color: "var(--text-secondary)", marginBottom: "0.35rem" }}>Tamanho Mínimo de Senha</label>
              <input type="number" value={settings.security.minPasswordLength} onChange={(e) => setSettings({ ...settings, security: { ...settings.security, minPasswordLength: Number(e.target.value) } })} style={{ width: "100%", padding: "0.6rem", background: "rgba(0,0,0,0.3)", border: "1px solid var(--border-subtle)", color: "#fff", borderRadius: "6px" }} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
