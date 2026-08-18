# InfraOps AI

> **Infraestrutura sob controle. Inteligência para agir.**

InfraOps AI é uma plataforma de Governança e Operações Autônomas de Infraestrutura de TI (AIOps) orientada a empresas de suporte, MSPs e equipes que administram múltiplos ambientes, unificando monitoramento de infraestrutura, saúde de backups, prevenção de incidentes, portal do cliente e operação assistida por Inteligência Artificial sob um rigoroso **Policy Engine**.

---

## 🟢 Status do Projeto: 100% Funcional e em Produção

* **Ambiente de Produção Ativo:** [`https://infraopsai.awecloudsolution.com`](https://infraopsai.awecloudsolution.com)
* **Status do Roadmap:** **20 / 20 Etapas Concluídas (100%)** + Funcionalidades Avançadas de Produção.
* **Conformidade de Segurança:** **18 / 18 Regras Não Negociáveis (`AGENTS.md`)** validadas.

---

## 🚀 Principais Módulos & Recursos Implementados

### 1. 🤖 Console de IA Multiprovedor com Governança (Policy Engine)
* Suporte nativo a **GroqCloud** (Inferência LPU ultra-rápida: Llama 3.1 8B Instant, Llama 3.3 70B, DeepSeek R1), **OpenAI** (GPT-4o), **Google Gemini** (Gemini 1.5 Pro / Flash), **Anthropic** (Claude 3.5 Sonnet), **DeepSeek** e **Ollama** (100% Local/On-Premise).
* **Isolamento Estrito de Chaves:** Cada provedor possui sua chave de API e modelo armazenados separadamente com criptografia AES-256-GCM.
* **Validador Upstream em Tempo Real:** Endpoint `/api/v1/ai/test` que valida chaves e latência diretamente no provedor.
* **Imunidade a Prompt Injection:** Dados de telemetria dos hosts são tratados como não confiáveis; comandos só são executados via catálogo estrito de **Actions**.

### 2. 🖥️ Gestão Híbrida: Servidores Standalone, On-Premise e Clusters
* Suporte completo a nós de hipervisores (**Proxmox VE & Virtualizor**) e **servidores locais standalone** (bancos de dados, instâncias AWS/GCP, VPS dedicadas).
* **Instalação em 1 Clique:**
  * 🐧 **Linux:** `curl -sSL https://infraopsai.awecloudsolution.com/install-agent.sh | sh -s -- --enroll-token <TOKEN>`
  * 🪟 **Windows:** `irm https://infraopsai.awecloudsolution.com/install-agent.ps1 | iex`

### 3. 🔔 Canais de Disparo de Alertas & Notificações Multicanal
* **Canais Integrados:** 📱 WhatsApp (Evolution API / Z-API), ✈️ Telegram Bot, 📧 E-mail / SMTP, 💬 Webhooks (Slack/Discord).
* **Roteamento por Severidade:** Configuração por canal (`Apenas Crítico`, `Warning & Crítico`, `Todos`).
* **Deduplicação Inteligente (SHA-256 Fingerprinting):** Prevenção contra tempestades de alertas (*alert storming*).
* **Botão `🧪 Testar Disparo`:** Teste instantâneo de entrega em tempo real.

### 4. 🔐 Segurança, RBAC & Auditoria Criptográfica (Hash Chain)
* **RBAC Granular:** Perfis `SuperAdmin`, `Owner`, `Administrator`, `Operator` e `Viewer`.
* **Trilha de Auditoria Imutável:** Cadeia de hashes SHA-256 interligados com ferramenta matemática de verificação de integridade.
* **Precheck & Postcheck:** Toda ação operacional passa por validação de estado antes e depois da execução.
* **Safe Retention:** Proteção contra expurgo acidental ou indevido de backups.

### 5. 🏢 Multi-Tenancy & Persistência de Dados
* Isolamento total por cliente/tenant em banco, API e autorização.
* Persistência em volume dedicado `infraops-app-data:/app/data` no Docker Swarm / Portainer.
* Sincronização e merge inteligente de cache para garantia de retenção e disponibilidade.

---

## 🏛️ Stack Tecnológica

| Camada | Tecnologia |
|---|---|
| **Frontend Web** | React + Vite + CSS Glassmorphism Dark Mode |
| **Backend API** | Node.js / TypeScript + REST API + SSE Heartbeats |
| **Fila & Worker** | Worker Queue Engine + Jobs Idempotentes |
| **Agent Local** | Go (Linux) + PowerShell Service (Windows) |
| **Banco de Dados** | PostgreSQL + JSON Store Persistente |
| **Storage de Objetos** | S3 / MinIO (Bucket Operacional: `infraops-artifacts`) |
| **Observabilidade** | Prometheus + OpenTelemetry + Health Check em Tempo Real |
| **Deploy & Orquestração**| Docker Swarm + Portainer + Traefik Reverse Proxy |

---

## 📂 Estrutura de Documentação do Projeto

* [`docs/00-project/`](docs/00-project/) — Visão, roadmap, glossário e **Relatório Completo de Progresso**.
* [`docs/01-architecture/`](docs/01-architecture/) — Decisões Arquiteturais (ADRs), Threat Model e Criptografia.
* [`docs/02-implementation/`](docs/02-implementation/) — Guias das 20 Etapas de Implementação e Relatório Final.
* [`docs/03-integrations/`](docs/03-integrations/) — Proxmox VE, Virtualizor, Evolution API, Telegram, S3.
* [`docs/04-security/`](docs/04-security/) — Policy Engine, RBAC, Cofre de Secrets AES-256 e Auditoria.
* [`docs/05-operations/`](docs/05-operations/) — Runbooks, Docker Stack Swarm, Backup & Restore.
* [`docs/08-marketing/`](docs/08-marketing/) — **Pitch de Vendas, Comparativo Zabbix/Grafana e Proposta de Valor Comercial**.

---

## 📜 Regras Não Negociáveis (`AGENTS.md`)

1. Não criar `shell.exec`, `bash.run` ou comandos remotos arbitrários.
2. Toda operação em host deve ser uma Action registrada, tipada e versionada.
3. A IA nunca pode ignorar o Policy Engine.
4. Todo Job operacional deve ser idempotente com precheck e postcheck.
5. Multi-tenancy estrito em banco, API e autorização.
6. Agent inicia conexões outbound (HTTPS 443); sem dependência de SSH inbound.
7. Secrets mascarados e cifrados com AES-256-GCM.
8. Trilha de auditoria em cadeia criptográfica SHA-256.
