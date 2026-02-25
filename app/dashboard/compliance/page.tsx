'use client'

import { useState } from 'react'
import Link from 'next/link'
import { 
  Shield, 
  AlertTriangle, 
  CheckCircle,
  XCircle,
  Filter,
  Search,
  FileText,
  User,
  Clock
} from 'lucide-react'

// Mock data - In production, fetch from API
const mockFlags = [
  {
    id: '1',
    deal_number: 'DEAL-2026-002',
    client_name: 'Global Metals Ltd',
    commodity: 'Gold',
    destination: 'United States',
    flag_type: 'AML',
    severity: 'CRITICAL',
    message: 'High-value transaction ($950,000 USD). Enhanced due diligence required.',
    recommendation: 'Obtain: (1) Enhanced KYC documentation, (2) Beneficial ownership disclosure (>25% owners), (3) Source of funds verification, (4) Source of wealth documentation. Retain for 5+ years.',
    requires_human_review: true,
    blocks_execution: true,
    resolved: false,
    created_at: '2026-02-23T10:30:00Z',
  },
  {
    id: '2',
    deal_number: 'DEAL-2026-002',
    client_name: 'Global Metals Ltd',
    commodity: 'Gold',
    destination: 'United States',
    flag_type: 'EXPORT_CONTROL',
    severity: 'CRITICAL',
    message: 'Commodity "Gold" flagged as restricted. Reason: Export controls may apply',
    recommendation: 'Verify: (1) Export control classification (ECCN/USML), (2) Export license requirements, (3) End-use/end-user restrictions. Consult export control counsel if uncertain.',
    requires_human_review: true,
    blocks_execution: true,
    resolved: false,
    created_at: '2026-02-23T10:30:00Z',
  },
  {
    id: '3',
    deal_number: 'DEAL-2026-001',
    client_name: 'Acme Coffee Corp',
    commodity: 'Coffee',
    destination: 'United States',
    flag_type: 'AML',
    severity: 'HIGH',
    message: 'High-value transaction ($320,000 USD). Enhanced due diligence required.',
    recommendation: 'Obtain: (1) Enhanced KYC documentation, (2) Beneficial ownership disclosure (>25% owners), (3) Source of funds verification, (4) Source of wealth documentation. Retain for 5+ years.',
    requires_human_review: true,
    blocks_execution: false,
    resolved: false,
    created_at: '2026-02-24T14:15:00Z',
  },
  {
    id: '4',
    deal_number: 'DEAL-2026-004',
    client_name: 'European Foods GmbH',
    commodity: 'Cocoa',
    destination: 'Germany',
    flag_type: 'DOCS',
    severity: 'MEDIUM',
    message: 'Required documentation for Germany / Cocoa trade.',
    recommendation: 'Prepare and retain: Commercial Invoice, Packing List, Bill of Lading, Phytosanitary Certificate, Certificate of Origin, ICCO (International Cocoa Organization) documentation. Verify authenticity. Retain for 5+ years per recordkeeping requirements.',
    requires_human_review: false,
    blocks_execution: false,
    resolved: true,
    resolved_by: 'Sarah Chen',
    resolved_at: '2026-02-24T16:00:00Z',
    resolution_notes: 'All required documents obtained and verified. Phytosanitary cert from Brazilian authority confirmed authentic.',
    created_at: '2026-02-24T10:00:00Z',
  },
]

