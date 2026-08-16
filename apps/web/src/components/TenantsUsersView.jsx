import React, { useState } from "react";

export function TenantsUsersView({ tenants, users, onAddTenant, onAddUser }) {
  const [tenantModalOpen, setTenantModalOpen] = useState(false);
  const [userModalOpen, setUserModalOpen] = useState(false);

  const [tenantForm, setTenantForm] = useState({ name: "", domain: "" });
  const [userForm, setUserForm] = useState({ tenantId: tenants[0]?.id || "", name: "", email: "", role: "operator" });

  const handleCreateTenant = (e) => {
    e.preventDefault();
    if (!tenantForm.name) return;
    onAddTenant(tenantForm);
    setTenantForm({ name: "", domain: "" });
    setTenantModalOpen(false);
  };

  const handleCreateUser = (e) => {
    e.preventDefault();
    if (!userForm.name || !userForm.email) return;
    onAddUser(userForm);
    setUserForm({ tenantId: tenants[0]?.id || "", name: "", email: "", role: "operator" });
    setUserModalOpen(false);
  };

  return (
    <div style={{ padding: "1.5rem 2rem" }}>
      {/* Tenants Section */}
      <div className="glass-panel" style={{ padding: "1.5rem", marginBottom: "1.5rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
          <h2 style={{ fontFamily: "var(--font-heading)", fontSize: "1.2rem", fontWeight: 700 }}>
            🏢 Clientes Registrados (Tenants)
          </h2>
          <button className="btn btn-primary" onClick={() => setTenantModalOpen(true)}>
            + Cadastrar Novo Cliente
          </button>
        </div>

        <table className="custom-table">
          <thead>
            <tr>
              <th>ID Tenant</th>
              <th>Nome do Cliente</th>
              <th>Domínio</th>
              <th>Data de Cadastro</th>
            </tr>
          </thead>
          <tbody>
            {tenants.map((t) => (
              <tr key={t.id}>
                <td style={{ fontFamily: "var(--font-mono)", color: "var(--accent-indigo)" }}>{t.id}</td>
                <td style={{ fontWeight: 600 }}>{t.name}</td>
                <td style={{ color: "var(--text-secondary)" }}>{t.domain}</td>
                <td style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>{new Date(t.createdAt).toLocaleDateString("pt-BR")}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Users Section */}
      <div className="glass-panel" style={{ padding: "1.5rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
          <h2 style={{ fontFamily: "var(--font-heading)", fontSize: "1.2rem", fontWeight: 700 }}>
            👥 Usuários & Permissões (RBAC)
          </h2>
          <button className="btn btn-primary" onClick={() => setUserModalOpen(true)}>
            + Cadastrar Novo Usuário
          </button>
        </div>

        <table className="custom-table">
          <thead>
            <tr>
              <th>Nome</th>
              <th>E-mail</th>
              <th>Tenant Pertencente</th>
              <th>Papel (Role RBAC)</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id}>
                <td style={{ fontWeight: 600 }}>{u.name}</td>
                <td style={{ color: "var(--text-secondary)" }}>{u.email}</td>
                <td>
                  <span className="tenant-badge">{tenants.find((t) => t.id === u.tenantId)?.name || u.tenantId}</span>
                </td>
                <td>
                  <span className={`badge badge-${u.role === "owner" || u.role === "administrator" ? "online" : "requires_approval"}`}>
                    {u.role.toUpperCase()}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal Novo Tenant */}
      {tenantModalOpen && (
        <div className="modal-overlay">
          <div className="glass-panel modal-content">
            <h3 style={{ fontFamily: "var(--font-heading)", fontSize: "1.2rem", marginBottom: "1rem" }}>🏢 Cadastrar Novo Cliente / Tenant</h3>
            <form onSubmit={handleCreateTenant}>
              <div style={{ marginBottom: "1rem" }}>
                <label style={{ display: "block", fontSize: "0.85rem", color: "var(--text-secondary)", marginBottom: "0.35rem" }}>Nome da Empresa / Cliente</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Empresa ACME Ltda"
                  value={tenantForm.name}
                  onChange={(e) => setTenantForm({ ...tenantForm, name: e.target.value })}
                  style={{ width: "100%", padding: "0.6rem", background: "rgba(0,0,0,0.3)", border: "1px solid var(--border-subtle)", color: "#fff", borderRadius: "6px" }}
                />
              </div>

              <div style={{ marginBottom: "1.5rem" }}>
                <label style={{ display: "block", fontSize: "0.85rem", color: "var(--text-secondary)", marginBottom: "0.35rem" }}>Domínio Principal</label>
                <input
                  type="text"
                  placeholder="Ex: acme.com.br"
                  value={tenantForm.domain}
                  onChange={(e) => setTenantForm({ ...tenantForm, domain: e.target.value })}
                  style={{ width: "100%", padding: "0.6rem", background: "rgba(0,0,0,0.3)", border: "1px solid var(--border-subtle)", color: "#fff", borderRadius: "6px" }}
                />
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem" }}>
                <button type="button" className="btn btn-secondary" onClick={() => setTenantModalOpen(false)}>Cancelar</button>
                <button type="submit" className="btn btn-primary">Salvar Cliente</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Novo Usuário */}
      {userModalOpen && (
        <div className="modal-overlay">
          <div className="glass-panel modal-content">
            <h3 style={{ fontFamily: "var(--font-heading)", fontSize: "1.2rem", marginBottom: "1rem" }}>👥 Cadastrar Novo Usuário</h3>
            <form onSubmit={handleCreateUser}>
              <div style={{ marginBottom: "1rem" }}>
                <label style={{ display: "block", fontSize: "0.85rem", color: "var(--text-secondary)", marginBottom: "0.35rem" }}>Nome Completo</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Maria Silva"
                  value={userForm.name}
                  onChange={(e) => setUserForm({ ...userForm, name: e.target.value })}
                  style={{ width: "100%", padding: "0.6rem", background: "rgba(0,0,0,0.3)", border: "1px solid var(--border-subtle)", color: "#fff", borderRadius: "6px" }}
                />
              </div>

              <div style={{ marginBottom: "1rem" }}>
                <label style={{ display: "block", fontSize: "0.85rem", color: "var(--text-secondary)", marginBottom: "0.35rem" }}>E-mail</label>
                <input
                  type="email"
                  required
                  placeholder="maria@empresa.com.br"
                  value={userForm.email}
                  onChange={(e) => setUserForm({ ...userForm, email: e.target.value })}
                  style={{ width: "100%", padding: "0.6rem", background: "rgba(0,0,0,0.3)", border: "1px solid var(--border-subtle)", color: "#fff", borderRadius: "6px" }}
                />
              </div>

              <div style={{ marginBottom: "1rem" }}>
                <label style={{ display: "block", fontSize: "0.85rem", color: "var(--text-secondary)", marginBottom: "0.35rem" }}>Cliente / Tenant</label>
                <select
                  value={userForm.tenantId}
                  onChange={(e) => setUserForm({ ...userForm, tenantId: e.target.value })}
                  style={{ width: "100%", padding: "0.6rem", background: "rgba(0,0,0,0.3)", border: "1px solid var(--border-subtle)", color: "#fff", borderRadius: "6px" }}
                >
                  {tenants.map((t) => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
              </div>

              <div style={{ marginBottom: "1.5rem" }}>
                <label style={{ display: "block", fontSize: "0.85rem", color: "var(--text-secondary)", marginBottom: "0.35rem" }}>Papel (RBAC Role)</label>
                <select
                  value={userForm.role}
                  onChange={(e) => setUserForm({ ...userForm, role: e.target.value })}
                  style={{ width: "100%", padding: "0.6rem", background: "rgba(0,0,0,0.3)", border: "1px solid var(--border-subtle)", color: "#fff", borderRadius: "6px" }}
                >
                  <option value="owner">Owner (Acesso Total + Gestão de Contas)</option>
                  <option value="administrator">Administrator (Ações de Sistema + Políticas)</option>
                  <option value="operator">Operator (Execução de Jobs + Diagnóstico)</option>
                  <option value="viewer">Viewer (Apenas Leitura)</option>
                </select>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem" }}>
                <button type="button" className="btn btn-secondary" onClick={() => setUserModalOpen(false)}>Cancelar</button>
                <button type="submit" className="btn btn-primary">Salvar Usuário</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
