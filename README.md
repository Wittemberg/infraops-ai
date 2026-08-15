# InfraOps AI

> **Infraestrutura sob controle. Inteligência para agir.**

InfraOps AI é uma plataforma AIOps orientada a empresas de suporte, MSPs e equipes que administram múltiplos ambientes, unificando monitoramento de infraestrutura, saúde de backups, prevenção de incidentes, portal do cliente e operação assistida por Inteligência Artificial.

## Status

🚧 **Projeto em fase de fundação / pré-implementação.**

Este primeiro commit registra a visão do produto, decisões arquiteturais, plano de implementação, segurança, estratégia competitiva e conceitos de marketing **antes da primeira linha de código de produção**.

## Princípios não negociáveis

- Agent Linux escrito em Go.
- Comunicação `outbound-first` via HTTPS; nodes não dependem de SSH inbound.
- Nenhum shell remoto arbitrário.
- Toda operação remota ocorre por **Actions registradas e versionadas**.
- Policy Engine independente da IA.
- RBAC + escopo multi-tenant.
- IA é um actor com permissões próprias.
- Jobs idempotentes e com resource locks.
- Actions mutáveis possuem precheck e postcheck.
- Alterações relevantes exigem auditoria.
- Secrets nunca são persistidos em plaintext.
- Prometheus armazena séries temporais; PostgreSQL armazena estado de negócio.
- Monitoramento e automação determinística continuam funcionando sem o provedor de IA.

## Stack planejada

| Camada | Tecnologia |
|---|---|
| Web | Next.js + TypeScript |
| API | NestJS + TypeScript |
| Worker | NestJS + BullMQ |
| Agent | Go |
| Banco | PostgreSQL |
| Queue/cache | Redis |
| Métricas | Prometheus |
| Alertas | Alertmanager |
| Telemetria | OpenTelemetry |
| Objetos/logs grandes | S3/MinIO |
| Deploy | Docker + Portainer |

## Documentação

A documentação é parte do produto e deve ser atualizada junto com o código.

- [`docs/00-project/`](docs/00-project/) — visão, roadmap e glossário.
- [`docs/01-architecture/`](docs/01-architecture/) — arquitetura e Architecture Decision Records (ADRs).
- [`docs/02-implementation/`](docs/02-implementation/) — guia step-by-step para implementação.
- [`docs/03-integrations/`](docs/03-integrations/) — documentação das integrações.
- [`docs/04-security/`](docs/04-security/) — threat model, RBAC, secrets, agent e actions.
- [`docs/05-operations/`](docs/05-operations/) — instalação, deploy, backup/restore e runbooks.
- [`docs/06-product/`](docs/06-product/) — requisitos e experiência do produto.
- [`docs/07-strategy/`](docs/07-strategy/) — posicionamento e análise competitiva.
- [`docs/08-marketing/`](docs/08-marketing/) — conceitos de marketing e materiais comerciais.
- [`docs/09-assets/`](docs/09-assets/) — diagramas, mockups, screenshots e branding.

### Por onde uma IA programadora deve começar

Leia, nesta ordem:

1. [`AGENTS.md`](AGENTS.md)
2. [`docs/02-implementation/00_README_MASTER.md`](docs/02-implementation/00_README_MASTER.md)
3. [`docs/01-architecture/ARCHITECTURE_DECISIONS.md`](docs/01-architecture/ARCHITECTURE_DECISIONS.md)
4. Etapa 01 e Etapa 02 do guia de implementação.

Não implementar Proxmox, Virtualizor, IA operacional ou Actions privilegiadas antes de o **foundation gate** estar verde.

## Estrutura de código reservada

```text
apps/          # web, api e worker
agents/        # agents instalados nos hosts
packages/      # módulos compartilhados
deployments/  # stacks e configurações de infraestrutura
scripts/       # utilitários de desenvolvimento/operação
tests/         # testes E2E, integração, segurança e fixtures
```

> As pastas de código estão deliberadamente vazias neste snapshot. O desenvolvimento deve seguir a sequência documentada em `docs/02-implementation/`.

## Licença

A licença do projeto **ainda não foi definida**. Não assumir MIT, Apache, GPL ou licença proprietária sem decisão explícita registrada em ADR/documentação.
