# 🎯 MyServ - Guia Pós-Instalação

> **O que fazer após instalar o MyServ na EC2**

## 🚀 Primeiros Passos (Obrigatório)

### 1. Verificar Instalação

```bash
# Conectar na EC2
ssh -i sua-chave.pem ec2-user@seu-ip-publico

# Status dos serviços
pm2 status                    # Aplicação Node.js
sudo systemctl status nginx  # Proxy reverso
```

**✅ Resultado esperado:**
- PM2: `myserv` com status `online`
- Nginx: `active (running)`

### 2. Primeiro Acesso

```
🌐 Abrir navegador: http://SEU-IP-PUBLICO
```

**👥 Usuários de teste:**
- **Admin:** admin@myserv.com / admin123
- **Cliente:** cliente@teste.com / cliente123
- **Profissional:** profissional@teste.com / provider123

### 3. Testar Funcionalidades Básicas

1. **Login/Logout** ✓
2. **Dashboard** ✓
3. **Busca de serviços** ✓
4. **Cadastro de serviços** ✓
5. **Solicitações** ✓

---

## ⚙️ Configurações Essenciais

### 🗺️ Google Maps API (Importante)

**Por que configurar:**
- Busca por localização
- Mapa interativo
- Cálculo de distâncias

**Como configurar:**
```bash
# 1. Obter chave na Google Cloud Console
# 2. Editar arquivo de ambiente
sudo nano /var/www/myserv/.env

# 3. Substituir linha:
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY="AIzaSyC123...sua-chave-real"

# 4. Reiniciar aplicação
pm2 restart myserv
```

### 💳 MercadoPago (Pagamentos)

**Para que serve:**
- Processar pagamentos
- Cobranças de serviços
- Integração com PIX

**Configuração:**
```bash
# 1. Criar conta no MercadoPago
# 2. Obter credenciais
# 3. Configurar no .env
MERCADOPAGO_ACCESS_TOKEN="APP_USR-123...seu-token"
NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY="APP_USR-123...sua-chave"

# 4. Reiniciar
pm2 restart myserv
```

### 📱 WhatsApp/ChatPro (Notificações)

**Funcionalidades:**
- Notificar clientes
- Confirmações de agendamento
- Lembretes automáticos

**Configuração:**
```bash
# 1. Criar conta no ChatPro ou similar
# 2. Configurar no .env
CHATPRO_API_KEY="sua-chave"
CHATPRO_INSTANCE_ID="seu-instance"

# 3. Reiniciar
pm2 restart myserv
```

---

## 🌐 Configurar Domínio (Recomendado)

### 1. Registrar Domínio

- Registre um domínio (ex: meuservico.com.br)
- Configure DNS apontando para IP da EC2

### 2. Configurar Nginx

```bash
# Editar configuração
sudo nano /etc/nginx/conf.d/myserv.conf

# Alterar server_name:
server_name meuservico.com.br www.meuservico.com.br;

# Salvar e reiniciar
sudo systemctl restart nginx
```

### 3. Configurar SSL (Grátis)

```bash
# Instalar Certbot
sudo yum install -y certbot python3-certbot-nginx

# Configurar SSL automático
sudo certbot --nginx -d meuservico.com.br -d www.meuservico.com.br

# Testar renovação automática
sudo certbot renew --dry-run
```

**✅ Resultado:** Site com HTTPS (cadeado verde)

---

## 👑 Configurar Administração

### 1. Criar Administrador Real

```bash
# 1. Acessar: http://seu-dominio/admin
# 2. Login: admin@myserv.com / admin123
# 3. Ir em "Usuários"
# 4. Criar seu usuário admin real
# 5. Desativar usuários de teste
```

### 2. Configurar Empresa

```bash
# Editar informações da empresa
sudo nano /var/www/myserv/src/app/layout.tsx

# Alterar logo/brand
sudo cp seu-logo.png /var/www/myserv/public/brand/logotipo.png

# Rebuild após alterações
cd /var/www/myserv
npm run build
pm2 restart myserv
```

---

## 📊 Monitoramento e Manutenção

### Scripts Automáticos Já Configurados

