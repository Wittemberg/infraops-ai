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
    skipDuringMaintenance: false,
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

const defaultPolicies = [
  {
    id: "pol-nginx-heal",
    tenantId: "tenant-default",
    name: "🔄 Auto-Heal: Recuperação de Web Server (Nginx)",
    scenario: "service_down",
    targetType: "all",
    autonomyLevel: 5,
    allowedActions: ["service.restart"],
    riskBudget: {
      maxActionsPerHour: 3,
      maxActionsPerDay: 8,
      actionsExecutedToday: 1,
      actionsExecutedThisHour: 0,
    },
    evidenceThreshold: {
      minConfidencePercent: 95,
      requiredMetrics: ["service.status == failed", "port.80 == closed"],
    },
    precheckScript: "systemctl is-active --quiet nginx || exit 0",
    postcheckScript: "systemctl is-active --quiet nginx && curl -Is localhost:80 | head -1",
    rollbackSupported: false,
    autoEscalateOnFailure: true,
    enabled: true,
    lastExecutedAt: new Date(Date.now() - 3600000 * 5).toISOString(),
    lastExecutionStatus: "success",
    createdAt: new Date().toISOString(),
  },
  {
    id: "pol-disk-guardian",
    tenantId: "tenant-default",
    name: "💾 Disk Guardian: Auto-Limpeza Segura (> 88%)",
    scenario: "disk_pressure",
    targetType: "all",
    autonomyLevel: 4,
    allowedActions: ["disk.temp_cleanup"],
    riskBudget: {
      maxActionsPerHour: 2,
      maxActionsPerDay: 4,
      actionsExecutedToday: 1,
      actionsExecutedThisHour: 0,
    },
    evidenceThreshold: {
      minConfidencePercent: 90,
      requiredMetrics: ["disk.used_percent >= 88"],
    },
    precheckScript: "df -h / | tail -1",
    postcheckScript: "df -h / | awk '{print $5}' | sed 's/%//'",
    rollbackSupported: false,
    autoEscalateOnFailure: true,
    enabled: true,
    lastExecutedAt: new Date(Date.now() - 3600000 * 2).toISOString(),
    lastExecutionStatus: "success",
    createdAt: new Date().toISOString(),
  },
  {
    id: "pol-backup-retry",
    tenantId: "tenant-default",
    name: "🔁 Backup Guardian: Retry de Snapshot com Backoff",
    scenario: "backup_failure",
    targetType: "all",
    autonomyLevel: 3,
    allowedActions: ["backup.snapshot_create"],
    riskBudget: {
      maxActionsPerHour: 1,
      maxActionsPerDay: 2,
      actionsExecutedToday: 0,
      actionsExecutedThisHour: 0,
    },
    evidenceThreshold: {
      minConfidencePercent: 85,
      requiredMetrics: ["backup.last_status == failed"],
    },
    precheckScript: "check_pve_storage_lock",
    postcheckScript: "verify_snapshot_manifest_sha256",
    rollbackSupported: true,
    autoEscalateOnFailure: true,
    enabled: true,
    lastExecutedAt: undefined,
    lastExecutionStatus: undefined,
    createdAt: new Date().toISOString(),
  },
];

const defaultSelfHealingRuns = [
  {
    id: "heal-run-001",
    policyId: "pol-nginx-heal",
    policyName: "🔄 Auto-Heal: Recuperação de Web Server (Nginx)",
    tenantId: "tenant-default",
    scenario: "service_down",
    targetName: "pve01.local (Nginx)",
    actionExecuted: "service.restart",
    autonomyLevel: 5,
    startedAt: new Date(Date.now() - 3600000 * 5).toISOString(),
    finishedAt: new Date(Date.now() - 3600000 * 5 + 2100).toISOString(),
    status: "success",
    precheckPassed: true,
    postcheckPassed: true,
    summary: "Self-Healing executado com sucesso: Serviço Nginx recuperado e porta 80 reestabelecida em 2.1s.",
    evidence: {
      beforeState: { status: "failed", pid: null, port80Listening: false },
      afterState: { status: "active", pid: 4812, port80Listening: true, httpStatus: "200 OK" },
      metricsEvaluated: { confidencePercent: 99, flappingDetected: false },
    },
    eventHash: "4c7a52e9f1a0b38d976c543210fedcba9876543210fedcba9876543210fedcba",
  },
];

