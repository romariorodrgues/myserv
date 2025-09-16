/* Headless UI audit (no assertions). Reads ui-audit/routes.json and takes screenshots */
import { chromium, Browser, Page } from 'playwright'
import { readFileSync, writeFileSync, mkdirSync } from 'fs'
import path from 'path'

const baseURL = process.env.BASE_URL || 'http://localhost:3000'
const viewports = [
  { name: 'mobile-375', width: 375, height: 812 },
  { name: 'desktop-1080', width: 1080, height: 900 },
]

async function login(page: Page, role: 'client'|'provider'|'admin') {
  await page.goto(baseURL + '/entrar')
  const creds: Record<string, { email: string; password: string }> = {
    admin: { email: 'admin@myserv.com', password: 'admin123' },
    client: { email: 'cliente@teste.com', password: '12345678' },
    provider: { email: 'profissional@teste.com', password: 'provider123' },
  }
  const c = creds[role]
  await page.fill('input[type="email"]', c.email)
  await page.fill('input[type="password"]', c.password)
  await page.click('button[type="submit"]')
  await page.waitForLoadState('networkidle')
}

async function main() {
  const routes = JSON.parse(readFileSync(path.join('ui-audit','routes.json'), 'utf-8'))
  const outDir = path.join('ui-audit','screenshots')
  mkdirSync(outDir, { recursive: true })
  const report: any[] = []

  const browser: Browser = await chromium.launch()
  for (const vp of viewports) {
    const context = await browser.newContext({ viewport: { width: vp.width, height: vp.height } })
    const page = await context.newPage()

    // public
    for (const url of routes.public) {
      await page.goto(baseURL + url)
      await page.waitForLoadState('networkidle')
      const overflow = await page.evaluate(() => document.scrollingElement!.scrollWidth > window.innerWidth)
      const shot = path.join(outDir, `${vp.name}-${url.replace(/\W+/g,'_')}.png`)
      await page.screenshot({ path: shot, fullPage: false })
      report.push({ viewport: vp.name, route: url, overflow })
    }

    // roles
    for (const [role, urls] of Object.entries(routes).filter(([k]) => k !== 'public')) {
      await login(page, role as any)
      for (const url of urls as string[]) {
        await page.goto(baseURL + url)
        await page.waitForLoadState('networkidle')
        const overflow = await page.evaluate(() => document.scrollingElement!.scrollWidth > window.innerWidth)
        const shot = path.join(outDir, `${vp.name}-${role}-${url.replace(/\W+/g,'_')}.png`)
        await page.screenshot({ path: shot, fullPage: false })
        report.push({ viewport: vp.name, role, route: url, overflow })
      }
    }

    await context.close()
  }
  await browser.close()
  writeFileSync(path.join('ui-audit','report.md'), report.map(r => `- [${r.viewport}] ${r.role? r.role: 'public'} ${r.route} overflow=${r.overflow}`).join('\n'))
  console.log('UI audit complete -> ui-audit/report.md')
}

main().catch((e) => { console.error(e); process.exit(1) })

