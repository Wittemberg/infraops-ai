# Project Overview — InfraOps AI

## Missão

Permitir que uma equipe de infraestrutura saiba rapidamente **o que precisa de atenção agora**, compreenda o motivo e, quando autorizado, execute ações seguras e auditáveis — evoluindo para um sistema capaz de acompanhar, proteger e auto-remediar a infraestrutura continuamente dentro de políticas explícitas.

## Público-Alvo

- MSPs (Managed Service Providers);
- Empresas de suporte e terceirização de TI;
- Equipes e departamentos de infraestrutura corporativa;
- Provedores de hospedagem e data centers que administram múltiplos clientes;
- Ambientes Linux/Windows, Proxmox VE, Virtualizor, servidores standalone e cloud VMs.

## Capacidades Centrais Atuais (Produção 🟢)

1. **Monitoramento e Observabilidade:** Nós, workloads (VMs/LXCs), telemetria temporal (Prometheus) e heartbeats.
2. **Saúde e Governança de Backups:** Políticas de RPO/RTO, compliance de snapshots e retenção segura.
3. **Prevenção de Incidentes e Anomalias:** Deteção proativa de esgotamento de disco e sobrecarga de CPU/RAM.
4. **Disparo de Alertas Omnichannel por Tenant:** Chatwoot API (Account & Public), Quepasa WhatsApp Gateway, Telegram, E-mail SMTP e Webhooks com teste em tempo real.
5. **IA Contextual Multi-Provedor:** Groq Cloud, OpenAI, DeepSeek, Claude e Ollama local, com validação de chaves ao vivo (`🟢 CHAVE ATIVA`) e fallback offline.
6. **Catálogo de Actions Homologadas:** Ações tipadas com contratos declarativos (Precheck, Postcheck, Idempotência) e níveis de autonomia por tenant.
7. **Autonomous Scheduler & Automation Engine (Etapa 21):** Agendamento recorrente (Cron/Intervalos/One-Shot), briefings matinais e sweep diagnóstico.
8. **Conditional Triggers & Event Automation (Etapa 22):** Gatilhos reativos orientados a eventos com travas anti-flapping (Debounce, Cooldown, Circuit Breaker e Deduplicação SHA-256).
9. **Governança Estrita:** Policy Engine, RBAC multi-tenant e Audit Hash Chain SHA-256 à prova de adulteração.
10. **Portal do Cliente:** Visão isolada e segura por organização.

## Próximas Capacidades Planejadas (🟡)

11. **Autonomous Policies & Self-Healing (Etapa 23):** Matriz de autonomia Níveis 0 a 5, auto-remediação em cadeia e orçamentos de risco (*Risk Budget*).
12. **Goal-Oriented Infrastructure Management (Etapa 24):** Gerenciamento e auto-tuning orientados a metas contínuas de SLO e capacidade.

## Princípio de Produto

> O dashboard mostra exceções; a IA explica o contexto; o Catálogo de Actions executa mudanças governadas; o Automation Engine (Schedules & Triggers) toma iniciativa sob travas de segurança; e o Policy Engine garante que nenhuma regra seja violada.
