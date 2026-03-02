import Link from 'next/link'
import {
  TrendingUp,
  Globe,
  ArrowRight,
  Check,
  Target,
  DollarSign,
  LineChart,
  ShieldCheck,
  Users,
  BarChart3,
  Clock,
  Award,
  ChevronRight,
} from 'lucide-react'

export default function PropSharingPage() {
  return (
    <main className="bg-[#0d0906] text-[#efebe9] min-h-screen">

      {/* -- TOP NAV ------------------------------------------- */}
      <header className="fixed top-0 left-0 right-0 z-50 border-b border-white/5 bg-[#0d0906]/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-amber-700 flex items-center justify-center">
              <Globe size={15} className="text-amber-100" />
            </div>
            <span className="font-bold text-[#efebe9] tracking-tight">FTH Trading</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link href="/" className="text-sm text-[#a1887f] hover:text-[#efebe9] transition-colors hidden sm:block">Home</Link>
            <Link href="/sign-up" className="text-sm font-medium bg-amber-700 hover:bg-amber-600 text-white px-4 py-2 rounded-lg transition-colors">Apply Now</Link>
          </div>
        </div>
      </header>

      {/* -- HERO ---------------------------------------------- */}
      <section className="relative min-h-[70vh] flex flex-col justify-center px-6 pt-16 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_-10%,rgba(120,53,15,0.28),transparent)]" />
        <div className="relative max-w-5xl mx-auto w-full text-center">
          <div className="flex items-center justify-center gap-2 mb-8">
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold tracking-widest uppercase text-amber-500 border border-amber-800/50 bg-amber-950/40 px-3 py-1.5 rounded-full">
              <TrendingUp size={12} />
              Prop Sharing Program
            </span>
          </div>
          <h1 className="text-4xl md:text-6xl font-bold leading-[1.08] tracking-tight mb-6">
            Trade With Our Capital.<br /><span className="text-amber-600">Keep the Profits.</span>
          </h1>
          <p className="text-lg text-[#a1887f] max-w-2xl mx-auto leading-relaxed mb-10">
            Prove your trading edge in our structured evaluation. Get funded with up to $500K in institutional capital. Earn up to 90% of the profits you generate.
          </p>
          <div className="flex flex-wrap justify-center gap-4 mb-16">
            <Link href="/sign-up" className="inline-flex items-center gap-2 bg-amber-700 hover:bg-amber-600 text-white font-semibold px-7 py-3.5 rounded-xl transition-all hover:shadow-amber-900/40 hover:shadow-lg">
              Start Your Evaluation <ChevronRight size={16} />
            </Link>
            <Link href="#how-it-works" className="inline-flex items-center gap-2 border border-[#3e2723]/60 bg-white/5 hover:bg-white/10 text-[#efebe9] font-semibold px-7 py-3.5 rounded-xl transition-colors">How It Works</Link>
          </div>
          <div className="flex flex-wrap justify-center gap-x-8 gap-y-2">
            {['Up to 90/10 profit split', 'No personal capital at risk', 'Real commodity markets', 'Institutional risk management', 'Transparent payout schedule'].map((t) => (
              <span key={t} className="flex items-center gap-1.5 text-xs text-[#6d4c41]">
                <Check size={12} className="text-amber-600 shrink-0" />{t}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* -- STATS --------------------------------------------- */}
      <section className="border-y border-white/5 bg-white/[0.02]">
        <div className="max-w-5xl mx-auto px-6 py-12 grid grid-cols-2 md:grid-cols-4 gap-6">
          {[
            { value: '$500K', label: 'Max Funding' },
            { value: '90%', label: 'Trader Share' },
            { value: '4+', label: 'Commodity Markets' },
            { value: 'Bi-Weekly', label: 'Payouts' },
          ].map(({ value, label }) => (
            <div key={label} className="text-center">
              <p className="text-2xl md:text-3xl font-bold text-[#efebe9] mb-1">{value}</p>
              <p className="text-[10px] text-[#6d4c41] uppercase tracking-wider leading-tight">{label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* -- HOW IT WORKS -------------------------------------- */}
      <section id="how-it-works" className="max-w-5xl mx-auto px-6 py-24">
        <div className="mb-12 text-center">
          <p className="text-xs font-semibold tracking-widest uppercase text-amber-600 mb-3">How It Works</p>
          <h2 className="text-3xl md:text-4xl font-bold text-[#efebe9]">Your Path to Funded Trading</h2>
        </div>
        <div className="grid md:grid-cols-4 gap-6">
          {[
            { step: '01', icon: Target, title: 'Evaluation', desc: 'Trade a simulated account and hit the profit target while staying within drawdown limits. Minimum trading days required.' },
            { step: '02', icon: ShieldCheck, title: 'Verification', desc: 'Demonstrate consistency by maintaining your edge for a second phase. Prove it wasn\'t a fluke.' },
            { step: '03', icon: DollarSign, title: 'Get Funded', desc: 'Pass both phases and receive a live funded account with real capital. Trade commodity markets with institutional backing.' },
            { step: '04', icon: Award, title: 'Earn & Grow', desc: 'Receive profit-share payouts on a regular schedule. Scale your account with proven track record.' },
          ].map(({ step, icon: Icon, title, desc }) => (
            <div key={step} className="relative bg-white/[0.03] border border-white/5 rounded-2xl p-6 hover:bg-white/[0.05] transition-colors">
              <span className="text-[10px] font-mono text-amber-700 tracking-wider">{step}</span>
              <div className="w-10 h-10 rounded-xl bg-amber-950/60 border border-amber-800/20 flex items-center justify-center my-4">
                <Icon size={18} className="text-amber-500" />
              </div>
              <h3 className="font-bold text-[#efebe9] mb-2">{title}</h3>
              <p className="text-xs text-[#6d4c41] leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* -- PROGRAM TIERS ------------------------------------- */}
      <section className="border-t border-white/5 bg-white/[0.01]">
        <div className="max-w-5xl mx-auto px-6 py-24">
          <div className="mb-12 text-center">
            <p className="text-xs font-semibold tracking-widest uppercase text-amber-600 mb-3">Choose Your Level</p>
            <h2 className="text-3xl md:text-4xl font-bold text-[#efebe9]">Funding Programs</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { name: 'Starter', capital: '$10,000', split: '70/30', target: '8%', drawdown: '5%', daily: '2%', days: 10, popular: false },
              { name: 'Professional', capital: '$50,000', split: '80/20', target: '8%', drawdown: '6%', daily: '3%', days: 10, popular: true },
              { name: 'Institutional', capital: '$200,000', split: '90/10', target: '10%', drawdown: '5%', daily: '2%', days: 15, popular: false },
            ].map((p) => (
              <div key={p.name} className={`relative bg-white/[0.03] border rounded-2xl p-7 ${p.popular ? 'border-amber-700/50 ring-1 ring-amber-700/20' : 'border-white/5'}`}>
                {p.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="text-[10px] font-semibold tracking-widest uppercase bg-amber-700 text-white px-3 py-1 rounded-full">Most Popular</span>
                  </div>
                )}
                <h3 className="text-lg font-bold text-[#efebe9] mb-1">{p.name}</h3>
                <p className="text-3xl font-bold text-amber-500 mb-6">{p.capital}</p>
                <div className="space-y-3 mb-8">
                  {[
                    [`Profit Split: ${p.split}`, `${p.split.split('/')[0]}% to you`],
                    ['Profit Target', p.target],
                    ['Max Drawdown', p.drawdown],
                    ['Max Daily Loss', p.daily],
                    ['Min Trading Days', `${p.days} days`],
                  ].map(([label, value]) => (
                    <div key={label} className="flex justify-between text-sm">
                      <span className="text-[#6d4c41]">{label}</span>
                      <span className="text-[#efebe9] font-medium">{value}</span>
                    </div>
                  ))}
                </div>
                <Link href="/sign-up" className={`w-full inline-flex items-center justify-center gap-2 font-semibold px-6 py-3 rounded-xl transition-colors text-sm ${p.popular ? 'bg-amber-700 hover:bg-amber-600 text-white' : 'border border-white/10 bg-white/5 hover:bg-white/10 text-[#efebe9]'}`}>
                  Start Challenge <ArrowRight size={14} />
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* -- KEY FEATURES -------------------------------------- */}
      <section className="max-w-5xl mx-auto px-6 py-24">
        <div className="mb-12 text-center">
          <p className="text-xs font-semibold tracking-widest uppercase text-amber-600 mb-3">Why FTH Prop Sharing</p>
          <h2 className="text-3xl md:text-4xl font-bold text-[#efebe9]">Built for Serious Traders</h2>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          {[
            { icon: LineChart, title: 'Real-Time Risk Engine', desc: 'Automated drawdown monitoring, daily loss tracking, and position concentration alerts. Your account is always protected.', bullets: ['Live P&L tracking', 'Automated breach detection', 'Instant risk notifications'] },
            { icon: Users, title: 'Trader-First Terms', desc: 'No hidden charges. No clawbacks on paid profits. Scale your account with consistent performance over time.', bullets: ['Up to 90% profit share', 'No desk fees or commissions', 'Account scaling for top performers'] },
            { icon: BarChart3, title: 'Commodity Focused', desc: 'Trade the commodity markets you know: Coffee, Cocoa, Gold, Silver, Copper, and more across global exchanges.', bullets: ['Multiple commodity markets', 'Institutional execution', '50+ years of market expertise'] },
          ].map(({ icon: Icon, title, desc, bullets }) => (
            <div key={title} className="bg-white/[0.03] border border-white/5 rounded-2xl p-7">
              <div className="w-10 h-10 rounded-xl bg-amber-950/60 border border-amber-800/30 flex items-center justify-center mb-5">
                <Icon size={18} className="text-amber-500" />
              </div>
              <h3 className="font-bold text-[#efebe9] mb-3">{title}</h3>
              <p className="text-sm text-[#6d4c41] leading-relaxed mb-4">{desc}</p>
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
      </section>

      {/* -- CTA ----------------------------------------------- */}
      <section className="border-t border-white/5 text-center py-24 px-6">
        <p className="text-xs font-semibold tracking-widest uppercase text-amber-600 mb-4">Ready to Trade?</p>
        <h2 className="text-3xl md:text-4xl font-bold text-[#efebe9] mb-5">
          Start Your Evaluation Today
        </h2>
        <p className="text-[#6d4c41] mb-10 max-w-lg mx-auto">Prove your commodity trading edge. Get funded with institutional capital. Keep the profits.</p>
        <Link href="/sign-up" className="inline-flex items-center gap-2 bg-amber-700 hover:bg-amber-600 text-white font-semibold px-8 py-4 rounded-xl transition-all hover:shadow-amber-900/40 hover:shadow-lg">
          Apply Now <ArrowRight size={16} />
        </Link>
      </section>

      {/* -- FOOTER -------------------------------------------- */}
      <footer className="border-t border-white/5 px-6 py-10">
        <div className="max-w-5xl mx-auto text-center">
          <div className="flex items-center justify-center gap-3 mb-3">
            <div className="w-7 h-7 rounded-lg bg-amber-900 flex items-center justify-center">
              <Globe size={13} className="text-amber-300" />
            </div>
            <span className="font-bold text-[#efebe9] text-sm">FTH Trading</span>
          </div>
          <div className="flex flex-wrap justify-center gap-3 mb-4 text-[11px]">
            <Link href="/prop-sharing/rulebook" className="text-[#6d4c41] hover:text-amber-500 transition-colors">Challenge Rulebook</Link>
            <span className="text-[#3e2723]">·</span>
            <Link href="/prop-sharing/risk-disclosure" className="text-[#6d4c41] hover:text-amber-500 transition-colors">Risk Disclosure</Link>
            <span className="text-[#3e2723]">·</span>
            <Link href="/prop-sharing/compliance" className="text-[#6d4c41] hover:text-amber-500 transition-colors">AML & Compliance</Link>
            <span className="text-[#3e2723]">·</span>
            <Link href="/prop-sharing/terms" className="text-[#6d4c41] hover:text-amber-500 transition-colors">Terms of Service</Link>
            <span className="text-[#3e2723]">·</span>
            <Link href="/prop-sharing/privacy" className="text-[#6d4c41] hover:text-amber-500 transition-colors">Privacy Policy</Link>
          </div>
          <p className="text-[10px] text-[#3e2723] max-w-xl mx-auto leading-relaxed mb-4">
            <strong className="text-[#6d4c41]">Disclaimer:</strong> Prop sharing programs involve risk. Past performance does not guarantee future results. All funded accounts are subject to platform risk management rules and compliance review. FTH Trading reserves the right to modify program terms. Not available in all jurisdictions.
          </p>
          <p className="text-[10px] text-[#3e2723]">&copy; {new Date().getFullYear()} FTH Trading. All rights reserved.</p>
        </div>
      </footer>
    </main>
  )
}
