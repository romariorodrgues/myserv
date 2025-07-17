# ☁️ MyServ - Deploy Rápido para EC2 t2.micro

> **Instalação completa do MyServ em instância AWS EC2 t2.micro com Amazon Linux**

## 🚀 Deploy Automático (Recomendado)

### ⚠️ **Importante**: Se você receber erro 404 ao baixar os scripts, aguarde alguns minutos para o GitHub processar o commit ou use o método alternativo.

### Método 1: Deploy Local (Recomendado)
```bash
# 1. Clonar repositório
git clone https://github.com/romariorodrgues/myserv.git
cd myserv/deploy

# 2. Executar deploy automático
chmod +x deploy-to-ec2.sh
./deploy-to-ec2.sh sua-chave.pem IP-DA-EC2

# 3. Acessar aplicação
# http://IP-DA-EC2
```

### Método 2: Download Direto dos Scripts
```bash
# 1. Conectar na EC2
ssh -i sua-chave.pem ec2-user@seu-ip-publico

# 2. Baixar scripts (aguarde se receber 404)
wget https://raw.githubusercontent.com/romariorodrgues/myserv/main/deploy/ec2-setup.sh
wget https://raw.githubusercontent.com/romariorodrgues/myserv/main/deploy/optimize-t2micro.sh

# 3. Executar instalação
chmod +x ec2-setup.sh optimize-t2micro.sh
./ec2-setup.sh
./optimize-t2micro.sh
```

### Método 3: Instalação Manual (Se scripts não funcionarem)
```bash
# 1. Conectar na EC2
ssh -i sua-chave.pem ec2-user@seu-ip-publico

# 2. Clonar repositório na EC2
git clone https://github.com/romariorodrgues/myserv.git
cd myserv

# 3. Executar scripts locais
chmod +x deploy/ec2-setup.sh deploy/optimize-t2micro.sh
./deploy/ec2-setup.sh
./deploy/optimize-t2micro.sh
```

### Resultado Final
```
http://SEU-IP-PUBLICO
```

**Usuários de teste:**
- **Admin:** admin@myserv.com / admin123
- **Cliente:** cliente@teste.com / cliente123
- **Profissional:** profissional@teste.com / provider123

---

## 📋 Pré-requisitos AWS

### Instância EC2
- **Tipo:** t2.micro
- **OS:** Amazon Linux 2
- **Storage:** 8GB+ EBS

### Security Group
```bash
# Automatizar criação do Security Group
curl -O https://raw.githubusercontent.com/romariorodrgues/myserv/main/deploy/setup-security-group.sh
chmod +x setup-security-group.sh
./setup-security-group.sh
```

**Ou configurar manualmente:**
- SSH (22) - Seu IP
- HTTP (80) - 0.0.0.0/0
- HTTPS (443) - 0.0.0.0/0

---

## ⚡ Otimização para t2.micro

```bash
# Após instalação, executar otimizações
curl -O https://raw.githubusercontent.com/romariorodrgues/myserv/main/deploy/optimize-t2micro.sh
chmod +x optimize-t2micro.sh
./optimize-t2micro.sh
```

### Otimizações Incluídas:
- ✅ Swap de 1GB
- ✅ Configurações de memória
- ✅ PM2 otimizado
- ✅ Nginx comprimido
- ✅ Limpeza automática de logs
- ✅ Monitoramento de recursos
- ✅ Backup automático

---

## 🔧 Comandos Úteis

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

# Ver logs
sudo tail -f /var/log/nginx/access.log
pm2 logs myserv --lines 100
```

---

## 🔒 SSL (Opcional)

```bash
# Instalar Certbot
sudo yum install -y certbot python3-certbot-nginx

# Configurar SSL
sudo certbot --nginx -d seu-dominio.com
```

---

## 📊 Monitoramento

### Scripts Automáticos
- **Limpeza de logs:** `/home/ec2-user/cleanup-logs.sh`
- **Monitoramento:** `/home/ec2-user/check-resources.sh`
- **Backup:** `/home/ec2-user/backup-myserv.sh`

### Cron Jobs Configurados
- **02:00** - Limpeza de logs
- **03:00** - Backup automático
- **A cada 30min** - Monitoramento de recursos
- **A cada 5min** - Alertas de recursos críticos

---

## 🔍 Troubleshooting

### Aplicação não carrega
```bash
pm2 logs myserv
pm2 restart myserv
```

### Erro 502 Bad Gateway
```bash
sudo systemctl restart nginx
pm2 status
```

### Pouco espaço/memória
```bash
/home/ec2-user/cleanup-logs.sh
pm2 restart myserv
```

---

## 📈 Próximos Passos

### Para Produção
1. **Configurar domínio personalizado**
2. **Adicionar SSL com Let's Encrypt**
3. **Configurar APIs externas:**
   - Google Maps
   - MercadoPago
   - WhatsApp/ChatPro

### Para Escalar
1. **Upgrade para t2.small/medium**
2. **Migrar para RDS (PostgreSQL)**
3. **Adicionar Load Balancer**
4. **Configurar CloudFront CDN**

---

## ✅ Pós-Instalação - O que fazer após o deploy

### 1️⃣ **Verificar se tudo está funcionando**

```bash
# Conectar na EC2
ssh -i sua-chave.pem ec2-user@seu-ip-publico

# Verificar status dos serviços
pm2 status
sudo systemctl status nginx

# Verificar logs
pm2 logs myserv --lines 20
sudo tail -f /var/log/nginx/access.log

