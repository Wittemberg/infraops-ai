# Roadmap — InfraOps AI

> **Estado atual:** Etapas 1–20 concluídas e plataforma em produção.  
> **Próxima geração planejada:** Etapas 21–24 — Autonomous Infrastructure Operations.

## Etapas 1–20 — Base concluída

As etapas originais entregaram fundação, multi-tenancy, agents, observabilidade, Action Framework, Policy Engine, auditoria, integrações Proxmox/Virtualizor, Backup Engine, IA, frontend, alertas, deploy e hardening operacional.

O histórico detalhado permanece em `docs/00-project/PROGRESS_REPORT_AND_CHANGELOG.md` e `docs/02-implementation/`.

---

## Etapa 21 — Autonomous Scheduler & Automation Engine — PLANNED

### Objetivo
Permitir execução futura e recorrente de análises, relatórios, runbooks e Actions governadas.

### Entregas
- one-shot schedule;
- cron e intervalos;
- timezone por tenant;
- pause/resume;
- histórico de runs;
- retry/idempotência;
- concorrência controlada;
- maintenance windows;
- target por tenant/site/tag/node/workload/storage;
- IA opcional por schedule;
- notificações por resultado/exceção.

### Casos iniciais
- análise diária de disco;
- sweep de CPU/RAM/load;
- revisão semanal de backups;
- relatório matinal de exceções;
- Patch Advisor periódico.

### Gate
Schedules devem executar sem duplicidade, respeitando tenant scope, Policy Engine, locks, approvals e audit.

---

## Etapa 22 — Conditional Triggers & Event Automation — PLANNED

### Objetivo
Disparar análises/workflows quando condições reais de infraestrutura ocorrerem.

### Entregas
- triggers de telemetria;
- triggers de heartbeat;
- triggers do Backup Engine;
- triggers de alert/incidente;
- triggers por webhook/evento;
- debounce;
- cooldown;
- hysteresis;
- deduplicação;
- circuit breaker;
- correlação de incidentes.

### Exemplos
- disk >85% por 15 min;
- node offline por 5 min;
- backup fora do RPO;
- serviço failed;
- storage abaixo de X GB livres.

### Gate
Nenhum trigger pode gerar storm de jobs nem cruzar tenant. Flapping deve ser controlado.

---

## Etapa 23 — Autonomous Policies & Self-Healing — PLANNED

### Objetivo
Permitir remediação automática, previamente autorizada e verificável para cenários conhecidos.

### Níveis
0. Observe
1. Analyze
2. Recommend
3. Approval
4. Autonomous
5. Self-Healing

### Entregas
- autonomy policy por tenant/node/action;
- risk budget;
- max actions/time-window;
- evidence threshold;
- automatic escalation;
- rollback quando suportado;
- postcheck obrigatório;
- self-healing runbooks;
- falha → stop + escalate.

### Gate
Um cenário homologado deve percorrer `trigger → evidence → policy → action → postcheck → audit` sem intervenção, apenas quando explicitamente autorizado.

---

## Etapa 24 — Goal-Oriented Infrastructure Management — PLANNED

### Objetivo
Permitir objetivos contínuos declarativos, em vez de apenas schedules e regras pontuais.

### Exemplos
- manter nodes com ≥20% de espaço livre;
- manter workloads críticos dentro do RPO;
- manter serviço X disponível;
- impedir acúmulo de patches críticos além de prazo definido.

### Entregas
- Goal model;
- evaluation loop;
- allowed Actions;
- autonomy level;
- risk/cost budget;
- evidence/history;
- goal health;
- drift detection;
- explicação de decisões.

### Gate
O sistema deve manter um objetivo de teste continuamente sem extrapolar policy, escopo ou orçamento de risco.

---

## Fluxo obrigatório de autonomia

```text
Scheduler / Trigger / Goal
        ↓
Context Builder
        ↓
Rule Engine / AI Analyzer
        ↓
Plan
        ↓
Policy Engine
        ↓
Action Registry
        ↓
Approval (quando exigido)
        ↓
Resource Lock
        ↓
Precheck
        ↓
Execute
        ↓
Postcheck
        ↓
Audit Hash Chain
        ↓
Notify / Report
```

## Definition of Done

Nenhuma etapa autônoma estará concluída sem:

- testes de idempotência;
- tenant isolation;
- policy enforcement;
- auditabilidade;
- anti-loop/circuit breaker;
- limites de frequência;
- observabilidade da automação;
- fallback quando IA estiver indisponível;
- documentação de segurança;
- testes de prompt injection quando houver LLM no fluxo.
