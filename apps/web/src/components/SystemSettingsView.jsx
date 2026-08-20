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
    security: {
      sessionTtlHours: 24,
      maxFailedLogins: 5,
      lockoutDurationMinutes: 15,
      requireMfa: false,
      minPasswordLength: 8,
      requirePasswordSpecialChar: true,
    },
  });

  const [showSmtpPass, setShowSmtpPass] = useState(false);
  const [showS3Secret, setShowS3Secret] = useState(false);
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
            ai: { ...prev.ai, ...(data.settings.ai || {}) },
            security: { ...prev.security, ...(data.settings.security || {}) },
          }));
        }
      })
      .catch((err) => console.warn("Failed to fetch system settings:", err))
      .finally(() => setLoading(false));
  }, []);

  const handleSaveSettings = async (e) => {
    e.preventDefault();
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
    <div style={{ padding: "1.5rem 2rem", maxWidth: "1200px", margin: "0 auto" }}>
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
            ⚙️ Configurações Gerais do Sistema
          </h1>
          <p style={{ color: "var(--text-secondary)", fontSize: "0.85rem", marginTop: "0.25rem" }}>
            Parametrização global de conectividade: SMTP, S3 Object Storage, Banco de Dados, Provedores de IA e Segurança.
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

      {/* Navigation Tabs */}
      <div style={{ display: "flex", gap: "0.5rem", borderBottom: "1px solid var(--border-subtle)", marginBottom: "1.5rem", flexWrap: "wrap" }}>
        {[
          { id: "smtp", label: "📧 Servidor SMTP (E-mail)" },
          { id: "s3", label: "🪣 Storage S3 / MinIO" },
          { id: "database", label: "🗄️ Banco de Dados" },
          { id: "ai", label: "🤖 Provedores de IA & LLM" },
          { id: "security", label: "🔐 Segurança & Acesso" },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => {
              setActiveTab(tab.id);
              setTestResult(null);
            }}
            style={{
              padding: "0.65rem 1.1rem",
              background: activeTab === tab.id ? "rgba(99, 102, 241, 0.18)" : "transparent",
              border: "none",
              borderBottom: activeTab === tab.id ? "2px solid var(--accent-indigo)" : "2px solid transparent",
              color: activeTab === tab.id ? "#fff" : "var(--text-secondary)",
              fontWeight: activeTab === tab.id ? 700 : 500,
              cursor: "pointer",
              fontSize: "0.88rem",
              transition: "all 0.2s",
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
                📧 Configuração do Servidor SMTP / E-mail Transacional
              </h3>
              <p style={{ fontSize: "0.8rem", color: "var(--text-secondary)", marginTop: "0.2rem" }}>
                Utilizado para recuperação de senhas, alertas críticos de incidentes e relatórios executivos para clientes.
              </p>
            </div>
            <button
              type="button"
              onClick={handleTestSmtp}
              disabled={testing}
              className="btn btn-secondary"
              style={{ fontSize: "0.85rem" }}
            >
              {testing ? "⏳ Testando..." : "⚡ Testar Conexão SMTP"}
            </button>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "1.25rem" }}>
            <div>
              <label style={{ display: "block", fontSize: "0.85rem", color: "var(--text-secondary)", marginBottom: "0.35rem" }}>
                Status do Envio SMTP
              </label>
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
              <label style={{ display: "block", fontSize: "0.85rem", color: "var(--text-secondary)", marginBottom: "0.35rem" }}>
                Host SMTP (Servidor de Saída) *
              </label>
              <input
                type="text"
                placeholder="smtp.empresa.com.br ou smtp.sendgrid.net"
                value={settings.smtp.host}
                onChange={(e) => setSettings({ ...settings, smtp: { ...settings.smtp, host: e.target.value } })}
                style={{ width: "100%", padding: "0.6rem", background: "rgba(0,0,0,0.3)", border: "1px solid var(--border-subtle)", color: "#fff", borderRadius: "6px" }}
              />
            </div>

            <div>
              <label style={{ display: "block", fontSize: "0.85rem", color: "var(--text-secondary)", marginBottom: "0.35rem" }}>
                Porta SMTP *
              </label>
              <input
                type="number"
                placeholder="587 ou 465"
                value={settings.smtp.port}
                onChange={(e) => setSettings({ ...settings, smtp: { ...settings.smtp, port: Number(e.target.value) } })}
                style={{ width: "100%", padding: "0.6rem", background: "rgba(0,0,0,0.3)", border: "1px solid var(--border-subtle)", color: "#fff", borderRadius: "6px" }}
              />
            </div>

            <div>
              <label style={{ display: "block", fontSize: "0.85rem", color: "var(--text-secondary)", marginBottom: "0.35rem" }}>
                Segurança / Criptografia
              </label>
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
              <label style={{ display: "block", fontSize: "0.85rem", color: "var(--text-secondary)", marginBottom: "0.35rem" }}>
                Usuário / Login SMTP
              </label>
              <input
                type="text"
                placeholder="usuario@empresa.com.br ou apikey"
                value={settings.smtp.user}
                onChange={(e) => setSettings({ ...settings, smtp: { ...settings.smtp, user: e.target.value } })}
                style={{ width: "100%", padding: "0.6rem", background: "rgba(0,0,0,0.3)", border: "1px solid var(--border-subtle)", color: "#fff", borderRadius: "6px" }}
              />
            </div>

            <div>
              <label style={{ display: "block", fontSize: "0.85rem", color: "var(--text-secondary)", marginBottom: "0.35rem" }}>
                Senha / Chave API SMTP
              </label>
              <div style={{ display: "flex", gap: "0.5rem" }}>
                <input
                  type={showSmtpPass ? "text" : "password"}
                  placeholder="Deixe em branco para manter a atual"
                  value={settings.smtp.password}
                  onChange={(e) => setSettings({ ...settings, smtp: { ...settings.smtp, password: e.target.value } })}
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
              <label style={{ display: "block", fontSize: "0.85rem", color: "var(--text-secondary)", marginBottom: "0.35rem" }}>
                Nome do Remetente (From Name)
              </label>
              <input
                type="text"
                placeholder="Ex: InfraOps AI Security"
                value={settings.smtp.fromName}
                onChange={(e) => setSettings({ ...settings, smtp: { ...settings.smtp, fromName: e.target.value } })}
                style={{ width: "100%", padding: "0.6rem", background: "rgba(0,0,0,0.3)", border: "1px solid var(--border-subtle)", color: "#fff", borderRadius: "6px" }}
              />
            </div>

            <div>
              <label style={{ display: "block", fontSize: "0.85rem", color: "var(--text-secondary)", marginBottom: "0.35rem" }}>
                E-mail do Remetente (From Address)
              </label>
              <input
                type="email"
                placeholder="noc@empresa.com.br"
                value={settings.smtp.fromEmail}
                onChange={(e) => setSettings({ ...settings, smtp: { ...settings.smtp, fromEmail: e.target.value } })}
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
                Destino seguro para logs de auditoria, backups de workloads, relatórios executivos e artefatos de IA.
              </p>
            </div>
            <button
              type="button"
              onClick={handleTestS3}
              disabled={testing}
              className="btn btn-secondary"
              style={{ fontSize: "0.85rem" }}
            >
              {testing ? "⏳ Testando..." : "⚡ Testar Conexão S3"}
            </button>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "1.25rem" }}>
            <div>
              <label style={{ display: "block", fontSize: "0.85rem", color: "var(--text-secondary)", marginBottom: "0.35rem" }}>
                Endpoint S3 (URL Base) *
              </label>
              <input
                type="text"
                placeholder="https://s3.infraopsai.awecloudsolution.com"
                value={settings.s3.endpoint}
                onChange={(e) => setSettings({ ...settings, s3: { ...settings.s3, endpoint: e.target.value } })}
                style={{ width: "100%", padding: "0.6rem", background: "rgba(0,0,0,0.3)", border: "1px solid var(--border-subtle)", color: "#fff", borderRadius: "6px" }}
              />
            </div>

            <div>
              <label style={{ display: "block", fontSize: "0.85rem", color: "var(--text-secondary)", marginBottom: "0.35rem" }}>
                Bucket Name *
              </label>
              <input
                type="text"
                placeholder="infraops-artifacts"
                value={settings.s3.bucket}
                onChange={(e) => setSettings({ ...settings, s3: { ...settings.s3, bucket: e.target.value } })}
                style={{ width: "100%", padding: "0.6rem", background: "rgba(0,0,0,0.3)", border: "1px solid var(--border-subtle)", color: "#fff", borderRadius: "6px" }}
              />
            </div>

            <div>
              <label style={{ display: "block", fontSize: "0.85rem", color: "var(--text-secondary)", marginBottom: "0.35rem" }}>
                Região S3
              </label>
              <input
                type="text"
                placeholder="us-east-1 ou sa-east-1"
                value={settings.s3.region}
                onChange={(e) => setSettings({ ...settings, s3: { ...settings.s3, region: e.target.value } })}
                style={{ width: "100%", padding: "0.6rem", background: "rgba(0,0,0,0.3)", border: "1px solid var(--border-subtle)", color: "#fff", borderRadius: "6px" }}
              />
            </div>

            <div>
              <label style={{ display: "block", fontSize: "0.85rem", color: "var(--text-secondary)", marginBottom: "0.35rem" }}>
                Access Key (Chave de Acesso)
              </label>
              <input
                type="text"
                value={settings.s3.accessKey}
                onChange={(e) => setSettings({ ...settings, s3: { ...settings.s3, accessKey: e.target.value } })}
                style={{ width: "100%", padding: "0.6rem", background: "rgba(0,0,0,0.3)", border: "1px solid var(--border-subtle)", color: "#fff", borderRadius: "6px" }}
              />
            </div>

            <div>
              <label style={{ display: "block", fontSize: "0.85rem", color: "var(--text-secondary)", marginBottom: "0.35rem" }}>
                Secret Key (Chave Secreta)
              </label>
              <div style={{ display: "flex", gap: "0.5rem" }}>
                <input
                  type={showS3Secret ? "text" : "password"}
                  placeholder="Deixe em branco para manter a atual"
                  value={settings.s3.secretKey}
                  onChange={(e) => setSettings({ ...settings, s3: { ...settings.s3, secretKey: e.target.value } })}
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
              <label style={{ display: "block", fontSize: "0.85rem", color: "var(--text-secondary)", marginBottom: "0.35rem" }}>
                Estilo de Caminho (Path-Style)
              </label>
              <select
                value={settings.s3.forcePathStyle ? "true" : "false"}
                onChange={(e) => setSettings({ ...settings, s3: { ...settings.s3, forcePathStyle: e.target.value === "true" } })}
                style={{ width: "100%", padding: "0.6rem", background: "rgba(0,0,0,0.3)", border: "1px solid var(--border-subtle)", color: "#fff", borderRadius: "6px" }}
              >
                <option value="true">Force Path Style (MinIO / Ceph / Localstack)</option>
                <option value="false">Virtual Hosted Style (AWS S3 Oficial)</option>
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
              🗄️ Parâmetros do Banco de Dados Relacional (PostgreSQL)
            </h3>
            <p style={{ fontSize: "0.8rem", color: "var(--text-secondary)", marginTop: "0.2rem" }}>
              Armazenamento transacional de inventário, auditoria SHA-256 e políticas operacionais.
            </p>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "1.25rem" }}>
            <div>
              <label style={{ display: "block", fontSize: "0.85rem", color: "var(--text-secondary)", marginBottom: "0.35rem" }}>
                Motor do Banco
              </label>
              <input
                type="text"
                disabled
                value={settings.database.provider}
                style={{ width: "100%", padding: "0.6rem", background: "rgba(0,0,0,0.4)", border: "1px solid var(--border-subtle)", color: "var(--accent-indigo)", fontWeight: 700, borderRadius: "6px" }}
              />
            </div>

            <div>
              <label style={{ display: "block", fontSize: "0.85rem", color: "var(--text-secondary)", marginBottom: "0.35rem" }}>
                Host do PostgreSQL
              </label>
              <input
                type="text"
                value={settings.database.host}
                onChange={(e) => setSettings({ ...settings, database: { ...settings.database, host: e.target.value } })}
                style={{ width: "100%", padding: "0.6rem", background: "rgba(0,0,0,0.3)", border: "1px solid var(--border-subtle)", color: "#fff", borderRadius: "6px" }}
              />
            </div>

            <div>
              <label style={{ display: "block", fontSize: "0.85rem", color: "var(--text-secondary)", marginBottom: "0.35rem" }}>
                Porta
              </label>
              <input
                type="number"
                value={settings.database.port}
                onChange={(e) => setSettings({ ...settings, database: { ...settings.database, port: Number(e.target.value) } })}
                style={{ width: "100%", padding: "0.6rem", background: "rgba(0,0,0,0.3)", border: "1px solid var(--border-subtle)", color: "#fff", borderRadius: "6px" }}
              />
            </div>

            <div>
              <label style={{ display: "block", fontSize: "0.85rem", color: "var(--text-secondary)", marginBottom: "0.35rem" }}>
                Nome do Banco (Database)
              </label>
              <input
                type="text"
                value={settings.database.database}
                onChange={(e) => setSettings({ ...settings, database: { ...settings.database, database: e.target.value } })}
                style={{ width: "100%", padding: "0.6rem", background: "rgba(0,0,0,0.3)", border: "1px solid var(--border-subtle)", color: "#fff", borderRadius: "6px" }}
              />
            </div>

            <div>
              <label style={{ display: "block", fontSize: "0.85rem", color: "var(--text-secondary)", marginBottom: "0.35rem" }}>
                Usuário do Banco
              </label>
              <input
                type="text"
                value={settings.database.user}
                onChange={(e) => setSettings({ ...settings, database: { ...settings.database, user: e.target.value } })}
                style={{ width: "100%", padding: "0.6rem", background: "rgba(0,0,0,0.3)", border: "1px solid var(--border-subtle)", color: "#fff", borderRadius: "6px" }}
              />
            </div>

            <div>
              <label style={{ display: "block", fontSize: "0.85rem", color: "var(--text-secondary)", marginBottom: "0.35rem" }}>
                Pool Máximo de Conexões
              </label>
              <input
                type="number"
                value={settings.database.maxConnections}
                onChange={(e) => setSettings({ ...settings, database: { ...settings.database, maxConnections: Number(e.target.value) } })}
                style={{ width: "100%", padding: "0.6rem", background: "rgba(0,0,0,0.3)", border: "1px solid var(--border-subtle)", color: "#fff", borderRadius: "6px" }}
              />
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: AI & LLM PROVIDERS */}
      {activeTab === "ai" && (
        <div className="glass-panel" style={{ padding: "1.75rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem", flexWrap: "wrap", gap: "0.75rem" }}>
            <div>
              <h3 style={{ fontFamily: "var(--font-heading)", fontSize: "1.15rem", fontWeight: 700 }}>
                🤖 Provedores de Inteligência Artificial & LLMs Operacionais
              </h3>
              <p style={{ fontSize: "0.8rem", color: "var(--text-secondary)", marginTop: "0.2rem" }}>
                Motores de inferência para o Console de IA, Advisor de Infraestrutura e diagnóstico de incidentes.
              </p>
            </div>
            <button
              type="button"
              onClick={handleTestAi}
              disabled={testing}
              className="btn btn-secondary"
              style={{ fontSize: "0.85rem" }}
            >
              {testing ? "⏳ Testando..." : "⚡ Testar Provedor de IA"}
            </button>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "1.25rem" }}>
            <div>
              <label style={{ display: "block", fontSize: "0.85rem", color: "var(--text-secondary)", marginBottom: "0.35rem" }}>
                Provedor Padrão Ativo
              </label>
              <select
                value={settings.ai.defaultProvider}
                onChange={(e) => setSettings({ ...settings, ai: { ...settings.ai, defaultProvider: e.target.value } })}
                style={{ width: "100%", padding: "0.6rem", background: "rgba(0,0,0,0.3)", border: "1px solid var(--border-subtle)", color: "#fff", borderRadius: "6px" }}
              >
                <option value="openai">OpenAI (GPT-4o / GPT-4o-mini)</option>
                <option value="anthropic">Anthropic (Claude 3.5 Sonnet)</option>
                <option value="gemini">Google Gemini (Gemini 1.5 Pro)</option>
                <option value="ollama">Ollama (LLM Local / On-Premise)</option>
              </select>
            </div>

            <div>
              <label style={{ display: "block", fontSize: "0.85rem", color: "var(--text-secondary)", marginBottom: "0.35rem" }}>
                Chave API OpenAI
              </label>
              <input
                type="password"
                placeholder="sk-proj-••••••••••••"
                value={settings.ai.openaiApiKey}
                onChange={(e) => setSettings({ ...settings, ai: { ...settings.ai, openaiApiKey: e.target.value } })}
                style={{ width: "100%", padding: "0.6rem", background: "rgba(0,0,0,0.3)", border: "1px solid var(--border-subtle)", color: "#fff", borderRadius: "6px" }}
              />
            </div>

            <div>
              <label style={{ display: "block", fontSize: "0.85rem", color: "var(--text-secondary)", marginBottom: "0.35rem" }}>
                URL Ollama Local (On-Premise)
              </label>
              <input
                type="text"
                placeholder="http://localhost:11434"
                value={settings.ai.ollamaBaseUrl}
                onChange={(e) => setSettings({ ...settings, ai: { ...settings.ai, ollamaBaseUrl: e.target.value } })}
                style={{ width: "100%", padding: "0.6rem", background: "rgba(0,0,0,0.3)", border: "1px solid var(--border-subtle)", color: "#fff", borderRadius: "6px" }}
              />
            </div>

            <div>
              <label style={{ display: "block", fontSize: "0.85rem", color: "var(--text-secondary)", marginBottom: "0.35rem" }}>
                Modelo Ollama
              </label>
              <input
                type="text"
                placeholder="llama3.1:8b, mistral, qwen2.5"
                value={settings.ai.ollamaModel}
                onChange={(e) => setSettings({ ...settings, ai: { ...settings.ai, ollamaModel: e.target.value } })}
                style={{ width: "100%", padding: "0.6rem", background: "rgba(0,0,0,0.3)", border: "1px solid var(--border-subtle)", color: "#fff", borderRadius: "6px" }}
              />
            </div>

            <div>
              <label style={{ display: "block", fontSize: "0.85rem", color: "var(--text-secondary)", marginBottom: "0.35rem" }}>
                Temperatura ({settings.ai.temperature})
              </label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={settings.ai.temperature}
                onChange={(e) => setSettings({ ...settings, ai: { ...settings.ai, temperature: Number(e.target.value) } })}
                style={{ width: "100%", marginTop: "0.4rem" }}
              />
            </div>

            <div>
              <label style={{ display: "block", fontSize: "0.85rem", color: "var(--text-secondary)", marginBottom: "0.35rem" }}>
                Limite de Tokens de Resposta
              </label>
              <input
                type="number"
                value={settings.ai.maxTokens}
                onChange={(e) => setSettings({ ...settings, ai: { ...settings.ai, maxTokens: Number(e.target.value) } })}
                style={{ width: "100%", padding: "0.6rem", background: "rgba(0,0,0,0.3)", border: "1px solid var(--border-subtle)", color: "#fff", borderRadius: "6px" }}
              />
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: SECURITY */}
      {activeTab === "security" && (
        <div className="glass-panel" style={{ padding: "1.75rem" }}>
          <div style={{ marginBottom: "1.5rem" }}>
            <h3 style={{ fontFamily: "var(--font-heading)", fontSize: "1.15rem", fontWeight: 700 }}>
              🔐 Políticas de Segurança, Autenticação & Sessões
            </h3>
            <p style={{ fontSize: "0.8rem", color: "var(--text-secondary)", marginTop: "0.2rem" }}>
              Parâmetros globais de conformidade, tempo de expiração e tolerância a falhas de autenticação.
            </p>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "1.25rem" }}>
            <div>
              <label style={{ display: "block", fontSize: "0.85rem", color: "var(--text-secondary)", marginBottom: "0.35rem" }}>
                Duração da Sessão JWT (Horas)
              </label>
              <input
                type="number"
                value={settings.security.sessionTtlHours}
                onChange={(e) => setSettings({ ...settings, security: { ...settings.security, sessionTtlHours: Number(e.target.value) } })}
                style={{ width: "100%", padding: "0.6rem", background: "rgba(0,0,0,0.3)", border: "1px solid var(--border-subtle)", color: "#fff", borderRadius: "6px" }}
              />
            </div>

            <div>
              <label style={{ display: "block", fontSize: "0.85rem", color: "var(--text-secondary)", marginBottom: "0.35rem" }}>
                Tentativas Falhas Antes de Bloqueio
              </label>
              <input
                type="number"
                value={settings.security.maxFailedLogins}
                onChange={(e) => setSettings({ ...settings, security: { ...settings.security, maxFailedLogins: Number(e.target.value) } })}
                style={{ width: "100%", padding: "0.6rem", background: "rgba(0,0,0,0.3)", border: "1px solid var(--border-subtle)", color: "#fff", borderRadius: "6px" }}
              />
            </div>

            <div>
              <label style={{ display: "block", fontSize: "0.85rem", color: "var(--text-secondary)", marginBottom: "0.35rem" }}>
                Tempo de Bloqueio Temporário (Minutos)
              </label>
              <input
                type="number"
                value={settings.security.lockoutDurationMinutes}
                onChange={(e) => setSettings({ ...settings, security: { ...settings.security, lockoutDurationMinutes: Number(e.target.value) } })}
                style={{ width: "100%", padding: "0.6rem", background: "rgba(0,0,0,0.3)", border: "1px solid var(--border-subtle)", color: "#fff", borderRadius: "6px" }}
              />
            </div>

            <div>
              <label style={{ display: "block", fontSize: "0.85rem", color: "var(--text-secondary)", marginBottom: "0.35rem" }}>
                Tamanho Mínimo de Senha
              </label>
              <input
                type="number"
                value={settings.security.minPasswordLength}
                onChange={(e) => setSettings({ ...settings, security: { ...settings.security, minPasswordLength: Number(e.target.value) } })}
                style={{ width: "100%", padding: "0.6rem", background: "rgba(0,0,0,0.3)", border: "1px solid var(--border-subtle)", color: "#fff", borderRadius: "6px" }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
