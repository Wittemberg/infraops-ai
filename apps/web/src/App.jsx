import React, { useState } from "react";
import { DashboardView } from "./components/DashboardView.jsx";
import { NodeDetailView } from "./components/NodeDetailView.jsx";
import { AiConsoleView } from "./components/AiConsoleView.jsx";
import { ApprovalsAuditView } from "./components/ApprovalsAuditView.jsx";
import { ActionModal } from "./components/ActionModal.jsx";

export function App() {
  const [currentNav, setCurrentNav] = useState("dashboard");
  const [modalOpen, setModalOpen] = useState(false);
  const [modalTargetId, setModalTargetId] = useState("");
  const [modalActionKey, setModalActionKey] = useState("");

  const handleOpenActionModal = (targetId, actionKey) => {
    setModalTargetId(targetId);
    setModalActionKey(actionKey);
    setModalOpen(true);
  };

  return (
    <div className="app-container">
      {/* Sidebar Navigation */}
      <aside className="sidebar">
        <div className="brand">
          <span>⚡ InfraOps AI</span>
        </div>

        <ul className="nav-list">
          <li
            className={`nav-item ${currentNav === "dashboard" ? "active" : ""}`}
            onClick={() => setCurrentNav("dashboard")}
          >
            📊 Dashboard
          </li>
          <li
            className={`nav-item ${currentNav === "nodes" ? "active" : ""}`}
            onClick={() => setCurrentNav("nodes")}
          >
            🖥️ Nodes & Workloads
          </li>
          <li
            className={`nav-item ${currentNav === "ai" ? "active" : ""}`}
            onClick={() => setCurrentNav("ai")}
          >
            🤖 Console IA
          </li>
          <li
            className={`nav-item ${currentNav === "approvals" ? "active" : ""}`}
            onClick={() => setCurrentNav("approvals")}
          >
            🛡️ Aprovações & Auditoria
          </li>
        </ul>
      </aside>

      {/* Main Content Area */}
      <main className="main-content">
        <header className="top-bar">
          <h1 className="page-title">
            {currentNav === "dashboard" && "Dashboard Operacional"}
            {currentNav === "nodes" && "Inventário de Nós & Hipervisores"}
            {currentNav === "ai" && "Console Operacional de IA"}
            {currentNav === "approvals" && "Central de Aprovações & Auditoria"}
          </h1>

          <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
            <div className="tenant-badge">
              🏢 Tenant: Default Tenant (infraops-prod)
            </div>
            <div style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>
              Usuário: <strong>Admin Operator</strong>
            </div>
          </div>
        </header>

        {/* View Switcher */}
        {currentNav === "dashboard" && <DashboardView onOpenActionModal={handleOpenActionModal} />}
        {currentNav === "nodes" && <NodeDetailView nodeId="node-pve01" onOpenActionModal={handleOpenActionModal} />}
        {currentNav === "ai" && <AiConsoleView onOpenActionModal={handleOpenActionModal} />}
        {currentNav === "approvals" && <ApprovalsAuditView />}
      </main>

      {/* Action Modal */}
      <ActionModal
        isOpen={modalOpen}
        targetId={modalTargetId}
        defaultActionKey={modalActionKey}
        onClose={() => setModalOpen(false)}
      />
    </div>
  );
}
export default App;
