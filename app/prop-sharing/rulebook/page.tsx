import Link from 'next/link'
import { Globe, ArrowLeft, BookOpen, Target, ShieldCheck, AlertTriangle, DollarSign, Clock, TrendingUp, Award, ChevronRight } from 'lucide-react'

export default function RulebookPage() {
  return (
    <main className="bg-[#0d0906] text-[#efebe9] min-h-screen">

      {/* NAV */}
      <header className="fixed top-0 left-0 right-0 z-50 border-b border-white/5 bg-[#0d0906]/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-amber-700 flex items-center justify-center"><Globe size={15} className="text-amber-100" /></div>
            <span className="font-bold text-[#efebe9] tracking-tight">FTH Trading</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link href="/prop-sharing" className="text-sm text-[#a1887f] hover:text-[#efebe9] transition-colors flex items-center gap-1"><ArrowLeft size={14} /> Back</Link>
            <Link href="/prop-sharing/apply" className="text-sm font-medium bg-amber-700 hover:bg-amber-600 text-white px-4 py-2 rounded-lg transition-colors">Apply Now</Link>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-6 pt-28 pb-20">

        {/* HEADER */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-amber-900/40 flex items-center justify-center"><BookOpen size={20} className="text-amber-500" /></div>
          <div>
            <p className="text-xs font-semibold tracking-widest uppercase text-amber-600">Official Rules</p>
            <h1 className="text-3xl md:text-4xl font-bold">Challenge Rulebook</h1>
          </div>
        </div>
        <p className="text-[#6d4c41] mb-12 text-sm">Last updated: March 2026. All challenge participants are bound by these rules.</p>

        {/* TABLE OF CONTENTS */}
        <div className="bg-white/[0.02] border border-white/5 rounded-xl p-6 mb-12">
          <h3 className="text-sm font-semibold text-amber-500 mb-3">Contents</h3>
          <ol className="grid sm:grid-cols-2 gap-1.5">
            {['Challenge Structure', 'Evaluation Phases', 'Profit Targets', 'Drawdown Rules', 'Daily Loss Limits', 'Minimum Trading Days', 'Prohibited Strategies', 'Funded Account Rules', 'Profit Split & Payouts', 'Scaling Program', 'Account Violations', 'Dispute Resolution'].map((s, i) => (
              <li key={i} className="text-sm text-[#a1887f] flex items-center gap-2">
                <span className="text-amber-700 font-mono text-xs w-5">{i + 1}.</span>{s}
              </li>
            ))}
          </ol>
        </div>

        {/* SECTIONS */}
        <div className="space-y-12">

          {/* 1 */}
          <Section num="1" title="Challenge Structure" icon={<Target size={16} />}>
            <p>The FTH Prop Challenge is a multi-phase evaluation program designed to identify skilled commodity traders. Successful candidates receive funded accounts backed by FTH Trading capital.</p>
            <ul className="list-disc list-inside space-y-1 mt-3 text-sm text-[#a1887f]">
              <li>Challenge accounts are <strong className="text-[#efebe9]">simulated</strong> during evaluation phases</li>
              <li>Real capital is deployed only upon reaching Funded status</li>
              <li>Profit sharing is contractual performance compensation, not investment returns</li>
              <li>FTH Trading retains sole discretion over all funding decisions</li>
            </ul>
          </Section>

          {/* 2 */}
          <Section num="2" title="Evaluation Phases" icon={<Clock size={16} />}>
            <div className="overflow-x-auto mt-3">
              <table className="w-full text-sm">
                <thead><tr className="border-b border-white/10 text-left text-[#6d4c41]">
                  <th className="pb-2 pr-4">Phase</th><th className="pb-2 pr-4">Duration</th><th className="pb-2 pr-4">Objective</th><th className="pb-2">Advance Criteria</th>
                </tr></thead>
                <tbody className="text-[#a1887f]">
                  <tr className="border-b border-white/5"><td className="py-2 pr-4 text-amber-500 font-medium">Phase 1</td><td className="py-2 pr-4">30 calendar days</td><td className="py-2 pr-4">Hit profit target</td><td className="py-2">Meet target + min trading days + no rule violations</td></tr>
                  <tr className="border-b border-white/5"><td className="py-2 pr-4 text-amber-500 font-medium">Phase 2</td><td className="py-2 pr-4">60 calendar days</td><td className="py-2 pr-4">Confirm consistency</td><td className="py-2">Meet reduced target + maintained risk discipline</td></tr>
                  <tr><td className="py-2 pr-4 text-amber-500 font-medium">Funded</td><td className="py-2 pr-4">Indefinite</td><td className="py-2 pr-4">Trade firm capital</td><td className="py-2">Ongoing compliance with risk rules</td></tr>
                </tbody>
              </table>
            </div>
            <p className="mt-3 text-xs text-[#6d4c41]">Phase durations and targets vary by program tier. Check your specific program details.</p>
          </Section>

          {/* 3 */}
          <Section num="3" title="Profit Targets" icon={<TrendingUp size={16} />}>
            <p>Each evaluation phase has a profit target expressed as a percentage of starting balance:</p>
            <ul className="list-disc list-inside space-y-1 mt-3 text-sm text-[#a1887f]">
              <li><strong className="text-[#efebe9]">Phase 1:</strong> Typically 8–10% (program-dependent)</li>
              <li><strong className="text-[#efebe9]">Phase 2:</strong> Typically 5% (reduced target for consistency verification)</li>
              <li>Targets must be achieved through legitimate trading activity</li>
              <li>Holding positions overnight or over weekends is permitted unless program rules state otherwise</li>
            </ul>
          </Section>

          {/* 4 */}
          <Section num="4" title="Drawdown Rules" icon={<AlertTriangle size={16} />}>
            <p>Maximum drawdown is the most critical risk parameter. Breaching the max drawdown limit results in <strong className="text-[#efebe9]">immediate account suspension and phase rollback.</strong></p>
            <div className="bg-red-950/20 border border-red-900/30 rounded-lg p-4 mt-3">
              <p className="text-sm text-red-400 font-medium mb-2">⚠ Account Freeze Trigger</p>
              <p className="text-sm text-[#a1887f]">If your account equity drops below <strong className="text-[#efebe9]">(Starting Balance − Max Drawdown %)</strong>, your account is automatically frozen. All open positions are closed, and you are rolled back to the previous evaluation phase.</p>
            </div>
            <ul className="list-disc list-inside space-y-1 mt-3 text-sm text-[#a1887f]">
              <li>Drawdown is calculated from peak balance (trailing), not initial balance</li>
              <li>Both realized and unrealized P&L count toward drawdown</li>
              <li>Drawdown resets when advancing to a new phase</li>
            </ul>
          </Section>

          {/* 5 */}
          <Section num="5" title="Daily Loss Limits" icon={<ShieldCheck size={16} />}>
            <p>Each trading day has a maximum permissible loss, separate from the overall drawdown limit.</p>
            <div className="bg-amber-950/20 border border-amber-900/30 rounded-lg p-4 mt-3">
              <p className="text-sm text-amber-400 font-medium mb-2">🔒 Daily Lockout</p>
              <p className="text-sm text-[#a1887f]">If your daily P&L reaches the daily loss limit, your account is <strong className="text-[#efebe9]">locked for the remainder of the trading day</strong>. You may resume trading the following trading day. This is a lockout, not a suspension — your account remains active.</p>
            </div>
            <ul className="list-disc list-inside space-y-1 mt-3 text-sm text-[#a1887f]">
              <li>Daily loss limit is typically 3–5% of starting balance (program-dependent)</li>
              <li>Resets at 00:00 UTC each trading day</li>
              <li>Multiple daily lockouts may trigger additional review</li>
            </ul>
          </Section>

          {/* 6 */}
          <Section num="6" title="Minimum Trading Days" icon={<Clock size={16} />}>
            <p>To advance phases, you must trade on a minimum number of distinct trading days. A trading day is counted when at least one round-trip trade is completed.</p>
            <ul className="list-disc list-inside space-y-1 mt-3 text-sm text-[#a1887f]">
              <li>Minimum is typically 5–10 days per phase (program-dependent)</li>
              <li>Days where only positions are opened but not closed do not count</li>
              <li>This ensures consistency, not lucky single trades</li>
            </ul>
          </Section>

          {/* 7 */}
          <Section num="7" title="Prohibited Strategies" icon={<AlertTriangle size={16} />}>
            <p>The following trading behaviors are strictly prohibited and will result in account termination:</p>
            <div className="grid sm:grid-cols-2 gap-3 mt-3">
              {[
                { label: 'Latency Arbitrage', desc: 'Exploiting price feed delays for risk-free profit' },
                { label: 'High-Frequency Scalping', desc: 'Sub-10-second trades designed to exploit market microstructure' },
                { label: 'Copy Trading', desc: 'Replicating another participant\'s trades systematically' },
                { label: 'News Straddling', desc: 'Placing opposing orders around major economic releases' },
                { label: 'Overnight Gap Exploits', desc: 'Systematic exploitation of overnight gap patterns' },
                { label: 'Account Sharing', desc: 'Allowing third parties to trade your evaluation account' },
                { label: 'Wash Trading', desc: 'Opening and closing positions with no genuine market intent' },
                { label: 'Hedging Across Accounts', desc: 'Using multiple challenge accounts to hedge opposing positions' },
              ].map((item, i) => (
                <div key={i} className="bg-white/[0.02] border border-white/5 rounded-lg p-3">
                  <p className="text-sm font-medium text-red-400">{item.label}</p>
                  <p className="text-xs text-[#6d4c41] mt-1">{item.desc}</p>
                </div>
              ))}
            </div>
            <p className="mt-3 text-xs text-[#6d4c41]">FTH Trading employs automated fraud detection to identify these patterns. Violations are logged to an immutable audit trail.</p>
          </Section>

          {/* 8 */}
          <Section num="8" title="Funded Account Rules" icon={<DollarSign size={16} />}>
            <p>Upon reaching Funded status, the following additional rules apply:</p>
            <ul className="list-disc list-inside space-y-1 mt-3 text-sm text-[#a1887f]">
              <li>You are trading real FTH Trading capital — treat it accordingly</li>
              <li>Maximum drawdown limits are strictly enforced (auto-freeze)</li>
              <li>Position sizing limits apply (max % of account per position)</li>
              <li>FTH Trading may adjust risk parameters at any time with notice</li>
              <li>KYC/AML verification must be completed before first payout</li>
              <li>Funded accounts may be subject to periodic performance review</li>
            </ul>
          </Section>

          {/* 9 */}
          <Section num="9" title="Profit Split & Payouts" icon={<DollarSign size={16} />}>
            <p>Funded traders receive a share of net profits generated on their funded account.</p>
            <ul className="list-disc list-inside space-y-1 mt-3 text-sm text-[#a1887f]">
              <li>Profit split ratios are defined per program (typically 70/30 to 90/10 in favor of the trader)</li>
              <li>Payouts are calculated on net realized P&L after fees</li>
              <li>Payout requests are processed bi-weekly or monthly (program-dependent)</li>
              <li>Minimum payout threshold applies (typically $100)</li>
              <li>KYC must be approved before any payout is released</li>
              <li>Payouts are contractual performance compensation</li>
            </ul>
          </Section>

          {/* 10 */}
          <Section num="10" title="Scaling Program" icon={<Award size={16} />}>
            <p>Consistently profitable funded traders may qualify for capital increases through the Dynamic Scaling Program.</p>
            <ul className="list-disc list-inside space-y-1 mt-3 text-sm text-[#a1887f]">
              <li>Scaling decisions are based on: Sharpe ratio, profit factor, max drawdown stability, and consistency score</li>
              <li>Capital may be increased by 25% per scaling tier (up to 5 tiers)</li>
              <li>Minimum 30-day cooldown between scaling events</li>
              <li>Scaling may be reversed if performance degrades</li>
              <li>FTH Trading retains sole discretion over all scaling decisions</li>
            </ul>
          </Section>

          {/* 11 */}
          <Section num="11" title="Account Violations" icon={<AlertTriangle size={16} />}>
            <div className="overflow-x-auto mt-3">
              <table className="w-full text-sm">
                <thead><tr className="border-b border-white/10 text-left text-[#6d4c41]">
                  <th className="pb-2 pr-4">Violation</th><th className="pb-2 pr-4">Consequence</th><th className="pb-2">Appeal</th>
                </tr></thead>
                <tbody className="text-[#a1887f]">
                  <tr className="border-b border-white/5"><td className="py-2 pr-4">Daily loss limit breach</td><td className="py-2 pr-4 text-amber-400">Temporary lockout (same day)</td><td className="py-2">Automatic — resumes next day</td></tr>
                  <tr className="border-b border-white/5"><td className="py-2 pr-4">Max drawdown breach</td><td className="py-2 pr-4 text-red-400">Account frozen + phase rollback</td><td className="py-2">Re-evaluation required</td></tr>
                  <tr className="border-b border-white/5"><td className="py-2 pr-4">Prohibited strategy detected</td><td className="py-2 pr-4 text-red-400">Account termination</td><td className="py-2">Written appeal within 14 days</td></tr>
                  <tr><td className="py-2 pr-4">KYC failure</td><td className="py-2 pr-4 text-red-400">Payout freeze + review</td><td className="py-2">Resubmission with valid documents</td></tr>
                </tbody>
              </table>
            </div>
          </Section>

          {/* 12 */}
          <Section num="12" title="Dispute Resolution" icon={<ShieldCheck size={16} />}>
            <p>FTH Trading is committed to fair and transparent dispute resolution:</p>
            <ul className="list-disc list-inside space-y-1 mt-3 text-sm text-[#a1887f]">
              <li>All account actions are logged to an immutable, timestamped audit trail</li>
              <li>Traders may request a formal review of any adverse action within 14 calendar days</li>
              <li>Reviews are conducted by the compliance team — separate from trading operations</li>
              <li>Decisions are communicated in writing with full reasoning</li>
              <li>FTH Trading&apos;s determination is final and binding</li>
            </ul>
            <p className="mt-3 text-xs text-[#6d4c41]">For disputes, contact: <span className="text-amber-500">compliance@fthtrading.com</span></p>
          </Section>

        </div>

        {/* LEGAL FOOTER LINKS */}
        <div className="border-t border-white/5 mt-16 pt-8 flex flex-wrap gap-4 justify-center text-xs text-[#6d4c41]">
          <Link href="/prop-sharing/risk-disclosure" className="hover:text-amber-500 transition-colors">Risk Disclosure</Link>
          <span>·</span>
          <Link href="/prop-sharing/compliance" className="hover:text-amber-500 transition-colors">AML & Compliance</Link>
          <span>·</span>
          <Link href="/prop-sharing/terms" className="hover:text-amber-500 transition-colors">Terms of Service</Link>
          <span>·</span>
          <Link href="/prop-sharing/privacy" className="hover:text-amber-500 transition-colors">Privacy Policy</Link>
        </div>
      </div>
    </main>
  )
}

function Section({ num, title, icon, children }: { num: string; title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <section>
      <div className="flex items-center gap-2 mb-3">
        <span className="text-amber-700 font-mono text-xs bg-amber-900/20 w-6 h-6 rounded flex items-center justify-center">{num}</span>
        <span className="text-amber-500">{icon}</span>
        <h2 className="text-lg font-semibold">{title}</h2>
      </div>
      <div className="text-sm text-[#a1887f] leading-relaxed pl-8">{children}</div>
    </section>
  )
}
