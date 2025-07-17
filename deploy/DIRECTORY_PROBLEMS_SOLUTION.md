# 🏠 Guia de Problemas de Diretório

## ❌ Problema Identificado

```
bash: line 134: cd: /home/ec2-user: No such file or directory
```

Este erro indica que:
1. O usuário atual não é `ec2-user`
2. O diretório `/home/ec2-user` não existe
3. O sistema tem uma configuração diferente

## ✅ Soluções Disponíveis

### 🚀 Solução UNIVERSAL (Recomendada)

Use nosso script que detecta automaticamente o usuário e diretório corretos:

```bash
# Instalação que detecta automaticamente tudo
wget https://raw.githubusercontent.com/romariorodrgues/myserv/main/deploy/ec2-setup-universal.sh
chmod +x ec2-setup-universal.sh
./ec2-setup-universal.sh
```

### 🔍 Solução com Diagnóstico Primeiro

```bash
# Diagnóstico completo e solução automática
wget https://raw.githubusercontent.com/romariorodrgues/myserv/main/deploy/diagnose-systemd.sh
chmod +x diagnose-systemd.sh
./diagnose-systemd.sh
```

### 🛠️ Verificação Manual

Para entender o problema:

```bash
# Verificar usuário atual
whoami

# Verificar diretório home
echo $HOME

# Verificar se diretório existe
ls -la $HOME

# Verificar permissões
ls -ld $HOME
```

## 💡 O que o Script Universal Faz

1. ✅ **Detecta automaticamente:**
   - Usuário atual (`whoami`)
   - Diretório home correto (`$HOME`)
   - Sistema operacional
   - Gerenciador de pacotes

2. ✅ **Cria diretórios se necessário:**
   - Cria o diretório home se não existir
   - Ajusta permissões automaticamente
   - Usa `/tmp` como fallback se necessário

3. ✅ **Funciona em qualquer sistema:**
   - Amazon Linux, Ubuntu, CentOS
   - Qualquer usuário (ec2-user, ubuntu, centos, root)
   - Containers, VMs, bare metal

## 🎯 Usuários Comuns por Sistema

- **Amazon Linux**: `ec2-user`
- **Ubuntu**: `ubuntu`
- **CentOS/RHEL**: `centos` ou `ec2-user`
- **Debian**: `admin`

## 📋 Verificação Pós-Instalação

Após executar o script universal:

```bash
# Verificar onde foi instalado
pm2 status

# Localizar arquivos do MyServ
find ~ -name "myserv" -type d 2>/dev/null

# Verificar script de saúde
find ~ -name "health-check.sh" 2>/dev/null
```

## 🔧 Comandos de Emergência

Se tudo falhar:

```bash
# Usar diretório atual
git clone https://github.com/romariorodrgues/myserv.git
cd myserv
npm install
npx prisma generate
npx prisma db push
npx prisma db seed
pm2 start npm --name myserv -- start
```

## 🏆 Por que Nossa Solução é Melhor

- ✅ **Detecta automaticamente** o ambiente
- ✅ **Funciona com qualquer usuário**
- ✅ **Cria diretórios se necessário**
- ✅ **Suporta múltiplos sistemas**
- ✅ **Não assume nada sobre o ambiente**

O script universal resolve TODOS os problemas de compatibilidade!
