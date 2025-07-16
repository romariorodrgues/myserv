#!/bin/bash

# Script de Otimização para t2.micro
# Autor: Romário Rodrigues <romariorodrigues.dev@gmail.com>

set -e

echo "⚡ Otimizando instância t2.micro para MyServ"
echo "============================================"

# Cores
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

# 1. Configurar Swap (importante para 1GB RAM)
log "Configurando swap de 1GB..."
if [ ! -f /swapfile ]; then
    sudo fallocate -l 1G /swapfile
    sudo chmod 600 /swapfile
    sudo mkswap /swapfile
    sudo swapon /swapfile
    echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
    log "Swap configurado com sucesso"
else
    warn "Swap já está configurado"
fi

# 2. Configurar otimizações de memória
log "Configurando otimizações de memória..."
cat << 'EOL' | sudo tee -a /etc/sysctl.conf
# Otimizações para t2.micro
vm.swappiness=10
vm.dirty_ratio=15
vm.dirty_background_ratio=5
vm.overcommit_memory=1
net.core.rmem_max=16777216
net.core.wmem_max=16777216
EOL

sudo sysctl -p

# 3. Configurar PM2 para usar menos memória
log "Otimizando configuração PM2..."
cat > /var/www/myserv/ecosystem.config.js << 'EOL'
module.exports = {
  apps: [{
    name: 'myserv',
    script: 'npm',
    args: 'start',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '800M',
    node_args: '--max-old-space-size=768',
    env: {
      NODE_ENV: 'production',
      PORT: 3000,
      NODE_OPTIONS: '--max-old-space-size=768'
    }
  }]
}
EOL

# 4. Configurar limpeza automática de logs
log "Configurando limpeza automática de logs..."
cat > /home/ec2-user/cleanup-logs.sh << 'EOL'
#!/bin/bash
# Limpeza automática de logs
pm2 flush
sudo journalctl --vacuum-time=7d
sudo find /var/log -name "*.log" -type f -mtime +7 -delete
sudo find /var/log -name "*.log.*" -type f -mtime +7 -delete
EOL

chmod +x /home/ec2-user/cleanup-logs.sh

# 5. Configurar monitoramento de recursos
log "Configurando monitoramento..."
cat > /home/ec2-user/check-resources.sh << 'EOL'
#!/bin/bash
echo "=== Status dos Recursos $(date) ==="
echo "CPU:"
top -bn1 | grep "Cpu(s)" | sed "s/.*, *\([0-9.]*\)%* id.*/\1/" | awk '{print 100 - $1"% usado"}'
echo ""
echo "Memória:"
free -h
echo ""
echo "Disco:"
df -h /
echo ""
echo "Swap:"
swapon --show
echo ""
echo "Processos MyServ:"
pm2 status
EOL

chmod +x /home/ec2-user/check-resources.sh

# 6. Configurar cron jobs para manutenção
log "Configurando cron jobs..."
(crontab -l 2>/dev/null; echo "0 2 * * * /home/ec2-user/cleanup-logs.sh") | crontab -
(crontab -l 2>/dev/null; echo "0 3 * * * /home/ec2-user/backup-myserv.sh") | crontab -
(crontab -l 2>/dev/null; echo "*/30 * * * * /home/ec2-user/check-resources.sh >> /home/ec2-user/resource-monitor.log") | crontab -

# 7. Configurar Nginx para usar menos recursos
log "Otimizando configuração Nginx..."
sudo tee -a /etc/nginx/nginx.conf > /dev/null << 'EOL'

# Otimizações para t2.micro
worker_processes 1;
worker_connections 1024;
worker_rlimit_nofile 2048;

# Gzip compression
gzip on;
gzip_vary on;
gzip_min_length 1024;
gzip_proxied any;
gzip_comp_level 6;
gzip_types
    text/plain
    text/css
    text/xml
    text/javascript
    application/javascript
    application/xml+rss
    application/json;

