# Roadmap — InfraOps AI

> **Estado atual:** 🟢 **Todas as 25 Etapas Concluídas e Ativas em Produção** (+ Módulos Especiais Homologados).  
> **Ambiente Oficial:** https://infraopsai.awecloudsolution.com

---

## 1. Etapas 1–20 — Base Fundacional Concluída 🟢

As 20 etapas iniciais entregaram a espinha dorsal de governança, segurança e operação do InfraOps AI:
- Monorepo, DataStore com persistência e Multi-tenancy isolado.
- Agent Go com protocolo outbound seguro e mTLS.
- Action Framework tipado, Policy Engine rigoroso e Hash Chain de Auditoria SHA-256.
- Integrações oficiais com Proxmox VE e Virtualizor.
- Backup Engine com RPO/RTO e Safe Retention.
- Orquestrador de IA Multi-Provedor (Groq Cloud, OpenAI, DeepSeek, Ollama).
- Interface Web moderna (React/Vite) com Dark/Light Mode e controle por papéis (RBAC).
- Deploy automatizado com Traefik, Docker Swarm e Portainer.

---

## 2. Módulos & Funcionalidades Extras Concluídas 🌟

Funcionalidades de alto valor agregadas à plataforma:
1. **⚡ Catálogo de Actions & Governança Operacional:**
   - Inspeção de contratos declarativos de Actions (Prechecks, Postchecks, Idempotência).
   - Ativação/Bloqueio e parametrização de Nível de Autonomia (1 a 5) por tenant.
2. **🔔 Canais de Disparo de Alertas Omnichannel por Tenant:**
   - Suporte nativo ao **Chatwoot** (Account API e Public API).
   - Suporte nativo ao **Quepasa** (WhatsApp Gateway oficial).
   - Suporte a Telegram, WhatsApp, E-mail SMTP e Webhooks HTTP com botão de teste imediato.
3. **🧠 Central IA com Validação Upstream em Tempo Real:**
   - Teste ao vivo de chaves de API (`POST /api/v1/ai/test`) e indicadores de status `🟢 CHAVE ATIVA`.
   - Presets inteligentes para Groq Cloud (`llama-3.3-70b`, `deepseek-r1-70b`, etc.).

---

## 3. Etapas 21–24 — Autonomous Infrastructure Operations 🟢

- **Etapa 21 — Autonomous Scheduler & Automation Engine:** Agendamentos Cron/Intervalo, presets diários de briefing, health sweep e auditoria de backups.
- **Etapa 22 — Conditional Triggers & Event Automation:** Gatilhos reativos orientados a telemetria com travas anti-flapping (Debounce, Cooldown, Circuit Breaker e Deduplicação).
- **Etapa 23 — Autonomous Policies & Self-Healing Engine:** Matriz de governança de autonomia Níveis 0 a 5, prechecks, postchecks, orçamentos de risco (*Risk Budget*) e auto-escalonamento para canais de alerta.
- **Etapa 24 — Goal-Oriented Infrastructure Management:** Definição e gestão contínua de metas de alto nível (*Desired State / SLOs*) com medidores visuais de conformidade (*Compliance Gauges*).

---

## 4. Etapa 25 — Infrastructure Intelligence & Continuous Improvement 🟢 (CONCLUÍDA)

> *"Self-Healing resolve o incidente pontual. Infrastructure Intelligence impede que ele volte a existir."*

1. **Recurring Incident Analysis:** Agrupamento determinístico de falhas repetitivas e self-healings sucessivos por recurso.
2. **Root Cause Pattern Mining:** Mineração de causas estruturais com evidências mensuráveis e cálculo de confiança (0–100%).
3. **Infrastructure Recommendations:** Recomendações técnicas categorizadas (*Capacity, Resilience, Backup, Architecture, Lifecycle, Optimization*).
4. **Capacity Forecasting:** Projeções de saturação de disco/RAM/CPU em horizontes de 7, 30, 90 e 180 dias com cenários (Conservador, Base, Acelerado).
5. **Single Point of Failure (SPOF) Detection:** Mapeamento de nós isolados, storages sem réplica e dependências críticas.
6. **Technical Debt Score:** Indicador de Dívida Técnica (0–100) com decomposição explicável dos 6 pilares de engenharia.
7. **Cost / ROI Analysis:** Cálculo transparente de retorno sobre investimento e horas técnicas salvas baseado no perfil financeiro do tenant (**sem inventar preços**).
8. **Change Plan Governed Generator:** Conversão de recomendações em planos de mudança com pré-requisitos, janelas e aprovação.
9. **Recommendation Validation Loop:** Validação contínua *before/after* comprovando ganho de performance e resolução de falhas.
10. **Executive Infrastructure Review:** Relatórios executivos consolidados para MSPs e gestores com cálculo de horas economizadas e ROI.
