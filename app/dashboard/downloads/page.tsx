'use client'

import {
  Download, FileText, BookOpen, Shield, BarChart3,
  Briefcase, ExternalLink, Globe, GraduationCap,
  Coffee, Coins, AlertTriangle,
} from 'lucide-react'

/* ── Document definitions grouped by category ────── */

interface DocEntry {
  slug: string
  title: string
  description: string
  pages: string
  audience: string
  icon: any
  badge: string | null
  color: string
}

interface CategoryGroup {
  label: string
  description: string
  docs: DocEntry[]
}

const categories: CategoryGroup[] = [
  {
    label: 'Platform',
    description: 'High-level overviews of the FTH Trading system',
    docs: [
      {
        slug: 'platform-overview',
        title: 'Platform Overview',
        description: 'Complete guide to the FTH ecosystem — commodities, prop sharing, funding, settlement, risk, compliance, and technology stack. Start here.',
        pages: '12–15 pages',
        audience: 'Everyone — Start Here',
        icon: Globe,
        badge: 'Start Here',
        color: 'blue',
      },
      {
        slug: 'one-pager',
        title: 'One-Page Brochure',
        description: 'Dark-themed single-page overview — what we do, how it works, risk controls, and contact info. Email & conference ready.',
        pages: '1 page',
        audience: 'General — Forward to Anyone',
        icon: FileText,
        badge: null,
        color: 'gray',
      },
    ],
  },
  {
    label: 'Commodities',
    description: 'Educational guides for commodity trading on FTH',
    docs: [
      {
        slug: 'commodities-guide',
        title: 'Commodities Trading Guide',
        description: 'Educational reference — all 6 commodities, HS codes explained, incoterms decoded, grading standards, trade finance instruments, compliance, and how to get started.',
        pages: '20–25 pages',
        audience: 'Traders, Partners, Sourcing Teams',
        icon: Coffee,
        badge: 'Educational',
        color: 'emerald',
      },
    ],
  },
  {
    label: 'Prop Sharing',
    description: 'Institutional documentation for the funded trading programme',
    docs: [
      {
        slug: 'architecture',
        title: 'Architecture Overview',
        description: 'Executive brochure — Model A structure, multi-layer risk defence, execution simulation, treasury guard, behavioural scoring, capital compounding engine.',
        pages: '10–12 pages',
        audience: 'Executives, Partners, Allocators',
        icon: Briefcase,
        badge: null,
        color: 'amber',
      },
      {
        slug: 'governance',
        title: 'Governance Report',
        description: 'Live snapshot — current treasury status, reserve buffer health, compounding policy state, enforcement gates, and Compounding Readiness Score.',
        pages: '6–8 pages',
        audience: 'Risk Committee, Compliance, Auditors',
        icon: BarChart3,
        badge: 'Live Data',
        color: 'emerald',
      },
      {
        slug: 'whitepaper',
        title: 'Risk & Controls Whitepaper',
        description: 'Technical deep-dive — execution modelling, slippage simulation, spread widening, kill switches, behavioural detection, treasury stress scenarios.',
        pages: '15–20 pages',
        audience: 'Risk Officers, Engineers, Due Diligence',
        icon: Shield,
        badge: null,
        color: 'amber',
      },
      {
        slug: 'rulebook',
        title: 'Challenge Rulebook',
        description: 'Complete programme rules — evaluation targets, verification standards, funded account parameters, pass/fail scenarios, payout structure.',
        pages: '8–10 pages',
        audience: 'Traders, Legal, Compliance',
        icon: BookOpen,
        badge: null,
        color: 'purple',
      },
    ],
  },
  {
    label: 'Reference & Education',
    description: 'Glossary and learning resources',
    docs: [
      {
        slug: 'terms-definitions',
        title: 'Terms & Definitions',
        description: 'Complete glossary — 70+ terms across commodity trading, incoterms, trade finance, prop sharing, risk & compliance, treasury, settlement, and technology.',
        pages: '12–15 pages',
        audience: 'All Users — Reference Glossary',
        icon: GraduationCap,
        badge: 'Educational',
        color: 'blue',
      },
    ],
  },
]

/* ── Color Maps (Tailwind safe) ──────────────────── */

function getBgColor(color: string) {
  const map: Record<string, string> = {
    blue: 'bg-blue-50',
    emerald: 'bg-emerald-50',
    amber: 'bg-amber-50',
    purple: 'bg-purple-50',
    gray: 'bg-gray-50',
  }
  return map[color] || 'bg-gray-50'
}

function getIconColor(color: string) {
  const map: Record<string, string> = {
    blue: 'text-blue-700',
    emerald: 'text-emerald-700',
    amber: 'text-amber-700',
    purple: 'text-purple-700',
    gray: 'text-gray-600',
  }
  return map[color] || 'text-gray-600'
}

