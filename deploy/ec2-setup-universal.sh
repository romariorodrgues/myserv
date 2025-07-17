#!/bin/bash

# MyServ - Script UNIVERSAL com detecção automática de usuário
# Autor: Romário Rodrigues <romariorodrigues.dev@gmail.com>
# Para qualquer usuário e sistema

set -e

echo "🚀 MyServ - Instalação UNIVERSAL"
echo "================================"
echo "Detecta automaticamente usuário e sistema"
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

# Detectar usuário e diretório home
log "Detectando ambiente..."
CURRENT_USER=$(whoami)
CURRENT_HOME=$(eval echo ~$CURRENT_USER)
WORK_DIR="$CURRENT_HOME"

info "Usuário atual: $CURRENT_USER"
info "Diretório home: $CURRENT_HOME"

# Verificar se o diretório home existe
if [ ! -d "$CURRENT_HOME" ]; then
    warn "Diretório home não existe! Criando..."
    sudo mkdir -p "$CURRENT_HOME"
    sudo chown "$CURRENT_USER:$CURRENT_USER" "$CURRENT_HOME" 2>/dev/null || true
fi

# Se ainda não existe, usar /tmp
if [ ! -d "$CURRENT_HOME" ] || [ ! -w "$CURRENT_HOME" ]; then
    warn "Usando /tmp como diretório de trabalho"
    WORK_DIR="/tmp"
fi

info "Diretório de trabalho: $WORK_DIR"

# Detectar sistema operacional
if [ -f /etc/os-release ]; then
    . /etc/os-release
    OS_NAME="$ID"
    OS_VERSION="$VERSION_ID"
else
    OS_NAME="unknown"
    OS_VERSION="unknown"
fi

info "Sistema: $OS_NAME $OS_VERSION"

# Detectar gerenciador de pacotes
if command -v yum >/dev/null 2>&1; then
    PKG_MANAGER="yum"
elif command -v apt >/dev/null 2>&1; then
    PKG_MANAGER="apt"
elif command -v dnf >/dev/null 2>&1; then
    PKG_MANAGER="dnf"
else
    error "Gerenciador de pacotes não suportado!"
    exit 1
fi

info "Gerenciador de pacotes: $PKG_MANAGER"

# Função para instalar pacotes
install_package() {
    local package=$1
    log "Instalando $package..."
    
    case $PKG_MANAGER in
        yum)
            sudo yum install -y "$package"
            ;;
        apt)
            sudo apt-get update && sudo apt-get install -y "$package"
            ;;
        dnf)
            sudo dnf install -y "$package"
            ;;
    esac
}

# Verificar Node.js existente
log "Verificando Node.js..."
if command -v node &> /dev/null; then
    NODE_VERSION=$(node --version)
    log "Node.js encontrado: $NODE_VERSION"
else
    log "Instalando Node.js..."
    if [ "$PKG_MANAGER" = "yum" ]; then
        install_package "nodejs npm"
    elif [ "$PKG_MANAGER" = "apt" ]; then
        install_package "nodejs npm"
    fi
fi

# Verificar npm
if command -v npm &> /dev/null; then
    NPM_VERSION=$(npm --version)
    log "npm encontrado: $NPM_VERSION"
else
    error "npm não encontrado após instalação!"
    exit 1
fi

# 1. Atualizar sistema
log "Atualizando sistema..."
case $PKG_MANAGER in
    yum)
        sudo yum update -y
        ;;
    apt)
        sudo apt-get update && sudo apt-get upgrade -y
        ;;
    dnf)
        sudo dnf update -y
        ;;
esac

# 2. Instalar dependências básicas
log "Instalando dependências básicas..."
if [ "$PKG_MANAGER" = "yum" ]; then
    install_package "git wget htop"
elif [ "$PKG_MANAGER" = "apt" ]; then
    install_package "git wget htop"
fi

# 3. Instalar PM2
log "Instalando PM2..."
if ! command -v pm2 &> /dev/null; then
    sudo npm install -g pm2
else
    log "PM2 já instalado: $(pm2 --version)"
fi

# 4. Instalar e configurar Nginx
log "Instalando Nginx..."
if [ "$PKG_MANAGER" = "yum" ]; then
    install_package "nginx"
elif [ "$PKG_MANAGER" = "apt" ]; then
    install_package "nginx"
fi