```bash
# Ver scripts criados
ls -la /home/ec2-user/

# Backup diário (03:00)
/home/ec2-user/backup-myserv.sh

# Limpeza de logs (02:00)
/home/ec2-user/cleanup-logs.sh

# Monitoramento (30min)
/home/ec2-user/check-resources.sh

# Alertas críticos (5min)
/home/ec2-user/resource-alert.sh
```

### Comandos de Monitoramento

```bash
# Status geral
pm2 status
sudo systemctl status nginx
htop
free -h
df -h

# Logs da aplicação
pm2 logs myserv
pm2 logs myserv --lines 100

# Logs do Nginx
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log

# Logs de recursos
tail -f /home/ec2-user/resource-monitor.log
```

---

## 🔒 Segurança e Backup

### Backup Automático

**Já configurado:**
- Backup diário às 03:00
- Mantém últimos 7 backups
- Inclui banco de dados e uploads

**Melhorar backup (S3):**
```bash
# Instalar AWS CLI
curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
unzip awscliv2.zip
sudo ./aws/install

# Configurar
aws configure

# Modificar script para enviar para S3
nano /home/ec2-user/backup-myserv.sh
```

### Firewall e Segurança

```bash
# Verificar firewall
sudo firewall-cmd --list-all

# Verificar Security Group no AWS Console
# Permitir apenas portas necessárias:
# - SSH (22) - Apenas seu IP
# - HTTP (80) - Público
# - HTTPS (443) - Público
```

---

## 📈 Performance e Escalabilidade

### Otimizações Já Aplicadas

- ✅ Swap de 1GB configurado
- ✅ PM2 otimizado para t2.micro
- ✅ Nginx com compressão
- ✅ Limpeza automática de logs
- ✅ Monitoramento de recursos

### Quando Escalar

**Sinais para upgrade:**
- CPU constantemente > 80%
- Memória > 90%
- Muitos usuários simultâneos
- Site lento

**Próximos passos:**
1. **t2.small** ou **t2.medium**
2. **RDS PostgreSQL**
3. **Load Balancer**
4. **CloudFront CDN**

---

## 🛠️ Comandos Úteis Diários

```bash
# Verificar status rápido
pm2 status && sudo systemctl status nginx

# Reiniciar aplicação
pm2 restart myserv

# Reiniciar Nginx
sudo systemctl restart nginx

# Ver recursos
htop
free -h
df -h

# Backup manual
/home/ec2-user/backup-myserv.sh

# Limpeza manual
/home/ec2-user/cleanup-logs.sh

# Atualizar código (se necessário)
cd /var/www/myserv
git pull origin main
npm install
npm run build
pm2 restart myserv
```

---

## 🔍 Troubleshooting

### Problemas Comuns

1. **Site não carrega**
   ```bash
   pm2 logs myserv
   pm2 restart myserv
   ```

2. **Erro 502 Bad Gateway**
   ```bash
   sudo systemctl restart nginx
   pm2 status
   ```

3. **Site lento**
   ```bash
   htop  # Ver CPU/memória
   pm2 restart myserv
   ```

4. **Sem espaço em disco**
   ```bash
   df -h
   /home/ec2-user/cleanup-logs.sh
   ```

5. **Sem memória**
   ```bash
   free -h
   pm2 restart myserv
   ```

---

## ✅ Checklist Pós-Deploy

### Básico (Obrigatório)
- [ ] ✅ Site carregando
- [ ] ✅ Login funcionando
- [ ] ✅ PM2 online
- [ ] ✅ Nginx rodando

### Configurações (Importante)
- [ ] ⚠️ Google Maps API
- [ ] ⚠️ Domínio configurado
- [ ] ⚠️ SSL ativo
- [ ] ⚠️ Admin real criado

### Opcionais (Melhorias)
- [ ] 📱 WhatsApp configurado
- [ ] 💳 Pagamentos ativos
- [ ] 📊 Monitoramento verificado
- [ ] 🔒 Backup testado

---

## 📞 Suporte

**Precisa de ajuda?**
- **Email:** romariorodrigues.dev@gmail.com
- **GitHub:** https://github.com/romariorodrgues/myserv
- **Issues:** https://github.com/romariorodrgues/myserv/issues

---

**🎉 Parabéns! Seu MyServ está rodando em produção!**

Agora você tem uma plataforma completa de marketplace de serviços funcionando na nuvem! 🚀
