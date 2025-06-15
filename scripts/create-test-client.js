#!/usr/bin/env node

/**
 * Create test client with address for testing
 * Author: Romário Rodrigues <romariorodrigues.dev@gmail.com>
 */

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

async function createTestClient() {
  const prisma = new PrismaClient();
  
  try {
    console.log('👤 Creating test client with complete profile...\n');

    const hashedPassword = await bcrypt.hash('senha123', 10);

    // Create or update test client
    const testClient = await prisma.user.upsert({
      where: { email: 'cliente.teste@myserv.dev' },
      update: {
        name: 'Cliente Teste Silva',
        phone: '(11) 99999-8888',
        isActive: true,
        isApproved: true
      },
      create: {
        email: 'cliente.teste@myserv.dev',
        name: 'Cliente Teste Silva',
        phone: '(11) 99999-8888',
        cpfCnpj: '98765432101',
        password: hashedPassword,
        userType: 'CLIENT',
        isActive: true,
        isApproved: true,
        address: {
          create: {
            street: 'Rua das Flores',
            number: '123',
            district: 'Centro',
            city: 'São Paulo',
            state: 'SP',
            zipCode: '01234-567'
          }
        }
      },
      include: {
        address: true
      }
    });

    console.log('✅ Test client created/updated:');
    console.log(`   - Email: ${testClient.email}`);
    console.log(`   - Password: senha123`);
    console.log(`   - Name: ${testClient.name}`);
    console.log(`   - Phone: ${testClient.phone}`);
    console.log(`   - Address: ${testClient.address ? 'Complete' : 'Missing'}`);
    
    if (testClient.address) {
      console.log(`     ${testClient.address.street}, ${testClient.address.number}`);
      console.log(`     ${testClient.address.city} - ${testClient.address.state}`);
      console.log(`     CEP: ${testClient.address.zipCode}`);
    }

    console.log('\n🧪 Test Instructions:');
    console.log('1. Go to http://localhost:3000/entrar');
    console.log('2. Login with: cliente.teste@myserv.dev / senha123');
    console.log('3. Go to /servicos and click "Contratar" on any service');
    console.log('4. Form should auto-fill with client data');
    console.log('5. Select a provider and fill description');
    console.log('6. Button should enable when form is complete');
    
  } catch (error) {
    console.error('❌ Error creating test client:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

createTestClient();
