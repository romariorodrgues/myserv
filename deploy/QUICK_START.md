# 🚀 MyServ - Deploy Simplificado para EC2

> **Instale o MyServ em uma instância t2.micro em apenas 3 comandos!**

## 📋 Pré-requisitos

### 1. Instância EC2
- **Tipo:** t2.micro
- **OS:** Amazon Linux 2
- **Storage:** 8GB+ EBS
- **Key Pair:** Configurado

### 2. Security Group
Permita essas portas:
- SSH (22) - Seu IP
- HTTP (80) - 0.0.0.0/0
- HTTPS (443) - 0.0.0.0/0

## 🎯 Instalação Ultra-Rápida

```bash
# 1. Baixar scripts
git clone https://github.com/romariorodrgues/myserv.git
cd myserv/deploy

# 2. Executar deploy automático
./deploy-to-ec2.sh sua-chave.pem IP-DA-EC2

# 3. Acessar aplicação
# http://IP-DA-EC2
```

### Exemplo Prático:
```bash
./deploy-to-ec2.sh minha-chave.pem 54.123.456.789
```

## 🔐 Usuários de Teste

- **Admin:** admin@myserv.com / admin123
- **Cliente:** cliente@teste.com / cliente123
- **Profissional:** profissional@teste.com / provider123

## 🛠️ Instalação Manual (Alternativa)

### 1. Conectar na EC2
```bash
ssh -i sua-chave.pem ec2-user@IP-DA-EC2
```

### 2. Instalar MyServ
```bash
curl -O https://raw.githubusercontent.com/romariorodrgues/myserv/main/deploy/ec2-setup.sh
chmod +x ec2-setup.sh
./ec2-setup.sh
```

### 3. Otimizar para t2.micro
```bash
curl -O https://raw.githubusercontent.com/romariorodrgues/myserv/main/deploy/optimize-t2micro.sh
chmod +x optimize-t2micro.sh
./optimize-t2micro.sh
```

## 📊 Monitoramento

```bash
# Status da aplicação
pm2 status

# Logs
pm2 logs myserv

# Recursos do sistema
htop
free -h
df -h

# Monitoramento automático
~/check-resources.sh
```

## 🔧 Comandos Úteis

```bash
# Reiniciar aplicação
pm2 restart myserv

# Reiniciar Nginx
sudo systemctl restart nginx

# Backup manual
~/backup-myserv.sh

# Limpeza de logs
~/cleanup-logs.sh
```

## 🔒 SSL (Opcional)

```bash
# Instalar Certbot
sudo yum install -y certbot python3-certbot-nginx

# Configurar SSL
sudo certbot --nginx -d seu-dominio.com
```

## 📈 Recursos Incluídos

### ✅ Instalação Automática
- Node.js 18+
- PM2 (gerenciador de processos)
- Nginx (proxy reverso)
- SQLite (banco de dados)
- Certificados SSL (via Certbot)

### ✅ Otimizações t2.micro
- Swap de 1GB
- Configurações de memória
- Compressão Gzip
- Limpeza automática de logs
- Monitoramento de recursos

### ✅ Automação
- Backup diário (03:00)
- Limpeza de logs (02:00)
- Monitoramento (30min)
- Alertas críticos (5min)

## 🔍 Troubleshooting

### App não carrega
```bash
pm2 logs myserv
pm2 restart myserv
```

### Erro 502
```bash
sudo systemctl status nginx
sudo systemctl restart nginx
```

### Sem espaço/memória
```bash
df -h
free -h
~/cleanup-logs.sh
```

## 💡 Dicas Importantes

- ✅ **Monitore recursos** regularmente
- ✅ **Configure SSL** para produção
- ✅ **Backup automático** já configurado
- ⚠️ **t2.micro tem limitações** - monitore CPU/memória
- ⚠️ **Configure APIs externas** para funcionalidades completas

---

**🎉 Em menos de 10 minutos você terá o MyServ rodando em produção!**

Para suporte: romariorodrigues.dev@gmail.com
