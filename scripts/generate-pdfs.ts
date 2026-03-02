#!/usr/bin/env tsx
/**
 * Static PDF Generation Script
 *
 * Generates pre-built copies of the 4 static documents to public/docs/.
 * Run:  npx tsx scripts/generate-pdfs.ts
 *
 * The governance report is intentionally excluded — it must be
 * generated on-demand from live data via the API route.
 */
import { writeFileSync, mkdirSync, existsSync } from 'fs'
import { join } from 'path'

async function main() {
  const outDir = join(process.cwd(), 'public', 'docs')
  if (!existsSync(outDir)) mkdirSync(outDir, { recursive: true })

  console.log('── FTH Prop Sharing — Static PDF Generator ──\n')

  const docs: Array<{
    name: string
    filename: string
    generate: () => Promise<Buffer>
  }> = [
    {
      name: 'Architecture Overview',
      filename: 'FTH_Prop_Architecture_Overview.pdf',
      generate: async () => {
        const { generateArchitectureOverview } = await import('../lib/pdf/architecture')
        return generateArchitectureOverview()
      },
    },
    {
      name: 'Risk & Controls Whitepaper',
      filename: 'FTH_Prop_Risk_Controls_Whitepaper.pdf',
      generate: async () => {
        const { generateWhitepaper } = await import('../lib/pdf/whitepaper')
        return generateWhitepaper()
      },
    },
    {
      name: 'Challenge Rulebook',
      filename: 'FTH_Prop_Challenge_Rulebook.pdf',
      generate: async () => {
        const { generateRulebook } = await import('../lib/pdf/rulebook')
        return generateRulebook()
      },
    },
    {
      name: 'One-Page Brochure',
      filename: 'FTH_Prop_One_Pager.pdf',
      generate: async () => {
        const { generateOnePager } = await import('../lib/pdf/one-pager')
        return generateOnePager()
      },
    },
  ]

  let ok = 0
  let failed = 0

  for (const doc of docs) {
    process.stdout.write(`  ▸ ${doc.name}...`)
    try {
      const buffer = await doc.generate()
      const outPath = join(outDir, doc.filename)
      writeFileSync(outPath, buffer)
      const sizeKB = (buffer.length / 1024).toFixed(1)
      console.log(` ✓  ${sizeKB} KB → ${outPath}`)
      ok++
    } catch (err: any) {
      console.log(` ✗  ${err.message}`)
      failed++
    }
  }

  console.log(`\n  Done: ${ok} generated, ${failed} failed`)
  console.log('  Note: Governance report is dynamic — use /api/prop-sharing/docs/governance\n')
}

main().catch((err) => {
  console.error('Fatal:', err)
  process.exit(1)
})
