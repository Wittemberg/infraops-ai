# Roadmap — InfraOps AI

> **Estado atual:** 🟢 **Todas as 27 Etapas Concluídas e Ativas em Produção (100%)** (+ Módulos Especiais Homologados).  
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
3. **🧠 Central IA com Validação Upstream em Tempo Real & Sincronismo em Nuvem:**
   - Teste ao vivo de chaves de API (`POST /api/v1/ai/test`) e indicadores de status `🟢 CHAVE ATIVA`.
   - Presets inteligentes para Groq Cloud (`llama-3.3-70b`, `deepseek-r1-70b`, etc.).
   - Sincronização em nuvem e persistência contínua do chat por tenant entre múltiplos dispositivos e sessões.

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

---

## 5. Etapa 26 — Infrastructure Source of Truth & Physical Topology 🟢 (CONCLUÍDA)

> *"Se faz parte da infraestrutura do tenant, o InfraOps AI deve saber o que é, onde está, a que está conectado e do que depende — sem inventar informação e sem depender de plataforma externa."*

### Objetivo
Dar ao tenant controle documental e operacional completo de sua infraestrutura física e lógica com fonte da verdade nativa (*Single Source of Truth*), sem dependência mandatória de ferramentas externas como NetBox ou Device42.

### Sub-Releases Concluídas:
- **26A — Customer Infrastructure Book:** Sites, Locations, Racks, Assets físicos, número de patrimônio/serial/MAC/IP, documentos, garantias, contatos de suporte, QR Code e timeline histórica de eventos.
- **26B — Rack & Connectivity:** Racks (U), visualização de ocupação, interfaces de rede, assistente em lote para portas de switches (*Switch Port Wizard*), conexões físicas (Porta A ↔ Porta B) e derivação de topologia.
- **26C — Network Source of Truth:** VLANs, Subnets, IPAM básico com estados operacionais (`USED`, `RESERVED`, `DHCP`, `AVAILABLE`, `CONFLICT`, `UNKNOWN`) e Circuitos WAN / Operadoras.
- **26D — Network Discovery & Reconciliation Engine:** Descoberta de ativos autorizada na subnet via SNMP/LLDP, com matching determinístico (Serial > MAC > IP > Hostname) e classificação estrita de proveniência (`MANUAL`, `DISCOVERED`, `VERIFIED`).
- **26E — Operational Tools:** Health Score de infraestrutura, Checklist de Visita Técnica com relatório automático para cliente, Relatório Executivo Mensal de MSP e gestão de Ciclo de Vida/Garantias/EOL.
- **26F — AI & Advisor Integration:** Ferramentas *read-only* de consulta natural para a IA operacional (ex: *"Em qual switch e porta está a VM CALVI BANCO?"*, *"Quais equipamentos estão sem garantia?"*), diagnóstico de SPOFs físicos e enriquecimento contextual.

---

## 6. Etapa 27 — Network Device Monitoring & Governed WAN Actions 🟢 (CONCLUÍDA)

### Objetivo
Integrar **MikroTik RouterOS** e **pfSense** ao mesmo modelo operacional do InfraOps AI já utilizado para infraestrutura computacional: inventário + telemetria + integridade + IA + Ações governadas + auditoria com hash.

> *"Monitorar a saúde da WAN em tempo real e permitir que a IA, sob política rigorosa e governança de Actions, altere o link de Internet preferencial/padrão com segurança, precheck, postcheck e rollback determinístico."*

### Drivers Oficiais:
1. **MikroTik RouterOS** (v7 REST API & Protocolo API/SNMP com suporte a rotas, distâncias e interfaces).
2. **pfSense** (XML-RPC / API segura / Gateway Groups com monitoramento via dpinger e Tiers 1/2).

### Sub-Releases:
- **27A — Driver Framework:** Interface neutra `NetworkDeviceDriver`, detecção de recursos (*capabilities*), credenciais via Secrets e tratamento tipado de erros não suportados (ADR-020).
- **27B — MikroTik Monitoring:** Identidade, modelo, serial, RouterOS version, CPU, RAM, temperatura, interfaces, throughput, status de gateway e latência/perda.
- **27C — pfSense Monitoring:** Identidade, versão, CPU/RAM, interfaces, gateways dpinger, loss/delay, gateway groups e tiers.
- **27D — Governed WAN Actions:** Ações normalizadas `network.set_primary_wan`, `network.set_wan_failover`, `network.set_wan_balance`, `network.enable_wan`, `network.disable_wan`.
- **27E — Safe Change Workflow:** Pipeline mandatória (ADR-021): `Intent -> Precheck -> Snapshot -> Execute -> Postcheck -> Rollback if needed -> Audit Hash`.
- **27F — AI Experience:** Análise contextual de qualidade de link e direcionamento para ações governadas sem permitir comandos CLI livres.
- **27G — Autonomous WAN Failover:** Auto-recuperação com proteção anti-flapping (debounce, histerese, cooldown, recovery window e circuit breaker).
- **27H — Frontend Dashboard:** Sub-aba especializada `📡 Roteadores & Links WAN` no menu `🏢 Infra & Topologia`.



