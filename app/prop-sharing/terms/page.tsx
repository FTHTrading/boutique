import Link from 'next/link'
import { Globe, ArrowLeft, FileText, Shield } from 'lucide-react'

export default function TermsPage() {
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
          <div className="w-10 h-10 rounded-xl bg-amber-900/40 flex items-center justify-center"><FileText size={20} className="text-amber-500" /></div>
          <div>
            <p className="text-xs font-semibold tracking-widest uppercase text-amber-600">Legal</p>
            <h1 className="text-3xl md:text-4xl font-bold">Terms of Service</h1>
          </div>
        </div>
        <p className="text-[#6d4c41] mb-12 text-sm">Effective: March 2026. By using FTH Trading&apos;s Prop Challenge services, you agree to these terms.</p>

        <div className="space-y-10">

          <Section num="1" title="Definitions">
            <ul className="list-disc list-inside space-y-1 mt-2">
              <li><strong className="text-[#efebe9]">&quot;FTH Trading&quot;</strong> or <strong className="text-[#efebe9]">&quot;Company&quot;</strong> refers to FTH Trading and its affiliates.</li>
              <li><strong className="text-[#efebe9]">&quot;Participant&quot;</strong> or <strong className="text-[#efebe9]">&quot;Trader&quot;</strong> refers to any individual who registers for or participates in the Prop Challenge.</li>
              <li><strong className="text-[#efebe9]">&quot;Prop Challenge&quot;</strong> refers to the multi-phase trading evaluation program operated by FTH Trading.</li>
              <li><strong className="text-[#efebe9]">&quot;Evaluation Account&quot;</strong> refers to the simulated trading account used during Phase 1 and Phase 2.</li>
              <li><strong className="text-[#efebe9]">&quot;Funded Account&quot;</strong> refers to an account backed by FTH Trading capital, granted upon successful evaluation.</li>
              <li><strong className="text-[#efebe9]">&quot;Evaluation Fee&quot;</strong> refers to the non-refundable service fee paid for access to the evaluation program.</li>
              <li><strong className="text-[#efebe9]">&quot;Profit Split&quot;</strong> refers to the contractual performance compensation paid to successful Funded Traders.</li>
            </ul>
          </Section>

          <Section num="2" title="Eligibility">
            <ul className="list-disc list-inside space-y-1 mt-2">
              <li>You must be at least 18 years of age (or the age of majority in your jurisdiction).</li>
              <li>You must not be located in or a national of a sanctioned jurisdiction.</li>
              <li>You must provide accurate, current information during registration and KYC verification.</li>
              <li>You must not have a previously terminated account due to fraud or prohibited activity.</li>
              <li>FTH Trading reserves the right to refuse service to any individual at its sole discretion.</li>
            </ul>
          </Section>

          <Section num="3" title="Nature of Services">
            <ul className="list-disc list-inside space-y-1 mt-2">
              <li>The Prop Challenge is a <strong className="text-[#efebe9]">skill evaluation service</strong>. The Evaluation Fee is payment for access to this service.</li>
              <li>Evaluation accounts are simulated. No real trading occurs during evaluation phases.</li>
              <li>Funding decisions are made solely by FTH Trading based on evaluation results and compliance checks.</li>
              <li>The Profit Split is contractual performance compensation — not investment returns, dividends, or interest.</li>
              <li>FTH Trading is not a broker, investment adviser, fund manager, or securities issuer.</li>
              <li>Participation does not create an employer-employee, partnership, or agency relationship.</li>
            </ul>
          </Section>

          <Section num="4" title="Evaluation Fee & Payments">
            <ul className="list-disc list-inside space-y-1 mt-2">
              <li>The Evaluation Fee is payable upon application and is <strong className="text-[#efebe9]">non-refundable</strong>.</li>
              <li>Payment must be made in the currency and method specified at checkout.</li>
              <li>Third-party payments are not accepted. The name on the payment method must match the applicant.</li>
              <li>FTH Trading does not store credit card details. Payment processing is handled by third-party processors.</li>
              <li>Chargebacks or fraudulent payment claims will result in immediate account termination and may be reported to authorities.</li>
            </ul>
          </Section>

          <Section num="5" title="Challenge Rules & Conduct">
            <ul className="list-disc list-inside space-y-1 mt-2">
              <li>All participants must comply with the <Link href="/prop-sharing/rulebook" className="text-amber-500 hover:underline">Challenge Rulebook</Link>.</li>
              <li>Prohibited trading strategies are strictly enforced and monitored by automated systems.</li>
              <li>FTH Trading may modify challenge rules, risk parameters, or program terms with reasonable notice.</li>
              <li>Material rule changes will be communicated via email to active participants.</li>
              <li>Continued participation after notice constitutes acceptance of modified terms.</li>
            </ul>
          </Section>

          <Section num="6" title="Funded Account Terms">
            <ul className="list-disc list-inside space-y-1 mt-2">
              <li>Funded Accounts are operated under a service agreement between FTH Trading and the Trader.</li>
              <li>All capital in Funded Accounts belongs to FTH Trading. Traders do not own or control firm capital.</li>
              <li>FTH Trading may adjust position limits, drawdown thresholds, or trading permissions at any time.</li>
              <li>Funded Accounts may be suspended, frozen, or terminated for rule violations.</li>
              <li>KYC verification must be completed before any payout is processed.</li>
            </ul>
          </Section>

          <Section num="7" title="Payouts & Profit Share">
            <ul className="list-disc list-inside space-y-1 mt-2">
              <li>Profit Split ratios are defined per program and disclosed at enrollment.</li>
              <li>Payouts are calculated on net realized profit after applicable fees.</li>
              <li>Payout requests are processed on a bi-weekly or monthly cycle (program-dependent).</li>
              <li>FTH Trading reserves the right to withhold payouts pending compliance review.</li>
              <li>Taxes on payouts are the sole responsibility of the Trader. FTH Trading does not provide tax advice.</li>
              <li>FTH Trading may issue tax documentation (e.g., 1099 for U.S. persons) as required by law.</li>
            </ul>
          </Section>

          <Section num="8" title="Intellectual Property">
            <ul className="list-disc list-inside space-y-1 mt-2">
              <li>All content, software, systems, and branding on FTH Trading platforms are the property of FTH Trading.</li>
              <li>Participants may not reverse-engineer, scrape, or reproduce any FTH Trading technology or content.</li>
              <li>Trading strategies developed by Participants remain their intellectual property.</li>
            </ul>
          </Section>

          <Section num="9" title="Limitation of Liability">
            <div className="bg-white/[0.03] border border-white/5 rounded-lg p-4 mt-2">
              <p className="text-sm">
                TO THE MAXIMUM EXTENT PERMITTED BY LAW, FTH TRADING SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, CONSEQUENTIAL,
                SPECIAL, OR PUNITIVE DAMAGES ARISING FROM OR RELATED TO PARTICIPATION IN THE PROP CHALLENGE. FTH TRADING&apos;S TOTAL
                LIABILITY SHALL NOT EXCEED THE EVALUATION FEE PAID BY THE PARTICIPANT. THIS LIMITATION APPLIES REGARDLESS OF THE
                THEORY OF LIABILITY (CONTRACT, TORT, NEGLIGENCE, OR OTHERWISE).
              </p>
            </div>
          </Section>

          <Section num="10" title="Termination">
            <ul className="list-disc list-inside space-y-1 mt-2">
              <li>FTH Trading may terminate or suspend access at any time for breach of these terms, prohibited activity, or compliance concerns.</li>
              <li>Participants may withdraw from the program at any time by written notice. No refund of the Evaluation Fee will be provided.</li>
              <li>Upon termination, all trading activity ceases immediately. Outstanding legitimate payouts will be processed per standard timelines.</li>
            </ul>
          </Section>

          <Section num="11" title="Dispute Resolution">
            <ul className="list-disc list-inside space-y-1 mt-2">
              <li>Disputes should be submitted in writing to <span className="text-amber-500">compliance@fthtrading.com</span> within 14 days of the disputed action.</li>
              <li>FTH Trading will respond within 10 business days with a written determination.</li>
              <li>If unresolved, disputes may be submitted to binding arbitration under the rules of the applicable jurisdiction.</li>
              <li>Class action waivers apply. Participants agree to resolve disputes individually.</li>
            </ul>
          </Section>

          <Section num="12" title="Governing Law">
            <p>
              These Terms of Service are governed by and construed in accordance with the laws of the jurisdiction in which FTH Trading
              is registered, without regard to conflict of law provisions. Any legal action must be brought in the courts of that jurisdiction.
            </p>
          </Section>

          <Section num="13" title="Severability">
            <p>
              If any provision of these terms is found to be unenforceable, the remaining provisions shall continue in full force and effect.
              The unenforceable provision shall be modified to the minimum extent necessary to make it enforceable.
            </p>
          </Section>

          <Section num="14" title="Entire Agreement">
            <p>
              These Terms, together with the Challenge Rulebook, Risk Disclosure, Privacy Policy, and AML/Compliance Policy, constitute
              the entire agreement between the Participant and FTH Trading regarding the Prop Challenge. No oral or written representations
              outside these documents shall be binding.
            </p>
          </Section>

        </div>

        {/* LEGAL FOOTER LINKS */}
        <div className="border-t border-white/5 mt-16 pt-8 flex flex-wrap gap-4 justify-center text-xs text-[#6d4c41]">
          <Link href="/prop-sharing/rulebook" className="hover:text-amber-500 transition-colors">Challenge Rulebook</Link>
          <span>·</span>
          <Link href="/prop-sharing/risk-disclosure" className="hover:text-amber-500 transition-colors">Risk Disclosure</Link>
          <span>·</span>
          <Link href="/prop-sharing/compliance" className="hover:text-amber-500 transition-colors">AML & Compliance</Link>
          <span>·</span>
          <Link href="/prop-sharing/privacy" className="hover:text-amber-500 transition-colors">Privacy Policy</Link>
        </div>
      </div>
    </main>
  )
}

function Section({ num, title, children }: { num: string; title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
        <span className="text-amber-700 font-mono text-xs bg-amber-900/20 w-6 h-6 rounded flex items-center justify-center">{num}</span>
        {title}
      </h2>
      <div className="text-sm text-[#a1887f] leading-relaxed pl-8">{children}</div>
    </section>
  )
}
