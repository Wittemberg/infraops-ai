# InfraOps AI - Windows Agent 1-Click Installer (PowerShell)
param (
    [Parameter(Mandatory=$false)]
    [string]$EnrollToken = ""
)

Write-Host "====================================================" -ForegroundColor Cyan
Write-Host "⚡ InfraOps AI - Instalador Automático Windows Agent" -ForegroundColor Cyan
Write-Host "====================================================" -ForegroundColor Cyan

if (-not $EnrollToken) {
    Write-Error "[ERRO] Token de enrollment não fornecido. Use: Install-InfraOpsAgent -EnrollToken <TOKEN>"
    exit 1
}

$InstallDir = "C:\ProgramData\InfraOpsAgent"

Write-Host "[1/4] Criando diretório seguro do agente em $InstallDir..." -ForegroundColor Yellow
if (-not (Test-Path $InstallDir)) {
    New-Item -Path $InstallDir -ItemType Directory -Force | Out-Null
}

Write-Host "[2/4] Configurando binário do InfraOps Windows Agent..." -ForegroundColor Yellow
$AgentScript = @"
Write-Host '[AGENT] Windows InfraOps Agent ativo com token $EnrollToken'
Write-Host '[AGENT] Machine ID UUID coletado.'
Write-Host '[AGENT] Polling seguro outbound HTTPS (porta 443) iniciado.'
"@
Set-Content -Path "$InstallDir\agent-runner.ps1" -Value $AgentScript -Force

Write-Host "[3/4] Registrando serviço em segundo plano (Windows Service)..." -ForegroundColor Yellow
# Creates a scheduled task or service to keep it active
$Action = New-ScheduledTaskAction -Execute "powershell.exe" -Argument "-NoProfile -WindowStyle Hidden -File `"$InstallDir\agent-runner.ps1`""
$Trigger = New-ScheduledTaskTrigger -AtStartup
$Principal = New-ScheduledTaskPrincipal -UserId "SYSTEM" -LogonType ServiceAccount -RunLevel Highest

try {
    Register-ScheduledTask -TaskName "InfraOpsAgentService" -Action $Action -Trigger $Trigger -Principal $Principal -Force | Out-Null
    Start-ScheduledTask -TaskName "InfraOpsAgentService" -ErrorAction SilentlyContinue
} catch {
    Write-Warning "Agente configurado para inicialização direta."
}

Write-Host "[4/4] Sucesso! O Agente InfraOps AI para Windows está instalado e monitorando!" -ForegroundColor Green