export default function ComplianceDashboard() {
  const [flags, setFlags] = useState(mockFlags)
  const [filterSeverity, setFilterSeverity] = useState('all')
  const [filterResolved, setFilterResolved] = useState('pending')
  const [searchTerm, setSearchTerm] = useState('')
  const [resolvingFlag, setResolvingFlag] = useState<string | null>(null)
  const [resolutionForm, setResolutionForm] = useState({ resolvedBy: '', notes: '' })

  const filteredFlags = flags.filter(flag => {
    const matchesSearch = flag.deal_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         flag.client_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         flag.commodity.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesSeverity = filterSeverity === 'all' || flag.severity === filterSeverity
    const matchesResolved = filterResolved === 'all' || 
                           (filterResolved === 'pending' && !flag.resolved) ||
                           (filterResolved === 'resolved' && flag.resolved)
    return matchesSearch && matchesSeverity && matchesResolved
  })

  const criticalCount = flags.filter(f => f.severity === 'CRITICAL' && !f.resolved).length
  const highCount = flags.filter(f => f.severity === 'HIGH' && !f.resolved).length
  const pendingReviewCount = flags.filter(f => f.requires_human_review && !f.resolved).length

  const handleResolve = (flagId: string) => {
    if (!resolutionForm.resolvedBy || !resolutionForm.notes) {
      alert('Please enter your name and resolution notes')
      return
    }

    // In production: POST to /api/compliance/flags/:id/resolve
    setFlags(flags.map(f => 
      f.id === flagId 
        ? { 
            ...f, 
            resolved: true, 
            resolved_by: resolutionForm.resolvedBy,
            resolved_at: new Date().toISOString(),
            resolution_notes: resolutionForm.notes
          }
        : f
    ))
    
    setResolvingFlag(null)
    setResolutionForm({ resolvedBy: '', notes: '' })
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-coffee-dark text-cream py-8">
        <div className="container mx-auto px-4">
          <Link href="/dashboard" className="text-sm hover:underline mb-2 inline-block">
            ← Back to Dashboard
          </Link>
          <div className="flex items-center gap-4">
            <Shield className="w-10 h-10" />
            <div>
              <h1 className="text-4xl font-bold mb-2">Compliance Dashboard</h1>
              <p className="text-cream/80">Review and resolve compliance flags across all deals</p>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="container mx-auto px-4 py-8">
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <div className="bg-red-50 rounded-lg shadow-md p-6 border-l-4 border-red-600">
            <div className="flex items-center justify-between mb-2">
              <span className="text-red-800 text-sm font-semibold">CRITICAL Flags</span>
              <XCircle className="w-5 h-5 text-red-600" />
            </div>
            <div className="text-3xl font-bold text-red-800">{criticalCount}</div>
            <p className="text-xs text-red-700 mt-1">Blocks execution</p>
          </div>
          
          <div className="bg-amber-50 rounded-lg shadow-md p-6 border-l-4 border-amber-600">
            <div className="flex items-center justify-between mb-2">
              <span className="text-amber-800 text-sm font-semibold">HIGH Flags</span>
              <AlertTriangle className="w-5 h-5 text-amber-600" />
            </div>
            <div className="text-3xl font-bold text-amber-800">{highCount}</div>
            <p className="text-xs text-amber-700 mt-1">Requires approval</p>
          </div>
          
          <div className="bg-blue-50 rounded-lg shadow-md p-6 border-l-4 border-blue-600">
            <div className="flex items-center justify-between mb-2">
              <span className="text-blue-800 text-sm font-semibold">Pending Review</span>
              <FileText className="w-5 h-5 text-blue-600" />
            </div>
            <div className="text-3xl font-bold text-blue-800">{pendingReviewCount}</div>
            <p className="text-xs text-blue-700 mt-1">Requires human review</p>
          </div>
          
          <div className="bg-green-50 rounded-lg shadow-md p-6 border-l-4 border-green-600">
            <div className="flex items-center justify-between mb-2">
              <span className="text-green-800 text-sm font-semibold">Resolved</span>
              <CheckCircle className="w-5 h-5 text-green-600" />
            </div>
            <div className="text-3xl font-bold text-green-800">
              {flags.filter(f => f.resolved).length}
            </div>
            <p className="text-xs text-green-700 mt-1">Total resolved</p>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <div className="flex gap-4 flex-wrap">
            <div className="flex-1 min-w-[300px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search by deal, client, commodity..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-coffee-medium"
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Filter className="w-5 h-5 text-gray-600" />
              <select
                value={filterSeverity}
                onChange={(e) => setFilterSeverity(e.target.value)}
                className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-coffee-medium"
              >
                <option value="all">All Severity</option>
                <option value="CRITICAL">CRITICAL</option>
                <option value="HIGH">HIGH</option>
                <option value="MEDIUM">MEDIUM</option>
                <option value="LOW">LOW</option>
              </select>
            </div>

            <select
              value={filterResolved}
              onChange={(e) => setFilterResolved(e.target.value)}
              className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-coffee-medium"
            >
              <option value="pending">Pending Only</option>
              <option value="resolved">Resolved Only</option>
              <option value="all">All Flags</option>
            </select>
          </div>
        </div>

        {/* Flags List */}
        <div className="space-y-4">
          {filteredFlags.map((flag) => (
            <div 
              key={flag.id} 
              className={`bg-white rounded-lg shadow-md overflow-hidden ${
                flag.blocks_execution ? 'ring-2 ring-red-500' : ''
              }`}
            >
              {/* Flag Header */}
              <div className={`px-6 py-4 ${getSeverityBg(flag.severity)}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <span className={`px-4 py-2 rounded-full text-sm font-bold ${getSeverityStyle(flag.severity)}`}>
                      {flag.severity}
                    </span>
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getFlagTypeStyle(flag.flag_type)}`}>
                      {flag.flag_type}
                    </span>
                    {flag.blocks_execution && (
                      <span className="px-3 py-1 bg-red-600 text-white rounded-full text-xs font-bold flex items-center gap-1">
                        <XCircle className="w-3 h-3" />
                        BLOCKS EXECUTION
                      </span>
                    )}
                    {flag.resolved && (
                      <span className="px-3 py-1 bg-green-600 text-white rounded-full text-xs font-bold flex items-center gap-1">
                        <CheckCircle className="w-3 h-3" />
                        RESOLVED
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Clock className="w-4 h-4" />
                    {new Date(flag.created_at).toLocaleDateString()}
                  </div>
                </div>
              </div>

              {/* Flag Content */}
              <div className="px-6 py-6">
                <div className="grid md:grid-cols-2 gap-6 mb-6">
                  <div>
                    <h3 className="font-bold text-coffee-dark text-lg mb-2">Deal Information</h3>
                    <div className="space-y-1 text-sm">
                      <div><span className="text-gray-600">Deal:</span> <Link href={`/dashboard/deals/${flag.deal_number}`} className="font-semibold text-coffee-medium hover:underline">{flag.deal_number}</Link></div>
                      <div><span className="text-gray-600">Client:</span> <span className="font-medium">{flag.client_name}</span></div>
                      <div><span className="text-gray-600">Commodity:</span> {flag.commodity}</div>
                      <div><span className="text-gray-600">Destination:</span> {flag.destination}</div>
                    </div>
                  </div>

                  <div>
                    <h3 className="font-bold text-coffee-dark text-lg mb-2">Flag Details</h3>
                    <div className="space-y-2 text-sm">
                      <div>
                        <span className="text-gray-600">Requires Human Review:</span>{' '}
                        <span className={flag.requires_human_review ? 'text-red-600 font-semibold' : 'text-gray-700'}>
                          {flag.requires_human_review ? 'YES' : 'No'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mb-6">
                  <h4 className="font-semibold text-coffee-dark mb-2">Message</h4>
                  <p className="text-gray-700 text-sm leading-relaxed">{flag.message}</p>
                </div>

                <div className={`p-4 rounded-lg mb-6 ${flag.severity === 'CRITICAL' ? 'bg-red-50 border border-red-200' : 'bg-blue-50 border border-blue-200'}`}>
                  <h4 className="font-semibold text-gray-900 mb-2">Recommendation</h4>
                  <p className="text-sm text-gray-700 leading-relaxed">{flag.recommendation}</p>
                </div>

                {/* Resolution Section */}
                {flag.resolved ? (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <h4 className="font-semibold text-green-900 mb-2">Resolution</h4>
                        <div className="text-sm text-green-800 space-y-1 mb-3">
                          <div className="flex items-center gap-2">
                            <User className="w-4 h-4" />
                            <span><strong>Resolved by:</strong> {flag.resolved_by}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4" />
                            <span><strong>Resolved at:</strong> {flag.resolved_at && new Date(flag.resolved_at).toLocaleString()}</span>
                          </div>
                        </div>
                        <div className="bg-white border border-green-200 rounded p-3">
                          <p className="text-sm text-gray-700">{flag.resolution_notes}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div>
                    {resolvingFlag === flag.id ? (
                      <div className="border border-coffee-medium rounded-lg p-4 bg-gray-50">
                        <h4 className="font-semibold text-coffee-dark mb-4">Resolve this Flag</h4>
                        <div className="space-y-4">
                          <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                              Your Name *
                            </label>
                            <input
                              type="text"
                              value={resolutionForm.resolvedBy}
                              onChange={(e) => setResolutionForm({ ...resolutionForm, resolvedBy: e.target.value })}
                              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-coffee-medium"
                              placeholder="Sarah Chen"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                              Resolution Notes *
                            </label>
                            <textarea
                              value={resolutionForm.notes}
                              onChange={(e) => setResolutionForm({ ...resolutionForm, notes: e.target.value })}
                              rows={4}
                              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-coffee-medium"
                              placeholder="Describe the actions taken, documents reviewed, and justification for resolution..."
                            />
                          </div>
                          <div className="flex gap-3">
                            <button
                              onClick={() => handleResolve(flag.id)}
                              className="bg-green-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-green-700 transition-colors flex items-center gap-2"
                            >
                              <CheckCircle className="w-4 h-4" />
                              Mark as Resolved
                            </button>
                            <button
                              onClick={() => {
                                setResolvingFlag(null)
                                setResolutionForm({ resolvedBy: '', notes: '' })
                              }}
                              className="bg-gray-300 text-gray-700 px-6 py-2 rounded-lg font-semibold hover:bg-gray-400 transition-colors"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <button
                        onClick={() => setResolvingFlag(flag.id)}
                        className="bg-coffee-dark text-white px-6 py-3 rounded-lg font-semibold hover:bg-coffee-medium transition-colors flex items-center gap-2"
                      >
                        <FileText className="w-4 h-4" />
                        Resolve This Flag
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}

          {filteredFlags.length === 0 && (
            <div className="bg-white rounded-lg shadow-md p-12 text-center">
              <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-gray-900 mb-2">No Flags Found</h3>
              <p className="text-gray-600">
                {filterResolved === 'pending' 
                  ? 'All pending compliance flags have been resolved!' 
                  : 'No flags match your current filters.'}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function getSeverityBg(severity: string) {
  switch (severity) {
    case 'CRITICAL': return 'bg-red-50'
    case 'HIGH': return 'bg-amber-50'
    case 'MEDIUM': return 'bg-yellow-50'
    case 'LOW': return 'bg-blue-50'
    default: return 'bg-gray-50'
  }
}

function getSeverityStyle(severity: string) {
  switch (severity) {
    case 'CRITICAL': return 'bg-red-600 text-white'
    case 'HIGH': return 'bg-amber-600 text-white'
    case 'MEDIUM': return 'bg-yellow-600 text-white'
    case 'LOW': return 'bg-blue-600 text-white'
    default: return 'bg-gray-600 text-white'
  }
}

function getFlagTypeStyle(type: string) {
  const styles: Record<string, string> = {
    SANCTIONS: 'bg-red-100 text-red-800',
    EXPORT_CONTROL: 'bg-purple-100 text-purple-800',
    LICENSE: 'bg-indigo-100 text-indigo-800',
    AML: 'bg-orange-100 text-orange-800',
    DOCS: 'bg-blue-100 text-blue-800',
    INCOTERM: 'bg-teal-100 text-teal-800',
    VALUE: 'bg-green-100 text-green-800',
    COMMODITY: 'bg-pink-100 text-pink-800',
  }
  return styles[type] || 'bg-gray-100 text-gray-800'
}