# 5. Configurar Nginx
log "Configurando Nginx..."
sudo tee /etc/nginx/conf.d/myserv.conf > /dev/null <<'EOF'
server {
    listen 80;
    server_name _;

    # Configurações otimizadas
    client_max_body_size 50M;
    proxy_connect_timeout 60s;
    proxy_send_timeout 60s;
    proxy_read_timeout 60s;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
EOF

# Detectar e iniciar Nginx
log "Iniciando Nginx..."
if command -v systemctl >/dev/null 2>&1 && systemctl is-system-running >/dev/null 2>&1; then
    sudo systemctl enable nginx
    sudo systemctl start nginx
    log "Nginx iniciado via systemd"
elif command -v service >/dev/null 2>&1; then
    sudo service nginx start
    log "Nginx iniciado via service"
else
    sudo nginx
    log "Nginx iniciado diretamente"
fi

# 6. Baixar MyServ no diretório correto
log "Baixando MyServ em $WORK_DIR..."
cd "$WORK_DIR"

if [ -d "myserv" ]; then
    log "Removendo instalação anterior..."
    rm -rf myserv
fi

# Clonar repositório
log "Clonando repositório MyServ..."
git clone https://github.com/romariorodrgues/myserv.git
cd myserv

# 7. Instalar dependências do projeto
log "Instalando dependências do projeto..."
npm install --production

# 8. Configurar banco de dados
log "Configurando banco de dados..."
npx prisma generate
npx prisma db push

# Criar dados de teste
log "Criando dados de teste..."
npx prisma db seed || {
    warn "Falha no seed, mas continuando..."
}

# 9. Configurar PM2
log "Configurando PM2..."
pm2 delete myserv 2>/dev/null || true

# 10. Iniciar aplicação
log "Iniciando aplicação..."
pm2 start npm --name "myserv" -- start --node-args="--max-old-space-size=256"

# Configurar auto-start
log "Configurando auto-start..."
if command -v systemctl >/dev/null 2>&1 && systemctl is-system-running >/dev/null 2>&1; then
    pm2 startup
    pm2 save
    log "PM2 auto-start via systemd"
else
    # Método alternativo via crontab
    crontab -l 2>/dev/null | grep -v "pm2 resurrect" | crontab - 2>/dev/null || true
    (crontab -l 2>/dev/null; echo "@reboot cd $WORK_DIR/myserv && pm2 resurrect") | crontab -
    pm2 save
    log "PM2 auto-start via crontab"
fi

# 11. Criar script de monitoramento
log "Criando script de monitoramento..."
cat > "$WORK_DIR/health-check.sh" << EOF
#!/bin/bash

# Script de monitoramento MyServ
# Usuário: $CURRENT_USER
# Diretório: $WORK_DIR

check_nginx() {
    if pgrep nginx > /dev/null; then
        echo "✅ Nginx: OK"
    else
        echo "❌ Nginx: DOWN - Tentando reiniciar..."
        if command -v systemctl >/dev/null 2>&1 && systemctl is-system-running >/dev/null 2>&1; then
            sudo systemctl start nginx
        elif command -v service >/dev/null 2>&1; then
            sudo service nginx start
        else
            sudo nginx
        fi
    fi
}

check_myserv() {
    if pm2 status | grep -q "online"; then
        echo "✅ MyServ: OK"
    else
        echo "❌ MyServ: DOWN - Reiniciando..."
        cd $WORK_DIR/myserv
        pm2 resurrect
    fi
}

echo "🔍 Verificação de Saúde - \$(date)"
echo "Usuário: $CURRENT_USER"
echo "Diretório: $WORK_DIR"
echo ""
check_nginx
check_myserv
EOF

chmod +x "$WORK_DIR/health-check.sh"

# 12. Detectar IP público
log "Detectando IP público..."
PUBLIC_IP=""
if command -v curl >/dev/null 2>&1; then
    PUBLIC_IP=$(curl -s http://checkip.amazonaws.com 2>/dev/null || echo "")
fi
if [ -z "$PUBLIC_IP" ] && command -v wget >/dev/null 2>&1; then
    PUBLIC_IP=$(wget -qO- http://checkip.amazonaws.com 2>/dev/null || echo "")
fi
if [ -z "$PUBLIC_IP" ]; then
    PUBLIC_IP="SEU-IP-PUBLICO"
fi

# 13. Verificação final
log "Verificação final..."
sleep 5

echo ""
echo "📊 RESUMO DA INSTALAÇÃO:"
echo "======================="
echo "• Usuário: $CURRENT_USER"
echo "• Sistema: $OS_NAME $OS_VERSION"
echo "• Diretório: $WORK_DIR/myserv"
echo "• Gerenciador: $PKG_MANAGER"
echo ""

# Status dos serviços
echo "📊 STATUS DOS SERVIÇOS:"
echo "======================"
pm2 status
echo ""

if pgrep nginx > /dev/null; then
    echo "✅ Nginx: Rodando"
else
    echo "❌ Nginx: Verificar manualmente"
fi

# Testar aplicação
log "Testando aplicação..."
if command -v curl >/dev/null 2>&1 && curl -f http://localhost:3000 > /dev/null 2>&1; then
    echo "✅ Aplicação respondendo na porta 3000"
elif command -v wget >/dev/null 2>&1 && wget -q --spider http://localhost:3000; then
    echo "✅ Aplicação respondendo na porta 3000"
else
    warn "⚠️ Aplicação pode não estar respondendo ainda (aguarde alguns segundos)"
fi

echo ""
echo "🎉 INSTALAÇÃO UNIVERSAL CONCLUÍDA!"
echo "=================================="
echo ""
echo "🌐 Acesse sua aplicação:"
echo "   http://$PUBLIC_IP"
echo ""
echo "👥 Usuários de teste:"
echo "   • Admin: admin@myserv.com / admin123"
echo "   • Cliente: cliente@teste.com / cliente123"
echo ""
echo "🔧 Comandos úteis:"
echo "   • pm2 status                 - Status da aplicação"
echo "   • pm2 logs myserv           - Logs da aplicação"
echo "   • pm2 restart myserv        - Reiniciar aplicação"
echo "   • $WORK_DIR/health-check.sh - Verificar saúde"
echo ""
echo "📁 Arquivos importantes:"
echo "   • Projeto: $WORK_DIR/myserv"
echo "   • Monitoramento: $WORK_DIR/health-check.sh"
echo ""
