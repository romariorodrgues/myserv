#!/usr/bin/env node

/**
 * Testar credenciais de login dos usuários
 * Author: Romário Rodrigues <romariorodrigues.dev@gmail.com>
 */

const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');

async function testCredentials() {
  const prisma = new PrismaClient();
  
  try {
    console.log('🔐 Testando credenciais de usuários...\n');

    const testCredentials = [
      { email: 'cliente.teste@myserv.dev', password: 'senha123' },
      { email: 'cliente@teste.com', password: 'senha123' },
      { email: 'admin@myserv.dev', password: 'admin123' },
      { email: 'admin@myserv.com', password: 'admin123' }
    ];

    for (const cred of testCredentials) {
      console.log(`🧪 Testando: ${cred.email}`);
      
      const user = await prisma.user.findUnique({
        where: { email: cred.email },
        select: {
          id: true,
          email: true,
          name: true,
          password: true,
          userType: true,
          isActive: true,
          isApproved: true
        }
      });

      if (user) {
        const isPasswordValid = await bcrypt.compare(cred.password, user.password);
        
        console.log(`   ✅ Usuário encontrado: ${user.name}`);
        console.log(`   🔐 Senha "${cred.password}": ${isPasswordValid ? '✅ VÁLIDA' : '❌ INVÁLIDA'}`);
        console.log(`   🏷️  Tipo: ${user.userType}`);
        console.log(`   ⚡ Status: ${user.isActive && user.isApproved ? 'Ativo' : 'Inativo'}`);
        
        if (isPasswordValid && user.isActive && user.isApproved) {
          console.log(`   🎯 CREDENCIAL FUNCIONAL: ${cred.email} / ${cred.password}`);
        }
      } else {
        console.log(`   ❌ Usuário não encontrado`);
      }
      console.log('');
    }

    // Criar/atualizar um cliente de teste com credenciais conhecidas
    console.log('🛠️  Criando/atualizando cliente de teste...');
    
    const hashedPassword = await bcrypt.hash('teste123', 10);
    
    const testClient = await prisma.user.upsert({
      where: { email: 'cliente.funcional@myserv.dev' },
      update: {
        password: hashedPassword,
        isActive: true,
        isApproved: true
      },
      create: {
        email: 'cliente.funcional@myserv.dev',
        name: 'Cliente Funcional Teste',
        phone: '(11) 98765-4321',
        cpfCnpj: '11122233344',
        password: hashedPassword,
        userType: 'CLIENT',
        isActive: true,
        isApproved: true,
        address: {
          create: {
            street: 'Rua de Teste Funcional',
            number: '999',
            district: 'Centro',
            city: 'São Paulo',
            state: 'SP',
            zipCode: '01000-000'
          }
        }
      },
      include: { address: true }
    });

    console.log('✅ Cliente de teste criado/atualizado:');
    console.log(`   📧 Email: ${testClient.email}`);
    console.log(`   🔐 Senha: teste123`);
    console.log(`   👨‍💼 Nome: ${testClient.name}`);
    console.log(`   🏠 Endereço: ${testClient.address ? 'Cadastrado' : 'Não cadastrado'}`);

    console.log('\n🎯 CREDENCIAIS FUNCIONAIS CONFIRMADAS:');
    console.log('┌─────────────────────────────────────────┐');
    console.log('│ CLIENTE DE TESTE                        │');
    console.log('│ Email: cliente.funcional@myserv.dev     │');
    console.log('│ Senha: teste123                         │');
    console.log('│ Tipo: CLIENT                            │');
    console.log('│ Status: Ativo e Aprovado                │');
    console.log('└─────────────────────────────────────────┘');

  } catch (error) {
    console.error('❌ Erro ao testar credenciais:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

testCredentials();
