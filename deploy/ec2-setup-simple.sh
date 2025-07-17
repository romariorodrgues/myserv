#!/bin/bash

# MyServ - Script de Instalação SIMPLIFICADO (sem curl)
# Autor: Romário Rodrigues <romariorodrigues.dev@gmail.com>
# Para usar quando há conflitos de curl

set -e

echo "🚀 MyServ - Instalação SIMPLIFICADA (Amazon Linux EC2)"
echo "====================================================="
echo "Versão sem conflitos de curl"
echo ""

# Cores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log() { echo -e "${GREEN}[INFO]${NC} $1"; }
warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
error() { echo -e "${RED}[ERROR]${NC} $1"; }

# Verificar se wget está disponível
if ! command -v wget &> /dev/null; then
    error "wget é necessário mas não está instalado!"
    exit 1
fi

# 1. Atualizar sistema
log "Atualizando sistema..."
sudo yum update -y

# 2. Instalar apenas dependências essenciais (SEM curl)
log "Instalando dependências básicas..."
sudo yum install -y git wget htop vim-enhanced

# 3. Instalar Node.js 18+ 
log "Instalando Node.js 18..."
cd /tmp
wget -q https://rpm.nodesource.com/setup_18.x -O setup_nodejs.sh
sudo bash setup_nodejs.sh
sudo yum install -y nodejs

# Verificar instalação
node_version=$(node --version 2>/dev/null || echo "falha")
npm_version=$(npm --version 2>/dev/null || echo "falha")

if [[ "$node_version" == "falha" ]]; then
    error "Falha na instalação do Node.js!"
    exit 1
fi

log "Node.js instalado: $node_version"
log "npm instalado: $npm_version"

# 4. Instalar PM2
log "Instalando PM2..."
sudo npm install -g pm2

# 5. Configurar Nginx
log "Instalando e configurando Nginx..."
sudo yum install -y nginx

# Configuração básica do Nginx
sudo tee /etc/nginx/conf.d/myserv.conf > /dev/null <<'EOF'
server {
    listen 80;
    server_name _;

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

# 6. Baixar e configurar MyServ
log "Baixando MyServ..."
cd /home/ec2-user
if [ -d "myserv" ]; then
    rm -rf myserv
fi

# Usar wget para baixar o projeto
wget -q https://github.com/romariorodrgues/myserv/archive/refs/heads/main.zip -O myserv.zip
unzip -q myserv.zip
mv myserv-main myserv
rm myserv.zip
cd myserv

# 7. Instalar dependências do projeto
log "Instalando dependências do projeto..."
npm install

# 8. Configurar banco de dados
log "Configurando banco de dados..."
npx prisma generate
npx prisma db push
npx prisma db seed

# 9. Configurar PM2
log "Configurando PM2..."
pm2 start npm --name "myserv" -- start
pm2 startup
pm2 save

# 10. Otimizações para t2.micro
log "Aplicando otimizações para t2.micro..."
# Limitar uso de memória do Node.js
pm2 delete myserv
pm2 start npm --name "myserv" -- start --node-args="--max-old-space-size=300"
pm2 save

echo ""
echo "🎉 INSTALAÇÃO CONCLUÍDA COM SUCESSO!"
echo "===================================="
echo ""
echo "📝 Próximos passos:"
echo "1. Configurar Security Group (porta 80)"
echo "2. Acessar: http://$(wget -qO- http://checkip.amazonaws.com)"
echo ""
echo "👥 Usuários de teste:"
echo "• Admin: admin@myserv.com / admin123"
echo "• Cliente: cliente@teste.com / cliente123"
echo ""
echo "🔧 Comandos úteis:"
echo "• pm2 status          - Status da aplicação"
echo "• pm2 logs myserv     - Logs da aplicação"
echo "• sudo systemctl status nginx - Status do Nginx"
echo ""