# Testar aplicação
curl -I http://localhost:3000
```

### 2️⃣ **Acessar a aplicação**

```
🌐 URL: http://SEU-IP-PUBLICO
```

**Primeiro acesso:**
1. Abra o navegador e acesse a URL
2. Teste o login com usuários de exemplo
3. Navegue pelas funcionalidades

### 3️⃣ **Configurar APIs Externas (Importante)**

#### Google Maps API
```bash
# Editar arquivo de ambiente
sudo nano /var/www/myserv/.env

# Substituir:
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY="sua-chave-real-do-google-maps"

# Reiniciar aplicação
pm2 restart myserv
```

#### MercadoPago (Pagamentos)
```bash
# Configurar MercadoPago
MERCADOPAGO_ACCESS_TOKEN="seu-token-real"
NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY="sua-chave-publica-real"

# Reiniciar aplicação
pm2 restart myserv
```

#### WhatsApp/ChatPro (Notificações)
```bash
# Configurar WhatsApp
CHATPRO_API_KEY="sua-chave-chatpro"
CHATPRO_INSTANCE_ID="seu-instance-id"

# Reiniciar aplicação
pm2 restart myserv
```

### 4️⃣ **Configurar Domínio (Opcional)**

#### Com domínio próprio:
```bash
# 1. Apontar domínio para IP da EC2 (DNS A record)
# 2. Configurar Nginx
sudo nano /etc/nginx/conf.d/myserv.conf

# Alterar linha:
server_name seu-dominio.com www.seu-dominio.com;

# 3. Reiniciar Nginx
sudo systemctl restart nginx

# 4. Configurar SSL
sudo certbot --nginx -d seu-dominio.com -d www.seu-dominio.com
```

### 5️⃣ **Configurar Administração**

#### Criar usuário administrador real:
```bash
# Conectar na aplicação via navegador
# Fazer login como admin@myserv.com / admin123
# Ir para /admin/usuarios
# Criar seu usuário administrador real
# Desativar usuários de teste
```

### 6️⃣ **Configurar Monitoramento**

```bash
# Verificar scripts de monitoramento
ls -la /home/ec2-user/

# Executar manualmente para testar
/home/ec2-user/check-resources.sh
/home/ec2-user/backup-myserv.sh

# Verificar cron jobs
crontab -l

# Ver logs de monitoramento
tail -f /home/ec2-user/resource-monitor.log
```

### 7️⃣ **Segurança e Backup**

#### Configurar backup para S3 (Opcional):
```bash
# Instalar AWS CLI
curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
unzip awscliv2.zip
sudo ./aws/install

# Configurar AWS CLI
aws configure

# Modificar script de backup para enviar para S3
nano /home/ec2-user/backup-myserv.sh
```

#### Configurar alertas por email:
```bash
# Instalar mailutils
sudo yum install -y mailx

# Configurar SMTP no sistema
# Modificar scripts de alerta para enviar email
```

### 8️⃣ **Personalizar a Aplicação**

#### Alterar informações da empresa:
```bash
# Editar arquivos de configuração
sudo nano /var/www/myserv/src/app/layout.tsx
sudo nano /var/www/myserv/public/brand/

# Após alterações, rebuild
cd /var/www/myserv
npm run build
pm2 restart myserv
```

### 9️⃣ **Otimizações de Performance**

#### Para tráfego alto:
```bash
# Aumentar workers do Nginx
sudo nano /etc/nginx/nginx.conf

# Configurar cache
# Configurar compressão
# Otimizar banco de dados
```

### 🔟 **Escalar para Produção**

#### Quando crescer:
1. **Upgrade da instância** (t2.small → t2.medium)
2. **Migrar para RDS** (PostgreSQL)
3. **Configurar Load Balancer**
4. **Adicionar CloudFront CDN**
5. **Implementar CI/CD**

---

## 📱 Checklist Pós-Deploy

- [ ] ✅ Aplicação carregando no navegador
- [ ] ✅ Login funcionando com usuários teste
- [ ] ✅ PM2 e Nginx rodando
- [ ] ⚠️ Google Maps configurado
- [ ] ⚠️ Pagamentos configurados
- [ ] ⚠️ WhatsApp configurado
- [ ] ⚠️ SSL configurado (se domínio)
- [ ] ⚠️ Backup testado
- [ ] ⚠️ Monitoramento ativo
- [ ] ⚠️ Usuário admin real criado

---

## 🆘 Suporte e Problemas

### Problemas comuns:
1. **App não carrega** → `pm2 logs myserv`
2. **502 Error** → `sudo systemctl restart nginx`
3. **Pouca memória** → `/home/ec2-user/cleanup-logs.sh`
4. **SSL não funciona** → Verificar domínio DNS

### Contato:
- **Email:** romariorodrigues.dev@gmail.com
- **GitHub:** https://github.com/romariorodrgues/myserv

---

## 💡 Dicas Importantes

- ✅ **Backup automático** configurado
- ✅ **Monitoramento** ativo
- ✅ **Otimizações** para t2.micro
- ⚠️ **Monitore recursos** regularmente
- ⚠️ **Configure APIs** para funcionalidades completas
- ⚠️ **Use SSL** em produção

---

**🎉 Com este guia, você terá o MyServ rodando em produção em menos de 10 minutos!**

---

*Desenvolvido por **Romário Rodrigues** - romariorodrigues.dev@gmail.com*
