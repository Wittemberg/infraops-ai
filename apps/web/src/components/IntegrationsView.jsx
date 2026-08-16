import React, { useState } from "react";

export function IntegrationsView({ integrations, activeTenant, onAddIntegration, onUpdateIntegration, onTriggerSync }) {
  const [modalOpen, setModalOpen] = useState(false);
  const [editingIntegration, setEditingIntegration] = useState(null);
  const [syncingId, setSyncingId] = useState(null);

  const [form, setForm] = useState({
    name: "",
    provider: "proxmox",
    baseUrl: "https://pve.example.com:8006",
    apiToken: "",
  });

  const tenantIntegrations = integrations.filter((i) => i.tenantId === activeTenant?.id);

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

  return (
    <div style={{ padding: "1.5rem 2rem" }}>
      {/* Active Tenant Context Banner */}
      <div style={{ marginBottom: "1.5rem" }}>
        <div style={{ background: "rgba(99, 102, 241, 0.08)", border: "1px solid rgba(99, 102, 241, 0.2)", borderRadius: "8px", padding: "0.6rem 1rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>
            🏢 Exibindo conexões de hipervisores vinculadas ao cliente: <strong style={{ color: "var(--accent-indigo)" }}>{activeTenant?.name}</strong>
          </span>
          <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>Total: {tenantIntegrations.length} hipervisor(es)</span>
        </div>
      </div>

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
            + Cadastrar Nova Integração
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

      {/* Modal Nova/Editar Integração */}
      {modalOpen && (
        <div className="modal-overlay">
          <div className="glass-panel modal-content">
            <h3 style={{ fontFamily: "var(--font-heading)", fontSize: "1.2rem", marginBottom: "1rem" }}>
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
                <button type="button" className="btn btn-secondary" onClick={() => setModalOpen(false)}>Cancelar</button>
                <button type="submit" className="btn btn-primary">
                  {editingIntegration ? "Salvar Alterações" : "Salvar & Testar Conexão"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
