#!/bin/bash

# MyServ - Script de Instalação para Ubuntu Server
# Autor: Romário Rodrigues <romariorodrigues.dev@gmail.com>
# Otimizado para Ubuntu Server 20.04/22.04 LTS

set -e

echo "🐧 MyServ - Instalação para Ubuntu Server"
echo "=========================================="
echo "Ubuntu Server 20.04/22.04 LTS"
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

info() {
    echo -e "${BLUE}[DEBUG]${NC} $1"
}

# Detectar ambiente
CURRENT_USER=$(whoami)
CURRENT_HOME=$(eval echo ~$CURRENT_USER)
UBUNTU_VERSION=$(lsb_release -rs 2>/dev/null || echo "unknown")

info "Usuário: $CURRENT_USER"
info "Home: $CURRENT_HOME"
info "Ubuntu: $UBUNTU_VERSION"

# Verificar se é Ubuntu
if ! command -v apt >/dev/null 2>&1; then
    error "Este script é para Ubuntu! Use ec2-setup-universal.sh para outros sistemas."
    exit 1
fi

# Verificar privilégios sudo
if ! sudo -n true 2>/dev/null; then
    error "Este script precisa de privilégios sudo. Execute: sudo $0"
    exit 1
fi

# 1. Atualizar sistema
log "Atualizando sistema Ubuntu..."
sudo apt update
sudo apt upgrade -y

# 2. Instalar dependências básicas
log "Instalando dependências básicas..."
sudo apt install -y git wget curl htop vim ufw build-essential

# 3. Configurar firewall básico
log "Configurando firewall (UFW)..."
sudo ufw --force enable
sudo ufw allow 22   # SSH
sudo ufw allow 80   # HTTP
sudo ufw allow 443  # HTTPS
sudo ufw status

# 4. Instalar Node.js 18+ via NodeSource
log "Instalando Node.js 18..."
if ! command -v node >/dev/null 2>&1; then
    # Adicionar repositório NodeSource
    curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
    sudo apt install -y nodejs
else
    log "Node.js já instalado: $(node --version)"
fi

# Verificar versões
NODE_VERSION=$(node --version)
NPM_VERSION=$(npm --version)
log "Node.js: $NODE_VERSION"
log "npm: $NPM_VERSION"

# 5. Instalar PM2
log "Instalando PM2..."
if ! command -v pm2 >/dev/null 2>&1; then
    sudo npm install -g pm2
else
    log "PM2 já instalado: $(pm2 --version)"
fi

# 6. Instalar e configurar Nginx
log "Instalando Nginx..."
sudo apt install -y nginx

# Habilitar e iniciar Nginx
sudo systemctl enable nginx
sudo systemctl start nginx

# 7. Configurar Nginx para MyServ
log "Configurando Nginx..."
sudo tee /etc/nginx/sites-available/myserv > /dev/null <<'EOF'
server {
    listen 80;
    server_name _;

    # Configurações de performance para Ubuntu
    client_max_body_size 50M;
    proxy_connect_timeout 60s;
    proxy_send_timeout 60s;
    proxy_read_timeout 60s;
    proxy_buffering off;

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

    # Logs específicos
    access_log /var/log/nginx/myserv_access.log;
    error_log /var/log/nginx/myserv_error.log;
}
EOF

# Ativar site MyServ
sudo ln -sf /etc/nginx/sites-available/myserv /etc/nginx/sites-enabled/

# Remover site padrão
sudo rm -f /etc/nginx/sites-enabled/default

# Testar configuração
sudo nginx -t

# Recarregar Nginx
sudo systemctl reload nginx

# 8. Baixar e instalar MyServ
log "Baixando MyServ..."
cd "$CURRENT_HOME"

if [ -d "myserv" ]; then
    log "Removendo instalação anterior..."
    rm -rf myserv
fi

# Clonar repositório
git clone https://github.com/romariorodrgues/myserv.git
cd myserv

# 9. Instalar dependências do projeto
log "Instalando dependências do projeto..."
npm install --production

# 10. Configurar banco de dados
log "Configurando banco de dados..."
npx prisma generate
npx prisma db push

# Criar dados de teste
log "Criando dados de teste..."
npx prisma db seed || {
    warn "Falha no seed, mas continuando..."
}

# 11. Configurar PM2
log "Configurando PM2..."
pm2 delete myserv 2>/dev/null || true

# Iniciar aplicação
pm2 start npm --name "myserv" -- start

# Configurar PM2 para inicializar no boot
pm2 startup
sudo env PATH=$PATH:/usr/bin /usr/lib/node_modules/pm2/bin/pm2 startup systemd -u $CURRENT_USER --hp $CURRENT_HOME

# Salvar configuração
pm2 save

# 12. Criar scripts de monitoramento
log "Criando scripts de monitoramento..."

# Script de health check
cat > "$CURRENT_HOME/health-check.sh" << EOF
#!/bin/bash

# Health Check para MyServ Ubuntu
echo "🔍 Health Check MyServ - \$(date)"
echo "Servidor: Ubuntu $UBUNTU_VERSION"
echo "Usuário: $CURRENT_USER"
echo ""

# Verificar Nginx
if systemctl is-active --quiet nginx; then
    echo "✅ Nginx: Ativo"
else
    echo "❌ Nginx: Inativo - Reiniciando..."
    sudo systemctl start nginx
fi

# Verificar MyServ
if pm2 status | grep -q "online"; then
    echo "✅ MyServ: Online"
else
    echo "❌ MyServ: Offline - Reiniciando..."
    cd $CURRENT_HOME/myserv && pm2 restart myserv
fi