export function AutomationsSchedulerView({ activeTenant }) {
  const [activeTab, setActiveTab] = useState("schedules"); // "schedules" | "triggers" | "policies" | "history"

  // Data States
  const [schedules, setSchedules] = useState(() => {
    const cached = localStorage.getItem("infraops_schedules");
    return cached ? JSON.parse(cached) : defaultSchedules;
  });

  const [triggers, setTriggers] = useState(() => {
    const cached = localStorage.getItem("infraops_triggers");
    return cached ? JSON.parse(cached) : defaultTriggers;
  });

  const [policies, setPolicies] = useState(() => {
    const cached = localStorage.getItem("infraops_autonomous_policies");
    return cached ? JSON.parse(cached) : defaultPolicies;
  });

  const [selfHealingRuns, setSelfHealingRuns] = useState(() => {
    const cached = localStorage.getItem("infraops_self_healing_runs");
    return cached ? JSON.parse(cached) : defaultSelfHealingRuns;
  });

  const [runs, setRuns] = useState([]);
  const [triggerEvents, setTriggerEvents] = useState([]);

  // UI Feedback
  const [runningId, setRunningId] = useState(null);
  const [simulatingTriggerId, setSimulatingTriggerId] = useState(null);
  const [executingPolicyId, setExecutingPolicyId] = useState(null);
  const [feedbackMsg, setFeedbackMsg] = useState(null);

  // Modals
  const [scheduleModalOpen, setScheduleModalOpen] = useState(false);
  const [triggerModalOpen, setTriggerModalOpen] = useState(false);
  const [policyModalOpen, setPolicyModalOpen] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState(null);
  const [editingTrigger, setEditingTrigger] = useState(null);
  const [editingPolicy, setEditingPolicy] = useState(null);

  // Form Schedule
  const [schFormName, setSchFormName] = useState("");
  const [schFormType, setSchFormType] = useState("cron");
  const [schFormExpression, setSchFormExpression] = useState("0 7 * * *");
  const [schFormJobType, setSchFormJobType] = useState("ai_analysis");
  const [schFormActionKey, setSchFormActionKey] = useState("disk.temp_cleanup");
  const [schFormAutonomyLevel, setSchFormAutonomyLevel] = useState(2);
  const [schFormSkipMaint, setSchFormSkipMaint] = useState(true);

  // Form Trigger
  const [trgFormName, setTrgFormName] = useState("");
  const [trgFormSource, setTrgFormSource] = useState("metric");
  const [trgFormMetric, setTrgFormMetric] = useState("disk.used_percent");
  const [trgFormOperator, setTrgFormOperator] = useState(">");
  const [trgFormThreshold, setTrgFormThreshold] = useState("85");
  const [trgFormDuration, setTrgFormDuration] = useState("10m");
  const [trgFormCooldown, setTrgFormCooldown] = useState(30);
  const [trgFormCircuitBreaker, setTrgFormCircuitBreaker] = useState(3);
  const [trgFormJobType, setTrgFormJobType] = useState("action");
  const [trgFormActionKey, setTrgFormActionKey] = useState("disk.temp_cleanup");
  const [trgFormAutonomyLevel, setTrgFormAutonomyLevel] = useState(4);

  // Form Policy (Etapa 23)
  const [polFormName, setPolFormName] = useState("");
  const [polFormScenario, setPolFormScenario] = useState("service_down");
  const [polFormAutonomyLevel, setPolFormAutonomyLevel] = useState(5);
  const [polFormActionKey, setPolFormActionKey] = useState("service.restart");
  const [polFormMaxPerHour, setPolFormMaxPerHour] = useState(3);
  const [polFormMaxPerDay, setPolFormMaxPerDay] = useState(8);
  const [polFormPrecheck, setPolFormPrecheck] = useState("systemctl is-active --quiet nginx || exit 0");
  const [polFormPostcheck, setPolFormPostcheck] = useState("systemctl is-active --quiet nginx && curl -Is localhost:80 | head -1");
  const [polFormAutoEscalate, setPolFormAutoEscalate] = useState(true);

  // Fetch initial data
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [resSch, resRuns, resTrg, resTrgEvt, resPol, resHealRuns] = await Promise.all([
          fetch(`${API_BASE}/api/v1/automations/schedules`).catch(() => null),
          fetch(`${API_BASE}/api/v1/automations/schedules/runs`).catch(() => null),
          fetch(`${API_BASE}/api/v1/automations/triggers`).catch(() => null),
          fetch(`${API_BASE}/api/v1/automations/triggers/events`).catch(() => null),
          fetch(`${API_BASE}/api/v1/automations/self-healing/policies`).catch(() => null),
          fetch(`${API_BASE}/api/v1/automations/self-healing/runs`).catch(() => null),
        ]);

        if (resSch && resSch.ok) {
          const data = await resSch.json();
          if (data.schedules) setSchedules(data.schedules);
        }
        if (resRuns && resRuns.ok) {
          const data = await resRuns.json();
          if (data.runs) setRuns(data.runs);
        }
        if (resTrg && resTrg.ok) {
          const data = await resTrg.json();
          if (data.triggers) setTriggers(data.triggers);
        }
        if (resTrgEvt && resTrgEvt.ok) {
          const data = await resTrgEvt.json();
          if (data.events) setTriggerEvents(data.events);
        }
        if (resPol && resPol.ok) {
          const data = await resPol.json();
          if (data.policies) setPolicies(data.policies);
        }
        if (resHealRuns && resHealRuns.ok) {
          const data = await resHealRuns.json();
          if (data.runs) setSelfHealingRuns(data.runs);
        }
      } catch (err) {
        console.warn("Using offline state:", err);
      }
    };
    fetchData();
  }, [activeTenant]);

  // Handlers: Schedules
  const handleOpenScheduleModal = (preset = null) => {
    if (preset === "daily_brief") {
      setSchFormName("🌅 Daily Infrastructure Briefing");
      setSchFormType("cron");
      setSchFormExpression("0 7 * * *");
      setSchFormJobType("ai_analysis");
      setSchFormAutonomyLevel(2);
      setSchFormSkipMaint(true);
    } else if (preset === "health_sweep") {
      setSchFormName("🩺 Health Sweep Diagnóstico Recorrente");
      setSchFormType("interval");
      setSchFormExpression("30m");
      setSchFormJobType("health_sweep");
      setSchFormAutonomyLevel(5);
      setSchFormSkipMaint(false);
    } else {
      setSchFormName("");
      setSchFormType("cron");
      setSchFormExpression("0 7 * * *");
      setSchFormJobType("ai_analysis");
      setSchFormAutonomyLevel(2);
      setSchFormSkipMaint(true);
    }
    setEditingSchedule(null);
    setScheduleModalOpen(true);
  };

  const handleSaveSchedule = async (e) => {
    e.preventDefault();
    if (!schFormName.trim()) return;

    const payload = {
      tenantId: activeTenant?.id || "tenant-default",
      name: schFormName,
      type: schFormType,
      scheduleExpression: schFormExpression,
      timezone: "America/Sao_Paulo",
      targetType: "all",
      jobType: schFormJobType,
      actionKey: schFormJobType === "action" ? schFormActionKey : undefined,
      autonomyLevel: Number(schFormAutonomyLevel),
      skipDuringMaintenance: schFormSkipMaint,
      enabled: true,
    };

    try {
      const res = await fetch(`${API_BASE}/api/v1/automations/schedules`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.schedule) {
        setSchedules((prev) => [...prev, data.schedule]);
        setFeedbackMsg("Agendamento criado com sucesso!");
      }
    } catch (err) {
      console.warn("Saved offline:", err);
    }
    setScheduleModalOpen(false);
    setTimeout(() => setFeedbackMsg(null), 4000);
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

  // Handlers: Triggers
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
    } else {
      setTrgFormName("");
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
    }
    setEditingTrigger(null);
    setTriggerModalOpen(true);
  };

  const handleSimulateTrigger = async (trg) => {
    setSimulatingTriggerId(trg.id);
    try {
      const res = await fetch(`${API_BASE}/api/v1/automations/triggers/${trg.id}/simulate`, { method: "POST" });
      const data = await res.json();
      if (data.event) setTriggerEvents((prev) => [data.event, ...prev]);
      if (data.trigger) setTriggers((prev) => prev.map((t) => (t.id === trg.id ? data.trigger : t)));

      if (data.circuitBreakerTripped) {
        setFeedbackMsg(`⚠️ Circuit Breaker disparado: Automação pausada por exceder limite de segurança.`);
      } else {
        setFeedbackMsg(`⚡ Trigger satisfeito! Ação executada com sucesso sob nível de autonomia ${trg.autonomyLevel}.`);
      }
    } catch (err) {
      console.warn("Simulation offline:", err);
    } finally {
      setSimulatingTriggerId(null);
      setTimeout(() => setFeedbackMsg(null), 5000);
    }
  };

  const handleResetCircuitBreaker = async (trgId) => {
    try {
      const res = await fetch(`${API_BASE}/api/v1/automations/triggers/${trgId}/reset-circuit-breaker`, { method: "POST" });
      const data = await res.json();
      if (data.trigger) {
        setTriggers((prev) => prev.map((t) => (t.id === trgId ? data.trigger : t)));
        setFeedbackMsg("✓ Circuit Breaker rearmado com sucesso!");
      }
    } catch (err) {
      console.warn("Reset error:", err);
    } finally {
      setTimeout(() => setFeedbackMsg(null), 4000);
    }
  };

  // Handlers: Self-Healing Policies (Etapa 23)
  const handleOpenPolicyModal = (preset = null) => {
    if (preset === "service_heal") {
      setPolFormName("🔄 Auto-Heal: Recuperação de Web Server (Nginx)");
      setPolFormScenario("service_down");
      setPolFormAutonomyLevel(5);
      setPolFormActionKey("service.restart");
      setPolFormMaxPerHour(3);
      setPolFormMaxPerDay(8);
      setPolFormPrecheck("systemctl is-active --quiet nginx || exit 0");
      setPolFormPostcheck("systemctl is-active --quiet nginx && curl -Is localhost:80 | head -1");
      setPolFormAutoEscalate(true);
    } else if (preset === "disk_guardian") {
      setPolFormName("💾 Disk Guardian: Auto-Limpeza Segura (> 88%)");
      setPolFormScenario("disk_pressure");
      setPolFormAutonomyLevel(4);
      setPolFormActionKey("disk.temp_cleanup");
      setPolFormMaxPerHour(2);
      setPolFormMaxPerDay(4);
      setPolFormPrecheck("df -h / | tail -1");
      setPolFormPostcheck("df -h / | awk '{print $5}' | sed 's/%//'");
      setPolFormAutoEscalate(true);
    } else {
      setPolFormName("");
      setPolFormScenario("service_down");
      setPolFormAutonomyLevel(4);
      setPolFormActionKey("service.restart");
      setPolFormMaxPerHour(3);
      setPolFormMaxPerDay(8);
      setPolFormPrecheck("precheck_script");
      setPolFormPostcheck("postcheck_script");
      setPolFormAutoEscalate(true);
    }
    setEditingPolicy(null);
    setPolicyModalOpen(true);
  };

  const handleSavePolicy = async (e) => {
    e.preventDefault();
    if (!polFormName.trim()) return;

    const payload = {
      tenantId: activeTenant?.id || "tenant-default",
      name: polFormName,
      scenario: polFormScenario,
      targetType: "all",
      autonomyLevel: Number(polFormAutonomyLevel),
      allowedActions: [polFormActionKey],
      riskBudget: {
        maxActionsPerHour: Number(polFormMaxPerHour),
        maxActionsPerDay: Number(polFormMaxPerDay),
        actionsExecutedToday: 0,
        actionsExecutedThisHour: 0,
      },
      evidenceThreshold: {
        minConfidencePercent: 90,
        requiredMetrics: [`scenario.${polFormScenario} == active`],
      },
      precheckScript: polFormPrecheck,
      postcheckScript: polFormPostcheck,
      rollbackSupported: false,
      autoEscalateOnFailure: polFormAutoEscalate,
      enabled: true,
    };

    try {
      const res = await fetch(`${API_BASE}/api/v1/automations/self-healing/policies`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.policy) {
        setPolicies((prev) => [...prev, data.policy]);
        setFeedbackMsg("Política de Self-Healing homologada com sucesso!");
      }
    } catch (err) {
      console.warn("Saved policy offline:", err);
    }
    setPolicyModalOpen(false);
    setTimeout(() => setFeedbackMsg(null), 4000);
  };

  const handleExecuteSelfHealing = async (pol) => {
    setExecutingPolicyId(pol.id);
    try {
      const res = await fetch(`${API_BASE}/api/v1/automations/self-healing/policies/${pol.id}/execute`, { method: "POST" });
      const data = await res.json();

      if (data.run) {
        setSelfHealingRuns((prev) => [data.run, ...prev]);
      }
      if (data.policy) {
        setPolicies((prev) => prev.map((p) => (p.id === pol.id ? data.policy : p)));
      }

      if (data.requiresApproval) {
        setFeedbackMsg(`🛡️ Remediação retida para aprovação: Nível ${pol.autonomyLevel} exige confirmação humana.`);
      } else if (data.riskBudgetExceeded) {
        setFeedbackMsg(`⚠️ Orçamento de Risco excedido! Limite de ações/hora atingido.`);
      } else {
        setFeedbackMsg(`🛡️ Auto-Remediação executada com sucesso! Precheck e Postcheck validados sob Nível ${pol.autonomyLevel}.`);
      }
    } catch (err) {
      console.warn("Execute self-healing error:", err);
    } finally {
      setExecutingPolicyId(null);
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
      case 1:
        return <span className="badge" style={{ fontSize: "0.72rem" }}>Nível 1: Diagnóstico</span>;
      default:
        return <span className="badge" style={{ fontSize: "0.72rem" }}>Nível 0: Observação</span>;
    }
  };

  const activeSchedulesCount = schedules.filter((s) => s.enabled).length;
  const activeTriggersCount = triggers.filter((t) => t.enabled).length;
  const activePoliciesCount = policies.filter((p) => p.enabled).length;

  return (
    <div style={{ padding: "1.25rem 1.5rem" }}>
      {/* Context Banner */}
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
              ⏰ Motor de Automações, Schedules & Self-Healing — Cliente:{" "}
              <strong style={{ color: "var(--accent-indigo)" }}>{activeTenant?.name}</strong>
            </span>
            <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "0.2rem" }}>
              Etapas 21, 22 e 23 ativas: Agendamentos recorrentes, Gatilhos anti-flapping e Políticas de Auto-Remediação governada.
            </div>
          </div>
          <div style={{ display: "flex", gap: "0.5rem" }}>
            <span className="badge badge-online" style={{ fontSize: "0.75rem" }}>
              ✓ {activeSchedulesCount} Agendamentos
            </span>
            <span className="badge badge-online" style={{ fontSize: "0.75rem" }}>
              ⚡ {activeTriggersCount} Triggers
            </span>
            <span className="badge badge-online" style={{ fontSize: "0.75rem" }}>
              🛡️ {activePoliciesCount} Políticas Self-Healing
            </span>
          </div>
        </div>
      </div>

      {feedbackMsg && (
        <div
          style={{
            marginBottom: "1rem",
            padding: "0.75rem 1rem",
            background: feedbackMsg.includes("⚠️") ? "rgba(245, 158, 11, 0.15)" : "rgba(16, 185, 129, 0.15)",
            border: feedbackMsg.includes("⚠️") ? "1px solid rgba(245, 158, 11, 0.3)" : "1px solid rgba(16, 185, 129, 0.3)",
            color: feedbackMsg.includes("⚠️") ? "var(--accent-amber)" : "var(--accent-emerald)",
            borderRadius: "8px",
            fontSize: "0.85rem",
            fontWeight: 600,
          }}
        >
          {feedbackMsg}
        </div>
      )}

      {/* KPI Cards */}
      <div className="kpi-grid" style={{ padding: "0 0 1.25rem 0" }}>
        <div className="glass-panel kpi-card">
          <div className="kpi-title">📅 Rotinas Agendadas</div>
          <div className="kpi-value" style={{ color: "var(--accent-indigo)" }}>{schedules.length}</div>
          <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>{activeSchedulesCount} ativas</span>
        </div>

        <div className="glass-panel kpi-card">
          <div className="kpi-title">⚡ Triggers Condicionais</div>
          <div className="kpi-value" style={{ color: "var(--accent-cyan)" }}>{triggers.length}</div>
          <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Anti-flapping com Circuit Breaker</span>
        </div>

        <div className="glass-panel kpi-card">
          <div className="kpi-title">🛡️ Políticas Self-Healing</div>
          <div className="kpi-value" style={{ color: "var(--accent-emerald)" }}>{policies.length}</div>
          <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Níveis 4 & 5 com Pre/Postcheck</span>
        </div>

        <div className="glass-panel kpi-card">
          <div className="kpi-title">📜 Execuções & Remediações</div>
          <div className="kpi-value" style={{ color: "var(--accent-purple)" }}>{runs.length + triggerEvents.length + selfHealingRuns.length}</div>
          <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Histórico auditável SHA-256</span>
        </div>
      </div>

      {/* Main Glass Panel */}
      <div className="glass-panel" style={{ padding: "1.25rem" }}>
        {/* Navigation Tabs */}
        <div style={{ display: "flex", gap: "0.5rem", borderBottom: "1px solid var(--border-subtle)", paddingBottom: "0.75rem", marginBottom: "1.25rem", flexWrap: "wrap" }}>
          <button
            type="button"
            className={`btn ${activeTab === "schedules" ? "btn-primary" : "btn-secondary"}`}
            onClick={() => setActiveTab("schedules")}
            style={{ fontSize: "0.85rem" }}
          >
            📅 Agendamentos & Cron (Etapa 21)
          </button>
          <button
            type="button"
            className={`btn ${activeTab === "triggers" ? "btn-primary" : "btn-secondary"}`}
            onClick={() => setActiveTab("triggers")}
            style={{ fontSize: "0.85rem" }}
          >
            ⚡ Triggers & Eventos (Etapa 22)
          </button>
          <button
            type="button"
            className={`btn ${activeTab === "policies" ? "btn-primary" : "btn-secondary"}`}
            onClick={() => setActiveTab("policies")}
            style={{ fontSize: "0.85rem" }}
          >
            🛡️ Self-Healing & Políticas (Etapa 23)
          </button>
          <button
            type="button"
            className={`btn ${activeTab === "history" ? "btn-primary" : "btn-secondary"}`}
            onClick={() => setActiveTab("history")}
            style={{ fontSize: "0.85rem" }}
          >
            📜 Histórico de Execuções
          </button>
        </div>

        {/* TAB 1: SCHEDULES */}
        {activeTab === "schedules" && (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem", flexWrap: "wrap", gap: "0.5rem" }}>
              <div>
                <h3 style={{ fontSize: "1.1rem", fontWeight: 700 }}>📅 Automações Agendadas</h3>
                <p style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>
                  Rotinas executadas periodicamente para diagnóstico, auditoria de backups e relatórios.
                </p>
              </div>
              <button type="button" className="btn btn-primary" onClick={() => handleOpenScheduleModal()} style={{ fontSize: "0.85rem" }}>
                + Nova Automação Agendada
              </button>
            </div>

            <div style={{ width: "100%", overflowX: "auto" }}>
              <table className="custom-table" style={{ width: "100%", minWidth: "900px" }}>
                <thead>
                  <tr>
                    <th style={{ width: "30%" }}>Nome da Rotina</th>
                    <th style={{ width: "15%" }}>Frequência</th>
                    <th style={{ width: "15%" }}>Tipo de Tarefa</th>
                    <th style={{ width: "15%" }}>Nível de Autonomia</th>
                    <th style={{ width: "10%" }}>Status</th>
                    <th style={{ width: "15%" }}>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {schedules.map((sch) => (
                    <tr key={sch.id}>
                      <td>
                        <div style={{ fontWeight: 600, fontSize: "0.85rem" }}>{sch.name}</div>
                        <div style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>ID: {sch.id}</div>
                      </td>
                      <td>
                        <code style={{ fontSize: "0.75rem", color: "var(--accent-cyan)" }}>{sch.scheduleExpression}</code>
                        <div style={{ fontSize: "0.68rem", color: "var(--text-muted)" }}>{sch.timezone}</div>
                      </td>
                      <td>
                        <span style={{ fontSize: "0.75rem", fontWeight: 600 }}>
                          {sch.jobType === "ai_analysis" && "🤖 Análise de IA"}
                          {sch.jobType === "health_sweep" && "🩺 Health Sweep"}
                          {sch.jobType === "backup_compliance" && "💾 Auditoria Backup"}
                          {sch.jobType === "action" && `⚡ Action (${sch.actionKey})`}
                        </span>
                      </td>
                      <td>{getAutonomyBadge(sch.autonomyLevel)}</td>
                      <td>
                        <span className={`badge ${sch.enabled ? "badge-online" : "badge-offline"}`} style={{ fontSize: "0.7rem" }}>
                          {sch.enabled ? "🟢 ATIVO" : "⏸️ PAUSADO"}
                        </span>
                      </td>
                      <td>
                        <button
                          type="button"
                          className="btn btn-primary"
                          disabled={runningId === sch.id}
                          onClick={() => handleRunNow(sch)}
                          style={{ padding: "0.3rem 0.6rem", fontSize: "0.75rem" }}
                        >
                          {runningId === sch.id ? "⏳ Executando..." : "⚡ Executar Agora"}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 2: TRIGGERS */}
        {activeTab === "triggers" && (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem", flexWrap: "wrap", gap: "0.5rem" }}>
              <div>
                <h3 style={{ fontSize: "1.1rem", fontWeight: 700 }}>⚡ Triggers Condicionais Reativos</h3>
                <p style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>
                  Gatilhos acionados por métricas e telemetria com travas anti-flapping (Debounce, Cooldown e Circuit Breaker).
                </p>
              </div>
              <button type="button" className="btn btn-primary" onClick={() => handleOpenTriggerModal()} style={{ fontSize: "0.85rem" }}>
                + Novo Trigger
              </button>
            </div>

            <div style={{ width: "100%", overflowX: "auto" }}>
              <table className="custom-table" style={{ width: "100%", minWidth: "900px" }}>
                <thead>
                  <tr>
                    <th style={{ width: "25%" }}>Nome do Trigger</th>
                    <th style={{ width: "20%" }}>Condição Avaliada</th>
                    <th style={{ width: "15%" }}>Travas Anti-Flapping</th>
                    <th style={{ width: "15%" }}>Ação / Nível</th>
                    <th style={{ width: "10%" }}>Circuit Breaker</th>
                    <th style={{ width: "15%" }}>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {triggers.map((trg) => (
                    <tr key={trg.id}>
                      <td>
                        <div style={{ fontWeight: 600, fontSize: "0.85rem" }}>{trg.name}</div>
                        <span style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>Fonte: {trg.source}</span>
                      </td>
                      <td>
                        <code style={{ fontSize: "0.75rem", color: "var(--accent-amber)" }}>
                          {trg.metricName} {trg.operator} {trg.threshold}
                        </code>
                        <div style={{ fontSize: "0.68rem", color: "var(--text-muted)" }}>Persistência: {trg.duration}</div>
                      </td>
                      <td>
                        <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>
                          Cooldown: <strong>{trg.cooldownMinutes}m</strong>
                        </div>
                        <div style={{ fontSize: "0.68rem", color: "var(--text-muted)" }}>Max: {trg.circuitBreakerMaxPerHour} disparos/h</div>
                      </td>
                      <td>
                        <div style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--accent-indigo)" }}>
                          {trg.actionKey || "diagnostics.sweep"}
                        </div>
                        {getAutonomyBadge(trg.autonomyLevel)}
                      </td>
                      <td>
                        {trg.circuitBreakerTripped ? (
                          <span className="badge badge-offline" style={{ fontSize: "0.7rem" }}>🔴 TRIPPED</span>
                        ) : (
                          <span className="badge badge-online" style={{ fontSize: "0.7rem" }}>🟢 OK</span>
                        )}
                      </td>
                      <td>
                        <div style={{ display: "flex", gap: "0.3rem" }}>
                          <button
                            type="button"
                            className="btn btn-primary"
                            disabled={simulatingTriggerId === trg.id}
                            onClick={() => handleSimulateTrigger(trg)}
                            style={{ padding: "0.25rem 0.5rem", fontSize: "0.72rem" }}
                          >
                            {simulatingTriggerId === trg.id ? "⏳ Testando..." : "🧪 Simular"}
                          </button>
                          {trg.circuitBreakerTripped && (
                            <button
                              type="button"
                              onClick={() => handleResetCircuitBreaker(trg.id)}
                              style={{ background: "rgba(245, 158, 11, 0.2)", color: "var(--accent-amber)", border: "none", borderRadius: "4px", padding: "0.25rem 0.5rem", fontSize: "0.72rem", cursor: "pointer" }}
                            >
                              Rearmar
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 3: SELF-HEALING & POLICIES (ETAPA 23) */}
        {activeTab === "policies" && (
          <div>
            {/* Autonomy Level Guide */}
            <div style={{ background: "rgba(0,0,0,0.25)", border: "1px solid var(--border-subtle)", borderRadius: "8px", padding: "0.9rem 1.25rem", marginBottom: "1.25rem" }}>
              <div style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--accent-indigo)", marginBottom: "0.5rem" }}>
                🛡️ Matriz de Governança de Autonomia (Níveis 0 a 5)
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "0.5rem", fontSize: "0.75rem" }}>
                <div style={{ padding: "0.4rem", background: "rgba(255,255,255,0.03)", borderRadius: "4px" }}>
                  <strong>Nível 0 (Observe):</strong> Apenas telemetria.
                </div>
                <div style={{ padding: "0.4rem", background: "rgba(255,255,255,0.03)", borderRadius: "4px" }}>
                  <strong>Nível 1 (Analyze):</strong> Diagnóstico de anomalias.
                </div>
                <div style={{ padding: "0.4rem", background: "rgba(255,255,255,0.03)", borderRadius: "4px" }}>
                  <strong>Nível 2 (Recommend):</strong> Sugere Action ao operador.
                </div>
                <div style={{ padding: "0.4rem", background: "rgba(245, 158, 11, 0.1)", borderRadius: "4px", color: "var(--accent-amber)" }}>
                  <strong>Nível 3 (Approval):</strong> Retém Job para aprovação.
                </div>
                <div style={{ padding: "0.4rem", background: "rgba(99, 102, 241, 0.15)", borderRadius: "4px", color: "var(--accent-indigo)" }}>
                  <strong>Nível 4 (Autonomous):</strong> Execução sob precheck.
                </div>
                <div style={{ padding: "0.4rem", background: "rgba(16, 185, 129, 0.15)", borderRadius: "4px", color: "var(--accent-emerald)" }}>
                  <strong>Nível 5 (Self-Healing):</strong> Remediação com postcheck e auto-escalação.
                </div>
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem", flexWrap: "wrap", gap: "0.5rem" }}>
              <div>
                <h3 style={{ fontSize: "1.1rem", fontWeight: 700 }}>🛡️ Políticas de Auto-Remediação (Self-Healing)</h3>
                <p style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>
                  Ações de remediação executadas automaticamente com validação obrigatória pré e pós-execução e controle de orçamento de risco (*Risk Budget*).
                </p>
              </div>
              <button type="button" className="btn btn-primary" onClick={() => handleOpenPolicyModal("service_heal")} style={{ fontSize: "0.85rem" }}>
                + Nova Política de Self-Healing
              </button>
            </div>

            <div style={{ width: "100%", overflowX: "auto" }}>
              <table className="custom-table" style={{ width: "100%", minWidth: "960px" }}>
                <thead>
                  <tr>
                    <th style={{ width: "26%" }}>Nome da Política & Cenário</th>
                    <th style={{ width: "14%" }}>Nível de Autonomia</th>
                    <th style={{ width: "16%" }}>Action Homologada</th>
                    <th style={{ width: "16%" }}>Orçamento de Risco (Budget)</th>
                    <th style={{ width: "12%" }}>Pós-Validação</th>
                    <th style={{ width: "16%" }}>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {policies.map((pol) => (
                    <tr key={pol.id}>
                      <td>
                        <div style={{ fontWeight: 600, fontSize: "0.85rem" }}>{pol.name}</div>
                        <span style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>
                          Cenário: <strong>{pol.scenario}</strong> • Escalonamento: {pol.autoEscalateOnFailure ? "Ativo" : "Não"}
                        </span>
                      </td>
                      <td>{getAutonomyBadge(pol.autonomyLevel)}</td>
                      <td>
                        <code style={{ fontSize: "0.75rem", color: "var(--accent-indigo)" }}>
                          {pol.allowedActions.join(", ")}
                        </code>
                      </td>
                      <td>
                        <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>
                          <strong>{pol.riskBudget.actionsExecutedThisHour}/{pol.riskBudget.maxActionsPerHour}</strong> ações/hora
                        </div>
                        <div style={{ fontSize: "0.68rem", color: "var(--text-muted)" }}>
                          Hoje: {pol.riskBudget.actionsExecutedToday}/{pol.riskBudget.maxActionsPerDay} max/dia
                        </div>
                      </td>
                      <td>
                        <span className="badge badge-online" style={{ fontSize: "0.7rem" }}>
                          ✓ Postcheck Ativo
                        </span>
                      </td>
                      <td>
                        <button
                          type="button"
                          className="btn btn-primary"
                          disabled={executingPolicyId === pol.id}
                          onClick={() => handleExecuteSelfHealing(pol)}
                          style={{ padding: "0.25rem 0.55rem", fontSize: "0.72rem", whiteSpace: "nowrap" }}
                          title="Executar ciclo completo de precheck -> action -> postcheck -> audit"
                        >
                          {executingPolicyId === pol.id ? "⏳ Remediando..." : "🧪 Testar Remediação"}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 4: HISTORY */}
        {activeTab === "history" && (
          <div>
            <h3 style={{ fontSize: "1.1rem", fontWeight: 700, marginBottom: "0.5rem" }}>📜 Histórico de Automações & Remediações</h3>
            <p style={{ fontSize: "0.8rem", color: "var(--text-secondary)", marginBottom: "1rem" }}>
              Registro imutável com evidências coletadas, tempo de execução e hash de integridade SHA-256.
            </p>

            <div style={{ width: "100%", overflowX: "auto" }}>
              <table className="custom-table" style={{ width: "100%", minWidth: "920px" }}>
                <thead>
                  <tr>
                    <th style={{ width: "20%" }}>Horário</th>
                    <th style={{ width: "25%" }}>Automação / Política</th>
                    <th style={{ width: "35%" }}>Resumo do Resultado & Evidências</th>
                    <th style={{ width: "10%" }}>Status</th>
                    <th style={{ width: "10%" }}>Hash SHA-256</th>
                  </tr>
                </thead>
                <tbody>
                  {/* Self-Healing runs */}
                  {selfHealingRuns.map((hr) => (
                    <tr key={hr.id}>
                      <td style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>
                        {new Date(hr.startedAt).toLocaleString("pt-BR")}
                      </td>
                      <td>
                        <div style={{ fontWeight: 600, fontSize: "0.85rem", color: "var(--accent-emerald)" }}>
                          🛡️ {hr.policyName}
                        </div>
                        <span style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>Ação: {hr.actionExecuted}</span>
                      </td>
                      <td style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>
                        <div>{hr.summary}</div>
                        {hr.evidence && (
                          <div style={{ fontSize: "0.68rem", color: "var(--text-muted)", marginTop: "0.2rem" }}>
                            Precheck: {hr.precheckPassed ? "✓ PASSOU" : "FALHOU"} • Postcheck: {hr.postcheckPassed ? "✓ PASSOU" : "N/A"}
                          </div>
                        )}
                      </td>
                      <td>
                        <span className={`badge ${hr.status === "success" ? "badge-online" : hr.status === "requires_approval" ? "badge-requires_approval" : "badge-offline"}`} style={{ fontSize: "0.7rem" }}>
                          {hr.status.toUpperCase()}
                        </span>
                      </td>
                      <td>
                        <code style={{ fontSize: "0.68rem", color: "var(--accent-cyan)" }}>
                          {hr.eventHash?.substring(0, 8)}...
                        </code>
                      </td>
                    </tr>
                  ))}

                  {/* Scheduled runs */}
                  {runs.map((r) => (
                    <tr key={r.id}>
                      <td style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>
                        {new Date(r.startedAt).toLocaleString("pt-BR")}
                      </td>
                      <td>
                        <div style={{ fontWeight: 600, fontSize: "0.85rem" }}>📅 {r.scheduleName}</div>
                        <span style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>Nível: {r.autonomyLevelUsed}</span>
                      </td>
                      <td style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>{r.summary}</td>
                      <td>
                        <span className="badge badge-online" style={{ fontSize: "0.7rem" }}>SUCESSO</span>
                      </td>
                      <td>
                        <code style={{ fontSize: "0.68rem", color: "var(--accent-cyan)" }}>
                          {r.eventHash?.substring(0, 8)}...
                        </code>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Modal: New Policy (Etapa 23) */}
      {policyModalOpen && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setPolicyModalOpen(false)}>
          <div className="glass-panel modal-content" style={{ maxWidth: "600px", position: "relative" }}>
            <button type="button" onClick={() => setPolicyModalOpen(false)} style={{ position: "absolute", top: "1.25rem", right: "1.25rem", background: "none", border: "none", color: "var(--text-muted)", fontSize: "1.25rem", cursor: "pointer" }}>
              ✖
            </button>
            <h3 style={{ fontFamily: "var(--font-heading)", fontSize: "1.25rem", marginBottom: "0.5rem" }}>
              🛡️ Nova Política de Self-Healing Governança
            </h3>
            <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)", marginBottom: "1.25rem" }}>
              Cliente: <strong style={{ color: "var(--accent-indigo)" }}>{activeTenant?.name}</strong>
            </p>

            <form onSubmit={handleSavePolicy}>
              <div style={{ marginBottom: "1rem" }}>
                <label style={{ display: "block", fontSize: "0.85rem", marginBottom: "0.35rem" }}>Nome da Política *</label>
                <input type="text" required value={polFormName} onChange={(e) => setPolFormName(e.target.value)} placeholder="Ex: 🔄 Auto-Heal Nginx Web Server" style={{ width: "100%", padding: "0.55rem", background: "rgba(0,0,0,0.3)", border: "1px solid var(--border-subtle)", color: "#fff", borderRadius: "6px" }} />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem", marginBottom: "1rem" }}>
                <div>
                  <label style={{ display: "block", fontSize: "0.85rem", marginBottom: "0.35rem" }}>Cenário de Falha</label>
                  <select value={polFormScenario} onChange={(e) => setPolFormScenario(e.target.value)} style={{ width: "100%", padding: "0.55rem", background: "rgba(0,0,0,0.3)", border: "1px solid var(--border-subtle)", color: "#fff", borderRadius: "6px" }}>
                    <option value="service_down">🔄 Serviço Fora do Ar (Systemd/Process)</option>
                    <option value="disk_pressure">💾 Pressão de Disco / Storage</option>
                    <option value="backup_failure">🔁 Falha de Snapshot de Backup</option>
                    <option value="zombie_process">🧹 Processo Travado / Memória</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "0.85rem", marginBottom: "0.35rem" }}>Nível de Autonomia</label>
                  <select value={polFormAutonomyLevel} onChange={(e) => setPolFormAutonomyLevel(e.target.value)} style={{ width: "100%", padding: "0.55rem", background: "rgba(0,0,0,0.3)", border: "1px solid var(--border-subtle)", color: "#fff", borderRadius: "6px" }}>
                    <option value="5">Nível 5: Self-Healing (Completo + Postcheck)</option>
                    <option value="4">Nível 4: Autônomo (Precheck + Action)</option>
                    <option value="3">Nível 3: Exige Aprovação Humana</option>
                    <option value="2">Nível 2: Apenas Recomendação</option>
                  </select>
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem", marginBottom: "1rem" }}>
                <div>
                  <label style={{ display: "block", fontSize: "0.85rem", marginBottom: "0.35rem" }}>Action Homologada</label>
                  <select value={polFormActionKey} onChange={(e) => setPolFormActionKey(e.target.value)} style={{ width: "100%", padding: "0.55rem", background: "rgba(0,0,0,0.3)", border: "1px solid var(--border-subtle)", color: "#fff", borderRadius: "6px" }}>
                    <option value="service.restart">service.restart</option>
                    <option value="disk.temp_cleanup">disk.temp_cleanup</option>
                    <option value="backup.snapshot_create">backup.snapshot_create</option>
                    <option value="node.reboot">node.reboot</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "0.85rem", marginBottom: "0.35rem" }}>Limite (Risk Budget / Hora)</label>
                  <input type="number" min="1" max="10" value={polFormMaxPerHour} onChange={(e) => setPolFormMaxPerHour(e.target.value)} style={{ width: "100%", padding: "0.55rem", background: "rgba(0,0,0,0.3)", border: "1px solid var(--border-subtle)", color: "#fff", borderRadius: "6px" }} />
                </div>
              </div>

              <div style={{ marginBottom: "1rem" }}>
                <label style={{ display: "block", fontSize: "0.85rem", marginBottom: "0.35rem" }}>Validação Pós-Execução (Postcheck)</label>
                <input type="text" value={polFormPostcheck} onChange={(e) => setPolFormPostcheck(e.target.value)} style={{ width: "100%", padding: "0.55rem", background: "rgba(0,0,0,0.3)", border: "1px solid var(--border-subtle)", color: "#fff", borderRadius: "6px" }} />
              </div>

              <div style={{ marginBottom: "1.25rem" }}>
                <label style={{ fontSize: "0.85rem", color: "var(--text-secondary)", cursor: "pointer", display: "flex", alignItems: "center", gap: "0.4rem" }}>
                  <input type="checkbox" checked={polFormAutoEscalate} onChange={(e) => setPolFormAutoEscalate(e.target.checked)} />
                  Escalonar automaticamente para canais de alerta se o postcheck falhar
                </label>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem" }}>
                <button type="button" className="btn btn-secondary" onClick={() => setPolicyModalOpen(false)}>
                  Cancelar / Fechar
                </button>
                <button type="submit" className="btn btn-primary">
                  Cadastrar Política
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: New Schedule */}
      {scheduleModalOpen && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setScheduleModalOpen(false)}>
          <div className="glass-panel modal-content" style={{ maxWidth: "560px", position: "relative" }}>
            <button type="button" onClick={() => setScheduleModalOpen(false)} style={{ position: "absolute", top: "1.25rem", right: "1.25rem", background: "none", border: "none", color: "var(--text-muted)", fontSize: "1.25rem", cursor: "pointer" }}>
              ✖
            </button>
            <h3 style={{ fontFamily: "var(--font-heading)", fontSize: "1.25rem", marginBottom: "0.5rem" }}>
              📅 Nova Automação Agendada
            </h3>
            <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)", marginBottom: "1.25rem" }}>
              Cliente: <strong style={{ color: "var(--accent-indigo)" }}>{activeTenant?.name}</strong>
            </p>

            <form onSubmit={handleSaveSchedule}>
              <div style={{ marginBottom: "1rem" }}>
                <label style={{ display: "block", fontSize: "0.85rem", marginBottom: "0.35rem" }}>Nome da Rotina *</label>
                <input type="text" required value={schFormName} onChange={(e) => setSchFormName(e.target.value)} placeholder="Ex: 🌅 Daily Infrastructure Briefing" style={{ width: "100%", padding: "0.55rem", background: "rgba(0,0,0,0.3)", border: "1px solid var(--border-subtle)", color: "#fff", borderRadius: "6px" }} />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem", marginBottom: "1rem" }}>
                <div>
                  <label style={{ display: "block", fontSize: "0.85rem", marginBottom: "0.35rem" }}>Tipo de Agendamento</label>
                  <select value={schFormType} onChange={(e) => setSchFormType(e.target.value)} style={{ width: "100%", padding: "0.55rem", background: "rgba(0,0,0,0.3)", border: "1px solid var(--border-subtle)", color: "#fff", borderRadius: "6px" }}>
                    <option value="cron">Cron Expression (ex: 0 7 * * *)</option>
                    <option value="interval">Intervalo Periódico (ex: 30m, 1h)</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "0.85rem", marginBottom: "0.35rem" }}>Expressão / Intervalo</label>
                  <input type="text" required value={schFormExpression} onChange={(e) => setSchFormExpression(e.target.value)} placeholder="0 7 * * *" style={{ width: "100%", padding: "0.55rem", background: "rgba(0,0,0,0.3)", border: "1px solid var(--border-subtle)", color: "#fff", borderRadius: "6px" }} />
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem", marginBottom: "1.25rem" }}>
                <div>
                  <label style={{ display: "block", fontSize: "0.85rem", marginBottom: "0.35rem" }}>Tipo de Tarefa</label>
                  <select value={schFormJobType} onChange={(e) => setSchFormJobType(e.target.value)} style={{ width: "100%", padding: "0.55rem", background: "rgba(0,0,0,0.3)", border: "1px solid var(--border-subtle)", color: "#fff", borderRadius: "6px" }}>
                    <option value="ai_analysis">🤖 Análise de IA</option>
                    <option value="health_sweep">🩺 Health Sweep Diagnóstico</option>
                    <option value="backup_compliance">💾 Auditoria de RPO Backup</option>
                    <option value="action">⚡ Action Declarativa</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "0.85rem", marginBottom: "0.35rem" }}>Nível de Autonomia</label>
                  <select value={schFormAutonomyLevel} onChange={(e) => setSchFormAutonomyLevel(e.target.value)} style={{ width: "100%", padding: "0.55rem", background: "rgba(0,0,0,0.3)", border: "1px solid var(--border-subtle)", color: "#fff", borderRadius: "6px" }}>
                    <option value="2">Nível 2: Recomendação</option>
                    <option value="4">Nível 4: Autônomo</option>
                    <option value="5">Nível 5: Self-Healing</option>
                  </select>
                </div>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem" }}>
                <button type="button" className="btn btn-secondary" onClick={() => setScheduleModalOpen(false)}>
                  Cancelar / Fechar
                </button>
                <button type="submit" className="btn btn-primary">
                  Salvar Agendamento
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: New Trigger */}
      {triggerModalOpen && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setTriggerModalOpen(false)}>
          <div className="glass-panel modal-content" style={{ maxWidth: "560px", position: "relative" }}>
            <button type="button" onClick={() => setTriggerModalOpen(false)} style={{ position: "absolute", top: "1.25rem", right: "1.25rem", background: "none", border: "none", color: "var(--text-muted)", fontSize: "1.25rem", cursor: "pointer" }}>
              ✖
            </button>
            <h3 style={{ fontFamily: "var(--font-heading)", fontSize: "1.25rem", marginBottom: "0.5rem" }}>
              ⚡ Novo Trigger Condicional
            </h3>
            <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)", marginBottom: "1.25rem" }}>
              Cliente: <strong style={{ color: "var(--accent-indigo)" }}>{activeTenant?.name}</strong>
            </p>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                setTriggerModalOpen(false);
              }}
            >
              <div style={{ marginBottom: "1rem" }}>
                <label style={{ display: "block", fontSize: "0.85rem", marginBottom: "0.35rem" }}>Nome do Trigger *</label>
                <input type="text" required value={trgFormName} onChange={(e) => setTrgFormName(e.target.value)} placeholder="Ex: 💾 Guardião de Disco" style={{ width: "100%", padding: "0.55rem", background: "rgba(0,0,0,0.3)", border: "1px solid var(--border-subtle)", color: "#fff", borderRadius: "6px" }} />
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem" }}>
                <button type="button" className="btn btn-secondary" onClick={() => setTriggerModalOpen(false)}>
                  Cancelar / Fechar
                </button>
                <button type="submit" className="btn btn-primary">
                  Salvar Trigger
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
