import React, { useState } from "react";

export function AddWorkloadModal({ isOpen, nodes = [], activeTenant, onAddWorkload, onClose }) {
  const [form, setForm] = useState({
    name: "",
    type: "qemu",
    environment: "on-premise",
    ipAddress: "",
    os: "Ubuntu 22.04 LTS",
    vmid: 100,
    cpus: 4,
    memoryGb: 8,
    nodeId: "standalone",
    monitoringMode: "agent",
  });

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.name) return;
    onAddWorkload({ ...form, tenantId: activeTenant?.id });
    onClose();
  };

  const isStandalone = form.nodeId === "standalone";

  return (
    <div
      className="modal-overlay"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="glass-panel modal-content" style={{ maxWidth: "680px", position: "relative" }}>
        <button
          type="button"
          onClick={onClose}
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
        <h3 style={{ fontFamily: "var(--font-heading)", fontSize: "1.3rem", marginBottom: "0.5rem", paddingRight: "2rem" }}>
          🖥️ Cadastrar Servidor Local / VM ({activeTenant?.name})
        </h3>
        <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)", marginBottom: "1.25rem" }}>
          Cadastre servidores locais on-premise, instâncias de nuvem (AWS/GCP), VPSs dedicadas ou VMs em cluster.
        </p>

        <form onSubmit={handleSubmit}>
          {/* Nome e Ambiente */}
          <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: "1rem", marginBottom: "1rem" }}>
            <div>
              <label style={{ display: "block", fontSize: "0.85rem", color: "var(--text-secondary)", marginBottom: "0.35rem" }}>
                Nome do Servidor / VM / Aplicação
              </label>
              <input
                type="text"
                required
                placeholder="Ex: srv-banco-local ou app-producao"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                style={{ width: "100%", padding: "0.6rem", background: "rgba(0,0,0,0.3)", border: "1px solid var(--border-subtle)", color: "#fff", borderRadius: "6px" }}
              />
            </div>

            <div>
              <label style={{ display: "block", fontSize: "0.85rem", color: "var(--text-secondary)", marginBottom: "0.35rem" }}>
                Tipo de Ambiente / Hospedagem
              </label>
              <select
                value={form.environment}
                onChange={(e) => setForm({ ...form, environment: e.target.value })}
                style={{ width: "100%", padding: "0.6rem", background: "rgba(0,0,0,0.3)", border: "1px solid var(--border-subtle)", color: "#fff", borderRadius: "6px" }}
              >
                <option value="on-premise">🏢 On-Premise (Servidor Local no Cliente)</option>
                <option value="cloud">☁️ Cloud (AWS, GCP, Azure, Oracle)</option>
                <option value="vps">🌐 VPS Dedicada / Hosting</option>
                <option value="cluster">⚡ VM em Cluster Proxmox / Virtualizor</option>
              </select>
            </div>
          </div>

          {/* Hospedagem / Nó */}
          <div style={{ marginBottom: "1rem" }}>
            <label style={{ display: "block", fontSize: "0.85rem", color: "var(--text-secondary)", marginBottom: "0.35rem" }}>
              Vínculo de Hipervisor / Nó
            </label>
            <select
              value={form.nodeId}
              onChange={(e) => setForm({ ...form, nodeId: e.target.value })}
              style={{ width: "100%", padding: "0.6rem", background: "rgba(0,0,0,0.3)", border: "1px solid var(--border-subtle)", color: "#fff", borderRadius: "6px" }}
            >
              <option value="standalone">
                🌐 Servidor Local / Nuvem Standalone (Sem Hipervisor Dedicado)
              </option>
              {nodes.map((n) => (
                <option key={n.id} value={n.id}>
                  ⚡ {n.name} ({n.provider} • {n.ipAddress})
                </option>
              ))}
            </select>
          </div>

          {/* IP / Hostname e Sistema Operacional */}
          <div style={{ display: "grid", gridTemplateColumns: "1.1fr 1fr", gap: "1rem", marginBottom: "1rem" }}>
            <div>
              <label style={{ display: "block", fontSize: "0.85rem", color: "var(--text-secondary)", marginBottom: "0.35rem" }}>
                Endereço IP Local ou Público
              </label>
              <input
                type="text"
                placeholder="Ex: 192.168.1.100 ou srv.empresa.com"
                value={form.ipAddress}
                onChange={(e) => setForm({ ...form, ipAddress: e.target.value })}
                style={{ width: "100%", padding: "0.6rem", background: "rgba(0,0,0,0.3)", border: "1px solid var(--border-subtle)", color: "#fff", borderRadius: "6px" }}
              />
            </div>

            <div>
              <label style={{ display: "block", fontSize: "0.85rem", color: "var(--text-secondary)", marginBottom: "0.35rem" }}>
                Sistema Operacional
              </label>
              <input
                type="text"
                placeholder="Ex: Debian 12, Ubuntu 22.04, Windows"
                value={form.os}
                onChange={(e) => setForm({ ...form, os: e.target.value })}
                style={{ width: "100%", padding: "0.6rem", background: "rgba(0,0,0,0.3)", border: "1px solid var(--border-subtle)", color: "#fff", borderRadius: "6px" }}
              />
            </div>
          </div>

          {/* Recursos de Hardware */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "1rem", marginBottom: "1.5rem" }}>
            <div>
              <label style={{ display: "block", fontSize: "0.8rem", color: "var(--text-secondary)", marginBottom: "0.35rem" }}>Tipo</label>
              <select
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value })}
                style={{ width: "100%", padding: "0.6rem", background: "rgba(0,0,0,0.3)", border: "1px solid var(--border-subtle)", color: "#fff", borderRadius: "6px" }}
              >
                <option value="standalone-server">Servidor Standalone</option>
                <option value="qemu">QEMU / KVM</option>
                <option value="lxc">Container LXC / Docker</option>
                <option value="custom">Aplicação / Banco de Dados</option>
              </select>
            </div>
            <div>
              <label style={{ display: "block", fontSize: "0.8rem", color: "var(--text-secondary)", marginBottom: "0.35rem" }}>vCPUs</label>
              <input
                type="number"
                value={form.cpus}
                onChange={(e) => setForm({ ...form, cpus: e.target.value })}
                style={{ width: "100%", padding: "0.6rem", background: "rgba(0,0,0,0.3)", border: "1px solid var(--border-subtle)", color: "#fff", borderRadius: "6px" }}
              />
            </div>
            <div>
              <label style={{ display: "block", fontSize: "0.8rem", color: "var(--text-secondary)", marginBottom: "0.35rem" }}>RAM (GB)</label>
              <input
                type="number"
                value={form.memoryGb}
                onChange={(e) => setForm({ ...form, memoryGb: e.target.value })}
                style={{ width: "100%", padding: "0.6rem", background: "rgba(0,0,0,0.3)", border: "1px solid var(--border-subtle)", color: "#fff", borderRadius: "6px" }}
              />
            </div>
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem" }}>
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancelar</button>
            <button type="submit" className="btn btn-primary">Salvar Servidor / VM</button>
          </div>
        </form>
      </div>
    </div>
  );
}
