import React, { useState } from "react";

export function AddWorkloadModal({ isOpen, nodes, activeTenant, onAddWorkload, onClose }) {
  const [form, setForm] = useState({
    name: "",
    type: "qemu",
    vmid: 200,
    cpus: 4,
    memoryGb: 8,
    nodeId: nodes[0]?.id || "node-pve01",
  });

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.name) return;
    onAddWorkload({ ...form, tenantId: activeTenant.id });
    onClose();
  };

  return (
    <div className="modal-overlay">
      <div className="glass-panel modal-content">
        <h3 style={{ fontFamily: "var(--font-heading)", fontSize: "1.2rem", marginBottom: "1rem" }}>
          🖥️ Cadastrar Nova VM / Workload
        </h3>
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: "1rem" }}>
            <label style={{ display: "block", fontSize: "0.85rem", color: "var(--text-secondary)", marginBottom: "0.35rem" }}>
              Nome da VM / Instância
            </label>
            <input
              type="text"
              required
              placeholder="Ex: db-postgres-primary"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              style={{ width: "100%", padding: "0.6rem", background: "rgba(0,0,0,0.3)", border: "1px solid var(--border-subtle)", color: "#fff", borderRadius: "6px" }}
            />
          </div>

          <div style={{ marginBottom: "1rem" }}>
            <label style={{ display: "block", fontSize: "0.85rem", color: "var(--text-secondary)", marginBottom: "0.35rem" }}>
              Nó Hospedeiro (Host Node)
            </label>
            <select
              value={form.nodeId}
              onChange={(e) => setForm({ ...form, nodeId: e.target.value })}
              style={{ width: "100%", padding: "0.6rem", background: "rgba(0,0,0,0.3)", border: "1px solid var(--border-subtle)", color: "#fff", borderRadius: "6px" }}
            >
              {nodes.map((n) => (
                <option key={n.id} value={n.id}>{n.name} ({n.provider})</option>
              ))}
            </select>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "1rem", marginBottom: "1.5rem" }}>
            <div>
              <label style={{ display: "block", fontSize: "0.8rem", color: "var(--text-secondary)", marginBottom: "0.35rem" }}>Tipo</label>
              <select
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value })}
                style={{ width: "100%", padding: "0.6rem", background: "rgba(0,0,0,0.3)", border: "1px solid var(--border-subtle)", color: "#fff", borderRadius: "6px" }}
              >
                <option value="qemu">QEMU VM</option>
                <option value="lxc">LXC Container</option>
                <option value="custom">Custom Service</option>
              </select>
            </div>
            <div>
              <label style={{ display: "block", fontSize: "0.8rem", color: "var(--text-secondary)", marginBottom: "0.35rem" }}>CPUs</label>
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
            <button type="submit" className="btn btn-primary">Salvar VM</button>
          </div>
        </form>
      </div>
    </div>
  );
}
