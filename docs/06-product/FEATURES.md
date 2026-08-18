# Features — InfraOps AI

> Regra: separar claramente **implemented**, **in progress**, **planned** e **deferred**. Não anunciar como existente uma capacidade apenas documentada.

## Implemented / Production

- multi-tenancy;
- RBAC;
- portal/visões por tenant;
- Agent Linux Go;
- instalação Windows;
- heartbeat e inventory;
- monitoramento de CPU/RAM/disk/uptime;
- Proxmox VE;
- Virtualizor;
- servidores standalone/on-prem/cloud;
- Backup Engine;
- Safe Retention;
- Action Framework;
- Policy Engine;
- approvals;
- resource locks;
- audit hash chain;
- secret isolation/encryption;
- IA multiprovedor;
- alertas multicanal;
- deploy Docker Swarm/Portainer/Traefik;
- observabilidade Prometheus/OpenTelemetry.

## Planned — Autonomous Infrastructure Operations

### Scheduler & Recurrence
- one-shot scheduling;
- cron;
- interval schedules;
- timezone por tenant;
- maintenance windows;
- pause/resume;
- run history;
- retry/idempotency;
- target por tenant/site/tag/node/workload/storage.

### Recurring AI Analysis
- Daily Infrastructure Brief;
- disk/capacity analysis;
- telemetry health sweep;
- backup compliance review;
- patch/security advisor;
- exception-only reports.

### Conditional Triggers
- thresholds sustentados;
- heartbeat/offline;
- backup missing/failed;
- service failure;
- incident events;
- webhook events;
- cooldown/hysteresis/debounce;
- dedup/circuit breaker.

### Autonomy Levels
- Level 0 — Observe;
- Level 1 — Analyze;
- Level 2 — Recommend;
- Level 3 — Approval;
- Level 4 — Autonomous;
- Level 5 — Self-Healing.

### Self-Healing
- runbooks homologados;
- automatic evidence collection;
- policy-bound remediation;
- postcheck validation;
- rollback quando suportado;
- automatic escalation on failure.

### Goal-Oriented Operations
- continuous Goals;
- objective health/drift;
- allowed Actions;
- risk budget;
- action budget;
- evidence/history;
- explainable decisions.

## Deferred / Future Research

- autonomia crítica irrestrita;
- criação dinâmica de shell/commands por LLM;
- autoalteração de RBAC/policies pela IA;
- self-modifying Action code;
- execução destrutiva sem safeguards.

Esses itens permanecem fora do produto por princípio de segurança, salvo futura decisão arquitetural explícita.
