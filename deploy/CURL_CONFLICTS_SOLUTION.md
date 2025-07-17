# 🔧 Guia de Soluções para Conflitos de Curl

## ❌ Problema Identificado

Erro durante instalação:
```
Error: problem with installed package curl-minimal-8.11.1-4.amzn2023.0.1.x86_64
package curl-minimal conflicts with curl
```

## ✅ Soluções Disponíveis

### 🚀 Solução 1: Script de Correção Automática

```bash
# Baixar e executar correção
wget https://raw.githubusercontent.com/romariorodrgues/myserv/main/deploy/fix-curl-conflicts.sh
chmod +x fix-curl-conflicts.sh
./fix-curl-conflicts.sh
```

### 🛠️ Solução 2: Instalação Simplificada (Recomendada)

Use o script sem dependências de curl:

```bash
# Baixar script simplificado
wget https://raw.githubusercontent.com/romariorodrgues/myserv/main/deploy/ec2-setup-simple.sh
chmod +x ec2-setup-simple.sh
./ec2-setup-simple.sh
```

### ⚡ Solução 3: Correção Manual

```bash
# 1. Remover curl-minimal
sudo yum remove -y curl-minimal

# 2. Limpar cache
sudo yum clean all

# 3. Instalar curl resolvendo conflitos
sudo yum install -y curl --allowerasing

# 4. Se falhar, usar --skip-broken
sudo yum install -y curl --skip-broken

# 5. Continuar com instalação normal
wget https://raw.githubusercontent.com/romariorodrgues/myserv/main/deploy/ec2-setup.sh
chmod +x ec2-setup.sh
./ec2-setup.sh
```

### 🔄 Solução 4: Reinstalação Completa

Se tudo falhar, remover e reinstalar:

```bash
# Remover pacotes conflitantes
sudo yum remove -y curl curl-minimal

# Reinstalar apenas o necessário
sudo yum install -y wget git

# Usar instalação simplificada
wget https://raw.githubusercontent.com/romariorodrgues/myserv/main/deploy/ec2-setup-simple.sh
chmod +x ec2-setup-simple.sh
./ec2-setup-simple.sh
```

## 📋 Verificação Pós-Correção

Após executar qualquer solução:

```bash
# Verificar ferramentas disponíveis
which wget  # Deve retornar: /usr/bin/wget
which curl  # Opcional, pode falhar
which git   # Deve retornar: /usr/bin/git

# Verificar instalação do MyServ
pm2 status
sudo systemctl status nginx
```

## 💡 Por que esse erro acontece?

O Amazon Linux 2023 vem com `curl-minimal` pré-instalado, que conflita com o pacote `curl` completo. Isso é normal e nossa solução resolve automaticamente.

## 🎯 Resultado Final

Após qualquer solução, você deve ter:
- ✅ MyServ rodando na porta 3000
- ✅ Nginx proxy na porta 80
- ✅ PM2 gerenciando a aplicação
- ✅ Acesso via: `http://SEU-IP-PUBLICO`

## 📞 Suporte

Se nenhuma solução funcionar:
1. Verifique se está usando Amazon Linux 2023
2. Confirme que tem permissões sudo
3. Tente reiniciar a instância EC2
4. Use a instalação manual do guia `MANUAL_INSTALL.md`
