import React, { useState } from "react";

export function IntegrationsView({ integrations, activeTenant, onAddIntegration, onTriggerSync }) {
  const [modalOpen, setModalOpen] = useState(false);
  const [syncingId, setSyncingId] = useState(null);

  const [form, setForm] = useState({
    name: "",
    provider: "proxmox",
    baseUrl: "https://pve.example.com:8006",
    apiToken: "",
  });

  const handleCreate = (e) => {
    e.preventDefault();
    if (!form.name || !form.baseUrl) return;
    onAddIntegration({ ...form, tenantId: activeTenant.id });
    setForm({ name: "", provider: "proxmox", baseUrl: "https://pve.example.com:8006", apiToken: "" });
    setModalOpen(false);
  };

  const handleSyncClick = async (id) => {
    setSyncingId(id);
    await onTriggerSync(id);
    setSyncingId(null);
  };

  return (
    <div style={{ padding: "1.5rem 2rem" }}>
      <div className="glass-panel" style={{ padding: "1.5rem", marginBottom: "1.5rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
          <div>
            <h2 style={{ fontFamily: "var(--font-heading)", fontSize: "1.2rem", fontWeight: 700 }}>
              🔌 Integrações de Hipervisores (Proxmox VE & Virtualizor)
            </h2>
            <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)", marginTop: "0.25rem" }}>
              Cadastre instâncias de hipervisores para descoberta automática de Nós, VMs QEMU, LXC e Storages.
            </p>
          </div>
          <button className="btn btn-primary" onClick={() => setModalOpen(true)}>
            + Cadastrar Nova Integração
          </button>
        </div>

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
            {integrations.map((item) => (
              <tr key={item.id}>
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
                  <button
                    className="btn btn-secondary"
                    disabled={syncingId === item.id}
                    onClick={() => handleSyncClick(item.id)}
                    style={{ padding: "0.4rem 0.8rem", fontSize: "0.8rem" }}
                  >
                    {syncingId === item.id ? "🔄 Varrendo..." : "⚡ Sincronizar Agora"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal Nova Integração */}
      {modalOpen && (
        <div className="modal-overlay">
          <div className="glass-panel modal-content">
            <h3 style={{ fontFamily: "var(--font-heading)", fontSize: "1.2rem", marginBottom: "1rem" }}>
              🔌 Cadastrar Conexão de Hipervisor (Proxmox VE / Virtualizor)
            </h3>
            <form onSubmit={handleCreate}>
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
                  required
                  placeholder="Armazenado com criptografia AES-256-GCM"
                  value={form.apiToken}
                  onChange={(e) => setForm({ ...form, apiToken: e.target.value })}
                  style={{ width: "100%", padding: "0.6rem", background: "rgba(0,0,0,0.3)", border: "1px solid var(--border-subtle)", color: "#fff", borderRadius: "6px" }}
                />
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem" }}>
                <button type="button" className="btn btn-secondary" onClick={() => setModalOpen(false)}>Cancelar</button>
                <button type="submit" className="btn btn-primary">Salvar & Testar Conexão</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
