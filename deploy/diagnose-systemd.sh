#!/bin/bash

# MyServ - Diagnóstico e Correção de Problemas do systemd
# Autor: Romário Rodrigues <romariorodrigues.dev@gmail.com>

echo "🔍 Diagnóstico de Problemas do systemd"
echo "====================================="
echo ""

# Cores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log() { echo -e "${GREEN}[INFO]${NC} $1"; }
warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
error() { echo -e "${RED}[ERROR]${NC} $1"; }
info() { echo -e "${BLUE}[DEBUG]${NC} $1"; }

log "Verificando sistema de init..."

# 1. Verificar PID 1
info "PID 1 atual:"
ps -p 1 -o comm= 2>/dev/null || echo "Não foi possível verificar PID 1"

# 2. Verificar se systemd está presente
info "Verificando systemd:"
if [ -f /run/systemd/system ]; then
    echo "✅ /run/systemd/system existe"
else
    echo "❌ /run/systemd/system não existe"
fi

if command -v systemctl >/dev/null 2>&1; then
    echo "✅ systemctl comando existe"
else
    echo "❌ systemctl comando não encontrado"
fi

# 3. Testar systemctl
info "Testando systemctl:"
if systemctl is-system-running >/dev/null 2>&1; then
    echo "✅ systemd está funcionando"
    SYSTEMD_WORKING=true
else
    echo "❌ systemd não está funcionando"
    SYSTEMD_WORKING=false
fi

# 4. Verificar container/ambiente
info "Verificando ambiente:"
if [ -f /.dockerenv ]; then
    warn "🐳 Executando em container Docker"
elif [ -n "$container" ]; then
    warn "📦 Executando em container ($container)"
elif grep -q "container=lxc" /proc/1/environ 2>/dev/null; then
    warn "📦 Executando em container LXC"
else
    echo "✅ Executando em máquina virtual/física"
fi

# 5. Verificar serviços alternativos
info "Verificando sistemas de init alternativos:"

if [ -f /sbin/upstart ]; then
    echo "✅ Upstart disponível"
fi

if [ -f /etc/init.d/rcS ]; then
    echo "✅ SysV init disponível"
fi

if command -v service >/dev/null 2>&1; then
    echo "✅ Comando 'service' disponível"
fi

echo ""
echo "🔧 RECOMENDAÇÕES:"
echo "=================="

if [ "$SYSTEMD_WORKING" = true ]; then
    log "systemd está funcionando! Pode usar instalação normal:"
    echo "   wget https://raw.githubusercontent.com/romariorodrgues/myserv/main/deploy/ec2-setup-ultra-simple.sh"
    echo "   chmod +x ec2-setup-ultra-simple.sh"
    echo "   ./ec2-setup-ultra-simple.sh"
else
    warn "systemd não está funcionando. Use instalação alternativa:"
    echo "   wget https://raw.githubusercontent.com/romariorodrgues/myserv/main/deploy/ec2-setup-no-systemd.sh"
    echo "   chmod +x ec2-setup-no-systemd.sh"
    echo "   ./ec2-setup-no-systemd.sh"
fi

echo ""
echo "🛠️ SOLUÇÕES ALTERNATIVAS:"
echo "=========================="
echo ""
echo "1. Reiniciar instância EC2:"
echo "   • Às vezes resolve problemas temporários do systemd"
echo ""
echo "2. Verificar se é uma AMI específica:"
echo "   • Algumas AMIs personalizadas podem ter systemd desabilitado"
echo ""
echo "3. Usar scripts sem systemd:"
echo "   • Nossos scripts alternativos funcionam com qualquer init system"
echo ""

# Executar automaticamente a solução apropriada
echo "🚀 EXECUTAR SOLUÇÃO AUTOMATICAMENTE?"
echo "===================================="
read -p "Deseja executar a instalação apropriada agora? (s/n): " -n 1 -r
echo
if [[ $REPLY =~ ^[Ss]$ ]]; then
    if [ "$SYSTEMD_WORKING" = true ]; then
        log "Executando instalação com systemd..."
        wget -qO- https://raw.githubusercontent.com/romariorodrgues/myserv/main/deploy/ec2-setup-ultra-simple.sh | bash
    else
        log "Executando instalação sem systemd..."
        wget -qO- https://raw.githubusercontent.com/romariorodrgues/myserv/main/deploy/ec2-setup-no-systemd.sh | bash
    fi
else
    log "OK, você pode executar manualmente depois."
fi
