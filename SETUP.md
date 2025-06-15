# MyServ - Quick Development Setup

**Author:** Romário Rodrigues <romariorodrigues.dev@gmail.com>

## 🚀 Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Setup Database
```bash
# Run migrations
npx prisma migrate dev --name init

# Seed with test data
npx prisma db seed
```

### 3. Start Development Server
```bash
npm run dev
```

The application will be available at `http://localhost:3003`

## 🧪 Test the System

### 1. Check System Status
Visit: `http://localhost:3003/status`

### 2. Test Authentication
Login with test users:
- **Admin:** admin@myserv.com / admin123
- **Client:** cliente@teste.com / cliente123  
- **Provider:** profissional@teste.com / provider123

### 3. Test Admin Features
Login as admin and visit: `http://localhost:3003/admin/integrations`

## 🔧 Available Scripts

```bash
# Development
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server

# Database
npx prisma studio    # Open Prisma database browser
npx prisma migrate   # Run database migrations  
npx prisma db seed   # Seed database with test data
npx prisma generate  # Generate Prisma client

# Linting
npm run lint         # Run ESLint
```

## 📁 Key Files & Directories

```
src/
├── app/                    # Next.js app directory
│   ├── (auth)/            # Authentication pages
│   ├── (dashboard)/       # Protected dashboard pages
│   ├── admin/             # Admin panel
│   └── api/               # API routes
├── components/            # Reusable UI components
├── lib/                   # Services and utilities
└── types/                 # TypeScript type definitions

prisma/
├── schema.prisma          # Database schema
├── seed.ts               # Database seeding script
└── migrations/           # Database migrations
```

## 🔌 Integrations

The system includes integrations for:
- **Payment:** MercadoPago, Pagar.me
- **Notifications:** WhatsApp (ChatPro), Email (SMTP)
- **Maps:** Google Maps API
- **Authentication:** NextAuth.js

Configure API keys in `.env.local` for full functionality.

## 🏗️ Architecture

- **Frontend:** Next.js 14+ with App Router
- **Backend:** Node.js API routes
- **Database:** SQLite (dev) / PostgreSQL (prod)
- **ORM:** Prisma
- **Auth:** NextAuth.js
- **Styling:** Tailwind CSS
- **Language:** TypeScript

## 🐛 Troubleshooting

### Database Issues
```bash
# Reset database
npx prisma migrate reset --force

# Regenerate client
npx prisma generate
```

### Environment Issues
Make sure `.env.local` exists with all required variables.

### Port Conflicts
The app automatically finds available ports. Check terminal output for the actual port.

## 📞 Support

For issues or questions, contact: romariorodrigues.dev@gmail.com
