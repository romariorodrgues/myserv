#!/bin/bash

# MyServ - Script ALTERNATIVO sem systemd
# Autor: Romário Rodrigues <romariorodrigues.dev@gmail.com>
# Para sistemas sem systemd funcionando

set -e

echo "🚀 MyServ - Instalação SEM SYSTEMD"
echo "=================================="
echo "Para sistemas com problemas de systemd"
echo ""

# Cores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log() { echo -e "${GREEN}[INFO]${NC} $1"; }
warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
error() { echo -e "${RED}[ERROR]${NC} $1"; }

# Detectar sistema de init
log "Detectando sistema de init..."
if [ -f /run/systemd/system ]; then
    INIT_SYSTEM="systemd"
elif [ -f /sbin/init ] && /sbin/init --version 2>/dev/null | grep -q upstart; then
    INIT_SYSTEM="upstart"
elif [ -f /etc/init.d/rcS ]; then
    INIT_SYSTEM="sysv"
else
    INIT_SYSTEM="unknown"
fi

log "Sistema de init detectado: $INIT_SYSTEM"

# Verificar Node.js existente
log "Verificando Node.js instalado..."
if command -v node &> /dev/null; then
    NODE_VERSION=$(node --version)
    log "Node.js encontrado: $NODE_VERSION"
else
    log "Instalando Node.js..."
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

# 1. Atualizar sistema
log "Atualizando sistema..."
sudo yum update -y

# 2. Instalar dependências básicas
log "Instalando dependências básicas..."
sudo yum install -y git wget htop

# 3. Instalar PM2
log "Instalando PM2..."
if ! command -v pm2 &> /dev/null; then
    sudo npm install -g pm2
else
    log "PM2 já instalado: $(pm2 --version)"
fi

# 4. Instalar Nginx
log "Instalando Nginx..."
sudo yum install -y nginx

# 5. Configurar Nginx SEM systemd
log "Configurando Nginx..."

# Criar configuração do Nginx
sudo tee /etc/nginx/conf.d/myserv.conf > /dev/null <<'EOF'
server {
    listen 80;
    server_name _;

    # Configurações específicas para t2.micro
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

# Iniciar Nginx usando método compatível
log "Iniciando Nginx..."
if command -v systemctl >/dev/null 2>&1 && systemctl is-system-running >/dev/null 2>&1; then
    # systemd disponível e funcionando
    sudo systemctl enable nginx
    sudo systemctl start nginx
    log "Nginx iniciado via systemd"
elif [ "$INIT_SYSTEM" = "upstart" ]; then
    # Usar upstart
    sudo service nginx start
    log "Nginx iniciado via upstart"
else
    # Usar método tradicional
    sudo /etc/init.d/nginx start 2>/dev/null || sudo nginx
    log "Nginx iniciado via init.d/nginx direto"
fi

# Verificar se Nginx está rodando
if pgrep nginx > /dev/null; then
    log "✅ Nginx está rodando"
else
    warn "⚠️ Nginx pode não ter iniciado corretamente"
    # Tentar iniciar manualmente
    sudo nginx
fi

# 6. Baixar MyServ
log "Baixando MyServ..."
cd /home/ec2-user

if [ -d "myserv" ]; then
    log "Removendo instalação anterior..."
    rm -rf myserv
fi

# Clonar repositório
log "Clonando repositório..."
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

# 10. Iniciar aplicação com otimizações para t2.micro
log "Iniciando aplicação..."
pm2 start npm --name "myserv" -- start --node-args="--max-old-space-size=256"

# Configurar PM2 para auto-start (método compatível)
log "Configurando auto-start do PM2..."
if command -v systemctl >/dev/null 2>&1 && systemctl is-system-running >/dev/null 2>&1; then
    # systemd disponível
    pm2 startup
    pm2 save
    log "PM2 auto-start configurado via systemd"
else
    # Método alternativo - adicionar ao crontab
    warn "systemd não disponível, configurando via crontab..."
    
    # Remover entradas anteriores
    crontab -l 2>/dev/null | grep -v "pm2 resurrect" | crontab - 2>/dev/null || true
    
    # Adicionar nova entrada
    (crontab -l 2>/dev/null; echo "@reboot pm2 resurrect") | crontab -
    pm2 save
    log "PM2 auto-start configurado via crontab"
fi

# 11. Criar script de verificação de saúde
log "Criando script de monitoramento..."
cat > /home/ec2-user/health-check.sh << 'EOF'
#!/bin/bash

# Verificar se os serviços estão rodando
check_nginx() {
    if pgrep nginx > /dev/null; then
        echo "✅ Nginx: OK"
    else
        echo "❌ Nginx: DOWN - Reiniciando..."
        sudo nginx || sudo /etc/init.d/nginx start
    fi
}

check_pm2() {
    if pm2 status | grep -q "online"; then
        echo "✅ MyServ: OK"
    else
        echo "❌ MyServ: DOWN - Reiniciando..."
        pm2 resurrect
    fi
}

check_nginx
check_pm2
EOF

chmod +x /home/ec2-user/health-check.sh

# 12. Verificar instalação
log "Verificando instalação..."
sleep 5

# IP público
PUBLIC_IP=$(wget -qO- http://checkip.amazonaws.com 2>/dev/null || echo "IP-NAO-ENCONTRADO")

echo ""
echo "📊 STATUS DOS SERVIÇOS:"
echo "======================"
pm2 status
echo ""

if pgrep nginx > /dev/null; then
    echo "✅ Nginx: Rodando"
else
    echo "❌ Nginx: Não está rodando"
fi

# Testar aplicação
log "Testando aplicação..."
if curl -f http://localhost:3000 > /dev/null 2>&1; then
    echo "✅ Aplicação respondendo na porta 3000"
elif wget -q --spider http://localhost:3000; then
    echo "✅ Aplicação respondendo na porta 3000 (via wget)"
else
    warn "⚠️ Aplicação pode não estar respondendo ainda"
fi

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
echo "   • pm2 status                 - Status da aplicação"
echo "   • pm2 logs myserv           - Logs da aplicação"
echo "   • pm2 restart myserv        - Reiniciar aplicação"
echo "   • ./health-check.sh         - Verificar saúde dos serviços"
echo ""
echo "⚠️ NOTA: Sistema sem systemd detectado"
echo "   • Use ./health-check.sh para monitorar"
echo "   • PM2 configurado via crontab para auto-start"
echo ""
