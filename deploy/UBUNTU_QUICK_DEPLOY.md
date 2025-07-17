# 🚀 MyServ - Deploy Rápido Ubuntu Server

> **Instalação em 5 minutos para Ubuntu Server 20.04/22.04**

## ⚡ Instalação Express (Automática)

### 1️⃣ Conectar ao Servidor
```bash
ssh usuario@seu-servidor-ubuntu
```

### 2️⃣ Executar Instalação Automática
```bash
# Baixar e executar script otimizado para Ubuntu
wget https://raw.githubusercontent.com/romariorodrgues/myserv/main/deploy/ubuntu-server-setup.sh
chmod +x ubuntu-server-setup.sh
./ubuntu-server-setup.sh
```

### 3️⃣ Acessar Aplicação
```
🌐 http://SEU-IP-UBUNTU
```

## 📋 O que é Instalado Automaticamente

- ✅ **Node.js 18+** (via NodeSource)
- ✅ **PM2** (gerenciador de processos)
- ✅ **Nginx** (proxy reverso)
- ✅ **UFW Firewall** (portas 22, 80, 443)
- ✅ **MyServ** (aplicação completa)
- ✅ **Monitoramento automático** (health-check)
- ✅ **Backup semanal** automático

## 🎯 Usuários de Teste

| Tipo | Email | Senha |
|------|-------|-------|
| Admin | admin@myserv.com | admin123 |
| Cliente | cliente@teste.com | cliente123 |
| Prestador | prestador@teste.com | prestador123 |

## 🔧 Comandos Essenciais

### Gerenciamento da Aplicação
```bash
# Status da aplicação
pm2 status

# Logs em tempo real
pm2 logs myserv

# Reiniciar aplicação
pm2 restart myserv

# Monitoramento avançado
pm2 monit
```

### Gerenciamento do Nginx
```bash
# Status do Nginx
sudo systemctl status nginx

# Reiniciar Nginx
sudo systemctl restart nginx

# Testar configuração
sudo nginx -t

# Logs do Nginx
sudo tail -f /var/log/nginx/myserv_access.log
```

### Scripts de Monitoramento
```bash
# Verificar saúde do sistema
~/health-check.sh

# Criar backup manual
~/backup-myserv.sh

# Ver logs do health check
tail -f ~/health-check.log
```

## 🛡️ Configuração de SSL (HTTPS)

### Let's Encrypt (Certificado Gratuito)
```bash
# Instalar Certbot
sudo apt install -y certbot python3-certbot-nginx

# Obter certificado (substitua example.com)
sudo certbot --nginx -d example.com

# Verificar renovação automática
sudo certbot renew --dry-run
```

## 🔧 Configurações Avançadas

### Ajustar Variáveis de Ambiente
```bash
cd ~/myserv
nano .env
```

### Configurar Domínio Personalizado
```bash
# Editar configuração do Nginx
sudo nano /etc/nginx/sites-available/myserv

# Alterar a linha:
# server_name _; 
# Para:
# server_name seudominio.com;

# Recarregar configuração
sudo nginx -t && sudo systemctl reload nginx
```

### Otimizar para Mais Usuários
```bash
# Editar limites do PM2
pm2 delete myserv
pm2 start npm --name "myserv" -- start --node-args="--max-old-space-size=512"
pm2 save
```

## ⚠️ Solução de Problemas

### Aplicação não inicia
```bash
# Verificar logs detalhados
pm2 logs myserv --lines 50

# Verificar se porta 3000 está livre
sudo lsof -i :3000

# Reinstalar dependências
cd ~/myserv
rm -rf node_modules
npm install --production
pm2 restart myserv
```

### Nginx retorna 502
```bash
# Verificar se aplicação está rodando
pm2 status

# Verificar logs do Nginx
sudo tail -f /var/log/nginx/myserv_error.log

# Testar conexão direta
curl http://localhost:3000
```

### Problemas de firewall
```bash
# Verificar regras UFW
sudo ufw status

# Adicionar regras se necessário
sudo ufw allow 80
sudo ufw allow 443

# Resetar UFW (cuidado!)
sudo ufw --force reset
sudo ufw enable
sudo ufw allow 22
sudo ufw allow 80
sudo ufw allow 443
```

## 📊 Monitoramento

### Dashboard do PM2
```bash
# Interface web do PM2 (opcional)
pm2 install pm2-server-monit
```

### Logs Centralizados
```bash
# Ver todos os logs importantes
tail -f ~/health-check.log &
sudo tail -f /var/log/nginx/myserv_access.log &
pm2 logs myserv
```

### Alertas por Email (Avançado)
```bash
# Instalar mailutils
sudo apt install -y mailutils

# Configurar alertas no health-check
# (editar ~/health-check.sh e adicionar comandos de email)
```

## 🎯 Performance

### Para Servidores Pequenos (1-2GB RAM)
```bash
# Configurar PM2 com menos memória
pm2 delete myserv
pm2 start npm --name "myserv" -- start --node-args="--max-old-space-size=256"
pm2 save
```

### Para Servidores Maiores (4GB+ RAM)
```bash
# Configurar cluster mode
pm2 delete myserv
pm2 start npm --name "myserv" -- start -i 2
pm2 save
```

## 📞 Suporte

### Verificação Completa do Sistema
```bash
# Script de diagnóstico completo
echo "=== DIAGNÓSTICO MYSERV UBUNTU ==="
echo "Sistema: $(lsb_release -d | cut -f2)"
echo "Usuário: $(whoami)"
echo "Memória: $(free -h | grep Mem)"
echo "Disco: $(df -h / | tail -1)"
echo ""
echo "=== SERVIÇOS ==="
echo "Nginx: $(systemctl is-active nginx)"
echo "UFW: $(sudo ufw status | head -1)"
echo ""
echo "=== APLICAÇÃO ==="
pm2 status
echo ""
echo "=== REDE ==="
echo "Porta 80: $(sudo lsof -i :80 | wc -l) conexões"
echo "Porta 3000: $(sudo lsof -i :3000 | wc -l) conexões"
```

### Links Úteis
- **Manual Completo**: [UBUNTU_SERVER_DEPLOY_GUIDE.md](UBUNTU_SERVER_DEPLOY_GUIDE.md)
- **Repositório**: https://github.com/romariorodrgues/myserv
- **Documentação Ubuntu**: https://ubuntu.com/server/docs

---

## 🎉 Resultado Final

Após a instalação você terá:
- ✅ MyServ rodando em produção
- ✅ HTTPS opcional com Let's Encrypt
- ✅ Monitoramento automático a cada 5 minutos
- ✅ Backup semanal automático
- ✅ Firewall configurado
- ✅ PM2 com auto-restart
- ✅ Logs organizados

**🌐 Acesse: `http://seu-servidor-ubuntu` e comece a usar!**

---
*Deploy para Ubuntu Server - Romário Rodrigues*
