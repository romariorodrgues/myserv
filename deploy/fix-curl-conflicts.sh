#!/bin/bash

# MyServ - Script de Correção para Conflitos de Curl
# Autor: Romário Rodrigues <romariorodrigues.dev@gmail.com>
# Data: 17 de julho de 2025

set -e

echo "🔧 MyServ - Correção de Conflitos do Curl"
echo "=========================================="
echo "Resolvendo conflitos entre curl e curl-minimal..."
echo ""

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Função para log
log() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

# Verificar se wget está disponível
if ! command -v wget &> /dev/null; then
    error "wget não está disponível. Este é necessário para continuar."
    exit 1
fi

log "Verificando pacotes conflitantes..."
sudo yum list installed | grep curl || true

log "Removendo curl-minimal para resolver conflitos..."
sudo yum remove -y curl-minimal 2>/dev/null || {
    warn "curl-minimal não estava instalado ou falha na remoção"
}

log "Limpando cache do yum..."
sudo yum clean all

log "Tentando instalar curl com --allowerasing..."
if sudo yum install -y curl --allowerasing; then
    success "curl instalado com sucesso!"
elif sudo yum install -y curl --skip-broken; then
    success "curl instalado com --skip-broken!"
else
    warn "Falha na instalação do curl, mas wget está disponível para continuar"
fi

log "Instalando dependências essenciais restantes..."
sudo yum install -y git wget htop vim-enhanced || {
    warn "Algumas dependências podem ter falhado"
}

log "Verificando instalações..."
echo "Versões instaladas:"
echo "- git: $(git --version 2>/dev/null || echo 'não instalado')"
echo "- wget: $(wget --version 2>/dev/null | head -1 || echo 'não instalado')"
echo "- curl: $(curl --version 2>/dev/null | head -1 || echo 'não instalado')"

if command -v curl &> /dev/null || command -v wget &> /dev/null; then
    success "Pelo menos uma ferramenta de download está disponível!"
    log "Continuando com a instalação do MyServ..."
    
    # Baixar e executar o script principal
    if command -v curl &> /dev/null; then
        curl -fsSL https://raw.githubusercontent.com/romariorodrgues/myserv/main/deploy/ec2-setup.sh | bash
    else
        wget -qO- https://raw.githubusercontent.com/romariorodrgues/myserv/main/deploy/ec2-setup.sh | bash
    fi
else
    error "Nenhuma ferramenta de download está disponível!"
    exit 1
fi
