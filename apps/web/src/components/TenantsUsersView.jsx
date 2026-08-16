import React, { useState } from "react";

export function TenantsUsersView({
  tenants,
  users,
  activeTenant,
  onSelectTenant,
  onAddTenant,
  onUpdateTenant,
  onAddUser,
  onUpdateUser,
}) {
  const [tenantModalOpen, setTenantModalOpen] = useState(false);
  const [userModalOpen, setUserModalOpen] = useState(false);
  const [filterActiveTenantOnly, setFilterActiveTenantOnly] = useState(true);

  const [editingTenant, setEditingTenant] = useState(null);
  const [editingUser, setEditingUser] = useState(null);

  const [tenantForm, setTenantForm] = useState({ name: "", domain: "" });
  const [userForm, setUserForm] = useState({ tenantId: activeTenant?.id || tenants[0]?.id || "", name: "", email: "", role: "operator" });

  const displayedUsers = filterActiveTenantOnly && activeTenant
    ? users.filter((u) => u.tenantId === activeTenant.id)
    : users;

  const handleOpenAddTenant = () => {
    setEditingTenant(null);
    setTenantForm({ name: "", domain: "" });
    setTenantModalOpen(true);
  };

  const handleOpenEditTenant = (tenant) => {
    setEditingTenant(tenant);
    setTenantForm({ name: tenant.name, domain: tenant.domain || "" });
    setTenantModalOpen(true);
  };

  const handleOpenAddUser = () => {
    setEditingUser(null);
    setUserForm({ tenantId: activeTenant?.id || tenants[0]?.id || "", name: "", email: "", role: "operator" });
    setUserModalOpen(true);
  };

  const handleOpenEditUser = (user) => {
    setEditingUser(user);
    setUserForm({ tenantId: user.tenantId, name: user.name, email: user.email, role: user.role });
    setUserModalOpen(true);
  };

  const handleSaveTenant = (e) => {
    e.preventDefault();
    if (!tenantForm.name) return;

    if (editingTenant) {
      onUpdateTenant({ ...editingTenant, ...tenantForm });
    } else {
      onAddTenant(tenantForm);
    }

    setTenantModalOpen(false);
  };

  const handleSaveUser = (e) => {
    e.preventDefault();
    if (!userForm.name || !userForm.email) return;

    if (editingUser) {
      onUpdateUser({ ...editingUser, ...userForm });
    } else {
      onAddUser(userForm);
    }

    setUserModalOpen(false);
  };

  return (
    <div style={{ padding: "1.5rem 2rem" }}>
      {/* Tenants Section */}
      <div className="glass-panel" style={{ padding: "1.5rem", marginBottom: "1.5rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
          <div>
            <h2 style={{ fontFamily: "var(--font-heading)", fontSize: "1.2rem", fontWeight: 700 }}>
              🏢 Clientes Registrados (Tenants)
            </h2>
            <p style={{ fontSize: "0.8rem", color: "var(--text-secondary)", marginTop: "0.2rem" }}>
              💡 Clique sobre um cliente para selecioná-lo, ou dê 2 cliques para editar os dados.
            </p>
          </div>
          <button className="btn btn-primary" onClick={handleOpenAddTenant}>
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
              <th>Status do Contexto</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {tenants.map((t) => {
              const isCurrentActive = t.id === activeTenant?.id;
              return (
                <tr
                  key={t.id}
                  onClick={() => onSelectTenant && onSelectTenant(t)}
                  onDoubleClick={() => handleOpenEditTenant(t)}
                  style={{
                    cursor: "pointer",
                    background: isCurrentActive ? "rgba(99, 102, 241, 0.12)" : "transparent",
                    borderLeft: isCurrentActive ? "3px solid var(--accent-indigo)" : "none",
                  }}
                  title="Clique para selecionar este cliente, ou 2x para editar"
                >
                  <td style={{ fontFamily: "var(--font-mono)", color: "var(--accent-indigo)" }}>{t.id}</td>
                  <td style={{ fontWeight: 600 }}>{t.name}</td>
                  <td style={{ color: "var(--text-secondary)" }}>{t.domain}</td>
                  <td style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>
                    {t.createdAt ? new Date(t.createdAt).toLocaleDateString("pt-BR") : "Recente"}
                  </td>
                  <td>
                    {isCurrentActive ? (
                      <span className="badge badge-online">✅ Ativo no Topo</span>
                    ) : (
                      <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Clique para ativar</span>
                    )}
                  </td>
                  <td>
                    <button
                      className="btn btn-secondary"
                      style={{ padding: "0.3rem 0.6rem", fontSize: "0.75rem" }}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenEditTenant(t);
                      }}
                    >
                      ✏️ Editar
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Users Section */}
      <div className="glass-panel" style={{ padding: "1.5rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
          <div>
            <h2 style={{ fontFamily: "var(--font-heading)", fontSize: "1.2rem", fontWeight: 700 }}>
              👥 Usuários & Permissões (RBAC)
            </h2>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginTop: "0.3rem" }}>
              <label style={{ fontSize: "0.8rem", color: "var(--text-secondary)", cursor: "pointer", display: "flex", alignItems: "center", gap: "0.35rem" }}>
                <input
                  type="checkbox"
                  checked={filterActiveTenantOnly}
                  onChange={(e) => setFilterActiveTenantOnly(e.target.checked)}
                />
                Exibir apenas usuários do cliente selecionado (
                <strong style={{ color: "var(--accent-indigo)" }}>{activeTenant?.name}</strong>)
              </label>
            </div>
          </div>
          <button className="btn btn-primary" onClick={handleOpenAddUser}>
            + Cadastrar Novo Usuário
          </button>
        </div>

        {displayedUsers.length === 0 ? (
          <div style={{ textAlign: "center", padding: "2rem 0", color: "var(--text-secondary)" }}>
            <p>Nenhum usuário cadastrado especificamente para o cliente <strong>{activeTenant?.name}</strong>.</p>
            <button className="btn btn-secondary" style={{ marginTop: "0.75rem" }} onClick={handleOpenAddUser}>
              + Cadastrar Primeiro Usuário
            </button>
          </div>
        ) : (
          <table className="custom-table">
            <thead>
              <tr>
                <th>Nome</th>
                <th>E-mail</th>
                <th>Tenant Pertencente</th>
                <th>Papel (Role RBAC)</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {displayedUsers.map((u) => (
                <tr
                  key={u.id}
                  onDoubleClick={() => handleOpenEditUser(u)}
                  style={{ cursor: "pointer" }}
                  title="Clique 2x para editar este Usuário"
                >
                  <td style={{ fontWeight: 600 }}>{u.name}</td>
                  <td style={{ color: "var(--text-secondary)" }}>{u.email}</td>
                  <td>
                    <span className="tenant-badge">{tenants.find((t) => t.id === u.tenantId)?.name || u.tenantId}</span>
                  </td>
                  <td>
                    <span className={`badge badge-${u.role === "owner" || u.role === "administrator" ? "online" : "requires_approval"}`}>
                      {u.role ? u.role.toUpperCase() : "OPERATOR"}
                    </span>
                  </td>
                  <td>
                    <button
                      className="btn btn-secondary"
                      style={{ padding: "0.3rem 0.6rem", fontSize: "0.75rem" }}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenEditUser(u);
                      }}
                    >
                      ✏️ Editar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal Cliente / Tenant (Cadastrar ou Editar) */}
      {tenantModalOpen && (
        <div
          className="modal-overlay"
          onClick={(e) => {
            if (e.target === e.currentTarget) setTenantModalOpen(false);
          }}
        >
          <div className="glass-panel modal-content" style={{ position: "relative" }}>
            <button
              type="button"
              onClick={() => setTenantModalOpen(false)}
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
              🏢 {editingTenant ? `Editar Cliente: ${editingTenant.name}` : "Cadastrar Novo Cliente / Tenant"}
            </h3>
            <form onSubmit={handleSaveTenant}>
              <div style={{ marginBottom: "1rem" }}>
                <label style={{ display: "block", fontSize: "0.85rem", color: "var(--text-secondary)", marginBottom: "0.35rem" }}>
                  Nome da Empresa / Cliente
                </label>
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
                <label style={{ display: "block", fontSize: "0.85rem", color: "var(--text-secondary)", marginBottom: "0.35rem" }}>
                  Domínio Principal
                </label>
                <input
                  type="text"
                  placeholder="Ex: acme.com.br"
                  value={tenantForm.domain}
                  onChange={(e) => setTenantForm({ ...tenantForm, domain: e.target.value })}
                  style={{ width: "100%", padding: "0.6rem", background: "rgba(0,0,0,0.3)", border: "1px solid var(--border-subtle)", color: "#fff", borderRadius: "6px" }}
                />
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem" }}>
                <button type="button" className="btn btn-secondary" onClick={() => setTenantModalOpen(false)}>
                  Cancelar / Fechar
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingTenant ? "Salvar Alterações" : "Criar Cliente"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Usuário (Cadastrar ou Editar) */}
      {userModalOpen && (
        <div
          className="modal-overlay"
          onClick={(e) => {
            if (e.target === e.currentTarget) setUserModalOpen(false);
          }}
        >
          <div className="glass-panel modal-content" style={{ position: "relative" }}>
            <button
              type="button"
              onClick={() => setUserModalOpen(false)}
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
              👥 {editingUser ? `Editar Usuário: ${editingUser.name}` : "Cadastrar Novo Usuário"}
            </h3>
            <form onSubmit={handleSaveUser}>
              <div style={{ marginBottom: "1rem" }}>
                <label style={{ display: "block", fontSize: "0.85rem", color: "var(--text-secondary)", marginBottom: "0.35rem" }}>
                  Nome Completo
                </label>
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
                <label style={{ display: "block", fontSize: "0.85rem", color: "var(--text-secondary)", marginBottom: "0.35rem" }}>
                  E-mail
                </label>
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
                <label style={{ display: "block", fontSize: "0.85rem", color: "var(--text-secondary)", marginBottom: "0.35rem" }}>
                  Cliente / Tenant
                </label>
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
                <label style={{ display: "block", fontSize: "0.85rem", color: "var(--text-secondary)", marginBottom: "0.35rem" }}>
                  Papel (RBAC Role)
                </label>
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
                <button type="button" className="btn btn-secondary" onClick={() => setUserModalOpen(false)}>
                  Cancelar / Fechar
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingUser ? "Salvar Alterações" : "Criar Usuário"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
