import Link from 'next/link'
import {
  TrendingUp,
  Shield,
  Globe,
  ChevronRight,
  ArrowRight,
  Check,
  BookOpen,
  Coins,
  Users,
  FileText,
  Zap,
  Lock,
  BarChart3,
  Network,
  Landmark,
} from 'lucide-react'

export default function Home() {
  return (
    <main className="bg-[#0d0906] text-[#efebe9] min-h-screen">

      {/* ── TOP NAV ─────────────────────────────────────────── */}
      <header className="fixed top-0 left-0 right-0 z-50 border-b border-white/5 bg-[#0d0906]/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-amber-700 flex items-center justify-center">
              <Globe size={15} className="text-amber-100" />
            </div>
            <span className="font-bold text-[#efebe9] tracking-tight">FTH Trading</span>
          </div>
          <nav className="hidden lg:flex items-center gap-7">
            {[
              ['Commodities', '/commodities'],
              ['RWA', '/rwa'],
              ['Insights', '/insights'],
              ['Brokers', '/brokers'],
              ['Request Terms', '/request-terms'],
            ].map(([label, href]) => (
              <Link key={label} href={href} className="text-sm text-[#a1887f] hover:text-[#efebe9] transition-colors">
                {label}
              </Link>
            ))}
          </nav>
          <div className="flex items-center gap-3">
            <Link href="/sign-in" className="text-sm text-[#a1887f] hover:text-[#efebe9] transition-colors hidden sm:block">Sign In</Link>
            <Link href="/sign-up" className="text-sm font-medium bg-amber-700 hover:bg-amber-600 text-white px-4 py-2 rounded-lg transition-colors">Team Portal</Link>
          </div>
        </div>
      </header>

      {/* ── HERO ────────────────────────────────────────────── */}
      <section className="relative min-h-screen flex flex-col justify-center px-6 pt-16 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_-10%,rgba(120,53,15,0.28),transparent)]" />
        <div className="absolute inset-0 opacity-[0.025]" style={{ backgroundImage: 'linear-gradient(rgba(239,235,233,1) 1px,transparent 1px),linear-gradient(90deg,rgba(239,235,233,1) 1px,transparent 1px)', backgroundSize: '60px 60px' }} />
        <div className="relative max-w-5xl mx-auto w-full">
          <div className="flex items-center gap-2 mb-8">
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold tracking-widest uppercase text-amber-500 border border-amber-800/50 bg-amber-950/40 px-3 py-1.5 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
              Est. 1976 — Institutional Commodity Platform
            </span>
          </div>
          <h1 className="text-5xl md:text-7xl font-bold leading-[1.05] tracking-tight mb-8">
            Global Commodity<br /><span className="text-amber-600">Sourcing &amp; Structuring</span>
          </h1>
          <p className="text-lg md:text-xl text-[#a1887f] max-w-2xl leading-relaxed mb-10">
            We source and structure supply for select commodities globally. AI-powered compliance screening. Instrument-backed settlements. 50 years of relationship capital.
          </p>
          <div className="flex flex-wrap gap-4 mb-16">
            <Link href="/commodities" className="inline-flex items-center gap-2 bg-amber-700 hover:bg-amber-600 text-white font-semibold px-7 py-3.5 rounded-xl transition-all hover:shadow-amber-900/40 hover:shadow-lg">
              View Commodities <ChevronRight size={16} />
            </Link>
            <Link href="/request-terms" className="inline-flex items-center gap-2 border border-[#3e2723]/60 bg-white/5 hover:bg-white/10 text-[#efebe9] font-semibold px-7 py-3.5 rounded-xl transition-colors">Request Terms</Link>
            <Link href="/brokers" className="inline-flex items-center gap-2 border border-amber-800/30 bg-amber-950/30 hover:bg-amber-950/50 text-amber-400 font-semibold px-7 py-3.5 rounded-xl transition-colors">Broker Inquiry</Link>
          </div>
          <div className="flex flex-wrap gap-x-8 gap-y-2">
            {['OFAC sanctions screening','UCP 600 instrument structuring','XRPL / Stellar proof anchoring','Human-gated approvals','RWA tokenization','ISO / ICO certified origins'].map((t) => (
              <span key={t} className="flex items-center gap-1.5 text-xs text-[#6d4c41]">
                <Check size={12} className="text-amber-600 shrink-0" />{t}
              </span>
            ))}
          </div>
        </div>
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 opacity-30">
          <div className="w-px h-8 bg-[#a1887f]" />
          <span className="text-[10px] tracking-widest uppercase text-[#a1887f]">Scroll</span>
        </div>
      </section>

      {/* ── STATS ───────────────────────────────────────────── */}
      <section className="border-y border-white/5 bg-white/[0.02]">
        <div className="max-w-5xl mx-auto px-6 py-12 grid grid-cols-2 md:grid-cols-6 gap-6">
          {[
            { value: '50+', label: 'Years in Trade' },
            { value: '4', label: 'Commodity Categories' },
            { value: '40+', label: 'Countries Served' },
            { value: '24/7', label: 'Compliance Screening' },
            { value: '6', label: 'Settlement Rails' },
            { value: '$2B+', label: 'Trade Volume' },
          ].map(({ value, label }) => (
            <div key={label} className="text-center">
              <p className="text-2xl md:text-3xl font-bold text-[#efebe9] mb-1">{value}</p>
              <p className="text-[10px] text-[#6d4c41] uppercase tracking-wider leading-tight">{label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── INDUSTRY PILLARS ────────────────────────────────── */}
      <section className="max-w-5xl mx-auto px-6 py-24">
        <div className="mb-12">
          <p className="text-xs font-semibold tracking-widest uppercase text-amber-600 mb-3">How Global Commodity Trade Works</p>
          <h2 className="text-3xl md:text-4xl font-bold text-[#efebe9] mb-4">The Full Trade Stack</h2>
          <p className="text-[#6d4c41] max-w-2xl">From origin sourcing to final settlement — we operate across every layer of the institutional commodity trade lifecycle.</p>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {pillars.map(({ icon: Icon, title, body }) => (
            <div key={title} className="bg-white/[0.025] border border-white/5 rounded-2xl p-6 hover:bg-white/[0.04] transition-colors">
              <div className="w-9 h-9 rounded-xl bg-amber-950/60 border border-amber-800/20 flex items-center justify-center mb-4">
                <Icon size={16} className="text-amber-600" />
              </div>
              <h3 className="font-bold text-[#efebe9] mb-2 text-sm">{title}</h3>
              <p className="text-xs text-[#6d4c41] leading-relaxed">{body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── COMMODITIES ─────────────────────────────────────── */}
      <section className="border-t border-white/5 bg-white/[0.01]">
        <div className="max-w-5xl mx-auto px-6 py-24">
          <div className="mb-12">
            <p className="text-xs font-semibold tracking-widest uppercase text-amber-600 mb-3">What We Trade</p>
            <h2 className="text-3xl md:text-4xl font-bold text-[#efebe9]">Commodity Categories</h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {commodities.map(({ slug, icon, title, description, tags }) => (
              <Link key={slug} href={`/commodities/${slug}`} className="group relative bg-white/[0.03] hover:bg-white/[0.06] border border-white/5 hover:border-amber-800/40 rounded-2xl p-6 transition-all duration-200">
                <div className="text-3xl mb-4">{icon}</div>
                <h3 className="font-bold text-[#efebe9] mb-2 group-hover:text-amber-400 transition-colors">{title}</h3>
                <p className="text-sm text-[#6d4c41] leading-relaxed mb-4">{description}</p>
                <div className="flex flex-wrap gap-1">
                  {tags.map((tag) => (
                    <span key={tag} className="text-[10px] px-2 py-0.5 rounded-full border border-white/5 text-[#6d4c41] bg-white/[0.03]">{tag}</span>
                  ))}
                </div>
                <ArrowRight size={14} className="absolute top-5 right-5 text-amber-800 opacity-0 group-hover:opacity-100 transition-opacity" />
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── RWA ─────────────────────────────────────────────── */}
      <section className="max-w-5xl mx-auto px-6 py-24">
        <div className="relative overflow-hidden rounded-3xl border border-white/5 bg-white/[0.02] p-8 md:p-12">
          <div className="absolute right-0 top-0 w-[500px] h-[500px] bg-[radial-gradient(circle,rgba(120,53,15,0.15),transparent_70%)]" />
          <div className="relative">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-amber-950/80 border border-amber-800/30 flex items-center justify-center">
                <Coins size={18} className="text-amber-500" />
              </div>
              <div>
                <p className="text-xs font-semibold tracking-widest uppercase text-amber-600">Blockchain-Backed</p>
                <h2 className="text-2xl md:text-3xl font-bold text-[#efebe9]">Real World Assets (RWA)</h2>
              </div>
            </div>
            <p className="text-[#a1887f] max-w-2xl mb-10 leading-relaxed">
              We anchor physical commodity trades on-chain — creating immutable, tamper-proof proof-of-existence records for structured deals, escrow milestones, and settlement instructions using XRPL and Stellar networks.
            </p>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
              {rwaPoints.map(({ icon: Icon, title, body }) => (
                <div key={title} className="bg-white/[0.03] border border-white/5 rounded-xl p-5">
                  <Icon size={16} className="text-amber-600 mb-3" />
                  <p className="font-semibold text-sm text-[#efebe9] mb-1">{title}</p>
                  <p className="text-xs text-[#6d4c41] leading-relaxed">{body}</p>
                </div>
              ))}
            </div>
            <div className="flex flex-wrap gap-3">
              <Link href="/rwa" className="inline-flex items-center gap-2 bg-amber-700 hover:bg-amber-600 text-white font-semibold px-6 py-3 rounded-xl transition-colors text-sm">
                Explore RWA Framework <ArrowRight size={14} />
              </Link>
              <Link href="/request-terms" className="inline-flex items-center gap-2 border border-white/10 bg-white/5 hover:bg-white/10 text-[#efebe9] font-semibold px-6 py-3 rounded-xl transition-colors text-sm">
                Request Tokenized Terms
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── PLATFORM FEATURES ───────────────────────────────── */}
      <section className="border-t border-white/5 bg-white/[0.01]">
        <div className="max-w-5xl mx-auto px-6 py-24">
          <div className="mb-12">
            <p className="text-xs font-semibold tracking-widest uppercase text-amber-600 mb-3">The Platform</p>
            <h2 className="text-3xl md:text-4xl font-bold text-[#efebe9]">Compliance-First Structuring</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {features.map(({ icon: Icon, title, description, bullets }) => (
              <div key={title} className="bg-white/[0.03] border border-white/5 rounded-2xl p-7">
                <div className="w-10 h-10 rounded-xl bg-amber-950/60 border border-amber-800/30 flex items-center justify-center mb-5">
                  <Icon size={18} className="text-amber-500" />
                </div>
                <h3 className="font-bold text-[#efebe9] mb-3">{title}</h3>
                <p className="text-sm text-[#6d4c41] leading-relaxed mb-4">{description}</p>
                <ul className="space-y-1.5">
                  {bullets.map((b) => (
                    <li key={b} className="flex items-start gap-2 text-xs text-[#6d4c41]">
                      <Check size={11} className="text-amber-700 mt-0.5 shrink-0" />{b}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── BROKER ONBOARDING ───────────────────────────────── */}
      <section className="max-w-5xl mx-auto px-6 py-16">
        <div className="grid md:grid-cols-2 gap-6">
          <div className="relative overflow-hidden rounded-3xl border border-amber-900/20 bg-gradient-to-br from-[#1a0f08] to-[#0d0906] p-8">
            <div className="absolute right-0 bottom-0 w-48 h-48 bg-amber-700/5 rounded-full blur-2xl" />
            <div className="relative">
              <div className="w-10 h-10 rounded-xl bg-amber-950/80 border border-amber-800/30 flex items-center justify-center mb-5">
                <Users size={18} className="text-amber-500" />
              </div>
              <p className="text-xs font-semibold tracking-widest uppercase text-amber-600 mb-2">Broker Network</p>
              <h2 className="text-2xl font-bold text-[#efebe9] mb-3">Are You a Commodity Broker?</h2>
              <p className="text-[#6d4c41] text-sm leading-relaxed mb-6">
                Register your firm with FTH Trading. Join our global network of independent brokers and agents. Competitive commission structures. Full compliance support. Platform access from day one.
              </p>
              <ul className="space-y-2 mb-8">
                {['Tiered commission structure (1–3%)','Deal pipeline management tools','Compliance pre-screening for your clients','Access to FTH funding & instrument layer','Dedicated relationship manager'].map((b) => (
                  <li key={b} className="flex items-start gap-2 text-xs text-[#6d4c41]">
                    <Check size={11} className="text-amber-700 mt-0.5 shrink-0" />{b}
                  </li>
                ))}
              </ul>
              <Link href="/brokers" className="inline-flex items-center gap-2 bg-amber-700 hover:bg-amber-600 text-white font-semibold px-6 py-3 rounded-xl transition-colors text-sm">
                Submit Broker Inquiry <ArrowRight size={14} />
              </Link>
            </div>
          </div>
          <div className="relative overflow-hidden rounded-3xl border border-white/5 bg-white/[0.025] p-8">
            <div className="relative">
              <div className="w-10 h-10 rounded-xl bg-amber-950/60 border border-amber-800/20 flex items-center justify-center mb-5">
                <FileText size={18} className="text-amber-500" />
              </div>
              <p className="text-xs font-semibold tracking-widest uppercase text-amber-600 mb-2">Fast Track</p>
              <h2 className="text-2xl font-bold text-[#efebe9] mb-3">Institutional Buyer?</h2>
              <p className="text-[#6d4c41] text-sm leading-relaxed mb-6">
                Submit a term request directly to our structuring desk. We review all requests within 2-3 business days. All inquiries subject to compliance screening.
              </p>
              <div className="space-y-3 mb-6">
                {[
                  { t: 'LC / SBLC / BG', b: 'Documentary credit instrument structuring under UCP 600 / ISP98 / URDG758' },
                  { t: 'Direct FOB / CIF Supply', b: 'Pre-verified origin purchase with full chain-of-custody documentation' },
                  { t: 'Escrow-Backed Transactions', b: 'Milestone-based XRPL escrow with on-chain proof anchoring' },
                ].map(({ t, b }) => (
                  <div key={t} className="bg-white/[0.03] border border-white/5 rounded-xl p-4">
                    <p className="text-xs font-semibold text-[#efebe9] mb-1">{t}</p>
                    <p className="text-xs text-[#6d4c41]">{b}</p>
                  </div>
                ))}
              </div>
              <Link href="/request-terms" className="inline-flex items-center gap-2 border border-white/10 bg-white/5 hover:bg-white/10 text-[#efebe9] font-semibold px-6 py-3 rounded-xl transition-colors text-sm">
                Request Terms <ChevronRight size={14} />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── INSIGHTS ────────────────────────────────────────── */}
      <section className="border-t border-white/5 bg-white/[0.01]">
        <div className="max-w-5xl mx-auto px-6 py-24">
          <div className="flex items-end justify-between mb-12">
            <div>
              <p className="text-xs font-semibold tracking-widest uppercase text-amber-600 mb-3">Knowledge Base</p>
              <h2 className="text-3xl md:text-4xl font-bold text-[#efebe9]">Insights &amp; Market Intelligence</h2>
            </div>
            <Link href="/insights" className="hidden md:inline-flex items-center gap-2 text-sm text-[#a1887f] hover:text-[#efebe9] transition-colors">
              All Posts <ArrowRight size={14} />
            </Link>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {insights.map(({ slug, category, title, excerpt, date }) => (
              <Link key={slug} href={`/insights/${slug}`} className="group bg-white/[0.03] hover:bg-white/[0.05] border border-white/5 hover:border-amber-800/30 rounded-2xl p-6 transition-all duration-200">
                <span className="inline-block text-[10px] font-semibold tracking-widest uppercase text-amber-600 border border-amber-900/40 bg-amber-950/30 px-2 py-0.5 rounded-full mb-4">{category}</span>
                <h3 className="font-bold text-[#efebe9] mb-2 text-sm group-hover:text-amber-400 transition-colors leading-snug">{title}</h3>
                <p className="text-xs text-[#6d4c41] leading-relaxed mb-4">{excerpt}</p>
                <p className="text-[10px] text-[#3e2723]">{date}</p>
              </Link>
            ))}
          </div>
          <div className="mt-8 md:hidden">
            <Link href="/insights" className="inline-flex items-center gap-2 text-sm text-[#a1887f] hover:text-[#efebe9] transition-colors">
              View All Insights <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </section>

      {/* ── TEAM PORTAL BANNER ──────────────────────────────── */}
      <section className="max-w-5xl mx-auto px-6 pb-16">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-amber-950 via-[#2a1a0f] to-[#0d0906] border border-amber-900/30 px-8 md:px-14 py-12">
          <div className="absolute right-0 top-0 w-96 h-96 bg-amber-700/10 rounded-full blur-3xl" />
          <div className="relative flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div>
              <p className="text-xs font-semibold tracking-widest uppercase text-amber-500 mb-3">Internal Platform</p>
              <h2 className="text-2xl md:text-3xl font-bold text-[#efebe9] mb-3">Team Portal</h2>
              <p className="text-[#a1887f] max-w-md text-sm">Deals pipeline, commission tracking, client management, compliance flags, contracts, and funding tools — all in one place.</p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 shrink-0">
              <Link href="/sign-in" className="inline-flex items-center justify-center gap-2 bg-amber-700 hover:bg-amber-600 text-white font-semibold px-6 py-3 rounded-xl transition-colors text-sm">
                Sign In <ArrowRight size={15} />
              </Link>
              <Link href="/sign-up" className="inline-flex items-center justify-center gap-2 border border-amber-800/50 bg-white/5 hover:bg-white/10 text-[#efebe9] font-semibold px-6 py-3 rounded-xl transition-colors text-sm">Register</Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── FINAL CTA ───────────────────────────────────────── */}
      <section className="border-t border-white/5 text-center py-24 px-6">
        <p className="text-xs font-semibold tracking-widest uppercase text-amber-600 mb-4">Institutional Inquiries</p>
        <h2 className="text-3xl md:text-4xl font-bold text-[#efebe9] mb-5">
          50 Years of Relationship Capital.<br />AI-Powered Intelligence.
        </h2>
        <p className="text-[#6d4c41] mb-10 max-w-lg mx-auto">Serving institutional buyers and counterparties globally. Regulated jurisdictions only. All transactions subject to compliance review.</p>
        <Link href="/request-terms" className="inline-flex items-center gap-2 bg-amber-700 hover:bg-amber-600 text-white font-semibold px-8 py-4 rounded-xl transition-all hover:shadow-amber-900/40 hover:shadow-lg">
          Request Terms <ArrowRight size={16} />
        </Link>
      </section>

      {/* ── FOOTER ──────────────────────────────────────────── */}
      <footer className="border-t border-white/5 px-6 py-10">
        <div className="max-w-5xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-8 mb-10">
            <div>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-7 h-7 rounded-lg bg-amber-900 flex items-center justify-center">
                  <Globe size={13} className="text-amber-300" />
                </div>
                <span className="font-bold text-[#efebe9] text-sm">FTH Trading</span>
              </div>
              <p className="text-xs text-[#3e2723] max-w-xs leading-relaxed">Global commodity sourcing &amp; structuring. Est. 1976.</p>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-8">
              {footerLinks.map(({ section, links }) => (
                <div key={section}>
                  <p className="text-[10px] font-semibold tracking-widest uppercase text-[#6d4c41] mb-3">{section}</p>
                  <ul className="space-y-2">
                    {links.map(([label, href]) => (
                      <li key={label}>
                        <Link href={href} className="text-xs text-[#3e2723] hover:text-[#a1887f] transition-colors">{label}</Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
          <div className="border-t border-white/5 pt-8">
            <p className="text-[10px] text-[#3e2723] leading-relaxed max-w-3xl mb-4">
              <strong className="text-[#6d4c41]">Disclaimer:</strong> This platform flags potential compliance issues for human review. It does not constitute legal advice, regulatory certification, or a guarantee of compliance. All funding structures are non-binding drafts requiring human approval and review by qualified banking and legal professionals. FTH Trading does not issue financial instruments, act as a bank, broker-dealer, investment advisor, or money transmitter. All determinations subject to review by qualified professionals. Serving institutional buyers only. Non-US persons / entities only where applicable.
            </p>
            <p className="text-[10px] text-[#3e2723]">© {new Date().getFullYear()} FTH Trading. All rights reserved.</p>
          </div>
        </div>
      </footer>

    </main>
  )
}

// ─────────────────────────────────────────────────────────────────
// Data
// ─────────────────────────────────────────────────────────────────

const commodities = [
  { slug: 'coffee', icon: '☕', title: 'Coffee', description: 'Arabica & Robusta. Brazil, Colombia, Ethiopia origins. Regenerative & certified.', tags: ['FOB Santos', 'Arabica', 'Robusta', 'ICO'] },
  { slug: 'cocoa', icon: '🍫', title: 'Cocoa', description: 'West African origins. ICCO standards. Fair trade and Rainforest Alliance certified.', tags: ['Ivory Coast', 'Ghana', 'Fair Trade', 'ICCO'] },
  { slug: 'precious-metals', icon: '🥇', title: 'Precious Metals', description: 'Gold, Silver, Platinum. LBMA approved custody. Full chain-of-custody verification.', tags: ['LBMA', 'Assayed', 'Vaulted', 'OFAC screened'] },
  { slug: 'base-metals', icon: '⚙️', title: 'Base Metals', description: 'Copper, Aluminum, Nickel. Industrial grade. Global warehousing and LME delivery.', tags: ['LME', 'Industrial', 'Warehoused', 'ISO'] },
]

const features: Array<{ icon: React.ElementType; title: string; description: string; bullets: string[] }> = [
  {
    icon: Shield,
    title: 'Compliance Intelligence',
    description: 'Risk-based sanctions screening, export controls, and AML flagging. Every deal screened before instrument request.',
    bullets: ['OFAC SDN list screening', 'FATF jurisdiction risk matrix', 'AML threshold alerts (>$10K)', 'Human approval gate — mandatory'],
  },
  {
    icon: TrendingUp,
    title: 'Credit & Deal Structuring',
    description: '110-point credit scoring. Payment term recommendations. Instrument selection: LC, SBLC, BG, Factoring.',
    bullets: ['Readiness score (0–100)', 'KYC / KYB documentation checklist', 'UCP 600, ISP98, URDG758 frameworks', 'Term sheet generation (advisory)'],
  },
  {
    icon: Globe,
    title: 'Settlement & Proof',
    description: 'SWIFT/FIAT wire instructions. XRPL and Stellar settlement rails for escrow and audit trail.',
    bullets: ['SWIFT MT103 / MT202 templates', 'XRPL EscrowCreate support', 'Stellar anchor integration', 'SHA-256 tamper-proof anchoring'],
  },
]

const pillars: Array<{ icon: React.ElementType; title: string; body: string }> = [
  { icon: Landmark, title: 'Documentary Trade Finance', body: 'Letters of Credit (LC), Standby LCs (SBLC), and Bank Guarantees (BG) structured under UCP 600, ISP98, and URDG 758 international rules.' },
  { icon: Globe, title: 'Origin Sourcing & Logistics', body: 'FOB, CIF, CFR, DDP Incoterms. Pre-export financing. Warehouse receipts. FCL/LCL sea freight coordination with certified forwarders.' },
  { icon: Shield, title: 'Sanctions & Export Controls', body: 'OFAC SDN screening, EU & UN sanctions lists, BIS EAR export controls, FATF jurisdiction risk — verified before any instrument is raised.' },
  { icon: BarChart3, title: 'Price Risk & Hedging', body: 'ICE, LME, COMEX reference pricing. Basis risk analysis. Forward pricing for fixed-quantity contracts. Pricing clauses and escalation.' },
  { icon: Network, title: 'Correspondent Banking', body: 'SWIFT MT199/799 pre-advice, MT700 issuance, MT103/202 settlement. Bank-to-bank instrument negotiation with confirming bank selection.' },
  { icon: Zap, title: 'Digital Settlement Rails', body: 'XRPL EscrowCreate for milestone-based release. Stellar anchor payments. SHA-256 proof anchoring for tamper-evident audit trails.' },
  { icon: Lock, title: 'Escrow & Milestone Control', body: 'Structured escrow with defined release triggers: SGS/Bureau Veritas inspection, BL issuance, port discharge confirmation.' },
  { icon: FileText, title: 'Contract & eSign Layer', body: 'Offtake agreements, SPA, MOU, NDAs — generated, signed, and stored on-platform with cryptographic timestamp signatures.' },
  { icon: BookOpen, title: 'KYC / KYB Due Diligence', body: 'Entity verification, UBO identification, beneficial ownership registers, director profiles, certificate of incorporation.' },
]

const rwaPoints: Array<{ icon: React.ElementType; title: string; body: string }> = [
  { icon: Lock, title: 'On-Chain Proof', body: 'SHA-256 hash of every deal document anchored to XRPL or Stellar — immutable and time-stamped.' },
  { icon: Coins, title: 'Tokenised Inventory', body: 'Physical warehouse stock represented as on-chain tokens for fractional financing and transfer of title.' },
  { icon: Zap, title: 'Programmable Escrow', body: 'Smart escrow with automatic milestone release — inspection passed, BL issued, discharge confirmed.' },
  { icon: Network, title: 'Settlement Finality', body: 'XRPL 3-5 second finality and Stellar 5-second settlement vs. 2-5 day SWIFT average.' },
]

const insights = [
  {
    slug: 'ucp-600-lc-structuring-guide',
    category: 'Trade Finance',
    title: 'UCP 600 & Letter of Credit Structuring: A Practical Guide for Commodity Buyers',
    excerpt: 'Understanding documentary credit mechanics, discrepancy management, and how to structure compliant LCs for agricultural and metal transactions.',
    date: 'February 2026',
  },
  {
    slug: 'xrpl-commodity-escrow',
    category: 'RWA & Blockchain',
    title: 'How XRPL Escrow Is Changing Commodity Settlement',
    excerpt: 'Programmable escrow with milestone-based release conditions is eliminating counterparty risk in cross-border commodity deals.',
    date: 'January 2026',
  },
  {
    slug: 'ofac-sanctions-commodity-trade',
    category: 'Compliance',
    title: 'OFAC Sanctions Screening in Commodity Trade: What Every Buyer Needs to Know',
    excerpt: 'A breakdown of SDN list obligations, secondary sanctions risk, and the compliance steps that protect your deal from enforcement action.',
    date: 'December 2025',
  },
]

const footerLinks: Array<{ section: string; links: [string, string][] }> = [
  {
    section: 'Platform',
    links: [['Commodities', '/commodities'], ['RWA', '/rwa'], ['Request Terms', '/request-terms'], ['Broker Inquiry', '/brokers']],
  },
  {
    section: 'Insights',
    links: [['All Insights', '/insights'], ['Trade Finance', '/insights?cat=trade-finance'], ['RWA & Blockchain', '/insights?cat=rwa'], ['Compliance', '/insights?cat=compliance']],
  },
  {
    section: 'Team',
    links: [['Sign In', '/sign-in'], ['Register', '/sign-up'], ['Dashboard', '/dashboard'], ['Commissions', '/dashboard/commissions']],
  },
  {
    section: 'Legal',
    links: [['Terms of Service', '/legal/terms'], ['Privacy Policy', '/legal/privacy'], ['AML Policy', '/legal/aml'], ['Risk Disclosure', '/legal/risk']],
  },
]
