import Link from 'next/link'
import { Globe, ArrowLeft, Shield, CheckCircle, AlertTriangle } from 'lucide-react'

export default function CompliancePage() {
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
          <div className="w-10 h-10 rounded-xl bg-amber-900/40 flex items-center justify-center"><Shield size={20} className="text-amber-500" /></div>
          <div>
            <p className="text-xs font-semibold tracking-widest uppercase text-amber-600">Compliance</p>
            <h1 className="text-3xl md:text-4xl font-bold">AML & Compliance Policy</h1>
          </div>
        </div>
        <p className="text-[#6d4c41] mb-12 text-sm">Effective: March 2026. FTH Trading is committed to preventing money laundering, terrorist financing, and financial crime.</p>

        <div className="space-y-10">

          <Section title="1. Anti-Money Laundering (AML) Commitment">
            <p>FTH Trading maintains a comprehensive Anti-Money Laundering program designed to:</p>
            <ul className="list-disc list-inside space-y-1 mt-3">
              <li>Prevent the use of our platform for money laundering or terrorist financing</li>
              <li>Detect and report suspicious activity to relevant authorities</li>
              <li>Comply with applicable AML regulations in all operating jurisdictions</li>
              <li>Maintain accurate records of all financial transactions and participant identities</li>
            </ul>
          </Section>

          <Section title="2. Know Your Customer (KYC) Requirements">
            <p>All funded traders must complete KYC verification before receiving any payout. KYC requirements include:</p>
            <div className="grid sm:grid-cols-2 gap-3 mt-4">
              <KycItem icon={<CheckCircle size={14} />} label="Identity Verification" desc="Government-issued photo ID (passport, national ID, or driver's license)" />
              <KycItem icon={<CheckCircle size={14} />} label="Proof of Address" desc="Utility bill, bank statement, or government letter dated within 3 months" />
              <KycItem icon={<CheckCircle size={14} />} label="Sanctions Screening" desc="Automated check against OFAC, EU, UN, and other global sanctions lists" />
              <KycItem icon={<CheckCircle size={14} />} label="PEP Screening" desc="Check against Politically Exposed Persons databases" />
              <KycItem icon={<CheckCircle size={14} />} label="Source of Funds" desc="Declaration of lawful origin of evaluation fees" />
              <KycItem icon={<CheckCircle size={14} />} label="Tax Identification" desc="Tax ID or equivalent for applicable jurisdictions" />
            </div>
          </Section>

          <Section title="3. Enhanced Due Diligence">
            <p>Enhanced due diligence (EDD) is applied when:</p>
            <ul className="list-disc list-inside space-y-1 mt-3">
              <li>The participant is a Politically Exposed Person (PEP) or close associate of a PEP</li>
              <li>The participant is from a high-risk jurisdiction (as defined by FATF)</li>
              <li>Transactions or trading patterns suggest elevated risk</li>
              <li>Cumulative payouts exceed $50,000 in any 12-month period</li>
              <li>Unusual trading activity is detected by our automated monitoring systems</li>
            </ul>
            <p className="mt-3">EDD may include additional documentation requests, video verification, or extended processing times.</p>
          </Section>

          <Section title="4. Sanctions Compliance">
            <p>FTH Trading does not onboard or provide services to individuals or entities:</p>
            <ul className="list-disc list-inside space-y-1 mt-3">
              <li>Listed on OFAC&apos;s Specially Designated Nationals (SDN) list</li>
              <li>Listed on the EU Consolidated Sanctions list</li>
              <li>Listed on the UN Security Council Sanctions list</li>
              <li>Located in or nationals of comprehensively sanctioned jurisdictions</li>
              <li>Acting on behalf of sanctioned persons or entities</li>
            </ul>
            <div className="bg-red-950/20 border border-red-900/30 rounded-lg p-4 mt-4">
              <p className="text-sm text-red-400 font-medium mb-1">Restricted Jurisdictions</p>
              <p className="text-xs text-[#a1887f]">Services are not available in jurisdictions subject to comprehensive U.S. sanctions, including but not limited to: Cuba, Iran, North Korea, Syria, and the Crimea/Donetsk/Luhansk regions. This list is subject to change based on regulatory updates.</p>
            </div>
          </Section>

          <Section title="5. Transaction Monitoring">
            <p>FTH Trading monitors all financial activity for suspicious patterns, including:</p>
            <ul className="list-disc list-inside space-y-1 mt-3">
              <li>Frequent evaluation fee payments followed by immediate withdrawal requests</li>
              <li>Payments from third parties or jurisdictions inconsistent with the participant&apos;s profile</li>
              <li>Unusual payout frequency or structuring patterns</li>
              <li>Trading activity designed to generate artificial or fraudulent profits</li>
              <li>Multiple accounts registered with similar or overlapping identities</li>
            </ul>
          </Section>

          <Section title="6. Suspicious Activity Reporting">
            <p>
              FTH Trading will report suspicious activity to the appropriate Financial Intelligence Unit (FIU) or regulatory authority
              as required by applicable law. We are not permitted to inform the subject of a suspicious activity report.
            </p>
            <p className="mt-3">
              Accounts may be frozen pending investigation. FTH Trading is not liable for any losses, delays, or inconvenience
              resulting from compliance-related account actions.
            </p>
          </Section>

          <Section title="7. Record Keeping">
            <p>FTH Trading maintains records of:</p>
            <ul className="list-disc list-inside space-y-1 mt-3">
              <li>KYC documentation for a minimum of 5 years after the relationship ends</li>
              <li>All financial transactions (payments, payouts, treasury entries) indefinitely</li>
              <li>Immutable audit logs of all account actions, risk events, and compliance decisions</li>
              <li>Communication records related to compliance reviews and disputes</li>
            </ul>
          </Section>

          <Section title="8. Staff Training & Governance">
            <p>
              All FTH Trading personnel involved in compliance, onboarding, and risk management receive regular AML/CFT training.
              The compliance function operates independently from trading operations to ensure objective decision-making.
            </p>
          </Section>

          <Section title="9. Cooperation With Authorities">
            <p>
              FTH Trading cooperates fully with law enforcement, regulatory agencies, and judicial authorities when presented with
              lawful requests for information. We will comply with court orders, subpoenas, and regulatory inquiries as required by law.
            </p>
          </Section>

          <Section title="10. Contact">
            <p>For compliance-related inquiries, document submissions, or to report suspicious activity:</p>
            <div className="bg-white/[0.03] border border-white/5 rounded-lg p-4 mt-3">
              <p className="text-sm"><strong className="text-amber-500">Email:</strong> compliance@fthtrading.com</p>
              <p className="text-sm mt-1"><strong className="text-amber-500">Subject:</strong> [COMPLIANCE] — Your Name — Account Number</p>
              <p className="text-xs text-[#6d4c41] mt-2">All compliance communications are treated as confidential.</p>
            </div>
          </Section>

        </div>

        {/* LEGAL FOOTER LINKS */}
        <div className="border-t border-white/5 mt-16 pt-8 flex flex-wrap gap-4 justify-center text-xs text-[#6d4c41]">
          <Link href="/prop-sharing/rulebook" className="hover:text-amber-500 transition-colors">Challenge Rulebook</Link>
          <span>·</span>
          <Link href="/prop-sharing/risk-disclosure" className="hover:text-amber-500 transition-colors">Risk Disclosure</Link>
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
        <Shield size={16} className="text-amber-600" />
        {title}
      </h2>
      <div className="text-sm text-[#a1887f] leading-relaxed pl-6">{children}</div>
    </section>
  )
}

function KycItem({ icon, label, desc }: { icon: React.ReactNode; label: string; desc: string }) {
  return (
    <div className="bg-white/[0.02] border border-white/5 rounded-lg p-3">
      <p className="text-sm font-medium text-[#efebe9] flex items-center gap-2">{icon}<span>{label}</span></p>
      <p className="text-xs text-[#6d4c41] mt-1 pl-5">{desc}</p>
    </div>
  )
}
