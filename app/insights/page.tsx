import Link from 'next/link'
import { Globe, ArrowLeft, ArrowRight } from 'lucide-react'

const ALL_POSTS = [
  {
    slug: 'ucp-600-lc-structuring-guide',
    category: 'Trade Finance',
    title: 'UCP 600 & Letter of Credit Structuring: A Practical Guide for Commodity Buyers',
    excerpt: 'Understanding documentary credit mechanics, discrepancy management, and how to structure compliant LCs for agricultural and metal transactions.',
    date: 'February 2026',
    readTime: '8 min',
  },
  {
    slug: 'xrpl-commodity-escrow',
    category: 'RWA & Blockchain',
    title: 'How XRPL Escrow Is Changing Commodity Settlement',
    excerpt: 'Programmable escrow with milestone-based release conditions is eliminating counterparty risk in cross-border commodity deals.',
    date: 'January 2026',
    readTime: '6 min',
  },
  {
    slug: 'ofac-sanctions-commodity-trade',
    category: 'Compliance',
    title: 'OFAC Sanctions Screening in Commodity Trade: What Every Buyer Needs to Know',
    excerpt: 'A breakdown of SDN list obligations, secondary sanctions risk, and the compliance steps that protect your deal from enforcement action.',
    date: 'December 2025',
    readTime: '7 min',
  },
  {
    slug: 'incoterms-guide-fob-cif',
    category: 'Trade Finance',
    title: 'Incoterms 2020: FOB vs CIF vs DDP  -  Which Is Right for Your Commodity Deal?',
    excerpt: 'A deep dive into how Incoterms 2020 allocate risk, cost, and insurance obligations for physical commodity shipments.',
    date: 'November 2025',
    readTime: '9 min',
  },
  {
    slug: 'rwa-commodity-tokenization',
    category: 'RWA & Blockchain',
    title: 'Real World Asset Tokenization in Agriculture: Opportunities and Limitations',
    excerpt: 'Examining the technical and legal frameworks for tokenizing warehouse receipts, commodity inventories, and supply chain documents.',
    date: 'October 2025',
    readTime: '10 min',
  },
  {
    slug: 'sblc-bg-trade-finance',
    category: 'Trade Finance',
    title: 'SBLC vs Bank Guarantee: When to Use Each Instrument in Commodity Transactions',
    excerpt: 'Standby Letters of Credit and Bank Guarantees are often confused. This guide clarifies when each applies and how they differ under ISP98 and URDG758.',
    date: 'September 2025',
    readTime: '7 min',
  },
  {
    slug: 'kyc-kyb-commodity-buyers',
    category: 'Compliance',
    title: 'KYC & KYB in Commodity Trade: The Documentation Checklist Every Buyer Needs',
    excerpt: 'Entity verification, UBO identification, beneficial ownership, and what FTH requires before onboarding any institutional counterparty.',
    date: 'August 2025',
    readTime: '5 min',
  },
  {
    slug: 'stellar-anchor-settlement',
    category: 'RWA & Blockchain',
    title: 'Using Stellar Anchors for Cross-Border Commodity Payment Settlement',
    excerpt: "How Stellar's anchor network enables fast, low-cost fiat settlement across currencies, and how FTH integrates it into deal structures.",
    date: 'July 2025',
    readTime: '6 min',
  },
  {
    slug: 'fatf-grey-list-impact',
    category: 'Compliance',
    title: 'FATF Grey List & Its Impact on Commodity Trade Counterparties',
    excerpt: 'Which jurisdictions are currently on the FATF grey list, what enhanced due diligence it triggers, and how to manage this risk in structured commodity deals.',
    date: 'June 2025',
    readTime: '8 min',
  },
]

const CATEGORIES = ['All', 'Trade Finance', 'RWA & Blockchain', 'Compliance']

const CATEGORY_COLORS: Record<string, string> = {
  'Trade Finance': 'text-amber-500 border-amber-900/40 bg-amber-950/30',
  'RWA & Blockchain': 'text-blue-400 border-blue-900/40 bg-blue-950/30',
  'Compliance': 'text-red-400 border-red-900/40 bg-red-950/30',
}

