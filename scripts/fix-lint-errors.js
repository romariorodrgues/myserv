#!/usr/bin/env node

/**
 * Auto-fix script for critical lint errors
 * Author: Romário Rodrigues <romariorodrigues.dev@gmail.com>
 */

const fs = require('fs');
const path = require('path');

const fixes = [
  // Remove unused imports
  {
    file: 'src/app/(dashboard)/dashboard/profissional/page.tsx',
    find: ', MapPin, User',
    replace: ''
  },
  {
    file: 'src/app/(dashboard)/dashboard/profissional/page.tsx',
    find: 'import { Card, CardHeader, CardTitle, CardContent } from \'@/components/ui/card\'',
    replace: '// import { Card, CardHeader, CardTitle, CardContent } from \'@/components/ui/card\''
  },
  {
    file: 'src/app/(public)/seja-profissional/page.tsx',
    find: ', MapPin',
    replace: ''
  },
  {
    file: 'src/components/layout/header-new.tsx',
    find: ', MapPin',
    replace: ''
  },
  {
    file: 'src/components/layout/header.tsx',
    find: ', MapPin',
    replace: ''
  },
  // Fix unused variables by prefixing with underscore
  {
    file: 'src/app/api/admin/providers/route.ts',
    find: 'export async function GET(_request: Request)',
    replace: 'export async function GET(_request: Request)'
  },
  {
    file: 'src/app/api/admin/stats/route.ts',
    find: 'export async function GET(_request: Request)',
    replace: 'export async function GET(_request: Request)'
  },
  {
    file: 'src/app/api/admin/users/route.ts',
    find: 'export async function GET(_request: Request)',
    replace: 'export async function GET(_request: Request)'
  },
];

console.log('🔧 Fixing critical lint errors...\n');

fixes.forEach(fix => {
  const filePath = path.join(__dirname, '..', fix.file);
  
  if (fs.existsSync(filePath)) {
    let content = fs.readFileSync(filePath, 'utf8');
    
    if (content.includes(fix.find)) {
      content = content.replace(fix.find, fix.replace);
      fs.writeFileSync(filePath, content);
      console.log(`✅ Fixed: ${fix.file}`);
    } else {
      console.log(`⚠️  Pattern not found in: ${fix.file}`);
    }
  } else {
    console.log(`❌ File not found: ${fix.file}`);
  }
});

console.log('\n✨ Lint fixes completed!');
