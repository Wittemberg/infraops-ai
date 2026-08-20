import React, { useState, useEffect } from "react";
import { NetworkDevicesView } from "./NetworkDevicesView.jsx";

const API_BASE = "https://infraopsai.awecloudsolution.com";

export default function InfrastructureSourceOfTruthView({ activeTenant, currentUser }) {
  const [activeTab, setActiveTab] = useState("assets"); // 'assets', 'racks', 'network', 'discovery', 'operational'
  const [loading, setLoading] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState(null);

  // Domain Data States
  const [sites, setSites] = useState([]);
  const [racks, setRacks] = useState([]);
  const [assets, setAssets] = useState([]);
  const [interfaces, setInterfaces] = useState([]);
  const [connections, setConnections] = useState([]);
  const [vlans, setVlans] = useState([]);
  const [subnets, setSubnets] = useState([]);
  const [ipAddresses, setIpAddresses] = useState([]);
  const [wanCircuits, setWanCircuits] = useState([]);
  const [discoveryCandidates, setDiscoveryCandidates] = useState([]);
  const [healthScore, setHealthScore] = useState(null);
  const [checklists, setChecklists] = useState([]);
  const [monthlyReport, setMonthlyReport] = useState(null);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("ALL");
  const [selectedStatus, setSelectedStatus] = useState("ALL");
  const [selectedRackId, setSelectedRackId] = useState(null);
  const [selectedSubnetId, setSelectedSubnetId] = useState(null);

  // Modals
  const [showAssetModal, setShowAssetModal] = useState(false);
  const [editingAsset, setEditingAsset] = useState(null);
  const [showSiteModal, setShowSiteModal] = useState(false);
  const [showRackModal, setShowRackModal] = useState(false);
  const [showSwitchWizard, setShowSwitchWizard] = useState(false);
  const [showConnectionModal, setShowConnectionModal] = useState(false);
  const [showSubnetModal, setShowSubnetModal] = useState(false);
  const [showVlanModal, setShowVlanModal] = useState(false);
  const [showWanModal, setShowWanModal] = useState(false);
  const [showChecklistModal, setShowChecklistModal] = useState(false);
  const [qrModalAsset, setQrModalAsset] = useState(null);
  const [assetDetailModal, setAssetDetailModal] = useState(null);

  // Forms State
  const [assetForm, setAssetForm] = useState({
    name: "",
    assetTag: "",
    category: "SERVER",
    manufacturer: "",
    model: "",
    serialNumber: "",
    hostname: "",
    managementIp: "",
    primaryMac: "",
    status: "active",
    criticality: "medium",
    siteId: "",
    rackId: "",
    startU: 1,
    heightU: 2,
    face: "front",
    warrantyUntil: "",
    purchaseValue: "",
    notes: "",
  });

  const [wizardForm, setWizardForm] = useState({
    assetId: "",
    copperPortCount: 24,
    copperPrefix: "Gi0/",
    copperSpeedMbps: 1000,
    fiberPortCount: 4,
    fiberPrefix: "SFP+ ",
    fiberSpeedMbps: 10000,
  });

  const [connForm, setConnForm] = useState({
    sourceAssetId: "",
    sourceInterfaceId: "",
    targetAssetId: "",
    targetInterfaceId: "",
    cableType: "cat6",
    cableColor: "blue",
    lengthMeters: 2,
  });

  const [subnetForm, setSubnetForm] = useState({
    cidr: "192.168.10.0/24",
    gateway: "192.168.10.1",
    vlanId: "",
    description: "Subnet Principal de Servidores",
  });

  const [vlanForm, setVlanForm] = useState({
    vlanId: 10,
    name: "Dados / Servidores",
    description: "Rede interna de servidores e produção",
  });

  const [wanForm, setWanForm] = useState({
    providerName: "Claro Fibra Empresas",
    circuitId: "CIR-SP-99482",
    bandwidthMbps: 600,
    ipType: "static",
    staticIp: "38.52.129.130",
    gateway: "38.52.129.1",
    supportPhone: "0800 721 0021",
    status: "active",
  });

  // Fetch all domain data
  const refreshAllData = async () => {
    setLoading(true);
    const headers = { "x-tenant-id": activeTenant?.id || "tenant-default" };
    try {
      const [
        sitesRes,
        racksRes,
        assetsRes,
        ifacesRes,
        connsRes,
        vlansRes,
        subnetsRes,
        ipsRes,
        wanRes,
        discRes,
        healthRes,
        chkRes,
      ] = await Promise.all([
        fetch(`${API_BASE}/api/v1/inventory/sites`, { headers }).then((r) => r.json()),
        fetch(`${API_BASE}/api/v1/inventory/racks`, { headers }).then((r) => r.json()),
        fetch(`${API_BASE}/api/v1/inventory/assets`, { headers }).then((r) => r.json()),
        fetch(`${API_BASE}/api/v1/topology/interfaces`, { headers }).then((r) => r.json()),
        fetch(`${API_BASE}/api/v1/topology/connections`, { headers }).then((r) => r.json()),
        fetch(`${API_BASE}/api/v1/network/vlans`, { headers }).then((r) => r.json()),
        fetch(`${API_BASE}/api/v1/network/subnets`, { headers }).then((r) => r.json()),
        fetch(`${API_BASE}/api/v1/network/ip-addresses`, { headers }).then((r) => r.json()),
        fetch(`${API_BASE}/api/v1/network/wan-circuits`, { headers }).then((r) => r.json()),
        fetch(`${API_BASE}/api/v1/discovery/candidates`, { headers }).then((r) => r.json()),
        fetch(`${API_BASE}/api/v1/operational/health-score`, { headers }).then((r) => r.json()),
        fetch(`${API_BASE}/api/v1/operational/checklists`, { headers }).then((r) => r.json()),
      ]);

      setSites(sitesRes.sites || []);
      setRacks(racksRes.racks || []);
      setAssets(assetsRes.assets || []);
      setInterfaces(ifacesRes.interfaces || []);
      setConnections(connsRes.connections || []);
      setVlans(vlansRes.vlans || []);
      setSubnets(subnetsRes.subnets || []);
      setIpAddresses(ipsRes.ipAddresses || []);
      setWanCircuits(wanRes.wanCircuits || []);
      setDiscoveryCandidates(discRes.candidates || []);
      setHealthScore(healthRes.health || null);
      setChecklists(chkRes.checklists || []);
    } catch (err) {
      console.warn("Failed to load inventory:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshAllData();
  }, [activeTenant?.id]);

  // Handlers
  const handleSaveAsset = async (e) => {
    e.preventDefault();
    setLoading(true);
    const headers = { "Content-Type": "application/json", "x-tenant-id": activeTenant?.id };
    const payload = {
      ...assetForm,
      tenantId: activeTenant?.id,
      rackPosition: assetForm.rackId
        ? { startU: Number(assetForm.startU), heightU: Number(assetForm.heightU), face: assetForm.face }
        : undefined,
    };

    try {
      const url = editingAsset
        ? `${API_BASE}/api/v1/inventory/assets/${editingAsset.id}`
        : `${API_BASE}/api/v1/inventory/assets`;
      const method = editingAsset ? "PUT" : "POST";
      const res = await fetch(url, { method, headers, body: JSON.stringify(payload) });
      const data = await res.json();
      if (!res.ok) {
        setFeedbackMsg(`❌ ${data.error || "Erro ao salvar ativo."}`);
      } else {
        setFeedbackMsg(`✅ Ativo '${payload.name}' salvo com sucesso!`);
        setShowAssetModal(false);
        setEditingAsset(null);
        refreshAllData();
      }
    } catch (err) {
      setFeedbackMsg(`❌ Erro: ${err.message}`);
    } finally {
      setLoading(false);
      setTimeout(() => setFeedbackMsg(null), 5000);
    }
  };

  const handleDeleteAsset = async (id, name) => {
    if (!window.confirm(`Deseja realmente remover o ativo '${name}' do inventário?`)) return;
    setLoading(true);
    const headers = { "x-tenant-id": activeTenant?.id };
    try {
      const res = await fetch(`${API_BASE}/api/v1/inventory/assets/${id}`, { method: "DELETE", headers });
      const data = await res.json();
      if (!res.ok) {
        setFeedbackMsg(`❌ ${data.error || "Erro ao remover ativo."}`);
      } else {
        setFeedbackMsg(`🗑️ Ativo '${name}' removido.`);
        refreshAllData();
      }
    } catch (err) {
      setFeedbackMsg(`❌ Erro: ${err.message}`);
    } finally {
      setLoading(false);
      setTimeout(() => setFeedbackMsg(null), 4000);
    }
  };

  const handleGenerateSwitchPorts = async (e) => {
    e.preventDefault();
    setLoading(true);
    const headers = { "Content-Type": "application/json", "x-tenant-id": activeTenant?.id };
    try {
      const res = await fetch(`${API_BASE}/api/v1/topology/interfaces/generate-switch-ports`, {
        method: "POST",
        headers,
        body: JSON.stringify({ ...wizardForm, tenantId: activeTenant?.id }),
      });
      const data = await res.json();
      if (res.ok) {
        setFeedbackMsg(`⚡ ${data.generatedCount} portas geradas com sucesso para o switch!`);
        setShowSwitchWizard(false);
        refreshAllData();
      } else {
        setFeedbackMsg(`❌ ${data.error || "Erro ao gerar portas."}`);
      }
    } catch (err) {
      setFeedbackMsg(`❌ Erro: ${err.message}`);
    } finally {
      setLoading(false);
      setTimeout(() => setFeedbackMsg(null), 5000);
    }
  };

  const handleSaveConnection = async (e) => {
    e.preventDefault();
    setLoading(true);
    const headers = { "Content-Type": "application/json", "x-tenant-id": activeTenant?.id };
    try {
      const res = await fetch(`${API_BASE}/api/v1/topology/connections`, {
        method: "POST",
        headers,
        body: JSON.stringify({ ...connForm, tenantId: activeTenant?.id }),
      });
      const data = await res.json();
      if (res.ok) {
        setFeedbackMsg("🔌 Conexão física entre portas registrada com sucesso!");
        setShowConnectionModal(false);
        refreshAllData();
      } else {
        setFeedbackMsg(`❌ ${data.error || "Erro ao registrar conexão."}`);
      }
    } catch (err) {
      setFeedbackMsg(`❌ Erro: ${err.message}`);
    } finally {
      setLoading(false);
      setTimeout(() => setFeedbackMsg(null), 5000);
    }
  };

  const handleRunDiscoveryScan = async () => {
    setLoading(true);
    setFeedbackMsg("📡 Varrendo sub-rede via SNMP/LLDP...");
    const headers = { "Content-Type": "application/json", "x-tenant-id": activeTenant?.id };
    try {
      const res = await fetch(`${API_BASE}/api/v1/discovery/scan`, {
        method: "POST",
        headers,
        body: JSON.stringify({ cidr: "38.52.129.0/24", tenantId: activeTenant?.id }),
      });
      const data = await res.json();
      if (res.ok) {
        setFeedbackMsg(`🔍 Varredura concluída: ${data.foundCount} candidatos identificados.`);
        refreshAllData();
      } else {
        setFeedbackMsg(`❌ ${data.error || "Falha na varredura."}`);
      }
    } catch (err) {
      setFeedbackMsg(`❌ Erro: ${err.message}`);
    } finally {
      setLoading(false);
      setTimeout(() => setFeedbackMsg(null), 6000);
    }
  };

  const handleResolveCandidate = async (candidateId, action) => {
    setLoading(true);
    const headers = { "Content-Type": "application/json", "x-tenant-id": activeTenant?.id };
    try {
      const res = await fetch(`${API_BASE}/api/v1/discovery/candidates/${candidateId}/resolve`, {
        method: "POST",
        headers,
        body: JSON.stringify({ action, tenantId: activeTenant?.id }),
      });
      const data = await res.json();
      if (res.ok) {
        setFeedbackMsg(`✅ ${data.message}`);
        refreshAllData();
      } else {
        setFeedbackMsg(`❌ ${data.message || "Erro na reconciliação."}`);
      }
    } catch (err) {
      setFeedbackMsg(`❌ Erro: ${err.message}`);
    } finally {
      setLoading(false);
      setTimeout(() => setFeedbackMsg(null), 5000);
    }
  };

  // Filtered Assets
  const filteredAssets = assets.filter((a) => {
    if (selectedCategory !== "ALL" && a.category !== selectedCategory) return false;
    if (selectedStatus !== "ALL" && a.status !== selectedStatus) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const match =
        a.name.toLowerCase().includes(q) ||
        (a.assetTag && a.assetTag.toLowerCase().includes(q)) ||
        (a.serialNumber && a.serialNumber.toLowerCase().includes(q)) ||
        (a.managementIp && a.managementIp.includes(q)) ||
        (a.primaryMac && a.primaryMac.toLowerCase().includes(q));
      if (!match) return false;
    }
    return true;
  });

  return (
    <div style={{ padding: "24px", maxWidth: "1600px", margin: "0 auto" }}>
      {/* Top Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "20px" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "6px" }}>
            <span style={{ fontSize: "24px" }}>🏢</span>
            <h1 style={{ margin: 0, fontSize: "24px", fontWeight: "700", color: "var(--text-primary)" }}>
              Infraestrutura & Topologia Física
            </h1>
            <span
              style={{
                fontSize: "11px",
                padding: "3px 8px",
                borderRadius: "12px",
                fontWeight: "600",
                background: "rgba(16, 185, 129, 0.15)",
                color: "#10b981",
                border: "1px solid rgba(16, 185, 129, 0.3)",
              }}
            >
              Single Source of Truth
            </span>
          </div>
          <p style={{ margin: 0, fontSize: "14px", color: "var(--text-secondary)" }}>
            Controle documental nativo, inventário físico, elevação de racks, IPAM, conectividade de portas e ferramentas de visita para{" "}
            <strong>{activeTenant?.name || "Organização"}</strong>.
          </p>
        </div>

        <div style={{ display: "flex", gap: "10px" }}>
          <button
            onClick={refreshAllData}
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
            <span>🔄</span>
            Sincronizar
          </button>

          <button
            onClick={() => {
              setEditingAsset(null);
              setAssetForm({
                name: "",
                assetTag: "",
                category: "SERVER",
                manufacturer: "",
                model: "",
                serialNumber: "",
                hostname: "",
                managementIp: "",
                primaryMac: "",
                status: "active",
                criticality: "medium",
                siteId: sites[0]?.id || "",
                rackId: racks[0]?.id || "",
                startU: 1,
                heightU: 2,
                face: "front",
                warrantyUntil: "",
                purchaseValue: "",
                notes: "",
              });
              setShowAssetModal(true);
            }}
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
            <span>➕</span>
            Cadastrar Ativo
          </button>
        </div>
      </div>

      {/* Feedback Alert */}
      {feedbackMsg && (
        <div
          style={{
            padding: "12px 16px",
            borderRadius: "8px",
            marginBottom: "18px",
            fontSize: "14px",
            background: "rgba(59, 130, 246, 0.12)",
            color: "var(--text-primary)",
            border: "1px solid rgba(59, 130, 246, 0.3)",
          }}
        >
          {feedbackMsg}
        </div>
      )}

      {/* Metric Cards Summary */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "14px", marginBottom: "24px" }}>
        <div style={{ padding: "16px", borderRadius: "10px", background: "var(--bg-card)", border: "1px solid var(--border-color)" }}>
          <div style={{ fontSize: "12px", color: "var(--text-secondary)", marginBottom: "4px" }}>📦 Total de Ativos Físicos</div>
          <div style={{ fontSize: "24px", fontWeight: "700", color: "var(--text-primary)" }}>{assets.length}</div>
          <div style={{ fontSize: "11px", color: "#10b981", marginTop: "4px" }}>
            {assets.filter((a) => a.verificationStatus === "verified").length} verificados • {assets.filter((a) => a.category === "SERVER").length} servidores
          </div>
        </div>

        <div style={{ padding: "16px", borderRadius: "10px", background: "var(--bg-card)", border: "1px solid var(--border-color)" }}>
          <div style={{ fontSize: "12px", color: "var(--text-secondary)", marginBottom: "4px" }}>🗄️ Racks & Ocupação</div>
          <div style={{ fontSize: "24px", fontWeight: "700", color: "var(--text-primary)" }}>{racks.length}</div>
          <div style={{ fontSize: "11px", color: "var(--text-secondary)", marginTop: "4px" }}>
            {racks.reduce((acc, r) => acc + (r.heightU || 42), 0)}U capacidade total
          </div>
        </div>

        <div style={{ padding: "16px", borderRadius: "10px", background: "var(--bg-card)", border: "1px solid var(--border-color)" }}>
          <div style={{ fontSize: "12px", color: "var(--text-secondary)", marginBottom: "4px" }}>🔌 Conexões Mapeadas</div>
          <div style={{ fontSize: "24px", fontWeight: "700", color: "var(--text-primary)" }}>{connections.length}</div>
          <div style={{ fontSize: "11px", color: "#3b82f6", marginTop: "4px" }}>
            {interfaces.length} portas de rede cadastradas
          </div>
        </div>

        <div style={{ padding: "16px", borderRadius: "10px", background: "var(--bg-card)", border: "1px solid var(--border-color)" }}>
          <div style={{ fontSize: "12px", color: "var(--text-secondary)", marginBottom: "4px" }}>🛡️ Health Score Documental</div>
          <div style={{ fontSize: "24px", fontWeight: "700", color: healthScore?.score >= 80 ? "#10b981" : "#f59e0b" }}>
            {healthScore?.score || 100}/100 <span style={{ fontSize: "14px", fontWeight: "500" }}>({healthScore?.grade || "A"})</span>
          </div>
          <div style={{ fontSize: "11px", color: "var(--text-secondary)", marginTop: "4px" }}>
            Conformidade física e cadastral
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div
        style={{
          display: "flex",
          gap: "8px",
          borderBottom: "1px solid var(--border-color)",
          marginBottom: "20px",
          overflowX: "auto",
        }}
      >
        <button
          onClick={() => setActiveTab("assets")}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            padding: "10px 16px",
            border: "none",
            background: "none",
            borderBottom: activeTab === "assets" ? "2px solid var(--accent-color, #3b82f6)" : "2px solid transparent",
            color: activeTab === "assets" ? "var(--text-primary)" : "var(--text-secondary)",
            fontWeight: activeTab === "assets" ? "600" : "400",
            cursor: "pointer",
            fontSize: "14px",
          }}
        >
          <span>🖥️</span>
          Customer Infrastructure Book ({assets.length})
        </button>

        <button
          onClick={() => setActiveTab("racks")}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            padding: "10px 16px",
            border: "none",
            background: "none",
            borderBottom: activeTab === "racks" ? "2px solid var(--accent-color, #3b82f6)" : "2px solid transparent",
            color: activeTab === "racks" ? "var(--text-primary)" : "var(--text-secondary)",
            fontWeight: activeTab === "racks" ? "600" : "400",
            cursor: "pointer",
            fontSize: "14px",
          }}
        >
          <span>🗄️</span>
          Racks & Conectividade ({racks.length})
        </button>

        <button
          onClick={() => setActiveTab("network")}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            padding: "10px 16px",
            border: "none",
            background: "none",
            borderBottom: activeTab === "network" ? "2px solid var(--accent-color, #3b82f6)" : "2px solid transparent",
            color: activeTab === "network" ? "var(--text-primary)" : "var(--text-secondary)",
            fontWeight: activeTab === "network" ? "600" : "400",
            cursor: "pointer",
            fontSize: "14px",
          }}
        >
          <span>🌐</span>
          Redes & IPAM ({subnets.length})
        </button>

        <button
          onClick={() => setActiveTab("routers")}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            padding: "10px 16px",
            border: "none",
            background: "none",
            borderBottom: activeTab === "routers" ? "2px solid var(--accent-color, #3b82f6)" : "2px solid transparent",
            color: activeTab === "routers" ? "var(--text-primary)" : "var(--text-secondary)",
            fontWeight: activeTab === "routers" ? "600" : "400",
            cursor: "pointer",
            fontSize: "14px",
          }}
        >
          <span>📡</span>
          Roteadores & Links WAN
        </button>

        <button
          onClick={() => setActiveTab("discovery")}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            padding: "10px 16px",
            border: "none",
            background: "none",
            borderBottom: activeTab === "discovery" ? "2px solid var(--accent-color, #3b82f6)" : "2px solid transparent",
            color: activeTab === "discovery" ? "var(--text-primary)" : "var(--text-secondary)",
            fontWeight: activeTab === "discovery" ? "600" : "400",
            cursor: "pointer",
            fontSize: "14px",
          }}
        >
          <span>📡</span>
          Discovery & Reconciliação ({discoveryCandidates.filter((c) => c.status === "pending").length})
        </button>

        <button
          onClick={() => setActiveTab("operational")}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            padding: "10px 16px",
            border: "none",
            background: "none",
            borderBottom: activeTab === "operational" ? "2px solid var(--accent-color, #3b82f6)" : "2px solid transparent",
            color: activeTab === "operational" ? "var(--text-primary)" : "var(--text-secondary)",
            fontWeight: activeTab === "operational" ? "600" : "400",
            cursor: "pointer",
            fontSize: "14px",
          }}
        >
          <span>📋</span>
          Ferramentas Operacionais
        </button>
      </div>

      {/* TAB 1: CUSTOMER INFRASTRUCTURE BOOK */}
      {activeTab === "assets" && (
        <div>
          {/* Action and Search Bar */}
          <div style={{ display: "flex", gap: "12px", marginBottom: "18px", flexWrap: "wrap" }}>
            <div style={{ position: "relative", flex: 1, minWidth: "260px" }}>
              <span>🔍</span>
              <input
                type="text"
                placeholder="Buscar por nome, patrimônio, serial, IP, MAC ou hostname..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  width: "100%",
                  padding: "9px 12px 9px 36px",
                  borderRadius: "8px",
                  border: "1px solid var(--border-color)",
                  background: "var(--bg-card)",
                  color: "var(--text-primary)",
                  fontSize: "13px",
                }}
              />
            </div>

            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              style={{
                padding: "8px 12px",
                borderRadius: "8px",
                border: "1px solid var(--border-color)",
                background: "var(--bg-card)",
                color: "var(--text-primary)",
                fontSize: "13px",
              }}
            >
              <option value="ALL">Todas as Categorias</option>
              <option value="SERVER">Servidores & Hipervisores</option>
              <option value="SWITCH">Switches</option>
              <option value="FIREWALL">Firewalls & Roteadores</option>
              <option value="ACCESS_POINT">Access Points</option>
              <option value="STORAGE">Storages / NAS</option>
              <option value="UPS">Nobreaks (UPS)</option>
              <option value="OTHER">Outros Dispositivos</option>
            </select>
          </div>

          {/* Assets Table */}
          <div
            style={{
              background: "var(--bg-card)",
              borderRadius: "10px",
              border: "1px solid var(--border-color)",
              overflow: "hidden",
            }}
          >
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px", textAlign: "left" }}>
              <thead>
                <tr style={{ background: "rgba(255, 255, 255, 0.02)", borderBottom: "1px solid var(--border-color)" }}>
                  <th style={{ padding: "12px 16px", color: "var(--text-secondary)", fontWeight: "600" }}>Ativo / Nome</th>
                  <th style={{ padding: "12px 16px", color: "var(--text-secondary)", fontWeight: "600" }}>Categoria</th>
                  <th style={{ padding: "12px 16px", color: "var(--text-secondary)", fontWeight: "600" }}>Patrimônio / Serial</th>
                  <th style={{ padding: "12px 16px", color: "var(--text-secondary)", fontWeight: "600" }}>IP / MAC</th>
                  <th style={{ padding: "12px 16px", color: "var(--text-secondary)", fontWeight: "600" }}>Local / Rack</th>
                  <th style={{ padding: "12px 16px", color: "var(--text-secondary)", fontWeight: "600" }}>Proveniência</th>
                  <th style={{ padding: "12px 16px", color: "var(--text-secondary)", fontWeight: "600", textAlign: "right" }}>Ações</th>
                </tr>
              </thead>
              <tbody>
                {filteredAssets.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ padding: "32px", textAlign: "center", color: "var(--text-secondary)" }}>
                      Nenhum ativo encontrado para os filtros selecionados.
                    </td>
                  </tr>
                ) : (
                  filteredAssets.map((asset) => (
                    <tr
                      key={asset.id}
                      style={{ borderBottom: "1px solid var(--border-color)", transition: "background 0.15s" }}
                    >
                      <td style={{ padding: "12px 16px" }}>
                        <div style={{ fontWeight: "600", color: "var(--text-primary)" }}>{asset.name}</div>
                        <div style={{ fontSize: "11px", color: "var(--text-secondary)" }}>
                          {asset.manufacturer} {asset.model}
                        </div>
                      </td>
                      <td style={{ padding: "12px 16px" }}>
                        <span
                          style={{
                            fontSize: "11px",
                            padding: "2px 8px",
                            borderRadius: "4px",
                            fontWeight: "500",
                            background: "rgba(59, 130, 246, 0.12)",
                            color: "#3b82f6",
                          }}
                        >
                          {asset.category}
                        </span>
                      </td>
                      <td style={{ padding: "12px 16px" }}>
                        <div>{asset.assetTag ? `🏷️ ${asset.assetTag}` : "—"}</div>
                        <div style={{ fontSize: "11px", color: "var(--text-secondary)" }}>
                          {asset.serialNumber ? `S/N: ${asset.serialNumber}` : "Sem serial"}
                        </div>
                      </td>
                      <td style={{ padding: "12px 16px" }}>
                        <div style={{ fontFamily: "monospace" }}>{asset.managementIp || "—"}</div>
                        <div style={{ fontSize: "11px", color: "var(--text-secondary)", fontFamily: "monospace" }}>
                          {asset.primaryMac || "—"}
                        </div>
                      </td>
                      <td style={{ padding: "12px 16px" }}>
                        <div>{racks.find((r) => r.id === asset.rackId)?.name || "Standalone"}</div>
                        {asset.rackPosition && (
                          <div style={{ fontSize: "11px", color: "var(--text-secondary)" }}>
                            U{asset.rackPosition.startU}–U{asset.rackPosition.startU + asset.rackPosition.heightU - 1} ({asset.rackPosition.face})
                          </div>
                        )}
                      </td>
                      <td style={{ padding: "12px 16px" }}>
                        <span
                          style={{
                            fontSize: "10px",
                            padding: "2px 6px",
                            borderRadius: "4px",
                            fontWeight: "600",
                            background:
                              asset.source === "VERIFIED"
                                ? "rgba(16, 185, 129, 0.15)"
                                : asset.source === "DISCOVERED"
                                ? "rgba(245, 158, 11, 0.15)"
                                : "rgba(59, 130, 246, 0.15)",
                            color:
                              asset.source === "VERIFIED"
                                ? "#10b981"
                                : asset.source === "DISCOVERED"
                                ? "#f59e0b"
                                : "#3b82f6",
                          }}
                        >
                          {asset.source}
                        </span>
                      </td>
                      <td style={{ padding: "12px 16px", textAlign: "right" }}>
                        <div style={{ display: "flex", gap: "6px", justifyContent: "flex-end" }}>
                          <button
                            title="Ver Ficha & QR Code"
                            onClick={() => setQrModalAsset(asset)}
                            style={{
                              padding: "6px",
                              borderRadius: "6px",
                              border: "1px solid var(--border-color)",
                              background: "none",
                              color: "var(--text-primary)",
                              cursor: "pointer",
                            }}
                          >
                            <span>📱</span>
                          </button>
                          <button
                            title="Editar Ativo"
                            onClick={() => {
                              setEditingAsset(asset);
                              setAssetForm({
                                name: asset.name || "",
                                assetTag: asset.assetTag || "",
                                category: asset.category || "SERVER",
                                manufacturer: asset.manufacturer || "",
                                model: asset.model || "",
                                serialNumber: asset.serialNumber || "",
                                hostname: asset.hostname || "",
                                managementIp: asset.managementIp || "",
                                primaryMac: asset.primaryMac || "",
                                status: asset.status || "active",
                                criticality: asset.criticality || "medium",
                                siteId: asset.siteId || "",
                                rackId: asset.rackId || "",
                                startU: asset.rackPosition?.startU || 1,
                                heightU: asset.rackPosition?.heightU || 2,
                                face: asset.rackPosition?.face || "front",
                                warrantyUntil: asset.warrantyUntil || "",
                                purchaseValue: asset.purchaseValue || "",
                                notes: asset.notes || "",
                              });
                              setShowAssetModal(true);
                            }}
                            style={{
                              padding: "6px",
                              borderRadius: "6px",
                              border: "1px solid var(--border-color)",
                              background: "none",
                              color: "var(--text-primary)",
                              cursor: "pointer",
                            }}
                          >
                            <span>✏️</span>
                          </button>
                          <button
                            title="Excluir Ativo"
                            onClick={() => handleDeleteAsset(asset.id, asset.name)}
                            style={{
                              padding: "6px",
                              borderRadius: "6px",
                              border: "1px solid var(--border-color)",
                              background: "none",
                              color: "#ef4444",
                              cursor: "pointer",
                            }}
                          >
                            <span>🗑️</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: RACKS & CONECTIVIDADE */}
      {activeTab === "racks" && (
        <div style={{ display: "grid", gridTemplateColumns: "340px 1fr", gap: "24px" }}>
          {/* Rack Elevation Diagram */}
          <div
            style={{
              background: "var(--bg-card)",
              borderRadius: "10px",
              border: "1px solid var(--border-color)",
              padding: "18px",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
              <h3 style={{ margin: 0, fontSize: "15px", fontWeight: "600", color: "var(--text-primary)" }}>
                🗄️ Elevação de Rack (42U)
              </h3>
            </div>

            {/* Visual 42U representation */}
            <div
              style={{
                border: "2px solid var(--border-color)",
                borderRadius: "6px",
                background: "rgba(0, 0, 0, 0.2)",
                padding: "8px",
                maxHeight: "650px",
                overflowY: "auto",
              }}
            >
              {Array.from({ length: 42 }, (_, i) => 42 - i).map((uNumber) => {
                const assetAtU = assets.find(
                  (a) =>
                    a.rackPosition &&
                    uNumber >= a.rackPosition.startU &&
                    uNumber < a.rackPosition.startU + a.rackPosition.heightU
                );

                const isStart = assetAtU && assetAtU.rackPosition?.startU === uNumber;

                return (
                  <div
                    key={uNumber}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      height: "22px",
                      borderBottom: "1px solid rgba(255, 255, 255, 0.05)",
                      fontSize: "10px",
                      fontFamily: "monospace",
                    }}
                  >
                    <span style={{ width: "28px", color: "var(--text-secondary)", textAlign: "right", paddingRight: "6px" }}>
                      U{uNumber}
                    </span>
                    <div
                      style={{
                        flex: 1,
                        height: "100%",
                        background: assetAtU
                          ? assetAtU.category === "SERVER"
                            ? "rgba(59, 130, 246, 0.25)"
                            : assetAtU.category === "SWITCH"
                            ? "rgba(168, 85, 247, 0.25)"
                            : assetAtU.category === "UPS"
                            ? "rgba(16, 185, 129, 0.25)"
                            : "rgba(245, 158, 11, 0.25)"
                          : "transparent",
                        borderLeft: assetAtU ? "3px solid #3b82f6" : "none",
                        display: "flex",
                        alignItems: "center",
                        paddingLeft: "6px",
                        overflow: "hidden",
                        whiteSpace: "nowrap",
                        color: "var(--text-primary)",
                      }}
                    >
                      {isStart ? (
                        <span style={{ fontWeight: "600" }}>{assetAtU.name} ({assetAtU.category})</span>
                      ) : assetAtU ? (
                        <span style={{ color: "var(--text-secondary)", fontSize: "9px" }}>↳ continuação</span>
                      ) : (
                        <span style={{ color: "rgba(255,255,255,0.15)" }}>— livre —</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Switch Wizard & Connections Management */}
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <div>
                <h3 style={{ margin: 0, fontSize: "16px", fontWeight: "600", color: "var(--text-primary)" }}>
                  🔌 Mapeamento de Portas & Conexões
                </h3>
                <p style={{ margin: "2px 0 0", fontSize: "12px", color: "var(--text-secondary)" }}>
                  Documente cabos e portas físicas entre switches, servidores Proxmox e firewalls.
                </p>
              </div>

              <div style={{ display: "flex", gap: "8px" }}>
                <button
                  onClick={() => setShowSwitchWizard(true)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    padding: "7px 12px",
                    borderRadius: "6px",
                    border: "1px solid var(--border-color)",
                    background: "var(--bg-card)",
                    color: "var(--text-primary)",
                    cursor: "pointer",
                    fontSize: "12px",
                    fontWeight: "500",
                  }}
                >
                  <span>⚡</span>
                  Gerador de Portas (Wizard)
                </button>

                <button
                  onClick={() => setShowConnectionModal(true)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    padding: "7px 14px",
                    borderRadius: "6px",
                    border: "none",
                    background: "var(--accent-color, #3b82f6)",
                    color: "#ffffff",
                    cursor: "pointer",
                    fontSize: "12px",
                    fontWeight: "600",
                  }}
                >
                  <span>➕</span>
                  Conectar Portas
                </button>
              </div>
            </div>

            {/* Connections Table */}
            <div
              style={{
                background: "var(--bg-card)",
                borderRadius: "10px",
                border: "1px solid var(--border-color)",
                overflow: "hidden",
              }}
            >
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px", textAlign: "left" }}>
                <thead>
                  <tr style={{ background: "rgba(255, 255, 255, 0.02)", borderBottom: "1px solid var(--border-color)" }}>
                    <th style={{ padding: "12px 16px", color: "var(--text-secondary)" }}>Origem (Ativo / Porta)</th>
                    <th style={{ padding: "12px 16px", color: "var(--text-secondary)" }}>Destino (Ativo / Porta)</th>
                    <th style={{ padding: "12px 16px", color: "var(--text-secondary)" }}>Tipo de Cabo</th>
                    <th style={{ padding: "12px 16px", color: "var(--text-secondary)" }}>Cor / Extensão</th>
                    <th style={{ padding: "12px 16px", color: "var(--text-secondary)", textAlign: "right" }}>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {connections.length === 0 ? (
                    <tr>
                      <td colSpan={5} style={{ padding: "28px", textAlign: "center", color: "var(--text-secondary)" }}>
                        Nenhuma conexão física registrada. Utilize o botão acima para documentar a fiação.
                      </td>
                    </tr>
                  ) : (
                    connections.map((conn) => {
                      const srcAsset = assets.find((a) => a.id === conn.sourceAssetId);
                      const srcIface = interfaces.find((i) => i.id === conn.sourceInterfaceId);
                      const dstAsset = assets.find((a) => a.id === conn.targetAssetId);
                      const dstIface = interfaces.find((i) => i.id === conn.targetInterfaceId);

                      return (
                        <tr key={conn.id} style={{ borderBottom: "1px solid var(--border-color)" }}>
                          <td style={{ padding: "12px 16px" }}>
                            <div style={{ fontWeight: "600", color: "var(--text-primary)" }}>{srcAsset?.name || "Ativo A"}</div>
                            <div style={{ fontSize: "11px", color: "#3b82f6", fontFamily: "monospace" }}>
                              {srcIface?.name || "Porta A"}
                            </div>
                          </td>
                          <td style={{ padding: "12px 16px" }}>
                            <div style={{ fontWeight: "600", color: "var(--text-primary)" }}>{dstAsset?.name || "Ativo B"}</div>
                            <div style={{ fontSize: "11px", color: "#10b981", fontFamily: "monospace" }}>
                              {dstIface?.name || "Porta B"}
                            </div>
                          </td>
                          <td style={{ padding: "12px 16px" }}>
                            <span style={{ textTransform: "uppercase", fontSize: "11px", fontWeight: "600" }}>
                              {conn.cableType}
                            </span>
                          </td>
                          <td style={{ padding: "12px 16px" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                              <span
                                style={{
                                  width: "10px",
                                  height: "10px",
                                  borderRadius: "50%",
                                  background: conn.cableColor || "blue",
                                }}
                              />
                              <span>{conn.cableColor || "Azul"}</span>
                              {conn.lengthMeters && <span style={{ color: "var(--text-secondary)" }}>({conn.lengthMeters}m)</span>}
                            </div>
                          </td>
                          <td style={{ padding: "12px 16px", textAlign: "right" }}>
                            <button
                              onClick={async () => {
                                if (window.confirm("Deseja desconectar este cabo?")) {
                                  await fetch(`${API_BASE}/api/v1/topology/connections/${conn.id}`, {
                                    method: "DELETE",
                                    headers: { "x-tenant-id": activeTenant?.id },
                                  });
                                  refreshAllData();
                                }
                              }}
                              style={{
                                padding: "4px 8px",
                                borderRadius: "4px",
                                border: "1px solid var(--border-color)",
                                background: "none",
                                color: "#ef4444",
                                cursor: "pointer",
                                fontSize: "11px",
                              }}
                            >
                              Desconectar
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: REDES & IPAM */}
      {activeTab === "network" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px" }}>
          {/* Subnets & IPAM */}
          <div
            style={{
              background: "var(--bg-card)",
              borderRadius: "10px",
              border: "1px solid var(--border-color)",
              padding: "18px",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
              <div>
                <h3 style={{ margin: 0, fontSize: "15px", fontWeight: "600", color: "var(--text-primary)" }}>
                  🌐 Subnets & Alocação IPAM
                </h3>
                <p style={{ margin: "2px 0 0", fontSize: "12px", color: "var(--text-secondary)" }}>
                  Segmentação de rede local e faixas IPv4/IPv6.
                </p>
              </div>

              <button
                onClick={() => setShowSubnetModal(true)}
                style={{
                  padding: "6px 12px",
                  borderRadius: "6px",
                  border: "none",
                  background: "var(--accent-color, #3b82f6)",
                  color: "#ffffff",
                  fontSize: "12px",
                  fontWeight: "600",
                  cursor: "pointer",
                }}
              >
                + Nova Subnet
              </button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {subnets.length === 0 ? (
                <div style={{ padding: "20px", textAlign: "center", color: "var(--text-secondary)" }}>
                  Nenhuma subnet cadastrada.
                </div>
              ) : (
                subnets.map((sub) => (
                  <div
                    key={sub.id}
                    style={{
                      padding: "14px",
                      borderRadius: "8px",
                      border: "1px solid var(--border-color)",
                      background: "rgba(255, 255, 255, 0.02)",
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                      <div style={{ fontWeight: "700", color: "var(--text-primary)", fontFamily: "monospace", fontSize: "14px" }}>
                        {sub.cidr}
                      </div>
                      <span style={{ fontSize: "11px", color: "var(--text-secondary)" }}>Gateway: {sub.gateway || "—"}</span>
                    </div>

                    <div style={{ fontSize: "12px", color: "var(--text-secondary)", marginBottom: "8px" }}>
                      {sub.description || "Subnet de produção"}
                    </div>

                    {/* Simple Usage Bar */}
                    <div style={{ height: "6px", borderRadius: "3px", background: "rgba(255, 255, 255, 0.1)", overflow: "hidden" }}>
                      <div style={{ width: "25%", height: "100%", background: "#3b82f6" }} />
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* WAN Circuits */}
          <div
            style={{
              background: "var(--bg-card)",
              borderRadius: "10px",
              border: "1px solid var(--border-color)",
              padding: "18px",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
              <div>
                <h3 style={{ margin: 0, fontSize: "15px", fontWeight: "600", color: "var(--text-primary)" }}>
                  📡 Circuitos WAN & Operadoras
                </h3>
                <p style={{ margin: "2px 0 0", fontSize: "12px", color: "var(--text-secondary)" }}>
                  Links de internet, IPs públicos e contatos de NOC.
                </p>
              </div>

              <button
                onClick={() => setShowWanModal(true)}
                style={{
                  padding: "6px 12px",
                  borderRadius: "6px",
                  border: "none",
                  background: "var(--accent-color, #3b82f6)",
                  color: "#ffffff",
                  fontSize: "12px",
                  fontWeight: "600",
                  cursor: "pointer",
                }}
              >
                + Novo Link WAN
              </button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {wanCircuits.length === 0 ? (
                <div style={{ padding: "20px", textAlign: "center", color: "var(--text-secondary)" }}>
                  Nenhum circuito WAN cadastrado.
                </div>
              ) : (
                wanCircuits.map((wan) => (
                  <div
                    key={wan.id}
                    style={{
                      padding: "14px",
                      borderRadius: "8px",
                      border: "1px solid var(--border-color)",
                      background: "rgba(255, 255, 255, 0.02)",
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
                      <div style={{ fontWeight: "600", color: "var(--text-primary)" }}>{wan.providerName}</div>
                      <span
                        style={{
                          fontSize: "10px",
                          padding: "2px 6px",
                          borderRadius: "4px",
                          fontWeight: "600",
                          background: "rgba(16, 185, 129, 0.15)",
                          color: "#10b981",
                        }}
                      >
                        {wan.bandwidthMbps} Mbps
                      </span>
                    </div>

                    <div style={{ fontSize: "12px", color: "var(--text-secondary)", fontFamily: "monospace" }}>
                      IP Público: {wan.staticIp || "DHCP / Dinâmico"} | Gateway: {wan.gateway || "—"}
                    </div>

                    <div style={{ fontSize: "11px", color: "var(--text-secondary)", marginTop: "6px" }}>
                      📞 Suporte / NOC: {wan.supportPhone || "N/A"} {wan.circuitId && `• Circuito: ${wan.circuitId}`}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: DISCOVERY & RECONCILIAÇÃO */}
      {activeTab === "discovery" && (
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "18px" }}>
            <div>
              <h3 style={{ margin: 0, fontSize: "16px", fontWeight: "600", color: "var(--text-primary)" }}>
                📡 Descoberta de Rede & Motor de Reconciliação
              </h3>
              <p style={{ margin: "2px 0 0", fontSize: "12px", color: "var(--text-secondary)" }}>
                Varredura autorizada via SNMP/LLDP. Correspondências nunca sobrescrevem dados verificados automaticamente.
              </p>
            </div>

            <button
              onClick={handleRunDiscoveryScan}
              disabled={loading}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                padding: "8px 16px",
                borderRadius: "8px",
                border: "none",
                background: "var(--accent-color, #3b82f6)",
                color: "#ffffff",
                fontSize: "13px",
                fontWeight: "600",
                cursor: "pointer",
              }}
            >
              <span>📡</span>
              Executar Varredura de Rede
            </button>
          </div>

          {/* Candidates List */}
          <div
            style={{
              background: "var(--bg-card)",
              borderRadius: "10px",
              border: "1px solid var(--border-color)",
              overflow: "hidden",
            }}
          >
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px", textAlign: "left" }}>
              <thead>
                <tr style={{ background: "rgba(255, 255, 255, 0.02)", borderBottom: "1px solid var(--border-color)" }}>
                  <th style={{ padding: "12px 16px", color: "var(--text-secondary)" }}>Dispositivo Descoberto</th>
                  <th style={{ padding: "12px 16px", color: "var(--text-secondary)" }}>IP / MAC</th>
                  <th style={{ padding: "12px 16px", color: "var(--text-secondary)" }}>Fabricante Detectado</th>
                  <th style={{ padding: "12px 16px", color: "var(--text-secondary)" }}>Score de Confiança</th>
                  <th style={{ padding: "12px 16px", color: "var(--text-secondary)" }}>Status</th>
                  <th style={{ padding: "12px 16px", color: "var(--text-secondary)", textAlign: "right" }}>Ações</th>
                </tr>
              </thead>
              <tbody>
                {discoveryCandidates.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ padding: "32px", textAlign: "center", color: "var(--text-secondary)" }}>
                      Nenhum candidato pendente. Clique no botão acima para iniciar a varredura da sub-rede.
                    </td>
                  </tr>
                ) : (
                  discoveryCandidates.map((cand) => (
                    <tr key={cand.id} style={{ borderBottom: "1px solid var(--border-color)" }}>
                      <td style={{ padding: "12px 16px" }}>
                        <div style={{ fontWeight: "600", color: "var(--text-primary)" }}>{cand.hostname || "Host Desconhecido"}</div>
                        <div style={{ fontSize: "11px", color: "var(--text-secondary)" }}>{cand.detectedCategory}</div>
                      </td>
                      <td style={{ padding: "12px 16px" }}>
                        <div style={{ fontFamily: "monospace" }}>{cand.ipAddress}</div>
                        <div style={{ fontSize: "11px", color: "var(--text-secondary)", fontFamily: "monospace" }}>
                          {cand.macAddress || "—"}
                        </div>
                      </td>
                      <td style={{ padding: "12px 16px" }}>{cand.vendor || "Genérico"}</td>
                      <td style={{ padding: "12px 16px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                          <span
                            style={{
                              fontSize: "12px",
                              fontWeight: "700",
                              color: cand.matchScorePercent >= 80 ? "#10b981" : "#f59e0b",
                            }}
                          >
                            {cand.matchScorePercent}%
                          </span>
                          <span style={{ fontSize: "11px", color: "var(--text-secondary)" }}>
                            {cand.matchReason}
                          </span>
                        </div>
                      </td>
                      <td style={{ padding: "12px 16px" }}>
                        <span
                          style={{
                            fontSize: "10px",
                            padding: "2px 6px",
                            borderRadius: "4px",
                            fontWeight: "600",
                            textTransform: "uppercase",
                            background:
                              cand.status === "merged"
                                ? "rgba(16, 185, 129, 0.15)"
                                : cand.status === "pending"
                                ? "rgba(59, 130, 246, 0.15)"
                                : "rgba(255, 255, 255, 0.08)",
                            color:
                              cand.status === "merged"
                                ? "#10b981"
                                : cand.status === "pending"
                                ? "#3b82f6"
                                : "var(--text-secondary)",
                          }}
                        >
                          {cand.status}
                        </span>
                      </td>
                      <td style={{ padding: "12px 16px", textAlign: "right" }}>
                        {cand.status === "pending" && (
                          <div style={{ display: "flex", gap: "6px", justifyContent: "flex-end" }}>
                            {cand.matchedAssetId && (
                              <button
                                onClick={() => handleResolveCandidate(cand.id, "approve_merge")}
                                style={{
                                  padding: "5px 10px",
                                  borderRadius: "4px",
                                  border: "none",
                                  background: "#10b981",
                                  color: "#ffffff",
                                  fontSize: "11px",
                                  fontWeight: "600",
                                  cursor: "pointer",
                                }}
                              >
                                Mesclar
                              </button>
                            )}
                            <button
                              onClick={() => handleResolveCandidate(cand.id, "create_new")}
                              style={{
                                padding: "5px 10px",
                                borderRadius: "4px",
                                border: "1px solid var(--border-color)",
                                background: "var(--bg-card)",
                                color: "var(--text-primary)",
                                fontSize: "11px",
                                fontWeight: "500",
                                cursor: "pointer",
                              }}
                            >
                              Criar Novo
                            </button>
                            <button
                              onClick={() => handleResolveCandidate(cand.id, "ignore")}
                              style={{
                                padding: "5px 8px",
                                borderRadius: "4px",
                                border: "none",
                                background: "none",
                                color: "var(--text-secondary)",
                                fontSize: "11px",
                                cursor: "pointer",
                              }}
                            >
                              Ignorar
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 5: FERRAMENTAS OPERACIONAIS */}
      {activeTab === "operational" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px" }}>
          {/* Visit Checklists */}
          <div
            style={{
              background: "var(--bg-card)",
              borderRadius: "10px",
              border: "1px solid var(--border-color)",
              padding: "18px",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
              <div>
                <h3 style={{ margin: 0, fontSize: "15px", fontWeight: "600", color: "var(--text-primary)" }}>
                  📋 Checklists de Visita Técnica
                </h3>
                <p style={{ margin: "2px 0 0", fontSize: "12px", color: "var(--text-secondary)" }}>
                  Inspeções físicas presenciais e auditoria preventiva.
                </p>
              </div>

              <button
                onClick={async () => {
                  const tech = prompt("Nome do Técnico Responsável:", currentUser?.name || "Técnico");
                  if (!tech) return;
                  await fetch(`${API_BASE}/api/v1/operational/checklists`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json", "x-tenant-id": activeTenant?.id },
                    body: JSON.stringify({ technicianName: tech, tenantId: activeTenant?.id }),
                  });
                  refreshAllData();
                }}
                style={{
                  padding: "6px 12px",
                  borderRadius: "6px",
                  border: "none",
                  background: "var(--accent-color, #3b82f6)",
                  color: "#ffffff",
                  fontSize: "12px",
                  fontWeight: "600",
                  cursor: "pointer",
                }}
              >
                + Nova Visita
              </button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {checklists.length === 0 ? (
                <div style={{ padding: "20px", textAlign: "center", color: "var(--text-secondary)" }}>
                  Nenhum checklist registrado.
                </div>
              ) : (
                checklists.map((chk) => (
                  <div
                    key={chk.id}
                    style={{
                      padding: "14px",
                      borderRadius: "8px",
                      border: "1px solid var(--border-color)",
                      background: "rgba(255, 255, 255, 0.02)",
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                      <div style={{ fontWeight: "600", color: "var(--text-primary)" }}>
                        Visita Preventiva — {chk.technicianName}
                      </div>
                      <span
                        style={{
                          fontSize: "10px",
                          padding: "2px 6px",
                          borderRadius: "4px",
                          fontWeight: "600",
                          background: chk.status === "completed" ? "rgba(16, 185, 129, 0.15)" : "rgba(245, 158, 11, 0.15)",
                          color: chk.status === "completed" ? "#10b981" : "#f59e0b",
                        }}
                      >
                        {chk.status === "completed" ? "CONCLUÍDA" : "EM ANDAMENTO"}
                      </span>
                    </div>

                    <div style={{ fontSize: "11px", color: "var(--text-secondary)", marginBottom: "10px" }}>
                      Data: {chk.visitDate} • {chk.items?.length || 6} itens auditados
                    </div>

                    {chk.status !== "completed" && (
                      <button
                        onClick={async () => {
                          await fetch(`${API_BASE}/api/v1/operational/checklists/${chk.id}`, {
                            method: "PUT",
                            headers: { "Content-Type": "application/json", "x-tenant-id": activeTenant?.id },
                            body: JSON.stringify({ status: "completed" }),
                          });
                          refreshAllData();
                        }}
                        style={{
                          padding: "4px 10px",
                          borderRadius: "4px",
                          border: "none",
                          background: "#10b981",
                          color: "#ffffff",
                          fontSize: "11px",
                          fontWeight: "600",
                          cursor: "pointer",
                        }}
                      >
                        Concluir e Assinar Visita
                      </button>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Monthly Executive MSP Report */}
          <div
            style={{
              background: "var(--bg-card)",
              borderRadius: "10px",
              border: "1px solid var(--border-color)",
              padding: "18px",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
              <div>
                <h3 style={{ margin: 0, fontSize: "15px", fontWeight: "600", color: "var(--text-primary)" }}>
                  📊 Relatório Mensal de Gestão (MSP)
                </h3>
                <p style={{ margin: "2px 0 0", fontSize: "12px", color: "var(--text-secondary)" }}>
                  Comprovação do valor técnico entregue ao cliente.
                </p>
              </div>

              <button
                onClick={async () => {
                  const res = await fetch(`${API_BASE}/api/v1/operational/monthly-report`, {
                    headers: { "x-tenant-id": activeTenant?.id },
                  });
                  const data = await res.json();
                  setMonthlyReport(data.report);
                }}
                style={{
                  padding: "6px 12px",
                  borderRadius: "6px",
                  border: "none",
                  background: "var(--accent-color, #3b82f6)",
                  color: "#ffffff",
                  fontSize: "12px",
                  fontWeight: "600",
                  cursor: "pointer",
                }}
              >
                Gerar Resumo Executivo
              </button>
            </div>

            {monthlyReport ? (
              <div
                style={{
                  padding: "14px",
                  borderRadius: "8px",
                  border: "1px solid rgba(59, 130, 246, 0.3)",
                  background: "rgba(59, 130, 246, 0.05)",
                }}
              >
                <div style={{ fontWeight: "700", color: "var(--text-primary)", marginBottom: "8px" }}>
                  {monthlyReport.title}
                </div>
                <div style={{ fontSize: "12px", color: "var(--text-secondary)", marginBottom: "12px" }}>
                  Período: {monthlyReport.period}
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", fontSize: "12px", marginBottom: "12px" }}>
                  <div>• Total de Ativos: <strong>{monthlyReport.summary.totalAssets}</strong></div>
                  <div>• Servidores: <strong>{monthlyReport.summary.serversCount}</strong></div>
                  <div>• Conexões Físicas: <strong>{monthlyReport.summary.documentedConnections}</strong></div>
                  <div>• Visitas Concluídas: <strong>{monthlyReport.summary.preventiveVisitsCompleted}</strong></div>
                </div>

                <div style={{ fontSize: "11px", color: "#10b981", fontWeight: "600" }}>
                  ✅ Score Geral de Conformidade: {monthlyReport.summary.overallHealthScore}
                </div>
              </div>
            ) : (
              <div style={{ padding: "30px", textAlign: "center", color: "var(--text-secondary)" }}>
                Clique em "Gerar Resumo Executivo" para consolidar a auditoria mensal.
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB: NETWORK DEVICES & WAN (STAGE 27) */}
      {activeTab === "routers" && (
        <NetworkDevicesView activeTenant={activeTenant} currentUser={currentUser} />
      )}

      {/* MODAL: ASSET CREATE / EDIT */}
      {showAssetModal && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0, 0, 0, 0.7)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
            padding: "20px",
          }}
        >
          <div
            style={{
              background: "var(--bg-card)",
              borderRadius: "12px",
              border: "1px solid var(--border-color)",
              padding: "24px",
              maxWidth: "600px",
              width: "100%",
              maxHeight: "90vh",
              overflowY: "auto",
            }}
          >
            <h3 style={{ margin: "0 0 16px", fontSize: "18px", fontWeight: "700", color: "var(--text-primary)" }}>
              {editingAsset ? "Editar Ativo de Infraestrutura" : "Cadastrar Novo Ativo (Quick Add)"}
            </h3>

            <form onSubmit={handleSaveAsset}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "12px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "12px", color: "var(--text-secondary)", marginBottom: "4px" }}>
                    Nome do Ativo *
                  </label>
                  <input
                    required
                    type="text"
                    placeholder="ex: SRV-CW ou Switch Core 24p"
                    value={assetForm.name}
                    onChange={(e) => setAssetForm({ ...assetForm, name: e.target.value })}
                    style={{
                      width: "100%",
                      padding: "8px 10px",
                      borderRadius: "6px",
                      border: "1px solid var(--border-color)",
                      background: "var(--bg-primary, rgba(0,0,0,0.2))",
                      color: "var(--text-primary)",
                      fontSize: "13px",
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "12px", color: "var(--text-secondary)", marginBottom: "4px" }}>
                    Categoria *
                  </label>
                  <select
                    value={assetForm.category}
                    onChange={(e) => setAssetForm({ ...assetForm, category: e.target.value })}
                    style={{
                      width: "100%",
                      padding: "8px 10px",
                      borderRadius: "6px",
                      border: "1px solid var(--border-color)",
                      background: "var(--bg-primary, rgba(0,0,0,0.2))",
                      color: "var(--text-primary)",
                      fontSize: "13px",
                    }}
                  >
                    <option value="SERVER">Servidor Físico</option>
                    <option value="HYPERVISOR">Hipervisor (Proxmox/Virtualizor)</option>
                    <option value="SWITCH">Switch de Rede</option>
                    <option value="FIREWALL">Firewall / Gateway</option>
                    <option value="ROUTER">Roteador</option>
                    <option value="ACCESS_POINT">Access Point Wi-Fi</option>
                    <option value="STORAGE">Storage SAN/NAS</option>
                    <option value="UPS">Nobreak (UPS)</option>
                    <option value="OTHER">Outro Dispositivo</option>
                  </select>
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "12px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "12px", color: "var(--text-secondary)", marginBottom: "4px" }}>
                    Nº de Patrimônio
                  </label>
                  <input
                    type="text"
                    placeholder="ex: PAT-2026-001"
                    value={assetForm.assetTag}
                    onChange={(e) => setAssetForm({ ...assetForm, assetTag: e.target.value })}
                    style={{
                      width: "100%",
                      padding: "8px 10px",
                      borderRadius: "6px",
                      border: "1px solid var(--border-color)",
                      background: "var(--bg-primary, rgba(0,0,0,0.2))",
                      color: "var(--text-primary)",
                      fontSize: "13px",
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "12px", color: "var(--text-secondary)", marginBottom: "4px" }}>
                    Número de Série (S/N)
                  </label>
                  <input
                    type="text"
                    placeholder="ex: S2940284918"
                    value={assetForm.serialNumber}
                    onChange={(e) => setAssetForm({ ...assetForm, serialNumber: e.target.value })}
                    style={{
                      width: "100%",
                      padding: "8px 10px",
                      borderRadius: "6px",
                      border: "1px solid var(--border-color)",
                      background: "var(--bg-primary, rgba(0,0,0,0.2))",
                      color: "var(--text-primary)",
                      fontSize: "13px",
                    }}
                  />
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "12px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "12px", color: "var(--text-secondary)", marginBottom: "4px" }}>
                    IP de Gerência
                  </label>
                  <input
                    type="text"
                    placeholder="ex: 38.52.129.130"
                    value={assetForm.managementIp}
                    onChange={(e) => setAssetForm({ ...assetForm, managementIp: e.target.value })}
                    style={{
                      width: "100%",
                      padding: "8px 10px",
                      borderRadius: "6px",
                      border: "1px solid var(--border-color)",
                      background: "var(--bg-primary, rgba(0,0,0,0.2))",
                      color: "var(--text-primary)",
                      fontSize: "13px",
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "12px", color: "var(--text-secondary)", marginBottom: "4px" }}>
                    Endereço MAC Principal
                  </label>
                  <input
                    type="text"
                    placeholder="ex: bc:24:11:55:aa:01"
                    value={assetForm.primaryMac}
                    onChange={(e) => setAssetForm({ ...assetForm, primaryMac: e.target.value })}
                    style={{
                      width: "100%",
                      padding: "8px 10px",
                      borderRadius: "6px",
                      border: "1px solid var(--border-color)",
                      background: "var(--bg-primary, rgba(0,0,0,0.2))",
                      color: "var(--text-primary)",
                      fontSize: "13px",
                    }}
                  />
                </div>
              </div>

              {/* Placement in Rack */}
              <div style={{ padding: "12px", borderRadius: "8px", background: "rgba(255,255,255,0.03)", marginBottom: "16px" }}>
                <div style={{ fontSize: "12px", fontWeight: "600", color: "var(--text-primary)", marginBottom: "8px" }}>
                  🗄️ Alocação em Rack
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "10px" }}>
                  <div>
                    <label style={{ display: "block", fontSize: "11px", color: "var(--text-secondary)", marginBottom: "2px" }}>
                      Rack
                    </label>
                    <select
                      value={assetForm.rackId}
                      onChange={(e) => setAssetForm({ ...assetForm, rackId: e.target.value })}
                      style={{
                        width: "100%",
                        padding: "6px 8px",
                        borderRadius: "4px",
                        border: "1px solid var(--border-color)",
                        background: "var(--bg-card)",
                        color: "var(--text-primary)",
                        fontSize: "12px",
                      }}
                    >
                      <option value="">Nenhum (Standalone)</option>
                      {racks.map((r) => (
                        <option key={r.id} value={r.id}>
                          {r.name} ({r.heightU}U)
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label style={{ display: "block", fontSize: "11px", color: "var(--text-secondary)", marginBottom: "2px" }}>
                      Posição Inicial (U)
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={48}
                      value={assetForm.startU}
                      onChange={(e) => setAssetForm({ ...assetForm, startU: e.target.value })}
                      style={{
                        width: "100%",
                        padding: "6px 8px",
                        borderRadius: "4px",
                        border: "1px solid var(--border-color)",
                        background: "var(--bg-card)",
                        color: "var(--text-primary)",
                        fontSize: "12px",
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ display: "block", fontSize: "11px", color: "var(--text-secondary)", marginBottom: "2px" }}>
                      Altura (Us)
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={10}
                      value={assetForm.heightU}
                      onChange={(e) => setAssetForm({ ...assetForm, heightU: e.target.value })}
                      style={{
                        width: "100%",
                        padding: "6px 8px",
                        borderRadius: "4px",
                        border: "1px solid var(--border-color)",
                        background: "var(--bg-card)",
                        color: "var(--text-primary)",
                        fontSize: "12px",
                      }}
                    />
                  </div>
                </div>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
                <button
                  type="button"
                  onClick={() => setShowAssetModal(false)}
                  style={{
                    padding: "8px 14px",
                    borderRadius: "6px",
                    border: "1px solid var(--border-color)",
                    background: "none",
                    color: "var(--text-primary)",
                    cursor: "pointer",
                  }}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  style={{
                    padding: "8px 18px",
                    borderRadius: "6px",
                    border: "none",
                    background: "var(--accent-color, #3b82f6)",
                    color: "#ffffff",
                    fontWeight: "600",
                    cursor: "pointer",
                  }}
                >
                  {loading ? "Salvando..." : "Salvar Ativo"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: SWITCH PORT WIZARD */}
      {showSwitchWizard && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0, 0, 0, 0.7)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
            padding: "20px",
          }}
        >
          <div
            style={{
              background: "var(--bg-card)",
              borderRadius: "12px",
              border: "1px solid var(--border-color)",
              padding: "24px",
              maxWidth: "500px",
              width: "100%",
            }}
          >
            <h3 style={{ margin: "0 0 12px", fontSize: "16px", fontWeight: "700", color: "var(--text-primary)" }}>
              ⚡ Switch Port Wizard (Geração em Lote)
            </h3>
            <p style={{ margin: "0 0 16px", fontSize: "12px", color: "var(--text-secondary)" }}>
              Crie rapidamente todas as portas de rede (RJ45 + SFP+) para o switch selecionado.
            </p>

            <form onSubmit={handleGenerateSwitchPorts}>
              <div style={{ marginBottom: "12px" }}>
                <label style={{ display: "block", fontSize: "12px", color: "var(--text-secondary)", marginBottom: "4px" }}>
                  Selecione o Switch *
                </label>
                <select
                  required
                  value={wizardForm.assetId}
                  onChange={(e) => setWizardForm({ ...wizardForm, assetId: e.target.value })}
                  style={{
                    width: "100%",
                    padding: "8px 10px",
                    borderRadius: "6px",
                    border: "1px solid var(--border-color)",
                    background: "var(--bg-primary, rgba(0,0,0,0.2))",
                    color: "var(--text-primary)",
                    fontSize: "13px",
                  }}
                >
                  <option value="">Escolha um switch cadastrado...</option>
                  {assets
                    .filter((a) => a.category === "SWITCH" || a.category === "FIREWALL")
                    .map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} ({s.manufacturer || "Switch"})
                      </option>
                    ))}
                </select>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "12px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "12px", color: "var(--text-secondary)", marginBottom: "4px" }}>
                    Qtd. Portas Gigabit (RJ45)
                  </label>
                  <input
                    type="number"
                    value={wizardForm.copperPortCount}
                    onChange={(e) => setWizardForm({ ...wizardForm, copperPortCount: Number(e.target.value) })}
                    style={{
                      width: "100%",
                      padding: "8px 10px",
                      borderRadius: "6px",
                      border: "1px solid var(--border-color)",
                      background: "var(--bg-primary, rgba(0,0,0,0.2))",
                      color: "var(--text-primary)",
                      fontSize: "13px",
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "12px", color: "var(--text-secondary)", marginBottom: "4px" }}>
                    Prefixo (ex: Gi0/ ou Port)
                  </label>
                  <input
                    type="text"
                    value={wizardForm.copperPrefix}
                    onChange={(e) => setWizardForm({ ...wizardForm, copperPrefix: e.target.value })}
                    style={{
                      width: "100%",
                      padding: "8px 10px",
                      borderRadius: "6px",
                      border: "1px solid var(--border-color)",
                      background: "var(--bg-primary, rgba(0,0,0,0.2))",
                      color: "var(--text-primary)",
                      fontSize: "13px",
                    }}
                  />
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "16px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "12px", color: "var(--text-secondary)", marginBottom: "4px" }}>
                    Qtd. Portas Uplink SFP+ (10GbE)
                  </label>
                  <input
                    type="number"
                    value={wizardForm.fiberPortCount}
                    onChange={(e) => setWizardForm({ ...wizardForm, fiberPortCount: Number(e.target.value) })}
                    style={{
                      width: "100%",
                      padding: "8px 10px",
                      borderRadius: "6px",
                      border: "1px solid var(--border-color)",
                      background: "var(--bg-primary, rgba(0,0,0,0.2))",
                      color: "var(--text-primary)",
                      fontSize: "13px",
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "12px", color: "var(--text-secondary)", marginBottom: "4px" }}>
                    Prefixo SFP+
                  </label>
                  <input
                    type="text"
                    value={wizardForm.fiberPrefix}
                    onChange={(e) => setWizardForm({ ...wizardForm, fiberPrefix: e.target.value })}
                    style={{
                      width: "100%",
                      padding: "8px 10px",
                      borderRadius: "6px",
                      border: "1px solid var(--border-color)",
                      background: "var(--bg-primary, rgba(0,0,0,0.2))",
                      color: "var(--text-primary)",
                      fontSize: "13px",
                    }}
                  />
                </div>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
                <button
                  type="button"
                  onClick={() => setShowSwitchWizard(false)}
                  style={{
                    padding: "8px 14px",
                    borderRadius: "6px",
                    border: "1px solid var(--border-color)",
                    background: "none",
                    color: "var(--text-primary)",
                    cursor: "pointer",
                  }}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading || !wizardForm.assetId}
                  style={{
                    padding: "8px 18px",
                    borderRadius: "6px",
                    border: "none",
                    background: "var(--accent-color, #3b82f6)",
                    color: "#ffffff",
                    fontWeight: "600",
                    cursor: "pointer",
                  }}
                >
                  Gerar Portas
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: QR CODE PREVIEW */}
      {qrModalAsset && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0, 0, 0, 0.75)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
            padding: "20px",
          }}
        >
          <div
            style={{
              background: "var(--bg-card)",
              borderRadius: "12px",
              border: "1px solid var(--border-color)",
              padding: "24px",
              maxWidth: "400px",
              width: "100%",
              textAlign: "center",
            }}
          >
            <h3 style={{ margin: "0 0 4px", fontSize: "16px", fontWeight: "700", color: "var(--text-primary)" }}>
              Ficha & QR Code de Identificação
            </h3>
            <p style={{ margin: "0 0 16px", fontSize: "12px", color: "var(--text-secondary)" }}>
              {qrModalAsset.name} ({qrModalAsset.category})
            </p>

            {/* Simulated QR Code Graphic */}
            <div
              style={{
                width: "180px",
                height: "180px",
                margin: "0 auto 16px",
                background: "#ffffff",
                padding: "12px",
                borderRadius: "8px",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
              }}
            >
              <span>📱</span>
            </div>

            <div style={{ fontSize: "11px", color: "var(--text-secondary)", marginBottom: "16px", wordBreak: "break-all" }}>
              🔗 ID: <span style={{ fontFamily: "monospace" }}>{qrModalAsset.id}</span>
              <br />
              🏷️ Patrimônio: <strong>{qrModalAsset.assetTag || "N/A"}</strong> | S/N: <strong>{qrModalAsset.serialNumber || "N/A"}</strong>
            </div>

            <button
              onClick={() => setQrModalAsset(null)}
              style={{
                width: "100%",
                padding: "8px 16px",
                borderRadius: "6px",
                border: "none",
                background: "var(--accent-color, #3b82f6)",
                color: "#ffffff",
                fontWeight: "600",
                cursor: "pointer",
              }}
            >
              Fechar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
