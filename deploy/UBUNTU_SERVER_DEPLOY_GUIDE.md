# 🐧 MyServ - Manual de Deploy para Ubuntu Server

> **Guia completo para instalação do MyServ em Ubuntu Server 20.04/22.04 LTS**

## 📋 Pré-requisitos

### Servidor Ubuntu
- Ubuntu Server 20.04 LTS ou 22.04 LTS
- 2GB+ RAM (mínimo 1GB para t2.small)
- 20GB+ espaço em disco
- Conexão à internet
- Usuário com privilégios sudo

### Portas Necessárias
- **80**: HTTP (Nginx)
- **443**: HTTPS (opcional, para SSL)
- **3000**: Aplicação Node.js (interno)
- **22**: SSH (administração)

## 🚀 Instalação Automática (Recomendada)

### Método 1: Instalação Universal
```bash
# Conectar no servidor via SSH
ssh usuario@seu-servidor-ubuntu

# Baixar e executar instalação automática
wget https://raw.githubusercontent.com/romariorodrgues/myserv/main/deploy/ec2-setup-universal.sh
chmod +x ec2-setup-universal.sh
./ec2-setup-universal.sh
```

### Método 2: Com Diagnóstico Primeiro
```bash
# Para verificar o sistema antes da instalação
wget https://raw.githubusercontent.com/romariorodrgues/myserv/main/deploy/diagnose-systemd.sh
chmod +x diagnose-systemd.sh
./diagnose-systemd.sh
```

## 🛠️ Instalação Manual (Passo a Passo)

### 1. Atualizar Sistema
```bash
# Atualizar packages
sudo apt update && sudo apt upgrade -y

# Instalar dependências básicas
sudo apt install -y git wget curl htop vim ufw
```

### 2. Instalar Node.js 18+ (via NodeSource)
```bash
# Adicionar repositório NodeSource
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -

# Instalar Node.js e npm
sudo apt install -y nodejs

# Verificar instalação
node --version  # Deve ser v18.x.x
npm --version   # Deve ser 9.x.x ou superior
```

### 3. Instalar PM2 (Gerenciador de Processos)
```bash
# Instalar PM2 globalmente
sudo npm install -g pm2

# Verificar instalação
pm2 --version
```

### 4. Instalar e Configurar Nginx
```bash
# Instalar Nginx
sudo apt install -y nginx

# Habilitar Nginx no boot
sudo systemctl enable nginx

# Iniciar Nginx
sudo systemctl start nginx

# Verificar status
sudo systemctl status nginx
```

### 5. Configurar Firewall (UFW)
```bash
# Habilitar UFW
sudo ufw enable

# Permitir SSH
sudo ufw allow 22

# Permitir HTTP e HTTPS
sudo ufw allow 80
sudo ufw allow 443

# Verificar regras
sudo ufw status
```

### 6. Baixar e Instalar MyServ
```bash
# Ir para diretório home
cd ~

# Clonar repositório
git clone https://github.com/romariorodrgues/myserv.git
cd myserv

# Instalar dependências
npm install --production

# Configurar banco de dados
npx prisma generate
npx prisma db push
npx prisma db seed
```

### 7. Configurar Nginx para MyServ
```bash
# Criar configuração do site
sudo tee /etc/nginx/sites-available/myserv << 'EOF'
server {
    listen 80;
    server_name _;  # Substitua pelo seu domínio

    # Configurações de performance
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

    # Logs
    access_log /var/log/nginx/myserv_access.log;
    error_log /var/log/nginx/myserv_error.log;
}
EOF

# Ativar site
sudo ln -s /etc/nginx/sites-available/myserv /etc/nginx/sites-enabled/

# Remover site padrão (opcional)
sudo rm -f /etc/nginx/sites-enabled/default

# Testar configuração
sudo nginx -t

# Recarregar Nginx
sudo systemctl reload nginx
```

### 8. Configurar PM2 e Iniciar Aplicação
```bash
# Voltar ao diretório do projeto
cd ~/myserv

# Iniciar aplicação com PM2
pm2 start npm --name "myserv" -- start

# Configurar PM2 para iniciar no boot
pm2 startup
# Executar o comando mostrado pelo PM2

# Salvar configuração atual
pm2 save

# Verificar status
pm2 status
```

## 🔧 Configuração Avançada

### SSL com Let's Encrypt (Certificado Gratuito)
```bash
# Instalar Certbot
sudo apt install -y certbot python3-certbot-nginx

# Obter certificado (substitua example.com pelo seu domínio)
sudo certbot --nginx -d example.com

# Verificar renovação automática
sudo certbot renew --dry-run
```

### Configuração de Ambiente (.env)
```bash
# Editar variáveis de ambiente
cd ~/myserv
nano .env
```

Exemplo de configuração:
```env
# Banco de dados
DATABASE_URL="file:./dev.db"

# NextAuth.js
NEXTAUTH_URL="http://seu-dominio.com"
NEXTAUTH_SECRET="sua-chave-secreta-aqui"

# APIs externas (opcional)
GOOGLE_MAPS_API_KEY="sua-chave-google-maps"
WHATSAPP_API_TOKEN="seu-token-whatsapp"
MERCADOPAGO_ACCESS_TOKEN="seu-token-mercadopago"
```

### Monitoramento com PM2
```bash
# Monitorar aplicação em tempo real
pm2 monit

# Ver logs
pm2 logs myserv

# Reiniciar aplicação
pm2 restart myserv

# Parar aplicação
pm2 stop myserv

# Deletar aplicação
pm2 delete myserv
```

## 📊 Verificação da Instalação

### Teste dos Serviços
```bash
# Verificar status do Nginx
sudo systemctl status nginx

# Verificar status da aplicação
pm2 status

# Testar resposta da aplicação
curl http://localhost:3000

# Testar resposta via Nginx
curl http://localhost
```

