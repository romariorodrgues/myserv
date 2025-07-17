# 🔧 Guia de Soluções para Problemas de Instalação

## ❌ Problemas Identificados

### 1. Conflito do Curl
```
Error: problem with installed package curl-minimal-8.11.1-4.amzn2023.0.1.x86_64
package curl-minimal conflicts with curl
```

### 2. Conflito do Node.js
```
file /usr/lib/node_modules/npm/bin/npm from install of nodejs-2:18.20.8-1nodesource.x86_64 conflicts with file from package nodejs20-npm-1:10.8.2-1.20.18.3.1.amzn2023.0.1.x86_64
```

### 3. Problema do systemd
```
System has not been booted with systemd as init system (PID 1). Can't operate.
Failed to connect to bus: Host is down
```

## ✅ Soluções Disponíveis

### 🚀 Solução UNIVERSAL: Diagnóstico Automático

Detecta e resolve TODOS os problemas automaticamente:

```bash
# Diagnóstico e solução automática
wget https://raw.githubusercontent.com/romariorodrgues/myserv/main/deploy/diagnose-systemd.sh
chmod +x diagnose-systemd.sh
./diagnose-systemd.sh
```

### 🛠️ Soluções Específicas

#### Para Problemas de systemd:
```bash
# Instalação sem dependência de systemd
wget https://raw.githubusercontent.com/romariorodrgues/myserv/main/deploy/ec2-setup-no-systemd.sh
chmod +x ec2-setup-no-systemd.sh
./ec2-setup-no-systemd.sh
```

#### Para Todos os Conflitos (systemd funcionando):
```bash
# Usar Node.js existente e evitar conflitos
wget https://raw.githubusercontent.com/romariorodrgues/myserv/main/deploy/ec2-setup-ultra-simple.sh
chmod +x ec2-setup-ultra-simple.sh
./ec2-setup-ultra-simple.sh
```

### ⚡ Solução Para Conflitos do Curl

```bash
# Correção específica para curl
wget https://raw.githubusercontent.com/romariorodrgues/myserv/main/deploy/fix-curl-conflicts.sh
chmod +x fix-curl-conflicts.sh
./fix-curl-conflicts.sh
```

### 🔄 Solução Manual (Últimos Recursos)

#### Para Conflitos de Curl:
```bash
# Remover curl-minimal
sudo yum remove -y curl-minimal

# Instalar curl resolvendo conflitos
sudo yum install -y curl --allowerasing

# Continuar instalação
wget https://raw.githubusercontent.com/romariorodrgues/myserv/main/deploy/ec2-setup.sh
chmod +x ec2-setup.sh
./ec2-setup.sh
```

#### Para Conflitos de Node.js:
```bash
# Remover todas as versões
sudo yum remove -y nodejs* npm*
sudo yum autoremove -y

# Instalar versão do Amazon Linux
sudo yum install -y nodejs npm

# Usar instalação ultra simplificada
wget https://raw.githubusercontent.com/romariorodrgues/myserv/main/deploy/ec2-setup-ultra-simple.sh
chmod +x ec2-setup-ultra-simple.sh
./ec2-setup-ultra-simple.sh
```

## 📋 Verificação Pós-Correção

Após executar qualquer solução:

```bash
# Verificar ferramentas disponíveis
which node   # Deve retornar: /usr/bin/node
which npm    # Deve retornar: /usr/bin/npm
which wget   # Deve retornar: /usr/bin/wget

# Verificar versões
node --version
npm --version

# Verificar instalação do MyServ
pm2 status
sudo systemctl status nginx
```

## 💡 Por que esses erros acontecem?

1. **Curl**: Amazon Linux 2023 vem com `curl-minimal` que conflita com `curl` completo
2. **Node.js**: Múltiplas fontes de instalação (Amazon repos vs NodeSource) geram conflitos
3. **npm**: Diferentes versões do npm podem conflitar entre si

## 🎯 Resultado Final

Após qualquer solução, você deve ter:
- ✅ MyServ rodando na porta 3000
- ✅ Nginx proxy na porta 80
- ✅ PM2 gerenciando a aplicação
- ✅ Acesso via: `http://SEU-IP-PUBLICO`

## 📞 Suporte

Se nenhuma solução funcionar:
1. Reinicie a instância EC2
2. Use: `ec2-setup-ultra-simple.sh` (mais compatível)
3. Verifique Security Groups (porta 80 aberta)
4. Consulte `POST_INSTALL_GUIDE.md` para configuração manual