# Buffer sizes
client_body_buffer_size 1K;
client_header_buffer_size 1k;
client_max_body_size 50M;
large_client_header_buffers 2 1k;

# Timeouts
client_body_timeout 10;
client_header_timeout 10;
keepalive_timeout 5 5;
send_timeout 10;
EOL

# 8. Configurar logrotate
log "Configurando rotação de logs..."
sudo tee /etc/logrotate.d/myserv > /dev/null << 'EOL'
/var/log/nginx/*.log {
    daily
    missingok
    rotate 7
    compress
    delaycompress
    notifempty
    create 0644 nginx nginx
    postrotate
        systemctl reload nginx
    endscript
}

/home/ec2-user/.pm2/logs/*.log {
    daily
    missingok
    rotate 7
    compress
    delaycompress
    notifempty
    create 0644 ec2-user ec2-user
    postrotate
        pm2 reloadLogs
    endscript
}
EOL

# 9. Configurar firewall básico
log "Configurando firewall..."
sudo systemctl enable firewalld
sudo systemctl start firewalld
sudo firewall-cmd --permanent --add-service=http
sudo firewall-cmd --permanent --add-service=https
sudo firewall-cmd --permanent --add-port=22/tcp
sudo firewall-cmd --permanent --add-port=3000/tcp
sudo firewall-cmd --reload

# 10. Configurar alertas de recursos
log "Configurando alertas de recursos..."
cat > /home/ec2-user/resource-alert.sh << 'EOL'
#!/bin/bash
# Alertas de recursos críticos

# Verificar uso de memória
MEM_USAGE=$(free | grep Mem | awk '{printf "%.0f", $3/$2 * 100.0}')
if [ $MEM_USAGE -gt 90 ]; then
    echo "ALERTA: Uso de memória alto: ${MEM_USAGE}%" | logger -t myserv-alert
    pm2 restart myserv
fi

# Verificar uso de disco
DISK_USAGE=$(df / | tail -1 | awk '{print $5}' | sed 's/%//')
if [ $DISK_USAGE -gt 85 ]; then
    echo "ALERTA: Uso de disco alto: ${DISK_USAGE}%" | logger -t myserv-alert
    /home/ec2-user/cleanup-logs.sh
fi

# Verificar se aplicação está rodando
if ! pm2 show myserv > /dev/null 2>&1; then
    echo "ALERTA: Aplicação MyServ não está rodando" | logger -t myserv-alert
    pm2 restart myserv
fi
EOL

chmod +x /home/ec2-user/resource-alert.sh

# Adicionar ao cron
(crontab -l 2>/dev/null; echo "*/5 * * * * /home/ec2-user/resource-alert.sh") | crontab -

# 11. Reiniciar serviços
log "Reiniciando serviços..."
sudo systemctl restart nginx
pm2 restart myserv 2>/dev/null || true

# 12. Mostrar status final
log "Status final dos recursos:"
echo "==============================="
echo "Memória total:"
free -h
echo ""
echo "Swap:"
swapon --show
echo ""
echo "Espaço em disco:"
df -h /
echo ""
echo "Processos:"
pm2 status
echo ""
echo "✅ Otimização concluída!"
echo ""
echo "🔧 Scripts criados:"
echo "- /home/ec2-user/cleanup-logs.sh (limpeza de logs)"
echo "- /home/ec2-user/check-resources.sh (monitoramento)"
echo "- /home/ec2-user/resource-alert.sh (alertas automáticos)"
echo ""
echo "📊 Monitoramento:"
echo "- Logs de recursos: /home/ec2-user/resource-monitor.log"
echo "- Alertas: sudo journalctl -t myserv-alert"
echo ""
echo "⚠️  Lembre-se:"
echo "- Monitore regularmente o uso de recursos"
echo "- Considere upgrade se necessário"
echo "- Backup automático configurado às 03:00"