function getBadgeClasses(badge: string) {
  if (badge === 'Live Data') return 'text-emerald-700 bg-emerald-50 border-emerald-200'
  if (badge === 'Educational') return 'text-blue-700 bg-blue-50 border-blue-200'
  if (badge === 'Start Here') return 'text-amber-700 bg-amber-50 border-amber-200'
  return 'text-gray-600 bg-gray-50 border-gray-200'
}

/* ── Page Component ──────────────────────────────── */

export default function DownloadsPage() {
  const totalDocs = categories.reduce((sum, cat) => sum + cat.docs.length, 0)

  return (
    <div className="p-6 space-y-8 max-w-5xl">

      {/* ── Header ────────────────────────────────── */}
      <div>
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center">
            <Download size={18} className="text-amber-700" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Downloads & PDFs</h1>
            <p className="text-sm text-gray-500">
              {totalDocs} documents — everything the system does, broken down and downloadable
            </p>
          </div>
        </div>
      </div>

      {/* ── Quick Stats Bar ───────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {categories.map((cat) => (
          <div key={cat.label} className="bg-white rounded-lg border border-gray-100 px-4 py-3 text-center">
            <p className="text-lg font-bold text-gray-900">{cat.docs.length}</p>
            <p className="text-[11px] text-gray-500">{cat.label}</p>
          </div>
        ))}
      </div>

      {/* ── Document Categories ───────────────────── */}
      {categories.map((cat) => (
        <div key={cat.label}>
          {/* Section Header */}
          <div className="mb-3">
            <h2 className="text-lg font-semibold text-gray-900">{cat.label}</h2>
            <p className="text-xs text-gray-400">{cat.description}</p>
          </div>

          {/* Documents Grid */}
          <div className="grid gap-3">
            {cat.docs.map((doc) => {
              const Icon = doc.icon
              return (
                <div
                  key={doc.slug}
                  className="bg-white rounded-xl border border-gray-100 hover:border-amber-200 hover:shadow-sm transition-all"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center gap-4 p-5">
                    {/* Icon */}
                    <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${getBgColor(doc.color)}`}>
                      <Icon size={18} className={getIconColor(doc.color)} />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-sm font-semibold text-gray-900">{doc.title}</h3>
                        {doc.badge && (
                          <span className={`text-[10px] font-semibold uppercase tracking-wider border px-1.5 py-0.5 rounded-full ${getBadgeClasses(doc.badge)}`}>
                            {doc.badge}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 leading-relaxed line-clamp-2">{doc.description}</p>
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-[11px] text-gray-400">
                        <span><strong className="text-gray-500">Pages:</strong> {doc.pages}</span>
                        <span><strong className="text-gray-500">Audience:</strong> {doc.audience}</span>
                        <span><strong className="text-gray-500">Format:</strong> PDF</span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 shrink-0">
                      <a
                        href={`/api/docs/${doc.slug}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-xs font-medium text-gray-600 hover:text-gray-900 bg-gray-50 hover:bg-gray-100 px-3 py-2 rounded-lg transition-colors"
                      >
                        <ExternalLink size={12} /> View
                      </a>
                      <a
                        href={`/api/docs/${doc.slug}`}
                        download
                        className="inline-flex items-center gap-1.5 text-xs font-medium text-white bg-amber-700 hover:bg-amber-600 px-3.5 py-2 rounded-lg transition-colors"
                      >
                        <Download size={12} /> Download
                      </a>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      ))}

      {/* ── Info Panel ────────────────────────────── */}
      <div className="bg-amber-50 border border-amber-100 rounded-xl p-5">
        <h3 className="text-sm font-semibold text-amber-900 mb-2">How It Works</h3>
        <div className="grid sm:grid-cols-3 gap-4 text-xs text-amber-800 leading-relaxed">
          <div>
            <p className="font-semibold text-amber-900 mb-1">On-Demand Generation</p>
            <p>
              Every PDF is generated in real time when you click View or Download. No files stored — each document includes the current date, engine version, commit hash, and policy version.
            </p>
          </div>
          <div>
            <p className="font-semibold text-amber-900 mb-1">Live Data</p>
            <p>
              Documents marked "Live Data" pull from production databases. The Governance Report reflects the current treasury status, reserve health, and policy state.
            </p>
          </div>
          <div>
            <p className="font-semibold text-amber-900 mb-1">Educational Content</p>
            <p>
              Documents marked "Educational" are designed to teach — not just reference. They explain concepts, decode jargon, and walk through processes step by step.
            </p>
          </div>
        </div>
      </div>

      {/* ── Version Footer ────────────────────────── */}
      <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-[11px] text-gray-400 border-t border-gray-100 pt-4">
        <span><strong className="text-gray-500">Engine:</strong> v5.0</span>
        <span><strong className="text-gray-500">Policy:</strong> v2026.03</span>
        <span><strong className="text-gray-500">Sim Suite:</strong> v1.0</span>
        <span><strong className="text-gray-500">Format:</strong> PDF (A4)</span>
        <span><strong className="text-gray-500">Total:</strong> {totalDocs} documents</span>
      </div>
    </div>
  )
}
