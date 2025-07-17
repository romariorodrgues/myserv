# ✅ Checklist Rápido Pós-Deploy

## 🔥 Ações Imediatas (5 minutos)

```bash
# 1. Verificar se está funcionando
curl -I http://SEU-IP-PUBLICO

# 2. Testar login
# Abrir navegador: http://SEU-IP-PUBLICO
# Login: admin@myserv.com / admin123

# 3. Verificar serviços
pm2 status
sudo systemctl status nginx
```

## ⚙️ Configurações Essenciais (30 minutos)

### 🗺️ Google Maps (Obrigatório para busca)
```bash
sudo nano /var/www/myserv/.env
# NEXT_PUBLIC_GOOGLE_MAPS_API_KEY="sua-chave-real"
pm2 restart myserv
```

### 🌐 Domínio + SSL (Recomendado)
```bash
# 1. Apontar DNS para IP da EC2
# 2. Configurar Nginx
sudo nano /etc/nginx/conf.d/myserv.conf
# server_name seu-dominio.com;

# 3. SSL grátis
sudo certbot --nginx -d seu-dominio.com
```

### 👑 Admin Real
```bash
# 1. Acessar /admin
# 2. Criar usuário real
# 3. Desativar usuários teste
```

## 💰 Configurações de Negócio (1 hora)

### 💳 Pagamentos (MercadoPago)
```bash
sudo nano /var/www/myserv/.env
# MERCADOPAGO_ACCESS_TOKEN="seu-token"
# NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY="sua-chave"
pm2 restart myserv
```

### 📱 WhatsApp/Notificações
```bash
sudo nano /var/www/myserv/.env
# CHATPRO_API_KEY="sua-chave"
# CHATPRO_INSTANCE_ID="seu-id"
pm2 restart myserv
```

## 🎨 Personalização (2 horas)

### Logo e Marca
```bash
# Substituir arquivos em:
/var/www/myserv/public/brand/

# Depois:
cd /var/www/myserv
npm run build
pm2 restart myserv
```

### Informações da Empresa
```bash
# Editar layout principal
sudo nano /var/www/myserv/src/app/layout.tsx

# Rebuild
npm run build
pm2 restart myserv
```

## 📊 Monitoramento (Já configurado)

### Ver Status
```bash
# Aplicação
pm2 status
pm2 logs myserv

# Sistema
htop
free -h
df -h

# Logs automáticos
tail -f /home/ec2-user/resource-monitor.log
```

### Scripts Prontos
- ✅ Backup diário (03:00)
- ✅ Limpeza logs (02:00)
- ✅ Monitoramento (30min)
- ✅ Alertas (5min)

## 🚨 Comandos de Emergência

```bash
# App travada
pm2 restart myserv

# Nginx problema
sudo systemctl restart nginx

# Sem espaço
/home/ec2-user/cleanup-logs.sh

# Sem memória
pm2 restart myserv

# Verificar logs
pm2 logs myserv --lines 50
```

## 📋 Status Final

- [ ] ✅ Site carregando
- [ ] ✅ Login funcionando  
- [ ] ⚠️ Google Maps configurado
- [ ] ⚠️ Domínio + SSL
- [ ] ⚠️ Admin real criado
- [ ] ⚠️ Pagamentos ativos
- [ ] ⚠️ Personalização feita

## 🎯 Próximos Passos

1. **Testar todas funcionalidades**
2. **Cadastrar serviços reais**
3. **Divulgar para primeiros usuários**
4. **Monitorar performance**
5. **Escalar conforme crescimento**

---

**🚀 Seu marketplace está no ar! Agora é só fazer negócios!**