export default function InsightsPage() {
  return (
    <main className="bg-[#0d0906] text-[#efebe9] min-h-screen">
      {/* Nav */}
      <header className="border-b border-white/5 bg-[#0d0906]/80 backdrop-blur-md px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-lg bg-amber-700 flex items-center justify-center">
              <Globe size={13} className="text-amber-100" />
            </div>
            <span className="font-bold text-[#efebe9] tracking-tight text-sm">FTH Trading</span>
          </Link>
          <Link href="/" className="flex items-center gap-1.5 text-xs text-[#6d4c41] hover:text-[#a1887f] transition-colors">
            <ArrowLeft size={13} /> Home
          </Link>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-6 py-16">
        {/* Header */}
        <div className="mb-12">
          <span className="inline-block text-xs font-semibold tracking-widest uppercase text-amber-600 border border-amber-900/40 bg-amber-950/30 px-3 py-1 rounded-full mb-5">
            Knowledge Base
          </span>
          <h1 className="text-4xl md:text-5xl font-bold text-[#efebe9] mb-4">
            Insights &amp; Market Intelligence
          </h1>
          <p className="text-[#6d4c41] max-w-xl">
            In-depth guides on commodity trade finance, compliance, blockchain settlement, and RWA
            tokenization  -  written for institutional buyers, brokers, and trade professionals.
          </p>
        </div>

        {/* Category filter (static display  -  functional filtering would require client component) */}
        <div className="flex flex-wrap gap-2 mb-10">
          {CATEGORIES.map((cat) => (
            <span
              key={cat}
              className={`text-xs px-3 py-1.5 rounded-full border cursor-default ${
                cat === 'All'
                  ? 'border-amber-700/60 bg-amber-950/40 text-amber-400'
                  : 'border-white/5 text-[#6d4c41]'
              }`}
            >
              {cat}
            </span>
          ))}
        </div>

        {/* Featured post */}
        <Link
          href={`/insights/${ALL_POSTS[0].slug}`}
          className="group block bg-white/[0.03] hover:bg-white/[0.05] border border-white/5 hover:border-amber-800/30 rounded-2xl p-8 mb-6 transition-all"
        >
          <div className="flex items-center gap-3 mb-4">
            <span className={`text-[10px] font-semibold tracking-widest uppercase px-2 py-0.5 rounded-full border ${CATEGORY_COLORS[ALL_POSTS[0].category]}`}>
              {ALL_POSTS[0].category}
            </span>
            <span className="text-xs text-[#3e2723]">{ALL_POSTS[0].readTime} read</span>
            <span className="text-xs text-[#3e2723]">{ALL_POSTS[0].date}</span>
          </div>
          <h2 className="text-xl md:text-2xl font-bold text-[#efebe9] mb-3 group-hover:text-amber-400 transition-colors leading-snug">
            {ALL_POSTS[0].title}
          </h2>
          <p className="text-sm text-[#6d4c41] leading-relaxed mb-4 max-w-2xl">{ALL_POSTS[0].excerpt}</p>
          <span className="inline-flex items-center gap-1.5 text-xs text-amber-600 group-hover:text-amber-500 transition-colors">
            Read Article <ArrowRight size={12} />
          </span>
        </Link>

        {/* Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {ALL_POSTS.slice(1).map(({ slug, category, title, excerpt, date, readTime }) => (
            <Link
              key={slug}
              href={`/insights/${slug}`}
              className="group bg-white/[0.03] hover:bg-white/[0.05] border border-white/5 hover:border-amber-800/30 rounded-2xl p-6 transition-all"
            >
              <div className="flex items-center gap-2 mb-3">
                <span className={`text-[10px] font-semibold tracking-widest uppercase px-2 py-0.5 rounded-full border ${CATEGORY_COLORS[category] ?? 'text-[#6d4c41] border-white/5'}`}>
                  {category}
                </span>
              </div>
              <h3 className="font-bold text-[#efebe9] text-sm mb-2 group-hover:text-amber-400 transition-colors leading-snug">
                {title}
              </h3>
              <p className="text-xs text-[#6d4c41] leading-relaxed mb-4">{excerpt}</p>
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-[#3e2723]">{date}</span>
                <span className="text-[10px] text-[#3e2723]">{readTime} read</span>
              </div>
            </Link>
          ))}
        </div>

        {/* CTA */}
        <div className="mt-16 border-t border-white/5 pt-12 text-center">
          <p className="text-[#6d4c41] text-sm mb-5">
            Want to contribute an industry insight or guest post?
          </p>
          <Link
            href="/request-terms"
            className="inline-flex items-center gap-2 border border-white/10 bg-white/5 hover:bg-white/10 text-[#efebe9] font-semibold px-6 py-3 rounded-xl transition-colors text-sm"
          >
            Get in Touch <ArrowRight size={14} />
          </Link>
        </div>
      </div>
    </main>
  )
}
