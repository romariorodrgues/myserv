#!/usr/bin/env node

/**
 * Create Test Service Providers
 * Author: Romário Rodrigues <romariorodrigues.dev@gmail.com>
 * 
 * Cria profissionais de teste para demonstrar a funcionalidade de aprovação
 */

const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

async function createTestProviders() {
  console.log('🔧 Criando profissionais de teste...')

  try {
    // Buscar serviços existentes
    const cleaningService = await prisma.service.findFirst({
      where: { name: { contains: 'Limpeza' } }
    })

    const beautyService = await prisma.service.findFirst({
      where: { name: { contains: 'Manicure' } }
    })

    if (!cleaningService || !beautyService) {
      console.log('❌ Serviços básicos não encontrados. Execute primeiro o seed.')
      return
    }

    // Criar profissionais de teste
    const testProviders = [
      {
        name: 'Maria Silva Santos',
        email: 'maria.silva@teste.com',
        phone: '(11) 99999-1111',
        cpfCnpj: '123.456.789-01',
        password: await bcrypt.hash('provider123', 12),
        userType: 'SERVICE_PROVIDER',
        isActive: true,
        isApproved: false, // Aguardando aprovação
        description: 'Profissional de limpeza com 5 anos de experiência',
        address: {
          state: 'SP',
          city: 'São Paulo',
          district: 'Vila Mariana',
          street: 'Rua das Flores',
          number: '123',
          zipCode: '04123-000'
        },
        services: [cleaningService.id]
      },
      {
        name: 'Ana Carolina Oliveira',
        email: 'ana.oliveira@teste.com',
        phone: '(11) 98888-2222',
        cpfCnpj: '987.654.321-02',
        password: await bcrypt.hash('provider123', 12),
        userType: 'SERVICE_PROVIDER',
        isActive: true,
        isApproved: false, // Aguardando aprovação
        description: 'Manicure e pedicure profissional certificada',
        address: {
          state: 'SP',
          city: 'São Paulo',
          district: 'Pinheiros',
          street: 'Avenida Paulista',
          number: '456',
          zipCode: '01234-000'
        },
        services: [beautyService.id]
      },
      {
        name: 'João Pedro Costa',
        email: 'joao.costa@teste.com',
        phone: '(11) 97777-3333',
        cpfCnpj: '456.789.123-03',
        password: await bcrypt.hash('provider123', 12),
        userType: 'SERVICE_PROVIDER',
        isActive: true,
        isApproved: false, // Aguardando aprovação
        description: 'Especialista em limpeza residencial e comercial',
        address: {
          state: 'RJ',
          city: 'Rio de Janeiro',
          district: 'Copacabana',
          street: 'Rua Barata Ribeiro',
          number: '789',
          zipCode: '22011-000'
        },
        services: [cleaningService.id, beautyService.id]
      }
    ]

    for (const providerData of testProviders) {
      // Verificar se o usuário já existe
      const existingUser = await prisma.user.findUnique({
        where: { email: providerData.email }
      })

      if (existingUser) {
        console.log(`⚠️  Usuário ${providerData.email} já existe, pulando...`)
        continue
      }

      // Criar usuário
      const user = await prisma.user.create({
        data: {
          name: providerData.name,
          email: providerData.email,
          phone: providerData.phone,
          cpfCnpj: providerData.cpfCnpj,
          password: providerData.password,
          userType: providerData.userType,
          isActive: providerData.isActive,
          isApproved: providerData.isApproved,
          approvalStatus: providerData.isApproved ? 'APPROVED' : 'PENDING',
          emailVerified: true,
          emailVerifiedAt: new Date(),
          phoneVerified: true,
          phoneVerifiedAt: new Date(),
          description: providerData.description
        }
      })

      // Criar endereço
      await prisma.address.create({
        data: {
          userId: user.id,
          state: providerData.address.state,
          city: providerData.address.city,
          district: providerData.address.district,
          street: providerData.address.street,
          number: providerData.address.number || "123",
          zipCode: providerData.address.zipCode
        }
      })

      // Criar perfil de profissional
      const serviceProvider = await prisma.serviceProvider.create({
        data: {
          userId: user.id,
          hasScheduling: true,
          hasQuoting: true,
          chargesTravel: true,
          travelCost: 15.0
        }
      })

      // Associar serviços
      for (const serviceId of providerData.services) {
        await prisma.serviceProviderService.create({
          data: {
            serviceProviderId: serviceProvider.id,
            serviceId: serviceId,
            basePrice: Math.floor(Math.random() * 100) + 50, // Preço entre 50-150
            description: `Serviço profissional oferecido por ${providerData.name}`,
            isActive: true
          }
        })
      }

      console.log(`✅ Profissional criado: ${providerData.name} (${providerData.email})`)
    }

    console.log('\n🎉 Profissionais de teste criados com sucesso!')
    console.log('\n📋 Resumo:')
    console.log('- 3 profissionais aguardando aprovação')
    console.log('- Credenciais: email do profissional / password: provider123')
    console.log('- Acesse /admin/providers para ver e aprovar os profissionais')

  } catch (error) {
    console.error('❌ Erro ao criar profissionais de teste:', error)
  } finally {
    await prisma.$disconnect()
  }
}

createTestProviders()
