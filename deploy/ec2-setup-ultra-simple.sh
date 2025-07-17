#!/bin/bash

# MyServ - Script ULTRA SIMPLIFICADO sem conflitos
# Autor: Romário Rodrigues <romariorodrigues.dev@gmail.com>
# Para usar quando há múltiplos conflitos de pacotes

set -e

echo "🚀 MyServ - Instalação ULTRA SIMPLIFICADA"
echo "========================================="
echo "Usando Node.js já instalado no sistema"
echo ""

# Cores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log() { echo -e "${GREEN}[INFO]${NC} $1"; }
warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
error() { echo -e "${RED}[ERROR]${NC} $1"; }

# Verificar Node.js existente
log "Verificando Node.js instalado..."
if command -v node &> /dev/null; then
    NODE_VERSION=$(node --version)
    log "Node.js encontrado: $NODE_VERSION"
else
    error "Node.js não encontrado! Instalando versão do sistema..."
    sudo yum install -y nodejs npm
fi

# Verificar npm
if command -v npm &> /dev/null; then
    NPM_VERSION=$(npm --version)
    log "npm encontrado: $NPM_VERSION"
else
    error "npm não encontrado!"
    exit 1
fi

# 1. Atualizar sistema (apenas se necessário)
log "Verificando atualizações do sistema..."
sudo yum update -y --security || sudo yum update -y

# 2. Instalar apenas dependências básicas
log "Instalando dependências básicas..."
sudo yum install -y git wget htop

# 3. Instalar PM2 (se não existir)
log "Verificando PM2..."
if ! command -v pm2 &> /dev/null; then
    log "Instalando PM2..."
    sudo npm install -g pm2
else
    log "PM2 já instalado: $(pm2 --version)"
fi

# 4. Configurar Nginx
log "Configurando Nginx..."
sudo yum install -y nginx

# Criar configuração do Nginx
sudo tee /etc/nginx/conf.d/myserv.conf > /dev/null <<'EOF'
server {
    listen 80;
    server_name _;

    # Aumentar timeout para t2.micro
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

# Habilitar e iniciar Nginx
sudo systemctl enable nginx
sudo systemctl start nginx

# 5. Baixar MyServ
log "Baixando MyServ..."
cd /home/ec2-user

# Remover instalação anterior se existir
if [ -d "myserv" ]; then
    log "Removendo instalação anterior..."
    rm -rf myserv
fi

# Clonar repositório usando git (mais confiável)
log "Clonando repositório..."
git clone https://github.com/romariorodrgues/myserv.git
cd myserv

# 6. Instalar dependências do projeto
log "Instalando dependências do projeto..."
npm install --production

# 7. Configurar banco de dados
log "Configurando banco de dados..."
npx prisma generate
npx prisma db push

# Criar dados de teste
log "Criando dados de teste..."
npx prisma db seed || {
    warn "Falha no seed, mas continuando..."
}

# 8. Parar PM2 anterior se existir
log "Configurando PM2..."
pm2 delete myserv 2>/dev/null || true

# 9. Iniciar aplicação com otimizações para t2.micro
log "Iniciando aplicação..."
# Usar menos memória para t2.micro
pm2 start npm --name "myserv" -- start --node-args="--max-old-space-size=256"

# Configurar PM2 para inicializar com o sistema
pm2 startup
pm2 save

# 10. Verificar instalação
log "Verificando instalação..."
sleep 5

# Status dos serviços
echo ""
echo "📊 STATUS DOS SERVIÇOS:"
echo "======================"
pm2 status
echo ""
sudo systemctl status nginx --no-pager -l || true

# Testar aplicação
log "Testando aplicação..."
if curl -f http://localhost:3000 > /dev/null 2>&1; then
    echo "✅ Aplicação respondendo na porta 3000"
else
    warn "⚠️ Aplicação pode não estar respondendo ainda"
fi

# IP público
PUBLIC_IP=$(wget -qO- http://checkip.amazonaws.com 2>/dev/null || echo "IP-NAO-ENCONTRADO")

echo ""
echo "🎉 INSTALAÇÃO CONCLUÍDA!"
echo "======================="
echo ""
echo "🌐 Acesse sua aplicação:"
echo "   http://$PUBLIC_IP"
echo ""
echo "👥 Usuários de teste:"
echo "   • Admin: admin@myserv.com / admin123"
echo "   • Cliente: cliente@teste.com / cliente123"
echo ""
echo "🔧 Comandos úteis:"
echo "   • pm2 status                     - Status da aplicação"
echo "   • pm2 logs myserv               - Logs da aplicação"
echo "   • pm2 restart myserv            - Reiniciar aplicação"
echo "   • sudo systemctl status nginx   - Status do Nginx"
echo ""
echo "📱 Sistema otimizado para t2.micro!"
