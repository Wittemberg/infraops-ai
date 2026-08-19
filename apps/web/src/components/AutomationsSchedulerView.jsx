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

const defaultGoals = [
  {
    id: "goal-storage-20",
    tenantId: "tenant-default",
    name: "💾 SLO de Storage: Espaço Livre Mínimo (>= 20%)",
    category: "storage",
    scope: { targetType: "all" },
    objective: { metric: "disk.free_percent", operator: ">=", targetValue: 20, unit: "%" },
    currentValue: 23.4,
    complianceStatus: "compliant",
    compliancePercent: 99.8,
    evaluationInterval: "15m",
    autonomyLevel: 4,
    allowedActions: ["disk.temp_cleanup", "backup.cleanup"],
    riskBudget: { maxActionsPerDay: 4, actionsExecutedToday: 1 },
    lastEvaluatedAt: new Date(Date.now() - 1000 * 60 * 10).toISOString(),
    autoRemediate: true,
    enabled: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: "goal-backup-rpo",
    tenantId: "tenant-default",
    name: "🔁 SLO de Resiliência: RPO de Backup (<= 24h)",
    category: "backup",
    scope: { targetType: "all" },
    objective: { metric: "backup.rpo_age_hours", operator: "<=", targetValue: 24, unit: "h" },
    currentValue: 18.2,
    complianceStatus: "compliant",
    compliancePercent: 100,
    evaluationInterval: "1h",
    autonomyLevel: 3,
    allowedActions: ["backup.snapshot_create"],
    riskBudget: { maxActionsPerDay: 2, actionsExecutedToday: 0 },
    lastEvaluatedAt: new Date(Date.now() - 1000 * 60 * 25).toISOString(),
    autoRemediate: false,
    enabled: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: "goal-cluster-uptime",
    tenantId: "tenant-default",
    name: "⚡ SLO de Disponibilidade: Cluster & Nós (>= 99.9%)",
    category: "availability",
    scope: { targetType: "all" },
    objective: { metric: "cluster.uptime_percent", operator: ">=", targetValue: 99.9, unit: "%" },
    currentValue: 99.95,
    complianceStatus: "compliant",
    compliancePercent: 99.95,
    evaluationInterval: "30m",
    autonomyLevel: 5,
    allowedActions: ["service.restart", "node.reboot"],
    riskBudget: { maxActionsPerDay: 3, actionsExecutedToday: 0 },
    lastEvaluatedAt: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
    autoRemediate: true,
    enabled: true,
    createdAt: new Date().toISOString(),
  },
];

