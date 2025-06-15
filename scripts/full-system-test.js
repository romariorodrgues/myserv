#!/usr/bin/env node

/**
 * Full System Test - Complete service request workflow
 * Author: Romário Rodrigues <romariorodrigues.dev@gmail.com>
 */

const { PrismaClient } = require('@prisma/client');

async function fullSystemTest() {
  const prisma = new PrismaClient();
  
  try {
    console.log('🚀 MYSERV - TESTE COMPLETO DO SISTEMA\n');
    console.log('=' .repeat(50));

    // 1. Sistema Status Check
    console.log('\n1️⃣ VERIFICAÇÃO DO SISTEMA');
    console.log('─'.repeat(30));
    
    const userCount = await prisma.user.count();
    const serviceCount = await prisma.service.count();
    const providerCount = await prisma.serviceProvider.count();
    const requestCount = await prisma.serviceRequest.count();
    
    console.log(`👥 Total de usuários: ${userCount}`);
    console.log(`🔧 Total de serviços: ${serviceCount}`);
    console.log(`👨‍💼 Total de prestadores: ${providerCount}`);
    console.log(`📋 Total de solicitações: ${requestCount}`);

    // 2. Credenciais de Teste
    console.log('\n2️⃣ CREDENCIAIS DE TESTE');
    console.log('─'.repeat(30));
    
    const testClient1 = await prisma.user.findUnique({
      where: { email: 'cliente.teste@myserv.dev' },
      include: { address: true }
    });
    
    const testClient2 = await prisma.user.findUnique({
      where: { email: 'cliente.funcional@myserv.dev' },
      include: { address: true }
    });

    if (testClient1) {
      console.log('✅ Cliente Teste 1 encontrado:');
      console.log(`   📧 Email: ${testClient1.email}`);
      console.log(`   👨‍💼 Nome: ${testClient1.name}`);
      console.log(`   🏠 Endereço: ${testClient1.address ? 'Completo' : 'Não cadastrado'}`);
    }

    if (testClient2) {
      console.log('✅ Cliente Teste 2 encontrado:');
      console.log(`   📧 Email: ${testClient2.email}`);
      console.log(`   👨‍💼 Nome: ${testClient2.name}`);
      console.log(`   🏠 Endereço: ${testClient2.address ? 'Completo' : 'Não cadastrado'}`);
    }

    // 3. Serviços Disponíveis
    console.log('\n3️⃣ SERVIÇOS DISPONÍVEIS');
    console.log('─'.repeat(30));
    
    const availableServices = await prisma.service.findMany({
      include: {
        category: true,
        providers: {
          include: {
            serviceProvider: {
              include: {
                user: true
              }
            }
          }
        }
      },
      where: {
        providers: {
          some: {}
        }
      }
    });

    availableServices.forEach((service, index) => {
      console.log(`🔧 ${index + 1}. ${service.name}`);
      console.log(`   📂 Categoria: ${service.category.name}`);
      console.log(`   👥 Prestadores: ${service.providers.length}`);
      
      service.providers.forEach((provider, pIndex) => {
        console.log(`   👨‍💼 ${pIndex + 1}. ${provider.serviceProvider.user.name}`);
        console.log(`       💰 Preço base: R$ ${provider.basePrice}`);
        console.log(`       📅 Agendamento: ${provider.serviceProvider.hasScheduling ? 'Sim' : 'Não'}`);
        console.log(`       💬 Orçamento: ${provider.serviceProvider.hasQuoting ? 'Sim' : 'Não'}`);
      });
      console.log('');
    });

    // 4. URLs de Teste
    console.log('\n4️⃣ URLS PARA TESTE MANUAL');
    console.log('─'.repeat(30));
    console.log('🌐 Aplicação: http://localhost:3003');
    console.log('🔐 Login: http://localhost:3003/entrar');
    console.log('🔧 Serviços: http://localhost:3003/servicos');
    
    if (availableServices.length > 0) {
      const testService = availableServices[0];
      console.log(`📋 Solicitar Serviço: http://localhost:3003/servico/${testService.id}/solicitar`);
    }

    // 5. Instruções de Teste
    console.log('\n5️⃣ INSTRUÇÕES DE TESTE');
    console.log('─'.repeat(30));
    console.log('1. Acesse: http://localhost:3003/entrar');
    console.log('2. Faça login com uma das credenciais:');
    console.log('   📧 cliente.teste@myserv.dev | 🔑 senha123');
    console.log('   📧 cliente.funcional@myserv.dev | 🔑 teste123');
    console.log('3. Vá para: http://localhost:3003/servicos');
    console.log('4. Clique em um serviço e depois em "Contratar"');
    console.log('5. Verifique se os dados são preenchidos automaticamente');
    console.log('6. Teste tanto agendamento quanto orçamento');

    console.log('\n✅ SISTEMA PRONTO PARA TESTE!');
    console.log('=' .repeat(50));
    
  } catch (error) {
    console.error('❌ Erro no teste:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

fullSystemTest();
