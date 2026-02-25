import Link from 'next/link'
import { Shield, AlertTriangle, FileText, Eye, Database, Users } from 'lucide-react'

export default function CompliancePage() {
  return (
    <main className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-coffee-dark text-cream py-12">
        <div className="container mx-auto px-4">
          <Link href="/" className="text-sm hover:underline mb-4 inline-block">
            ← Back to Home
          </Link>
          <div className="flex items-center gap-4 mb-4">
            <Shield className="w-12 h-12" />
            <h1 className="text-5xl font-bold">Compliance Framework</h1>
          </div>
          <p className="text-xl text-cream/80 max-w-3xl">
            Risk-based compliance intelligence for global commodity transactions. We flag risks for human review — we do not certify legal compliance.
          </p>
        </div>
      </div>

      {/* Critical Disclaimer */}
      <div className="bg-red-50 border-t-4 border-red-600 py-8">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-start gap-4">
              <AlertTriangle className="w-8 h-8 text-red-600 flex-shrink-0 mt-1" />
              <div>
                <h2 className="text-2xl font-bold text-red-900 mb-3">Important Legal Disclaimer</h2>
                <div className="text-red-800 space-y-2 text-sm leading-relaxed">
                  <p>
                    <strong>This platform is a risk-flagging system, NOT a legal compliance certification tool.</strong>
                  </p>
                  <p>
                    The TradeComplianceAgent screens transactions for potential compliance risks based on programmatic rules and stored jurisdiction metadata. It generates flags that <strong>require human review by qualified compliance personnel and/or legal counsel</strong>.
                  </p>
                  <p>
                    <strong>This system does not:</strong>
                  </p>
                  <ul className="list-disc list-inside ml-4 space-y-1">
                    <li>Provide legal advice or regulatory interpretations</li>
                    <li>Certify compliance with any specific law or regulation</li>
                    <li>Replace the need for licensed attorneys or compliance professionals</li>
                    <li>Guarantee regulatory approval or transaction legality</li>
                  </ul>
                  <p className="font-bold">
                    All transactions are subject to final review and approval by FTH Trading's compliance team and may require additional legal counsel depending on complexity and jurisdiction.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Compliance Architecture */}
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-coffee-dark mb-8 text-center">
            How Our Compliance Intelligence Works
          </h2>

          <div className="grid md:grid-cols-2 gap-8 mb-12">
            {complianceFeatures.map((feature) => (
              <div key={feature.title} className="bg-white rounded-lg shadow-md p-6">
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-coffee-dark/5 rounded-lg">
                    {feature.icon}
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-coffee-dark mb-2">
                      {feature.title}
                    </h3>
                    <p className="text-gray-700 text-sm">
                      {feature.description}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Screening Workflow */}
          <div className="bg-white rounded-lg shadow-md p-8 mb-12">
            <h3 className="text-2xl font-bold text-coffee-dark mb-6">Screening Workflow</h3>
            <div className="space-y-4">
              {workflow.map((step, index) => (
                <div key={step.title} className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-8 h-8 bg-coffee-dark text-cream rounded-full flex items-center justify-center font-bold">
                    {index + 1}
                  </div>
                  <div>
                    <h4 className="font-bold text-coffee-dark mb-1">{step.title}</h4>
                    <p className="text-gray-700 text-sm">{step.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Flag Severity Levels */}
          <div className="bg-white rounded-lg shadow-md p-8 mb-12">
            <h3 className="text-2xl font-bold text-coffee-dark mb-6">Flag Severity Levels</h3>
            <div className="space-y-4">
              {severityLevels.map((level) => (
                <div key={level.severity} className={`border-l-4 ${level.borderColor} bg-gray-50 p-4`}>
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`px-3 py-1 ${level.bgColor} ${level.textColor} rounded-full text-sm font-bold`}>
                      {level.severity}
                    </span>
                    {level.blocks && (
                      <span className="text-xs text-red-600 font-semibold">BLOCKS EXECUTION</span>
                    )}
                  </div>
                  <p className="text-gray-700 text-sm">{level.description}</p>
                  <p className="text-gray-600 text-xs mt-2 italic">{level.example}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Regulatory Alignment */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-8 mb-12">
            <h3 className="text-2xl font-bold text-blue-900 mb-6">Regulatory Alignment</h3>
            <p className="text-blue-800 text-sm mb-4">
              Our compliance framework is aligned with international best practices and guidance from:
            </p>
            <ul className="space-y-2 text-blue-800 text-sm">
              <li className="flex items-start gap-2">
                <span className="text-blue-600 font-bold">•</span>
                <span><strong>OFAC (Office of Foreign Assets Control):</strong> Framework for Compliance Commitments — risk-based sanctions screening programs</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600 font-bold">•</span>
                <span><strong>FinCEN:</strong> Bank Secrecy Act / Anti-Money Laundering (AML) guidance on customer due diligence and suspicious activity reporting</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600 font-bold">•</span>
                <span><strong>BIS (Bureau of Industry and Security):</strong> Export Administration Regulations (EAR) for dual-use commodity controls</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600 font-bold">•</span>
                <span><strong>WCO (World Customs Organization):</strong> Harmonized System (HS) codes for commodity classification</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600 font-bold">•</span>
                <span><strong>ICC (International Chamber of Commerce):</strong> Incoterms® 2020 for trade term standardization</span>
              </li>
            </ul>
            <p className="text-xs text-blue-700 mt-4 italic">
              Alignment with these frameworks does not constitute certification or guarantee of compliance. All guidance subject to interpretation by licensed professionals.
            </p>
          </div>

          {/* Data Sources */}
          <div className="bg-white rounded-lg shadow-md p-8 mb-12">
            <h3 className="text-2xl font-bold text-coffee-dark mb-6">Jurisdiction Metadata Sources</h3>
            <p className="text-gray-700 text-sm mb-4">
              Our jurisdiction intelligence is compiled from publicly available sources and updated quarterly. All source URLs are tracked for defensibility.
            </p>
            <div className="grid md:grid-cols-2 gap-4 text-sm">
              <div>
                <h4 className="font-bold text-coffee-dark mb-2">Sanctions Lists</h4>
                <ul className="space-y-1 text-gray-600">
                  <li>• OFAC SDN List</li>
                  <li>• UN Security Council Sanctions</li>
                  <li>• EU Sanctions Map</li>
                  <li>• UK OFSI Sanctions List</li>
                </ul>
              </div>
              <div>
                <h4 className="font-bold text-coffee-dark mb-2">Export Controls</h4>
                <ul className="space-y-1 text-gray-600">
                  <li>• BIS Entity List</li>
                  <li>• DDTC ITAR Debarred List</li>
                  <li>• Wassenaar Arrangement</li>
                  <li>• Commerce Control List (CCL)</li>
                </ul>
              </div>
              <div>
                <h4 className="font-bold text-coffee-dark mb-2">Trade Documentation</h4>
                <ul className="space-y-1 text-gray-600">
                  <li>• Country-specific import/export regulations</li>
                  <li>• Certificate requirements by commodity</li>
                  <li>• Customs agency guidance</li>
                </ul>
              </div>
              <div>
                <h4 className="font-bold text-coffee-dark mb-2">AML Risk</h4>
                <ul className="space-y-1 text-gray-600">
                  <li>• FATF High-Risk Jurisdictions</li>
                  <li>• Basel AML Index</li>
                  <li>• Transparency International CPI</li>
                </ul>
              </div>
            </div>
            <p className="text-xs text-gray-600 mt-4 italic">
              Last comprehensive review: Q4 2025. Next scheduled review: Q1 2026.
            </p>
          </div>

          {/* Human Review Gates */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-8 mb-12">
            <h3 className="text-2xl font-bold text-green-900 mb-4">Human Review Gates</h3>
            <p className="text-green-800 text-sm mb-4">
              All flagged transactions require documented human review before proceeding:
            </p>
            <ul className="space-y-2 text-green-800 text-sm">
              <li className="flex items-start gap-2">
                <span className="text-green-600 font-bold">✓</span>
                <span><strong>CRITICAL flags:</strong> BLOCK execution until reviewed by compliance officer + legal counsel</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-600 font-bold">✓</span>
                <span><strong>HIGH flags:</strong> Require compliance officer approval with documented justification</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-600 font-bold">✓</span>
                <span><strong>MEDIUM flags:</strong> Require deal manager review and acknowledgment</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-600 font-bold">✓</span>
                <span><strong>LOW flags:</strong> Advisory only; system logs awareness</span>
              </li>
            </ul>
            <p className="text-xs text-green-700 mt-4 italic">
              All review actions logged to <code>compliance_actions</code> table with reviewer name, timestamp, and resolution notes.
            </p>
          </div>

          {/* Audit Trail */}
          <div className="bg-white rounded-lg shadow-md p-8">
            <h3 className="text-2xl font-bold text-coffee-dark mb-4">Audit Trail & Recordkeeping</h3>
            <p className="text-gray-700 text-sm mb-4">
              Every compliance action is logged and retained for regulatory defensibility:
            </p>
            <ul className="space-y-2 text-gray-700 text-sm">
              <li className="flex items-start gap-2">
                <FileText className="w-4 h-4 text-coffee-medium flex-shrink-0 mt-0.5" />
                <span><strong>Screening logs:</strong> All deal screenings with timestamp and flag details</span>
              </li>
              <li className="flex items-start gap-2">
                <FileText className="w-4 h-4 text-coffee-medium flex-shrink-0 mt-0.5" />
                <span><strong>Flag resolution:</strong> Who resolved, when, and with what justification</span>
              </li>
              <li className="flex items-start gap-2">
                <FileText className="w-4 h-4 text-coffee-medium flex-shrink-0 mt-0.5" />
                <span><strong>Jurisdiction metadata versioning:</strong> Source URLs and last review dates tracked</span>
              </li>
              <li className="flex items-start gap-2">
                <FileText className="w-4 h-4 text-coffee-medium flex-shrink-0 mt-0.5" />
                <span><strong>Retention:</strong> 7 years minimum (exceeds OFAC 5-year requirement)</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Final CTA */}
      <div className="bg-coffee-dark text-cream py-16">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">Questions About Our Compliance Framework?</h2>
          <p className="text-cream/80 mb-8 max-w-2xl mx-auto">
            For compliance-specific inquiries or to discuss complex jurisdictional requirements, contact our compliance team directly.
          </p>
          <Link
            href="/request-terms"
            className="bg-cream text-coffee-dark px-8 py-4 rounded-lg text-lg font-semibold hover:bg-cream/90 transition-colors inline-block"
          >
            Request Terms with Compliance Pre-Screening
          </Link>
        </div>
      </div>
    </main>
  )
}

const complianceFeatures = [
  {
    icon: <Shield className="w-8 h-8 text-coffee-medium" />,
    title: 'Risk-Based Flagging',
    description: 'Flags potential compliance issues based on sanctions risk, export controls, AML thresholds, and documentation requirements. Does not certify legality.',
  },
  {
    icon: <Eye className="w-8 h-8 text-coffee-medium" />,
    title: 'Human Review Gates',
    description: 'CRITICAL flags block execution. HIGH/MEDIUM flags require documented approval by qualified compliance personnel before proceeding.',
  },
  {
    icon: <Database className="w-8 h-8 text-coffee-medium" />,
    title: 'Jurisdiction Metadata',
    description: 'Stores country-specific sanctions risk, AML notes, licensing requirements, and documentation needs. Source-tracked for defensibility.',
  },
  {
    icon: <FileText className="w-8 h-8 text-coffee-medium" />,
    title: 'Audit Trail',
    description: 'Every screening, flag, review, and resolution logged with timestamp and responsible party. 7-year retention for regulatory compliance.',
  },
  {
    icon: <Users className="w-8 h-8 text-coffee-medium" />,
    title: 'Qualified Review',
    description: 'All flagged transactions reviewed by FTH Trading compliance team and, when necessary, external legal counsel licensed in relevant jurisdictions.',
  },
  {
    icon: <AlertTriangle className="w-8 h-8 text-coffee-medium" />,
    title: 'No Legal Certification',
    description: 'This system flags risks for review. It does not provide legal advice, regulatory interpretations, or certifications of compliance.',
  },
]

const workflow = [
  {
    title: 'Deal Submission',
    description: 'Client submits sourcing request via /request-terms form or direct engagement.',
  },
  {
    title: 'Automated Screening',
    description: 'TradeComplianceAgent screens deal for sanctions risk, AML thresholds, export controls, Incoterms obligations, and commodity restrictions.',
  },
  {
    title: 'Flag Generation',
    description: 'System generates flags with severity levels (LOW/MEDIUM/HIGH/CRITICAL) and recommendations for next steps.',
  },
  {
    title: 'Human Review',
    description: 'Flagged deals routed to compliance officer. CRITICAL flags require legal counsel involvement.',
  },
  {
    title: 'Resolution & Documentation',
    description: 'Compliance officer documents review, resolution, and approval/rejection with justification. Logged to compliance_actions table.',
  },
  {
    title: 'Execution or Hold',
    description: 'Cleared deals proceed to sourcing and structuring. Blocked deals held pending license, additional diligence, or alternative structuring.',
  },
]

const severityLevels = [
  {
    severity: 'CRITICAL',
    description: 'Transaction prohibited or extremely high risk. Blocks execution pending legal review and clearance. Requires documented approval from compliance officer + legal counsel.',
    example: 'Example: Destination is sanctioned jurisdiction (Russia, North Korea). Commodity export to Entity List party.',
    blocks: true,
    borderColor: 'border-red-600',
    bgColor: 'bg-red-100',
    textColor: 'text-red-800',
  },
  {
    severity: 'HIGH',
    description: 'Significant compliance concern. Requires enhanced due diligence, documentation, and compliance officer approval before proceeding.',
    example: 'Example: High-value transaction ($50K+) requiring enhanced KYC. Restricted commodity requiring export license verification.',
    blocks: false,
    borderColor: 'border-orange-600',
    bgColor: 'bg-orange-100',
    textColor: 'text-orange-800',
  },
  {
    severity: 'MEDIUM',
    description: 'Moderate compliance consideration. Requires deal manager review and documented acknowledgment of obligations.',
    example: 'Example: DDP Incoterm creating importer-of-record responsibilities. Medium sanctions-risk jurisdiction requiring standard screening.',
    blocks: false,
    borderColor: 'border-yellow-600',
    bgColor: 'bg-yellow-100',
    textColor: 'text-yellow-800',
  },
  {
    severity: 'LOW',
    description: 'Advisory flag for awareness. System logs but does not require formal approval. Best practices reminder.',
    example: 'Example: FOB/CIF Incoterms risk transfer point advisory. Transaction above $10K reporting threshold.',
    blocks: false,
    borderColor: 'border-blue-600',
    bgColor: 'bg-blue-100',
    textColor: 'text-blue-800',
  },
]
