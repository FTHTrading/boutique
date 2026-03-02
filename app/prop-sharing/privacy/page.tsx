import Link from 'next/link'
import { Globe, ArrowLeft, Lock, Shield } from 'lucide-react'

export default function PrivacyPage() {
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
          <div className="w-10 h-10 rounded-xl bg-amber-900/40 flex items-center justify-center"><Lock size={20} className="text-amber-500" /></div>
          <div>
            <p className="text-xs font-semibold tracking-widest uppercase text-amber-600">Data Protection</p>
            <h1 className="text-3xl md:text-4xl font-bold">Privacy Policy</h1>
          </div>
        </div>
        <p className="text-[#6d4c41] mb-12 text-sm">Effective: March 2026. This policy describes how FTH Trading collects, uses, and protects your personal data.</p>

        <div className="space-y-10">

          <Section num="1" title="Data Controller">
            <p>
              FTH Trading is the data controller responsible for your personal data collected through the Prop Challenge platform,
              website, and related services. For data protection inquiries, contact: <span className="text-amber-500">privacy@fthtrading.com</span>
            </p>
          </Section>

          <Section num="2" title="Data We Collect">
            <p className="mb-3">We collect the following categories of personal data:</p>

            <h4 className="font-medium text-[#efebe9] text-sm mb-2">Identity Data</h4>
            <ul className="list-disc list-inside space-y-1 mb-4">
              <li>Full legal name, date of birth, nationality</li>
              <li>Government-issued ID details (type, number — stored encrypted)</li>
              <li>Photographs from identity documents</li>
            </ul>

            <h4 className="font-medium text-[#efebe9] text-sm mb-2">Contact Data</h4>
            <ul className="list-disc list-inside space-y-1 mb-4">
              <li>Email address, phone number</li>
              <li>Residential address, country of residence</li>
            </ul>

            <h4 className="font-medium text-[#efebe9] text-sm mb-2">Financial Data</h4>
            <ul className="list-disc list-inside space-y-1 mb-4">
              <li>Payment method details (processed by third-party payment processors — we do not store card numbers)</li>
              <li>Payout information (bank account, payment method preferences)</li>
              <li>Transaction history (evaluation fees, payouts)</li>
            </ul>

            <h4 className="font-medium text-[#efebe9] text-sm mb-2">Trading Data</h4>
            <ul className="list-disc list-inside space-y-1 mb-4">
              <li>Trade history (entries, exits, instruments, lot sizes, P&L)</li>
              <li>Account performance metrics and behavioral analytics</li>
              <li>Risk events and compliance actions</li>
            </ul>

            <h4 className="font-medium text-[#efebe9] text-sm mb-2">Technical Data</h4>
            <ul className="list-disc list-inside space-y-1">
              <li>IP address, browser type, device information</li>
              <li>Login timestamps, session duration</li>
              <li>UTM parameters and referral source</li>
            </ul>
          </Section>

          <Section num="3" title="How We Use Your Data">
            <div className="overflow-x-auto mt-2">
              <table className="w-full text-sm">
                <thead><tr className="border-b border-white/10 text-left text-[#6d4c41]">
                  <th className="pb-2 pr-4">Purpose</th><th className="pb-2 pr-4">Legal Basis</th><th className="pb-2">Data Used</th>
                </tr></thead>
                <tbody className="text-[#a1887f]">
                  <tr className="border-b border-white/5"><td className="py-2 pr-4">Process your application</td><td className="py-2 pr-4">Contract</td><td className="py-2">Identity, Contact</td></tr>
                  <tr className="border-b border-white/5"><td className="py-2 pr-4">KYC / AML verification</td><td className="py-2 pr-4">Legal obligation</td><td className="py-2">Identity, Financial</td></tr>
                  <tr className="border-b border-white/5"><td className="py-2 pr-4">Operate evaluation accounts</td><td className="py-2 pr-4">Contract</td><td className="py-2">Trading, Technical</td></tr>
                  <tr className="border-b border-white/5"><td className="py-2 pr-4">Process payouts</td><td className="py-2 pr-4">Contract</td><td className="py-2">Identity, Financial</td></tr>
                  <tr className="border-b border-white/5"><td className="py-2 pr-4">Fraud detection</td><td className="py-2 pr-4">Legitimate interest</td><td className="py-2">Trading, Technical</td></tr>
                  <tr className="border-b border-white/5"><td className="py-2 pr-4">Risk monitoring</td><td className="py-2 pr-4">Legitimate interest</td><td className="py-2">Trading</td></tr>
                  <tr className="border-b border-white/5"><td className="py-2 pr-4">Performance analytics</td><td className="py-2 pr-4">Legitimate interest</td><td className="py-2">Trading</td></tr>
                  <tr><td className="py-2 pr-4">Program communications</td><td className="py-2 pr-4">Consent</td><td className="py-2">Contact</td></tr>
                </tbody>
              </table>
            </div>
          </Section>

          <Section num="4" title="Data Sharing">
            <p>We share personal data only with:</p>
            <ul className="list-disc list-inside space-y-1 mt-3">
              <li><strong className="text-[#efebe9]">Payment Processors:</strong> To process evaluation fees and payouts</li>
              <li><strong className="text-[#efebe9]">KYC/AML Providers:</strong> For identity verification and sanctions screening</li>
              <li><strong className="text-[#efebe9]">Regulatory Authorities:</strong> When required by law (suspicious activity reports, tax reporting)</li>
              <li><strong className="text-[#efebe9]">Service Providers:</strong> Infrastructure, hosting, security (bound by data processing agreements)</li>
            </ul>
            <p className="mt-3">We do <strong className="text-[#efebe9]">not</strong> sell personal data. We do <strong className="text-[#efebe9]">not</strong> share data with advertisers or data brokers.</p>
          </Section>

          <Section num="5" title="Data Security">
            <ul className="list-disc list-inside space-y-1 mt-2">
              <li>All personal data is encrypted in transit (TLS 1.3) and at rest (AES-256)</li>
              <li>Government ID numbers are stored with field-level encryption</li>
              <li>Access to personal data is restricted to authorized personnel on a need-to-know basis</li>
              <li>All data access is logged to an immutable audit trail</li>
              <li>Regular security assessments and penetration testing</li>
              <li>Incident response procedures are in place for data breaches</li>
            </ul>
          </Section>

          <Section num="6" title="Data Retention">
            <ul className="list-disc list-inside space-y-1 mt-2">
              <li><strong className="text-[#efebe9]">KYC data:</strong> 5 years after the end of the business relationship (regulatory requirement)</li>
              <li><strong className="text-[#efebe9]">Transaction records:</strong> 7 years (financial record-keeping requirement)</li>
              <li><strong className="text-[#efebe9]">Trading data:</strong> Duration of active account + 3 years</li>
              <li><strong className="text-[#efebe9]">Audit logs:</strong> Retained indefinitely (immutable compliance records)</li>
              <li><strong className="text-[#efebe9]">Marketing data:</strong> Until consent is withdrawn</li>
            </ul>
            <p className="mt-3">After retention periods expire, data is securely deleted or irreversibly anonymized.</p>
          </Section>

          <Section num="7" title="Your Rights">
            <p className="mb-3">Depending on your jurisdiction, you may have the following rights:</p>
            <div className="grid sm:grid-cols-2 gap-3">
              {[
                { right: 'Access', desc: 'Request a copy of your personal data' },
                { right: 'Rectification', desc: 'Correct inaccurate or incomplete data' },
                { right: 'Erasure', desc: 'Request deletion (subject to legal retention requirements)' },
                { right: 'Portability', desc: 'Receive your data in a structured, machine-readable format' },
                { right: 'Restriction', desc: 'Restrict processing of your data in certain circumstances' },
                { right: 'Objection', desc: 'Object to processing based on legitimate interest' },
              ].map((item, i) => (
                <div key={i} className="bg-white/[0.02] border border-white/5 rounded-lg p-3">
                  <p className="text-sm font-medium text-amber-500">{item.right}</p>
                  <p className="text-xs text-[#6d4c41] mt-1">{item.desc}</p>
                </div>
              ))}
            </div>
            <p className="mt-3">To exercise your rights, email <span className="text-amber-500">privacy@fthtrading.com</span> with subject line &quot;[DATA REQUEST]&quot;. We will respond within 30 days.</p>
          </Section>

          <Section num="8" title="Cookies & Tracking">
            <ul className="list-disc list-inside space-y-1 mt-2">
              <li><strong className="text-[#efebe9]">Essential cookies:</strong> Required for platform functionality (session management, security)</li>
              <li><strong className="text-[#efebe9]">Analytics cookies:</strong> Used to improve our services (can be declined)</li>
              <li><strong className="text-[#efebe9]">UTM parameters:</strong> Captured at application time for marketing attribution</li>
              <li>We do not use third-party advertising cookies or tracking pixels</li>
            </ul>
          </Section>

          <Section num="9" title="International Transfers">
            <p>
              Your data may be processed in jurisdictions outside your country of residence. Where this occurs,
              we ensure appropriate safeguards are in place (standard contractual clauses, adequacy decisions, or equivalent protections).
            </p>
          </Section>

          <Section num="10" title="Children">
            <p>
              The Prop Challenge is not available to individuals under 18 years of age. We do not knowingly collect data from minors.
              If we discover that data has been collected from a minor, it will be promptly deleted.
            </p>
          </Section>

          <Section num="11" title="Changes to This Policy">
            <p>
              We may update this Privacy Policy from time to time. Material changes will be communicated via email to active participants
              and posted on this page with an updated effective date. Continued use of our services constitutes acceptance.
            </p>
          </Section>

          <Section num="12" title="Contact">
            <div className="bg-white/[0.03] border border-white/5 rounded-lg p-4 mt-2">
              <p className="text-sm"><strong className="text-amber-500">Data Protection Inquiries:</strong> privacy@fthtrading.com</p>
              <p className="text-sm mt-1"><strong className="text-amber-500">Compliance Inquiries:</strong> compliance@fthtrading.com</p>
              <p className="text-xs text-[#6d4c41] mt-3">If you are not satisfied with our response, you have the right to lodge a complaint with your local data protection authority.</p>
            </div>
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
          <Link href="/prop-sharing/terms" className="hover:text-amber-500 transition-colors">Terms of Service</Link>
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
