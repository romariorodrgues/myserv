#!/bin/bash

# MyServ - Deploy Automático para EC2
# Autor: Romário Rodrigues <romariorodrigues.dev@gmail.com>

set -e

echo "🚀 MyServ - Deploy Automático para EC2 t2.micro"
echo "================================================"
echo ""

# Verificar parâmetros
if [ $# -lt 2 ]; then
    echo "❌ Uso: $0 <arquivo-chave.pem> <ip-publico-ec2>"
    echo ""
    echo "Exemplo:"
    echo "  $0 minha-chave.pem 54.123.456.789"
    echo ""
    exit 1
fi

KEY_FILE="$1"
EC2_IP="$2"
EC2_USER="ec2-user"

# Verificar se arquivo de chave existe
if [ ! -f "$KEY_FILE" ]; then
    echo "❌ Arquivo de chave não encontrado: $KEY_FILE"
    exit 1
fi

# Verificar permissões da chave
chmod 600 "$KEY_FILE"

echo "🔑 Chave SSH: $KEY_FILE"
echo "🌐 IP da EC2: $EC2_IP"
echo "👤 Usuário: $EC2_USER"
echo ""

# Testar conexão SSH
echo "🔍 Testando conexão SSH..."
if ! ssh -i "$KEY_FILE" -o ConnectTimeout=10 -o BatchMode=yes "$EC2_USER@$EC2_IP" "echo 'Conexão OK'" 2>/dev/null; then
    echo "❌ Não foi possível conectar na EC2. Verifique:"
    echo "  - IP está correto"
    echo "  - Instância está rodando"
    echo "  - Security Group permite SSH (porta 22)"
    echo "  - Chave SSH está correta"
    exit 1
fi

echo "✅ Conexão SSH OK"
echo ""

# Fazer upload dos scripts
echo "📁 Enviando scripts de instalação..."
scp -i "$KEY_FILE" -o StrictHostKeyChecking=no \
    deploy/ec2-setup.sh \
    deploy/optimize-t2micro.sh \
    "$EC2_USER@$EC2_IP:~/"

echo "✅ Scripts enviados"
echo ""

# Executar instalação
echo "🔧 Iniciando instalação remota..."
ssh -i "$KEY_FILE" -o StrictHostKeyChecking=no "$EC2_USER@$EC2_IP" << 'EOF'
# Dar permissões
chmod +x ec2-setup.sh optimize-t2micro.sh

# Executar instalação
echo "🚀 Executando instalação principal..."
./ec2-setup.sh

echo ""
echo "⚡ Executando otimizações..."
./optimize-t2micro.sh

echo ""
echo "🎉 Instalação concluída!"
EOF

# Verificar se aplicação está rodando
echo ""
echo "🔍 Verificando aplicação..."
sleep 5

if curl -s -o /dev/null -w "%{http_code}" "http://$EC2_IP" | grep -q "200\|301\|302"; then
    echo "✅ Aplicação está rodando!"
else
    echo "⚠️  Aplicação pode estar inicializando. Aguarde alguns minutos."
fi

echo ""
echo "🎉 DEPLOY CONCLUÍDO!"
echo "===================="
echo ""
echo "🌐 Acesse sua aplicação em:"
echo "   http://$EC2_IP"
echo ""
echo "👥 Usuários de teste:"
echo "   Admin: admin@myserv.com / admin123"
echo "   Cliente: cliente@teste.com / cliente123"
echo "   Profissional: profissional@teste.com / provider123"
echo ""
echo "🔧 Comandos úteis (SSH):"
echo "   ssh -i $KEY_FILE $EC2_USER@$EC2_IP"
echo "   pm2 status"
echo "   pm2 logs myserv"
echo "   sudo systemctl status nginx"
echo ""
echo "📊 Monitoramento:"
echo "   ~/check-resources.sh"
echo "   ~/resource-monitor.log"
echo ""
echo "🔒 Para configurar SSL:"
echo "   sudo certbot --nginx -d seu-dominio.com"
echo ""
echo "✅ Deploy finalizado com sucesso!"
