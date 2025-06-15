# 🚀 Guia de Setup para Desenvolvedores - MyServ

**Autor:** Romário Rodrigues <romariorodrigues.dev@gmail.com>  
**Data:** 15 de junho de 2025  
**Versão:** 1.0

---

## 📋 **Pré-requisitos**

Antes de iniciar, certifique-se de ter instalado:

- **Node.js 18+** ([Download](https://nodejs.org))
- **npm, yarn, pnpm ou bun** (gerenciador de pacotes)
- **Git** ([Download](https://git-scm.com))
- **VS Code** (recomendado) com extensões:
  - Prisma
  - TypeScript
  - Tailwind CSS IntelliSense
  - ES7+ React/Redux/React-Native snippets

---

## 🔧 **Passo a Passo - Setup Completo**

### 1️⃣ **Clone do Repositório**

```bash
# Clone o repositório
git clone https://github.com/romariorodrgues/myserv.git

# Entre no diretório
cd myserv

# Verifique se está na branch correta
git branch
```

### 2️⃣ **Instalação de Dependências**

```bash
# Usando npm (recomendado)
npm install

# OU usando yarn
yarn install

# OU usando pnpm
pnpm install

# OU usando bun
bun install
```

### 3️⃣ **Configuração do Ambiente**

**Copie o arquivo de ambiente:**
```bash
# No macOS/Linux
cp .env .env.local

# No Windows
copy .env .env.local
```

**Edite o arquivo `.env.local` com suas configurações:**
```env
# Database (SQLite - pronto para uso)
DATABASE_URL="file:./prisma/dev.db"

# NextAuth.js (OBRIGATÓRIO)
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="seu-secret-unico-aqui-2025"

# Google Maps (OPCIONAL - para geolocalização)
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY="sua-chave-google-maps"

# MercadoPago (OPCIONAL - para pagamentos)
MERCADOPAGO_ACCESS_TOKEN="TEST-seu-token-mercadopago"
NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY="TEST-sua-chave-publica"

# WhatsApp/ChatPro (OPCIONAL)
CHATPRO_API_KEY="sua-chave-chatpro"
CHATPRO_INSTANCE_ID="seu-instance-id"

# Upload (padrão)
UPLOAD_DIR="public/uploads"
```

### 4️⃣ **Setup do Banco de Dados**

```bash
# Gerar cliente Prisma
npx prisma generate

# Criar/atualizar banco de dados
npx prisma db push

# Popular com dados de teste (IMPORTANTE)
npx prisma db seed
```

### 5️⃣ **Iniciar o Servidor de Desenvolvimento**

```bash
# Iniciar com Turbopack (mais rápido)
npm run dev

# OU iniciar modo tradicional
npx next dev
```

**O servidor estará disponível em:** http://localhost:3000

---

## 🧪 **Verificação do Setup**

### ✅ **Checklist de Funcionamento**

1. **Servidor funcionando**: http://localhost:3000 carrega
2. **Login funcional**: 
   - Email: `admin@myserv.com`
   - Senha: `admin123`
3. **Banco de dados**: `prisma/dev.db` existe
4. **Credenciais de teste**: Usuários criados pelo seed

### 🔍 **Scripts de Teste Disponíveis**

```bash
# Verificar saúde do sistema
node scripts/health-check.js

# Testar credenciais de usuários
node scripts/test-credentials.js

# Verificar usuários no banco
node scripts/check-users.js

# Teste completo do sistema
node scripts/full-system-test.js
```

---

## 👥 **Credenciais de Teste Pré-configuradas**

### 🔐 **Admin**
```
Email: admin@myserv.com
Senha: admin123
Tipo: ADMIN
```

### 👤 **Cliente de Teste**
```
Email: cliente@teste.com
Senha: cliente123
Tipo: CLIENT
```

### 👨‍💼 **Prestador de Teste**
```
Email: profissional@teste.com
Senha: provider123
Tipo: SERVICE_PROVIDER
```

---

## 🌐 **URLs Principais do Sistema**

- **Homepage**: http://localhost:3000
- **Login**: http://localhost:3000/entrar
- **Cadastro**: http://localhost:3000/cadastro
- **Dashboard Admin**: http://localhost:3000/admin/dashboard
- **Serviços**: http://localhost:3000/servicos
- **Pesquisa**: http://localhost:3000/pesquisa
- **Status do Sistema**: http://localhost:3000/status

---

## 🛠️ **Comandos Úteis para Desenvolvimento**

### **Banco de Dados**
```bash
# Visualizar banco (Prisma Studio)
npx prisma studio

# Reset completo do banco
npx prisma migrate reset

# Aplicar mudanças no schema
npx prisma db push

# Popular novamente com dados
npm run db:seed
```

### **Build e Deploy**
```bash
# Build de produção
npm run build

# Verificar types
npm run type-check

# Linting
npm run lint
```

### **Desenvolvimento**
```bash
# Servidor com hot reload
npm run dev

# Modo debug (verbose)
npm run dev -- --debug
```

---

## 🚨 **Problemas Comuns e Soluções**

### ❌ **"Module not found"**
```bash
# Reinstalar dependências
rm -rf node_modules package-lock.json
npm install
```

### ❌ **"Prisma Client not generated"**
```bash
npx prisma generate
npx prisma db push
```

### ❌ **"Authentication error"**
- Verifique se `NEXTAUTH_SECRET` está configurado
- Confirme se `NEXTAUTH_URL` está correto

### ❌ **"Database error"**
```bash
# Resetar banco completamente
rm -f prisma/dev.db
npx prisma db push
npx prisma db seed
```

### ❌ **"Port 3000 already in use"**
```bash
# Usar porta diferente
npm run dev -- --port 3001

# OU matar processo na porta 3000
lsof -ti:3000 | xargs kill -9
```

---

## 📁 **Estrutura de Arquivos Importantes**

```
myserv/
├── .env.local              # Configurações locais (NÃO versionar)
├── package.json            # Dependências e scripts
├── next.config.ts          # Configuração do Next.js
├── tailwind.config.ts      # Configuração do Tailwind
├── prisma/
│   ├── schema.prisma       # Schema do banco de dados
│   ├── seed.ts             # Dados de teste
│   └── dev.db              # Banco SQLite (gerado)
├── src/
│   ├── app/                # App Router (páginas)
│   ├── components/         # Componentes React
│   ├── lib/                # Utilitários
│   └── types/              # Tipos TypeScript
└── scripts/                # Scripts de automação
```

---

## 🎯 **Próximos Passos**

Após o setup completo:

1. **Explore o sistema**: Navegue pelas páginas principais
2. **Teste funcionalidades**: Login, cadastro, serviços
3. **Configure APIs**: Google Maps, MercadoPago (opcional)
4. **Leia a documentação**: Veja os arquivos `*.md` no projeto
5. **Execute testes**: Use os scripts de teste disponíveis

---

## 🆘 **Suporte**

Se encontrar problemas:

1. **Verifique logs**: Console do navegador e terminal
2. **Execute diagnósticos**: Scripts de teste automático
3. **Consulte documentação**: Arquivos MD do projeto
4. **Contato**: romariorodrigues.dev@gmail.com

---

## 📊 **Funcionalidades Implementadas**

✅ **Sistema de Autenticação** (NextAuth.js)  
✅ **CRUD de Usuários** (Clientes, Prestadores, Admin)  
✅ **Sistema de Serviços** (Busca, Categorias)  
✅ **Agendamentos** (Bookings completos)  
✅ **Geolocalização** (Google Maps + fallback)  
✅ **Pagamentos** (MercadoPago integrado)  
✅ **Notificações** (WhatsApp + Sistema interno)  
✅ **Reviews/Avaliações** (Sistema completo)  
✅ **Dashboard Admin** (Gestão completa)  
✅ **Interface Moderna** (Tailwind CSS + Radix UI)  
✅ **Sistema de Favoritos**  
✅ **Upload de Arquivos**  

---

**🎉 Setup concluído! O MyServ está pronto para desenvolvimento.**

**Autor:** Romário Rodrigues  
**Email:** romariorodrigues.dev@gmail.com  
**GitHub:** [@romariorodrgues](https://github.com/romariorodrgues)
