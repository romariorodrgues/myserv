/**
 * Database seeding script for MyServ platform
 * Author: Romário Rodrigues <romariorodrigues.dev@gmail.com>
 * 
 * Seeds the database with initial data for development
 */

import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting database seeding...')

  // Create admin user
  const adminPassword = await bcrypt.hash('admin123', 12)
  const admin = await prisma.user.upsert({
    where: { email: 'admin@myserv.com' },
    update: {},
    create: {
      email: 'admin@myserv.com',
      name: 'Administrador MyServ',
      phone: '(11) 99999-0000',
      cpfCnpj: '00000000000',
      password: adminPassword,
      userType: 'ADMIN',
      isActive: true,
      isApproved: true,
    },
  })

  // Create sample client
  const clientPassword = await bcrypt.hash('cliente123', 12)
  const client = await prisma.user.upsert({
    where: { email: 'cliente@teste.com' },
    update: {},
    create: {
      email: 'cliente@teste.com',
      name: 'João Silva',
      phone: '(11) 99999-1111',
      cpfCnpj: '12345678901',
      password: clientPassword,
      userType: 'CLIENT',
      isActive: true,
      isApproved: true,
    },
  })

  // Create client profile
  await prisma.clientProfile.upsert({
    where: { userId: client.id },
    update: {},
    create: {
      userId: client.id,
    },
  })
// Preferences
await prisma.clientPreferences.upsert({
  where: { clientProfileId: clientProfile.id },
  update: {},
  create: {
    clientProfileId: clientProfile.id,
    emailNotifications: true,
    smsNotifications: false,
    pushNotifications: true,
  },
})

// Privacy
await prisma.clientPrivacy.upsert({
  where: { clientProfileId: clientProfile.id },
  update: {},
  create: {
    clientProfileId: clientProfile.id,
    profileVisibility: 'PUBLIC',
    showEmail: false,
    showPhone: true,
    showLocation: true,
  },
})
  // Create sample service provider
  const providerPassword = await bcrypt.hash('provider123', 12)
  const provider = await prisma.user.upsert({
    where: { email: 'profissional@teste.com' },
    update: {},
    create: {
      email: 'profissional@teste.com',
      name: 'Maria Santos',
      phone: '(11) 99999-2222',
      cpfCnpj: '98765432100',
      password: providerPassword,
      userType: 'SERVICE_PROVIDER',
      isActive: true,
      isApproved: true,
    },
  })

  // Create service provider profile
  const serviceProvider = await prisma.serviceProvider.upsert({
    where: { userId: provider.id },
    update: {},
    create: {
      userId: provider.id,
      hasScheduling: true,
      hasQuoting: true,
      chargesTravel: false,
    },
  })

  // Create service categories
  const cleaningCategory = await prisma.serviceCategory.upsert({
    where: { name: 'Limpeza' },
    update: {},
    create: {
      name: 'Limpeza',
      description: 'Serviços de limpeza residencial e comercial',
      icon: '🧹',
      isActive: true,
    },
  })

  const beautyCategory = await prisma.serviceCategory.upsert({
    where: { name: 'Beleza e Bem-estar' },
    update: {},
    create: {
      name: 'Beleza e Bem-estar',
      description: 'Serviços de beleza, estética e bem-estar',
      icon: '💅',
      isActive: true,
    },
  })

  const maintenanceCategory = await prisma.serviceCategory.upsert({
    where: { name: 'Manutenção e Reparos' },
    update: {},
    create: {
      name: 'Manutenção e Reparos',
      description: 'Serviços de manutenção, reparos e reformas',
      icon: '🔧',
      isActive: true,
    },
  })

  // Create services
  let cleaningService = await prisma.service.findFirst({
    where: { name: 'Limpeza Residencial Completa' }
  })
  
  if (!cleaningService) {
    cleaningService = await prisma.service.create({
      data: {
        name: 'Limpeza Residencial Completa',
        description: 'Limpeza completa de residências incluindo todos os cômodos, janelas e áreas externas.',
        categoryId: cleaningCategory.id,
        isActive: true,
      },
    })
  }

  let beautyService = await prisma.service.findFirst({
    where: { name: 'Manicure e Pedicure' }
  })
  
  if (!beautyService) {
    beautyService = await prisma.service.create({
      data: {
        name: 'Manicure e Pedicure',
        description: 'Serviços de manicure e pedicure a domicílio com produtos de alta qualidade.',
        categoryId: beautyCategory.id,
        isActive: true,
      },
    })
  }

  // Create ServiceProviderService relationships
  await prisma.serviceProviderService.upsert({
    where: { 
      serviceProviderId_serviceId: {
        serviceProviderId: serviceProvider.id,
        serviceId: cleaningService.id
      }
    },
    update: {},
    create: {
      serviceProviderId: serviceProvider.id,
      serviceId: cleaningService.id,
      basePrice: 150.00, // R$ 150,00
      description: 'Limpeza completa com produtos de qualidade',
      isActive: true,
    },
  })

  await prisma.serviceProviderService.upsert({
    where: { 
      serviceProviderId_serviceId: {
        serviceProviderId: serviceProvider.id,
        serviceId: beautyService.id
      }
    },
    update: {},
    create: {
      serviceProviderId: serviceProvider.id,
      serviceId: beautyService.id,
      basePrice: 80.00, // R$ 80,00
      description: 'Manicure e pedicure profissional',
      isActive: true,
    },
  })

  // Create addresses
  await prisma.address.upsert({
    where: { userId: client.id },
    update: {},
    create: {
      userId: client.id,
      street: 'Rua das Flores',
      number: '123',
      district: 'Centro',
      city: 'São Paulo',
      state: 'SP',
      zipCode: '01010-000',
    },
  })

  await prisma.address.upsert({
    where: { userId: provider.id },
    update: {},
    create: {
      userId: provider.id,
      street: 'Av. Paulista',
      number: '456',
      district: 'Bela Vista',
      city: 'São Paulo',
      state: 'SP',
      zipCode: '01310-100',
    },
  })

  console.log('✅ Database seeding completed!')
  console.log('\n📧 Test users created:')
  console.log('Admin: admin@myserv.com / admin123')
  console.log('Cliente: cliente@teste.com / cliente123')
  console.log('Profissional: profissional@teste.com / provider123')
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
