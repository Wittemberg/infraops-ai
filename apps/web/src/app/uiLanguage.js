/**
 * Dicionário Canônico de Interface & Linguagem (Português-First)
 * InfraOps AI — Stage 28A
 */

export const UI_LANGUAGE = {
  // Navegação Principal
  nav: {
    home: { label: "Início", icon: "🏠", description: "Central de Operações Diárias e o que precisa de atenção" },
    customers: { label: "Clientes", icon: "🏢", description: "Gestão e visão consolidada por organização" },
    infrastructure: { label: "Infraestrutura", icon: "🖥️", description: "Servidores, nós Proxmox, VMs e inventário físico" },
    backups: { label: "Backups", icon: "💾", description: "Rotinas de proteção, RPO e retenção de dados" },
    network: { label: "Roteadores & WAN", icon: "🌐", description: "Links de internet, MikroTik, pfSense e comutação" },
    alerts: { label: "Canais de Alerta", icon: "🔔", description: "Notificações via WhatsApp, Chatwoot e Telegram" },
    assistant: { label: "Assistente IA", icon: "🤖", description: "Diagnósticos e consultas operacionais inteligentes" },
    automations: { label: "Automações", icon: "⚡", description: "Agendamentos, regras automáticas e Self-Healing" },
    recommendations: { label: "Recomendações", icon: "💡", description: "Melhorias estruturais e prevenção de falhas" },
    reports: { label: "Relatórios", icon: "📊", description: "Resumos executivos mensais e fichas de visita" },
    audit: { label: "Histórico & Auditoria", icon: "📜", description: "Trilha imutável de ações e aprovações" },
    settings: { label: "Configurações", icon: "⚙️", description: "Parâmetros gerais, integrações e segurança" },
  },

  // Modos de Exibição (ADR-023)
  modes: {
    simple: {
      name: "Modo Simples",
      shortName: "Simples",
      icon: "🟢",
      description: "Foco no dia a dia com linguagem direta e ações essenciais.",
    },
    technical: {
      name: "Modo Técnico",
      shortName: "Técnico",
      icon: "🛠️",
      description: "Exibição completa de métricas brutas, hashes criptográficos e parâmetros avançados.",
    },
  },

  // Termos Humanizados vs Técnicos
  terms: {
    tenant: { simple: "Cliente", technical: "Tenant / Organização" },
    node: { simple: "Servidor Principal", technical: "Host / Nó Hipervisor" },
    workload: { simple: "Máquina Virtual / Serviço", technical: "Workload (VM QEMU / LXC)" },
    action: { simple: "Ação de Manutenção", technical: "Governed Action Contract" },
    selfHealing: { simple: "Auto-Correção Segura", technical: "Autonomous Policy Engine (Níveis 0-5)" },
    rpo: { simple: "Tempo Máximo sem Backup", technical: "Recovery Point Objective (RPO)" },
    wanFailover: { simple: "Troca Segura de Internet", technical: "Governed Route Distance / Gateway Switching" },
    antiFlapping: { simple: "Proteção contra Oscilação", technical: "Debounce & Circuit Breaker Engine" },
    sourceOfTruth: { simple: "Inventário da Infraestrutura", technical: "Physical & Logical Source of Truth" },
    spof: { simple: "Ponto Único de Falha", technical: "Single Point of Failure (SPOF)" },
  },

  // Ações Rápidas do Dia a Dia
  quickActions: {
    runBackup: "Fazer Backup Agora",
    restartService: "Reiniciar Serviço",
    switchWan: "Comutar Link de Internet",
    healthCheck: "Executar Verificação de Saúde",
    cleanLogs: "Liberar Espaço em Disco",
    generateReport: "Gerar Relatório do Cliente",
  },
};

export default UI_LANGUAGE;
