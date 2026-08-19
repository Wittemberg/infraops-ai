# InfraOps AI

> **Infraestrutura sob controle. Inteligência para agir.**

InfraOps AI é uma plataforma completa de Governança e Operações Autônomas de Infraestrutura de TI (AIOps) orientada a empresas de suporte, MSPs e equipes que administram múltiplos ambientes, unificando monitoramento, saúde de backups, prevenção de incidentes, automação autônoma governada, gestão contínua de SLOs, portal do cliente e operação assistida por IA sob um rigoroso **Policy Engine**.

## 🟢 Produção Atual

- **Ambiente Oficial:** `https://infraopsai.awecloudsolution.com`
- **Status do Roadmap:** **24/24 Etapas Concluídas (100%) + Módulos Especiais Homologados**.
- **Segurança:** Todas as regras não-negociáveis do `AGENTS.md` e ADRs permanecem 100% ativas.
- **Recursos em Produção:**
  - 🤖 **IA Contextual Multi-Provedor:** Groq Cloud, OpenAI, DeepSeek, Claude e Ollama local com validação upstream de chaves ao vivo (`🟢 CHAVE ATIVA`).
  - ⏰ **Autonomous Scheduler & Automation Engine (Etapa 21):** Agendamentos Cron/Intervalo, presets diários de briefing, health sweep e auditoria de backups.
  - ⚡ **Conditional Triggers & Event Automation (Etapa 22):** Gatilhos orientados a telemetria com proteção anti-flapping (Debounce, Cooldown, Circuit Breaker e Deduplicação SHA-256).
  - 🛡️ **Autonomous Policies & Self-Healing (Etapa 23):** Matriz de autonomia Níveis 0 a 5, prechecks, postchecks, orçamentos de risco (*Risk Budget*) e auto-escalonamento para canais de alerta.
  - 🎯 **Goal-Oriented Infrastructure Management (Etapa 24):** Definição declarativa de metas e SLOs contínuos (Storage $\ge$ 20%, Backup RPO $\le$ 24h, Uptime $\ge$ 99.9%) com medidores visuais de conformidade (*Compliance Gauges*).
  - ⚡ **Catálogo de Actions & Governança Operacional:** Contratos declarativos de Actions tipadas (Precheck, Postcheck, Idempotência) e ajuste de nível de autonomia (1 a 5) por tenant.
  - 🔔 **Canais de Disparo Omnichannel por Tenant:** Chatwoot API (*Account API & Public API*), Quepasa WhatsApp Gateway, Telegram Bot, WhatsApp Webhook, E-mail SMTP e Webhooks HTTP com teste de disparo ao vivo.
  - 🔌 **Integrações Nativas:** Proxmox VE e Virtualizor com sincronização de nós e workloads.
  - 🛡️ **Auditoria & Criptografia:** Audit Hash Chain SHA-256 e RBAC multi-tenant estrito.

## 🔒 Princípio de Autonomia e Governança

```text
INICIATIVA ≠ PRIVILÉGIO
```

O InfraOps AI pode iniciar análises e workflows automaticamente, mas nunca:
- Executar shell arbitrário (`shell.exec`, `bash.run`);
- Ampliar seu próprio privilégio;
- Ignorar um `DENY` de política;
- Contornar aprovações humanas quando exigidas;
- Ultrapassar o escopo de isolamento do tenant;
- Executar Actions não registradas no catálogo.

### Fluxo Operacional
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
Approval (quando exigido)
↓
Precheck → Execute → Postcheck
↓
Audit (SHA-256 Hash Chain) → Notification (Chatwoot / Quepasa / Telegram)
```

## 🛠️ Stack Tecnológica

| Camada | Tecnologia |
|---|---|
| Frontend | React + Vite (Glassmorphism, Dark/Light Mode, Tailwind/Vanilla CSS) |
| Backend | Node.js / TypeScript + REST + Server-Sent Events |
| Agent Linux | Golang (mTLS Outbound) |
| Agent Windows | PowerShell Background Service |
| Banco de Dados | PostgreSQL + DataStore Operacional Persistente em Volume |
| Observabilidade | Prometheus + OpenTelemetry |
| Disparo de Alertas | Chatwoot API, Quepasa WhatsApp API, Telegram, SMTP, Webhooks |
| Deploy & CI/CD | GitHub Actions + Docker Swarm + Portainer + Traefik SSL |

## 📚 Documentação Relacionada

- `docs/00-project/ROADMAP.md`
- `docs/00-project/PROGRESS_REPORT_AND_CHANGELOG.md`
- `docs/00-project/PROJECT_OVERVIEW.md`
- `docs/01-architecture/adr/ADR-016-autonomous-operations.md`
- `docs/06-product/AUTONOMOUS_OPERATIONS.md`
- `docs/06-product/FEATURES.md`
- `docs/08-marketing/sales/SALES_PITCH_AND_VALUE_PROPOSITION.md`
