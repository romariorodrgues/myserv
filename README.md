# MyServ - Plataforma de Marketplace de Serviços

[![Author](https://img.shields.io/badge/Author-Romário%20Rodrigues-blue?style=flat-square)](mailto:romariorodrigues.dev@gmail.com)
[![Next.js](https://img.shields.io/badge/Next.js-15.3.3-black?style=flat-square&logo=next.js)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5+-blue?style=flat-square&logo=typescript)](https://typescriptlang.org)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind%20CSS-3+-blue?style=flat-square&logo=tailwindcss)](https://tailwindcss.com)
[![Prisma](https://img.shields.io/badge/Prisma-5+-2D3748?style=flat-square&logo=prisma)](https://prisma.io)

## 📋 Sobre o Projeto

MyServ é uma plataforma de marketplace de serviços moderna que conecta prestadores de serviços com clientes através de busca baseada em geolocalização e agendamento de compromissos. Inspirado no GetNinjas, apresenta uma interface limpa, responsiva e funcionalidades abrangentes para clientes e prestadores de serviços.

## ✨ Funcionalidades Principais

- 🔐 **Sistema de Autenticação** - Login/registro para clientes e prestadores
- 🗺️ **Busca Geolocalizada** - Encontre serviços próximos usando Google Maps API
- 📅 **Agendamento de Serviços** - Sistema completo de bookings com calendário
- 💳 **Pagamentos Integrados** - MercadoPago e Pagar.me
- ⭐ **Avaliações e Reviews** - Sistema de feedback entre clientes e prestadores
- 📱 **Notificações WhatsApp** - Integração com ChatPro API
- 👤 **Perfis Completos** - Gestão de perfis para clientes e prestadores
- 📊 **Dashboard Administrativo** - Painel de controle completo
- ❤️ **Sistema de Favoritos** - Salve prestadores favoritos
- 📱 **Design Responsivo** - Interface otimizada para todos os dispositivos

## 🚀 Instalação e Configuração

### Pré-requisitos

- Node.js 18+ 
- npm, yarn, pnpm ou bun
- PostgreSQL
- Conta Google (para Maps API)
- Conta MercadoPago/Pagar.me (para pagamentos)

### 1. Clone o repositório

```bash
git clone https://github.com/romariorodrgues/myserv.git
cd myserv
```

### 2. Instale as dependências

```bash
npm install
# ou
yarn install
# ou
pnpm install
# ou
bun install
```

### 3. Configure as variáveis de ambiente

Crie um arquivo `.env.local` na raiz do projeto:

```env
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/myserv"

# NextAuth
NEXTAUTH_SECRET="seu-secret-aqui"
NEXTAUTH_URL="http://localhost:3000"

# Google Maps
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY="sua-chave-google-maps"

# MercadoPago
MERCADOPAGO_ACCESS_TOKEN="seu-token-mercadopago"
NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY="sua-chave-publica-mercadopago"

# Pagar.me
PAGARME_API_KEY="sua-chave-pagarme"

# ChatPro WhatsApp
CHATPRO_API_KEY="sua-chave-chatpro"
CHATPRO_INSTANCE_ID="seu-instance-id"

# Upload
UPLOAD_DIR="public/uploads"
```

### 4. Configure o banco de dados

```bash
# Gerar o cliente Prisma
npx prisma generate

# Executar migrações
npx prisma migrate deploy

# (Opcional) Popular com dados de teste
npx prisma db seed
```

### 5. Execute o projeto

```bash
npm run dev
# ou
yarn dev
# ou
pnpm dev
# ou
bun dev
```

Abra [http://localhost:3000](http://localhost:3000) no seu navegador.

## 🏗️ Estrutura do Projeto

```
myserv/
├── public/                 # Arquivos estáticos
│   ├── brand/             # Logos e identidade visual
│   └── uploads/           # Uploads de usuários
├── prisma/                # Schema e migrações do banco
├── src/
│   ├── app/               # App Router do Next.js
│   │   ├── (auth)/        # Páginas de autenticação
│   │   ├── (dashboard)/   # Dashboard do usuário
│   │   ├── (public)/      # Páginas públicas
│   │   ├── api/           # API Routes
│   │   ├── agenda/        # Sistema de agendamentos
│   │   ├── pesquisa/      # Busca de serviços
│   │   └── prestador/     # Área do prestador
│   ├── components/        # Componentes React
│   │   ├── admin/         # Componentes administrativos
│   │   ├── dashboard/     # Componentes do dashboard
│   │   ├── forms/         # Formulários
│   │   ├── layout/        # Layout e navegação
│   │   ├── maps/          # Componentes de mapas
│   │   ├── notifications/ # Sistema de notificações
│   │   ├── search/        # Componentes de busca
│   │   └── ui/            # Componentes básicos de UI
│   ├── hooks/             # Custom React Hooks
│   ├── lib/               # Utilitários e configurações
│   ├── types/             # Definições de tipos TypeScript
│   └── utils/             # Funções utilitárias
├── scripts/               # Scripts de desenvolvimento e teste
└── docs/                  # Documentação do projeto
```

## 🔌 APIs Disponíveis

### Autenticação
- `POST /api/auth/register` - Registro de usuários
- `POST /api/auth/login` - Login
- `POST /api/auth/logout` - Logout

### Serviços
- `GET /api/services` - Listar serviços
- `POST /api/services` - Criar serviço
- `GET /api/services/[id]` - Detalhes do serviço
- `PUT /api/services/[id]` - Atualizar serviço

### Agendamentos
- `GET /api/bookings` - Listar agendamentos
- `POST /api/bookings` - Criar agendamento
- `PUT /api/bookings/[id]` - Atualizar agendamento
- `DELETE /api/bookings/[id]` - Cancelar agendamento

### Usuários
- `GET /api/users/profile` - Perfil do usuário
- `PUT /api/users/profile` - Atualizar perfil
- `GET /api/providers` - Listar prestadores

### Geolocalização
- `POST /api/geolocation/search` - Busca por localização
- `GET /api/geolocation/nearby` - Serviços próximos

## 🛠️ Tecnologias Utilizadas

- **Frontend**: Next.js 15.3.3, React 19, TypeScript
- **Styling**: Tailwind CSS, Headless UI
- **Database**: PostgreSQL, Prisma ORM
- **Authentication**: NextAuth.js
- **Maps**: Google Maps API
- **Payments**: MercadoPago, Pagar.me
- **Notifications**: ChatPro API (WhatsApp)
- **Upload**: Multer
- **Validation**: Zod
- **Testing**: Jest, Testing Library

## 📱 Funcionalidades Detalhadas

### Para Clientes
- Cadastro e login
- Busca de serviços por categoria e localização
- Visualização de perfis de prestadores
- Agendamento de serviços
- Sistema de pagamentos
- Avaliação de prestadores
- Histórico de agendamentos
- Favoritos

### Para Prestadores
- Cadastro com documentos e certificações
- Gestão de serviços oferecidos
- Calendário de disponibilidade
- Gestão de agendamentos
- Recebimento de pagamentos
- Histórico de trabalhos
- Sistema de avaliações

### Para Administradores
- Dashboard de analytics
- Gestão de usuários
- Moderação de conteúdo
- Relatórios financeiros
- Configurações da plataforma

## 🧪 Testes

Execute os testes com:

```bash
npm run test
# ou
yarn test
```

Para testes específicos:

```bash
# Teste de fluxo de agendamento
npm run test:booking

# Teste de autenticação
npm run test:auth

# Teste de geolocalização
npm run test:geo
```

## 🚀 Deploy

### Vercel (Recomendado)

1. Conecte seu repositório GitHub ao Vercel
2. Configure as variáveis de ambiente
3. Deploy automático a cada push

### Outras opções

- **Railway**: Para deploy com banco PostgreSQL incluído
- **DigitalOcean**: Para VPS customizado
- **AWS**: Para infraestrutura escalável

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para detalhes.

## 👨‍💻 Autor

**Romário Rodrigues**
- Email: romariorodrigues.dev@gmail.com
- LinkedIn: [linkedin.com/in/romariorodrigues](https://linkedin.com/in/romariorodrigues)
- GitHub: [@romariorodrgues](https://github.com/romariorodrgues)

## 🤝 Contribuição

Contribuições são bem-vindas! Por favor, leia as diretrizes de contribuição antes de enviar um PR.

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📞 Suporte

Se você encontrar algum problema ou tiver dúvidas, abra uma issue no GitHub ou entre em contato através do email romariorodrigues.dev@gmail.com.
