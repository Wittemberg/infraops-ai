# Contributing to InfraOps AI

## Fluxo

1. Crie branch curta por feature/fix.
2. Implemente somente o escopo necessário.
3. Adicione/atualize testes.
4. Atualize documentação e ADR quando pertinente.
5. Abra Pull Request.
6. Não faça push direto em `main` quando branch protection estiver habilitado.

## Commits

Usar Conventional Commits:

- `feat:` nova funcionalidade
- `fix:` correção
- `refactor:` refatoração sem mudança de comportamento esperado
- `docs:` documentação
- `test:` testes
- `chore:` manutenção
- `security:` alteração/hardening de segurança

## Definition of Done

Uma feature não está pronta sem, quando aplicável:

- código;
- testes;
- migrations;
- documentação;
- autorização/policy;
- auditoria;
- observabilidade;
- tratamento de erro;
- validação de segurança;
- critérios de aceite da etapa atendidos.

## Arquitetura

Mudanças que contradigam decisões existentes exigem ADR. Consulte `docs/01-architecture/adr/`.
