#!/usr/bin/env node

/**
 * Quick lint fixes script for MyServ
 * Author: Romário Rodrigues <romariorodrigues.dev@gmail.com>
 * 
 * Automatically fixes common ESLint issues
 */

const fs = require('fs');
const path = require('path');

console.log('🔧 Aplicando correções rápidas de lint...');

// Lista de arquivos com suas correções
const fixes = [
  {
    file: 'src/app/api/admin/providers/route.ts',
    changes: [
      {
        find: 'export async function GET(request: NextRequest) {',
        replace: 'export async function GET(_request: NextRequest) {'
      },
      {
        find: 'const { password, ...userWithoutPassword } = user',
        replace: 'const { password: _, ...userWithoutPassword } = user'
      }
    ]
  },
  {
    file: 'src/app/api/admin/stats/route.ts',
    changes: [
      {
        find: 'export async function GET(request: NextRequest) {',
        replace: 'export async function GET(_request: NextRequest) {'
      },
      {
        find: 'const completedBookings = await prisma.serviceRequest.count({',
        replace: '// const completedBookings = await prisma.serviceRequest.count({'
      }
    ]
  },
  {
    file: 'src/app/api/admin/users/route.ts',
    changes: [
      {
        find: 'export async function GET(request: NextRequest) {',
        replace: 'export async function GET(_request: NextRequest) {'
      },
      {
        find: 'const { password, ...userWithoutPassword } = user',
        replace: 'const { password: _, ...userWithoutPassword } = user'
      }
    ]
  }
];

let fixesApplied = 0;

fixes.forEach(({ file, changes }) => {
  const filePath = path.join(__dirname, '..', file);
  
  if (fs.existsSync(filePath)) {
    let content = fs.readFileSync(filePath, 'utf8');
    let fileChanged = false;
    
    changes.forEach(({ find, replace }) => {
      if (content.includes(find)) {
        content = content.replace(find, replace);
        fileChanged = true;
        fixesApplied++;
      }
    });
    
    if (fileChanged) {
      fs.writeFileSync(filePath, content);
      console.log(`✅ ${file} - corrigido`);
    }
  } else {
    console.log(`⚠️  ${file} - não encontrado`);
  }
});

console.log(`\n🎉 ${fixesApplied} correções aplicadas com sucesso!`);
console.log('\n📝 Nota: Alguns erros podem precisar de correção manual.');
