# Security Policy — InfraOps AI

InfraOps AI é uma plataforma capaz de observar e, quando autorizado, executar operações privilegiadas em infraestrutura de terceiros. Segurança é requisito estrutural, não funcionalidade opcional.

## Áreas de severidade crítica

Tratar como críticas vulnerabilidades envolvendo:

- isolamento entre tenants;
- autenticação ou autorização;
- Agent identity/enrollment;
- Action Engine;
- Policy Engine;
- privilege escalation;
- secrets/credenciais;
- replay de jobs;
- aprovações;
- execução de ferramentas pela IA;
- prompt injection com impacto operacional;
- auditoria;
- acesso indevido a backups ou workloads.

## Invariantes

- Não existe shell remoto arbitrário.
- Actions aceitam parâmetros tipados, não linhas de comando livres.
- Não concatenar parâmetros externos em `sh -c`.
- Menor privilégio em agents e integrações.
- Credenciais são cifradas e redigidas de logs.
- Agent de um node não acessa jobs de outro node.
- Usuário de um tenant não deve confirmar a existência de recursos de outro tenant.
- IA recebe apenas dados autorizados pelo contexto/tenant antes da chamada ao modelo.

## Divulgação de vulnerabilidades

O processo formal será definido antes da primeira release pública. Até lá, não publicar detalhes exploráveis em issues públicas; comunicar diretamente aos responsáveis pelo repositório.

## Documentação relacionada

- `docs/04-security/`
- `docs/02-implementation/05_AUTH_RBAC_MULTI_TENANCY.md`
- `docs/02-implementation/08_ACTION_FRAMEWORK.md`
- `docs/02-implementation/09_POLICY_ENGINE_APPROVALS_LOCKS.md`
- `docs/02-implementation/10_AUDITORIA_SECRETS_E_SEGURANCA.md`
- `docs/02-implementation/19_TESTES_SEGURANCA_QA.md`
