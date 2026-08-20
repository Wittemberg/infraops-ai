# InfraOps AI

> **Infraestrutura sob controle. Inteligência para agir.**

InfraOps AI é uma plataforma completa de Governança, Operações Autônomas e Inteligência de Infraestrutura (AIOps) orientada a empresas de suporte, MSPs e equipes que administram múltiplos ambientes, unificando monitoramento, saúde de backups, prevenção de incidentes, automação autônoma governada, gestão contínua de SLOs, inteligência de causa-raiz e portal do cliente sob um rigoroso **Policy Engine**.

## 🟢 Produção Atual

- **Ambiente Oficial:** `https://infraopsai.awecloudsolution.com`
- **Status do Roadmap:** **25/25 Etapas Concluídas (100%) + Módulos Especiais Homologados**.
- **Segurança:** Todas as regras não-negociáveis do `AGENTS.md` e ADRs (incluindo ADR-016 e ADR-017) permanecem 100% ativas.
- **Recursos em Produção:**
  - 🏢 **Isolamento Rigoroso Multi-Tenant & RBAC:** Visão restrita e isolada para Tenant Owners e Admins (sem acesso a outros clientes ou infraestrutura master do MSP), trava dinâmica de tenant no topo e onboarding limpo (*Zero-State*) para novos clientes.
  - ⚙️ **Configurações Gerais da Plataforma (9 Subsistemas):** Gestão centralizada e testes de conectividade ao vivo para SMTP, Storage S3/MinIO, PostgreSQL 16, Redis (BullMQ), Telemetria Prometheus, Provedores de IA, Agente de Host, White-Label MSP e Políticas Globais.
  - 🔑 **Gestão de Identidade, Credenciais & Primeiro Acesso:** Fluxo interativo de "Esqueci a Senha" (PIN de 6 dígitos), troca obrigatória de senha no primeiro login (`mustChangePassword`), gerador seguro de senhas, controle de status (🟢 Ativo / 🔴 Inativo) e exclusão segura de usuários.
  - 🤖 **IA Contextual Multi-Provedor:** Groq Cloud, OpenAI, DeepSeek, Claude e Ollama local com validação upstream de chaves ao vivo (`🟢 CHAVE ATIVA`).
  - ⏰ **Autonomous Scheduler & Automation Engine:** Agendamentos Cron/Intervalo, presets diários de briefing, health sweep e auditoria de backups.
  - ⚡ **Conditional Triggers & Event Automation:** Gatilhos orientados a telemetria com proteção anti-flapping (Debounce, Cooldown, Circuit Breaker e Deduplicação SHA-256).
  - 🛡️ **Autonomous Policies & Self-Healing:** Matriz de autonomia Níveis 0 a 5, prechecks, postchecks, orçamentos de risco (*Risk Budget*) e auto-escalonamento para canais de alerta.
  - 🎯 **Goal-Oriented Infrastructure Management:** Definição declarativa de metas e SLOs contínuos (Storage $\ge$ 20%, Backup RPO $\le$ 24h, Uptime $\ge$ 99.9%) com medidores visuais de conformidade (*Compliance Gauges*).
  - 💡 **Infrastructure Intelligence & Advisor:** Mineração de incidentes recorrentes, recomendações estruturais evidence-backed, previsão preditiva de capacidade (7 a 180 dias), detecção de SPOFs, score explicável de dívida técnica e relatórios executivos para MSPs.
  - ⚡ **Catálogo de Actions & Governança Operacional:** Contratos declarativos de Actions tipadas (Precheck, Postcheck, Idempotência) e ajuste de nível de autonomia (1 a 5) por tenant.
  - 🔔 **Canais de Disparo Omnichannel por Tenant:** Chatwoot API (*Account API & Public API*), Quepasa WhatsApp Gateway, Telegram Bot, WhatsApp Webhook, E-mail SMTP e Webhooks HTTP com teste de disparo ao vivo.
  - 🔌 **Integrações Nativas & Live Discovery:** Proxmox VE e Virtualizor com chamadas REST oficiais e sincronização em tempo real de nós, VMs QEMU, containers LXC e storages (zero dados fictícios).
  - 🛡️ **Auditoria & Criptografia:** Audit Hash Chain SHA-256 e RBAC multi-tenant estrito com isolamento por organização.

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
- Executar Actions não registradas no catálogo;
- Transformar recomendações consultivas em mudanças estruturais diretas sem Change Plan aprovado (ADR-017).

### Fluxo Operacional
```text
Schedule / Trigger / Goal / Intelligence
↓
Context / Evidence
↓
AI Analyzer / Rule Engine
↓
Policy Engine
↓
Action Registry / Change Plan
↓
Approval (quando exigido)
↓
Precheck → Execute → Postcheck
↓
Audit (SHA-256 Hash Chain) → Notification (Chatwoot / Quepasa / Telegram) → Validation Loop
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
- `docs/01-architecture/adr/ADR-017-infrastructure-intelligence-advisory-boundary.md`
- `docs/02-implementation/25_INFRASTRUCTURE_INTELLIGENCE_CONTINUOUS_IMPROVEMENT.md`
- `docs/06-product/INFRASTRUCTURE_INTELLIGENCE.md`
- `docs/06-product/AUTONOMOUS_OPERATIONS.md`
- `docs/08-marketing/INFRASTRUCTURE_INTELLIGENCE_MARKETING_IMPACT.md`
- `docs/08-marketing/sales/SALES_PITCH_AND_VALUE_PROPOSITION.md`
