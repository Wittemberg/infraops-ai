# InfraOps AI — Guia de Posicionamento, Proposta de Valor e Argumentação Comercial

## 1. Big Idea

> **Ferramentas tradicionais observam. O InfraOps AI entende, governa e age. A próxima geração adiciona iniciativa: rotinas, eventos e objetivos podem iniciar fluxos automaticamente sem perder Policy Engine, RBAC ou auditoria.**

## 2. Pitch de 30 segundos — produto atual

> “O InfraOps AI centraliza a saúde de servidores, virtualizadores e backups, usa IA para diagnosticar o que realmente precisa de atenção e executa correções governadas por Actions, Policy Engine e auditoria. Em vez de depender de gráficos dispersos e shell manual, sua equipe opera múltiplos clientes em um control plane seguro.”

## 3. Pitch de visão — próxima geração

> “Estamos levando o InfraOps AI da operação assistida para a autonomia governada. Você poderá definir horários, condições e objetivos — como manter espaço livre, RPO de backup ou disponibilidade — e a plataforma acompanhará isso continuamente. Quando houver permissão, ela poderá corrigir cenários homologados, validar o resultado e registrar tudo. Você define os limites; o sistema cuida da rotina.”

> **Importante:** usar este pitch como roadmap/visão até as etapas 21–24 estarem implementadas.

## 4. Evolução de valor

| Dimensão | Monitoramento tradicional | InfraOps AI atual | Próxima geração planejada |
|---|---|---|---|
| Observação | Métricas/gráficos | Exceções contextualizadas | Observação contínua orientada a objetivos |
| Diagnóstico | Manual | IA contextual | IA + triggers recorrentes |
| Ação | SSH/scripts | Actions governadas | Actions autônomas autorizadas |
| Tempo | Reativo | Sob demanda/alert-driven | Schedule + event-driven |
| Segurança | Depende do operador | Policy Engine/RBAC | Mesma governança aplicada à autonomia |
| Validação | Manual | Pre/Postcheck | Self-healing com postcheck obrigatório |
| Auditoria | Logs dispersos | Hash chain | Decisão autônoma reconstruível ponta a ponta |

## 5. Nova proposta de valor: “Vida própria com limites”

A expressão interna “dar vida própria” deve ser traduzida comercialmente como **Autonomia Governada**.

Não vender como liberdade irrestrita da IA. Vender como:

- iniciativa operacional;
- automação contínua;
- menos intervenção repetitiva;
- resposta mais rápida;
- policies claras;
- rastreabilidade;
- stop/escalation quando algo foge do esperado.

## 6. Casos de uso futuros de alto valor

### Daily Infrastructure Brief
Antes do expediente, a plataforma analisa nodes, storage, backups e incidentes e envia somente exceções relevantes.

### Disk Guardian
Monitora tendência de capacidade; investiga automaticamente; acima do limite crítico, pode executar somente Actions previamente autorizadas.

### Backup Guardian
Após cada janela de backup, valida expectativa/RPO; abre incidente e tenta ações seguras autorizadas.

### Service Self-Healing
Serviço conhecido falha → coleta evidência → policy permite → restart → postcheck → encerra ou escala.

### Goal: RPO Compliance
Mantém workloads críticos dentro do objetivo de backup configurado e sinaliza drift antes do SLA ser violado.

## 7. Frases comerciais

### Produto atual
- “Infraestrutura sob controle. Inteligência para agir.”
- “Pare de descobrir problemas quando o cliente liga.”
- “Não basta ter backup. É preciso saber que ele está saudável.”

### Próxima geração
- “Você define os limites. O InfraOps AI cuida da rotina.”
- “Seu NOC não precisa dormir.”
- “Da observabilidade ao autocuidado governado.”
- “Detecta. Analisa. Corrige. Valida. Documenta.”
- “Automação com iniciativa. Governança sem concessões.”

## 8. Objeção — “Não tenho confiança em deixar IA mexer sozinha.”

Resposta recomendada:

> “E você não precisa dar liberdade irrestrita. No InfraOps AI, autonomia não é acesso root. Cada rotina recebe escopo, nível máximo de autonomia, Actions permitidas, risk budget e Policy Engine. Se a regra exigir aprovação humana, a automação para e espera. Se um postcheck falhar, o fluxo interrompe e escala. A IA nunca amplia sua própria permissão.”

## 9. Objeção — “Isso vai substituir minha equipe?”

> “O objetivo é retirar da equipe as verificações e remediações repetitivas, não retirar a governança humana. O time passa a definir objetivos, policies e exceções, enquanto a plataforma cuida do trabalho operacional previsível.”

## 10. Persona MSP

Mensagem:

> “Quanto mais clientes você adiciona, mais difícil fica verificar manualmente cada backup, storage e serviço. O modelo autônomo permite que o InfraOps AI faça sweeps, priorize exceções e, futuramente, execute self-healing governado por tenant. Isso aumenta escala sem transformar a operação em uma coleção de scripts inseguros.”

## 11. Regras de claim comercial

Enquanto etapas 21–24 estiverem `PLANNED`, não utilizar:
- “já executa self-healing”;
- “manutenção autônoma disponível”;
- “gerencia goals automaticamente em produção”.

Pode utilizar:
- “roadmap de autonomia governada”;
- “próxima geração do InfraOps AI”;
- “arquitetura preparada para schedules, triggers e self-healing”;
- “visão de NOC autônomo governado”.
