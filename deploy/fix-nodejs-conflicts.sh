#!/bin/bash

# MyServ - Resolução de Conflitos do Node.js
# Autor: Romário Rodrigues <romariorodrigues.dev@gmail.com>

set -e

echo "🔧 Resolvendo Conflitos do Node.js"
echo "=================================="
echo ""

# Cores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log() { echo -e "${GREEN}[INFO]${NC} $1"; }
warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
error() { echo -e "${RED}[ERROR]${NC} $1"; }
success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }

# Verificar o que está instalado
log "Verificando instalações existentes..."
yum list installed | grep -i node || echo "Nenhum pacote Node.js encontrado"

# Opção 1: Usar Node.js 20 já instalado
log "Verificando Node.js disponível..."
if command -v node &> /dev/null; then
    NODE_VERSION=$(node --version)
    success "Node.js encontrado: $NODE_VERSION"
    
    if command -v npm &> /dev/null; then
        NPM_VERSION=$(npm --version)
        success "npm encontrado: $NPM_VERSION"
        
        log "✅ Node.js e npm estão funcionais!"
        log "Continuando com instalação do MyServ usando versão existente..."
        
        # Baixar e executar script ultra simplificado
        wget -qO- https://raw.githubusercontent.com/romariorodrgues/myserv/main/deploy/ec2-setup-ultra-simple.sh | bash
        exit 0
    fi
fi

# Opção 2: Remover tudo e reinstalar
warn "Node.js não está funcional. Tentando limpeza completa..."

log "Removendo instalações conflitantes..."
sudo yum remove -y nodejs* npm* || true
sudo yum autoremove -y || true

log "Limpando cache..."
sudo yum clean all

log "Instalando Node.js do repositório Amazon Linux..."
sudo yum install -y nodejs npm

# Verificar instalação
if command -v node &> /dev/null && command -v npm &> /dev/null; then
    NODE_VERSION=$(node --version)
    NPM_VERSION=$(npm --version)
    success "✅ Node.js instalado: $NODE_VERSION"
    success "✅ npm instalado: $NPM_VERSION"
    
    log "Continuando com instalação do MyServ..."
    wget -qO- https://raw.githubusercontent.com/romariorodrgues/myserv/main/deploy/ec2-setup-ultra-simple.sh | bash
else
    error "❌ Falha na instalação do Node.js!"
    
    log "Tentando método alternativo com NVM..."
    
    # Instalar NVM como último recurso
    curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
    source ~/.bashrc
    nvm install --lts
    nvm use --lts
    
    if command -v node &> /dev/null; then
        success "✅ Node.js instalado via NVM!"
        wget -qO- https://raw.githubusercontent.com/romariorodrgues/myserv/main/deploy/ec2-setup-ultra-simple.sh | bash
    else
        error "❌ Todas as tentativas falharam!"
        echo ""
        echo "📋 SOLUÇÃO MANUAL:"
        echo "=================="
        echo "1. Reinicie a instância EC2"
        echo "2. Tente novamente com:"
        echo "   wget https://raw.githubusercontent.com/romariorodrgues/myserv/main/deploy/ec2-setup-ultra-simple.sh"
        echo "   chmod +x ec2-setup-ultra-simple.sh"
        echo "   ./ec2-setup-ultra-simple.sh"
        exit 1
    fi
fi