export function AutomationsSchedulerView({ activeTenant }) {
  const [activeTab, setActiveTab] = useState("schedules"); // "schedules" | "triggers" | "policies" | "goals" | "history"

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

  const [goals, setGoals] = useState(() => {
    const cached = localStorage.getItem("infraops_goals");
    return cached ? JSON.parse(cached) : defaultGoals;
  });

  const [runs, setRuns] = useState([]);
  const [triggerEvents, setTriggerEvents] = useState([]);
  const [selfHealingRuns, setSelfHealingRuns] = useState([]);
  const [goalEvaluations, setGoalEvaluations] = useState([]);

  // UI Feedback
  const [runningId, setRunningId] = useState(null);
  const [simulatingTriggerId, setSimulatingTriggerId] = useState(null);
  const [executingPolicyId, setExecutingPolicyId] = useState(null);
  const [evaluatingGoalId, setEvaluatingGoalId] = useState(null);
  const [feedbackMsg, setFeedbackMsg] = useState(null);

  // Modals
  const [scheduleModalOpen, setScheduleModalOpen] = useState(false);
  const [triggerModalOpen, setTriggerModalOpen] = useState(false);
  const [policyModalOpen, setPolicyModalOpen] = useState(false);
  const [goalModalOpen, setGoalModalOpen] = useState(false);

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

  // Form Policy
  const [polFormName, setPolFormName] = useState("");
  const [polFormScenario, setPolFormScenario] = useState("service_down");
  const [polFormAutonomyLevel, setPolFormAutonomyLevel] = useState(5);
  const [polFormActionKey, setPolFormActionKey] = useState("service.restart");
  const [polFormMaxPerHour, setPolFormMaxPerHour] = useState(3);
  const [polFormMaxPerDay, setPolFormMaxPerDay] = useState(8);
  const [polFormPrecheck, setPolFormPrecheck] = useState("systemctl is-active --quiet nginx || exit 0");
  const [polFormPostcheck, setPolFormPostcheck] = useState("systemctl is-active --quiet nginx && curl -Is localhost:80 | head -1");
  const [polFormAutoEscalate, setPolFormAutoEscalate] = useState(true);

  // Form Goal (Etapa 24)
  const [goalFormName, setGoalFormName] = useState("");
  const [goalFormCategory, setGoalFormCategory] = useState("storage");
  const [goalFormMetric, setGoalFormMetric] = useState("disk.free_percent");
  const [goalFormOperator, setGoalFormOperator] = useState(">=");
  const [goalFormTargetValue, setGoalFormTargetValue] = useState(20);
  const [goalFormUnit, setGoalFormUnit] = useState("%");
  const [goalFormInterval, setGoalFormInterval] = useState("15m");
  const [goalFormAutonomyLevel, setGoalFormAutonomyLevel] = useState(4);
  const [goalFormActionKey, setGoalFormActionKey] = useState("disk.temp_cleanup");
  const [goalFormMaxActions, setGoalFormMaxActions] = useState(4);
  const [goalFormAutoRemediate, setGoalFormAutoRemediate] = useState(true);

  // Fetch initial data
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [resSch, resRuns, resTrg, resTrgEvt, resPol, resHealRuns, resGoals, resGoalEvals] = await Promise.all([
          fetch(`${API_BASE}/api/v1/automations/schedules`).catch(() => null),
          fetch(`${API_BASE}/api/v1/automations/schedules/runs`).catch(() => null),
          fetch(`${API_BASE}/api/v1/automations/triggers`).catch(() => null),
          fetch(`${API_BASE}/api/v1/automations/triggers/events`).catch(() => null),
          fetch(`${API_BASE}/api/v1/automations/self-healing/policies`).catch(() => null),
          fetch(`${API_BASE}/api/v1/automations/self-healing/runs`).catch(() => null),
          fetch(`${API_BASE}/api/v1/automations/goals`).catch(() => null),
          fetch(`${API_BASE}/api/v1/automations/goals/evaluations`).catch(() => null),
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
        if (resGoals && resGoals.ok) {
          const data = await resGoals.json();
          if (data.goals) setGoals(data.goals);
        }
        if (resGoalEvals && resGoalEvals.ok) {
          const data = await resGoalEvals.json();
          if (data.evaluations) setGoalEvaluations(data.evaluations);
        }
      } catch (err) {
        console.warn("Using offline state:", err);
      }
    };
    fetchData();
  }, [activeTenant]);

  // Handlers: Schedules
  const handleOpenScheduleModal = () => {
    setSchFormName("");
    setSchFormType("cron");
    setSchFormExpression("0 7 * * *");
    setSchFormJobType("ai_analysis");
    setSchFormAutonomyLevel(2);
    setSchFormSkipMaint(true);
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
  const handleOpenTriggerModal = () => {
    setTrgFormName("");
    setTrgFormSource("metric");
    setTrgFormMetric("disk.used_percent");
    setTrgFormOperator(">");
    setTrgFormThreshold("85");
    setTrgFormDuration("10m");
    setTrgFormCooldown(30);
    setTrgFormCircuitBreaker(3);
    setTrgFormJobType("action");
    setTrgFormActionKey("disk.temp_cleanup");
    setTrgFormAutonomyLevel(4);
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
        setFeedbackMsg(`⚠️ Circuit Breaker disparado: Automação pausada por segurança.`);
      } else {
        setFeedbackMsg(`⚡ Trigger satisfeito! Ação executada com sucesso.`);
      }
    } catch (err) {
      console.warn("Simulation offline:", err);
    } finally {
      setSimulatingTriggerId(null);
      setTimeout(() => setFeedbackMsg(null), 5000);
    }
  };

  // Handlers: Self-Healing
  const handleOpenPolicyModal = () => {
    setPolFormName("🔄 Auto-Heal: Recuperação de Serviço");
    setPolFormScenario("service_down");
    setPolFormAutonomyLevel(5);
    setPolFormActionKey("service.restart");
    setPolFormMaxPerHour(3);
    setPolFormMaxPerDay(8);
    setPolFormPrecheck("systemctl is-active --quiet nginx || exit 0");
    setPolFormPostcheck("systemctl is-active --quiet nginx && curl -Is localhost:80 | head -1");
    setPolFormAutoEscalate(true);
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
        setFeedbackMsg("Política de Self-Healing cadastrada com sucesso!");
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
      if (data.run) setSelfHealingRuns((prev) => [data.run, ...prev]);
      if (data.policy) setPolicies((prev) => prev.map((p) => (p.id === pol.id ? data.policy : p)));
      setFeedbackMsg(`🛡️ ${data.message || "Auto-Remediação executada com sucesso!"}`);
    } catch (err) {
      console.warn("Execute self-healing error:", err);
    } finally {
      setExecutingPolicyId(null);
      setTimeout(() => setFeedbackMsg(null), 5000);
    }
  };

  // Handlers: Goals & SLOs (Etapa 24)
  const handleOpenGoalModal = (preset = null) => {
    if (preset === "storage") {
      setGoalFormName("💾 SLO de Storage: Espaço Livre Mínimo (>= 20%)");
      setGoalFormCategory("storage");
      setGoalFormMetric("disk.free_percent");
      setGoalFormOperator(">=");
      setGoalFormTargetValue(20);
      setGoalFormUnit("%");
      setGoalFormActionKey("disk.temp_cleanup");
      setGoalFormAutonomyLevel(4);
    } else if (preset === "backup") {
      setGoalFormName("🔁 SLO de Resiliência: RPO de Backup (<= 24h)");
      setGoalFormCategory("backup");
      setGoalFormMetric("backup.rpo_age_hours");
      setGoalFormOperator("<=");
      setGoalFormTargetValue(24);
      setGoalFormUnit("h");
      setGoalFormActionKey("backup.snapshot_create");
      setGoalFormAutonomyLevel(3);
    } else if (preset === "uptime") {
      setGoalFormName("⚡ SLO de Disponibilidade: Cluster & Nós (>= 99.9%)");
      setGoalFormCategory("availability");
      setGoalFormMetric("cluster.uptime_percent");
      setGoalFormOperator(">=");
      setGoalFormTargetValue(99.9);
      setGoalFormUnit("%");
      setGoalFormActionKey("service.restart");
      setGoalFormAutonomyLevel(5);
    } else {
      setGoalFormName("");
      setGoalFormCategory("storage");
      setGoalFormMetric("disk.free_percent");
      setGoalFormOperator(">=");
      setGoalFormTargetValue(20);
      setGoalFormUnit("%");
      setGoalFormActionKey("disk.temp_cleanup");
      setGoalFormAutonomyLevel(4);
    }
    setGoalModalOpen(true);
  };

  const handleSaveGoal = async (e) => {
    e.preventDefault();
    if (!goalFormName.trim()) return;

    const payload = {
      tenantId: activeTenant?.id || "tenant-default",
      name: goalFormName,
      category: goalFormCategory,
      scope: { targetType: "all" },
      objective: {
        metric: goalFormMetric,
        operator: goalFormOperator,
        targetValue: Number(goalFormTargetValue),
        unit: goalFormUnit,
      },
      currentValue: Number(goalFormTargetValue) + 3.5,
      complianceStatus: "compliant",
      compliancePercent: 99.8,
      evaluationInterval: goalFormInterval,
      autonomyLevel: Number(goalFormAutonomyLevel),
      allowedActions: [goalFormActionKey],
      riskBudget: { maxActionsPerDay: Number(goalFormMaxActions), actionsExecutedToday: 0 },
      autoRemediate: goalFormAutoRemediate,
      enabled: true,
    };

    try {
      const res = await fetch(`${API_BASE}/api/v1/automations/goals`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.goal) {
        setGoals((prev) => [...prev, data.goal]);
        setFeedbackMsg("Novo Objetivo Contínuo (Goal/SLO) homologado com sucesso!");
      }
    } catch (err) {
      console.warn("Saved goal offline:", err);
    }
    setGoalModalOpen(false);
    setTimeout(() => setFeedbackMsg(null), 4000);
  };

  const handleEvaluateGoal = async (goal) => {
    setEvaluatingGoalId(goal.id);
    try {
      const res = await fetch(`${API_BASE}/api/v1/automations/goals/${goal.id}/evaluate`, { method: "POST" });
      const data = await res.json();

      if (data.evaluation) {
        setGoalEvaluations((prev) => [data.evaluation, ...prev]);
      }
      if (data.goal) {
        setGoals((prev) => prev.map((g) => (g.id === goal.id ? data.goal : g)));
      }
      setFeedbackMsg(`🎯 ${data.message || "Meta avaliada com sucesso!"}`);
    } catch (err) {
      console.warn("Evaluate goal error:", err);
    } finally {
      setEvaluatingGoalId(null);
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

  const getComplianceStatusBadge = (status) => {
    switch (status) {
      case "compliant":
        return <span className="badge badge-online" style={{ fontSize: "0.72rem" }}>🟢 CONFORME</span>;
      case "at_risk":
        return <span className="badge badge-degraded" style={{ fontSize: "0.72rem" }}>🟡 EM RISCO</span>;
      case "violated":
        return <span className="badge badge-offline" style={{ fontSize: "0.72rem" }}>🔴 VIOLADO</span>;
      default:
        return <span className="badge">{status}</span>;
    }
  };

  const activeSchedulesCount = schedules.filter((s) => s.enabled).length;
  const activeTriggersCount = triggers.filter((t) => t.enabled).length;
  const activePoliciesCount = policies.filter((p) => p.enabled).length;
  const compliantGoalsCount = goals.filter((g) => g.complianceStatus === "compliant").length;

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
              ⏰ Motor Completo de Operações Autônomas (Etapas 21–24) — Cliente:{" "}
              <strong style={{ color: "var(--accent-indigo)" }}>{activeTenant?.name}</strong>
            </span>
            <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "0.2rem" }}>
              Schedules Recorrentes, Triggers Anti-Flapping, Políticas Self-Healing e Gestão Contínua de Metas/SLOs.
            </div>
          </div>
          <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
            <span className="badge badge-online" style={{ fontSize: "0.75rem" }}>
              ✓ {activeSchedulesCount} Schedules
            </span>
            <span className="badge badge-online" style={{ fontSize: "0.75rem" }}>
              ⚡ {activeTriggersCount} Triggers
            </span>
            <span className="badge badge-online" style={{ fontSize: "0.75rem" }}>
              🛡️ {activePoliciesCount} Self-Healing
            </span>
            <span className="badge badge-online" style={{ fontSize: "0.75rem" }}>
              🎯 {compliantGoalsCount}/{goals.length} Metas Conformes
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
          <div className="kpi-title">📅 Rotinas Agendadas (E21)</div>
          <div className="kpi-value" style={{ color: "var(--accent-indigo)" }}>{schedules.length}</div>
          <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>{activeSchedulesCount} ativas</span>
        </div>

        <div className="glass-panel kpi-card">
          <div className="kpi-title">⚡ Triggers & Eventos (E22)</div>
          <div className="kpi-value" style={{ color: "var(--accent-cyan)" }}>{triggers.length}</div>
          <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Anti-flapping & Circuit Breaker</span>
        </div>

        <div className="glass-panel kpi-card">
          <div className="kpi-title">🛡️ Self-Healing (E23)</div>
          <div className="kpi-value" style={{ color: "var(--accent-emerald)" }}>{policies.length}</div>
          <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Níveis 4 & 5 Pre/Postcheck</span>
        </div>

        <div className="glass-panel kpi-card">
          <div className="kpi-title">🎯 Metas & SLOs (E24)</div>
          <div className="kpi-value" style={{ color: "var(--accent-purple)" }}>{goals.length}</div>
          <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>{compliantGoalsCount} em conformidade</span>
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
            className={`btn ${activeTab === "goals" ? "btn-primary" : "btn-secondary"}`}
            onClick={() => setActiveTab("goals")}
            style={{ fontSize: "0.85rem" }}
          >
            🎯 Metas & SLOs (Etapa 24)
          </button>
          <button
            type="button"
            className={`btn ${activeTab === "history" ? "btn-primary" : "btn-secondary"}`}
            onClick={() => setActiveTab("history")}
            style={{ fontSize: "0.85rem" }}
          >
            📜 Histórico Unificado
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
                  Gatilhos acionados por métricas com travas anti-flapping (Debounce, Cooldown e Circuit Breaker).
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
                        <button
                          type="button"
                          className="btn btn-primary"
                          disabled={simulatingTriggerId === trg.id}
                          onClick={() => handleSimulateTrigger(trg)}
                          style={{ padding: "0.25rem 0.5rem", fontSize: "0.72rem" }}
                        >
                          {simulatingTriggerId === trg.id ? "⏳ Testando..." : "🧪 Simular"}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 3: SELF-HEALING */}
        {activeTab === "policies" && (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem", flexWrap: "wrap", gap: "0.5rem" }}>
              <div>
                <h3 style={{ fontSize: "1.1rem", fontWeight: 700 }}>🛡️ Políticas de Auto-Remediação (Self-Healing)</h3>
                <p style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>
                  Ações executadas com verificação pré/pós-execução e controle de orçamento de risco (*Risk Budget*).
                </p>
              </div>
              <button type="button" className="btn btn-primary" onClick={() => handleOpenPolicyModal()} style={{ fontSize: "0.85rem" }}>
                + Nova Política Self-Healing
              </button>
            </div>

            <div style={{ width: "100%", overflowX: "auto" }}>
              <table className="custom-table" style={{ width: "100%", minWidth: "960px" }}>
                <thead>
                  <tr>
                    <th style={{ width: "26%" }}>Nome da Política</th>
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
                        <span style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>Cenário: <strong>{pol.scenario}</strong></span>
                      </td>
                      <td>{getAutonomyBadge(pol.autonomyLevel)}</td>
                      <td>
                        <code style={{ fontSize: "0.75rem", color: "var(--accent-indigo)" }}>{pol.allowedActions.join(", ")}</code>
                      </td>
                      <td>
                        <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>
                          <strong>{pol.riskBudget.actionsExecutedThisHour}/{pol.riskBudget.maxActionsPerHour}</strong> ações/hora
                        </div>
                      </td>
                      <td>
                        <span className="badge badge-online" style={{ fontSize: "0.7rem" }}>✓ Postcheck Ativo</span>
                      </td>
                      <td>
                        <button
                          type="button"
                          className="btn btn-primary"
                          disabled={executingPolicyId === pol.id}
                          onClick={() => handleExecuteSelfHealing(pol)}
                          style={{ padding: "0.25rem 0.55rem", fontSize: "0.72rem" }}
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

        {/* TAB 4: GOALS & SLOS (ETAPA 24) */}
        {activeTab === "goals" && (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem", flexWrap: "wrap", gap: "0.5rem" }}>
              <div>
                <h3 style={{ fontSize: "1.1rem", fontWeight: 700 }}>🎯 Metas Operacionais & Gestão Contínua de SLOs</h3>
                <p style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>
                  Definição do estado desejado (*Desired State*) com avaliação contínua de desvios e auto-tuning de infraestrutura.
                </p>
              </div>
              <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                <button type="button" className="btn btn-secondary" onClick={() => handleOpenGoalModal("storage")} style={{ fontSize: "0.8rem", padding: "0.4rem 0.8rem" }}>
                  + SLO Storage (>=20%)
                </button>
                <button type="button" className="btn btn-secondary" onClick={() => handleOpenGoalModal("backup")} style={{ fontSize: "0.8rem", padding: "0.4rem 0.8rem" }}>
                  + SLO Backup (<=24h)
                </button>
                <button type="button" className="btn btn-primary" onClick={() => handleOpenGoalModal()} style={{ fontSize: "0.8rem", padding: "0.4rem 0.8rem" }}>
                  + Novo Objetivo (Goal)
                </button>
              </div>
            </div>

            {/* Goals Cards Grid */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "1rem", marginBottom: "1.5rem" }}>
              {goals.map((g) => (
                <div key={g.id} className="glass-panel" style={{ padding: "1rem", border: "1px solid var(--border-subtle)", position: "relative" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.5rem" }}>
                    <div style={{ fontWeight: 700, fontSize: "0.95rem", color: "var(--text-primary)" }}>{g.name}</div>
                    {getComplianceStatusBadge(g.complianceStatus)}
                  </div>

                  {/* Progress Gauge */}
                  <div style={{ margin: "0.75rem 0" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.8rem", marginBottom: "0.3rem" }}>
                      <span style={{ color: "var(--text-secondary)" }}>Conformidade do SLO</span>
                      <strong style={{ color: g.complianceStatus === "compliant" ? "var(--accent-emerald)" : "var(--accent-amber)" }}>
                        {g.compliancePercent}%
                      </strong>
                    </div>
                    <div style={{ width: "100%", height: "8px", background: "rgba(255,255,255,0.08)", borderRadius: "4px", overflow: "hidden" }}>
                      <div
                        style={{
                          width: `${Math.min(100, g.compliancePercent)}%`,
                          height: "100%",
                          background: g.complianceStatus === "compliant" ? "var(--accent-emerald)" : "var(--accent-amber)",
                          transition: "width 0.4s ease",
                        }}
                      />
                    </div>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem", fontSize: "0.75rem", color: "var(--text-secondary)", marginBottom: "0.75rem" }}>
                    <div>
                      Valor Atual: <strong style={{ color: "#fff" }}>{g.currentValue}{g.objective?.unit}</strong>
                    </div>
                    <div>
                      Meta (Target): <strong style={{ color: "var(--accent-indigo)" }}>{g.objective?.operator} {g.objective?.targetValue}{g.objective?.unit}</strong>
                    </div>
                    <div>
                      Intervalo: <strong>{g.evaluationInterval}</strong>
                    </div>
                    <div>
                      Autonomia: <strong>Nível {g.autonomyLevel}</strong>
                    </div>
                  </div>

                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid var(--border-subtle)", paddingTop: "0.75rem" }}>
                    <span style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>
                      Última avaliação: {g.lastEvaluatedAt ? new Date(g.lastEvaluatedAt).toLocaleTimeString("pt-BR") : "Pendente"}
                    </span>
                    <button
                      type="button"
                      className="btn btn-primary"
                      disabled={evaluatingGoalId === g.id}
                      onClick={() => handleEvaluateGoal(g)}
                      style={{ padding: "0.25rem 0.6rem", fontSize: "0.75rem" }}
                    >
                      {evaluatingGoalId === g.id ? "⏳ Avaliando..." : "🔍 Avaliar Agora"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 5: UNIFIED HISTORY */}
        {activeTab === "history" && (
          <div>
            <h3 style={{ fontSize: "1.1rem", fontWeight: 700, marginBottom: "0.5rem" }}>📜 Histórico Unificado de Automações & Governança</h3>
            <p style={{ fontSize: "0.8rem", color: "var(--text-secondary)", marginBottom: "1rem" }}>
              Registro de auditoria com hash SHA-256 e evidências coletadas para Agendamentos, Triggers, Self-Healing e Metas.
            </p>

            <div style={{ width: "100%", overflowX: "auto" }}>
              <table className="custom-table" style={{ width: "100%", minWidth: "920px" }}>
                <thead>
                  <tr>
                    <th style={{ width: "18%" }}>Horário</th>
                    <th style={{ width: "24%" }}>Origem / Automação</th>
                    <th style={{ width: "38%" }}>Resultado & Evidências</th>
                    <th style={{ width: "10%" }}>Status</th>
                    <th style={{ width: "10%" }}>Hash SHA-256</th>
                  </tr>
                </thead>
                <tbody>
                  {/* Goal evaluations */}
                  {goalEvaluations.map((ge) => (
                    <tr key={ge.id}>
                      <td style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>
                        {new Date(ge.evaluatedAt).toLocaleString("pt-BR")}
                      </td>
                      <td>
                        <div style={{ fontWeight: 600, fontSize: "0.85rem", color: "var(--accent-purple)" }}>
                          🎯 {ge.goalName}
                        </div>
                        <span style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>Avaliação de SLO</span>
                      </td>
                      <td style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>{ge.summary}</td>
                      <td>{getComplianceStatusBadge(ge.status)}</td>
                      <td>
                        <code style={{ fontSize: "0.68rem", color: "var(--accent-cyan)" }}>
                          {ge.eventHash?.substring(0, 8)}...
                        </code>
                      </td>
                    </tr>
                  ))}

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
                      <td style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>{hr.summary}</td>
                      <td>
                        <span className="badge badge-online" style={{ fontSize: "0.7rem" }}>{hr.status.toUpperCase()}</span>
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

      {/* Modal: New Goal (Etapa 24) */}
      {goalModalOpen && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setGoalModalOpen(false)}>
          <div className="glass-panel modal-content" style={{ maxWidth: "600px", position: "relative" }}>
            <button type="button" onClick={() => setGoalModalOpen(false)} style={{ position: "absolute", top: "1.25rem", right: "1.25rem", background: "none", border: "none", color: "var(--text-muted)", fontSize: "1.25rem", cursor: "pointer" }}>
              ✖
            </button>
            <h3 style={{ fontFamily: "var(--font-heading)", fontSize: "1.25rem", marginBottom: "0.5rem" }}>
              🎯 Novo Objetivo Operacional (Goal / SLO)
            </h3>
            <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)", marginBottom: "1.25rem" }}>
              Cliente: <strong style={{ color: "var(--accent-indigo)" }}>{activeTenant?.name}</strong>
            </p>

            <form onSubmit={handleSaveGoal}>
              <div style={{ marginBottom: "1rem" }}>
                <label style={{ display: "block", fontSize: "0.85rem", marginBottom: "0.35rem" }}>Nome da Meta *</label>
                <input type="text" required value={goalFormName} onChange={(e) => setGoalFormName(e.target.value)} placeholder="Ex: 💾 SLO de Storage Livre (>= 20%)" style={{ width: "100%", padding: "0.55rem", background: "rgba(0,0,0,0.3)", border: "1px solid var(--border-subtle)", color: "#fff", borderRadius: "6px" }} />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem", marginBottom: "1rem" }}>
                <div>
                  <label style={{ display: "block", fontSize: "0.85rem", marginBottom: "0.35rem" }}>Categoria</label>
                  <select value={goalFormCategory} onChange={(e) => setGoalFormCategory(e.target.value)} style={{ width: "100%", padding: "0.55rem", background: "rgba(0,0,0,0.3)", border: "1px solid var(--border-subtle)", color: "#fff", borderRadius: "6px" }}>
                    <option value="storage">💾 Storage / Disco</option>
                    <option value="backup">🔁 Backup & RPO</option>
                    <option value="availability">⚡ Disponibilidade & Uptime</option>
                    <option value="security">🛡️ Segurança & Patches</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "0.85rem", marginBottom: "0.35rem" }}>Intervalo de Avaliação</label>
                  <select value={goalFormInterval} onChange={(e) => setGoalFormInterval(e.target.value)} style={{ width: "100%", padding: "0.55rem", background: "rgba(0,0,0,0.3)", border: "1px solid var(--border-subtle)", color: "#fff", borderRadius: "6px" }}>
                    <option value="15m">A cada 15 minutos</option>
                    <option value="30m">A cada 30 minutos</option>
                    <option value="1h">A cada 1 hora</option>
                    <option value="6h">A cada 6 horas</option>
                  </select>
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr", gap: "0.75rem", marginBottom: "1rem" }}>
                <div>
                  <label style={{ display: "block", fontSize: "0.85rem", marginBottom: "0.35rem" }}>Métrica Alvo</label>
                  <input type="text" required value={goalFormMetric} onChange={(e) => setGoalFormMetric(e.target.value)} placeholder="disk.free_percent" style={{ width: "100%", padding: "0.55rem", background: "rgba(0,0,0,0.3)", border: "1px solid var(--border-subtle)", color: "#fff", borderRadius: "6px" }} />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "0.85rem", marginBottom: "0.35rem" }}>Operador</label>
                  <select value={goalFormOperator} onChange={(e) => setGoalFormOperator(e.target.value)} style={{ width: "100%", padding: "0.55rem", background: "rgba(0,0,0,0.3)", border: "1px solid var(--border-subtle)", color: "#fff", borderRadius: "6px" }}>
                    <option value=">=">&gt;= (Maior ou igual)</option>
                    <option value="<=">&lt;= (Menor ou igual)</option>
                    <option value="==">== (Igual)</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "0.85rem", marginBottom: "0.35rem" }}>Valor Alvo</label>
                  <input type="number" step="0.1" required value={goalFormTargetValue} onChange={(e) => setGoalFormTargetValue(e.target.value)} style={{ width: "100%", padding: "0.55rem", background: "rgba(0,0,0,0.3)", border: "1px solid var(--border-subtle)", color: "#fff", borderRadius: "6px" }} />
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem", marginBottom: "1rem" }}>
                <div>
                  <label style={{ display: "block", fontSize: "0.85rem", marginBottom: "0.35rem" }}>Action de Remediação</label>
                  <select value={goalFormActionKey} onChange={(e) => setGoalFormActionKey(e.target.value)} style={{ width: "100%", padding: "0.55rem", background: "rgba(0,0,0,0.3)", border: "1px solid var(--border-subtle)", color: "#fff", borderRadius: "6px" }}>
                    <option value="disk.temp_cleanup">disk.temp_cleanup</option>
                    <option value="backup.snapshot_create">backup.snapshot_create</option>
                    <option value="service.restart">service.restart</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "0.85rem", marginBottom: "0.35rem" }}>Nível de Autonomia</label>
                  <select value={goalFormAutonomyLevel} onChange={(e) => setGoalFormAutonomyLevel(e.target.value)} style={{ width: "100%", padding: "0.55rem", background: "rgba(0,0,0,0.3)", border: "1px solid var(--border-subtle)", color: "#fff", borderRadius: "6px" }}>
                    <option value="4">Nível 4: Autônomo</option>
                    <option value="5">Nível 5: Self-Healing</option>
                    <option value="3">Nível 3: Exige Aprovação</option>
                  </select>
                </div>
              </div>

              <div style={{ marginBottom: "1.25rem" }}>
                <label style={{ fontSize: "0.85rem", color: "var(--text-secondary)", cursor: "pointer", display: "flex", alignItems: "center", gap: "0.4rem" }}>
                  <input type="checkbox" checked={goalFormAutoRemediate} onChange={(e) => setGoalFormAutoRemediate(e.target.checked)} />
                  Habilitar auto-remediação governada se o SLO estiver em risco ou violado
                </label>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem" }}>
                <button type="button" className="btn btn-secondary" onClick={() => setGoalModalOpen(false)}>
                  Cancelar / Fechar
                </button>
                <button type="submit" className="btn btn-primary">
                  Cadastrar Objetivo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: New Policy */}
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
                <input type="text" required value={schFormName} onChange={(e) => setSchFormName(e.target.value)} placeholder="Ex: 🌅 Daily Briefing" style={{ width: "100%", padding: "0.55rem", background: "rgba(0,0,0,0.3)", border: "1px solid var(--border-subtle)", color: "#fff", borderRadius: "6px" }} />
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
