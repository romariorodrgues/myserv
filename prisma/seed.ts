/**
 * Database seeding script for MyServ platform
 * Author: Romário Rodrigues <romariorodrigues.dev@gmail.com>
 * 
 * Seeds the database with initial data for development
 */

import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'
import { promises as fs } from 'fs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting database seeding...')

  // Create admin user
  const adminPassword = await bcrypt.hash('admin123', 12)
  await prisma.user.upsert({
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
  const clientProfile = await prisma.clientProfile.upsert({
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
    whatsappNotifications: true,
    marketingEmails: false,
    serviceReminders: true,
    reviewRequests: true,
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

  // Linkar o provedor a serviços CANÔNICOS (folhas) já criados pelo seed de categorias
  // Execute antes: `npm run db:seed:categories` para popular a árvore + Services por leaf.
  const targetServiceNames = [
    // boas opções conforme o seed-categories.ts
    'Diarista/Limpeza de casa',
    'Manicure/Pedicure',
  ] as const

  const servicesToAttach = await prisma.service.findMany({
    where: { name: { in: targetServiceNames as unknown as string[] }, isActive: true },
    select: { id: true, name: true },
  })

  // Create ServiceProviderService relationships
  for (const svc of servicesToAttach) {
    const basePrice = svc.name.includes('Manicure') ? 80.0 : 150.0
    await prisma.serviceProviderService.upsert({
      where: {
        serviceProviderId_serviceId: {
          serviceProviderId: serviceProvider.id,
          serviceId: svc.id,
        },
      },
      update: {},
      create: {
        serviceProviderId: serviceProvider.id,
        serviceId: svc.id,
        basePrice,
        unit: 'FIXED',
        description: `Atendimento para ${svc.name.toLowerCase()}`,
        isActive: true,
      },
    })
  }

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
      // opcional: incluir coordenadas para liberar filtro por distância
      latitude: -23.561684,
      longitude: -46.656139,
    },
  })

  // creates plans

  const startPlan = await prisma.plan.upsert({
    where: { name: 'Start' },
    update: {},
    create: {
      name: 'Start',
      description: 'Plano inicial com recursos básicos para freelancers e pequenas empresas.',
      price: 0,
      features: JSON.stringify(['Propostas ilimitadas', 'Relatórios completos', 'Agenda personalizada', 'Controle de precificação de serviço']),
      isActive: true,
      billingCycle: 'MONTHLY',
    },
  })

  await prisma.subscription.create({
    data: {
      serviceProviderId: serviceProvider.id,
      planId: startPlan.id,
      startDate: new Date(),
      status: 'ACTIVE',
      isAutoRenew: false,
    },
  })

  const [termsContentRaw, privacyContentRaw] = await Promise.all([
    fs.readFile('termodeuso', 'utf8').catch(() => ''),
    fs.readFile('politicas', 'utf8').catch(() => ''),
  ])

  const legalEntries = [
    { key: 'LEGAL_TERMS_OF_USE', value: termsContentRaw.trim() },
    { key: 'LEGAL_PRIVACY_POLICY', value: privacyContentRaw.trim() },
    { key: 'LEGAL_TERMS_VERSION', value: new Date().toISOString() },
  ]

  for (const entry of legalEntries) {
    if (!entry.value) continue
    await prisma.systemSettings.upsert({
      where: { key: entry.key },
      update: { value: entry.value },
      create: { key: entry.key, value: entry.value },
    })
  }

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
