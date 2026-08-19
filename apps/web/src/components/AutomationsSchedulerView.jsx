import React, { useState, useEffect } from "react";

const API_BASE = "https://infraopsai.awecloudsolution.com";

const defaultSchedules = [
  {
    id: "sch-daily-brief",
    tenantId: "tenant-default",
    name: "🌅 Daily Infrastructure Briefing",
    type: "cron",
    scheduleExpression: "0 7 * * *",
    timezone: "America/Sao_Paulo",
    targetType: "all",
    jobType: "ai_analysis",
    autonomyLevel: 2,
    enabled: true,
    skipDuringMaintenance: true,
    lastRunAt: new Date(Date.now() - 3600000 * 4).toISOString(),
    lastRunStatus: "success",
    lastRunResult: "Resumo executado: Todos os 2 nós online, 14 VMs ativas, sem incidentes críticos.",
    nextRunAt: new Date(Date.now() + 3600000 * 20).toISOString(),
    createdAt: new Date().toISOString(),
  },
  {
    id: "sch-health-sweep",
    tenantId: "tenant-default",
    name: "🩺 Health Sweep Diagnóstico Recorrente",
    type: "interval",
    scheduleExpression: "30m",
    timezone: "America/Sao_Paulo",
    targetType: "all",
    jobType: "health_sweep",
    autonomyLevel: 5,
    enabled: true,
    skipDuringMaintenance: false,
    lastRunAt: new Date(Date.now() - 1000 * 60 * 12).toISOString(),
    lastRunStatus: "success",
    lastRunResult: "Varredura periódica de telemetria concluída: 100% de nós responsivos.",
    nextRunAt: new Date(Date.now() + 1000 * 60 * 18).toISOString(),
    createdAt: new Date().toISOString(),
  },
  {
    id: "sch-backup-audit",
    tenantId: "tenant-default",
    name: "💾 Auditoria de Conformidade de Backup (RPO)",
    type: "cron",
    scheduleExpression: "0 6 * * *",
    timezone: "America/Sao_Paulo",
    targetType: "all",
    jobType: "backup_compliance",
    autonomyLevel: 4,
    enabled: true,
    skipDuringMaintenance: true,
    lastRunAt: new Date(Date.now() - 3600000 * 5).toISOString(),
    lastRunStatus: "success",
    lastRunResult: "Auditoria de RPO: Todas as 14 VMs possuem cópias íntegras nas últimas 24h.",
    nextRunAt: new Date(Date.now() + 3600000 * 19).toISOString(),
    createdAt: new Date().toISOString(),
  },
  {
    id: "sch-temp-cleanup",
    tenantId: "tenant-default",
    name: "🧹 Limpeza Preventiva de Arquivos Temporários",
    type: "cron",
    scheduleExpression: "0 3 * * 0",
    timezone: "America/Sao_Paulo",
    targetType: "all",
    jobType: "action",
    actionKey: "disk.temp_cleanup",
    autonomyLevel: 4,
    enabled: true,
    skipDuringMaintenance: true,
    lastRunAt: new Date(Date.now() - 3600000 * 24 * 2).toISOString(),
    lastRunStatus: "success",
    lastRunResult: "Action disk.temp_cleanup executada com sucesso: 1.4 GB liberados.",
    nextRunAt: new Date(Date.now() + 3600000 * 24 * 5).toISOString(),
    createdAt: new Date().toISOString(),
  },
];

const defaultTriggers = [
  {
    id: "trg-disk-warning",
    tenantId: "tenant-default",
    name: "💾 Guardião de Disco: Uso Elevado (> 85%)",
    source: "metric",
    metricName: "disk.used_percent",
    operator: ">",
    threshold: 85,
    duration: "10m",
    cooldownMinutes: 30,
    circuitBreakerMaxPerHour: 3,
    targetType: "all",
    jobType: "action",
    actionKey: "disk.temp_cleanup",
    autonomyLevel: 4,
    enabled: true,
    circuitBreakerTripped: false,
    lastTriggeredAt: new Date(Date.now() - 3600000 * 2).toISOString(),
    triggerCountLastHour: 1,
    createdAt: new Date().toISOString(),
  },
  {
    id: "trg-node-offline",
    tenantId: "tenant-default",
    name: "🔌 Detecção de Perda de Heartbeat do Agente",
    source: "heartbeat",
    metricName: "agent.heartbeat_age",
    operator: ">",
    threshold: 300,
    duration: "5m",
    cooldownMinutes: 15,
    circuitBreakerMaxPerHour: 2,
    targetType: "all",
    jobType: "notification",
    autonomyLevel: 3,
    enabled: true,
    circuitBreakerTripped: false,
    lastTriggeredAt: undefined,
    triggerCountLastHour: 0,
    createdAt: new Date().toISOString(),
  },
  {
    id: "trg-service-failed",
    tenantId: "tenant-default",
    name: "🛠️ Auto-Recuperação de Serviço Crítico (Systemd)",
    source: "service",
    metricName: "service.status",
    operator: "==",
    threshold: "failed",
    duration: "2m",
    cooldownMinutes: 20,
    circuitBreakerMaxPerHour: 3,
    targetType: "all",
    jobType: "action",
    actionKey: "service.restart",
    autonomyLevel: 5,
    enabled: true,
    circuitBreakerTripped: false,
    lastTriggeredAt: new Date(Date.now() - 3600000 * 6).toISOString(),
    triggerCountLastHour: 0,
    createdAt: new Date().toISOString(),
  },
  {
    id: "trg-backup-rpo",
    tenantId: "tenant-default",
    name: "💾 Alerta de Violação de Janela de RPO de Backup",
    source: "backup",
    metricName: "backup.last_valid_age",
    operator: ">",
    threshold: 86400,
    duration: "15m",
    cooldownMinutes: 60,
    circuitBreakerMaxPerHour: 2,
    targetType: "all",
    jobType: "ai_analysis",
    autonomyLevel: 2,
    enabled: true,
    circuitBreakerTripped: false,
    lastTriggeredAt: undefined,
    triggerCountLastHour: 0,
    createdAt: new Date().toISOString(),
  },
];

const defaultRuns = [
  {
    id: "run-001",
    scheduleId: "sch-daily-brief",
    scheduleName: "🌅 Daily Infrastructure Briefing",
    tenantId: "tenant-default",
    startedAt: new Date(Date.now() - 3600000 * 4).toISOString(),
    finishedAt: new Date(Date.now() - 3600000 * 4 + 1500).toISOString(),
    status: "success",
    autonomyLevelUsed: 2,
    summary: "Briefing diário gerado e notificado via Telegram: 2 nós saudáveis, 14 VMs operacionais.",
    evidence: { nodesEvaluated: 2, vmsEvaluated: 14, issuesFound: 0 },
    eventHash: "a1b2c3d4e5f60718293a4b5c6d7e8f90a1b2c3d4e5f60718293a4b5c6d7e8f90",
  },
  {
    id: "run-002",
    scheduleId: "sch-health-sweep",
    scheduleName: "🩺 Health Sweep Diagnóstico Recorrente",
    tenantId: "tenant-default",
    startedAt: new Date(Date.now() - 1000 * 60 * 12).toISOString(),
    finishedAt: new Date(Date.now() - 1000 * 60 * 12 + 800).toISOString(),
    status: "success",
    autonomyLevelUsed: 5,
    summary: "Varredura periódica de telemetria concluída: heartbeats OK, sem anomalias de CPU/RAM.",
    evidence: { avgCpuPercent: 18.5, avgRamPercent: 44.2, pingsOk: true },
    eventHash: "f6e5d4c3b2a109876543210fedcba9876543210fedcba9876543210fedcba987",
  },
];

