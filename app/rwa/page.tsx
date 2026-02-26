import Link from 'next/link'
import { Globe, ArrowLeft, ArrowRight, Check, Lock, Coins, Zap, Network, Shield, FileText, BarChart3 } from 'lucide-react'

export default function RWAPage() {
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

      {/* Hero */}
      <section className="relative overflow-hidden px-6 py-24">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_70%_50%_at_50%_0%,rgba(120,53,15,0.2),transparent)]" />
        <div className="relative max-w-4xl mx-auto text-center">
          <div className="flex items-center justify-center gap-2 mb-6">
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold tracking-widest uppercase text-amber-500 border border-amber-800/50 bg-amber-950/40 px-3 py-1.5 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
              Blockchain-Backed Commodity Trade
            </span>
          </div>
          <h1 className="text-4xl md:text-6xl font-bold leading-[1.05] tracking-tight mb-6">
            Real World Assets
            <br />
            <span className="text-amber-600">On-Chain Infrastructure</span>
          </h1>
          <p className="text-lg text-[#a1887f] max-w-2xl mx-auto leading-relaxed mb-10">
            FTH Trading anchors physical commodity transactions to the blockchain — creating immutable,
            tamper-proof records that bring institutional-grade trust to global commodity trade without
            sacrificing compliance.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link href="/request-terms" className="inline-flex items-center gap-2 bg-amber-700 hover:bg-amber-600 text-white font-semibold px-7 py-3.5 rounded-xl transition-all hover:shadow-amber-900/40 hover:shadow-lg">
              Request Terms <ArrowRight size={16} />
            </Link>
            <Link href="/insights/xrpl-commodity-escrow" className="inline-flex items-center gap-2 border border-white/10 bg-white/5 hover:bg-white/10 text-[#efebe9] font-semibold px-7 py-3.5 rounded-xl transition-colors">
              Read the Escrow Guide
            </Link>
          </div>
        </div>
      </section>

      {/* What is RWA */}
      <section className="border-t border-white/5 bg-white/[0.01]">
        <div className="max-w-5xl mx-auto px-6 py-20">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <p className="text-xs font-semibold tracking-widest uppercase text-amber-600 mb-3">What is RWA?</p>
              <h2 className="text-3xl font-bold text-[#efebe9] mb-5">Tokenizing Physical Commodity Assets</h2>
              <p className="text-[#6d4c41] leading-relaxed mb-6">
                Real World Assets (RWA) refers to physical, tangible assets — commodity inventories,
                warehouse receipts, trade documents, and settlement instructions — that are represented
                or anchored on a blockchain ledger.
              </p>
              <p className="text-[#6d4c41] leading-relaxed mb-6">
                At FTH Trading, we do not speculate on token prices. We use blockchain infrastructure
                as an audit and settlement layer — creating cryptographically verified records of trade
                documentation and using programmable escrow to reduce counterparty risk.
              </p>
              <ul className="space-y-3">
                {[
                  'Not financial instruments — operational infrastructure',
                  'Proof-of-existence for physical trade documents',
                  'Milestone-based escrow release, not speculative tokens',
                  'Fully compliant with OFAC/AML screening requirements',
                  'Works alongside traditional LC/SBLC structures',
                ].map((t) => (
                  <li key={t} className="flex items-start gap-2 text-sm text-[#6d4c41]">
                    <Check size={13} className="text-amber-700 mt-0.5 shrink-0" />{t}
                  </li>
                ))}
              </ul>
            </div>
            <div className="space-y-4">
              {rwaFeatures.map(({ icon: Icon, title, body }) => (
                <div key={title} className="bg-white/[0.03] border border-white/5 rounded-2xl p-5 flex gap-4">
                  <div className="w-9 h-9 rounded-xl bg-amber-950/60 border border-amber-800/20 flex items-center justify-center shrink-0">
                    <Icon size={15} className="text-amber-500" />
                  </div>
                  <div>
                    <p className="font-semibold text-sm text-[#efebe9] mb-1">{title}</p>
                    <p className="text-xs text-[#6d4c41] leading-relaxed">{body}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Networks */}
      <section className="max-w-5xl mx-auto px-6 py-20">
        <div className="mb-12">
          <p className="text-xs font-semibold tracking-widest uppercase text-amber-600 mb-3">Blockchain Networks</p>
          <h2 className="text-3xl font-bold text-[#efebe9] mb-4">XRPL & Stellar Integration</h2>
          <p className="text-[#6d4c41] max-w-xl">Two proven public blockchains purpose-built for financial settlement — both integrated into the FTH deal structuring platform.</p>
        </div>
        <div className="grid md:grid-cols-2 gap-6">
          {/* XRPL */}
          <div className="bg-white/[0.025] border border-white/5 rounded-2xl p-8">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-xl bg-blue-950/50 border border-blue-800/20 flex items-center justify-center">
                <Network size={18} className="text-blue-400" />
              </div>
              <div>
                <p className="text-xs text-[#6d4c41] uppercase tracking-widest">XRP Ledger</p>
                <p className="font-bold text-[#efebe9]">XRPL</p>
              </div>
            </div>
            <ul className="space-y-2.5 mb-6">
              {[
                'Native EscrowCreate / EscrowFinish transactions',
                '3–5 second settlement finality',
                'Crypto-condition (SHA-256) hash-locks',
                'Time-based or condition-based escrow release',
                'Document hash anchoring via transaction memos',
                'Near-zero transaction costs (~$0.0002/tx)',
              ].map((t) => (
                <li key={t} className="flex items-start gap-2 text-xs text-[#6d4c41]">
                  <Check size={10} className="text-blue-600 mt-0.5 shrink-0" />{t}
                </li>
              ))}
            </ul>
            <Link href="/insights/xrpl-commodity-escrow" className="inline-flex items-center gap-1.5 text-xs text-blue-400 hover:text-blue-300 transition-colors">
              XRPL Escrow Guide <ArrowRight size={12} />
            </Link>
          </div>
          {/* Stellar */}
          <div className="bg-white/[0.025] border border-white/5 rounded-2xl p-8">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-xl bg-purple-950/50 border border-purple-800/20 flex items-center justify-center">
                <Zap size={18} className="text-purple-400" />
              </div>
              <div>
                <p className="text-xs text-[#6d4c41] uppercase tracking-widest">Stellar Network</p>
                <p className="font-bold text-[#efebe9]">Stellar</p>
              </div>
            </div>
            <ul className="space-y-2.5 mb-6">
              {[
                'Anchor network for fiat currency settlement',
                '5-second finality with PBFT consensus',
                'Multi-currency: USD, EUR, AED, SGD via anchors',
                'Path payment for cross-currency FX settlement',
                'Claimable balances for conditional payment',
                'ISO 20022-compatible payment metadata',
              ].map((t) => (
                <li key={t} className="flex items-start gap-2 text-xs text-[#6d4c41]">
                  <Check size={10} className="text-purple-500 mt-0.5 shrink-0" />{t}
                </li>
              ))}
            </ul>
            <Link href="/insights/stellar-anchor-settlement" className="inline-flex items-center gap-1.5 text-xs text-purple-400 hover:text-purple-300 transition-colors">
              Stellar Anchor Guide <ArrowRight size={12} />
            </Link>
          </div>
        </div>
      </section>

      {/* Deal flow */}
      <section className="border-t border-white/5 bg-white/[0.01]">
        <div className="max-w-5xl mx-auto px-6 py-20">
          <div className="mb-12">
            <p className="text-xs font-semibold tracking-widest uppercase text-amber-600 mb-3">How It Works</p>
            <h2 className="text-3xl font-bold text-[#efebe9]">RWA Deal Flow</h2>
          </div>
          <div className="relative">
            {/* Vertical line */}
            <div className="absolute left-5 top-0 bottom-0 w-px bg-white/5 hidden md:block" />
            <div className="space-y-6">
              {steps.map(({ step, title, body }, i) => (
                <div key={step} className="flex gap-6">
                  <div className="relative flex-shrink-0">
                    <div className="w-10 h-10 rounded-full bg-amber-950/80 border border-amber-800/30 flex items-center justify-center z-10 relative">
                      <span className="text-xs font-bold text-amber-500">{i + 1}</span>
                    </div>
                  </div>
                  <div className="bg-white/[0.025] border border-white/5 rounded-2xl p-5 flex-1">
                    <p className="text-[10px] font-semibold tracking-widest uppercase text-amber-700 mb-1">{step}</p>
                    <p className="font-bold text-[#efebe9] text-sm mb-1">{title}</p>
                    <p className="text-xs text-[#6d4c41] leading-relaxed">{body}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Comparison */}
      <section className="max-w-5xl mx-auto px-6 py-20">
        <div className="mb-10">
          <p className="text-xs font-semibold tracking-widest uppercase text-amber-600 mb-3">Why On-Chain</p>
          <h2 className="text-3xl font-bold text-[#efebe9]">Traditional vs RWA-Backed Settlement</h2>
        </div>
        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-white/[0.025] border border-white/5 rounded-2xl p-7">
            <p className="text-sm font-bold text-[#6d4c41] mb-5 uppercase tracking-wider">Traditional</p>
            {[
              ['Settlement time', '1–5 business days (SWIFT)'],
              ['Escrow provider', 'Third-party escrow agent (fees)'],
              ['Audit trail', 'Paper records, email chains'],
              ['Document integrity', 'Relies on counterparty trust'],
              ['Cross-border cost', '0.5–3% FX + SWIFT fees'],
              ['Dispute resolution', 'Legal action, weeks/months'],
            ].map(([k, v]) => (
              <div key={k} className="flex justify-between py-2.5 border-b border-white/5 last:border-0">
                <span className="text-xs text-[#6d4c41]">{k}</span>
                <span className="text-xs text-[#a1887f]">{v}</span>
              </div>
            ))}
          </div>
          <div className="bg-amber-950/20 border border-amber-900/20 rounded-2xl p-7">
            <p className="text-sm font-bold text-amber-600 mb-5 uppercase tracking-wider">RWA-Backed (FTH)</p>
            {[
              ['Settlement time', '3–5 seconds (XRPL) / 5s (Stellar)'],
              ['Escrow provider', 'Protocol-native (no intermediary)'],
              ['Audit trail', 'Immutable on-chain hash records'],
              ['Document integrity', 'SHA-256 cryptographic proof'],
              ['Cross-border cost', '<$0.01 per transaction'],
              ['Dispute resolution', 'Crypto-condition evidence, instant'],
            ].map(([k, v]) => (
              <div key={k} className="flex justify-between py-2.5 border-b border-amber-900/10 last:border-0">
                <span className="text-xs text-[#6d4c41]">{k}</span>
                <span className="text-xs text-amber-400">{v}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-5xl mx-auto px-6 pb-20">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-amber-950 via-[#2a1a0f] to-[#0d0906] border border-amber-900/30 px-8 md:px-14 py-12 text-center">
          <div className="absolute left-1/2 -translate-x-1/2 top-0 w-96 h-48 bg-amber-700/10 rounded-full blur-3xl" />
          <div className="relative">
            <p className="text-xs font-semibold tracking-widest uppercase text-amber-500 mb-3">Get Started</p>
            <h2 className="text-2xl md:text-3xl font-bold text-[#efebe9] mb-4">
              Ready for an RWA-Backed Deal Structure?
            </h2>
            <p className="text-[#a1887f] max-w-lg mx-auto text-sm mb-8">
              Submit a term request and our structuring desk will design an on-chain-backed settlement
              structure for your commodity transaction.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link href="/request-terms" className="inline-flex items-center gap-2 bg-amber-700 hover:bg-amber-600 text-white font-semibold px-7 py-3.5 rounded-xl transition-all text-sm">
                Request Terms <ArrowRight size={15} />
              </Link>
              <Link href="/brokers" className="inline-flex items-center gap-2 border border-amber-800/40 bg-white/5 hover:bg-white/10 text-amber-400 font-semibold px-7 py-3.5 rounded-xl transition-colors text-sm">
                Broker Inquiry
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}

// ─────────────────────────────────────────────────────────────────
// Data
// ─────────────────────────────────────────────────────────────────

const rwaFeatures: Array<{ icon: React.ElementType; title: string; body: string }> = [
  { icon: Lock, title: 'SHA-256 Document Anchoring', body: 'Every deal document is hashed and anchored to XRPL/Stellar — creating immutable proof of existence without publishing sensitive content.' },
  { icon: Coins, title: 'Warehouse Receipt Tokenization', body: 'Physical inventory in certified warehouses represented as on-chain tokens — enabling fractional financing and digital transfer of title.' },
  { icon: Zap, title: 'Programmable Escrow', body: 'Funds held in protocol-native escrow released automatically upon cryptographically verified milestone completion.' },
  { icon: Shield, title: 'Compliance-First Design', body: 'Every counterparty and transaction is OFAC/AML screened. RWA infrastructure does not bypass compliance — it enforces it.' },
  { icon: BarChart3, title: 'Settlement Reporting', body: 'Full on-chain transaction history available as audit evidence — importable for accounting, tax, and regulatory reporting.' },
  { icon: FileText, title: 'Smart Document Routing', body: 'Contracts, inspection certificates, and B/Ls hash-linked to deal records on-chain — replacing fragmented email chains.' },
]

const steps = [
  {
    step: 'Deal Origination',
    title: 'Term Request & Compliance Screening',
    body: 'Buyer submits a term request. FTH compliance desk runs OFAC SDN, KYC/KYB, and FATF jurisdiction checks. All counterparties cleared before proceeding.',
  },
  {
    step: 'Structuring',
    title: 'LC / SBLC + Escrow Design',
    body: 'Structuring desk designs the payment mechanism: traditional Documentary Credit (LC) combined with XRPL or Stellar escrow layer for milestone release.',
  },
  {
    step: 'Document Anchoring',
    title: 'SHA-256 Hash to XRPL / Stellar',
    body: 'All key documents (contract, proforma invoice, SGS certificate terms) are hashed and anchored to the blockchain — creating a tamper-proof audit trail from day one.',
  },
  {
    step: 'EscrowCreate',
    title: 'Funds Locked On-Chain',
    body: 'Payment is locked in XRPL EscrowCreate transaction with SHA-256 crypto-conditions derived from agreed milestone events.',
  },
  {
    step: 'Milestone Execution',
    title: 'Shipment, Inspection, Discharge',
    body: 'SGS/Bureau Veritas inspection completed. Pre-image unlocked. Bill of Lading issued and endorsed. Port discharge confirmed. Each milestone hash-verified.',
  },
  {
    step: 'EscrowFinish',
    title: 'Funds Released to Seller',
    body: 'Seller provides the SHA-256 pre-image. EscrowFinish transaction executed. Funds released within seconds. Full on-chain settlement record generated.',
  },
]
