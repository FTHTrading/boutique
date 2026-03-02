import Link from 'next/link'
import { Globe, ArrowLeft, AlertTriangle, ShieldCheck } from 'lucide-react'

export default function RiskDisclosurePage() {
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

        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-red-900/30 flex items-center justify-center"><AlertTriangle size={20} className="text-red-400" /></div>
          <div>
            <p className="text-xs font-semibold tracking-widest uppercase text-red-500">Important</p>
            <h1 className="text-3xl md:text-4xl font-bold">Risk Disclosure Statement</h1>
          </div>
        </div>
        <p className="text-[#6d4c41] mb-12 text-sm">Effective: March 2026. Please read this document carefully before participating in any FTH Trading program.</p>

        <div className="bg-red-950/20 border border-red-900/30 rounded-xl p-6 mb-12">
          <p className="text-sm text-red-400 font-semibold mb-3">⚠ IMPORTANT WARNING</p>
          <p className="text-sm text-[#a1887f] leading-relaxed">
            Trading commodity futures, options, and other derivative instruments involves substantial risk of loss and is not suitable for all individuals.
            You should carefully consider whether participation in the FTH Prop Challenge is appropriate for you in light of your financial situation,
            experience level, and risk tolerance. The possibility exists that you could sustain a loss of some or all of your evaluation fee.
            Past performance is not indicative of future results.
          </p>
        </div>

        <div className="space-y-10">

          <Section title="Nature of the Program">
            <ul className="list-disc list-inside space-y-2">
              <li>The FTH Prop Challenge is a <strong className="text-[#efebe9]">skill evaluation program</strong>, not an investment opportunity.</li>
              <li>Evaluation phase accounts are <strong className="text-[#efebe9]">simulated trading environments</strong>. No real capital is at risk during evaluation.</li>
              <li>The evaluation fee is a non-refundable service fee for access to the evaluation platform. It is not an investment, deposit, or stake.</li>
              <li>Successful completion of evaluation does not guarantee funding. FTH Trading retains sole discretion over all funding decisions.</li>
              <li>Funded accounts use real FTH Trading capital. Traders do not deposit or risk their own capital on funded accounts.</li>
            </ul>
          </Section>

          <Section title="Commodity Trading Risks">
            <ul className="list-disc list-inside space-y-2">
              <li><strong className="text-[#efebe9]">Market Risk:</strong> Commodity prices can be highly volatile and may move against your position rapidly.</li>
              <li><strong className="text-[#efebe9]">Leverage Risk:</strong> Trading with leverage amplifies both gains and losses. Small price movements can result in large percentage changes.</li>
              <li><strong className="text-[#efebe9]">Liquidity Risk:</strong> Some commodity markets may have limited liquidity, resulting in slippage or inability to exit positions.</li>
              <li><strong className="text-[#efebe9]">Gap Risk:</strong> Prices can gap significantly between trading sessions, particularly around weekends and news events.</li>
              <li><strong className="text-[#efebe9]">Counterparty Risk:</strong> Execution depends on third-party brokers and liquidity providers.</li>
              <li><strong className="text-[#efebe9]">Geopolitical Risk:</strong> Commodity markets are heavily influenced by geopolitical events, supply disruptions, and regulatory changes.</li>
            </ul>
          </Section>

          <Section title="Evaluation Fee Risk">
            <ul className="list-disc list-inside space-y-2">
              <li>The evaluation fee is <strong className="text-[#efebe9]">non-refundable</strong> regardless of evaluation outcome.</li>
              <li>Most participants do not successfully complete the evaluation. You should expect the possibility of losing your entire evaluation fee.</li>
              <li>FTH Trading does not guarantee or imply any particular pass rate or probability of success.</li>
              <li>Refund requests are only considered in cases of documented platform failures that materially affected trading activity.</li>
            </ul>
          </Section>

          <Section title="Funded Account Risks">
            <ul className="list-disc list-inside space-y-2">
              <li>Funded accounts can be <strong className="text-[#efebe9]">suspended or terminated</strong> at any time for rule violations.</li>
              <li>FTH Trading may modify risk parameters, profit split ratios, or program terms with reasonable notice.</li>
              <li>Payouts are subject to KYC verification, compliance review, and processing timelines.</li>
              <li>Funded trading activity is monitored for prohibited strategies. Violations result in immediate termination.</li>
              <li>FTH Trading bears the financial risk of funded account losses — but the trader bears the risk of lost time and opportunity.</li>
            </ul>
          </Section>

          <Section title="Technology & Platform Risks">
            <ul className="list-disc list-inside space-y-2">
              <li>Trading platforms may experience downtime, latency, errors, or data feed issues.</li>
              <li>Internet connectivity failures are the trader&apos;s responsibility.</li>
              <li>FTH Trading is not liable for losses caused by technology failures beyond its reasonable control.</li>
              <li>Automated risk systems (daily lockouts, drawdown freezes) may execute during volatile conditions and cannot be overridden.</li>
            </ul>
          </Section>

          <Section title="No Guarantees">
            <ul className="list-disc list-inside space-y-2">
              <li>FTH Trading makes <strong className="text-[#efebe9]">no guarantees</strong> of profit, income, or return on the evaluation fee.</li>
              <li>Testimonials, leaderboards, and performance metrics reflect individual results and are not representative of typical outcomes.</li>
              <li>Historical program statistics should not be interpreted as predictive of future performance.</li>
              <li>The prop challenge is a skill-based program. Outcomes depend entirely on the trader&apos;s ability, discipline, and market conditions.</li>
            </ul>
          </Section>

          <Section title="Regulatory Notice">
            <p>
              FTH Trading operates a proprietary capital evaluation program. The prop challenge is structured as a service agreement — not a securities offering,
              collective investment scheme, or pooled investment vehicle. Participants are independent contractors receiving performance-based compensation,
              not investors receiving returns on capital. This program may not be available in all jurisdictions. It is the participant&apos;s responsibility
              to ensure compliance with local laws and regulations.
            </p>
          </Section>

          <Section title="Acknowledgement">
            <div className="bg-white/[0.03] border border-white/5 rounded-lg p-4">
              <p className="text-sm">
                By submitting a challenge application, you acknowledge that you have read, understood, and accepted the risks described in this document.
                You confirm that the evaluation fee is discretionary, non-refundable, and that you can afford to lose it entirely.
                You understand that past performance does not guarantee future results and that FTH Trading makes no income guarantees.
              </p>
            </div>
          </Section>

        </div>

        {/* LEGAL FOOTER LINKS */}
        <div className="border-t border-white/5 mt-16 pt-8 flex flex-wrap gap-4 justify-center text-xs text-[#6d4c41]">
          <Link href="/prop-sharing/rulebook" className="hover:text-amber-500 transition-colors">Challenge Rulebook</Link>
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

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
        <ShieldCheck size={16} className="text-amber-600" />
        {title}
      </h2>
      <div className="text-sm text-[#a1887f] leading-relaxed pl-6">{children}</div>
    </section>
  )
}
