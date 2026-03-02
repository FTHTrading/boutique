import Link from 'next/link'
import {
  Globe,
  FileText,
  Download,
  BookOpen,
  Shield,
  BarChart3,
  Briefcase,
  ArrowLeft,
} from 'lucide-react'

const documents = [
  {
    slug: 'architecture',
    title: 'Architecture Overview',
    description:
      'Executive brochure covering the full platform architecture — Model A structure, multi-layer risk defence, execution simulation, treasury guard, behavioural scoring, capital compounding engine, and governance controls.',
    pages: '10–12 pages',
    audience: 'Executives, Partners, Allocators',
    icon: Briefcase,
    type: 'static' as const,
  },
  {
    slug: 'governance',
    title: 'Retained Earnings & Capital Governance Report',
    description:
      'Live governance snapshot generated from production data — current treasury status, reserve buffer health, compounding policy state, enforcement gate results, and Compounding Readiness Score.',
    pages: '6–8 pages',
    audience: 'Risk Committee, Compliance, Auditors',
    icon: BarChart3,
    type: 'dynamic' as const,
  },
  {
    slug: 'whitepaper',
    title: 'Risk & Controls Whitepaper',
    description:
      'Deep-dive into execution modelling, slippage simulation, spread widening rules, kill switch architecture, behavioural detection, treasury stress scenarios, enforcement verification, and compounding controls.',
    pages: '15–20 pages',
    audience: 'Risk Officers, Engineers, Due Diligence',
    icon: Shield,
    type: 'static' as const,
  },
  {
    slug: 'rulebook',
    title: 'Prop Challenge Rulebook',
    description:
      'Complete programme rules — evaluation targets, verification standards, funded account parameters, pass/fail scenarios, payout structure, freeze & termination triggers, and compliance obligations.',
    pages: '8–10 pages',
    audience: 'Traders, Legal, Compliance',
    icon: BookOpen,
    type: 'static' as const,
  },
  {
    slug: 'one-pager',
    title: 'One-Page Brochure',
    description:
      'Single-page dark-themed overview — what we do, how it works, risk controls, scaling ladder, and contact information. Designed for email and conference distribution.',
    pages: '1 page',
    audience: 'General — Forward to Anyone',
    icon: FileText,
    type: 'static' as const,
  },
]

export default function PropSharingDocsPage() {
  return (
    <main className="bg-[#0d0906] text-[#efebe9] min-h-screen">
      {/* ── Nav ─────────────────────────────────────────────── */}
      <header className="fixed top-0 left-0 right-0 z-50 border-b border-white/5 bg-[#0d0906]/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-amber-700 flex items-center justify-center">
              <Globe size={15} className="text-amber-100" />
            </div>
            <span className="font-bold text-[#efebe9] tracking-tight">FTH Trading</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link
              href="/prop-sharing"
              className="text-sm text-[#a1887f] hover:text-[#efebe9] transition-colors hidden sm:inline-flex items-center gap-1"
            >
              <ArrowLeft size={14} /> Prop Sharing
            </Link>
            <Link
              href="/sign-up"
              className="text-sm font-medium bg-amber-700 hover:bg-amber-600 text-white px-4 py-2 rounded-lg transition-colors"
            >
              Apply Now
            </Link>
          </div>
        </div>
      </header>

      {/* ── Hero ────────────────────────────────────────────── */}
      <section className="relative px-6 pt-28 pb-14 max-w-5xl mx-auto">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-10%,rgba(120,53,15,0.20),transparent)]" />
        <div className="relative">
          <p className="text-xs font-semibold uppercase tracking-widest text-amber-500 mb-4">
            Documentation &amp; Collateral
          </p>
          <h1 className="text-3xl md:text-5xl font-bold leading-tight tracking-tight mb-4">
            Institutional-Grade<br />
            <span className="text-amber-600">Documentation Pack</span>
          </h1>
          <p className="text-[#a1887f] max-w-2xl leading-relaxed">
            Every document you need to evaluate, audit, or present the FTH Prop Sharing
            architecture. Download PDFs instantly — the Governance Report is generated
            live from production data.
          </p>
        </div>
      </section>

      {/* ── Document Cards ──────────────────────────────────── */}
      <section className="max-w-5xl mx-auto px-6 pb-24 space-y-5">
        {documents.map((doc) => {
          const Icon = doc.icon
          return (
            <div
              key={doc.slug}
              className="group relative bg-white/[0.03] border border-white/[0.06] rounded-2xl p-6 md:p-8 hover:border-amber-800/40 hover:bg-white/[0.05] transition-all"
            >
              {/* Badge */}
              {doc.type === 'dynamic' && (
                <span className="absolute top-4 right-4 text-[10px] font-semibold uppercase tracking-widest text-emerald-400 border border-emerald-800/50 bg-emerald-950/40 px-2 py-1 rounded-full">
                  Live Data
                </span>
              )}

              <div className="flex flex-col md:flex-row md:items-start gap-5">
                {/* Icon */}
                <div className="w-12 h-12 rounded-xl bg-amber-900/30 border border-amber-800/30 flex items-center justify-center shrink-0">
                  <Icon size={20} className="text-amber-500" />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <h2 className="text-lg font-semibold text-[#efebe9] mb-1">
                    {doc.title}
                  </h2>
                  <p className="text-sm text-[#a1887f] leading-relaxed mb-4">
                    {doc.description}
                  </p>
                  <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-[#6d4c41]">
                    <span>
                      <strong className="text-[#8d6e63]">Pages:</strong> {doc.pages}
                    </span>
                    <span>
                      <strong className="text-[#8d6e63]">Audience:</strong> {doc.audience}
                    </span>
                    <span>
                      <strong className="text-[#8d6e63]">Format:</strong> PDF
                    </span>
                  </div>
                </div>

                {/* Download */}
                <a
                  href={`/api/prop-sharing/docs/${doc.slug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="shrink-0 inline-flex items-center gap-2 bg-amber-800 hover:bg-amber-700 text-white text-sm font-medium px-5 py-2.5 rounded-xl transition-colors self-start md:self-center"
                >
                  <Download size={14} />
                  Download PDF
                </a>
              </div>
            </div>
          )
        })}

        {/* ── Footer Note ──────────────────────────────────── */}
        <div className="border-t border-white/5 pt-10 mt-10 text-center">
          <p className="text-xs text-[#6d4c41] max-w-lg mx-auto leading-relaxed">
            All documents reference <strong className="text-[#8d6e63]">Engine v5.0</strong>{' '}
            and <strong className="text-[#8d6e63]">Policy v2026.03</strong>. The Governance
            Report is generated in real time from live treasury data. Static documents
            are generated on each request with the current date stamp.
          </p>
          <p className="text-[10px] text-[#4e342e] mt-4">
            CONFIDENTIAL — FTH Trading Ltd. — capital@fthtrading.com
          </p>
        </div>
      </section>
    </main>
  )
}