### Verificar Logs
```bash
# Logs do Nginx
sudo tail -f /var/log/nginx/myserv_access.log
sudo tail -f /var/log/nginx/myserv_error.log

# Logs da aplicação
pm2 logs myserv --lines 50

# Logs do sistema
sudo journalctl -u nginx -f
```

## 🎯 Acesso à Aplicação

### Primeiro Acesso
```
🌐 URL: http://seu-ip-ou-dominio
```

### Usuários de Teste
- **Admin**: `admin@myserv.com` / `admin123`
- **Cliente**: `cliente@teste.com` / `cliente123`
- **Prestador**: `prestador@teste.com` / `prestador123`

## 🔧 Manutenção e Atualizações

### Atualizar MyServ
```bash
cd ~/myserv

# Fazer backup do banco de dados
cp prisma/dev.db prisma/dev.db.backup

# Puxar atualizações
git pull origin main

# Instalar novas dependências
npm install --production

# Executar migrações do banco
npx prisma db push

# Reiniciar aplicação
pm2 restart myserv
```

### Backup do Sistema
```bash
# Criar script de backup
cat > ~/backup-myserv.sh << 'EOF'
#!/bin/bash
BACKUP_DIR="/backup/myserv/$(date +%Y%m%d_%H%M%S)"
sudo mkdir -p "$BACKUP_DIR"

# Backup do código
sudo cp -r ~/myserv "$BACKUP_DIR/"

# Backup da configuração do Nginx
sudo cp /etc/nginx/sites-available/myserv "$BACKUP_DIR/"

# Backup dos logs
sudo cp -r /var/log/nginx "$BACKUP_DIR/"

echo "Backup criado em: $BACKUP_DIR"
EOF

chmod +x ~/backup-myserv.sh

# Executar backup
./backup-myserv.sh
```

### Monitoramento Automático
```bash
# Criar script de health check
cat > ~/health-check.sh << 'EOF'
#!/bin/bash

check_nginx() {
    if systemctl is-active --quiet nginx; then
        echo "✅ Nginx: OK"
    else
        echo "❌ Nginx: DOWN - Reiniciando..."
        sudo systemctl start nginx
    fi
}

check_myserv() {
    if pm2 status | grep -q "online"; then
        echo "✅ MyServ: OK"
    else
        echo "❌ MyServ: DOWN - Reiniciando..."
        cd ~/myserv && pm2 restart myserv
    fi
}

check_disk() {
    DISK_USAGE=$(df / | tail -1 | awk '{print $5}' | sed 's/%//')
    if [ "$DISK_USAGE" -gt 80 ]; then
        echo "⚠️ Disco: ${DISK_USAGE}% usado"
    else
        echo "✅ Disco: ${DISK_USAGE}% usado"
    fi
}

echo "🔍 Health Check - $(date)"
check_nginx
check_myserv
check_disk
EOF

chmod +x ~/health-check.sh

# Adicionar ao crontab para executar a cada 5 minutos
(crontab -l 2>/dev/null; echo "*/5 * * * * ~/health-check.sh >> ~/health-check.log 2>&1") | crontab -
```

## ⚠️ Solução de Problemas

### Problemas Comuns

#### 1. Aplicação não inicia
```bash
# Verificar logs
pm2 logs myserv

# Verificar se a porta 3000 está livre
sudo lsof -i :3000

# Reinstalar dependências
cd ~/myserv
rm -rf node_modules
npm install --production
```

#### 2. Nginx retorna 502 Bad Gateway
```bash
# Verificar se a aplicação está rodando
pm2 status

# Verificar configuração do Nginx
sudo nginx -t

# Verificar logs do Nginx
sudo tail -f /var/log/nginx/myserv_error.log
```

#### 3. Erro de permissões
```bash
# Ajustar permissões do projeto
sudo chown -R $USER:$USER ~/myserv

# Ajustar permissões do PM2
sudo chown -R $USER:$USER ~/.pm2
```

#### 4. Banco de dados corrompido
```bash
cd ~/myserv

# Restaurar backup
cp prisma/dev.db.backup prisma/dev.db

# Ou recriar do zero
rm prisma/dev.db
npx prisma db push
npx prisma db seed
```

### Comandos de Emergência
```bash
# Parar tudo
pm2 stop all
sudo systemctl stop nginx

# Reiniciar tudo
sudo systemctl start nginx
pm2 restart all

# Resetar PM2
pm2 kill
cd ~/myserv
pm2 start npm --name "myserv" -- start
pm2 save
```

## 📞 Suporte e Recursos

### Comandos Úteis
```bash
# Status geral do sistema
sudo systemctl status nginx
pm2 status
df -h
free -h
top

# Logs em tempo real
pm2 logs myserv --lines 100 --raw
sudo tail -f /var/log/nginx/myserv_access.log

# Informações do sistema
uname -a
lsb_release -a
node --version
npm --version
```

### Links Úteis
- **Repositório**: https://github.com/romariorodrgues/myserv
- **Documentação PM2**: https://pm2.keymetrics.io/
- **Documentação Nginx**: https://nginx.org/en/docs/
- **Let's Encrypt**: https://letsencrypt.org/

## 🎉 Conclusão

Após seguir este manual, você terá:
- ✅ MyServ rodando em produção
- ✅ Nginx como proxy reverso
- ✅ PM2 gerenciando a aplicação
- ✅ SSL/HTTPS configurado (opcional)
- ✅ Monitoramento automático
- ✅ Sistema de backup

**O MyServ estará disponível em `http://seu-servidor` e pronto para uso!**

---
*Manual criado por Romário Rodrigues - romariorodrigues.dev@gmail.com*
