/* Static UI scanner for Tailwind pitfalls */
import { globby } from 'globby'
import { readFileSync, writeFileSync, mkdirSync } from 'fs'
import path from 'path'

async function main() {
  const files = await globby(['src/**/*.{ts,tsx}'])
  const issues: any[] = []
  for (const f of files) {
    const text = readFileSync(f, 'utf-8')
    const lines = text.split(/\r?\n/)
    lines.forEach((ln, i) => {
      if (/\bw-\[(\d{3,})px\]/.test(ln)) issues.push({ file: f, line: i+1, rule: 'fixed-width', sample: ln.trim() })
      if (/whitespace-nowrap/.test(ln) && !/(truncate|break-words)/.test(ln)) issues.push({ file: f, line: i+1, rule: 'nowrap-no-truncate', sample: ln.trim() })
      if (/(<Image)(?![^>]*fill)/.test(ln) && !/width\=|height\=/.test(ln)) issues.push({ file: f, line: i+1, rule: 'image-no-fill-or-size', sample: ln.trim() })
    })
  }
  const outDir = path.join('ui-audit')
  mkdirSync(outDir, { recursive: true })
  writeFileSync(path.join(outDir, 'static-scan.md'), issues.map(x => `- ${x.file}:${x.line} [${x.rule}] ${x.sample}`).join('\n'))
  console.log(`Static UI scan complete. ${issues.length} hints -> ui-audit/static-scan.md`)
}

main().catch((e) => { console.error(e); process.exit(1) })

