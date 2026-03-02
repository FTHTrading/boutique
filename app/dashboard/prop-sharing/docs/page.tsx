'use client'

import { Download, FileText, BookOpen, Shield, BarChart3, Briefcase, ExternalLink } from 'lucide-react'

const documents = [
  {
    slug: 'architecture',
    title: 'Architecture Overview',
    description: '10-page executive brochure — Model A structure, multi-layer risk defence, execution simulation, treasury guard, behavioural scoring, capital compounding engine, and governance controls.',
    pages: '10–12 pages',
    audience: 'Executives, Partners, Allocators',
    icon: Briefcase,
    badge: null,
    color: 'blue',
  },
  {
    slug: 'governance',
    title: 'Retained Earnings & Capital Governance Report',
    description: 'Live governance snapshot from production data — current treasury status, reserve buffer health, compounding policy state, enforcement gate results, and Compounding Readiness Score.',
    pages: '6–8 pages',
    audience: 'Risk Committee, Compliance, Auditors',
    icon: BarChart3,
    badge: 'Live Data',
    color: 'emerald',
  },
  {
    slug: 'whitepaper',
    title: 'Risk & Controls Whitepaper',
    description: 'Technical deep-dive — execution modelling, slippage simulation, spread widening, kill switches, behavioural detection, treasury stress scenarios, enforcement verification, and compounding controls.',
    pages: '15–20 pages',
    audience: 'Risk Officers, Engineers, Due Diligence',
    icon: Shield,
    badge: null,
    color: 'amber',
  },
  {
    slug: 'rulebook',
    title: 'Prop Challenge Rulebook',
    description: 'Complete programme rules — evaluation targets, verification standards, funded account parameters, pass/fail scenarios, payout structure, freeze & termination triggers.',
    pages: '8–10 pages',
    audience: 'Traders, Legal, Compliance',
    icon: BookOpen,
    badge: null,
    color: 'purple',
  },
  {
    slug: 'one-pager',
    title: 'One-Page Brochure',
    description: 'Dark-themed single-page overview — what we do, how it works, risk controls, scaling ladder, and contact info. Designed for email and conference distribution.',
    pages: '1 page',
    audience: 'General — Forward to Anyone',
    icon: FileText,
    badge: null,
    color: 'gray',
  },
]

export default function PropSharingDocsPage() {
  return (
    <div className="p-6 space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Documents & PDFs</h1>
          <p className="text-sm text-gray-500 mt-1">
            Institutional documentation pack. Download any document instantly — the Governance Report is generated live from production data.
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <a
            href="/dashboard/downloads"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-amber-700 hover:text-amber-600 bg-amber-50 hover:bg-amber-100 px-3 py-1.5 rounded-lg transition-colors"
          >
            <ExternalLink size={12} /> All Downloads
          </a>
          <a
            href="/prop-sharing/docs"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-gray-500 hover:text-gray-700 bg-gray-50 hover:bg-gray-100 px-3 py-1.5 rounded-lg transition-colors"
          >
            <ExternalLink size={12} /> Public Page
          </a>
        </div>
      </div>

      {/* Documents Grid */}
      <div className="grid gap-4">
        {documents.map((doc) => {
          const Icon = doc.icon
          return (
            <div
              key={doc.slug}
              className="bg-white rounded-xl border border-gray-100 hover:border-amber-200 hover:shadow-sm transition-all"
            >
              <div className="flex flex-col sm:flex-row sm:items-center gap-4 p-5">
                {/* Icon */}
                <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 bg-${doc.color === 'emerald' ? 'emerald' : doc.color === 'purple' ? 'purple' : doc.color === 'blue' ? 'blue' : doc.color === 'gray' ? 'gray' : 'amber'}-50`}>
                  <Icon size={18} className={`text-${doc.color === 'emerald' ? 'emerald' : doc.color === 'purple' ? 'purple' : doc.color === 'blue' ? 'blue' : doc.color === 'gray' ? 'gray' : 'amber'}-700`} />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-sm font-semibold text-gray-900">{doc.title}</h3>
                    {doc.badge && (
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded-full">
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
                  {/* View in browser */}
                  <a
                    href={`/api/docs/${doc.slug}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs font-medium text-gray-600 hover:text-gray-900 bg-gray-50 hover:bg-gray-100 px-3 py-2 rounded-lg transition-colors"
                  >
                    <ExternalLink size={12} /> View
                  </a>
                  {/* Download */}
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

      {/* Info Panel */}
      <div className="bg-amber-50 border border-amber-100 rounded-xl p-5">
        <h3 className="text-sm font-semibold text-amber-900 mb-2">How Document Generation Works</h3>
        <div className="grid sm:grid-cols-2 gap-4 text-xs text-amber-800 leading-relaxed">
          <div>
            <p className="font-semibold text-amber-900 mb-1">On-Demand (API)</p>
            <p>
              Every download link generates the PDF in real time via <code className="text-[11px] bg-amber-100 px-1 py-0.5 rounded">/api/docs/&#123;slug&#125;</code>.
              No files are stored — each PDF is built fresh with the current date, engine version, commit hash, and policy version stamped in the footer.
            </p>
          </div>
          <div>
            <p className="font-semibold text-amber-900 mb-1">Governance Report</p>
            <p>
              The Governance Report is generated from <strong>live production data</strong> — treasury
              status, reserve health, compounding policies, simulation scores, and gate results. Every
              download reflects the current system state.
            </p>
          </div>
        </div>
      </div>

      {/* Version Info */}
      <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-[11px] text-gray-400 border-t border-gray-100 pt-4">
        <span><strong className="text-gray-500">Engine:</strong> v5.0</span>
        <span><strong className="text-gray-500">Policy:</strong> v2026.03</span>
        <span><strong className="text-gray-500">Sim Suite:</strong> v1.0</span>
        <span><strong className="text-gray-500">Format:</strong> PDF (A4)</span>
        <span className="text-gray-300">Every PDF includes version footer + commit hash</span>
      </div>
    </div>
  )
}
