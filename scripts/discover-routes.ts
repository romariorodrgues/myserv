/* Route discovery script: scans src/app for page.tsx and builds route lists */
import { globby } from 'globby'
import { writeFileSync, mkdirSync } from 'fs'
import path from 'path'

async function main() {
  const root = process.cwd()
  const files = await globby(['src/app/**/page.{ts,tsx}', '!src/app/api/**'])
  const publicRoutes: string[] = []
  const clientRoutes: string[] = []
  const providerRoutes: string[] = []
  const adminRoutes: string[] = []

  for (const f of files) {
    const rel = f.replace('src/app', '').replace(/\/page\.(ts|tsx)$/,'')
    // Next app router ignores parentheses in URL
    const url = rel
      .replace(/\[[^/]+\]/g, (m) => {
        if (m.includes('serviceId')) return '/servico/demo'
        if (m.includes('bookingId')) return '/agenda'
        return '/demo'
      }) || '/'

    if (url.startsWith('/admin')) adminRoutes.push(url)
    else if (url.startsWith('/dashboard/cliente') || url === '/perfil') clientRoutes.push(url)
    else if (url.startsWith('/dashboard/profissional')) providerRoutes.push(url)
    else publicRoutes.push(url)
  }

  const data = {
    public: Array.from(new Set(publicRoutes)).sort(),
    client: Array.from(new Set(clientRoutes.concat(['/dashboard/cliente?tab=overview','/dashboard/cliente?tab=settings']))).sort(),
    provider: Array.from(new Set(providerRoutes.concat(['/dashboard/profissional?tab=overview','/dashboard/profissional?tab=settings']))).sort(),
    admin: Array.from(new Set(adminRoutes.concat(['/admin/providers']))).sort(),
  }
  const outDir = path.join(root, 'ui-audit')
  mkdirSync(outDir, { recursive: true })
  writeFileSync(path.join(outDir, 'routes.json'), JSON.stringify(data, null, 2))
  console.log('Discovered routes -> ui-audit/routes.json')
}

main().catch((e) => { console.error(e); process.exit(1) })

