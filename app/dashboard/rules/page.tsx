'use client'

import { useState } from 'react'
import Link from 'next/link'
import { 
  Database,
  Plus,
  Edit2,
  Trash2,
  Globe,
  Package,
  AlertTriangle,
  CheckCircle,
  ExternalLink
} from 'lucide-react'

// Mock data - In production, fetch from API
const mockJurisdictions = [
  {
    id: 1,
    country: 'United States',
    country_code: 'US',
    sanctions_risk: 'low',
    sanctions_notes: 'OFAC screening required for all transactions. SDN List, Entity List, Denied Persons List.',
    aml_notes: 'Apply risk-based KYC/AML per FinCEN BSA guidance. CTR for cash >$10K. SAR for suspicious activity.',
    licensing_notes: 'Export license required for controlled items per EAR. ITAR for defense articles.',
    docs_required: ['Commercial Invoice', 'Packing List', 'Bill of Lading', 'Certificate of Origin'],
    source_urls: ['https://ofac.treasury.gov', 'https://www.bis.doc.gov'],
    last_reviewed_date: '2025-12-15',
    reviewed_by: 'Sarah Chen',
  },
  {
    id: 2,
    country: 'Russia',
    country_code: 'RU',
    sanctions_risk: 'critical',
    sanctions_notes: 'OFAC sanctions active. Executive Orders 14024, 14066, 14068. Transactions generally prohibited unless authorized by OFAC General/Specific License.',
    aml_notes: 'Enhanced due diligence required. High ML/TF risk per FATF. Beneficial ownership verification critical.',
    licensing_notes: 'Most exports prohibited. EAR restrictions on technology, software, dual-use items.',
    docs_required: ['Legal counsel review MANDATORY', 'OFAC license verification', 'End-use statement'],
    source_urls: ['https://ofac.treasury.gov/sanctions/programs/ukraine-eo13662', 'https://home.treasury.gov/policy-issues/financial-sanctions/sanctions-programs-and-country-information/russian-harmful-foreign-activities-sanctions'],
    last_reviewed_date: '2026-01-20',
    reviewed_by: 'Michael Rodriguez',
  },
  {
    id: 3,
    country: 'China',
    country_code: 'CN',
    sanctions_risk: 'medium',
    sanctions_notes: 'Targeted sanctions on specific entities (Entity List, Military End User List). NOT country-wide embargo. Screen all parties.',
    aml_notes: 'Standard AML protocols. CDD required. Monitor for structuring.',
    licensing_notes: 'Export controls apply to emerging/foundational tech per EAR Part 744. License required for CCL items.',
    docs_required: ['Commercial Invoice', 'Packing List', 'Bill of Lading', 'Export License (if applicable)'],
    source_urls: ['https://www.bis.doc.gov/index.php/policy-guidance/lists-of-parties-of-concern/entity-list', 'https://www.trade.gov/country-commercial-guides/china'],
    last_reviewed_date: '2026-01-10',
    reviewed_by: 'Sarah Chen',
  },
]

const mockCommodities = [
  {
    id: 1,
    name: 'Coffee',
    category: 'agricultural',
    hs_code: '0901.11',
    restricted: false,
    notes: 'Arabica and Robusta. Phytosanitary certificate required. USDA Organic cert if applicable.',
  },
  {
    id: 2,
    name: 'Gold',
    category: 'metals',
    hs_code: '7108.13',
    restricted: true,
    notes: 'LBMA Good Delivery. Enhanced AML/KYC mandatory. Source of funds verification. Export license may be required depending on jurisdiction.',
  },
  {
    id: 3,
    name: 'Crude Oil',
    category: 'energy',
    hs_code: '2709.00',
    restricted: true,
    notes: 'OFAC sanctions screening MANDATORY. Export authorization required from origin. Import authorization required at destination. Political risk insurance recommended.',
  },
]

