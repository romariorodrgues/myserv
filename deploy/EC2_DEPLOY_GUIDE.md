# MyServ - Guia de Deploy para EC2 Amazon Linux t2.micro

**Autor:** Romário Rodrigues <romariorodrigues.dev@gmail.com>  
**Data:** 16 de julho de 2025

## 🚀 Instalação Automática (Recomendada)

### 1. Pré-requisitos

#### AWS EC2 Instance
- **Tipo:** t2.micro (1 vCPU, 1 GB RAM)
- **OS:** Amazon Linux 2
- **Storage:** 8 GB EBS (mínimo)
- **Key Pair:** Configurado para acesso SSH

#### Security Group
Configure as seguintes regras de entrada:
```
SSH (22)     - Seu IP
HTTP (80)    - 0.0.0.0/0
HTTPS (443)  - 0.0.0.0/0
Custom (3000) - 0.0.0.0/0 (apenas para desenvolvimento)
```

### 2. Instalação Automática

```bash
# 1. Conectar na instância EC2
ssh -i sua-chave.pem ec2-user@seu-ip-publico

# 2. Fazer download do script
curl -O https://raw.githubusercontent.com/romariorodrgues/myserv/main/deploy/ec2-setup.sh

# 3. Dar permissão de execução
chmod +x ec2-setup.sh

# 4. Executar instalação
./ec2-setup.sh
```

### 3. Acesso à Aplicação

Após a instalação, acesse:
- **URL:** http://SEU-IP-PUBLICO
- **Admin:** admin@myserv.com / admin123
- **Cliente:** cliente@teste.com / cliente123

## 🔧 Instalação Manual (Avançada)

### 1. Conectar na EC2

```bash
ssh -i sua-chave.pem ec2-user@seu-ip-publico
```

### 2. Atualizar Sistema

```bash
sudo yum update -y
```

### 3. Instalar Node.js 18+

```bash
curl -fsSL https://rpm.nodesource.com/setup_18.x | sudo bash -
sudo yum install -y nodejs
```

### 4. Instalar Dependências

```bash
sudo yum install -y git curl wget htop nginx
sudo npm install -g pm2
```

### 5. Configurar Aplicação

```bash
# Criar diretório
sudo mkdir -p /var/www/myserv
sudo chown -R ec2-user:ec2-user /var/www/myserv

# Clonar repositório
cd /var/www/myserv
git clone https://github.com/romariorodrgues/myserv.git .

# Instalar dependências
npm install
```

### 6. Configurar Ambiente

```bash
# Criar arquivo .env
cat > .env << 'EOL'
NODE_ENV=production
DATABASE_URL="file:./prisma/prod.db"
NEXTAUTH_URL="http://$(curl -s http://169.254.169.254/latest/meta-data/public-ipv4):3000"
NEXTAUTH_SECRET="$(openssl rand -base64 32)"
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY="your-google-maps-key"
MERCADOPAGO_ACCESS_TOKEN="TEST-your-mercadopago-token"
NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY="TEST-your-mercadopago-public-key"
CHATPRO_API_KEY="your-chatpro-key"
CHATPRO_INSTANCE_ID="your-instance-id"
UPLOAD_DIR="public/uploads"
EOL
```

### 7. Configurar Banco de Dados

```bash
npx prisma generate
npx prisma db push
npm run db:seed
```

### 8. Build da Aplicação

```bash
npm run build
```

### 9. Configurar PM2

```bash
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

pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

### 10. Configurar Nginx

```bash
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
    }
}
EOL

sudo systemctl enable nginx
sudo systemctl start nginx
```

## 🔒 Configuração SSL (Opcional)

### 1. Instalar Certbot

```bash
sudo yum install -y certbot python3-certbot-nginx
```

### 2. Configurar SSL

```bash
sudo certbot --nginx -d seu-dominio.com
```

## 📊 Monitoramento

### Comandos Úteis

```bash
# Status da aplicação
pm2 status
pm2 logs myserv

# Status do Nginx
sudo systemctl status nginx
sudo tail -f /var/log/nginx/access.log

# Recursos do sistema
htop
df -h
free -h

# Reiniciar serviços
pm2 restart myserv
sudo systemctl restart nginx
```

## 🔧 Configurações Avançadas

### Otimizações para t2.micro

```bash
# Configurar swap (recomendado para 1GB RAM)
sudo fallocate -l 1G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
```

### Backup Automático

```bash
# Criar script de backup
cat > /home/ec2-user/backup-myserv.sh << 'EOL'
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/home/ec2-user/backups"
mkdir -p $BACKUP_DIR

# Backup do banco de dados
cp /var/www/myserv/prisma/prod.db $BACKUP_DIR/myserv_db_$DATE.db

# Backup dos uploads
tar -czf $BACKUP_DIR/uploads_$DATE.tar.gz -C /var/www/myserv/public uploads/

# Manter apenas últimos 7 backups
find $BACKUP_DIR -name "*.db" -mtime +7 -delete
find $BACKUP_DIR -name "*.tar.gz" -mtime +7 -delete
EOL

chmod +x /home/ec2-user/backup-myserv.sh

# Configurar cron para backup diário
(crontab -l 2>/dev/null; echo "0 2 * * * /home/ec2-user/backup-myserv.sh") | crontab -
```

## 🔍 Troubleshooting

### Problemas Comuns

1. **Aplicação não inicia**
   ```bash
   pm2 logs myserv
   ```

2. **Erro 502 Bad Gateway**
   ```bash
   sudo systemctl status nginx
   pm2 status
   ```

3. **Pouco espaço em disco**
   ```bash
   df -h
   pm2 flush  # Limpar logs
   ```

4. **Pouca memória**
   ```bash
   free -h
   pm2 restart myserv
   ```

### Logs Importantes

```bash
# Logs da aplicação
pm2 logs myserv

# Logs do Nginx
sudo tail -f /var/log/nginx/error.log
sudo tail -f /var/log/nginx/access.log

# Logs do sistema
sudo journalctl -u nginx
```

## 📈 Escalabilidade

### Para crescer além da t2.micro:

1. **Upgrade da instância** (t2.small, t2.medium)
2. **Adicionar RDS** (PostgreSQL/MySQL)
3. **Load Balancer** + Auto Scaling
4. **CloudFront** para CDN
5. **S3** para uploads

---

**✅ Com este guia, você terá o MyServ funcionando em uma instância EC2 t2.micro em poucos minutos!**
