import Link from 'next/link'
import { TrendingUp, Shield, Globe, ChevronRight, ArrowRight, Check } from 'lucide-react'

export default function Home() {
  return (
    <main className="bg-[#0d0906] text-[#efebe9] min-h-screen">

      {/* â”€â”€ TOP NAV â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <header className="fixed top-0 left-0 right-0 z-50 border-b border-white/5 bg-[#0d0906]/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-amber-700 flex items-center justify-center">
              <Globe size={15} className="text-amber-100" />
            </div>
            <span className="font-bold text-[#efebe9] tracking-tight">FTH Trading</span>
          </div>
          <nav className="hidden md:flex items-center gap-8">
            {[
              ['Commodities', '/commodities'],
              ['Request Terms', '/request-terms'],
            ].map(([label, href]) => (
              <Link
                key={label}
                href={href}
                className="text-sm text-[#a1887f] hover:text-[#efebe9] transition-colors"
              >
                {label}
              </Link>
            ))}
          </nav>
          <div className="flex items-center gap-3">
            <Link
              href="/sign-in"
              className="text-sm text-[#a1887f] hover:text-[#efebe9] transition-colors hidden sm:block"
            >
              Sign In
            </Link>
            <Link
              href="/sign-up"
              className="text-sm font-medium bg-amber-700 hover:bg-amber-600 text-white px-4 py-2 rounded-lg transition-colors"
            >
              Team Portal
            </Link>
          </div>
        </div>
      </header>

      {/* â”€â”€ HERO â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <section className="relative min-h-screen flex flex-col justify-center px-6 pt-16 overflow-hidden">
        {/* Radial glow */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_-10%,rgba(120,53,15,0.25),transparent)]" />
        {/* Grid texture */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage:
              'linear-gradient(rgba(239,235,233,1) 1px, transparent 1px), linear-gradient(90deg, rgba(239,235,233,1) 1px, transparent 1px)',
            backgroundSize: '60px 60px',
          }}
        />

        <div className="relative max-w-5xl mx-auto w-full">
          {/* Eyebrow */}
          <div className="flex items-center gap-2 mb-8">
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold tracking-widest uppercase text-amber-500 border border-amber-800/50 bg-amber-950/40 px-3 py-1.5 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
              Est. 1976 â€” Institutional Commodity Platform
            </span>
          </div>

          {/* Headline */}
          <h1 className="text-5xl md:text-7xl font-bold leading-[1.05] tracking-tight mb-8 text-[#efebe9]">
            Global Commodity
            <br />
            <span className="text-amber-600">Sourcing &amp; Structuring</span>
          </h1>

          <p className="text-lg md:text-xl text-[#a1887f] max-w-2xl leading-relaxed mb-10">
            We source and structure supply for select commodities globally.
            AI-powered compliance screening. Instrument-backed settlements.
            50 years of relationship capital.
          </p>

          {/* CTAs */}
          <div className="flex flex-wrap gap-4 mb-16">
            <Link
              href="/commodities"
              className="inline-flex items-center gap-2 bg-amber-700 hover:bg-amber-600 text-white font-semibold px-7 py-3.5 rounded-xl transition-all hover:shadow-lg hover:shadow-amber-900/40"
            >
              View Commodities <ChevronRight size={16} />
            </Link>
            <Link
              href="/request-terms"
              className="inline-flex items-center gap-2 border border-[#3e2723]/60 bg-white/5 hover:bg-white/10 text-[#efebe9] font-semibold px-7 py-3.5 rounded-xl transition-colors"
            >
              Request Terms
            </Link>
          </div>

          {/* Trust strip */}
          <div className="flex flex-wrap gap-x-8 gap-y-2">
            {[
              'OFAC sanctions screening',
              'UCP 600 instrument structuring',
              'XRPL / Stellar proof anchoring',
              'Human-gated approvals',
            ].map((t) => (
              <span key={t} className="flex items-center gap-1.5 text-xs text-[#6d4c41]">
                <Check size={12} className="text-amber-600 shrink-0" /> {t}
              </span>
            ))}
          </div>
        </div>

        {/* Scroll hint */}
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 opacity-30">
          <div className="w-px h-8 bg-[#a1887f]" />
          <span className="text-[10px] tracking-widest uppercase text-[#a1887f]">Scroll</span>
        </div>
      </section>

      {/* â”€â”€ STATS â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <section className="border-y border-white/5 bg-white/[0.02]">
        <div className="max-w-5xl mx-auto px-6 py-12 grid grid-cols-2 md:grid-cols-4 gap-8">
          {[
            { value: '50+', label: 'Years in Trade' },
            { value: '4', label: 'Commodity Categories' },
            { value: '24/7', label: 'Compliance Screening' },
            { value: '6', label: 'Settlement Rails' },
          ].map(({ value, label }) => (
            <div key={label} className="text-center">
              <p className="text-3xl md:text-4xl font-bold text-[#efebe9] mb-1">{value}</p>
              <p className="text-xs text-[#6d4c41] uppercase tracking-wider">{label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* â”€â”€ COMMODITIES â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <section className="max-w-5xl mx-auto px-6 py-24">
        <div className="mb-12">
          <p className="text-xs font-semibold tracking-widest uppercase text-amber-600 mb-3">
            What We Trade
          </p>
          <h2 className="text-3xl md:text-4xl font-bold text-[#efebe9]">Commodity Categories</h2>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {commodities.map(({ slug, icon, title, description, tags }) => (
            <Link
              key={slug}
              href={`/commodities/${slug}`}
              className="group relative bg-white/[0.03] hover:bg-white/[0.06] border border-white/5 hover:border-amber-800/40 rounded-2xl p-6 transition-all duration-200"
            >
              <div className="text-3xl mb-4">{icon}</div>
              <h3 className="font-bold text-[#efebe9] mb-2 group-hover:text-amber-400 transition-colors">
                {title}
              </h3>
              <p className="text-sm text-[#6d4c41] leading-relaxed mb-4">{description}</p>
              <div className="flex flex-wrap gap-1">
                {tags.map((tag) => (
                  <span
                    key={tag}
                    className="text-[10px] px-2 py-0.5 rounded-full border border-white/5 text-[#6d4c41] bg-white/[0.03]"
                  >
                    {tag}
                  </span>
                ))}
              </div>
              <ArrowRight
                size={14}
                className="absolute top-5 right-5 text-amber-800 opacity-0 group-hover:opacity-100 transition-opacity"
              />
            </Link>
          ))}
        </div>
      </section>

      {/* â”€â”€ PLATFORM FEATURES â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <section className="border-t border-white/5 bg-white/[0.01]">
        <div className="max-w-5xl mx-auto px-6 py-24">
          <div className="mb-12">
            <p className="text-xs font-semibold tracking-widest uppercase text-amber-600 mb-3">
              The Platform
            </p>
            <h2 className="text-3xl md:text-4xl font-bold text-[#efebe9]">
              Compliance-First Structuring
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {features.map(({ icon: Icon, title, description, bullets }) => (
              <div
                key={title}
                className="bg-white/[0.03] border border-white/5 rounded-2xl p-7"
              >
                <div className="w-10 h-10 rounded-xl bg-amber-950/60 border border-amber-800/30 flex items-center justify-center mb-5">
                  <Icon size={18} className="text-amber-500" />
                </div>
                <h3 className="font-bold text-[#efebe9] mb-3">{title}</h3>
                <p className="text-sm text-[#6d4c41] leading-relaxed mb-4">{description}</p>
                <ul className="space-y-1.5">
                  {bullets.map((b) => (
                    <li key={b} className="flex items-start gap-2 text-xs text-[#6d4c41]">
                      <Check size={11} className="text-amber-700 mt-0.5 shrink-0" />
                      {b}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* â”€â”€ TEAM PORTAL BANNER â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <section className="max-w-5xl mx-auto px-6 py-16">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-amber-950 via-[#2a1a0f] to-[#0d0906] border border-amber-900/30 px-8 md:px-14 py-12">
          {/* Glow */}
          <div className="absolute right-0 top-0 w-96 h-96 bg-amber-700/10 rounded-full blur-3xl" />

          <div className="relative flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div>
              <p className="text-xs font-semibold tracking-widest uppercase text-amber-500 mb-3">
                Internal Platform
              </p>
              <h2 className="text-2xl md:text-3xl font-bold text-[#efebe9] mb-3">
                Team Portal
              </h2>
              <p className="text-[#a1887f] max-w-md">
                Deals pipeline, commission tracking, client management, compliance flags,
                contracts, and funding tools â€” all in one place.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 shrink-0">
              <Link
                href="/sign-in"
                className="inline-flex items-center justify-center gap-2 bg-amber-700 hover:bg-amber-600 text-white font-semibold px-6 py-3 rounded-xl transition-colors"
              >
                Sign In <ArrowRight size={15} />
              </Link>
              <Link
                href="/sign-up"
                className="inline-flex items-center justify-center gap-2 border border-amber-800/50 bg-white/5 hover:bg-white/10 text-[#efebe9] font-semibold px-6 py-3 rounded-xl transition-colors"
              >
                Register
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* â”€â”€ FINAL CTA â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <section className="border-t border-white/5 text-center py-24 px-6">
        <p className="text-xs font-semibold tracking-widest uppercase text-amber-600 mb-4">
          Institutional Inquiries
        </p>
        <h2 className="text-3xl md:text-4xl font-bold text-[#efebe9] mb-5">
          50 Years of Relationship Capital.
          <br />AI-Powered Intelligence.
        </h2>
        <p className="text-[#6d4c41] mb-10 max-w-lg mx-auto">
          Serving institutional buyers and counterparties globally. Regulated jurisdictions only.
          All transactions subject to compliance review.
        </p>
        <Link
          href="/request-terms"
          className="inline-flex items-center gap-2 bg-amber-700 hover:bg-amber-600 text-white font-semibold px-8 py-4 rounded-xl transition-all hover:shadow-lg hover:shadow-amber-900/40"
        >
          Request Terms <ArrowRight size={16} />
        </Link>
      </section>

      {/* â”€â”€ FOOTER â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <footer className="border-t border-white/5 px-6 py-10">
        <div className="max-w-5xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 mb-8">
            <div className="flex items-center gap-3">
              <div className="w-7 h-7 rounded-lg bg-amber-900 flex items-center justify-center">
                <Globe size={13} className="text-amber-300" />
              </div>
              <span className="font-bold text-[#efebe9] text-sm">FTH Trading</span>
            </div>
            <div className="flex flex-wrap gap-6">
              {[
                ['Commodities', '/commodities'],
                ['Request Terms', '/request-terms'],
                ['Team Sign In', '/sign-in'],
              ].map(([label, href]) => (
                <Link
                  key={label}
                  href={href}
                  className="text-xs text-[#6d4c41] hover:text-[#a1887f] transition-colors"
                >
                  {label}
                </Link>
              ))}
            </div>
          </div>
          <p className="text-[10px] text-[#3e2723] leading-relaxed max-w-3xl">
            <strong className="text-[#6d4c41]">Disclaimer:</strong> This platform flags potential compliance
            issues for human review. It does not constitute legal advice, regulatory certification, or a
            guarantee of compliance. All funding structures are non-binding drafts requiring human approval
            and review by qualified banking and legal professionals. FTH Trading does not issue financial
            instruments, act as a bank, broker-dealer, investment advisor, or money transmitter. All
            determinations subject to review by qualified professionals. Serving institutional buyers only.
            Non-US persons / entities only where applicable.
          </p>
          <p className="text-[10px] text-[#3e2723] mt-4">
            Â© {new Date().getFullYear()} FTH Trading. All rights reserved.
          </p>
        </div>
      </footer>

    </main>
  )
}

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// Data
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

const commodities = [
  {
    slug: 'coffee',
    icon: 'â˜•',
    title: 'Coffee',
    description: 'Arabica & Robusta. Brazil, Colombia, Ethiopia origins. Regenerative & certified.',
    tags: ['FOB Santos', 'Arabica', 'Robusta', 'ICO'],
  },
  {
    slug: 'cocoa',
    icon: 'ðŸ«',
    title: 'Cocoa',
    description: 'West African origins. ICCO standards. Fair trade and Rainforest Alliance certified.',
    tags: ['Ivory Coast', 'Ghana', 'Fair Trade', 'ICCO'],
  },
  {
    slug: 'precious-metals',
    icon: 'ðŸ¥‡',
    title: 'Precious Metals',
    description: 'Gold, Silver, Platinum. LBMA approved custody. Full chain-of-custody verification.',
    tags: ['LBMA', 'Assayed', 'Vaulted', 'OFAC screened'],
  },
  {
    slug: 'base-metals',
    icon: 'âš™ï¸',
    title: 'Base Metals',
    description: 'Copper, Aluminum, Nickel. Industrial grade. Global warehousing and LME delivery.',
    tags: ['LME', 'Industrial', 'Warehoused', 'ISO'],
  },
]

const features: Array<{
  icon: React.ElementType
  title: string
  description: string
  bullets: string[]
}> = [
  {
    icon: Shield,
    title: 'Compliance Intelligence',
    description:
      'Risk-based sanctions screening, export controls, and AML flagging. Every deal screened before instrument request.',
    bullets: [
      'OFAC SDN list screening',
      'FATF jurisdiction risk matrix',
      'AML threshold alerts (>$10K)',
      'Human approval gate â€” mandatory',
    ],
  },
  {
    icon: TrendingUp,
    title: 'Credit & Deal Structuring',
    description:
      '110-point credit scoring. Payment term recommendations. Instrument selection: LC, SBLC, BG, Factoring.',
    bullets: [
      'Readiness score (0â€“100)',
      'KYC / KYB documentation checklist',
      'UCP 600, ISP98, URDG758 frameworks',
      'Term sheet generation (advisory)',
    ],
  },
  {
    icon: Globe,
    title: 'Settlement & Proof',
    description:
      'SWIFT/FIAT wire instructions. XRPL and Stellar settlement rails for escrow and audit trail.',
    bullets: [
      'SWIFT MT103 / MT202 templates',
      'XRPL EscrowCreate support',
      'Stellar anchor integration',
      'SHA-256 tamper-proof anchoring',
    ],
  },
]

