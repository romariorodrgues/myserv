#!/bin/bash

# MyServ - Script de Instalação para EC2 Amazon Linux t2.micro
# Autor: Romário Rodrigues <romariorodrigues.dev@gmail.com>
# Data: 16 de julho de 2025

set -e

echo "🚀 MyServ - Instalação Automatizada para Amazon Linux EC2"
echo "========================================================"
echo "Autor: Romário Rodrigues"
echo "Instância: t2.micro"
echo "OS: Amazon Linux 2"
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

# Verificar se está rodando como root
if [[ $EUID -eq 0 ]]; then
   error "Este script não deve ser executado como root. Use um usuário comum."
   exit 1
fi

# 1. Atualizar sistema
log "Atualizando sistema..."
sudo yum update -y

# 2. Resolver conflitos de curl e instalar dependências
log "Resolvendo conflitos do curl..."
# Primeiro, tentar resolver conflitos do curl
sudo yum remove -y curl-minimal || true
sudo yum install -y git wget htop

# Instalar curl sem conflitos
log "Instalando curl..."
sudo yum install -y curl --allowerasing || {
    warn "Falha na instalação padrão do curl, tentando com --skip-broken..."
    sudo yum install -y curl --skip-broken || {
        warn "Instalação do curl falhou, mas continuando (wget está disponível)..."
    }
}

# 3. Instalar Node.js 18+ (via NodeSource)
log "Instalando Node.js 18..."
curl -fsSL https://rpm.nodesource.com/setup_18.x | sudo bash -
sudo yum install -y nodejs

# Verificar versão do Node.js
node_version=$(node --version)
log "Node.js instalado: $node_version"

# 4. Instalar PM2 globalmente
log "Instalando PM2 para gerenciamento de processos..."
sudo npm install -g pm2

# 5. Instalar Nginx
log "Instalando Nginx..."
sudo yum install -y nginx

# 6. Configurar firewall (Security Groups já devem estar configurados)
log "Configurando firewall local..."
sudo yum install -y firewalld
sudo systemctl enable firewalld
sudo systemctl start firewalld
sudo firewall-cmd --permanent --add-service=http
sudo firewall-cmd --permanent --add-service=https
sudo firewall-cmd --permanent --add-port=3000/tcp
sudo firewall-cmd --reload

# 7. Criar diretório da aplicação
log "Criando diretório da aplicação..."
sudo mkdir -p /var/www/myserv
sudo chown -R $USER:$USER /var/www/myserv

# 8. Clonar repositório
log "Clonando repositório MyServ..."
cd /var/www/myserv
git clone https://github.com/romariorodrgues/myserv.git .

# 9. Instalar dependências do projeto
log "Instalando dependências do projeto..."
npm install

# 10. Configurar variáveis de ambiente
log "Configurando variáveis de ambiente..."
cat > .env << EOL
# Production Environment Configuration
NODE_ENV=production

# Database (SQLite para simplicidade)
DATABASE_URL="file:./prisma/prod.db"

# NextAuth.js
NEXTAUTH_URL="http://$(curl -s http://169.254.169.254/latest/meta-data/public-ipv4):3000"
NEXTAUTH_SECRET="$(openssl rand -base64 32)"

# Google Maps (opcional - configure depois)
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY="your-google-maps-key"

# MercadoPago (opcional - configure depois)
MERCADOPAGO_ACCESS_TOKEN="TEST-your-mercadopago-token"
NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY="TEST-your-mercadopago-public-key"

# WhatsApp/ChatPro (opcional - configure depois)
CHATPRO_API_KEY="your-chatpro-key"
CHATPRO_INSTANCE_ID="your-instance-id"

# Upload
UPLOAD_DIR="public/uploads"
EOL

# 11. Configurar banco de dados
log "Configurando banco de dados..."
npx prisma generate
npx prisma db push
npm run db:seed

# 12. Construir aplicação
log "Construindo aplicação para produção..."
npm run build

# 13. Configurar PM2
log "Configurando PM2..."
cat > ecosystem.config.js << 'EOL'
module.exports = {
  apps: [{
    name: 'myserv',
    script: 'npm',
    args: 'start',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    }
  }]
}
EOL

# 14. Configurar Nginx
log "Configurando Nginx..."
sudo tee /etc/nginx/conf.d/myserv.conf > /dev/null << 'EOL'
server {
    listen 80;
    server_name _;
    
    client_max_body_size 50M;
    
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
        proxy_read_timeout 86400;
    }
    
    location /uploads/ {
        alias /var/www/myserv/public/uploads/;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
    
    location /_next/static/ {
        alias /var/www/myserv/.next/static/;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
EOL

# 15. Iniciar serviços
log "Iniciando serviços..."
sudo systemctl enable nginx
sudo systemctl start nginx
sudo systemctl reload nginx

# 16. Iniciar aplicação com PM2
log "Iniciando aplicação com PM2..."
pm2 start ecosystem.config.js
pm2 save
pm2 startup

# 17. Configurar SSL com Certbot (opcional)
log "Instalando Certbot para SSL..."
sudo yum install -y certbot python3-certbot-nginx

# 18. Verificar status
log "Verificando status dos serviços..."
sudo systemctl status nginx --no-pager
pm2 status

# 19. Mostrar informações finais
PUBLIC_IP=$(curl -s http://169.254.169.254/latest/meta-data/public-ipv4)
log "=========================================="
log "🎉 INSTALAÇÃO CONCLUÍDA COM SUCESSO!"
log "=========================================="
log "Aplicação MyServ instalada em: /var/www/myserv"
log "URL de acesso: http://$PUBLIC_IP"
log "Porta interna: 3000"
log ""
log "👥 Usuários de teste:"
log "Admin: admin@myserv.com / admin123"
log "Cliente: cliente@teste.com / cliente123"
log "Profissional: profissional@teste.com / provider123"
log ""
log "🔧 Comandos úteis:"
log "- Ver logs da aplicação: pm2 logs myserv"
log "- Reiniciar aplicação: pm2 restart myserv"
log "- Parar aplicação: pm2 stop myserv"
log "- Status do Nginx: sudo systemctl status nginx"
log "- Reiniciar Nginx: sudo systemctl restart nginx"
log ""
log "🔒 Para configurar SSL:"
log "sudo certbot --nginx -d seu-dominio.com"
log ""
log "⚠️  Lembre-se de configurar o Security Group para permitir:"
log "- HTTP (80)"
log "- HTTPS (443)"
log "- SSH (22)"
log ""
log "✅ Instalação finalizada!"
