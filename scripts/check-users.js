#!/usr/bin/env node

/**
 * Verificar e listar usuários existentes no banco
 * Author: Romário Rodrigues <romariorodrigues.dev@gmail.com>
 */

const { PrismaClient } = require('@prisma/client');

async function checkExistingUsers() {
  const prisma = new PrismaClient();
  
  try {
    console.log('🔍 Verificando usuários existentes no banco...\n');

    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        userType: true,
        isActive: true,
        isApproved: true,
        address: {
          select: {
            street: true,
            number: true,
            city: true,
            state: true,
            zipCode: true
          }
        }
      }
    });

    console.log(`📊 Total de usuários encontrados: ${users.length}\n`);

    users.forEach((user, index) => {
      console.log(`👤 Usuário ${index + 1}:`);
      console.log(`   📧 Email: ${user.email}`);
      console.log(`   👨‍💼 Nome: ${user.name}`);
      console.log(`   🏷️  Tipo: ${user.userType}`);
      console.log(`   ✅ Ativo: ${user.isActive ? 'Sim' : 'Não'}`);
      console.log(`   ✅ Aprovado: ${user.isApproved ? 'Sim' : 'Não'}`);
      console.log(`   🏠 Endereço: ${user.address ? 
        `${user.address.street}, ${user.address.number} - ${user.address.city}/${user.address.state}` : 
        'Não cadastrado'}`);
      console.log('');
    });

    // Verificar especificamente o cliente de teste
    const testClient = await prisma.user.findUnique({
      where: { email: 'cliente.teste@myserv.dev' },
      include: { address: true }
    });

    if (testClient) {
      console.log('🎯 Cliente de teste encontrado:');
      console.log(`   📧 Email: ${testClient.email}`);
      console.log(`   👨‍💼 Nome: ${testClient.name}`);
      console.log(`   🔐 Tem senha: ${testClient.password ? 'Sim' : 'Não'}`);
      console.log(`   🏠 Endereço completo: ${testClient.address ? 'Sim' : 'Não'}`);
    } else {
      console.log('❌ Cliente de teste não encontrado');
    }

    // Verificar cliente@teste.com também
    const altTestClient = await prisma.user.findUnique({
      where: { email: 'cliente@teste.com' },
      include: { address: true }
    });

    if (altTestClient) {
      console.log('\n🎯 Cliente alternativo encontrado:');
      console.log(`   📧 Email: ${altTestClient.email}`);
      console.log(`   👨‍💼 Nome: ${altTestClient.name}`);
      console.log(`   🔐 Tem senha: ${altTestClient.password ? 'Sim' : 'Não'}`);
    }

  } catch (error) {
    console.error('❌ Erro ao verificar usuários:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkExistingUsers();
