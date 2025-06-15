#!/usr/bin/env node

/**
 * Script de verificação de saúde do sistema MyServ
 * Author: Romário Rodrigues <romariorodrigues.dev@gmail.com>
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

function checkFile(filePath, description) {
  const exists = fs.existsSync(filePath);
  console.log(`${exists ? '✅' : '❌'} ${description}: ${exists ? 'OK' : 'FALTANDO'}`);
  return exists;
}

function checkCommand(command, description) {
  try {
    execSync(command, { stdio: 'pipe' });
    console.log(`✅ ${description}: OK`);
    return true;
  } catch (error) {
    console.log(`❌ ${description}: ERRO`);
    return false;
  }
}

function checkEnvVar(varName, description) {
  const value = process.env[varName];
  const exists = !!value;
  console.log(`${exists ? '✅' : '⚠️ '} ${description}: ${exists ? 'Configurado' : 'Não configurado'}`);
  return exists;
}

async function checkDatabase() {
  try {
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();
    
    const userCount = await prisma.user.count();
    const serviceCount = await prisma.service.count();
    
    console.log(`✅ Banco de dados: ${userCount} usuários, ${serviceCount} serviços`);
    
    await prisma.$disconnect();
    return true;
  } catch (error) {
    console.log(`❌ Banco de dados: Erro - ${error.message}`);
    return false;
  }
}

async function healthCheck() {
  console.log('🏥 VERIFICAÇÃO DE SAÚDE DO SISTEMA MYSERV');
  console.log('='.repeat(50));
  
  console.log('\n📁 ARQUIVOS ESSENCIAIS:');
  let filesOk = true;
  filesOk &= checkFile('package.json', 'package.json');
  filesOk &= checkFile('.env.local', '.env.local');
  filesOk &= checkFile('prisma/schema.prisma', 'Schema Prisma');
  filesOk &= checkFile('src/app/layout.tsx', 'Layout principal');
  filesOk &= checkFile('src/app/page.tsx', 'Página inicial');
  
  console.log('\n🔧 DEPENDÊNCIAS:');
  let depsOk = true;
  depsOk &= checkCommand('node --version', 'Node.js');
  depsOk &= checkCommand('npm --version', 'npm');
  depsOk &= checkFile('node_modules', 'node_modules');
  
  console.log('\n🌍 VARIÁVEIS DE AMBIENTE:');
  // Carregar .env.local se existir
  if (fs.existsSync('.env.local')) {
    try {
      require('dotenv').config({ path: '.env.local' });
    } catch (e) {
      // dotenv pode não estar disponível
    }
  }
  
  let envOk = true;
  envOk &= checkEnvVar('DATABASE_URL', 'DATABASE_URL');
  envOk &= checkEnvVar('NEXTAUTH_SECRET', 'NEXTAUTH_SECRET');
  envOk &= checkEnvVar('NEXTAUTH_URL', 'NEXTAUTH_URL');
  checkEnvVar('NEXT_PUBLIC_GOOGLE_MAPS_API_KEY', 'Google Maps API (opcional)');
  checkEnvVar('MERCADOPAGO_ACCESS_TOKEN', 'MercadoPago (opcional)');
  
  console.log('\n🗄️  BANCO DE DADOS:');
  const dbOk = await checkDatabase();
  
  console.log('\n📊 RESUMO:');
  console.log('='.repeat(30));
  
  const allChecks = [
    { name: 'Arquivos', status: filesOk },
    { name: 'Dependências', status: depsOk },
    { name: 'Ambiente', status: envOk },
    { name: 'Banco de dados', status: dbOk }
  ];
  
  let overallHealth = true;
  allChecks.forEach(check => {
    console.log(`${check.status ? '✅' : '❌'} ${check.name}: ${check.status ? 'OK' : 'PROBLEMA'}`);
    overallHealth &= check.status;
  });
  
  console.log('\n' + '='.repeat(50));
  if (overallHealth) {
    console.log('🎉 SISTEMA SAUDÁVEL! Pronto para desenvolvimento.');
    console.log('\n🚀 Para iniciar:');
    console.log('   npm run dev');
    console.log('\n🌐 Acesse:');
    console.log('   http://localhost:3000');
    console.log('\n🔐 Login de teste:');
    console.log('   Email: admin@myserv.com');
    console.log('   Senha: admin123');
  } else {
    console.log('⚠️  PROBLEMAS DETECTADOS!');
    console.log('\n🔧 Para corrigir:');
    if (!filesOk) console.log('   • Verifique se todos os arquivos foram clonados');
    if (!depsOk) console.log('   • Execute: npm install');
    if (!envOk) console.log('   • Configure o arquivo .env.local');
    if (!dbOk) console.log('   • Execute: npx prisma db push && npx prisma db seed');
    console.log('\n📚 Consulte: GUIA_SETUP_DESENVOLVEDOR.md');
  }
  
  console.log('\n📧 Suporte: romariorodrigues.dev@gmail.com');
  console.log('='.repeat(50));
  
  process.exit(overallHealth ? 0 : 1);
}

// Verificar se dotenv está disponível
try {
  require('dotenv');
} catch (error) {
  // dotenv pode não estar instalado, tudo bem
}

healthCheck().catch(error => {
  console.error('❌ Erro durante verificação:', error.message);
  process.exit(1);
});
      );
      
      if (success) {
        passed++;
      } else {
        failed++;
      }
    } catch (error) {
      console.log(`❌ ${test.name}: Error - ${error.message}`);
      failed++;
    }
  }
  
  console.log(`\n📊 Results: ${passed} passed, ${failed} failed`);
  
  if (failed === 0) {
    console.log('🎉 All tests passed! MyServ is healthy.');
  } else {
    console.log('⚠️  Some tests failed. Check the issues above.');
  }
}

runTests().catch(console.error);
