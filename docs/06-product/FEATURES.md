# Features — InfraOps AI

## Implemented / Production (100% Homologado)
- **Core Platform & Multi-Tenancy:** Isolamento estrito de tenants, RBAC granular (`superadmin`, `admin`, `operator`, `auditor`, `viewer`), auditoria SHA-256 criptográfica, controle seguro de credenciais e onboarding limpo (*Zero-State*) para novos clientes.
- **Painel de Configurações Gerais (9 Subsistemas):** Gestão centralizada e testes ao vivo para SMTP, Storage S3/MinIO, PostgreSQL 16, Redis (BullMQ), Telemetria Prometheus/Grafana, Provedores de IA, Agente de Host, White-Label MSP e Políticas Globais.
- **Gestão de Identidade & Primeiro Acesso:** Troca mandatória de senha no primeiro login (`mustChangePassword`), gerador seguro de senhas, fluxo interativo de "Esqueci a Senha" (PIN de 6 dígitos), exclusão e alternador rápido de status (Ativo/Inativo com HTTP 403).
- **Agentes de Host:** Golang Linux & PowerShell Windows com conexões mTLS exclusivamente outbound e auto-registro (Enrollment).
- **Hipervisores & Workloads:** Integração nativa com APIs REST oficiais do Proxmox VE e Virtualizor com sincronização em tempo real de nós, VMs QEMU, LXCs e storages (zero mocks residuais).
- **Backup Engine:** Políticas RPO/RTO, retenção segura, verificação de integridade e auditoria de destinos.
- **Action Framework & Policy Engine:** Ações homologadas, precheck, postcheck, idempotência e governança não-negociável (`DENY` prioritário).
- **IA Orquestrada Multi-Provedor:** OpenAI, Claude, Gemini e Ollama local com validação ao vivo de chaves e fallback determinístico offline.
- **Alertas Omnichannel:** Chatwoot API (Account & Public API), Quepasa WhatsApp API, Telegram, SMTP e Webhooks com disparo de teste ao vivo.
- **Autonomous Scheduler & Cron:** Agendamentos de rotinas periódicas, one-shot e presets diários.
- **Conditional Triggers & Anti-Flapping:** Gatilhos reativos à telemetria com debounce, cooldown, deduplicação e circuit breaker.
- **Self-Healing & Autonomous Policies:** Matriz de autonomia Níveis 0 a 5 com orçamentos de risco (*Risk Budget*) e auto-escalonamento.
- **Goal-Oriented Operations & SLOs:** Metas declarativas contínuas com medidores visuais de conformidade (*Compliance Gauges*).
- **Infrastructure Intelligence & Advisor:** Mineração de causa-raiz, recomendações estruturais governadas (ADR-017), previsão de capacidade (7 a 180 dias), detecção de SPOFs, score de dívida técnica e relatórios executivos para MSPs.

## Deferred / Prohibited (Regras Não-Negociáveis)
- Arbitrary shell por LLM (`shell.exec`, `bash.run`);
- AI self-escalation (a IA não pode elevar seu próprio privilégio);
- Modificação dinâmica de código pelo agente;
- Execução de ações estruturais sem Change Plan aprovado;
- Autonomia destrutiva irrestrita.

