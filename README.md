# InfraOps AI

> **Infraestrutura sob controle. Inteligência para agir.**

InfraOps AI é uma plataforma de Governança e Operações Inteligentes de Infraestrutura de TI (AIOps) orientada a empresas de suporte, MSPs e equipes que administram múltiplos ambientes, unificando monitoramento, saúde de backups, prevenção de incidentes, portal do cliente e operação assistida por IA sob um rigoroso **Policy Engine**.

## 🟢 Produção atual

- Ambiente: `https://infraopsai.awecloudsolution.com`
- Roadmap original: **20/20 etapas concluídas**.
- Segurança: regras não negociáveis de `AGENTS.md` permanecem válidas.
- Produção atual inclui IA multiprovedor, agents, multi-tenancy, alertas, Backup Engine, Action Framework, Policy Engine, RBAC, auditabilidade e integrações de infraestrutura.

## 🟡 Próxima geração planejada — Autonomous Infrastructure Operations

O roadmap foi estendido com as etapas 21–24:

1. **Autonomous Scheduler & Automation Engine** — schedules, recorrência, briefing periódico e runbooks.
2. **Conditional Triggers & Event Automation** — reação a telemetria, backup, health e eventos.
3. **Autonomous Policies & Self-Healing** — remediação governada em cenários homologados.
4. **Goal-Oriented Infrastructure Management** — objetivos contínuos, como RPO, espaço livre e disponibilidade.

> Essas capacidades estão **documentadas como PLANNED** e não devem ser comunicadas como implementadas até que seus respectivos gates técnicos estejam concluídos.

## Princípio de autonomia

```text
INICIATIVA ≠ PRIVILÉGIO
```

O InfraOps AI poderá iniciar análises e workflows automaticamente, mas nunca:

- executar shell arbitrário;
- ampliar sua própria permissão;
- ignorar `DENY`;
- contornar approvals;
- ultrapassar tenant scope;
- executar Action não registrada.

Fluxo:

```text
Schedule / Trigger / Goal
↓
Context / Evidence
↓
AI Analyzer / Rule Engine
↓
Policy Engine
↓
Action Registry
↓
Approval quando exigido
↓
Precheck → Execute → Postcheck
↓
Audit → Notification
```

## Stack atual

| Camada | Tecnologia |
|---|---|
| Frontend | React + Vite |
| Backend | Node.js / TypeScript + REST + SSE |
| Agent Linux | Go |
| Agent Windows | PowerShell Service |
| Banco | PostgreSQL + store operacional persistente |
| Storage | S3 / MinIO |
| Observabilidade | Prometheus + OpenTelemetry |
| Deploy | Docker Swarm + Portainer + Traefik |

## Documentação relacionada

- `docs/00-project/ROADMAP.md`
- `docs/01-architecture/adr/ADR-016-autonomous-operations.md`
- `docs/06-product/AUTONOMOUS_OPERATIONS.md`
- `docs/06-product/FEATURES.md`
- `docs/08-marketing/MARKETING_CONCEPTS_SUMMARY.md`
- `docs/08-marketing/sales/SALES_PITCH_AND_VALUE_PROPOSITION.md`