# Verificar disco
DISK_USAGE=\$(df / | tail -1 | awk '{print \$5}' | sed 's/%//')
if [ "\$DISK_USAGE" -gt 80 ]; then
    echo "⚠️ Disco: \${DISK_USAGE}% (Alto)"
else
    echo "✅ Disco: \${DISK_USAGE}% usado"
fi

# Verificar memória
MEMORY_USAGE=\$(free | grep Mem | awk '{printf("%.0f", \$3/\$2 * 100.0)}')
if [ "\$MEMORY_USAGE" -gt 80 ]; then
    echo "⚠️ Memória: \${MEMORY_USAGE}% (Alta)"
else
    echo "✅ Memória: \${MEMORY_USAGE}% usada"
fi

echo ""
EOF

chmod +x "$CURRENT_HOME/health-check.sh"

# Script de backup
cat > "$CURRENT_HOME/backup-myserv.sh" << EOF
#!/bin/bash

# Backup do MyServ
BACKUP_DIR="/tmp/myserv-backup-\$(date +%Y%m%d_%H%M%S)"
mkdir -p "\$BACKUP_DIR"

echo "📦 Criando backup em \$BACKUP_DIR..."

# Backup do código
cp -r $CURRENT_HOME/myserv "\$BACKUP_DIR/"

# Backup da configuração do Nginx
sudo cp /etc/nginx/sites-available/myserv "\$BACKUP_DIR/"

# Backup dos logs (últimas 1000 linhas)
sudo tail -1000 /var/log/nginx/myserv_access.log > "\$BACKUP_DIR/nginx_access.log" 2>/dev/null || true
sudo tail -1000 /var/log/nginx/myserv_error.log > "\$BACKUP_DIR/nginx_error.log" 2>/dev/null || true

# Compactar backup
cd /tmp
tar -czf "myserv-backup-\$(date +%Y%m%d_%H%M%S).tar.gz" "\$(basename \$BACKUP_DIR)"
rm -rf "\$BACKUP_DIR"

echo "✅ Backup criado: /tmp/myserv-backup-\$(date +%Y%m%d_%H%M%S).tar.gz"
EOF

chmod +x "$CURRENT_HOME/backup-myserv.sh"

# 13. Configurar monitoramento automático
log "Configurando monitoramento automático..."
# Adicionar health check ao crontab (a cada 5 minutos)
(crontab -l 2>/dev/null | grep -v "health-check.sh"; echo "*/5 * * * * $CURRENT_HOME/health-check.sh >> $CURRENT_HOME/health-check.log 2>&1") | crontab -

# Backup semanal (domingo às 2h)
(crontab -l 2>/dev/null | grep -v "backup-myserv.sh"; echo "0 2 * * 0 $CURRENT_HOME/backup-myserv.sh") | crontab -

# 14. Detectar IP público
log "Detectando IP público..."
PUBLIC_IP=$(curl -s http://checkip.amazonaws.com 2>/dev/null || wget -qO- http://checkip.amazonaws.com 2>/dev/null || echo "SEU-IP-PUBLICO")

# 15. Verificação final
log "Verificação final..."
sleep 5

echo ""
echo "📊 INSTALAÇÃO UBUNTU CONCLUÍDA!"
echo "==============================="
echo ""
echo "🖥️ Servidor:"
echo "   • Sistema: Ubuntu $UBUNTU_VERSION"
echo "   • Usuário: $CURRENT_USER"
echo "   • Diretório: $CURRENT_HOME/myserv"
echo ""
echo "📊 Status dos Serviços:"
echo "======================"

# Status do Nginx
if systemctl is-active --quiet nginx; then
    echo "✅ Nginx: Ativo"
else
    echo "❌ Nginx: Verificar configuração"
fi

# Status do PM2
pm2 status

# Teste da aplicação
if curl -f http://localhost:3000 >/dev/null 2>&1; then
    echo "✅ MyServ: Respondendo na porta 3000"
elif wget -q --spider http://localhost:3000 2>/dev/null; then
    echo "✅ MyServ: Respondendo na porta 3000"
else
    warn "⚠️ MyServ: Pode não estar respondendo (aguarde alguns segundos)"
fi

echo ""
echo "🌐 ACESSO À APLICAÇÃO:"
echo "====================="
echo "   URL: http://$PUBLIC_IP"
echo ""
echo "👥 USUÁRIOS DE TESTE:"
echo "===================="
echo "   • Admin: admin@myserv.com / admin123"
echo "   • Cliente: cliente@teste.com / cliente123"
echo "   • Prestador: prestador@teste.com / prestador123"
echo ""
echo "🔧 COMANDOS ÚTEIS:"
echo "=================="
echo "   • pm2 status                     - Status da aplicação"
echo "   • pm2 logs myserv               - Logs da aplicação"
echo "   • pm2 restart myserv            - Reiniciar aplicação"
echo "   • sudo systemctl status nginx   - Status do Nginx"
echo "   • $CURRENT_HOME/health-check.sh - Verificar saúde"
echo "   • $CURRENT_HOME/backup-myserv.sh - Criar backup"
echo ""
echo "📁 ARQUIVOS IMPORTANTES:"
echo "========================"
echo "   • Projeto: $CURRENT_HOME/myserv"
echo "   • Health Check: $CURRENT_HOME/health-check.sh"
echo "   • Backup: $CURRENT_HOME/backup-myserv.sh"
echo "   • Logs Nginx: /var/log/nginx/myserv_*.log"
echo "   • Config Nginx: /etc/nginx/sites-available/myserv"
echo ""
echo "🎉 INSTALAÇÃO COMPLETA!"
echo "MyServ está rodando e pronto para uso!"
echo ""
