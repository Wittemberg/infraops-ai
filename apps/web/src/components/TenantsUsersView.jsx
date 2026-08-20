import React, { useState } from "react";

export function TenantsUsersView({
  tenants = [],
  users = [],
  activeTenant,
  isSuperAdmin = false,
  onSelectTenant,
  onAddTenant,
  onUpdateTenant,
  onAddUser,
  onUpdateUser,
  onDeleteUser,
}) {
  const [tenantModalOpen, setTenantModalOpen] = useState(false);
  const [userModalOpen, setUserModalOpen] = useState(false);
  const [filterActiveTenantOnly, setFilterActiveTenantOnly] = useState(true);
  const [toastMessage, setToastMessage] = useState(null);

  // Deletion confirmation modal
  const [userToDelete, setUserToDelete] = useState(null);

  const [editingTenant, setEditingTenant] = useState(null);
  const [editingUser, setEditingUser] = useState(null);

  const [tenantForm, setTenantForm] = useState({ name: "", domain: "" });
  const [userForm, setUserForm] = useState({
    tenantId: activeTenant?.id || tenants[0]?.id || "",
    name: "",
    email: "",
    role: "operator",
    password: "",
    status: "active",
    mustChangePassword: true,
  });
  const [showPassword, setShowPassword] = useState(false);

  const displayedUsers =
    (!isSuperAdmin || filterActiveTenantOnly) && activeTenant
      ? users.filter((u) => u.tenantId === activeTenant.id)
      : users;

  const showToast = (text, type = "success") => {
    setToastMessage({ text, type });
    setTimeout(() => {
      setToastMessage(null);
    }, 5000);
  };

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
      status: "active",
      mustChangePassword: true,
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
      status: user.status || "active",
      mustChangePassword: Boolean(user.mustChangePassword),
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

  const handleToggleUserStatus = (user) => {
    const newStatus = user.status === "inactive" ? "active" : "inactive";
    onUpdateUser({
      ...user,
      status: newStatus,
    });
    showToast(`Status do usuário "${user.name}" alterado para ${newStatus === "active" ? "ATIVO" : "INATIVO"}.`);
  };

  const handleConfirmDeleteUser = () => {
    if (!userToDelete) return;
    if (onDeleteUser) {
      onDeleteUser(userToDelete.id);
    }
    showToast(`Usuário "${userToDelete.name}" (${userToDelete.email}) excluído com sucesso.`);
    setUserToDelete(null);
  };

  const handleSaveTenant = (e) => {
    e.preventDefault();
    if (!tenantForm.name) return;

    if (editingTenant) {
      onUpdateTenant({ ...editingTenant, ...tenantForm });
      showToast(`Cliente "${tenantForm.name}" atualizado com sucesso!`);
    } else {
      onAddTenant(tenantForm);
      showToast(`Cliente "${tenantForm.name}" criado com sucesso!`);
    }

    setTenantModalOpen(false);
  };

  const handleSaveUser = (e) => {
    e.preventDefault();
    if (!userForm.name || !userForm.email) return;

    const payload = {
      tenantId: userForm.tenantId || activeTenant?.id || tenants[0]?.id,
      name: userForm.name.trim(),
      email: userForm.email.trim(),
      role: userForm.role,
      status: userForm.status || "active",
      mustChangePassword: userForm.mustChangePassword,
    };

    if (userForm.password && userForm.password.trim()) {
      payload.password = userForm.password.trim();
    }

    const targetTenant = tenants.find((t) => t.id === payload.tenantId);

    if (editingUser) {
      onUpdateUser({ ...editingUser, ...payload });
      showToast(`Usuário "${payload.name}" atualizado com sucesso!`);
    } else {
      onAddUser(payload);
      showToast(`Usuário "${payload.name}" cadastrado com sucesso para o cliente "${targetTenant?.name || payload.tenantId}"!`);
      if (targetTenant && activeTenant?.id !== targetTenant.id) {
        onSelectTenant(targetTenant);
      }
    }

    setUserModalOpen(false);
  };

  return (
    <div style={{ padding: "1.5rem 2rem" }}>
      {/* Toast Notification Banner */}
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
            boxShadow: "0 4px 12px rgba(0,0,0,0.2)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontWeight: 600 }}>
            <span>{toastMessage.type === "success" ? "✅" : "⚠️"}</span>
            <span>{toastMessage.text}</span>
          </div>
          <button
            onClick={() => setToastMessage(null)}
            style={{ background: "none", border: "none", color: "inherit", cursor: "pointer", fontSize: "1rem" }}
          >
            ✖
          </button>
        </div>
      )}

      {/* Tenants Section (Only visible to SuperAdmin) */}
      {isSuperAdmin ? (
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
      ) : (
        <div className="glass-panel" style={{ padding: "1.25rem 1.5rem", marginBottom: "1.5rem", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
          <div>
            <h2 style={{ fontFamily: "var(--font-heading)", fontSize: "1.15rem", fontWeight: 700 }}>
              🏢 Organização: {activeTenant?.name}
            </h2>
            <p style={{ fontSize: "0.8rem", color: "var(--text-secondary)", marginTop: "0.2rem" }}>
              Domínio: <strong>{activeTenant?.domain || "calvi.com.br"}</strong> | ID: <code>{activeTenant?.id}</code>
            </p>
          </div>
          <span className="badge badge-online" style={{ padding: "0.35rem 0.75rem", fontSize: "0.85rem" }}>
            🟢 Tenant Ativo
          </span>
        </div>
      )}

      {/* Users Section */}
      <div className="glass-panel" style={{ padding: "1.5rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem", flexWrap: "wrap", gap: "0.5rem" }}>
          <div>
            <h2 style={{ fontFamily: "var(--font-heading)", fontSize: "1.2rem", fontWeight: 700 }}>
              👥 {isSuperAdmin ? "Usuários & Permissões de Acesso (RBAC)" : `Usuários da Organização (${activeTenant?.name})`}
            </h2>
            {isSuperAdmin && (
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginTop: "0.3rem" }}>
                <label style={{ fontSize: "0.8rem", color: "var(--text-secondary)", cursor: "pointer", display: "flex", alignItems: "center", gap: "0.35rem" }}>
                  <input
                    type="checkbox"
                    checked={filterActiveTenantOnly}
                    onChange={(e) => setFilterActiveTenantOnly(e.target.checked)}
                  />
                  Exibir apenas usuários do cliente selecionado (
                  <strong style={{ color: "var(--accent-indigo)" }}>{activeTenant?.name || "Nenhum"}</strong>)
                </label>
              </div>
            )}
          </div>
          <button className="btn btn-primary" onClick={handleOpenAddUser}>
            + Cadastrar Novo Usuário
          </button>
        </div>

        {displayedUsers.length === 0 ? (
          <div style={{ textAlign: "center", padding: "2rem 0", color: "var(--text-secondary)" }}>
            <p>Nenhum usuário cadastrado especificamente para o cliente <strong>{activeTenant?.name}</strong>.</p>
            <div style={{ display: "flex", gap: "0.75rem", justifyContent: "center", marginTop: "0.75rem" }}>
              <button className="btn btn-primary" onClick={handleOpenAddUser}>
                + Cadastrar Usuário para {activeTenant?.name}
              </button>
              {filterActiveTenantOnly && users.length > 0 && (
                <button className="btn btn-secondary" onClick={() => setFilterActiveTenantOnly(false)}>
                  Ver Usuários de Todos os Clientes ({users.length})
                </button>
              )}
            </div>
          </div>
        ) : (
          <div style={{ width: "100%", overflowX: "auto" }}>
            <table className="custom-table" style={{ width: "100%", minWidth: "850px" }}>
              <thead>
                <tr>
                  <th>Nome</th>
                  <th>E-mail de Login</th>
                  <th>Cliente (Tenant)</th>
                  <th>Papel (Role)</th>
                  <th>Status Conta</th>
                  <th>Segurança</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                {displayedUsers.map((u) => {
                  const isActive = u.status !== "inactive";
                  return (
                    <tr
                      key={u.id}
                      onDoubleClick={() => handleOpenEditUser(u)}
                      style={{
                        cursor: "pointer",
                        opacity: isActive ? 1 : 0.6,
                      }}
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
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleToggleUserStatus(u);
                          }}
                          style={{
                            background: isActive ? "rgba(16, 185, 129, 0.15)" : "rgba(244, 63, 94, 0.15)",
                            border: `1px solid ${isActive ? "rgba(16, 185, 129, 0.4)" : "rgba(244, 63, 94, 0.4)"}`,
                            color: isActive ? "var(--accent-emerald)" : "var(--accent-rose)",
                            padding: "0.2rem 0.5rem",
                            borderRadius: "6px",
                            fontSize: "0.72rem",
                            fontWeight: 600,
                            cursor: "pointer",
                          }}
                          title={isActive ? "Clique para desativar este usuário" : "Clique para ativar este usuário"}
                        >
                          {isActive ? "🟢 Ativo" : "🔴 Inativo"}
                        </button>
                      </td>
                      <td>
                        {u.mustChangePassword ? (
                          <span className="badge badge-requires_approval" style={{ fontSize: "0.7rem" }} title="Troca obrigatória no primeiro login">
                            🟡 1º Acesso
                          </span>
                        ) : (
                          <span className="badge badge-online" style={{ fontSize: "0.7rem" }} title="Senha pessoal ativa e validada">
                            🟢 Senha Ativa
                          </span>
                        )}
                      </td>
                      <td>
                        <div style={{ display: "flex", gap: "0.4rem" }}>
                          <button
                            className="btn btn-secondary"
                            style={{ padding: "0.25rem 0.5rem", fontSize: "0.75rem" }}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenEditUser(u);
                            }}
                            title="Editar Dados / Trocar Senha"
                          >
                            ✏️ Editar
                          </button>
                          <button
                            className="btn"
                            style={{
                              padding: "0.25rem 0.5rem",
                              fontSize: "0.75rem",
                              background: "rgba(244, 63, 94, 0.15)",
                              border: "1px solid rgba(244, 63, 94, 0.3)",
                              color: "var(--accent-rose)",
                              cursor: "pointer",
                            }}
                            onClick={(e) => {
                              e.stopPropagation();
                              setUserToDelete(u);
                            }}
                            title="Excluir este usuário permanentemente"
                          >
                            🗑️ Excluir
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Delete User Confirmation Modal */}
      {userToDelete && (
        <div
          className="modal-overlay"
          onClick={(e) => {
            if (e.target === e.currentTarget) setUserToDelete(null);
          }}
        >
          <div className="glass-panel modal-content" style={{ maxWidth: "440px", textAlign: "center" }}>
            <div style={{ fontSize: "2.5rem", marginBottom: "0.5rem" }}>🗑️</div>
            <h3 style={{ fontFamily: "var(--font-heading)", fontSize: "1.2rem", color: "var(--accent-rose)", marginBottom: "0.5rem" }}>
              Excluir Usuário?
            </h3>
            <p style={{ fontSize: "0.9rem", color: "var(--text-secondary)", marginBottom: "1.5rem" }}>
              Tem certeza que deseja remover o usuário <strong>{userToDelete.name}</strong> (<code>{userToDelete.email}</code>)? Esta ação não pode ser desfeita.
            </p>
            <div style={{ display: "flex", justifyContent: "center", gap: "0.75rem" }}>
              <button type="button" className="btn btn-secondary" onClick={() => setUserToDelete(null)}>
                Cancelar
              </button>
              <button
                type="button"
                className="btn"
                style={{
                  background: "var(--accent-rose)",
                  color: "#fff",
                  fontWeight: 600,
                  padding: "0.6rem 1.2rem",
                  borderRadius: "6px",
                  border: "none",
                  cursor: "pointer",
                }}
                onClick={handleConfirmDeleteUser}
              >
                Sim, Excluir Usuário
              </button>
            </div>
          </div>
        </div>
      )}

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
                  Nome da Empresa / Organização *
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
                  Cliente / Tenant Pertencente *
                </label>
                {isSuperAdmin ? (
                  <select
                    value={userForm.tenantId}
                    onChange={(e) => setUserForm({ ...userForm, tenantId: e.target.value })}
                    style={{ width: "100%", padding: "0.6rem", background: "rgba(0,0,0,0.3)", border: "1px solid var(--border-subtle)", color: "#fff", borderRadius: "6px" }}
                  >
                    {tenants.map((t) => (
                      <option key={t.id} value={t.id}>{t.name} ({t.id})</option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    disabled
                    value={`${activeTenant?.name} (${activeTenant?.id})`}
                    style={{ width: "100%", padding: "0.6rem", background: "rgba(0,0,0,0.4)", border: "1px solid var(--border-subtle)", color: "var(--accent-indigo)", fontWeight: 600, borderRadius: "6px" }}
                  />
                )}
              </div>

              <div style={{ display: "flex", gap: "1rem", marginBottom: "1rem" }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: "block", fontSize: "0.85rem", color: "var(--text-secondary)", marginBottom: "0.35rem" }}>
                    Papel (Role RBAC)
                  </label>
                  <select
                    value={userForm.role}
                    onChange={(e) => setUserForm({ ...userForm, role: e.target.value })}
                    style={{ width: "100%", padding: "0.6rem", background: "rgba(0,0,0,0.3)", border: "1px solid var(--border-subtle)", color: "#fff", borderRadius: "6px" }}
                  >
                    <option value="owner">👑 Owner</option>
                    <option value="administrator">🛡️ Administrator</option>
                    <option value="operator">⚡ Operator</option>
                    <option value="viewer">👁️ Viewer</option>
                  </select>
                </div>

                <div style={{ flex: 1 }}>
                  <label style={{ display: "block", fontSize: "0.85rem", color: "var(--text-secondary)", marginBottom: "0.35rem" }}>
                    Status da Conta
                  </label>
                  <select
                    value={userForm.status}
                    onChange={(e) => setUserForm({ ...userForm, status: e.target.value })}
                    style={{ width: "100%", padding: "0.6rem", background: "rgba(0,0,0,0.3)", border: "1px solid var(--border-subtle)", color: "#fff", borderRadius: "6px" }}
                  >
                    <option value="active">🟢 Ativo (Acesso Permitido)</option>
                    <option value="inactive">🔴 Inativo (Bloqueado)</option>
                  </select>
                </div>
              </div>

              {/* Password Configuration Section */}
              <div style={{ marginBottom: "1.25rem", background: "rgba(99, 102, 241, 0.06)", border: "1px solid rgba(99, 102, 241, 0.2)", padding: "0.85rem", borderRadius: "8px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.35rem" }}>
                  <label style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--accent-indigo)" }}>
                    🔑 Senha Temporária {editingUser ? "(Opcional na edição)" : "*"}
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
                    placeholder={editingUser ? "Deixe em branco para manter a senha atual" : "Digite uma senha temporária ou clique em 'Gerar'"}
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
                    {showPassword ? "🙈" : "👁️"}
                  </button>
                </div>

                {/* Mandatory Change Password Note & Toggle */}
                <div style={{ marginTop: "0.6rem", paddingTop: "0.5rem", borderTop: "1px solid rgba(255,255,255,0.08)" }}>
                  <label style={{ fontSize: "0.78rem", color: "var(--text-secondary)", display: "flex", alignItems: "center", gap: "0.4rem", cursor: "pointer" }}>
                    <input
                      type="checkbox"
                      checked={userForm.mustChangePassword}
                      onChange={(e) => setUserForm({ ...userForm, mustChangePassword: e.target.checked })}
                    />
                    🔒 Exigir troca obrigatória de senha no próximo login
                  </label>
                  <div style={{ fontSize: "0.7rem", color: "var(--text-muted)", marginTop: "0.2rem" }}>
                    Ao entrar no sistema com a senha temporária, o usuário será direcionado para definir sua senha pessoal antes de acessar o painel.
                  </div>
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
