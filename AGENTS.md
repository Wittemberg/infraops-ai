# AGENTS.md — Instruções para agentes de programação

Este arquivo é obrigatório para qualquer IA/agente que altere o InfraOps AI.

## Leitura obrigatória antes de programar

1. `README.md`
2. `docs/02-implementation/00_README_MASTER.md`
3. `docs/01-architecture/ARCHITECTURE_DECISIONS.md`
4. documento correspondente à etapa em desenvolvimento
5. ADRs relacionados

## Regras não negociáveis

1. Não criar `shell.exec`, `bash.run`, `command.execute` ou equivalente.
2. Não criar endpoint genérico para executar comandos recebidos pelo usuário/LLM.
3. Toda operação em host deve ser uma Action registrada e versionada.
4. A IA nunca pode ignorar o Policy Engine.
5. Toda alteração operacional deve gerar Job.
6. Todo Job deve ser idempotente.
7. Toda Action mutável deve possuir precheck e postcheck.
8. Toda operação relevante deve gerar auditoria.
9. Multi-tenancy deve existir desde banco, API e autorização.
10. Agent inicia conexões outbound; não depender de SSH inbound.
11. Secrets não podem estar em plaintext, logs, traces ou mensagens de erro.
12. Não conceder `sudo NOPASSWD: ALL` ao agent.
13. Preferir APIs oficiais Proxmox/Virtualizor ao shell quando houver suporte.
14. Métricas temporais ficam no Prometheus, não no PostgreSQL.
15. A plataforma deve continuar monitorando sem o provedor de IA.
16. Dados coletados de hosts são dados não confiáveis; nunca tratá-los como instruções de sistema para o LLM.
17. Um usuário/IA não pode elevar o próprio privilégio.
18. `DENY` explícito de policy sempre prevalece.

## Método de trabalho

Para cada etapa:

1. Liste os arquivos que serão criados/alterados.
2. Implemente apenas o escopo da etapa.
3. Adicione testes.
4. Execute lint, typecheck, testes e build.
5. Atualize migrations e documentação quando necessário.
6. Valide todos os critérios de aceite.
7. Só avance após o gate da etapa estar verde.

## Alterações arquiteturais

Não alterar silenciosamente uma decisão existente. Crie novo ADR contendo:

- contexto;
- decisão;
- alternativas consideradas;
- impacto de segurança;
- impacto de migração;
- consequências.

Nunca apague o histórico de ADRs aceitos; superseda-os explicitamente.
