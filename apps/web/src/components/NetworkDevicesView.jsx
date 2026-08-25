import React, { useState, useEffect } from "react";

const API_BASE = "https://infraopsai.awecloudsolution.com";

export function NetworkDevicesView({ activeTenant, currentUser }) {
  const [devices, setDevices] = useState([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState(null);
  const [wanLinks, setWanLinks] = useState([]);
  const [snapshots, setSnapshots] = useState([]);
  const [actionRuns, setActionRuns] = useState([]);
  const [policies, setPolicies] = useState([]);
  const [loading, setLoading] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState(null);

  // Modals
  const [showAddDeviceModal, setShowAddDeviceModal] = useState(false);
  const [showEditDeviceModal, setShowEditDeviceModal] = useState(false);
  const [showDeleteDeviceModal, setShowDeleteDeviceModal] = useState(false);
  const [editingDevice, setEditingDevice] = useState(null);
  const [showAddWanModal, setShowAddWanModal] = useState(false);
  const [actionModalWan, setActionModalWan] = useState(null); // WAN target for primary switch
  const [executingAction, setExecutingAction] = useState(false);

  const [deviceForm, setDeviceForm] = useState({
    name: "",
    vendor: "mikrotik",
    model: "CCR2004-16G-2S+",
    firmwareVersion: "RouterOS v7.15.2",
    serialNumber: "",
    ipAddress: "192.168.80.1",
    managementPort: 58728,
    apiProtocol: "rest_https",
    apiUsername: "rtecnologia55",
    apiPassword: "",
    notes: "",
  });

  const [wanForm, setWanForm] = useState({
    name: "Vivo Fibra 500M",
    provider: "Vivo",
    interfaceName: "ether1",
    ipAddress: "189.40.100.22",
    gatewayIp: "189.40.100.1",
    monitorIp: "8.8.8.8",
    isPrimary: false,
    tier: 2,
    contractSpeedMbps: 500,
  });

  const [policyForm, setPolicyForm] = useState({
    name: "🛡️ Auto-Failover com Anti-Flapping (Perda > 15% ou Queda)",
    enabled: true,
    triggerType: "combined",
    maxPacketLossPercent: 15,
    maxLatencyMs: 250,
    debounceSeconds: 60,
    hysteresisSeconds: 120,
    cooldownMinutes: 15,
    circuitBreakerMaxPerHour: 3,
    autoReturnToPrimary: true,
    minPrimaryHealthyMinutes: 10,
  });

  const headers = {
    "Content-Type": "application/json",
    "x-tenant-id": activeTenant?.id || "tenant-default",
  };

  const loadAllData = async () => {
    setLoading(true);
    try {
      const [devRes, polRes] = await Promise.all([
        fetch(`${API_BASE}/api/v1/network-devices`, { headers }).then((r) => r.json()),
        fetch(`${API_BASE}/api/v1/network-devices/policies`, { headers }).then((r) => r.json()),
      ]);

      const loadedDevices = devRes.devices || [];
      setDevices(loadedDevices);
      setPolicies(polRes.policies || []);

      const currentDevId = selectedDeviceId || loadedDevices[0]?.id;
      if (currentDevId) {
        setSelectedDeviceId(currentDevId);
        await loadDeviceDetails(currentDevId);
      }
    } catch (err) {
      console.warn("Failed to load network devices:", err);
    } finally {
      setLoading(false);
    }
  };

  const loadDeviceDetails = async (deviceId) => {
    try {
      const [wansRes, snapsRes, runsRes, healthRes] = await Promise.all([
        fetch(`${API_BASE}/api/v1/network-devices/${deviceId}/wan-links`, { headers }).then((r) => r.json()),
        fetch(`${API_BASE}/api/v1/network-devices/${deviceId}/snapshots`, { headers }).then((r) => r.json()),
        fetch(`${API_BASE}/api/v1/network-devices/${deviceId}/action-runs`, { headers }).then((r) => r.json()),
        fetch(`${API_BASE}/api/v1/network-devices/${deviceId}/health`, { headers }).then((r) => r.json()),
      ]);

      setWanLinks(wansRes.wanLinks || []);
      setSnapshots(snapsRes.snapshots || []);
      setActionRuns(runsRes.actionRuns || []);

      if (healthRes.device) {
        setDevices((prev) =>
          prev.map((d) => (d.id === deviceId ? healthRes.device : d))
        );
      }
    } catch (err) {
      console.warn("Failed to load device details:", err);
    }
  };

  useEffect(() => {
    loadAllData();
    const interval = setInterval(() => {
      if (selectedDeviceId) {
        loadDeviceDetails(selectedDeviceId);
      }
    }, 10000);
    return () => clearInterval(interval);
  }, [activeTenant?.id, selectedDeviceId]);

  const handleSelectDevice = (id) => {
    setSelectedDeviceId(id);
    loadDeviceDetails(id);
  };

  const handleSaveDevice = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/v1/network-devices`, {
        method: "POST",
        headers,
        body: JSON.stringify({ ...deviceForm, tenantId: activeTenant?.id }),
      });
      const data = await res.json();
      if (res.ok) {
        setFeedbackMsg(`✅ Roteador '${data.device?.name}' cadastrado com sucesso!`);
        setShowAddDeviceModal(false);
        loadAllData();
      } else {
        setFeedbackMsg(`❌ Erro: ${data.error || "Falha ao cadastrar roteador."}`);
      }
    } catch (err) {
      setFeedbackMsg(`❌ Erro: ${err.message}`);
    } finally {
      setLoading(false);
      setTimeout(() => setFeedbackMsg(null), 5000);
    }
  };

  const handleOpenEditDevice = (device) => {
    setEditingDevice(device);
    setDeviceForm({
      name: device.name || "",
      vendor: device.vendor || "mikrotik",
      model: device.model || "",
      firmwareVersion: device.firmwareVersion || "",
      serialNumber: device.serialNumber || "",
      ipAddress: device.ipAddress || "",
      managementPort: device.managementPort || (device.vendor === "pfsense" ? 8181 : 58728),
      apiProtocol: device.apiProtocol || "rest_https",
      apiUsername: device.apiUsername || (device.vendor === "pfsense" ? "admin" : "tecnoteam"),
      apiPassword: "",
      notes: device.notes || "",
    });
    setShowEditDeviceModal(true);
  };

  const handleUpdateDevice = async (e) => {
    e.preventDefault();
    if (!editingDevice) return;
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/v1/network-devices/${editingDevice.id}`, {
        method: "PUT",
        headers,
        body: JSON.stringify({ ...deviceForm, tenantId: activeTenant?.id }),
      });
      const data = await res.json();
      if (res.ok) {
        setFeedbackMsg(`✅ Roteador '${data.device?.name}' atualizado com sucesso!`);
        setShowEditDeviceModal(false);
        loadAllData();
      } else {
        setFeedbackMsg(`❌ Erro: ${data.error || "Falha ao atualizar roteador."}`);
      }
    } catch (err) {
      setFeedbackMsg(`❌ Erro: ${err.message}`);
    } finally {
      setLoading(false);
      setTimeout(() => setFeedbackMsg(null), 5000);
    }
  };

  const handleDeleteDevice = async () => {
    if (!selectedDeviceId) return;
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/v1/network-devices/${selectedDeviceId}`, {
        method: "DELETE",
        headers,
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setFeedbackMsg(`🗑️ Equipamento de rede excluído com sucesso!`);
        setShowDeleteDeviceModal(false);
        setSelectedDeviceId(null);
        loadAllData();
      } else {
        setFeedbackMsg(`❌ Erro: ${data.error || "Falha ao excluir roteador."}`);
      }
    } catch (err) {
      setFeedbackMsg(`❌ Erro: ${err.message}`);
    } finally {
      setLoading(false);
      setTimeout(() => setFeedbackMsg(null), 5000);
    }
  };

  const handleTestConnection = async () => {
    if (!selectedDeviceId) return;
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/v1/network-devices/${selectedDeviceId}/test-connection`, {
        method: "POST",
        headers,
      });
      const data = await res.json();
      if (data.device) {
        setDevices((prev) =>
          prev.map((d) => (d.id === selectedDeviceId ? data.device : d))
        );
      }
      setFeedbackMsg(data.message || (data.success ? "🟢 Conexão OK!" : "🔴 Conexão falhou."));
    } catch (err) {
      setFeedbackMsg(`❌ Erro de Teste de Conexão: ${err.message}`);
    } finally {
      setLoading(false);
      setTimeout(() => setFeedbackMsg(null), 7000);
    }
  };

  const handleSyncTelemetry = async () => {
    setLoading(true);
    try {
      await loadAllData();
      if (selectedDeviceId) {
        const res = await fetch(`${API_BASE}/api/v1/network-devices/${selectedDeviceId}/sync-telemetry`, {
          method: "POST",
          headers,
        });
        const data = await res.json();
        if (res.ok && data.device) {
          setDevices((prev) =>
            prev.map((d) => (d.id === selectedDeviceId ? data.device : d))
          );
          setFeedbackMsg(`🟢 Telemetria de '${data.device.name}' sincronizada! CPU: ${data.device.systemHealth?.cpuUsagePercent}%, RAM: ${data.device.systemHealth?.memoryUsagePercent}%`);
        } else {
          setFeedbackMsg(`❌ ${data.error || "Falha ao sincronizar telemetria."}`);
        }
      }
    } catch (err) {
      setFeedbackMsg(`❌ Erro ao sincronizar: ${err.message}`);
    } finally {
      setLoading(false);
      setTimeout(() => setFeedbackMsg(null), 6000);
    }
  };

  const handleSaveWanLink = async (e) => {
    e.preventDefault();
    if (!selectedDeviceId) return;
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/v1/network-devices/${selectedDeviceId}/wan-links`, {
        method: "POST",
        headers,
        body: JSON.stringify({ ...wanForm, tenantId: activeTenant?.id }),
      });
      const data = await res.json();
      if (res.ok) {
        setFeedbackMsg(`✅ Link WAN '${data.wanLink?.name}' cadastrado com sucesso!`);
        setShowAddWanModal(false);
        loadDeviceDetails(selectedDeviceId);
      } else {
        setFeedbackMsg(`❌ Erro: ${data.error || "Falha ao cadastrar link WAN."}`);
      }
    } catch (err) {
      setFeedbackMsg(`❌ Erro: ${err.message}`);
    } finally {
      setLoading(false);
      setTimeout(() => setFeedbackMsg(null), 5000);
    }
  };

  const handleExecuteSetPrimaryWan = async () => {
    if (!selectedDeviceId || !actionModalWan) return;
    setExecutingAction(true);
    try {
      const res = await fetch(`${API_BASE}/api/v1/network-devices/${selectedDeviceId}/actions/set-primary-wan`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          targetWanId: actionModalWan.id,
          tenantId: activeTenant?.id,
          requestedBy: currentUser?.name || "Operador NOC",
          reason: "Comutação governada de link primário solicitada via painel",
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setFeedbackMsg(`⚡ ${data.message}`);
        setActionModalWan(null);
        loadDeviceDetails(selectedDeviceId);
      } else {
        setFeedbackMsg(`❌ ${data.message || data.error || "Falha na comutação do link."}`);
      }
    } catch (err) {
      setFeedbackMsg(`❌ Erro: ${err.message}`);
    } finally {
      setExecutingAction(false);
      setTimeout(() => setFeedbackMsg(null), 6000);
    }
  };

  const handleExecuteRollback = async (snapshotId) => {
    if (!selectedDeviceId || !snapshotId) return;
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/v1/network-devices/${selectedDeviceId}/actions/rollback`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          snapshotId,
          tenantId: activeTenant?.id,
          requestedBy: currentUser?.name || "Operador NOC",
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setFeedbackMsg(`🛡️ ${data.message}`);
        loadDeviceDetails(selectedDeviceId);
      } else {
        setFeedbackMsg(`❌ ${data.message || data.error || "Falha no rollback."}`);
      }
    } catch (err) {
      setFeedbackMsg(`❌ Erro: ${err.message}`);
    } finally {
      setLoading(false);
      setTimeout(() => setFeedbackMsg(null), 6000);
    }
  };

  const selectedDevice = devices.find((d) => d.id === selectedDeviceId);
  const primaryWan = wanLinks.find((w) => w.isPrimary);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      {/* Header Controls */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h2 style={{ margin: "0 0 4px 0", fontSize: "20px", fontWeight: "700", color: "var(--text-primary)" }}>
            🌐 Roteadores, Firewalls & Links WAN
          </h2>
          <p style={{ margin: 0, fontSize: "13px", color: "var(--text-secondary)" }}>
            Monitoramento em tempo real de equipamentos <strong>MikroTik RouterOS</strong> e <strong>pfSense</strong> com comutação governada de link primário e proteção anti-flapping.
          </p>
        </div>

        <div style={{ display: "flex", gap: "10px" }}>
          <button
            onClick={handleSyncTelemetry}
            disabled={loading}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              padding: "8px 14px",
              borderRadius: "8px",
              border: "1px solid var(--border-color)",
              background: "var(--bg-card)",
              color: "var(--text-primary)",
              cursor: "pointer",
              fontSize: "13px",
              fontWeight: "500",
            }}
          >
            <span>🔄</span> Sincronizar Telemetria
          </button>
          <button
            onClick={() => setShowAddDeviceModal(true)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              padding: "8px 16px",
              borderRadius: "8px",
              border: "none",
              background: "var(--accent-color, #3b82f6)",
              color: "#ffffff",
              cursor: "pointer",
              fontSize: "13px",
              fontWeight: "600",
            }}
          >
            <span>➕</span> Cadastrar Roteador / Firewall
          </button>
        </div>
      </div>

      {/* Feedback Banner */}
      {feedbackMsg && (
        <div
          style={{
            padding: "12px 16px",
            borderRadius: "8px",
            fontSize: "14px",
            background: "rgba(59, 130, 246, 0.12)",
            color: "var(--text-primary)",
            border: "1px solid rgba(59, 130, 246, 0.3)",
          }}
        >
          {feedbackMsg}
        </div>
      )}

      {/* Summary KPI Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "14px" }}>
        <div style={{ padding: "16px", borderRadius: "10px", background: "var(--bg-card)", border: "1px solid var(--border-color)" }}>
          <div style={{ fontSize: "12px", color: "var(--text-secondary)", marginBottom: "4px" }}>📡 Roteadores Ativos</div>
          <div style={{ fontSize: "24px", fontWeight: "700", color: "var(--text-primary)" }}>{devices.length}</div>
          <div style={{ fontSize: "11px", color: "#10b981", marginTop: "4px" }}>
            {devices.filter((d) => d.vendor === "mikrotik").length} MikroTik • {devices.filter((d) => d.vendor === "pfsense").length} pfSense
          </div>
        </div>

        <div style={{ padding: "16px", borderRadius: "10px", background: "var(--bg-card)", border: "1px solid var(--border-color)" }}>
          <div style={{ fontSize: "12px", color: "var(--text-secondary)", marginBottom: "4px" }}>⭐ Link WAN Primário</div>
          <div style={{ fontSize: "20px", fontWeight: "700", color: primaryWan ? "#10b981" : "var(--text-secondary)" }}>
            {primaryWan ? primaryWan.name : "Nenhum link ativo"}
          </div>
          <div style={{ fontSize: "11px", color: "var(--text-secondary)", marginTop: "4px" }}>
            {primaryWan ? `Gateway: ${primaryWan.gatewayIp} (${primaryWan.provider})` : "Configure os links WAN"}
          </div>
        </div>

        <div style={{ padding: "16px", borderRadius: "10px", background: "var(--bg-card)", border: "1px solid var(--border-color)" }}>
          <div style={{ fontSize: "12px", color: "var(--text-secondary)", marginBottom: "4px" }}>📶 Qualidade da Conexão</div>
          <div style={{ fontSize: "24px", fontWeight: "700", color: (primaryWan?.latencyMs || 0) < 50 ? "#10b981" : "#f59e0b" }}>
            {primaryWan ? `${primaryWan.latencyMs} ms` : "--"}
          </div>
          <div style={{ fontSize: "11px", color: primaryWan?.packetLossPercent === 0 ? "#10b981" : "#ef4444", marginTop: "4px" }}>
            {primaryWan ? `Perda de Pacotes: ${primaryWan.packetLossPercent}%` : "Sem telemetria"}
          </div>
        </div>

        <div style={{ padding: "16px", borderRadius: "10px", background: "var(--bg-card)", border: "1px solid var(--border-color)" }}>
          <div style={{ fontSize: "12px", color: "var(--text-secondary)", marginBottom: "4px" }}>🛡️ Proteção Anti-Flapping</div>
          <div style={{ fontSize: "24px", fontWeight: "700", color: "#3b82f6" }}>
            {policies.filter((p) => p.enabled).length} Ativas
          </div>
          <div style={{ fontSize: "11px", color: "var(--text-secondary)", marginTop: "4px" }}>
            Auto-Failover com Debounce & Cooldown
          </div>
        </div>
      </div>

      {/* Device Selector Tabs */}
      <div style={{ display: "flex", gap: "10px", alignItems: "center", borderBottom: "1px solid var(--border-color)", paddingBottom: "12px" }}>
        <span style={{ fontSize: "13px", fontWeight: "600", color: "var(--text-secondary)" }}>Equipamento:</span>
        {devices.map((d) => (
          <button
            key={d.id}
            onClick={() => handleSelectDevice(d.id)}
            style={{
              padding: "6px 14px",
              borderRadius: "20px",
              border: selectedDeviceId === d.id ? "1px solid #3b82f6" : "1px solid var(--border-color)",
              background: selectedDeviceId === d.id ? "rgba(59, 130, 246, 0.15)" : "var(--bg-card)",
              color: selectedDeviceId === d.id ? "#3b82f6" : "var(--text-primary)",
              fontWeight: selectedDeviceId === d.id ? "600" : "400",
              cursor: "pointer",
              fontSize: "13px",
              display: "flex",
              alignItems: "center",
              gap: "6px",
            }}
          >
            <span>{d.vendor === "mikrotik" ? "🔵" : "🔴"}</span>
            {d.name} ({d.ipAddress})
          </button>
        ))}
      </div>

      {/* Main Content for Selected Device */}
      {selectedDevice ? (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: "20px" }}>
          {/* Left Column: WAN Links & Governed Operations */}
          <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            {/* WAN Links Table Card */}
            <div style={{ padding: "20px", borderRadius: "10px", background: "var(--bg-card)", border: "1px solid var(--border-color)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                <div>
                  <h3 style={{ margin: "0 0 2px 0", fontSize: "16px", fontWeight: "700", color: "var(--text-primary)" }}>
                    Links de Internet (WAN Links)
                  </h3>
                  <p style={{ margin: 0, fontSize: "12px", color: "var(--text-secondary)" }}>
                    Métricas em tempo real, monitoramento ICMP e comutação segura de rota padrão.
                  </p>
                </div>
                <button
                  onClick={() => setShowAddWanModal(true)}
                  style={{
                    padding: "6px 12px",
                    borderRadius: "6px",
                    border: "1px solid var(--border-color)",
                    background: "var(--bg-card)",
                    color: "var(--text-primary)",
                    cursor: "pointer",
                    fontSize: "12px",
                    fontWeight: "600",
                  }}
                >
                  <span>➕</span> + Adicionar Link WAN
                </button>
              </div>

              {wanLinks.length === 0 ? (
                <div style={{ padding: "30px", textAlign: "center", color: "var(--text-secondary)" }}>
                  Nenhum link WAN cadastrado para este roteador. Clique no botão acima para adicionar links (ex: Vivo Fibra, Claro, Starlink).
                </div>
              ) : (
                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
                    <thead>
                      <tr style={{ borderBottom: "1px solid var(--border-color)", textAlign: "left", color: "var(--text-secondary)" }}>
                        <th style={{ padding: "10px" }}>Link / Operadora</th>
                        <th style={{ padding: "10px" }}>Interface</th>
                        <th style={{ padding: "10px" }}>Status</th>
                        <th style={{ padding: "10px" }}>Latência</th>
                        <th style={{ padding: "10px" }}>Perda</th>
                        <th style={{ padding: "10px" }}>Consumo Rx / Tx</th>
                        <th style={{ padding: "10px", textAlign: "right" }}>Ações Governadas</th>
                      </tr>
                    </thead>
                    <tbody>
                      {wanLinks.map((wan) => (
                        <tr key={wan.id} style={{ borderBottom: "1px solid var(--border-subtle, rgba(255,255,255,0.05))" }}>
                          <td style={{ padding: "12px 10px" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                              <span style={{ fontWeight: "600", color: "var(--text-primary)" }}>{wan.name}</span>
                              {wan.isPrimary ? (
                                <span
                                  style={{
                                    fontSize: "10px",
                                    padding: "2px 6px",
                                    borderRadius: "10px",
                                    fontWeight: "700",
                                    background: "rgba(16, 185, 129, 0.15)",
                                    color: "#10b981",
                                    border: "1px solid rgba(16, 185, 129, 0.3)",
                                  }}
                                >
                                  ⭐ PRIMÁRIO (Tier 1)
                                </span>
                              ) : (
                                <span
                                  style={{
                                    fontSize: "10px",
                                    padding: "2px 6px",
                                    borderRadius: "10px",
                                    fontWeight: "600",
                                    background: "rgba(100, 116, 139, 0.15)",
                                    color: "var(--text-secondary)",
                                  }}
                                >
                                  BACKUP (Tier 2)
                                </span>
                              )}
                            </div>
                            <div style={{ fontSize: "11px", color: "var(--text-secondary)", marginTop: "2px" }}>
                              Provedor: {wan.provider} • Gateway: {wan.gatewayIp}
                            </div>
                          </td>
                          <td style={{ padding: "12px 10px", fontFamily: "monospace", color: "var(--text-secondary)" }}>
                            {wan.interfaceName}
                          </td>
                          <td style={{ padding: "12px 10px" }}>
                            <span
                              style={{
                                fontSize: "11px",
                                padding: "2px 8px",
                                borderRadius: "6px",
                                fontWeight: "600",
                                background:
                                  wan.status === "up"
                                    ? "rgba(16, 185, 129, 0.15)"
                                    : wan.status === "degraded"
                                    ? "rgba(245, 158, 11, 0.15)"
                                    : "rgba(239, 68, 68, 0.15)",
                                color:
                                  wan.status === "up"
                                    ? "#10b981"
                                    : wan.status === "degraded"
                                    ? "#f59e0b"
                                    : "#ef4444",
                              }}
                            >
                              {wan.status.toUpperCase()}
                            </span>
                          </td>
                          <td style={{ padding: "12px 10px", color: wan.latencyMs < 50 ? "#10b981" : "#f59e0b", fontWeight: "600" }}>
                            {wan.latencyMs} ms
                          </td>
                          <td style={{ padding: "12px 10px", color: wan.packetLossPercent === 0 ? "#10b981" : "#ef4444", fontWeight: "600" }}>
                            {wan.packetLossPercent}%
                          </td>
                          <td style={{ padding: "12px 10px", fontSize: "12px", color: "var(--text-secondary)" }}>
                            ↓ {(wan.rxBps / 1000000).toFixed(1)} Mbps • ↑ {(wan.txBps / 1000000).toFixed(1)} Mbps
                          </td>
                          <td style={{ padding: "12px 10px", textAlign: "right" }}>
                            {!wan.isPrimary ? (
                              <button
                                onClick={() => setActionModalWan(wan)}
                                style={{
                                  padding: "6px 12px",
                                  borderRadius: "6px",
                                  border: "none",
                                  background: "rgba(59, 130, 246, 0.2)",
                                  color: "#3b82f6",
                                  cursor: "pointer",
                                  fontSize: "12px",
                                  fontWeight: "600",
                                }}
                              >
                                ⚡ Tornar Primário
                              </button>
                            ) : (
                              <span style={{ fontSize: "11px", color: "#10b981", fontWeight: "600" }}>
                                ✓ Rota Padrão Ativa
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Governed Action Execution History & Snapshots */}
            <div style={{ padding: "20px", borderRadius: "10px", background: "var(--bg-card)", border: "1px solid var(--border-color)" }}>
              <h3 style={{ margin: "0 0 12px 0", fontSize: "15px", fontWeight: "700", color: "var(--text-primary)" }}>
                🛡️ Snapshots de Mudança & Histórico de Execução
              </h3>
              <p style={{ margin: "0 0 14px 0", fontSize: "12px", color: "var(--text-secondary)" }}>
                Todas as alterações em rotas padrão capturam um snapshot atômico prévio para permitir rollback determinístico em 1 clique.
              </p>

              {snapshots.length === 0 ? (
                <div style={{ fontSize: "13px", color: "var(--text-secondary)", fontStyle: "italic" }}>
                  Nenhum snapshot de mudança gerado até o momento.
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                  {snapshots.slice(0, 5).map((snap) => (
                    <div
                      key={snap.id}
                      style={{
                        padding: "12px",
                        borderRadius: "8px",
                        background: "rgba(0,0,0,0.2)",
                        border: "1px solid var(--border-color)",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}
                    >
                      <div>
                        <div style={{ fontSize: "13px", fontWeight: "600", color: "var(--text-primary)" }}>
                          Snapshot #{snap.id.substring(0, 14)} — Ação: <code>{snap.actionKey}</code>
                        </div>
                        <div style={{ fontSize: "11px", color: "var(--text-secondary)", marginTop: "2px" }}>
                          Capturado em: {new Date(snap.capturedAt).toLocaleString("pt-BR")} • Rotas salvas: {snap.routesBefore.length}
                        </div>
                      </div>
                      <button
                        onClick={() => handleExecuteRollback(snap.id)}
                        disabled={loading}
                        style={{
                          padding: "6px 12px",
                          borderRadius: "6px",
                          border: "1px solid rgba(239, 68, 68, 0.4)",
                          background: "rgba(239, 68, 68, 0.15)",
                          color: "#ef4444",
                          cursor: "pointer",
                          fontSize: "12px",
                          fontWeight: "600",
                        }}
                      >
                        🛡️ Reverter para este Snapshot
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Device Hardware Details & Anti-Flapping Policies */}
          <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            {/* Device Profile Card */}
            <div style={{ padding: "20px", borderRadius: "10px", background: "var(--bg-card)", border: "1px solid var(--border-color)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
                <h3 style={{ margin: 0, fontSize: "15px", fontWeight: "700", color: "var(--text-primary)" }}>
                  ⚙️ Status do Equipamento
                </h3>
                <div style={{ display: "flex", gap: "6px" }}>
                  <button
                    onClick={handleTestConnection}
                    disabled={loading}
                    title="Testar conectividade API em tempo real com o roteador"
                    style={{
                      padding: "4px 8px",
                      borderRadius: "6px",
                      border: "1px solid rgba(16, 185, 129, 0.4)",
                      background: "rgba(16, 185, 129, 0.12)",
                      color: "#10b981",
                      cursor: "pointer",
                      fontSize: "12px",
                      fontWeight: "600",
                    }}
                  >
                    ⚡ Testar Conexão
                  </button>
                  <button
                    onClick={() => handleOpenEditDevice(selectedDevice)}
                    title="Editar dados e credenciais do roteador"
                    style={{
                      padding: "4px 8px",
                      borderRadius: "6px",
                      border: "1px solid var(--border-color)",
                      background: "rgba(59, 130, 246, 0.1)",
                      color: "#3b82f6",
                      cursor: "pointer",
                      fontSize: "12px",
                      fontWeight: "600",
                    }}
                  >
                    ✏️ Editar
                  </button>
                  <button
                    onClick={() => setShowDeleteDeviceModal(true)}
                    title="Remover este equipamento de rede"
                    style={{
                      padding: "4px 8px",
                      borderRadius: "6px",
                      border: "1px solid rgba(239, 68, 68, 0.3)",
                      background: "rgba(239, 68, 68, 0.1)",
                      color: "#ef4444",
                      cursor: "pointer",
                      fontSize: "12px",
                      fontWeight: "600",
                    }}
                  >
                    🗑️ Excluir
                  </button>
                </div>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "10px", fontSize: "13px" }}>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "var(--text-secondary)" }}>Fabricante / SO:</span>
                  <span style={{ fontWeight: "600", color: "var(--text-primary)" }}>
                    {selectedDevice.vendor === "mikrotik" ? "MikroTik RouterOS" : "pfSense Plus"}
                  </span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "var(--text-secondary)" }}>Modelo:</span>
                  <span style={{ fontWeight: "600", color: "var(--text-primary)" }}>{selectedDevice.model}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "var(--text-secondary)" }}>Versão Firmware:</span>
                  <span style={{ fontWeight: "600", color: "var(--text-primary)" }}>{selectedDevice.firmwareVersion}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "var(--text-secondary)" }}>IP de Gerência:</span>
                  <span style={{ fontFamily: "monospace", color: "var(--text-primary)" }}>{selectedDevice.ipAddress}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "var(--text-secondary)" }}>Porta API:</span>
                  <span style={{ fontWeight: "600", color: "var(--text-primary)" }}>{selectedDevice.managementPort}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "var(--text-secondary)" }}>Autenticação:</span>
                  <span style={{ fontSize: "11px", fontWeight: "600", color: "#10b981", background: "rgba(16, 185, 129, 0.12)", padding: "2px 8px", borderRadius: "6px" }}>
                    🔒 Vault AES-256
                  </span>
                </div>

                <div style={{ marginTop: "10px", paddingTop: "10px", borderTop: "1px solid var(--border-color)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                    <span style={{ color: "var(--text-secondary)" }}>Uso de CPU:</span>
                    <span style={{ fontWeight: "600", color: "#10b981" }}>{selectedDevice.systemHealth?.cpuUsagePercent ?? 0}%</span>
                  </div>
                  <div style={{ width: "100%", height: "6px", background: "rgba(255,255,255,0.1)", borderRadius: "3px", overflow: "hidden" }}>
                    <div style={{ width: `${selectedDevice.systemHealth?.cpuUsagePercent ?? 0}%`, height: "100%", background: "#10b981" }} />
                  </div>
                </div>

                <div style={{ marginTop: "4px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                    <span style={{ color: "var(--text-secondary)" }}>Uso de Memória RAM:</span>
                    <span style={{ fontWeight: "600", color: "#3b82f6" }}>{selectedDevice.systemHealth?.memoryUsagePercent ?? 0}%</span>
                  </div>
                  <div style={{ width: "100%", height: "6px", background: "rgba(255,255,255,0.1)", borderRadius: "3px", overflow: "hidden" }}>
                    <div style={{ width: `${selectedDevice.systemHealth?.memoryUsagePercent ?? 0}%`, height: "100%", background: "#3b82f6" }} />
                  </div>
                </div>
              </div>
            </div>

            {/* Anti-Flapping Auto-Failover Policy Card */}
            <div style={{ padding: "20px", borderRadius: "10px", background: "var(--bg-card)", border: "1px solid var(--border-color)" }}>
              <h3 style={{ margin: "0 0 10px 0", fontSize: "15px", fontWeight: "700", color: "var(--text-primary)" }}>
                🛡️ Política de Auto-Failover
              </h3>
              <p style={{ margin: "0 0 14px 0", fontSize: "12px", color: "var(--text-secondary)" }}>
                Parâmetros anti-flapping para proteger o cliente contra trocas sucessivas e instabilidade.
              </p>

              <div style={{ display: "flex", flexDirection: "column", gap: "8px", fontSize: "12px" }}>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "var(--text-secondary)" }}>Gatilho de Perda:</span>
                  <span style={{ fontWeight: "600", color: "var(--text-primary)" }}>&gt; 15% de perda</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "var(--text-secondary)" }}>Gatilho de Latência:</span>
                  <span style={{ fontWeight: "600", color: "var(--text-primary)" }}>&gt; 250 ms</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "var(--text-secondary)" }}>Debounce (Mínimo ruim):</span>
                  <span style={{ fontWeight: "600", color: "#3b82f6" }}>60 segundos</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "var(--text-secondary)" }}>Cooldown (Pausa mínima):</span>
                  <span style={{ fontWeight: "600", color: "#3b82f6" }}>15 minutos</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "var(--text-secondary)" }}>Circuit Breaker:</span>
                  <span style={{ fontWeight: "600", color: "#f59e0b" }}>Máx. 3 trocas / hora</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "var(--text-secondary)" }}>Retorno Automático:</span>
                  <span style={{ fontWeight: "600", color: "#10b981" }}>Ativo (após 10m estável)</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div style={{ padding: "40px", textAlign: "center", background: "var(--bg-card)", borderRadius: "10px", border: "1px solid var(--border-color)" }}>
          <div style={{ fontSize: "32px", marginBottom: "10px" }}>📡</div>
          <h3 style={{ margin: "0 0 6px 0", color: "var(--text-primary)" }}>Nenhum Roteador / Firewall Cadastrado</h3>
          <p style={{ margin: "0 0 16px 0", color: "var(--text-secondary)", fontSize: "14px" }}>
            Cadastre seu primeiro roteador MikroTik ou pfSense para monitorar a integridade da conexão WAN.
          </p>
          <button
            onClick={() => setShowAddDeviceModal(true)}
            style={{
              padding: "8px 16px",
              borderRadius: "8px",
              border: "none",
              background: "var(--accent-color, #3b82f6)",
              color: "#fff",
              fontWeight: "600",
              cursor: "pointer",
            }}
          >
            ➕ Cadastrar Equipamento
          </button>
        </div>
      )}

      {/* Modal: Add Network Device */}
      {showAddDeviceModal && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0,0,0,0.6)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9999,
          }}
        >
          <div style={{ background: "var(--bg-card)", padding: "24px", borderRadius: "12px", maxWidth: "520px", width: "100%", border: "1px solid var(--border-color)" }}>
            <h3 style={{ margin: "0 0 16px 0", color: "var(--text-primary)" }}>➕ Cadastrar Roteador / Firewall</h3>
            <form onSubmit={handleSaveDevice} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <div>
                <label style={{ fontSize: "12px", color: "var(--text-secondary)", display: "block", marginBottom: "4px" }}>Nome do Dispositivo</label>
                <input
                  type="text"
                  required
                  value={deviceForm.name}
                  onChange={(e) => setDeviceForm({ ...deviceForm, name: e.target.value })}
                  placeholder="Ex: MikroTik CCR2004 - Matriz"
                  style={{ width: "100%", padding: "8px", borderRadius: "6px", border: "1px solid var(--border-color)", background: "var(--bg-primary)", color: "var(--text-primary)" }}
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                <div>
                  <label style={{ fontSize: "12px", color: "var(--text-secondary)", display: "block", marginBottom: "4px" }}>Fabricante / SO</label>
                  <select
                    value={deviceForm.vendor}
                    onChange={(e) => {
                      const v = e.target.value;
                      setDeviceForm({
                        ...deviceForm,
                        vendor: v,
                        model: v === "pfsense" ? "Netgate SG-3100" : "CCR2004-16G-2S+",
                        firmwareVersion: v === "pfsense" ? "pfSense Plus 24.03" : "RouterOS v7.15.2",
                        managementPort: v === "pfsense" ? 443 : 8728,
                        apiProtocol: v === "pfsense" ? "xmlrpc" : "rest_https",
                      });
                    }}
                    style={{ width: "100%", padding: "8px", borderRadius: "6px", border: "1px solid var(--border-color)", background: "var(--bg-primary)", color: "var(--text-primary)" }}
                  >
                    <option value="mikrotik">MikroTik RouterOS</option>
                    <option value="pfsense">pfSense / Netgate</option>
                    <option value="generic">Genérico (SNMP)</option>
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: "12px", color: "var(--text-secondary)", display: "block", marginBottom: "4px" }}>Modelo</label>
                  <input
                    type="text"
                    value={deviceForm.model}
                    onChange={(e) => setDeviceForm({ ...deviceForm, model: e.target.value })}
                    style={{ width: "100%", padding: "8px", borderRadius: "6px", border: "1px solid var(--border-color)", background: "var(--bg-primary)", color: "var(--text-primary)" }}
                  />
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "10px" }}>
                <div>
                  <label style={{ fontSize: "12px", color: "var(--text-secondary)", display: "block", marginBottom: "4px" }}>IP de Gerência</label>
                  <input
                    type="text"
                    required
                    value={deviceForm.ipAddress}
                    onChange={(e) => setDeviceForm({ ...deviceForm, ipAddress: e.target.value })}
                    placeholder="192.168.80.1"
                    style={{ width: "100%", padding: "8px", borderRadius: "6px", border: "1px solid var(--border-color)", background: "var(--bg-primary)", color: "var(--text-primary)" }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: "12px", color: "var(--text-secondary)", display: "block", marginBottom: "4px" }}>Porta API</label>
                  <input
                    type="number"
                    value={deviceForm.managementPort}
                    onChange={(e) => setDeviceForm({ ...deviceForm, managementPort: Number(e.target.value) })}
                    style={{ width: "100%", padding: "8px", borderRadius: "6px", border: "1px solid var(--border-color)", background: "var(--bg-primary)", color: "var(--text-primary)" }}
                  />
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                <div>
                  <label style={{ fontSize: "12px", color: "var(--text-secondary)", display: "block", marginBottom: "4px" }}>
                    👤 {deviceForm.vendor === "pfsense" ? "Usuário Admin / API (pfSense)" : deviceForm.vendor === "generic" ? "Usuário SNMPv3 / Community" : "Usuário API (RouterOS)"}
                  </label>
                  <input
                    type="text"
                    required
                    value={deviceForm.apiUsername}
                    onChange={(e) => setDeviceForm({ ...deviceForm, apiUsername: e.target.value })}
                    placeholder={deviceForm.vendor === "pfsense" ? "Ex: admin ou api_user" : deviceForm.vendor === "generic" ? "Ex: public ou snmp_user" : "Ex: rtecnologia55 ou admin"}
                    style={{ width: "100%", padding: "8px", borderRadius: "6px", border: "1px solid var(--border-color)", background: "var(--bg-primary)", color: "var(--text-primary)" }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: "12px", color: "var(--text-secondary)", display: "block", marginBottom: "4px" }}>
                    🔑 {deviceForm.vendor === "pfsense" ? "Senha / FauxAPI Token" : deviceForm.vendor === "generic" ? "Senha / Passphrase Auth" : "Senha API / SSH"}
                  </label>
                  <input
                    type="password"
                    value={deviceForm.apiPassword}
                    onChange={(e) => setDeviceForm({ ...deviceForm, apiPassword: e.target.value })}
                    placeholder={deviceForm.vendor === "pfsense" ? "Senha do pfSense WebGUI" : deviceForm.vendor === "generic" ? "Passphrase SNMP (se houver)" : "Sua senha secreta do MikroTik"}
                    style={{ width: "100%", padding: "8px", borderRadius: "6px", border: "1px solid var(--border-color)", background: "var(--bg-primary)", color: "var(--text-primary)" }}
                  />
                </div>
              </div>

              <div style={{ padding: "8px 12px", borderRadius: "6px", background: "rgba(16, 185, 129, 0.1)", border: "1px solid rgba(16, 185, 129, 0.3)", fontSize: "11px", color: "#10b981", display: "flex", alignItems: "center", gap: "6px" }}>
                <span>🔒</span>
                <span>As credenciais são salvas com criptografia de ponta a ponta (AES-256-GCM Vault) e nunca trafegam em texto puro.</span>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "12px" }}>
                <button
                  type="button"
                  onClick={() => setShowAddDeviceModal(false)}
                  style={{ padding: "8px 14px", borderRadius: "6px", border: "1px solid var(--border-color)", background: "none", color: "var(--text-primary)", cursor: "pointer" }}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  style={{ padding: "8px 18px", borderRadius: "6px", border: "none", background: "#3b82f6", color: "#fff", fontWeight: "600", cursor: "pointer" }}
                >
                  Salvar Roteador
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Edit Device */}
      {showEditDeviceModal && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0,0,0,0.6)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9999,
          }}
        >
          <div style={{ background: "var(--bg-card)", padding: "24px", borderRadius: "12px", maxWidth: "520px", width: "100%", border: "1px solid var(--border-color)" }}>
            <h3 style={{ margin: "0 0 16px 0", color: "var(--text-primary)" }}>✏️ Editar Roteador / Firewall</h3>
            <form onSubmit={handleUpdateDevice} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <div>
                <label style={{ fontSize: "12px", color: "var(--text-secondary)", display: "block", marginBottom: "4px" }}>Nome do Dispositivo</label>
                <input
                  type="text"
                  required
                  value={deviceForm.name}
                  onChange={(e) => setDeviceForm({ ...deviceForm, name: e.target.value })}
                  style={{ width: "100%", padding: "8px", borderRadius: "6px", border: "1px solid var(--border-color)", background: "var(--bg-primary)", color: "var(--text-primary)" }}
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                <div>
                  <label style={{ fontSize: "12px", color: "var(--text-secondary)", display: "block", marginBottom: "4px" }}>Fabricante / SO</label>
                  <select
                    value={deviceForm.vendor}
                    onChange={(e) => setDeviceForm({ ...deviceForm, vendor: e.target.value })}
                    style={{ width: "100%", padding: "8px", borderRadius: "6px", border: "1px solid var(--border-color)", background: "var(--bg-primary)", color: "var(--text-primary)" }}
                  >
                    <option value="mikrotik">MikroTik RouterOS</option>
                    <option value="pfsense">pfSense / Netgate</option>
                    <option value="generic">Genérico (SNMP)</option>
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: "12px", color: "var(--text-secondary)", display: "block", marginBottom: "4px" }}>Modelo</label>
                  <input
                    type="text"
                    value={deviceForm.model}
                    onChange={(e) => setDeviceForm({ ...deviceForm, model: e.target.value })}
                    style={{ width: "100%", padding: "8px", borderRadius: "6px", border: "1px solid var(--border-color)", background: "var(--bg-primary)", color: "var(--text-primary)" }}
                  />
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "10px" }}>
                <div>
                  <label style={{ fontSize: "12px", color: "var(--text-secondary)", display: "block", marginBottom: "4px" }}>IP de Gerência</label>
                  <input
                    type="text"
                    required
                    value={deviceForm.ipAddress}
                    onChange={(e) => setDeviceForm({ ...deviceForm, ipAddress: e.target.value })}
                    style={{ width: "100%", padding: "8px", borderRadius: "6px", border: "1px solid var(--border-color)", background: "var(--bg-primary)", color: "var(--text-primary)" }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: "12px", color: "var(--text-secondary)", display: "block", marginBottom: "4px" }}>Porta API</label>
                  <input
                    type="number"
                    value={deviceForm.managementPort}
                    onChange={(e) => setDeviceForm({ ...deviceForm, managementPort: Number(e.target.value) })}
                    style={{ width: "100%", padding: "8px", borderRadius: "6px", border: "1px solid var(--border-color)", background: "var(--bg-primary)", color: "var(--text-primary)" }}
                  />
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                <div>
                  <label style={{ fontSize: "12px", color: "var(--text-secondary)", display: "block", marginBottom: "4px" }}>
                    👤 Usuário API
                  </label>
                  <input
                    type="text"
                    value={deviceForm.apiUsername}
                    onChange={(e) => setDeviceForm({ ...deviceForm, apiUsername: e.target.value })}
                    placeholder="Atualizar Usuário (opcional)"
                    style={{ width: "100%", padding: "8px", borderRadius: "6px", border: "1px solid var(--border-color)", background: "var(--bg-primary)", color: "var(--text-primary)" }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: "12px", color: "var(--text-secondary)", display: "block", marginBottom: "4px" }}>
                    🔑 Nova Senha / Token
                  </label>
                  <input
                    type="password"
                    value={deviceForm.apiPassword}
                    onChange={(e) => setDeviceForm({ ...deviceForm, apiPassword: e.target.value })}
                    placeholder="Manter a senha atual se em branco"
                    style={{ width: "100%", padding: "8px", borderRadius: "6px", border: "1px solid var(--border-color)", background: "var(--bg-primary)", color: "var(--text-primary)" }}
                  />
                </div>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "12px" }}>
                <button
                  type="button"
                  onClick={() => setShowEditDeviceModal(false)}
                  style={{ padding: "8px 14px", borderRadius: "6px", border: "1px solid var(--border-color)", background: "none", color: "var(--text-primary)", cursor: "pointer" }}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  style={{ padding: "8px 18px", borderRadius: "6px", border: "none", background: "#3b82f6", color: "#fff", fontWeight: "600", cursor: "pointer" }}
                >
                  Salvar Alterações
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Delete Device Confirmation */}
      {showDeleteDeviceModal && selectedDevice && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0,0,0,0.7)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9999,
          }}
        >
          <div style={{ background: "var(--bg-card)", padding: "24px", borderRadius: "12px", maxWidth: "440px", width: "100%", border: "1px solid var(--border-color)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px" }}>
              <span style={{ fontSize: "24px" }}>⚠️</span>
              <h3 style={{ margin: 0, color: "#ef4444" }}>Confirmar Exclusão</h3>
            </div>
            <p style={{ fontSize: "14px", color: "var(--text-primary)", margin: "0 0 12px 0" }}>
              Tem certeza que deseja remover o equipamento <strong>{selectedDevice.name}</strong> ({selectedDevice.ipAddress})?
            </p>
            <p style={{ fontSize: "12px", color: "var(--text-secondary)", margin: "0 0 20px 0" }}>
              Esta ação removerá permanentemente o monitoramento, os links WAN cadastrados e as credenciais associadas no Vault.
            </p>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
              <button
                onClick={() => setShowDeleteDeviceModal(false)}
                disabled={loading}
                style={{ padding: "8px 14px", borderRadius: "6px", border: "1px solid var(--border-color)", background: "none", color: "var(--text-primary)", cursor: "pointer" }}
              >
                Cancelar
              </button>
              <button
                onClick={handleDeleteDevice}
                disabled={loading}
                style={{ padding: "8px 18px", borderRadius: "6px", border: "none", background: "#ef4444", color: "#fff", fontWeight: "600", cursor: "pointer" }}
              >
                Excluir Equipamento
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Add WAN Link */}
      {showAddWanModal && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0,0,0,0.6)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9999,
          }}
        >
          <div style={{ background: "var(--bg-card)", padding: "24px", borderRadius: "12px", maxWidth: "480px", width: "100%", border: "1px solid var(--border-color)" }}>
            <h3 style={{ margin: "0 0 16px 0", color: "var(--text-primary)" }}>➕ Adicionar Link WAN de Internet</h3>
            <form onSubmit={handleSaveWanLink} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <div>
                <label style={{ fontSize: "12px", color: "var(--text-secondary)", display: "block", marginBottom: "4px" }}>Nome do Link</label>
                <input
                  type="text"
                  required
                  value={wanForm.name}
                  onChange={(e) => setWanForm({ ...wanForm, name: e.target.value })}
                  placeholder="Ex: Vivo Fibra 500M"
                  style={{ width: "100%", padding: "8px", borderRadius: "6px", border: "1px solid var(--border-color)", background: "var(--bg-primary)", color: "var(--text-primary)" }}
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                <div>
                  <label style={{ fontSize: "12px", color: "var(--text-secondary)", display: "block", marginBottom: "4px" }}>Operadora</label>
                  <input
                    type="text"
                    required
                    value={wanForm.provider}
                    onChange={(e) => setWanForm({ ...wanForm, provider: e.target.value })}
                    placeholder="Vivo, Claro, Starlink"
                    style={{ width: "100%", padding: "8px", borderRadius: "6px", border: "1px solid var(--border-color)", background: "var(--bg-primary)", color: "var(--text-primary)" }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: "12px", color: "var(--text-secondary)", display: "block", marginBottom: "4px" }}>Interface no Roteador</label>
                  <input
                    type="text"
                    required
                    value={wanForm.interfaceName}
                    onChange={(e) => setWanForm({ ...wanForm, interfaceName: e.target.value })}
                    placeholder="ether1 ou mvneta0"
                    style={{ width: "100%", padding: "8px", borderRadius: "6px", border: "1px solid var(--border-color)", background: "var(--bg-primary)", color: "var(--text-primary)" }}
                  />
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                <div>
                  <label style={{ fontSize: "12px", color: "var(--text-secondary)", display: "block", marginBottom: "4px" }}>Gateway IP</label>
                  <input
                    type="text"
                    required
                    value={wanForm.gatewayIp}
                    onChange={(e) => setWanForm({ ...wanForm, gatewayIp: e.target.value })}
                    placeholder="189.40.100.1"
                    style={{ width: "100%", padding: "8px", borderRadius: "6px", border: "1px solid var(--border-color)", background: "var(--bg-primary)", color: "var(--text-primary)" }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: "12px", color: "var(--text-secondary)", display: "block", marginBottom: "4px" }}>Monitor IP (ICMP)</label>
                  <input
                    type="text"
                    value={wanForm.monitorIp}
                    onChange={(e) => setWanForm({ ...wanForm, monitorIp: e.target.value })}
                    placeholder="8.8.8.8"
                    style={{ width: "100%", padding: "8px", borderRadius: "6px", border: "1px solid var(--border-color)", background: "var(--bg-primary)", color: "var(--text-primary)" }}
                  />
                </div>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "4px" }}>
                <input
                  type="checkbox"
                  id="chkPrimary"
                  checked={wanForm.isPrimary}
                  onChange={(e) => setWanForm({ ...wanForm, isPrimary: e.target.checked })}
                />
                <label htmlFor="chkPrimary" style={{ fontSize: "13px", color: "var(--text-primary)", cursor: "pointer" }}>
                  Definir como Link Primário (Rota Padrão Inicial)
                </label>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "12px" }}>
                <button
                  type="button"
                  onClick={() => setShowAddWanModal(false)}
                  style={{ padding: "8px 14px", borderRadius: "6px", border: "1px solid var(--border-color)", background: "none", color: "var(--text-primary)", cursor: "pointer" }}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  style={{ padding: "8px 18px", borderRadius: "6px", border: "none", background: "#3b82f6", color: "#fff", fontWeight: "600", cursor: "pointer" }}
                >
                  Salvar Link
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Governed WAN Switch Confirmation Modal (ADR-021 Safe Change Workflow) */}
      {actionModalWan && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0,0,0,0.7)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9999,
          }}
        >
          <div style={{ background: "var(--bg-card)", padding: "24px", borderRadius: "12px", maxWidth: "560px", width: "100%", border: "1px solid var(--border-color)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px" }}>
              <span style={{ fontSize: "24px" }}>⚡</span>
              <h3 style={{ margin: 0, color: "var(--text-primary)" }}>Execução Governada: Comutar Link Primário</h3>
            </div>

            <p style={{ margin: "0 0 14px 0", fontSize: "13px", color: "var(--text-secondary)" }}>
              Você está prestes a alterar a rota de saída de Internet padrão do equipamento <strong>{selectedDevice?.name}</strong>.
            </p>

            {/* Before vs After Comparison */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "16px" }}>
              <div style={{ padding: "12px", borderRadius: "8px", background: "rgba(239, 68, 68, 0.1)", border: "1px solid rgba(239, 68, 68, 0.3)" }}>
                <div style={{ fontSize: "11px", color: "var(--text-secondary)", marginBottom: "4px" }}>Link Primário Atual:</div>
                <div style={{ fontSize: "14px", fontWeight: "700", color: "var(--text-primary)" }}>{primaryWan?.name || "Nenhum"}</div>
                <div style={{ fontSize: "11px", color: "var(--text-secondary)", marginTop: "2px" }}>Gateway: {primaryWan?.gatewayIp}</div>
              </div>

              <div style={{ padding: "12px", borderRadius: "8px", background: "rgba(16, 185, 129, 0.1)", border: "1px solid rgba(16, 185, 129, 0.3)" }}>
                <div style={{ fontSize: "11px", color: "#10b981", marginBottom: "4px" }}>Novo Link Primário:</div>
                <div style={{ fontSize: "14px", fontWeight: "700", color: "#10b981" }}>{actionModalWan.name}</div>
                <div style={{ fontSize: "11px", color: "var(--text-secondary)", marginTop: "2px" }}>Gateway: {actionModalWan.gatewayIp}</div>
              </div>
            </div>

            {/* Safety Protocol Summary (ADR-021) */}
            <div style={{ padding: "12px", borderRadius: "8px", background: "rgba(0,0,0,0.25)", border: "1px solid var(--border-color)", marginBottom: "16px", fontSize: "12px" }}>
              <div style={{ fontWeight: "700", color: "var(--text-primary)", marginBottom: "6px" }}>🛡️ Protocolo de Segurança Automatizado:</div>
              <ul style={{ margin: 0, paddingLeft: "18px", color: "var(--text-secondary)", display: "flex", flexDirection: "column", gap: "3px" }}>
                <li><strong>Precheck:</strong> Verifica se a interface <code>{actionModalWan.interfaceName}</code> está UP e com perda &lt; 25%.</li>
                <li><strong>Snapshot:</strong> Salva o estado atual de todas as rotas e métricas antes da gravação.</li>
                <li><strong>Postcheck:</strong> Executa probes de DNS e saída pública para validar tráfego ativo.</li>
                <li><strong>Rollback Automático:</strong> Em caso de falha de validação, restaura o link anterior imediatamente.</li>
              </ul>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
              <button
                onClick={() => setActionModalWan(null)}
                disabled={executingAction}
                style={{ padding: "8px 14px", borderRadius: "6px", border: "1px solid var(--border-color)", background: "none", color: "var(--text-primary)", cursor: "pointer" }}
              >
                Cancelar
              </button>
              <button
                onClick={handleExecuteSetPrimaryWan}
                disabled={executingAction}
                style={{ padding: "8px 20px", borderRadius: "6px", border: "none", background: "#3b82f6", color: "#fff", fontWeight: "600", cursor: "pointer" }}
              >
                {executingAction ? "Comutando Link..." : "Confirmar e Comutar Link"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default NetworkDevicesView;
