#!/bin/sh
set -e

echo "===================================================="
echo "⚡ InfraOps AI - Instalação Automática do Agente Linux"
echo "===================================================="

TOKEN=""
while [ "$#" -gt 0 ]; do
  case "$1" in
    --enroll-token) TOKEN="$2"; shift 2 ;;
    *) shift ;;
  esac
done

if [ -z "$TOKEN" ]; then
  echo "[ERRO] Token de enrollment não fornecido. Use: --enroll-token <TOKEN>"
  exit 1
fi

echo "[1/4] Criando diretórios protegidos do agente (0700)..."
mkdir -p /var/lib/infraops-agent
chmod 0700 /var/lib/infraops-agent

echo "[2/4] Baixando binário mais recente do infraops-agent..."
# Simulated download
echo "#!/bin/sh\necho '[AGENT] Initializing InfraOps Agent with token $TOKEN...'\necho '[AGENT] Host machine_id hash generated.'\necho '[AGENT] Enrollment successful. Outbound heartbeat active.'" > /var/lib/infraops-agent/infraops-agent
chmod +x /var/lib/infraops-agent/infraops-agent

echo "[3/4] Executando registro inicial (Enrollment)..."
/var/lib/infraops-agent/infraops-agent --enroll-token "$TOKEN"

echo "[4/4] Sucesso! O Agente Go do InfraOps AI está cadastrado e ativo em segundo plano."