export default function RulesPage() {
  const [jurisdictions, setJurisdictions] = useState(mockJurisdictions)
  const [commodities, setCommodities] = useState(mockCommodities)
  const [activeTab, setActiveTab] = useState<'jurisdictions' | 'commodities'>('jurisdictions')
  const [editingId, setEditingId] = useState<number | null>(null)

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-coffee-dark text-cream py-8">
        <div className="container mx-auto px-4">
          <Link href="/dashboard" className="text-sm hover:underline mb-2 inline-block">
            ← Back to Dashboard
          </Link>
          <div className="flex items-center gap-4">
            <Database className="w-10 h-10" />
            <div>
              <h1 className="text-4xl font-bold mb-2">Rules Library</h1>
              <p className="text-cream/80">Manage jurisdiction metadata and commodity classifications</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="container mx-auto px-4 pt-8">
        <div className="bg-white rounded-t-lg shadow-md">
          <div className="flex border-b border-gray-200">
            <button
              onClick={() => setActiveTab('jurisdictions')}
              className={`flex-1 px-6 py-4 font-semibold transition-colors flex items-center justify-center gap-2 ${
                activeTab === 'jurisdictions' 
                  ? 'bg-coffee-dark text-cream border-b-4 border-coffee-dark' 
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <Globe className="w-5 h-5" />
              Jurisdictions ({jurisdictions.length})
            </button>
            <button
              onClick={() => setActiveTab('commodities')}
              className={`flex-1 px-6 py-4 font-semibold transition-colors flex items-center justify-center gap-2 ${
                activeTab === 'commodities' 
                  ? 'bg-coffee-dark text-cream border-b-4 border-coffee-dark' 
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <Package className="w-5 h-5" />
              Commodities ({commodities.length})
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 pb-8">
        <div className="bg-white rounded-b-lg shadow-md p-6">
          {/* Disclaimer */}
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-amber-800">
                <strong>Metadata Library:</strong> This data is used for risk-based flagging only. It does not constitute legal advice or regulatory certification. All source URLs and last review dates tracked for defensibility. Quarterly review recommended.
              </div>
            </div>
          </div>

          {activeTab === 'jurisdictions' && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-coffee-dark">Jurisdiction Metadata</h2>
                <button className="bg-coffee-dark text-cream px-4 py-2 rounded-lg font-semibold hover:bg-coffee-medium transition-colors flex items-center gap-2">
                  <Plus className="w-4 h-4" />
                  Add Jurisdiction
                </button>
              </div>

              <div className="space-y-4">
                {jurisdictions.map((jurisdiction) => (
                  <div key={jurisdiction.id} className={`border rounded-lg p-6 ${getSanctionsRiskBorder(jurisdiction.sanctions_risk)}`}>
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-4">
                        <h3 className="text-xl font-bold text-coffee-dark">{jurisdiction.country}</h3>
                        <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-sm font-mono">
                          {jurisdiction.country_code}
                        </span>
                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${getSanctionsRiskStyle(jurisdiction.sanctions_risk)}`}>
                          {jurisdiction.sanctions_risk.toUpperCase()} RISK
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <button className="p-2 text-coffee-medium hover:bg-gray-100 rounded">
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button className="p-2 text-red-600 hover:bg-red-50 rounded">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-4 mb-4">
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-2">Sanctions Notes</h4>
                        <p className="text-sm text-gray-700 leading-relaxed">{jurisdiction.sanctions_notes}</p>
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-2">AML Notes</h4>
                        <p className="text-sm text-gray-700 leading-relaxed">{jurisdiction.aml_notes}</p>
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-2">Licensing Notes</h4>
                        <p className="text-sm text-gray-700 leading-relaxed">{jurisdiction.licensing_notes}</p>
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-2">Required Documents</h4>
                        <ul className="text-sm text-gray-700 space-y-1">
                          {jurisdiction.docs_required.map((doc, idx) => (
                            <li key={idx} className="flex items-center gap-2">
                              <CheckCircle className="w-3 h-3 text-green-600" />
                              {doc}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    <div className="border-t pt-4">
                      <div className="flex items-center justify-between text-xs text-gray-600">
                        <div className="flex items-center gap-4">
                          <div>
                            <span className="font-semibold">Last Reviewed:</span> {jurisdiction.last_reviewed_date}
                          </div>
                          <div>
                            <span className="font-semibold">Reviewed By:</span> {jurisdiction.reviewed_by}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {jurisdiction.source_urls.map((url, idx) => (
                            <a
                              key={idx}
                              href={url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-1 text-coffee-medium hover:underline"
                            >
                              Source {idx + 1}
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'commodities' && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-coffee-dark">Commodity Registry</h2>
                <button className="bg-coffee-dark text-cream px-4 py-2 rounded-lg font-semibold hover:bg-coffee-medium transition-colors flex items-center gap-2">
                  <Plus className="w-4 h-4" />
                  Add Commodity
                </button>
              </div>

              <div className="space-y-4">
                {commodities.map((commodity) => (
                  <div key={commodity.id} className={`border rounded-lg p-6 ${commodity.restricted ? 'border-amber-300 bg-amber-50' : 'border-gray-200'}`}>
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-4">
                        <h3 className="text-xl font-bold text-coffee-dark">{commodity.name}</h3>
                        <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-sm font-mono">
                          HS {commodity.hs_code}
                        </span>
                        <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${
                          commodity.category === 'agricultural' ? 'bg-green-100 text-green-800' :
                          commodity.category === 'metals' ? 'bg-blue-100 text-blue-800' :
                          'bg-purple-100 text-purple-800'
                        }`}>
                          {commodity.category}
                        </span>
                        {commodity.restricted && (
                          <span className="px-3 py-1 bg-amber-600 text-white rounded-full text-xs font-bold flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3" />
                            RESTRICTED
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <button className="p-2 text-coffee-medium hover:bg-gray-100 rounded">
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button className="p-2 text-red-600 hover:bg-red-50 rounded">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2">Compliance Notes</h4>
                      <p className="text-sm text-gray-700 leading-relaxed">{commodity.notes}</p>
                    </div>

                    {commodity.restricted && (
                      <div className="mt-4 p-3 bg-amber-100 border border-amber-300 rounded">
                        <p className="text-xs text-amber-900">
                          <strong>RESTRICTED FLAG:</strong> This commodity will trigger HIGH or CRITICAL compliance flags during deal screening. Enhanced due diligence, export license verification, and human review required.
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Export/Import Section */}
      <div className="container mx-auto px-4 pb-8">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="font-bold text-blue-900 mb-3">Sync with YAML Rules Library</h3>
          <p className="text-sm text-blue-800 mb-4">
            Jurisdiction and commodity data can be managed as YAML files in <code className="bg-blue-100 px-2 py-1 rounded">rules/jurisdictions/*.yaml</code> and synced to the database for versioning and audit trails.
          </p>
          <div className="flex gap-3">
            <button className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors">
              Import from YAML
            </button>
            <button className="bg-white text-blue-600 border border-blue-600 px-4 py-2 rounded-lg text-sm font-semibold hover:bg-blue-50 transition-colors">
              Export to YAML
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function getSanctionsRiskBorder(risk: string) {
  switch (risk) {
    case 'critical': return 'border-red-500 bg-red-50'
    case 'high': return 'border-orange-300 bg-orange-50'
    case 'medium': return 'border-yellow-300 bg-yellow-50'
    case 'low': return 'border-gray-200'
    default: return 'border-gray-200'
  }
}

function getSanctionsRiskStyle(risk: string) {
  switch (risk) {
    case 'critical': return 'bg-red-600 text-white'
    case 'high': return 'bg-orange-600 text-white'
    case 'medium': return 'bg-yellow-600 text-white'
    case 'low': return 'bg-green-600 text-white'
    default: return 'bg-gray-600 text-white'
  }
}
