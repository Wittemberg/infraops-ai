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
  const [userForm, setUserForm] = useState({
    tenantId: activeTenant?.id || tenants[0]?.id || "",
    name: "",
    email: "",
    role: "operator",
    password: "",
  });
  const [showPassword, setShowPassword] = useState(false);

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
    setUserForm({
      tenantId: activeTenant?.id || tenants[0]?.id || "",
      name: "",
      email: "",
      role: "operator",
      password: "",
    });
    setShowPassword(false);
    setUserModalOpen(true);
  };

  const handleOpenEditUser = (user) => {
    setEditingUser(user);
    setUserForm({
      tenantId: user.tenantId,
      name: user.name,
      email: user.email,
      role: user.role,
      password: "",
    });
    setShowPassword(false);
    setUserModalOpen(true);
  };

  const generateRandomPassword = () => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%&*";
    let pass = "";
    for (let i = 0; i < 14; i++) {
      pass += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setUserForm((prev) => ({ ...prev, password: pass }));
    setShowPassword(true);
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

    const payload = {
      tenantId: userForm.tenantId,
      name: userForm.name,
      email: userForm.email,
      role: userForm.role,
    };

    if (userForm.password && userForm.password.trim()) {
      payload.password = userForm.password.trim();
    }

    if (editingUser) {
      onUpdateUser({ ...editingUser, ...payload });
    } else {
      onAddUser(payload);
    }

    setUserModalOpen(false);
  };

  return (
    <div style={{ padding: "1.5rem 2rem" }}>
      {/* Tenants Section */}
      <div className="glass-panel" style={{ padding: "1.5rem", marginBottom: "1.5rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem", flexWrap: "wrap", gap: "0.5rem" }}>
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

        <div style={{ width: "100%", overflowX: "auto" }}>
          <table className="custom-table" style={{ width: "100%", minWidth: "700px" }}>
            <thead>
              <tr>
                <th>ID Tenant</th>
                <th>Nome do Cliente</th>
                <th>Domínio</th>
                <th>Status Seleção</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {tenants.map((t) => {
                const isSelected = activeTenant && activeTenant.id === t.id;
                return (
                  <tr
                    key={t.id}
                    onClick={() => onSelectTenant(t)}
                    onDoubleClick={() => handleOpenEditTenant(t)}
                    style={{
                      cursor: "pointer",
                      background: isSelected ? "rgba(99, 102, 241, 0.15)" : "transparent",
                    }}
                    title="Clique para selecionar este cliente. Clique 2x para editar."
                  >
                    <td>
                      <code>{t.id}</code>
                    </td>
                    <td style={{ fontWeight: 600 }}>{t.name}</td>
                    <td style={{ color: "var(--text-secondary)" }}>{t.domain || "—"}</td>
                    <td>
                      {isSelected ? (
                        <span className="badge badge-online">🟢 ATIVO NO PAINEL</span>
                      ) : (
                        <span className="badge" style={{ background: "rgba(255,255,255,0.05)", color: "var(--text-muted)" }}>
                          Inativo
                        </span>
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
      </div>

      {/* Users Section */}
      <div className="glass-panel" style={{ padding: "1.5rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem", flexWrap: "wrap", gap: "0.5rem" }}>
          <div>
            <h2 style={{ fontFamily: "var(--font-heading)", fontSize: "1.2rem", fontWeight: 700 }}>
              👥 Usuários & Permissões de Acesso (RBAC)
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
          <div style={{ width: "100%", overflowX: "auto" }}>
            <table className="custom-table" style={{ width: "100%", minWidth: "750px" }}>
              <thead>
                <tr>
                  <th>Nome</th>
                  <th>E-mail de Login</th>
                  <th>Cliente (Tenant)</th>
                  <th>Papel (Role RBAC)</th>
                  <th>Autenticação</th>
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
                      <span className="badge badge-online" style={{ fontSize: "0.7rem" }}>
                        🔑 Senha Configurada
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
                        ✏️ Editar / Trocar Senha
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal Tenant (Cadastrar ou Editar) */}
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
              🏢 {editingTenant ? `Editar Cliente: ${editingTenant.name}` : "Cadastrar Novo Cliente (Tenant)"}
            </h3>
            <form onSubmit={handleSaveTenant}>
              <div style={{ marginBottom: "1rem" }}>
                <label style={{ display: "block", fontSize: "0.85rem", color: "var(--text-secondary)", marginBottom: "0.35rem" }}>
                  Nome da Empresa / Organização
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: ACME Corp"
                  value={tenantForm.name}
                  onChange={(e) => setTenantForm({ ...tenantForm, name: e.target.value })}
                  style={{ width: "100%", padding: "0.6rem", background: "rgba(0,0,0,0.3)", border: "1px solid var(--border-subtle)", color: "#fff", borderRadius: "6px" }}
                />
              </div>

              <div style={{ marginBottom: "1.5rem" }}>
                <label style={{ display: "block", fontSize: "0.85rem", color: "var(--text-secondary)", marginBottom: "0.35rem" }}>
                  Domínio Principal (opcional)
                </label>
                <input
                  type="text"
                  placeholder="acme.com.br"
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
          <div className="glass-panel modal-content" style={{ maxWidth: "520px", position: "relative" }}>
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
                  Nome Completo *
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
                  E-mail de Acesso (Login) *
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
                  Cliente / Tenant Pertencente
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

              <div style={{ marginBottom: "1rem" }}>
                <label style={{ display: "block", fontSize: "0.85rem", color: "var(--text-secondary)", marginBottom: "0.35rem" }}>
                  Papel (RBAC Role)
                </label>
                <select
                  value={userForm.role}
                  onChange={(e) => setUserForm({ ...userForm, role: e.target.value })}
                  style={{ width: "100%", padding: "0.6rem", background: "rgba(0,0,0,0.3)", border: "1px solid var(--border-subtle)", color: "#fff", borderRadius: "6px" }}
                >
                  <option value="owner">👑 Owner (Acesso Total ao Tenant + Gestão de Usuários)</option>
                  <option value="administrator">🛡️ Administrator (Ações de Sistema + Políticas)</option>
                  <option value="operator">⚡ Operator (Execução de Jobs + Diagnóstico)</option>
                  <option value="viewer">👁️ Viewer (Apenas Leitura)</option>
                </select>
              </div>

              {/* Password Configuration Section */}
              <div style={{ marginBottom: "1.5rem", background: "rgba(99, 102, 241, 0.06)", border: "1px solid rgba(99, 102, 241, 0.2)", padding: "0.85rem", borderRadius: "8px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.35rem" }}>
                  <label style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--accent-indigo)" }}>
                    🔑 Senha de Acesso {editingUser ? "(Opcional na edição)" : "*"}
                  </label>
                  <button
                    type="button"
                    onClick={generateRandomPassword}
                    style={{
                      background: "none",
                      border: "none",
                      color: "var(--accent-cyan)",
                      fontSize: "0.75rem",
                      cursor: "pointer",
                      textDecoration: "underline",
                      padding: 0,
                    }}
                  >
                    🎲 Gerar Senha Segura
                  </button>
                </div>

                <div style={{ display: "flex", gap: "0.5rem" }}>
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder={editingUser ? "Deixe em branco para manter a senha atual" : "Digite uma senha ou use 'Gerar Senha'"}
                    value={userForm.password}
                    onChange={(e) => setUserForm({ ...userForm, password: e.target.value })}
                    style={{
                      flex: 1,
                      padding: "0.55rem",
                      background: "rgba(0,0,0,0.3)",
                      border: "1px solid var(--border-subtle)",
                      color: "#fff",
                      borderRadius: "6px",
                      fontSize: "0.85rem",
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{
                      padding: "0.55rem 0.75rem",
                      background: "rgba(255,255,255,0.08)",
                      border: "1px solid var(--border-subtle)",
                      color: "#fff",
                      borderRadius: "6px",
                      cursor: "pointer",
                      fontSize: "0.85rem",
                    }}
                    title={showPassword ? "Ocultar senha" : "Ver senha"}
                  >
                    {showPassword ? "🙈 Ocultar" : "👁️ Ver"}
                  </button>
                </div>
                <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", marginTop: "0.35rem" }}>
                  {editingUser
                    ? "Caso deseje alterar a senha do usuário, digite uma nova senha acima."
                    : "Defina a senha inicial que o usuário utilizará na tela de Login."}
                </div>
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
