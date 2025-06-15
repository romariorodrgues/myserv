#!/usr/bin/env node

/**
 * Script automático de setup para novos desenvolvedores
 * Author: Romário Rodrigues <romariorodrigues.dev@gmail.com>
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

function runCommand(command, description) {
  console.log(`\n🔄 ${description}...`);
  try {
    execSync(command, { stdio: 'inherit', cwd: process.cwd() });
    console.log(`✅ ${description} - Concluído!`);
  } catch (error) {
    console.error(`❌ Erro em: ${description}`);
    console.error(error.message);
    process.exit(1);
  }
}

function createEnvFile() {
  const envPath = '.env.local';
  const envExamplePath = '.env';
  
  console.log('\n🔧 Configurando arquivo de ambiente...');
  
  if (fs.existsSync(envPath)) {
    console.log('⚠️  .env.local já existe, pulando...');
    return;
  }
  
  if (fs.existsSync(envExamplePath)) {
    fs.copyFileSync(envExamplePath, envPath);
    console.log('✅ Arquivo .env.local criado a partir do .env');
    
    // Atualizar algumas configurações
    let envContent = fs.readFileSync(envPath, 'utf8');
    envContent = envContent.replace(
      'NEXTAUTH_SECRET="your-secret-key-here"',
      `NEXTAUTH_SECRET="myserv-secret-${Date.now()}"`
    );
    fs.writeFileSync(envPath, envContent);
    console.log('✅ NEXTAUTH_SECRET gerado automaticamente');
  } else {
    console.log('⚠️  Arquivo .env não encontrado, criando .env.local básico...');
    const basicEnv = `# MyServ Environment Configuration - Auto-generated
DATABASE_URL="file:./prisma/dev.db"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="myserv-secret-${Date.now()}"
`;
    fs.writeFileSync(envPath, basicEnv);
    console.log('✅ .env.local básico criado');
  }
}

function checkPrerequisites() {
  console.log('\n🔍 Verificando pré-requisitos...');
  
  try {
    execSync('node --version', { stdio: 'pipe' });
    console.log('✅ Node.js encontrado');
  } catch (error) {
    console.error('❌ Node.js não encontrado. Instale: https://nodejs.org');
    process.exit(1);
  }
  
  try {
    execSync('npm --version', { stdio: 'pipe' });
    console.log('✅ npm encontrado');
  } catch (error) {
    console.error('❌ npm não encontrado');
    process.exit(1);
  }
}

function showFinalInstructions() {
  console.log('\n' + '='.repeat(60));
  console.log('🎉 SETUP CONCLUÍDO COM SUCESSO!');
  console.log('='.repeat(60));
  console.log('\n📋 PRÓXIMOS PASSOS:');
  console.log('1. Execute: npm run dev');
  console.log('2. Acesse: http://localhost:3000');
  console.log('3. Login com:');
  console.log('   📧 Email: admin@myserv.com');
  console.log('   🔑 Senha: admin123');
  console.log('\n🧪 TESTAR O SISTEMA:');
  console.log('• node scripts/health-check.js');
  console.log('• node scripts/test-credentials.js');
  console.log('\n📚 DOCUMENTAÇÃO:');
  console.log('• README.md - Visão geral do projeto');
  console.log('• GUIA_SETUP_DESENVOLVEDOR.md - Guia completo');
  console.log('\n🆘 SUPORTE:');
  console.log('• Email: romariorodrigues.dev@gmail.com');
  console.log('• GitHub: https://github.com/romariorodrgues/myserv');
  console.log('\n' + '='.repeat(60));
}

async function main() {
  console.log('🚀 INICIANDO SETUP AUTOMÁTICO DO MYSERV');
  console.log('Autor: Romário Rodrigues <romariorodrigues.dev@gmail.com>');
  console.log('='.repeat(60));
  
  // 1. Verificar pré-requisitos
  checkPrerequisites();
  
  // 2. Instalar dependências
  runCommand('npm install', 'Instalando dependências');
  
  // 3. Configurar ambiente
  createEnvFile();
  
  // 4. Setup do banco de dados
  runCommand('npx prisma generate', 'Gerando cliente Prisma');
  runCommand('npx prisma db push', 'Configurando banco de dados');
  
  // 5. Popular com dados de teste
  runCommand('npx prisma db seed', 'Populando banco com dados de teste');
  
  // 6. Verificar se tudo funcionou
  if (fs.existsSync('prisma/dev.db')) {
    console.log('✅ Banco de dados criado com sucesso');
  }
  
  // 7. Instruções finais
  showFinalInstructions();
}

// Executar setup
main().catch((error) => {
  console.error('\n❌ Erro durante o setup:', error.message);
  process.exit(1);
});
