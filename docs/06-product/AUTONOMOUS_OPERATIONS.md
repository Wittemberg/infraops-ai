# Autonomous Operations — Especificação de Produto

## Visão

A camada de Autonomous Operations transforma o InfraOps AI de uma plataforma que **observa, explica e executa sob demanda** em uma plataforma capaz de **acompanhar objetivos, iniciar análises e executar rotinas governadas por conta própria**.

O objetivo não é remover o controle humano. É deslocar o humano da execução repetitiva para a definição de políticas, limites e objetivos.

## 1. Scheduler Engine

### Funções

- execução one-shot futura;
- cron;
- recorrência por intervalo;
- timezone por tenant;
- início/fim de validade;
- pausa/retomada;
- skip durante manutenção;
- catch-up configurável;
- limite de concorrência;
- jitter opcional para distribuir carga;
- histórico de runs.

### Targets

- tenant;
- site;
- grupo/tag;
- node;
- workload;
- storage;
- backup policy.

### Tipos de job

- Action determinística;
- análise por IA;
- relatório;
- health sweep;
- backup compliance sweep;
- capacity forecast;
- runbook.

## 2. Conditional/Event Automation

### Fontes de trigger

- Prometheus/telemetria;
- heartbeat/agent;
- Backup Engine;
- alerts/incidents;
- Proxmox/Virtualizor events;
- webhook;
- job result;
- audit/security event.

### Condições

Exemplos:

```text
disk.used_percent > 85 for 15m
backup.last_valid_age > policy.max_age
agent.offline for 5m
service.status == failed
storage.free_bytes < 100GB
```

### Proteções

- hysteresis;
- debounce;
- cooldown;
- dedup fingerprint;
- max triggers/hour;
- incident correlation;
- circuit breaker.

## 3. Níveis de autonomia

0. Observe
1. Analyze
2. Recommend
3. Approval
4. Autonomous
5. Self-Healing

O nível efetivo é sempre o menor permitido pela interseção de usuário/tenant/node/action/AI/policy.

## 4. Self-Healing

Self-Healing é permitido apenas para cenários previamente definidos e testados.

Exemplo:

```text
Trigger: service nginx failed
↓
Collect evidence
↓
Check maintenance / dependencies
↓
Policy permits service.restart
↓
Precheck
↓
Restart
↓
Postcheck HTTP/port/service
↓
Success → close/annotate incident
Failure → stop automation + escalate
```

Nunca criar uma regra genérica “resolva qualquer problema automaticamente”.

## 5. Goal-Oriented Management

Um Goal descreve um resultado operacional contínuo.

Exemplos:

- manter ao menos 20% de espaço livre;
- manter backups críticos dentro do RPO;
- manter um serviço disponível;
- manter nodes sem atualizações críticas acima de X dias;
- manter storage abaixo de limite seguro.

### Goal schema conceitual

```json
{
  "name": "Maintain free disk",
  "scope": {"tag": "production"},
  "objective": {"metric": "disk.free_percent", "operator": ">=", "value": 20},
  "evaluationInterval": "15m",
  "autonomyLevel": 3,
  "allowedActions": ["storage.analyze", "backup.cleanup"],
  "riskBudget": {"maxActionsPerDay": 4}
}
```

## 6. UX

Nova área: **Automations**.

Abas:

- Schedules;
- Triggers;
- Policies;
- Goals;
- Runs;
- Self-Healing;
- Audit.

Cada automação deve mostrar claramente:

- escopo;
- próximo run;
- nível de autonomia;
- actions autorizadas;
- necessidade de approval;
- último resultado;
- incidentes relacionados;
- custo/uso de IA quando aplicável.

## 7. Exemplos de automação

### Daily Infrastructure Brief
07:00 diariamente → analisar nodes, backups, alerts e capacity → notificar somente se houver exceções relevantes.

### Disk Guardian
A cada 15 min → detectar storage >85% → analisar crescimento → nível 2 recomenda limpeza; >92% e policy nível 4 pode executar somente `backup.cleanup` dentro de Safe Retention.

### Backup Guardian
Após janela de backup → avaliar expectativas → investigar missing/failed → abrir incidente e, se autorizado, executar retry por Action segura.

### Patch Advisor
Semanal → levantar pacotes críticos → gerar plano → nível 3 aguarda approval para upgrade.

## 8. Critérios de aceite

- automação não duplica run;
- isolamento de tenant comprovado;
- timezone correto;
- trigger não flappa;
- `DENY` interrompe execução;
- approval expirado não é reaproveitado;
- auditoria reconstrói todo o fluxo;
- indisponibilidade do LLM não impede checks determinísticos;
- circuit breaker interrompe loop de remediação;
- Actions destrutivas continuam protegidas.
