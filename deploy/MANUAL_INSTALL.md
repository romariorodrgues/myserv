# 🔧 Instalação Manual do MyServ (Alternativa)

> **Use este guia se os scripts automáticos não funcionarem**

## 🚀 Instalação Passo a Passo

### 1. Preparar a Instância EC2

```bash
# Conectar na EC2
ssh -i sua-chave.pem ec2-user@seu-ip-publico

# Atualizar sistema
sudo yum update -y
```

### 2. Instalar Node.js e Dependências

```bash
# Instalar Node.js 18+
curl -fsSL https://rpm.nodesource.com/setup_18.x | sudo bash -
sudo yum install -y nodejs git curl wget htop

# Instalar PM2 globalmente
sudo npm install -g pm2

# Instalar Nginx
sudo yum install -y nginx
```

### 3. Configurar Firewall

```bash
# Configurar firewall
sudo yum install -y firewalld
sudo systemctl enable firewalld
sudo systemctl start firewalld
sudo firewall-cmd --permanent --add-service=http
sudo firewall-cmd --permanent --add-service=https
sudo firewall-cmd --permanent --add-port=3000/tcp
sudo firewall-cmd --reload
```

### 4. Clonar e Configurar Aplicação

```bash
# Criar diretório e clonar
sudo mkdir -p /var/www/myserv
sudo chown -R ec2-user:ec2-user /var/www/myserv
cd /var/www/myserv
git clone https://github.com/romariorodrgues/myserv.git .

# Instalar dependências
npm install
```

### 5. Configurar Variáveis de Ambiente

```bash
# Criar arquivo .env
cat > .env << 'EOL'
NODE_ENV=production
DATABASE_URL="file:./prisma/prod.db"
NEXTAUTH_URL="http://$(curl -s http://169.254.169.254/latest/meta-data/public-ipv4)"
NEXTAUTH_SECRET="$(openssl rand -base64 32)"
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY="your-google-maps-key"
MERCADOPAGO_ACCESS_TOKEN="TEST-your-mercadopago-token"
NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY="TEST-your-mercadopago-public-key"
CHATPRO_API_KEY="your-chatpro-key"
CHATPRO_INSTANCE_ID="your-instance-id"
UPLOAD_DIR="public/uploads"
EOL
```

### 6. Configurar Banco de Dados

```bash
# Configurar Prisma
npx prisma generate
npx prisma db push
npm run db:seed
```

### 7. Build da Aplicação

```bash
# Construir aplicação
npm run build
```

### 8. Configurar PM2

```bash
# Criar configuração PM2
cat > ecosystem.config.js << 'EOL'
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

# Iniciar aplicação
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

### 9. Configurar Nginx

```bash
# Configurar Nginx
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
}
EOL

# Iniciar Nginx
sudo systemctl enable nginx
sudo systemctl start nginx
```

### 10. Otimizações para t2.micro

```bash
# Configurar swap
sudo fallocate -l 1G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab

# Otimizações de memória
cat << 'EOL' | sudo tee -a /etc/sysctl.conf
vm.swappiness=10
vm.dirty_ratio=15
vm.dirty_background_ratio=5
vm.overcommit_memory=1
EOL

sudo sysctl -p
```

### 11. Configurar Backup Automático

```bash
# Script de backup
cat > /home/ec2-user/backup-myserv.sh << 'EOL'
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/home/ec2-user/backups"
mkdir -p $BACKUP_DIR
cp /var/www/myserv/prisma/prod.db $BACKUP_DIR/myserv_db_$DATE.db
tar -czf $BACKUP_DIR/uploads_$DATE.tar.gz -C /var/www/myserv/public uploads/
find $BACKUP_DIR -name "*.db" -mtime +7 -delete
find $BACKUP_DIR -name "*.tar.gz" -mtime +7 -delete
EOL

chmod +x /home/ec2-user/backup-myserv.sh

# Configurar cron para backup diário
(crontab -l 2>/dev/null; echo "0 2 * * * /home/ec2-user/backup-myserv.sh") | crontab -
```

### 12. Verificar Instalação

```bash
# Verificar status
pm2 status
sudo systemctl status nginx
curl -I localhost:3000

# Obter IP público
curl -s http://169.254.169.254/latest/meta-data/public-ipv4
```

## ✅ Resultado Final

Após seguir todos os passos, você deve ter:

- **MyServ rodando** em http://SEU-IP-PUBLICO
- **Usuários de teste criados**
- **Nginx configurado** como proxy reverso
- **PM2 gerenciando** a aplicação
- **Backup automático** configurado

### 🔐 Usuários de Teste

- **Admin:** admin@myserv.com / admin123
- **Cliente:** cliente@teste.com / cliente123
- **Profissional:** profissional@teste.com / provider123

### 🔧 Comandos Úteis

```bash
# Status da aplicação
pm2 status
pm2 logs myserv

# Reiniciar aplicação
pm2 restart myserv

# Status do Nginx
sudo systemctl status nginx

# Monitorar recursos
htop
free -h
df -h
```

### 🔒 Configurar SSL (Opcional)

```bash
# Instalar Certbot
sudo yum install -y certbot python3-certbot-nginx

# Configurar SSL
sudo certbot --nginx -d seu-dominio.com
```

---

**✅ Com este guia manual, você terá o MyServ funcionando mesmo se os scripts automáticos não estiverem disponíveis!**