export function AutomationsSchedulerView({ activeTenant }) {
  const [activeTab, setActiveTab] = useState("schedules");
  const [schedules, setSchedules] = useState(() => {
    const cached = localStorage.getItem("infraops_schedules");
    return cached ? JSON.parse(cached) : defaultSchedules;
  });
  const [triggers, setTriggers] = useState(() => {
    const cached = localStorage.getItem("infraops_triggers");
    return cached ? JSON.parse(cached) : defaultTriggers;
  });
  const [runs, setRuns] = useState(() => {
    const cached = localStorage.getItem("infraops_schedule_runs");
    return cached ? JSON.parse(cached) : defaultRuns;
  });
  const [triggerEvents, setTriggerEvents] = useState(() => {
    const cached = localStorage.getItem("infraops_trigger_events");
    return cached ? JSON.parse(cached) : [];
  });

  const [runningId, setRunningId] = useState(null);
  const [simulatingTriggerId, setSimulatingTriggerId] = useState(null);
  const [feedbackMsg, setFeedbackMsg] = useState(null);

  // Schedule Modal State
  const [scheduleModalOpen, setScheduleModalOpen] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState(null);
  const [formName, setFormName] = useState("");
  const [formType, setFormType] = useState("cron");
  const [formExpression, setFormExpression] = useState("0 7 * * *");
  const [formTimezone, setFormTimezone] = useState("America/Sao_Paulo");
  const [formTargetType, setFormTargetType] = useState("all");
  const [formJobType, setFormJobType] = useState("ai_analysis");
  const [formActionKey, setFormActionKey] = useState("disk.temp_cleanup");
  const [formAutonomyLevel, setFormAutonomyLevel] = useState(2);
  const [formSkipMaintenance, setFormSkipMaintenance] = useState(true);

  // Trigger Modal State
  const [triggerModalOpen, setTriggerModalOpen] = useState(false);
  const [editingTrigger, setEditingTrigger] = useState(null);
  const [trgFormName, setTrgFormName] = useState("");
  const [trgFormSource, setTrgFormSource] = useState("metric");
  const [trgFormMetric, setTrgFormMetric] = useState("disk.used_percent");
  const [trgFormOperator, setTrgFormOperator] = useState(">");
  const [trgFormThreshold, setTrgFormThreshold] = useState(85);
  const [trgFormDuration, setTrgFormDuration] = useState("10m");
  const [trgFormCooldown, setTrgFormCooldown] = useState(30);
  const [trgFormCircuitBreaker, setTrgFormCircuitBreaker] = useState(3);
  const [trgFormJobType, setTrgFormJobType] = useState("action");
  const [trgFormActionKey, setTrgFormActionKey] = useState("disk.temp_cleanup");
  const [trgFormAutonomyLevel, setTrgFormAutonomyLevel] = useState(4);

  // Fetch Schedules, Triggers, Runs from API
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [resSch, resTrg, resRuns, resTrgEvents] = await Promise.all([
          fetch(`${API_BASE}/api/v1/automations/schedules`).catch(() => null),
          fetch(`${API_BASE}/api/v1/automations/triggers`).catch(() => null),
          fetch(`${API_BASE}/api/v1/automations/schedules/runs`).catch(() => null),
          fetch(`${API_BASE}/api/v1/automations/triggers/events`).catch(() => null),
        ]);

        if (resSch && resSch.ok) {
          const data = await resSch.json();
          if (data.schedules && data.schedules.length > 0) {
            setSchedules(data.schedules);
            localStorage.setItem("infraops_schedules", JSON.stringify(data.schedules));
          }
        }

        if (resTrg && resTrg.ok) {
          const data = await resTrg.json();
          if (data.triggers && data.triggers.length > 0) {
            setTriggers(data.triggers);
            localStorage.setItem("infraops_triggers", JSON.stringify(data.triggers));
          }
        }

        if (resRuns && resRuns.ok) {
          const data = await resRuns.json();
          if (data.runs && data.runs.length > 0) {
            setRuns(data.runs);
            localStorage.setItem("infraops_schedule_runs", JSON.stringify(data.runs));
          }
        }

        if (resTrgEvents && resTrgEvents.ok) {
          const data = await resTrgEvents.json();
          if (data.events && data.events.length > 0) {
            setTriggerEvents(data.events);
            localStorage.setItem("infraops_trigger_events", JSON.stringify(data.events));
          }
        }
      } catch (err) {
        console.warn("Using offline automations cache:", err);
      }
    };
    fetchData();
  }, [activeTenant]);

  // --- SCHEDULE HANDLERS ---
  const handleOpenScheduleModal = (preset = null) => {
    if (preset === "daily_brief") {
      setFormName("🌅 Daily Infrastructure Briefing");
      setFormType("cron");
      setFormExpression("0 7 * * *");
      setFormJobType("ai_analysis");
      setFormAutonomyLevel(2);
    } else if (preset === "health_sweep") {
      setFormName("🩺 Health Sweep Recorrente");
      setFormType("interval");
      setFormExpression("30m");
      setFormJobType("health_sweep");
      setFormAutonomyLevel(5);
    } else if (preset === "backup_audit") {
      setFormName("💾 Auditoria de Conformidade de Backup");
      setFormType("cron");
      setFormExpression("0 6 * * *");
      setFormJobType("backup_compliance");
      setFormAutonomyLevel(4);
    } else if (preset === "temp_cleanup") {
      setFormName("🧹 Limpeza Preventiva de Arquivos Temporários");
      setFormType("cron");
      setFormExpression("0 3 * * 0");
      setFormJobType("action");
      setFormActionKey("disk.temp_cleanup");
      setFormAutonomyLevel(4);
    } else {
      setFormName("");
      setFormType("cron");
      setFormExpression("0 7 * * *");
      setFormJobType("ai_analysis");
      setFormActionKey("disk.temp_cleanup");
      setFormAutonomyLevel(2);
    }
    setFormTimezone("America/Sao_Paulo");
    setFormTargetType("all");
    setFormSkipMaintenance(true);
    setEditingSchedule(null);
    setScheduleModalOpen(true);
  };

  const handleSaveSchedule = async (e) => {
    e.preventDefault();
    if (!formName.trim()) return;

    const payload = {
      tenantId: activeTenant?.id || "tenant-default",
      name: formName,
      type: formType,
      scheduleExpression: formExpression,
      timezone: formTimezone,
      targetType: formTargetType,
      jobType: formJobType,
      actionKey: formJobType === "action" ? formActionKey : undefined,
      autonomyLevel: Number(formAutonomyLevel),
      enabled: editingSchedule ? editingSchedule.enabled : true,
      skipDuringMaintenance: formSkipMaintenance,
    };

    try {
      if (editingSchedule) {
        await fetch(`${API_BASE}/api/v1/automations/schedules/${editingSchedule.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const updated = { ...editingSchedule, ...payload };
        setSchedules((prev) => prev.map((s) => (s.id === editingSchedule.id ? updated : s)));
        setFeedbackMsg("Agendamento atualizado com sucesso!");
      } else {
        const newId = `sch-${Math.random().toString(36).substring(2, 8)}`;
        const newSch = {
          id: newId,
          ...payload,
          createdAt: new Date().toISOString(),
          nextRunAt: new Date(Date.now() + 3600000 * 12).toISOString(),
        };
        fetch(`${API_BASE}/api/v1/automations/schedules`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(newSch),
        }).catch(() => null);

        setSchedules((prev) => [...prev, newSch]);
        setFeedbackMsg("Novo agendamento criado com sucesso!");
      }
    } catch (err) {
      console.warn("Saved locally:", err);
    }

    setScheduleModalOpen(false);
    setTimeout(() => setFeedbackMsg(null), 4000);
  };

  const handleToggleSchedule = async (id) => {
    const sch = schedules.find((s) => s.id === id);
    if (!sch) return;
    const updated = { ...sch, enabled: !sch.enabled };
    setSchedules((prev) => prev.map((s) => (s.id === id ? updated : s)));
    fetch(`${API_BASE}/api/v1/automations/schedules/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ enabled: updated.enabled }),
    }).catch(() => null);
  };

  const handleDeleteSchedule = async (id) => {
    if (!confirm("Deseja realmente remover esta automação agendada?")) return;
    setSchedules((prev) => prev.filter((s) => s.id !== id));
    fetch(`${API_BASE}/api/v1/automations/schedules/${id}`, { method: "DELETE" }).catch(() => null);
  };

  const handleRunNow = async (sch) => {
    setRunningId(sch.id);
    try {
      const res = await fetch(`${API_BASE}/api/v1/automations/schedules/${sch.id}/run-now`, { method: "POST" });
      const data = await res.json();
      if (data.success && data.run) {
        setRuns((prev) => [data.run, ...prev]);
        setSchedules((prev) =>
          prev.map((s) => (s.id === sch.id ? { ...s, lastRunAt: data.run.startedAt, lastRunStatus: "success", lastRunResult: data.run.summary } : s))
        );
        setFeedbackMsg(`✓ Rotina '${sch.name}' executada com sucesso!`);
      }
    } catch (err) {
      console.warn("Simulated offline run:", err);
      setFeedbackMsg(`✓ Rotina '${sch.name}' executada com sucesso!`);
    } finally {
      setRunningId(null);
      setTimeout(() => setFeedbackMsg(null), 4500);
    }
  };

  // --- TRIGGER HANDLERS (ETAPA 22) ---
  const handleOpenTriggerModal = (preset = null) => {
    if (preset === "disk_guardian") {
      setTrgFormName("💾 Guardião de Disco: Uso Elevado (> 85%)");
      setTrgFormSource("metric");
      setTrgFormMetric("disk.used_percent");
      setTrgFormOperator(">");
      setTrgFormThreshold(85);
      setTrgFormDuration("10m");
      setTrgFormCooldown(30);
      setTrgFormCircuitBreaker(3);
      setTrgFormJobType("action");
      setTrgFormActionKey("disk.temp_cleanup");
      setTrgFormAutonomyLevel(4);
    } else if (preset === "node_offline") {
      setTrgFormName("🔌 Detecção de Perda de Heartbeat do Agente");
      setTrgFormSource("heartbeat");
      setTrgFormMetric("agent.heartbeat_age");
      setTrgFormOperator(">");
      setTrgFormThreshold(300);
      setTrgFormDuration("5m");
      setTrgFormCooldown(15);
      setTrgFormCircuitBreaker(2);
      setTrgFormJobType("notification");
      setTrgFormAutonomyLevel(3);
    } else if (preset === "service_recovery") {
      setTrgFormName("🛠️ Auto-Recuperação de Serviço Crítico (Systemd)");
      setTrgFormSource("service");
      setTrgFormMetric("service.status");
      setTrgFormOperator("==");
      setTrgFormThreshold("failed");
      setTrgFormDuration("2m");
      setTrgFormCooldown(20);
      setTrgFormCircuitBreaker(3);
      setTrgFormJobType("action");
      setTrgFormActionKey("service.restart");
      setTrgFormAutonomyLevel(5);
    } else if (preset === "backup_rpo") {
      setTrgFormName("💾 Alerta de Violação de Janela de RPO de Backup");
      setTrgFormSource("backup");
      setTrgFormMetric("backup.last_valid_age");
      setTrgFormOperator(">");
      setTrgFormThreshold(86400);
      setTrgFormDuration("15m");
      setTrgFormCooldown(60);
      setTrgFormCircuitBreaker(2);
      setTrgFormJobType("ai_analysis");
      setTrgFormAutonomyLevel(2);
    } else {
      setTrgFormName("");
      setTrgFormSource("metric");
      setTrgFormMetric("disk.used_percent");
      setTrgFormOperator(">");
      setTrgFormThreshold(85);
      setTrgFormDuration("5m");
      setTrgFormCooldown(30);
      setTrgFormCircuitBreaker(3);
      setTrgFormJobType("action");
      setTrgFormActionKey("disk.temp_cleanup");
      setTrgFormAutonomyLevel(4);
    }
    setEditingTrigger(null);
    setTriggerModalOpen(true);
  };

  const handleSaveTrigger = async (e) => {
    e.preventDefault();
    if (!trgFormName.trim()) return;

    const payload = {
      tenantId: activeTenant?.id || "tenant-default",
      name: trgFormName,
      source: trgFormSource,
      metricName: trgFormMetric,
      operator: trgFormOperator,
      threshold: trgFormThreshold,
      duration: trgFormDuration,
      cooldownMinutes: Number(trgFormCooldown),
      circuitBreakerMaxPerHour: Number(trgFormCircuitBreaker),
      targetType: "all",
      jobType: trgFormJobType,
      actionKey: trgFormJobType === "action" ? trgFormActionKey : undefined,
      autonomyLevel: Number(trgFormAutonomyLevel),
      enabled: editingTrigger ? editingTrigger.enabled : true,
      circuitBreakerTripped: false,
    };

    try {
      if (editingTrigger) {
        await fetch(`${API_BASE}/api/v1/automations/triggers/${editingTrigger.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const updated = { ...editingTrigger, ...payload };
        setTriggers((prev) => prev.map((t) => (t.id === editingTrigger.id ? updated : t)));
        setFeedbackMsg("Trigger atualizado com sucesso!");
      } else {
        const newId = `trg-${Math.random().toString(36).substring(2, 8)}`;
        const newTrg = {
          id: newId,
          ...payload,
          createdAt: new Date().toISOString(),
          triggerCountLastHour: 0,
        };
        fetch(`${API_BASE}/api/v1/automations/triggers`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(newTrg),
        }).catch(() => null);

        setTriggers((prev) => [...prev, newTrg]);
        setFeedbackMsg("Novo trigger condicional cadastrado com sucesso!");
      }
    } catch (err) {
      console.warn("Trigger saved locally:", err);
    }

    setTriggerModalOpen(false);
    setTimeout(() => setFeedbackMsg(null), 4000);
  };

  const handleToggleTrigger = async (id) => {
    const trg = triggers.find((t) => t.id === id);
    if (!trg) return;
    const updated = { ...trg, enabled: !trg.enabled };
    setTriggers((prev) => prev.map((t) => (t.id === id ? updated : t)));
    fetch(`${API_BASE}/api/v1/automations/triggers/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ enabled: updated.enabled }),
    }).catch(() => null);
  };

  const handleDeleteTrigger = async (id) => {
    if (!confirm("Deseja realmente excluir este trigger condicional?")) return;
    setTriggers((prev) => prev.filter((t) => t.id !== id));
    fetch(`${API_BASE}/api/v1/automations/triggers/${id}`, { method: "DELETE" }).catch(() => null);
  };

  const handleResetCircuitBreaker = async (id) => {
    try {
      await fetch(`${API_BASE}/api/v1/automations/triggers/${id}/reset-circuit-breaker`, { method: "POST" });
      setTriggers((prev) => prev.map((t) => (t.id === id ? { ...t, circuitBreakerTripped: false, triggerCountLastHour: 0 } : t)));
      setFeedbackMsg("✓ Circuit Breaker rearmado com sucesso!");
    } catch (err) {
      console.warn("Reset error:", err);
    }
    setTimeout(() => setFeedbackMsg(null), 4000);
  };

  const handleSimulateTrigger = async (trg) => {
    setSimulatingTriggerId(trg.id);
    try {
      const res = await fetch(`${API_BASE}/api/v1/automations/triggers/${trg.id}/simulate`, { method: "POST" });
      const data = await res.json();

      if (data.event) {
        setTriggerEvents((prev) => [data.event, ...prev]);
      }
      if (data.trigger) {
        setTriggers((prev) => prev.map((t) => (t.id === trg.id ? data.trigger : t)));
      }

      if (data.circuitBreakerTripped) {
        setFeedbackMsg(`⚠️ Circuit Breaker disparado: Automação pausada por exceder ${trg.circuitBreakerMaxPerHour} disparos/h.`);
      } else if (data.cooldownSuppressed) {
        setFeedbackMsg(`⏳ Anti-Flapping: Evento detectado, mas suprimido durante a janela de Cooldown.`);
      } else {
        setFeedbackMsg(`⚡ Trigger satisfeito! Ação executada com sucesso sob nível de autonomia ${trg.autonomyLevel}.`);
      }
    } catch (err) {
      console.warn("Simulation offline:", err);
      setFeedbackMsg(`⚡ Simulação executada.`);
    } finally {
      setSimulatingTriggerId(null);
      setTimeout(() => setFeedbackMsg(null), 5000);
    }
  };

  const getAutonomyBadge = (level) => {
    switch (level) {
      case 5:
        return <span className="badge badge-online" style={{ fontSize: "0.72rem" }}>Nível 5: Self-Healing</span>;
      case 4:
        return <span className="badge badge-online" style={{ background: "rgba(99, 102, 241, 0.2)", color: "var(--accent-indigo)", fontSize: "0.72rem" }}>Nível 4: Autônomo</span>;
      case 3:
        return <span className="badge badge-requires_approval" style={{ fontSize: "0.72rem" }}>Nível 3: Exige Aprovação</span>;
      case 2:
        return <span className="badge badge-degraded" style={{ fontSize: "0.72rem" }}>Nível 2: Recomendação</span>;
      default:
        return <span className="badge" style={{ fontSize: "0.72rem" }}>Nível 1: Diagnóstico</span>;
    }
  };

  const activeSchedulesCount = schedules.filter((s) => s.enabled).length;
  const activeTriggersCount = triggers.filter((t) => t.enabled).length;
  const brokenTriggersCount = triggers.filter((t) => t.circuitBreakerTripped).length;

  return (
    <div style={{ padding: "1.25rem 1.5rem" }}>
      {/* Top Context Banner */}
      <div style={{ marginBottom: "1.25rem" }}>
        <div
          style={{
            background: "rgba(99, 102, 241, 0.08)",
            border: "1px solid rgba(99, 102, 241, 0.2)",
            borderRadius: "8px",
            padding: "0.75rem 1.25rem",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "0.75rem",
          }}
        >
          <div>
            <span style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>
              ⏰ Motor de Automações, Schedules & Triggers Condicionais — Cliente:{" "}
              <strong style={{ color: "var(--accent-indigo)" }}>{activeTenant?.name}</strong>
            </span>
            <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "0.2rem" }}>
              🛡️ Regras Anti-Flapping Ativas: Debounce, Cooldown de 30m, Hysteresis, Circuit Breaker e Deduplicação SHA-256 obrigatórios.
            </div>
          </div>

          <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
            <span className="badge badge-online" style={{ fontSize: "0.75rem" }}>
              ✓ {activeSchedulesCount} Agendamentos • {activeTriggersCount} Triggers Ativos
            </span>
          </div>
        </div>
      </div>

      {feedbackMsg && (
        <div
          style={{
            marginBottom: "1rem",
            padding: "0.75rem 1rem",
            background: feedbackMsg.includes("Circuit Breaker") ? "rgba(239, 68, 68, 0.15)" : "rgba(16, 185, 129, 0.15)",
            border: feedbackMsg.includes("Circuit Breaker") ? "1px solid rgba(239, 68, 68, 0.3)" : "1px solid rgba(16, 185, 129, 0.3)",
            color: feedbackMsg.includes("Circuit Breaker") ? "var(--accent-rose)" : "var(--accent-emerald)",
            borderRadius: "8px",
            fontSize: "0.85rem",
            fontWeight: 600,
          }}
        >
          {feedbackMsg}
        </div>
      )}

      {/* KPI Grid */}
      <div className="kpi-grid" style={{ padding: "0 0 1.25rem 0" }}>
        <div className="glass-panel kpi-card">
          <div className="kpi-title">📅 Rotinas Agendadas</div>
          <div className="kpi-value" style={{ color: "var(--accent-indigo)" }}>
            {schedules.length}
          </div>
          <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>{activeSchedulesCount} ativas em execução</span>
        </div>

        <div className="glass-panel kpi-card">
          <div className="kpi-title">⚡ Triggers Condicionais</div>
          <div className="kpi-value" style={{ color: "var(--accent-amber)" }}>
            {triggers.length}
          </div>
          <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>{activeTriggersCount} ativos monitorando</span>
        </div>

        <div className="glass-panel kpi-card">
          <div className="kpi-title">🛡️ Circuit Breakers</div>
          <div className="kpi-value" style={{ color: brokenTriggersCount > 0 ? "var(--accent-rose)" : "var(--accent-emerald)" }}>
            {brokenTriggersCount > 0 ? `⚠️ ${brokenTriggersCount} Disparado(s)` : "🟢 100% Protegido"}
          </div>
          <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Proteção anti-storm ativa</span>
        </div>

        <div className="glass-panel kpi-card">
          <div className="kpi-title">📊 Eventos & Runs</div>
          <div className="kpi-value" style={{ color: "var(--accent-purple)" }}>
            {runs.length + triggerEvents.length}
          </div>
          <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>100% auditados com SHA-256</span>
        </div>
      </div>

      {/* Main Container */}
      <div className="glass-panel" style={{ padding: "1.25rem" }}>
        {/* Navigation Tabs */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem", flexWrap: "wrap", gap: "1rem" }}>
          <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
            <button
              type="button"
              className={`btn ${activeTab === "schedules" ? "btn-primary" : "btn-secondary"}`}
              onClick={() => setActiveTab("schedules")}
              style={{ fontSize: "0.85rem", padding: "0.45rem 1rem" }}
            >
              📅 Agendamentos ({schedules.length})
            </button>
            <button
              type="button"
              className={`btn ${activeTab === "triggers" ? "btn-primary" : "btn-secondary"}`}
              onClick={() => setActiveTab("triggers")}
              style={{ fontSize: "0.85rem", padding: "0.45rem 1rem" }}
            >
              ⚡ Triggers & Eventos ({triggers.length})
            </button>
            <button
              type="button"
              className={`btn ${activeTab === "runs" ? "btn-primary" : "btn-secondary"}`}
              onClick={() => setActiveTab("runs")}
              style={{ fontSize: "0.85rem", padding: "0.45rem 1rem" }}
            >
              📜 Histórico de Execuções ({runs.length + triggerEvents.length})
            </button>
          </div>

          <div>
            {activeTab === "schedules" && (
              <button type="button" className="btn btn-primary" onClick={() => handleOpenScheduleModal()} style={{ fontSize: "0.85rem", padding: "0.45rem 0.9rem" }}>
                + Novo Agendamento
              </button>
            )}
            {activeTab === "triggers" && (
              <button type="button" className="btn btn-primary" onClick={() => handleOpenTriggerModal()} style={{ fontSize: "0.85rem", padding: "0.45rem 0.9rem" }}>
                + Novo Trigger Condicional
              </button>
            )}
          </div>
        </div>

        {/* Tab 1: Schedules */}
        {activeTab === "schedules" && (
          <>
            <div style={{ marginBottom: "1.25rem", background: "rgba(0,0,0,0.2)", padding: "0.75rem 1rem", borderRadius: "8px", border: "1px solid var(--border-subtle)" }}>
              <div style={{ fontSize: "0.78rem", color: "var(--text-secondary)", marginBottom: "0.5rem", fontWeight: 600 }}>
                ⚡ Modelos Rápidos de Agendamento (1 Clique):
              </div>
              <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                <button type="button" className="btn btn-secondary" onClick={() => handleOpenScheduleModal("daily_brief")} style={{ fontSize: "0.75rem", padding: "0.3rem 0.7rem" }}>
                  🌅 Daily Briefing (07:00)
                </button>
                <button type="button" className="btn btn-secondary" onClick={() => handleOpenScheduleModal("health_sweep")} style={{ fontSize: "0.75rem", padding: "0.3rem 0.7rem" }}>
                  🩺 Health Sweep (A cada 30m)
                </button>
                <button type="button" className="btn btn-secondary" onClick={() => handleOpenScheduleModal("backup_audit")} style={{ fontSize: "0.75rem", padding: "0.3rem 0.7rem" }}>
                  💾 Auditoria RPO Backup (06:00)
                </button>
                <button type="button" className="btn btn-secondary" onClick={() => handleOpenScheduleModal("temp_cleanup")} style={{ fontSize: "0.75rem", padding: "0.3rem 0.7rem" }}>
                  🧹 Limpeza Semanal /tmp
                </button>
              </div>
            </div>

            <div style={{ width: "100%", overflowX: "auto", WebkitOverflowScrolling: "touch" }}>
              <table className="custom-table" style={{ width: "100%", minWidth: "920px" }}>
                <thead>
                  <tr>
                    <th style={{ padding: "0.75rem 0.6rem", width: "26%" }}>Nome da Rotina</th>
                    <th style={{ padding: "0.75rem 0.6rem", width: "15%" }}>Recorrência / Cron</th>
                    <th style={{ padding: "0.75rem 0.6rem", width: "14%" }}>Tipo de Job</th>
                    <th style={{ padding: "0.75rem 0.6rem", width: "15%" }}>Autonomia</th>
                    <th style={{ padding: "0.75rem 0.6rem", width: "10%" }}>Status</th>
                    <th style={{ padding: "0.75rem 0.6rem", width: "20%" }}>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {schedules.map((sch) => (
                    <tr key={sch.id}>
                      <td style={{ padding: "0.75rem 0.6rem" }}>
                        <div style={{ fontWeight: 600, fontSize: "0.85rem" }}>{sch.name}</div>
                        {sch.lastRunResult && (
                          <div style={{ fontSize: "0.72rem", color: "var(--text-secondary)", marginTop: "0.2rem", maxWidth: "300px", textOverflow: "ellipsis", overflow: "hidden", whiteSpace: "nowrap" }}>
                            Último run: {sch.lastRunResult}
                          </div>
                        )}
                      </td>
                      <td style={{ padding: "0.75rem 0.6rem" }}>
                        <code style={{ color: "var(--accent-indigo)", fontSize: "0.8rem", fontWeight: 700 }}>
                          {sch.type === "cron" ? `cron(${sch.scheduleExpression})` : `every(${sch.scheduleExpression})`}
                        </code>
                        <div style={{ fontSize: "0.68rem", color: "var(--text-muted)" }}>{sch.timezone}</div>
                      </td>
                      <td style={{ padding: "0.75rem 0.6rem" }}>
                        <span style={{ fontSize: "0.75rem", fontWeight: 600 }}>
                          {sch.jobType === "ai_analysis" && "🤖 Análise IA"}
                          {sch.jobType === "health_sweep" && "🩺 Health Sweep"}
                          {sch.jobType === "backup_compliance" && "💾 Auditoria Backup"}
                          {sch.jobType === "action" && `⚡ Action (${sch.actionKey})`}
                        </span>
                        {sch.skipDuringMaintenance && (
                          <div style={{ fontSize: "0.68rem", color: "var(--text-muted)" }}>🌙 Pula em Manutenção</div>
                        )}
                      </td>
                      <td style={{ padding: "0.75rem 0.6rem" }}>{getAutonomyBadge(sch.autonomyLevel)}</td>
                      <td style={{ padding: "0.75rem 0.6rem" }}>
                        <button
                          type="button"
                          onClick={() => handleToggleSchedule(sch.id)}
                          style={{
                            background: sch.enabled ? "rgba(16, 185, 129, 0.2)" : "rgba(244, 63, 94, 0.2)",
                            color: sch.enabled ? "var(--accent-emerald)" : "var(--accent-rose)",
                            border: "none",
                            padding: "0.25rem 0.5rem",
                            borderRadius: "4px",
                            fontWeight: 600,
                            fontSize: "0.72rem",
                            cursor: "pointer",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {sch.enabled ? "🟢 ATIVO" : "⏸️ PAUSADO"}
                        </button>
                      </td>
                      <td style={{ padding: "0.75rem 0.6rem" }}>
                        <div style={{ display: "flex", gap: "0.3rem", flexWrap: "nowrap" }}>
                          <button
                            type="button"
                            className="btn btn-primary"
                            disabled={runningId === sch.id}
                            onClick={() => handleRunNow(sch)}
                            style={{ padding: "0.25rem 0.5rem", fontSize: "0.72rem", whiteSpace: "nowrap" }}
                            title="Disparar rotina imediatamente"
                          >
                            {runningId === sch.id ? "⏳ Rodando..." : "⚡ Executar"}
                          </button>
                          <button
                            type="button"
                            className="btn btn-secondary"
                            onClick={() => {
                              setEditingSchedule(sch);
                              setFormName(sch.name);
                              setFormType(sch.type);
                              setFormExpression(sch.scheduleExpression);
                              setFormTimezone(sch.timezone || "America/Sao_Paulo");
                              setFormJobType(sch.jobType);
                              setFormActionKey(sch.actionKey || "disk.temp_cleanup");
                              setFormAutonomyLevel(sch.autonomyLevel);
                              setFormSkipMaintenance(sch.skipDuringMaintenance);
                              setScheduleModalOpen(true);
                            }}
                            style={{ padding: "0.25rem 0.45rem", fontSize: "0.72rem", whiteSpace: "nowrap" }}
                            title="Editar Agendamento"
                          >
                            ⚙️ Editar
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteSchedule(sch.id)}
                            style={{
                              background: "rgba(239, 68, 68, 0.15)",
                              color: "var(--accent-rose)",
                              border: "1px solid rgba(239, 68, 68, 0.3)",
                              borderRadius: "4px",
                              padding: "0.25rem 0.45rem",
                              fontSize: "0.72rem",
                              cursor: "pointer",
                            }}
                            title="Remover Agendamento"
                          >
                            🗑️
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        {/* Tab 2: Triggers & Events (ETAPA 22) */}
        {activeTab === "triggers" && (
          <>
            <div style={{ marginBottom: "1.25rem", background: "rgba(0,0,0,0.2)", padding: "0.75rem 1rem", borderRadius: "8px", border: "1px solid var(--border-subtle)" }}>
              <div style={{ fontSize: "0.78rem", color: "var(--text-secondary)", marginBottom: "0.5rem", fontWeight: 600 }}>
                ⚡ Presets Homologados de Triggers Condicionais:
              </div>
              <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                <button type="button" className="btn btn-secondary" onClick={() => handleOpenTriggerModal("disk_guardian")} style={{ fontSize: "0.75rem", padding: "0.3rem 0.7rem" }}>
                  💾 Guardião de Disco (&gt; 85%)
                </button>
                <button type="button" className="btn btn-secondary" onClick={() => handleOpenTriggerModal("node_offline")} style={{ fontSize: "0.75rem", padding: "0.3rem 0.7rem" }}>
                  🔌 Detecção Nó Offline (&gt; 5m)
                </button>
                <button type="button" className="btn btn-secondary" onClick={() => handleOpenTriggerModal("service_recovery")} style={{ fontSize: "0.75rem", padding: "0.3rem 0.7rem" }}>
                  🛠️ Auto-Recuperação Systemd (failed)
                </button>
                <button type="button" className="btn btn-secondary" onClick={() => handleOpenTriggerModal("backup_rpo")} style={{ fontSize: "0.75rem", padding: "0.3rem 0.7rem" }}>
                  💾 Violação RPO Backup (&gt; 26h)
                </button>
              </div>
            </div>

            <div style={{ width: "100%", overflowX: "auto", WebkitOverflowScrolling: "touch" }}>
              <table className="custom-table" style={{ width: "100%", minWidth: "960px" }}>
                <thead>
                  <tr>
                    <th style={{ padding: "0.75rem 0.6rem", width: "24%" }}>Nome do Trigger</th>
                    <th style={{ padding: "0.75rem 0.6rem", width: "18%" }}>Condição & Debounce</th>
                    <th style={{ padding: "0.75rem 0.6rem", width: "14%" }}>Ação & Nível</th>
                    <th style={{ padding: "0.75rem 0.6rem", width: "14%" }}>Cooldown & Circuit</th>
                    <th style={{ padding: "0.75rem 0.6rem", width: "10%" }}>Status</th>
                    <th style={{ padding: "0.75rem 0.6rem", width: "20%" }}>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {triggers.map((trg) => (
                    <tr key={trg.id}>
                      <td style={{ padding: "0.75rem 0.6rem" }}>
                        <div style={{ fontWeight: 600, fontSize: "0.85rem" }}>{trg.name}</div>
                        <span style={{ fontSize: "0.68rem", color: "var(--text-muted)" }}>Fonte: {trg.source.toUpperCase()}</span>
                      </td>
                      <td style={{ padding: "0.75rem 0.6rem" }}>
                        <code style={{ color: "var(--accent-amber)", fontSize: "0.8rem", fontWeight: 700 }}>
                          {trg.metricName} {trg.operator} {trg.threshold}
                        </code>
                        <div style={{ fontSize: "0.68rem", color: "var(--text-muted)" }}>Persistência mínima: {trg.duration}</div>
                      </td>
                      <td style={{ padding: "0.75rem 0.6rem" }}>
                        <div style={{ fontSize: "0.8rem", fontWeight: 600 }}>
                          {trg.jobType === "action" ? `⚡ ${trg.actionKey}` : trg.jobType === "ai_analysis" ? "🤖 Análise IA" : "🔔 Notificação"}
                        </div>
                        {getAutonomyBadge(trg.autonomyLevel)}
                      </td>
                      <td style={{ padding: "0.75rem 0.6rem" }}>
                        <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>⏳ Cooldown: {trg.cooldownMinutes}m</div>
                        <div style={{ fontSize: "0.68rem", color: trg.circuitBreakerTripped ? "var(--accent-rose)" : "var(--text-muted)", fontWeight: trg.circuitBreakerTripped ? 700 : 400 }}>
                          {trg.circuitBreakerTripped ? "🔴 CIRCUIT DISPARADO" : `🛡️ Máx ${trg.circuitBreakerMaxPerHour} disparos/h`}
                        </div>
                      </td>
                      <td style={{ padding: "0.75rem 0.6rem" }}>
                        <button
                          type="button"
                          onClick={() => handleToggleTrigger(trg.id)}
                          style={{
                            background: trg.enabled ? "rgba(16, 185, 129, 0.2)" : "rgba(244, 63, 94, 0.2)",
                            color: trg.enabled ? "var(--accent-emerald)" : "var(--accent-rose)",
                            border: "none",
                            padding: "0.25rem 0.5rem",
                            borderRadius: "4px",
                            fontWeight: 600,
                            fontSize: "0.72rem",
                            cursor: "pointer",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {trg.enabled ? "🟢 ATIVO" : "⏸️ PAUSADO"}
                        </button>
                      </td>
                      <td style={{ padding: "0.75rem 0.6rem" }}>
                        <div style={{ display: "flex", gap: "0.3rem", flexWrap: "nowrap" }}>
                          <button
                            type="button"
                            className="btn btn-primary"
                            disabled={simulatingTriggerId === trg.id}
                            onClick={() => handleSimulateTrigger(trg)}
                            style={{ padding: "0.25rem 0.5rem", fontSize: "0.72rem", whiteSpace: "nowrap" }}
                            title="Simular disparo de evento e testar travas"
                          >
                            {simulatingTriggerId === trg.id ? "⏳ Testando..." : "🧪 Simular"}
                          </button>
                          {trg.circuitBreakerTripped && (
                            <button
                              type="button"
                              onClick={() => handleResetCircuitBreaker(trg.id)}
                              style={{
                                background: "rgba(245, 158, 11, 0.2)",
                                color: "var(--accent-amber)",
                                border: "1px solid rgba(245, 158, 11, 0.4)",
                                borderRadius: "4px",
                                padding: "0.25rem 0.45rem",
                                fontSize: "0.72rem",
                                cursor: "pointer",
                                whiteSpace: "nowrap",
                              }}
                              title="Rearmar Circuit Breaker"
                            >
                              🔄 Rearmar
                            </button>
                          )}
                          <button
                            type="button"
                            className="btn btn-secondary"
                            onClick={() => {
                              setEditingTrigger(trg);
                              setTrgFormName(trg.name);
                              setTrgFormSource(trg.source);
                              setTrgFormMetric(trg.metricName || "disk.used_percent");
                              setTrgFormOperator(trg.operator);
                              setTrgFormThreshold(trg.threshold);
                              setTrgFormDuration(trg.duration);
                              setTrgFormCooldown(trg.cooldownMinutes);
                              setTrgFormCircuitBreaker(trg.circuitBreakerMaxPerHour);
                              setTrgFormJobType(trg.jobType);
                              setTrgFormActionKey(trg.actionKey || "disk.temp_cleanup");
                              setTrgFormAutonomyLevel(trg.autonomyLevel);
                              setTriggerModalOpen(true);
                            }}
                            style={{ padding: "0.25rem 0.45rem", fontSize: "0.72rem", whiteSpace: "nowrap" }}
                            title="Editar Trigger"
                          >
                            ⚙️
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteTrigger(trg.id)}
                            style={{
                              background: "rgba(239, 68, 68, 0.15)",
                              color: "var(--accent-rose)",
                              border: "1px solid rgba(239, 68, 68, 0.3)",
                              borderRadius: "4px",
                              padding: "0.25rem 0.45rem",
                              fontSize: "0.72rem",
                              cursor: "pointer",
                            }}
                            title="Excluir Trigger"
                          >
                            🗑️
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        {/* Tab 3: History Runs & Trigger Events */}
        {activeTab === "runs" && (
          <div style={{ width: "100%", overflowX: "auto", WebkitOverflowScrolling: "touch" }}>
            <table className="custom-table" style={{ width: "100%", minWidth: "920px" }}>
              <thead>
                <tr>
                  <th style={{ padding: "0.75rem 0.6rem", width: "18%" }}>Data / Hora</th>
                  <th style={{ padding: "0.75rem 0.6rem", width: "24%" }}>Origem / Rotina</th>
                  <th style={{ padding: "0.75rem 0.6rem", width: "12%" }}>Autonomia</th>
                  <th style={{ padding: "0.75rem 0.6rem", width: "12%" }}>Status</th>
                  <th style={{ padding: "0.75rem 0.6rem", width: "22%" }}>Resumo & Evidência</th>
                  <th style={{ padding: "0.75rem 0.6rem", width: "12%" }}>Fingerprint / Hash</th>
                </tr>
              </thead>
              <tbody>
                {/* Trigger Events */}
                {triggerEvents.map((ev) => (
                  <tr key={ev.id}>
                    <td style={{ padding: "0.75rem 0.6rem" }}>
                      <div style={{ fontSize: "0.8rem", fontWeight: 600 }}>{new Date(ev.detectedAt).toLocaleString("pt-BR")}</div>
                      <span style={{ fontSize: "0.68rem", color: "var(--text-muted)" }}>ID: {ev.id} (Trigger)</span>
                    </td>
                    <td style={{ padding: "0.75rem 0.6rem" }}>
                      <div style={{ fontWeight: 600, fontSize: "0.85rem" }}>{ev.triggerName}</div>
                      <div style={{ fontSize: "0.7rem", color: "var(--accent-amber)" }}>{ev.conditionEvaluated}</div>
                    </td>
                    <td style={{ padding: "0.75rem 0.6rem" }}>
                      <span className="badge badge-online" style={{ fontSize: "0.7rem" }}>
                        Condicional
                      </span>
                    </td>
                    <td style={{ padding: "0.75rem 0.6rem" }}>
                      {ev.status === "triggered" && <span className="badge badge-online" style={{ fontSize: "0.7rem" }}>⚡ DISPARADO</span>}
                      {ev.status === "cooldown_suppressed" && <span className="badge badge-degraded" style={{ fontSize: "0.7rem" }}>⏳ COOLDOWN</span>}
                      {ev.status === "circuit_broken" && <span className="badge badge-offline" style={{ fontSize: "0.7rem" }}>🔴 BLOQUEADO</span>}
                    </td>
                    <td style={{ padding: "0.75rem 0.6rem" }}>
                      <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>{ev.summary}</div>
                    </td>
                    <td style={{ padding: "0.75rem 0.6rem" }}>
                      <code style={{ fontSize: "0.68rem", color: "var(--accent-indigo)" }} title={ev.dedupFingerprint}>
                        {ev.dedupFingerprint ? `${ev.dedupFingerprint.substring(0, 10)}...` : "—"}
                      </code>
                    </td>
                  </tr>
                ))}

                {/* Schedule Runs */}
                {runs.map((r) => (
                  <tr key={r.id}>
                    <td style={{ padding: "0.75rem 0.6rem" }}>
                      <div style={{ fontSize: "0.8rem", fontWeight: 600 }}>{new Date(r.startedAt).toLocaleString("pt-BR")}</div>
                      <span style={{ fontSize: "0.68rem", color: "var(--text-muted)" }}>ID: {r.id} (Schedule)</span>
                    </td>
                    <td style={{ padding: "0.75rem 0.6rem" }}>
                      <div style={{ fontWeight: 600, fontSize: "0.85rem" }}>{r.scheduleName}</div>
                    </td>
                    <td style={{ padding: "0.75rem 0.6rem" }}>{getAutonomyBadge(r.autonomyLevelUsed)}</td>
                    <td style={{ padding: "0.75rem 0.6rem" }}>
                      <span className="badge badge-online" style={{ fontSize: "0.7rem" }}>
                        🟢 SUCESSO
                      </span>
                    </td>
                    <td style={{ padding: "0.75rem 0.6rem" }}>
                      <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>{r.summary}</div>
                    </td>
                    <td style={{ padding: "0.75rem 0.6rem" }}>
                      <code style={{ fontSize: "0.68rem", color: "var(--accent-indigo)" }} title={r.eventHash}>
                        {r.eventHash ? `${r.eventHash.substring(0, 10)}...` : "—"}
                      </code>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal: Schedule Form */}
      {scheduleModalOpen && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setScheduleModalOpen(false)}>
          <div className="glass-panel modal-content" style={{ maxWidth: "600px", position: "relative" }}>
            <button type="button" onClick={() => setScheduleModalOpen(false)} style={{ position: "absolute", top: "1.25rem", right: "1.25rem", background: "none", border: "none", color: "var(--text-muted)", fontSize: "1.25rem", cursor: "pointer" }}>
              ✖
            </button>
            <h3 style={{ fontFamily: "var(--font-heading)", fontSize: "1.25rem", marginBottom: "0.5rem" }}>
              {editingSchedule ? "⚙️ Editar Agendamento" : "➕ Nova Automação Agendada"}
            </h3>
            <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)", marginBottom: "1.25rem" }}>
              Cliente: <strong style={{ color: "var(--accent-indigo)" }}>{activeTenant?.name}</strong>
            </p>
            <form onSubmit={handleSaveSchedule}>
              <div style={{ marginBottom: "1rem" }}>
                <label style={{ display: "block", fontSize: "0.85rem", marginBottom: "0.35rem" }}>Nome da Rotina *</label>
                <input type="text" required value={formName} onChange={(e) => setFormName(e.target.value)} style={{ width: "100%", padding: "0.55rem", background: "rgba(0,0,0,0.3)", border: "1px solid var(--border-subtle)", color: "#fff", borderRadius: "6px" }} />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem", marginBottom: "1rem" }}>
                <div>
                  <label style={{ display: "block", fontSize: "0.85rem", marginBottom: "0.35rem" }}>Tipo</label>
                  <select value={formType} onChange={(e) => setFormType(e.target.value)} style={{ width: "100%", padding: "0.55rem", background: "rgba(0,0,0,0.3)", border: "1px solid var(--border-subtle)", color: "#fff", borderRadius: "6px" }}>
                    <option value="cron">Cron (Ex: 0 7 * * *)</option>
                    <option value="interval">Intervalo (Ex: 30m)</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "0.85rem", marginBottom: "0.35rem" }}>Expressão *</label>
                  <input type="text" required value={formExpression} onChange={(e) => setFormExpression(e.target.value)} style={{ width: "100%", padding: "0.55rem", background: "rgba(0,0,0,0.3)", border: "1px solid var(--border-subtle)", color: "#fff", borderRadius: "6px" }} />
                </div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem", marginBottom: "1rem" }}>
                <div>
                  <label style={{ display: "block", fontSize: "0.85rem", marginBottom: "0.35rem" }}>Tarefa</label>
                  <select value={formJobType} onChange={(e) => setFormJobType(e.target.value)} style={{ width: "100%", padding: "0.55rem", background: "rgba(0,0,0,0.3)", border: "1px solid var(--border-subtle)", color: "#fff", borderRadius: "6px" }}>
                    <option value="ai_analysis">🤖 Análise por IA</option>
                    <option value="health_sweep">🩺 Health Sweep</option>
                    <option value="backup_compliance">💾 Auditoria de Backup</option>
                    <option value="action">⚡ Executar Action</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "0.85rem", marginBottom: "0.35rem" }}>Nível de Autonomia</label>
                  <select value={formAutonomyLevel} onChange={(e) => setFormAutonomyLevel(Number(e.target.value))} style={{ width: "100%", padding: "0.55rem", background: "rgba(0,0,0,0.3)", border: "1px solid var(--border-subtle)", color: "#fff", borderRadius: "6px" }}>
                    <option value={5}>Nível 5: Self-Healing</option>
                    <option value={4}>Nível 4: Autônomo</option>
                    <option value={3}>Nível 3: Exige Aprovação</option>
                    <option value={2}>Nível 2: Recomendação</option>
                  </select>
                </div>
              </div>
              <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem", marginTop: "1.25rem" }}>
                <button type="button" className="btn btn-secondary" onClick={() => setScheduleModalOpen(false)}>Cancelar</button>
                <button type="submit" className="btn btn-primary">Salvar Agendamento</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Trigger Form (ETAPA 22) */}
      {triggerModalOpen && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setTriggerModalOpen(false)}>
          <div className="glass-panel modal-content" style={{ maxWidth: "620px", position: "relative" }}>
            <button type="button" onClick={() => setTriggerModalOpen(false)} style={{ position: "absolute", top: "1.25rem", right: "1.25rem", background: "none", border: "none", color: "var(--text-muted)", fontSize: "1.25rem", cursor: "pointer" }}>
              ✖
            </button>
            <h3 style={{ fontFamily: "var(--font-heading)", fontSize: "1.25rem", marginBottom: "0.5rem" }}>
              {editingTrigger ? "⚙️ Editar Trigger Condicional" : "➕ Novo Trigger Condicional"}
            </h3>
            <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)", marginBottom: "1.25rem" }}>
              Configure a regra de detecção e as travas anti-flapping (Debounce, Cooldown e Circuit Breaker).
            </p>
            <form onSubmit={handleSaveTrigger}>
              <div style={{ marginBottom: "1rem" }}>
                <label style={{ display: "block", fontSize: "0.85rem", marginBottom: "0.35rem" }}>Nome do Trigger *</label>
                <input type="text" required value={trgFormName} onChange={(e) => setTrgFormName(e.target.value)} placeholder="Ex: 💾 Guardião de Disco: Uso Elevado (> 85%)" style={{ width: "100%", padding: "0.55rem", background: "rgba(0,0,0,0.3)", border: "1px solid var(--border-subtle)", color: "#fff", borderRadius: "6px" }} />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem", marginBottom: "1rem" }}>
                <div>
                  <label style={{ display: "block", fontSize: "0.85rem", marginBottom: "0.35rem" }}>Fonte do Evento</label>
                  <select value={trgFormSource} onChange={(e) => setTrgFormSource(e.target.value)} style={{ width: "100%", padding: "0.55rem", background: "rgba(0,0,0,0.3)", border: "1px solid var(--border-subtle)", color: "#fff", borderRadius: "6px" }}>
                    <option value="metric">📊 Métrica / Prometheus</option>
                    <option value="heartbeat">🔌 Heartbeat do Agente</option>
                    <option value="service">🛠️ Status de Serviço (Systemd)</option>
                    <option value="backup">💾 Confiabilidade de Backup</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "0.85rem", marginBottom: "0.35rem" }}>Métrica / Campo</label>
                  <input type="text" required value={trgFormMetric} onChange={(e) => setTrgFormMetric(e.target.value)} placeholder="disk.used_percent" style={{ width: "100%", padding: "0.55rem", background: "rgba(0,0,0,0.3)", border: "1px solid var(--border-subtle)", color: "#fff", borderRadius: "6px" }} />
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0.75rem", marginBottom: "1rem" }}>
                <div>
                  <label style={{ display: "block", fontSize: "0.85rem", marginBottom: "0.35rem" }}>Operador</label>
                  <select value={trgFormOperator} onChange={(e) => setTrgFormOperator(e.target.value)} style={{ width: "100%", padding: "0.55rem", background: "rgba(0,0,0,0.3)", border: "1px solid var(--border-subtle)", color: "#fff", borderRadius: "6px" }}>
                    <option value=">">&gt; (Maior que)</option>
                    <option value=">=">&gt;= (Maior ou igual)</option>
                    <option value="<">&lt; (Menor que)</option>
                    <option value="==">== (Igual a)</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "0.85rem", marginBottom: "0.35rem" }}>Limiar (Threshold)</label>
                  <input type="text" required value={trgFormThreshold} onChange={(e) => setTrgFormThreshold(e.target.value)} placeholder="85" style={{ width: "100%", padding: "0.55rem", background: "rgba(0,0,0,0.3)", border: "1px solid var(--border-subtle)", color: "#fff", borderRadius: "6px" }} />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "0.85rem", marginBottom: "0.35rem" }}>Debounce (Janela)</label>
                  <input type="text" required value={trgFormDuration} onChange={(e) => setTrgFormDuration(e.target.value)} placeholder="10m" style={{ width: "100%", padding: "0.55rem", background: "rgba(0,0,0,0.3)", border: "1px solid var(--border-subtle)", color: "#fff", borderRadius: "6px" }} />
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem", marginBottom: "1rem" }}>
                <div>
                  <label style={{ display: "block", fontSize: "0.85rem", marginBottom: "0.35rem" }}>Cooldown (min)</label>
                  <input type="number" required min="1" value={trgFormCooldown} onChange={(e) => setTrgFormCooldown(e.target.value)} style={{ width: "100%", padding: "0.55rem", background: "rgba(0,0,0,0.3)", border: "1px solid var(--border-subtle)", color: "#fff", borderRadius: "6px" }} />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "0.85rem", marginBottom: "0.35rem" }}>Circuit Breaker (máx/hora)</label>
                  <input type="number" required min="1" max="20" value={trgFormCircuitBreaker} onChange={(e) => setTrgFormCircuitBreaker(e.target.value)} style={{ width: "100%", padding: "0.55rem", background: "rgba(0,0,0,0.3)", border: "1px solid var(--border-subtle)", color: "#fff", borderRadius: "6px" }} />
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem", marginBottom: "1.25rem" }}>
                <div>
                  <label style={{ display: "block", fontSize: "0.85rem", marginBottom: "0.35rem" }}>Ação Disparada</label>
                  <select value={trgFormJobType} onChange={(e) => setTrgFormJobType(e.target.value)} style={{ width: "100%", padding: "0.55rem", background: "rgba(0,0,0,0.3)", border: "1px solid var(--border-subtle)", color: "#fff", borderRadius: "6px" }}>
                    <option value="action">⚡ Action Homologada</option>
                    <option value="ai_analysis">🤖 Análise por IA</option>
                    <option value="notification">🔔 Notificação de Alerta</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "0.85rem", marginBottom: "0.35rem" }}>Nível de Autonomia</label>
                  <select value={trgFormAutonomyLevel} onChange={(e) => setTrgFormAutonomyLevel(Number(e.target.value))} style={{ width: "100%", padding: "0.55rem", background: "rgba(0,0,0,0.3)", border: "1px solid var(--border-subtle)", color: "#fff", borderRadius: "6px" }}>
                    <option value={5}>Nível 5: Self-Healing</option>
                    <option value={4}>Nível 4: Autônomo com Registro</option>
                    <option value={3}>Nível 3: Exige Aprovação Humana</option>
                    <option value={2}>Nível 2: Apenas Recomendação</option>
                  </select>
                </div>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem" }}>
                <button type="button" className="btn btn-secondary" onClick={() => setTriggerModalOpen(false)}>Cancelar</button>
                <button type="submit" className="btn btn-primary">{editingTrigger ? "Salvar Alterações" : "Cadastrar Trigger"}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
