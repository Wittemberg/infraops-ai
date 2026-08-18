import React, { useState } from "react";

export function ActionCatalogView({ activeTenant, onOpenActionModal }) {
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedRisk, setSelectedRisk] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [editingAction, setEditingAction] = useState(null);
  const [inspectingAction, setInspectingAction] = useState(null);

  // Registered and Versioned Actions Catalog (Strict Contracts)
  const [actions, setActions] = useState([
    {
      actionKey: "service.restart",
      version: "v1.2.0",
      title: "Reiniciar Serviço Systemd",
      category: "services",
      description: "Executa reinício seguro de serviços Linux (systemd) com verificação de portas e integridade de resposta.",
      risk: "medium",
      idempotent: true,
      precheck: "Verifica se a unidade systemd está instalada e se o host está respondendo a heartbeats.",
      postcheck: "Verifica se o novo PID está ativo e se a porta TCP/HTTP responde em até 10s.",
      parameters: [
        { name: "serviceName", type: "string", required: true, description: "Nome do serviço systemd (ex: nginx, postgresql, redis)" },
      ],
      tenantPolicy: {
        enabled: true,
        autonomyLevel: 5, // Self-Healing
        requiresApproval: false,
        maintenanceWindowOnly: false,
      },
    },
    {
      actionKey: "node.diagnostics",
      version: "v1.0.0",
      title: "Varredura Diagnóstica do Nó",
      category: "diagnostics",
      description: "Coleta telemetria profunda não invasiva: CPU, RAM, I/O wait, logs do dmesg e sockets abertos.",
      risk: "low",
      idempotent: true,
      precheck: "Valida conexão outbound TLS com o agente no host.",
      postcheck: "Confirma integridade dos artefatos diagnósticos coletados.",
      parameters: [
        { name: "depth", type: "string", required: false, description: "Nível de detalhe (standard ou deep)" },
      ],
      tenantPolicy: {
        enabled: true,
        autonomyLevel: 5,
        requiresApproval: false,
        maintenanceWindowOnly: false,
      },
    },
    {
      actionKey: "backup.cleanup",
      version: "v1.1.0",
      title: "Expurgo Seguro de Backups Antigos",
      category: "storage",
      description: "Remove artefatos de backup expirados respeitando incondicionalmente a regra de Safe Retention.",
      risk: "medium",
      idempotent: true,
      precheck: "Verifica se existe pelo menos 1 backup íntegro mais recente que atende o RPO antes de expurgar.",
      postcheck: "Valida espaço liberado em disco e consistência do storage.",
      parameters: [
        { name: "olderThanDays", type: "number", required: true, description: "Idade mínima dos arquivos para expurgo (mínimo 7 dias)" },
      ],
      tenantPolicy: {
        enabled: true,
        autonomyLevel: 4,
        requiresApproval: false,
        maintenanceWindowOnly: true,
      },
    },
    {
      actionKey: "docker.container_restart",
      version: "v1.0.0",
      title: "Reiniciar Container Docker",
      category: "containers",
      description: "Reinicia containers Docker em falha ou estado unhealthy de forma graciosa.",
      risk: "medium",
      idempotent: true,
      precheck: "Inspeciona estado do container via Docker Socket e checa dependências de rede.",
      postcheck: "Verifica se o healthcheck do container passou para 'healthy'.",
      parameters: [
        { name: "containerName", type: "string", required: true, description: "Nome ou ID do container Docker" },
      ],
      tenantPolicy: {
        enabled: true,
        autonomyLevel: 5,
        requiresApproval: false,
        maintenanceWindowOnly: false,
      },
    },
    {
      actionKey: "disk.temp_cleanup",
      version: "v1.0.0",
      title: "Limpeza de Arquivos Temporários",
      category: "storage",
      description: "Libera espaço em disco limpando /tmp, cache do apt/yum e arquivos de log rotacionados antigos.",
      risk: "low",
      idempotent: true,
      precheck: "Mapeia arquivos sem descritores de processo abertos (lsof).",
      postcheck: "Recalcula df -h e audita percentual de espaço recuperado.",
      parameters: [
        { name: "targetPaths", type: "string", required: false, description: "Diretórios permitidos (/tmp, /var/cache/apt)" },
      ],
      tenantPolicy: {
        enabled: true,
        autonomyLevel: 5,
        requiresApproval: false,
        maintenanceWindowOnly: false,
      },
    },
    {
      actionKey: "system.packages_update",
      version: "v1.3.0",
      title: "Atualização de Pacotes do SO (Security Patches)",
      category: "system",
      description: "Aplica patches e correções de segurança no sistema operacional Linux.",
      risk: "high",
      idempotent: true,
      precheck: "Verifica repositórios oficiais, espaço livre em /boot e gera lista de pacotes.",
      postcheck: "Valida integridade do gerenciador de pacotes e status de serviços críticos.",
      parameters: [
        { name: "securityOnly", type: "boolean", required: true, description: "Aplicar apenas patches de segurança (true/false)" },
      ],
      tenantPolicy: {
        enabled: true,
        autonomyLevel: 3, // Requer aprovação obrigatória
        requiresApproval: true,
        maintenanceWindowOnly: true,
      },
    },
    {
      actionKey: "vm.snapshot_create",
      version: "v1.0.0",
      title: "Criar Snapshot de VM",
      category: "virtualization",
      description: "Cria snapshot consistente de máquina virtual em clusters Proxmox VE ou Virtualizor.",
      risk: "low",
      idempotent: true,
      precheck: "Verifica suporte do storage a snapshots e estado de execução da VM.",
      postcheck: "Verifica se o snapshot consta na árvore de volumes do hipervisor.",
      parameters: [
        { name: "snapshotName", type: "string", required: true, description: "Nome identificador do snapshot" },
        { name: "includeRam", type: "boolean", required: false, description: "Salvar estado da RAM (true/false)" },
      ],
      tenantPolicy: {
        enabled: true,
        autonomyLevel: 4,
        requiresApproval: false,
        maintenanceWindowOnly: false,
      },
    },
    {
      actionKey: "vm.power_cycle",
      version: "v1.0.0",
      title: "Ciclo Forçado de Energia (Hard Reset VM)",
      category: "virtualization",
      description: "Executa hard reset ou desligamento forçado em VMs que não respondem via ACPI.",
      risk: "critical",
      idempotent: false,
      precheck: "Confirma que a VM não responde a pings ACPI e tentativas graciosas falharam.",
      postcheck: "Verifica transição de estado da VM no hipervisor.",
      parameters: [
        { name: "reason", type: "string", required: true, description: "Justificativa auditável para o hard reset" },
      ],
      tenantPolicy: {
        enabled: false,
        autonomyLevel: 3,
        requiresApproval: true,
        maintenanceWindowOnly: false,
      },
    },
  ]);

  const categories = [
    { id: "all", label: "Todas as Categorias" },
    { id: "services", label: "🛠️ Serviços" },
    { id: "diagnostics", label: "🩺 Diagnósticos" },
    { id: "storage", label: "💾 Storage & Backup" },
    { id: "containers", label: "📦 Containers" },
    { id: "system", label: "⚙️ Sistema" },
    { id: "virtualization", label: "⚡ Virtualização" },
  ];

  const risks = [
    { id: "all", label: "Todos os Riscos" },
    { id: "low", label: "🟢 Baixo (Low)" },
    { id: "medium", label: "🟡 Médio (Medium)" },
    { id: "high", label: "🟠 Alto (High)" },
    { id: "critical", label: "🔴 Crítico (Critical)" },
  ];

  const filteredActions = actions.filter((act) => {
    const matchesCat = selectedCategory === "all" || act.category === selectedCategory;
    const matchesRisk = selectedRisk === "all" || act.risk === selectedRisk;
    const matchesSearch =
      searchTerm === "" ||
      act.actionKey.toLowerCase().includes(searchTerm.toLowerCase()) ||
      act.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      act.description.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCat && matchesRisk && matchesSearch;
  });

  const handleToggleAction = (actionKey) => {
    setActions((prev) =>
      prev.map((a) =>
        a.actionKey === actionKey
          ? {
              ...a,
              tenantPolicy: {
                ...a.tenantPolicy,
                enabled: !a.tenantPolicy.enabled,
              },
            }
          : a
      )
    );
  };

  const handleSavePolicy = (e) => {
    e.preventDefault();
    if (!editingAction) return;

    setActions((prev) =>
      prev.map((a) => (a.actionKey === editingAction.actionKey ? editingAction : a))
    );
    setEditingAction(null);
  };

  const getRiskBadge = (risk) => {
    switch (risk) {
      case "low":
        return <span className="badge badge-online">🟢 BAIXO</span>;
      case "medium":
        return <span className="badge badge-requires_approval">🟡 MÉDIO</span>;
      case "high":
        return <span className="badge badge-requires_approval" style={{ background: "rgba(249, 115, 22, 0.2)", color: "#f97316" }}>🟠 ALTO</span>;
      case "critical":
        return <span className="badge badge-offline">🔴 CRÍTICO</span>;
      default:
        return <span className="badge">{risk}</span>;
    }
  };

  const getAutonomyLabel = (level) => {
    switch (level) {
      case 5:
        return "Nível 5 (Self-Healing Automático)";
      case 4:
        return "Nível 4 (Autônomo com Registro)";
      case 3:
        return "Nível 3 (Exige Aprovação Humana)";
      case 2:
        return "Nível 2 (Apenas Recomendação)";
      case 1:
        return "Nível 1 (Apenas Diagnóstico)";
      default:
        return `Nível ${level}`;
    }
  };

  return (
    <div style={{ padding: "1.5rem 2rem" }}>
      {/* Context Banner */}
      <div style={{ marginBottom: "1.5rem" }}>
        <div
          style={{
            background: "rgba(99, 102, 241, 0.08)",
            border: "1px solid rgba(99, 102, 241, 0.2)",
            borderRadius: "8px",
            padding: "0.8rem 1.25rem",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "0.75rem",
          }}
        >
          <div>
            <span style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>
              🏢 Políticas do Catálogo de Ações para o cliente:{" "}
              <strong style={{ color: "var(--accent-indigo)" }}>{activeTenant?.name}</strong>
            </span>
            <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "0.2rem" }}>
              🛡️ Regra Não Negociável nº 3: Todas as operações no host utilizam contratos estritos declarativos. Shell arbitrário é estritamente proibido.
            </div>
          </div>

          <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
            <span className="badge badge-online" style={{ fontSize: "0.75rem" }}>
              ✓ {actions.filter((a) => a.tenantPolicy.enabled).length} Actions Habilitadas
            </span>
          </div>
        </div>
      </div>

      {/* Main Panel */}
      <div className="glass-panel" style={{ padding: "1.5rem" }}>
        {/* Header & Controls */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem", flexWrap: "wrap", gap: "1rem" }}>
          <div>
            <h2 style={{ fontFamily: "var(--font-heading)", fontSize: "1.25rem", fontWeight: 700 }}>
              ⚡ Catálogo de Actions & Governança Operacional
            </h2>
            <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)", marginTop: "0.25rem" }}>
              Visualize o catálogo de Actions tipadas e controle quais operações este cliente tem permissão para executar.
            </p>
          </div>

          {/* Search Input */}
          <input
            type="text"
            placeholder="🔍 Buscar por Action, nome ou descrição..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              padding: "0.5rem 0.9rem",
              background: "rgba(0,0,0,0.3)",
              border: "1px solid var(--border-subtle)",
              color: "#fff",
              borderRadius: "6px",
              fontSize: "0.85rem",
              minWidth: "280px",
            }}
          />
        </div>

        {/* Filters Bar */}
        <div style={{ display: "flex", gap: "1rem", marginBottom: "1.25rem", flexWrap: "wrap", alignItems: "center" }}>
          <div style={{ display: "flex", gap: "0.35rem", flexWrap: "wrap" }}>
            {categories.map((cat) => (
              <button
                key={cat.id}
                type="button"
                className={`btn ${selectedCategory === cat.id ? "btn-primary" : "btn-secondary"}`}
                onClick={() => setSelectedCategory(cat.id)}
                style={{ padding: "0.35rem 0.75rem", fontSize: "0.75rem" }}
              >
                {cat.label}
              </button>
            ))}
          </div>

          <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <span style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>Risco:</span>
            <select
              value={selectedRisk}
              onChange={(e) => setSelectedRisk(e.target.value)}
              style={{
                padding: "0.35rem 0.7rem",
                background: "rgba(0,0,0,0.3)",
                border: "1px solid var(--border-subtle)",
                color: "#fff",
                borderRadius: "6px",
                fontSize: "0.8rem",
              }}
            >
              {risks.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Actions Table with responsive horizontal scroll */}
        <div style={{ width: "100%", overflowX: "auto", WebkitOverflowScrolling: "touch" }}>
          <table className="custom-table" style={{ width: "100%", minWidth: "860px" }}>
            <thead>
              <tr>
                <th style={{ padding: "0.75rem 0.6rem", width: "16%" }}>Action Key</th>
                <th style={{ padding: "0.75rem 0.6rem", width: "24%" }}>Nome da Ação</th>
                <th style={{ padding: "0.75rem 0.6rem", width: "10%" }}>Risco</th>
                <th style={{ padding: "0.75rem 0.6rem", width: "18%" }}>Autonomia</th>
                <th style={{ padding: "0.75rem 0.6rem", width: "10%" }}>Contrato</th>
                <th style={{ padding: "0.75rem 0.6rem", width: "10%" }}>Status</th>
                <th style={{ padding: "0.75rem 0.6rem", width: "12%" }}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {filteredActions.map((act) => (
                <tr
                  key={act.actionKey}
                  onDoubleClick={() => setEditingAction({ ...act })}
                  style={{ cursor: "pointer" }}
                  title="Clique 2x para editar a política desta Action"
                >
                  <td style={{ padding: "0.75rem 0.6rem" }}>
                    <div style={{ fontFamily: "var(--font-mono)", fontWeight: 700, color: "var(--accent-indigo)", fontSize: "0.82rem" }}>
                      {act.actionKey}
                    </div>
                    <span style={{ fontSize: "0.68rem", color: "var(--text-muted)" }}>{act.version}</span>
                  </td>
                  <td style={{ padding: "0.75rem 0.6rem" }}>
                    <div style={{ fontWeight: 600, fontSize: "0.85rem" }}>{act.title}</div>
                    <div style={{ fontSize: "0.72rem", color: "var(--text-secondary)", lineHeight: "1.3" }}>
                      {act.description}
                    </div>
                  </td>
                  <td style={{ padding: "0.75rem 0.6rem" }}>{getRiskBadge(act.risk)}</td>
                  <td style={{ padding: "0.75rem 0.6rem" }}>
                    <div
                      style={{
                        fontSize: "0.75rem",
                        fontWeight: 600,
                        color: act.tenantPolicy.autonomyLevel >= 4 ? "var(--accent-emerald)" : "var(--accent-amber)",
                      }}
                    >
                      {getAutonomyLabel(act.tenantPolicy.autonomyLevel)}
                    </div>
                    {act.tenantPolicy.maintenanceWindowOnly && (
                      <div style={{ fontSize: "0.68rem", color: "var(--text-muted)" }}>🌙 Janela Manut.</div>
                    )}
                  </td>
                  <td style={{ padding: "0.75rem 0.6rem" }}>
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={(e) => {
                        e.stopPropagation();
                        setInspectingAction(act);
                      }}
                      style={{ padding: "0.25rem 0.5rem", fontSize: "0.72rem", whiteSpace: "nowrap" }}
                    >
                      🔍 Contrato
                    </button>
                  </td>
                  <td style={{ padding: "0.75rem 0.6rem" }}>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleToggleAction(act.actionKey);
                      }}
                      style={{
                        background: act.tenantPolicy.enabled ? "rgba(16, 185, 129, 0.2)" : "rgba(244, 63, 94, 0.2)",
                        color: act.tenantPolicy.enabled ? "var(--accent-emerald)" : "var(--accent-rose)",
                        border: "none",
                        padding: "0.25rem 0.5rem",
                        borderRadius: "4px",
                        fontWeight: 600,
                        fontSize: "0.72rem",
                        cursor: "pointer",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {act.tenantPolicy.enabled ? "🟢 HABILITADA" : "⚪ BLOQUEADA"}
                    </button>
                  </td>
                  <td style={{ padding: "0.75rem 0.6rem" }}>
                    <div style={{ display: "flex", gap: "0.3rem", flexWrap: "nowrap" }}>
                      <button
                        className="btn btn-secondary"
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingAction({ ...act });
                        }}
                        style={{ padding: "0.25rem 0.45rem", fontSize: "0.72rem", whiteSpace: "nowrap" }}
                        title="Editar Política de Governança"
                      >
                        ⚙️ Política
                      </button>
                      <button
                        className="btn btn-primary"
                        onClick={(e) => {
                          e.stopPropagation();
                          onOpenActionModal("srv-db-postgres", act.actionKey);
                        }}
                        disabled={!act.tenantPolicy.enabled}
                        style={{ padding: "0.25rem 0.45rem", fontSize: "0.72rem", whiteSpace: "nowrap" }}
                        title="Simular ou Executar Action"
                      >
                        ⚡ Executar
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Editar Política de Governança da Action */}
      {editingAction && (
        <div
          className="modal-overlay"
          onClick={(e) => {
            if (e.target === e.currentTarget) setEditingAction(null);
          }}
        >
          <div className="glass-panel modal-content" style={{ maxWidth: "620px", position: "relative" }}>
            <button
              type="button"
              onClick={() => setEditingAction(null)}
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

            <h3 style={{ fontFamily: "var(--font-heading)", fontSize: "1.25rem", marginBottom: "0.5rem", paddingRight: "2rem" }}>
              ⚙️ Política de Ação: {editingAction.title} ({editingAction.actionKey})
            </h3>
            <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)", marginBottom: "1.25rem" }}>
              Ajuste as regras de execução e travas do Policy Engine para o cliente{" "}
              <strong style={{ color: "var(--accent-indigo)" }}>{activeTenant?.name}</strong>.
            </p>

            <form onSubmit={handleSavePolicy}>
              {/* Status Toggle */}
              <div style={{ marginBottom: "1rem", display: "flex", alignItems: "center", gap: "0.75rem" }}>
                <label style={{ fontSize: "0.85rem", color: "var(--text-secondary)", cursor: "pointer", display: "flex", alignItems: "center", gap: "0.4rem" }}>
                  <input
                    type="checkbox"
                    checked={editingAction.tenantPolicy.enabled}
                    onChange={(e) =>
                      setEditingAction({
                        ...editingAction,
                        tenantPolicy: { ...editingAction.tenantPolicy, enabled: e.target.checked },
                      })
                    }
                  />
                  <strong>Habilitar esta Action para o cliente {activeTenant?.name}</strong>
                </label>
              </div>

              {/* Autonomy Level */}
              <div style={{ marginBottom: "1rem" }}>
                <label style={{ display: "block", fontSize: "0.85rem", color: "var(--text-secondary)", marginBottom: "0.35rem" }}>
                  Nível Máximo de Autonomia Permitido
                </label>
                <select
                  value={editingAction.tenantPolicy.autonomyLevel}
                  onChange={(e) =>
                    setEditingAction({
                      ...editingAction,
                      tenantPolicy: { ...editingAction.tenantPolicy, autonomyLevel: Number(e.target.value) },
                    })
                  }
                  style={{ width: "100%", padding: "0.6rem", background: "rgba(0,0,0,0.3)", border: "1px solid var(--border-subtle)", color: "#fff", borderRadius: "6px" }}
                >
                  <option value={5}>Nível 5: Self-Healing Total (Diagnóstico + Correção + Validação Automática)</option>
                  <option value={4}>Nível 4: Autônomo com Registro (Executa rotinas pré-aprovadas sem prompt)</option>
                  <option value={3}>Nível 3: Requer Aprovação Humana (Gera plano e aguarda clique do operador)</option>
                  <option value={2}>Nível 2: Apenas Recomendação (IA sugere, mas não gera plano)</option>
                  <option value={1}>Nível 1: Apenas Diagnóstico (Somente leitura e coleta de dados)</option>
                </select>
              </div>

              {/* Maintenance Window Restriction */}
              <div style={{ marginBottom: "1.25rem", display: "flex", alignItems: "center", gap: "0.75rem" }}>
                <label style={{ fontSize: "0.85rem", color: "var(--text-secondary)", cursor: "pointer", display: "flex", alignItems: "center", gap: "0.4rem" }}>
                  <input
                    type="checkbox"
                    checked={editingAction.tenantPolicy.maintenanceWindowOnly}
                    onChange={(e) =>
                      setEditingAction({
                        ...editingAction,
                        tenantPolicy: { ...editingAction.tenantPolicy, maintenanceWindowOnly: e.target.checked },
                      })
                    }
                  />
                  Restringir execução exclusivamente para a <strong>Janela de Manutenção Programada</strong>
                </label>
              </div>

              {/* Precheck / Postcheck summary */}
              <div style={{ background: "rgba(0,0,0,0.3)", border: "1px solid var(--border-subtle)", borderRadius: "6px", padding: "0.75rem 1rem", marginBottom: "1.5rem", fontSize: "0.8rem" }}>
                <div style={{ color: "var(--accent-amber)", fontWeight: 700, marginBottom: "0.3rem" }}>
                  🛡️ TRAVAS DE SEGURANÇA IMUTÁVEIS:
                </div>
                <div style={{ color: "var(--text-secondary)", marginBottom: "0.25rem" }}>
                  <strong>Precheck:</strong> {editingAction.precheck}
                </div>
                <div style={{ color: "var(--text-secondary)" }}>
                  <strong>Postcheck:</strong> {editingAction.postcheck}
                </div>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem" }}>
                <button type="button" className="btn btn-secondary" onClick={() => setEditingAction(null)}>
                  Cancelar / Fechar
                </button>
                <button type="submit" className="btn btn-primary">
                  Salvar Política da Action
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Inspeção de Contrato da Action */}
      {inspectingAction && (
        <div
          className="modal-overlay"
          onClick={(e) => {
            if (e.target === e.currentTarget) setInspectingAction(null);
          }}
        >
          <div className="glass-panel modal-content" style={{ maxWidth: "650px", position: "relative" }}>
            <button
              type="button"
              onClick={() => setInspectingAction(null)}
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

            <h3 style={{ fontFamily: "var(--font-heading)", fontSize: "1.25rem", marginBottom: "0.35rem", paddingRight: "2rem" }}>
              📜 Contrato Declarativo: {inspectingAction.title}
            </h3>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.85rem", color: "var(--accent-indigo)", marginBottom: "1rem" }}>
              Action Key: {inspectingAction.actionKey} • Versão: {inspectingAction.version}
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "0.85rem", fontSize: "0.85rem" }}>
              <div style={{ background: "rgba(0,0,0,0.3)", padding: "0.75rem", borderRadius: "6px", border: "1px solid var(--border-subtle)" }}>
                <strong style={{ color: "var(--text-primary)" }}>Descrição:</strong>
                <p style={{ color: "var(--text-secondary)", marginTop: "0.25rem" }}>{inspectingAction.description}</p>
              </div>

              <div style={{ background: "rgba(0,0,0,0.3)", padding: "0.75rem", borderRadius: "6px", border: "1px solid var(--border-subtle)" }}>
                <strong style={{ color: "var(--accent-amber)" }}>Precheck Obrigatório:</strong>
                <p style={{ color: "var(--text-secondary)", marginTop: "0.25rem" }}>{inspectingAction.precheck}</p>
              </div>

              <div style={{ background: "rgba(0,0,0,0.3)", padding: "0.75rem", borderRadius: "6px", border: "1px solid var(--border-subtle)" }}>
                <strong style={{ color: "var(--accent-emerald)" }}>Postcheck Obrigatório:</strong>
                <p style={{ color: "var(--text-secondary)", marginTop: "0.25rem" }}>{inspectingAction.postcheck}</p>
              </div>

              <div style={{ background: "rgba(0,0,0,0.3)", padding: "0.75rem", borderRadius: "6px", border: "1px solid var(--border-subtle)" }}>
                <strong style={{ color: "var(--text-primary)" }}>Schema de Parâmetros Tipados:</strong>
                <ul style={{ marginTop: "0.35rem", paddingLeft: "1.2rem", color: "var(--text-secondary)" }}>
                  {inspectingAction.parameters.map((p) => (
                    <li key={p.name}>
                      <code style={{ color: "var(--accent-indigo)" }}>{p.name}</code> ({p.type}){" "}
                      {p.required ? <span style={{ color: "var(--accent-rose)" }}>*obrigatório</span> : <span style={{ color: "var(--text-muted)" }}>(opcional)</span>}
                      : {p.description}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "1.5rem" }}>
              <button type="button" className="btn btn-primary" onClick={() => setInspectingAction(null)}>
                Fechar Contrato
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
