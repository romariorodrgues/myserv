#!/bin/bash

# Script para configurar Security Group para MyServ
# Autor: Romário Rodrigues <romariorodrigues.dev@gmail.com>

set -e

echo "🔒 Configurando Security Group para MyServ"
echo "=========================================="

# Verificar se AWS CLI está instalado
if ! command -v aws &> /dev/null; then
    echo "❌ AWS CLI não está instalado. Instale primeiro:"
    echo "curl 'https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip' -o 'awscliv2.zip'"
    echo "unzip awscliv2.zip"
    echo "sudo ./aws/install"
    exit 1
fi

# Verificar se está configurado
if ! aws sts get-caller-identity &> /dev/null; then
    echo "❌ AWS CLI não está configurado. Configure com:"
    echo "aws configure"
    exit 1
fi

# Variáveis
SG_NAME="myserv-security-group"
SG_DESCRIPTION="Security Group para MyServ - Marketplace de Serviços"
VPC_ID=""

# Obter VPC padrão se não especificado
if [ -z "$VPC_ID" ]; then
    VPC_ID=$(aws ec2 describe-vpcs --filters "Name=isDefault,Values=true" --query 'Vpcs[0].VpcId' --output text)
    echo "📋 Usando VPC padrão: $VPC_ID"
fi

# Obter IP público atual
MY_IP=$(curl -s http://checkip.amazonaws.com)
echo "🌐 Seu IP público: $MY_IP"

# Criar Security Group
echo "🔐 Criando Security Group..."
SG_ID=$(aws ec2 create-security-group \
    --group-name "$SG_NAME" \
    --description "$SG_DESCRIPTION" \
    --vpc-id "$VPC_ID" \
    --query 'GroupId' \
    --output text)

echo "✅ Security Group criado: $SG_ID"

# Adicionar regras
echo "📝 Adicionando regras de entrada..."

# SSH (22) - Apenas seu IP
aws ec2 authorize-security-group-ingress \
    --group-id "$SG_ID" \
    --protocol tcp \
    --port 22 \
    --cidr "$MY_IP/32"

echo "✅ SSH (22) - Apenas seu IP: $MY_IP"

# HTTP (80) - Todo mundo
aws ec2 authorize-security-group-ingress \
    --group-id "$SG_ID" \
    --protocol tcp \
    --port 80 \
    --cidr "0.0.0.0/0"

echo "✅ HTTP (80) - Público"

# HTTPS (443) - Todo mundo
aws ec2 authorize-security-group-ingress \
    --group-id "$SG_ID" \
    --protocol tcp \
    --port 443 \
    --cidr "0.0.0.0/0"

echo "✅ HTTPS (443) - Público"

# Next.js Dev (3000) - Todo mundo (apenas para desenvolvimento)
aws ec2 authorize-security-group-ingress \
    --group-id "$SG_ID" \
    --protocol tcp \
    --port 3000 \
    --cidr "0.0.0.0/0"

echo "✅ Next.js (3000) - Público (desenvolvimento)"

# Mostrar regras configuradas
echo ""
echo "📋 Regras configuradas:"
aws ec2 describe-security-groups \
    --group-ids "$SG_ID" \
    --query 'SecurityGroups[0].IpPermissions' \
    --output table

echo ""
echo "🎉 Security Group configurado com sucesso!"
echo "Security Group ID: $SG_ID"
echo "Nome: $SG_NAME"
echo ""
echo "🚀 Próximos passos:"
echo "1. Criar instância EC2 t2.micro com Amazon Linux 2"
echo "2. Associar este Security Group à instância"
echo "3. Executar o script de instalação: ./ec2-setup.sh"
echo ""
echo "⚠️  Lembre-se:"
echo "- Use este Security Group ao criar sua instância EC2"
echo "- Configure seu Key Pair para acesso SSH"
echo "- O script ec2-setup.sh automatiza toda a instalação"
