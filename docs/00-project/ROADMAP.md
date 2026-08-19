# Roadmap — InfraOps AI

> **Estado atual:** 🟢 **Etapas 1–22 concluídas e em produção** (+ Módulos Especiais Homologados).  
> **Próxima fase:** 🟡 **Etapas 23–24 — Autonomous Infrastructure Operations**.

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

## 3. Etapa 21 — Autonomous Scheduler & Automation Engine 🟢 (CONCLUÍDO)

### Objetivo
Permitir execução futura e recorrente de análises, relatórios, runbooks e Actions governadas.

### Entregas Realizadas
- Agendamento One-shot, Cron (`0 7 * * *`) e Intervalos periódicos (`30m`).
- Timezone configurável por tenant e respeito a janelas de manutenção (*skipDuringMaintenance*).
- Presets nativos: Daily Infrastructure Briefing, Health Sweep Diagnóstico, Backup Compliance Audit e Limpeza de Temp.
- Execução manual imediata (*Run Now*).
- Histórico completo de execuções (*Runs*) com resumos, evidências e hash de integridade SHA-256.

---

## 4. Etapa 22 — Conditional Triggers & Event Automation 🟢 (CONCLUÍDO)

### Objetivo
Disparar análises e workflows governados quando condições reais de infraestrutura e telemetria ocorrerem.

### Entregas Realizadas
- Gatilhos baseados em telemetria e estados anômalos (`disk.used_percent > 85%`, `agent.heartbeat_age > 5m`, `service.status == 'failed'`, `backup.last_valid_age > 26h`).
- **Travas anti-flapping obrigatórias:**
  - **Debounce / Persistência Mínima** (a condição deve persistir por $N$ minutos).
  - **Cooldown** (período de repouso após execução para evitar loops).
  - **Circuit Breaker** (bloqueio automático de segurança caso o gatilho exceda $N$ acionamentos/hora).
  - **Deduplicação de Eventos** (fingerprint SHA-256).
- Painel visual com simulação de eventos e botão de rearme manual de Circuit Breaker.

---

## 5. Etapa 23 — Autonomous Policies & Self-Healing 🟡 (EM PLANEJAMENTO)

### Objetivo
Permitir remediação automática, previamente autorizada e verificável para cenários de falha conhecidos.

### Níveis de Autonomia
0. **Observe:** Apenas monitora e coleta telemetria.
1. **Analyze:** Analisa anomalias e gera diagnósticos.
2. **Recommend:** Recomenda a Action ideal ao operador.
3. **Approval:** Cria Job pendente e aguarda aprovação humana no painel.
4. **Autonomous:** Executa a Action automaticamente se cumprir todos os prechecks e limites de risco.
5. **Self-Healing:** Executa remediações completas em cadeia com pós-validação rigorosa.

### Entregas Planejadas
- Matriz de política de autonomia por Tenant, Nó e Action.
- Orçamento de risco (*Risk Budget*) e limites de ações por janela de tempo.
- Threshold de evidências mínimas para decisão autônoma.
- Postcheck obrigatório com rollback assistido quando suportado.
- Escalonamento automático para operador humano em caso de falha no self-healing.

---

## 6. Etapa 24 — Goal-Oriented Infrastructure Management ⚪ (PLANEJADO)

### Objetivo
Gerenciamento de infraestrutura orientado a metas de alto nível (ex: *"Manter latência < 50ms e custo < R$ X"*).

### Entregas Planejadas
- Definição declarativa de SLOs e metas por tenant.
- Auto-tuning e balanceamento contínuo de workloads.
- Planejamento de capacidade preditivo baseado em tendências históricas do Prometheus.
