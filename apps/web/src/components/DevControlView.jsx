import React, { useState, useEffect } from "react";
import { fetchDevControlOverview } from "../services/devControlApi.js";

export function DevControlView({ currentUser }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadOverview();
  }, []);

  const loadOverview = async () => {
    setLoading(true);
    setError(null);
    try {
      const overview = await fetchDevControlOverview();
      setData(overview);
    } catch (err) {
      setError(err?.message || "Não foi possível carregar os dados do Development Control Center.");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8 text-center" style={{ color: "var(--text-secondary, #94a3b8)" }}>
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-500 mb-4"></div>
        <p className="text-sm font-medium">Carregando dados do Development Control Center...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 rounded-xl border border-red-500/30 bg-red-500/10 text-red-400 max-w-4xl mx-auto my-8">
        <div className="flex items-center gap-3 mb-2">
          <span className="text-xl">⚠️</span>
          <h3 className="font-bold text-lg">Acesso Restrito ou Erro de Servidor</h3>
        </div>
        <p className="text-sm mb-4">{error}</p>
        <button
          onClick={loadOverview}
          className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 border border-red-500/40 text-red-200 text-sm font-medium rounded-lg transition"
        >
          Tentar Novamente
        </button>
      </div>
    );
  }

  if (!data) return null;

  const { project, mvp, fullRoadmap, humanValidation, statusCounts, modules, pendingMvp, futureBacklog, frozenComponents, checkpoints, health, drift } = data;

  const getStatusBadge = (status) => {
    const styles = {
      FROZEN: "bg-cyan-500/20 border-cyan-500/40 text-cyan-300",
      HOMOLOGATED: "bg-emerald-500/20 border-emerald-500/40 text-emerald-300",
      VALIDATION: "bg-amber-500/20 border-amber-500/40 text-amber-300",
      IMPLEMENTED: "bg-blue-500/20 border-blue-500/40 text-blue-300",
      IN_PROGRESS: "bg-purple-500/20 border-purple-500/40 text-purple-300",
      PLANNED: "bg-slate-500/20 border-slate-500/40 text-slate-400",
      BLOCKED: "bg-red-500/20 border-red-500/40 text-red-300",
    };
    return (
      <span className={`px-2.5 py-1 text-xs font-semibold rounded-full border ${styles[status] || styles.PLANNED}`}>
        {status === "FROZEN" && "🔒 "}
        {status}
      </span>
    );
  };

  const getHealthChip = (name, state) => {
    const bg = state === "PASS" ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400" :
               state === "WARNING" ? "bg-amber-500/10 border-amber-500/30 text-amber-400" :
               "bg-red-500/10 border-red-500/30 text-red-400";
    return (
      <div key={name} className={`flex items-center justify-between px-3 py-2 rounded-lg border text-xs font-medium ${bg}`}>
        <span>{name}</span>
        <span className="font-bold">{state}</span>
      </div>
    );
  };

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 shadow-xl backdrop-blur-md">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <span className="text-2xl">🛠️</span>
              <h1 className="text-2xl font-extrabold text-white tracking-tight">{project.name} — Development Control Center</h1>
              <span className="px-3 py-1 bg-cyan-500/20 border border-cyan-500/40 text-cyan-300 text-xs font-bold rounded-full">
                HOMOLOGAÇÃO v{project.developmentControlVersion}
              </span>
            </div>
            <p className="text-sm text-slate-400">
              Painel de Governança Técnica, Invariantes Matemáticas e Cobertura de Homologação Humana.
            </p>
          </div>
          <div className="text-right">
            <div className="text-xs text-slate-400 font-mono mb-1">Fase Atual</div>
            <div className="text-sm font-bold text-cyan-400 bg-cyan-950/40 px-3 py-1.5 rounded-lg border border-cyan-800/40 inline-block">
              {project.currentPhaseName}
            </div>
          </div>
        </div>
      </div>

      {/* Drift Alert (if detected) */}
      {drift && drift.detected && (
        <div className="p-4 rounded-xl border border-amber-500/30 bg-amber-500/10 text-amber-300 text-sm">
          <div className="font-bold mb-1">⚠️ Drift Documental Detectado:</div>
          <ul className="list-disc list-inside space-y-1">
            {drift.items.map((item, idx) => (
              <li key={idx}>{item}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Executive Cards (4 cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Card 1: Prontidão MVP */}
        <div className="p-5 rounded-2xl bg-gradient-to-br from-cyan-950/40 to-slate-900 border border-cyan-500/30 shadow-lg relative overflow-hidden">
          <div className="text-xs font-semibold text-cyan-400 uppercase tracking-wider mb-1">Prontidão MVP</div>
          <div className="text-3xl font-black text-white mb-2">{mvp.readinessPercent}%</div>
          <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden mb-2">
            <div className="bg-gradient-to-r from-cyan-500 to-emerald-400 h-full rounded-full transition-all duration-500" style={{ width: `${mvp.readinessPercent}%` }}></div>
          </div>
          <div className="text-xs text-slate-400 flex justify-between">
            <span>Homologado: {mvp.homologatedWeight} / {mvp.totalWeight} pts</span>
            <span>Impl: {mvp.implementationPercent}%</span>
          </div>
        </div>

        {/* Card 2: Roadmap Implementado */}
        <div className="p-5 rounded-2xl bg-gradient-to-br from-blue-950/40 to-slate-900 border border-blue-500/30 shadow-lg relative overflow-hidden">
          <div className="text-xs font-semibold text-blue-400 uppercase tracking-wider mb-1">Roadmap Implementado</div>
          <div className="text-3xl font-black text-white mb-2">{fullRoadmap.implementationPercent}%</div>
          <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden mb-2">
            <div className="bg-gradient-to-r from-blue-500 to-cyan-400 h-full rounded-full transition-all duration-500" style={{ width: `${fullRoadmap.implementationPercent}%` }}></div>
          </div>
          <div className="text-xs text-slate-400 flex justify-between">
            <span>Peso: {fullRoadmap.implementedWeight} / {fullRoadmap.totalWeight} pts</span>
            <span>Total Caps</span>
          </div>
        </div>

        {/* Card 3: Roadmap Homologado */}
        <div className="p-5 rounded-2xl bg-gradient-to-br from-emerald-950/40 to-slate-900 border border-emerald-500/30 shadow-lg relative overflow-hidden">
          <div className="text-xs font-semibold text-emerald-400 uppercase tracking-wider mb-1">Roadmap Homologado</div>
          <div className="text-3xl font-black text-white mb-2">{fullRoadmap.readinessPercent}%</div>
          <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden mb-2">
            <div className="bg-gradient-to-r from-emerald-500 to-teal-300 h-full rounded-full transition-all duration-500" style={{ width: `${fullRoadmap.readinessPercent}%` }}></div>
          </div>
          <div className="text-xs text-slate-400 flex justify-between">
            <span>Validados: {fullRoadmap.homologatedWeight} / {fullRoadmap.totalWeight} pts</span>
            <span>Full Readiness</span>
          </div>
        </div>

        {/* Card 4: Cobertura de Validação Humana */}
        <div className="p-5 rounded-2xl bg-gradient-to-br from-purple-950/40 to-slate-900 border border-purple-500/30 shadow-lg relative overflow-hidden">
          <div className="text-xs font-semibold text-purple-400 uppercase tracking-wider mb-1">Validação Humana</div>
          <div className="text-3xl font-black text-white mb-2">{humanValidation.coveragePercent}%</div>
          <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden mb-2">
            <div className="bg-gradient-to-r from-purple-500 to-indigo-400 h-full rounded-full transition-all duration-500" style={{ width: `${humanValidation.coveragePercent}%` }}></div>
          </div>
          <div className="text-xs text-slate-400 flex justify-between">
            <span>Aprovados: {humanValidation.approvedWeight} pts</span>
            <span>Testados: {humanValidation.testedWeight} pts</span>
          </div>
        </div>
      </div>

      {/* Status Grid & Health Indicators */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Status Distribution */}
        <div className="lg:col-span-2 p-6 rounded-2xl bg-slate-900/60 border border-slate-800 shadow-lg">
          <h2 className="text-sm font-bold text-slate-200 uppercase tracking-wider mb-4 flex items-center gap-2">
            <span>📊</span> Distribuição de Status por Capability
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 rounded-xl bg-cyan-950/30 border border-cyan-800/40 text-center">
              <div className="text-xs text-cyan-400 font-semibold mb-1">🔒 Frozen</div>
              <div className="text-xl font-bold text-cyan-200">{statusCounts.FROZEN || 0}</div>
            </div>
            <div className="p-3 rounded-xl bg-emerald-950/30 border border-emerald-800/40 text-center">
              <div className="text-xs text-emerald-400 font-semibold mb-1">Homologated</div>
              <div className="text-xl font-bold text-emerald-200">{statusCounts.HOMOLOGATED || 0}</div>
            </div>
            <div className="p-3 rounded-xl bg-amber-950/30 border border-amber-800/40 text-center">
              <div className="text-xs text-amber-400 font-semibold mb-1">Validation</div>
              <div className="text-xl font-bold text-amber-200">{statusCounts.VALIDATION || 0}</div>
            </div>
            <div className="p-3 rounded-xl bg-blue-950/30 border border-blue-800/40 text-center">
              <div className="text-xs text-blue-400 font-semibold mb-1">Implemented</div>
              <div className="text-xl font-bold text-blue-200">{statusCounts.IMPLEMENTED || 0}</div>
            </div>
            <div className="p-3 rounded-xl bg-purple-950/30 border border-purple-800/40 text-center">
              <div className="text-xs text-purple-400 font-semibold mb-1">In Progress</div>
              <div className="text-xl font-bold text-purple-200">{statusCounts.IN_PROGRESS || 0}</div>
            </div>
            <div className="p-3 rounded-xl bg-slate-800/40 border border-slate-700/50 text-center">
              <div className="text-xs text-slate-400 font-semibold mb-1">Planned</div>
              <div className="text-xl font-bold text-slate-300">{statusCounts.PLANNED || 0}</div>
            </div>
            <div className="p-3 rounded-xl bg-red-950/30 border border-red-800/40 text-center">
              <div className="text-xs text-red-400 font-semibold mb-1">Blocked</div>
              <div className="text-xl font-bold text-red-200">{statusCounts.BLOCKED || 0}</div>
            </div>
            <div className="p-3 rounded-xl bg-slate-800/20 border border-slate-700/30 text-center">
              <div className="text-xs text-slate-500 font-semibold mb-1">Unmapped</div>
              <div className="text-xl font-bold text-slate-400">{statusCounts.UNMAPPED || 0}</div>
            </div>
          </div>
        </div>

        {/* Project Health */}
        <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 shadow-lg">
          <h2 className="text-sm font-bold text-slate-200 uppercase tracking-wider mb-4 flex items-center gap-2">
            <span>🛡️</span> Saúde do Projeto
          </h2>
          <div className="space-y-2.5">
            {getHealthChip("Código fonte", health.code)}
            {getHealthChip("Testes de Invariantes", health.tests)}
            {getHealthChip("Build de Produção", health.build)}
            {getHealthChip("Deployment Portainer", health.deployment)}
            {getHealthChip("Documentação & ADRs", health.documentation)}
            {getHealthChip("Validação Humana", health.manualValidation)}
          </div>
        </div>
      </div>

      {/* Modules Progress Table */}
      <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 shadow-lg">
        <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
          <span>📦</span> Progresso por Módulo
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="border-b border-slate-800 text-xs uppercase text-slate-400 tracking-wider">
                <th className="py-3 px-4">Módulo</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-center">Peso</th>
                <th className="py-3 px-4">Implementação</th>
                <th className="py-3 px-4">Homologação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {modules.map((mod) => (
                <tr key={mod.id} className="hover:bg-slate-800/30 transition">
                  <td className="py-3 px-4 font-semibold text-slate-200">{mod.name}</td>
                  <td className="py-3 px-4">{getStatusBadge(mod.status)}</td>
                  <td className="py-3 px-4 text-center font-mono text-xs text-slate-300">
                    {mod.homologatedWeight} / {mod.totalWeight} pts
                  </td>
                  <td className="py-3 px-4 min-w-[140px]">
                    <div className="flex items-center gap-2">
                      <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                        <div className="bg-blue-500 h-full rounded-full" style={{ width: `${mod.implementationPercent}%` }}></div>
                      </div>
                      <span className="text-xs font-mono text-slate-400 w-9 text-right">{mod.implementationPercent}%</span>
                    </div>
                  </td>
                  <td className="py-3 px-4 min-w-[140px]">
                    <div className="flex items-center gap-2">
                      <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                        <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${mod.readinessPercent}%` }}></div>
                      </div>
                      <span className="text-xs font-mono text-emerald-400 w-9 text-right">{mod.readinessPercent}%</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Frozen Components Section */}
      <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 shadow-lg">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <span>🔒</span> Componentes Congelados & Protegidos (Frozen Components)
          </h2>
          <span className="text-xs text-slate-400">Total: {frozenComponents.length} protegidos</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {frozenComponents.map((fc) => (
            <div key={fc.id} className="p-4 rounded-xl bg-cyan-950/20 border border-cyan-800/40 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-cyan-300 text-sm flex items-center gap-1.5">
                  <span>🔒</span> {fc.name}
                </span>
                <span className="text-xs text-slate-400 font-mono">{fc.frozenAt}</span>
              </div>
              <p className="text-xs text-slate-300">{fc.description}</p>
              <div className="text-xs text-amber-300 bg-amber-950/30 p-2 rounded border border-amber-800/30 font-medium">
                <span className="font-bold">Motivo da Proteção:</span> {fc.reason}
              </div>
              {fc.protectedPaths && fc.protectedPaths.length > 0 && (
                <div className="text-[11px] font-mono text-slate-400">
                  <span className="text-slate-500 font-sans">Caminhos protegidos:</span> {fc.protectedPaths.join(", ")}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Pending MVP & Backlog Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pending MVP */}
        <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 shadow-lg">
          <h2 className="text-sm font-bold text-amber-400 uppercase tracking-wider mb-4 flex items-center gap-2">
            <span>⏳</span> O que falta para o MVP ({pendingMvp.length} itens)
          </h2>
          {pendingMvp.length === 0 ? (
            <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-sm text-center font-semibold">
              🎉 Todas as capacidades do MVP foram 100% homologadas!
            </div>
          ) : (
            <div className="space-y-3">
              {pendingMvp.map((cap) => (
                <div key={cap.id} className="p-3.5 rounded-xl bg-slate-800/40 border border-slate-700/50 flex items-center justify-between">
                  <div>
                    <div className="font-semibold text-slate-200 text-sm">{cap.name}</div>
                    <div className="text-xs text-slate-400">{cap.description}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono text-slate-400">{cap.weight} pts</span>
                    {getStatusBadge(cap.status)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Future Backlog */}
        <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 shadow-lg">
          <h2 className="text-sm font-bold text-purple-400 uppercase tracking-wider mb-4 flex items-center gap-2">
            <span>🚀</span> Backlog Pós-MVP ({futureBacklog.length} itens)
          </h2>
          {futureBacklog.length === 0 ? (
            <div className="p-4 rounded-xl bg-slate-800/30 border border-slate-700/40 text-slate-400 text-sm text-center">
              Nenhum item pendente no backlog futuro.
            </div>
          ) : (
            <div className="space-y-3">
              {futureBacklog.map((cap) => (
                <div key={cap.id} className="p-3.5 rounded-xl bg-slate-800/40 border border-slate-700/50 flex items-center justify-between">
                  <div>
                    <div className="font-semibold text-slate-200 text-sm">{cap.name}</div>
                    <div className="text-xs text-slate-400">{cap.description}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono text-slate-400">{cap.weight} pts</span>
                    {getStatusBadge(cap.status)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Checkpoints Timeline */}
      <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 shadow-lg">
        <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
          <span>🚩</span> Linha do Tempo de Checkpoints & Releases
        </h2>
        <div className="space-y-4 relative before:absolute before:inset-0 before:left-3.5 before:w-0.5 before:bg-slate-800">
          {checkpoints.map((chk, idx) => (
            <div key={idx} className="relative flex items-start gap-4 pl-8">
              <div className="absolute left-2 top-1.5 w-3 h-3 rounded-full bg-cyan-500 border-2 border-slate-900"></div>
              <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-700/50 w-full space-y-1">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <span className="font-bold text-white text-sm">{chk.title}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono text-cyan-400 bg-cyan-950/40 px-2 py-0.5 rounded border border-cyan-800/30">
                      {chk.shortSha}
                    </span>
                    <span className="text-xs text-slate-400 font-mono">{chk.date}</span>
                  </div>
                </div>
                {chk.description && <p className="text-xs text-slate-300">{chk.description}</p>}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
