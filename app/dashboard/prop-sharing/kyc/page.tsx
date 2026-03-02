'use client'

import { useEffect, useState } from 'react'
import { Shield, Search, CheckCircle, XCircle, Clock, AlertTriangle, Eye, RefreshCw } from 'lucide-react'

interface KycRecord {
  kyc_id: string
  account_id: string
  account_number?: string
  trader_name?: string
  account_status?: string
  full_legal_name: string
  email: string
  date_of_birth?: string
  nationality?: string
  country_of_residence?: string
  government_id_type?: string
  government_id_number?: string
  city?: string
  state_province?: string
  status: string
  submitted_at: string
  reviewed_at?: string
  reviewed_by?: string
  identity_verified?: boolean
  sanctions_check_passed?: boolean
  pep_check_passed?: boolean
  rejection_reason?: string
}

interface KycSummary {
  pending: number
  under_review: number
  approved: number
  rejected: number
  expired: number
  total: number
}

const statusColors: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  under_review: 'bg-blue-100 text-blue-800',
  approved: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-800',
  expired: 'bg-gray-100 text-gray-800',
}

const statusIcons: Record<string, any> = {
  pending: Clock,
  under_review: Eye,
  approved: CheckCircle,
  rejected: XCircle,
  expired: AlertTriangle,
}

export default function KycPage() {
  const [records, setRecords] = useState<KycRecord[]>([])
  const [summary, setSummary] = useState<KycSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('')
  const [search, setSearch] = useState('')
  const [selectedRecord, setSelectedRecord] = useState<KycRecord | null>(null)
  const [reviewAction, setReviewAction] = useState({ status: '', reviewer: 'admin', rejection_reason: '' })

  async function fetchData() {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (filter) params.set('status', filter)
      if (search) params.set('search', search)
      const res = await fetch(`/api/prop-sharing/kyc?${params}`)
      const data = await res.json()
      setRecords(data.records || [])
      setSummary(data.summary || null)
    } catch (e) {
      console.error(e)
    }
    setLoading(false)
  }

  useEffect(() => { fetchData() }, [filter])

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    fetchData()
  }

  async function handleReview() {
    if (!selectedRecord || !reviewAction.status) return
    try {
      await fetch('/api/prop-sharing/kyc', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          kyc_id: selectedRecord.kyc_id,
          ...reviewAction,
          identity_verified: reviewAction.status === 'approved',
          sanctions_check_passed: reviewAction.status === 'approved',
          pep_check_passed: reviewAction.status === 'approved',
        }),
      })
      setSelectedRecord(null)
      setReviewAction({ status: '', reviewer: 'admin', rejection_reason: '' })
      fetchData()
    } catch (e) {
      console.error(e)
    }
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Shield className="w-6 h-6 text-amber-700" /> Trader KYC / Compliance
          </h1>
          <p className="text-gray-500 mt-1">Identity verification &amp; compliance review pipeline</p>
        </div>
        <button onClick={fetchData} className="p-2 bg-gray-100 rounded-lg hover:bg-gray-200"><RefreshCw className="w-4 h-4" /></button>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
          {(['pending', 'under_review', 'approved', 'rejected', 'expired'] as const).map(s => {
            const Icon = statusIcons[s]
            return (
              <button key={s} onClick={() => setFilter(filter === s ? '' : s)}
                className={`bg-white rounded-xl border p-4 text-left transition ${filter === s ? 'ring-2 ring-amber-500' : ''}`}>
                <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
                  <Icon className="w-4 h-4" /> {s.replace('_', ' ')}
                </div>
                <div className="text-2xl font-bold text-gray-800">{summary[s]}</div>
              </button>
            )
          })}
        </div>
      )}

      {/* Search */}
      <form onSubmit={handleSearch} className="flex gap-3 mb-6">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
          <input type="text" value={search} onChange={e => setSearch(e.target.value)} 
            placeholder="Search by name or email..." 
            className="w-full pl-10 pr-4 py-2 border rounded-lg" />
        </div>
        <button type="submit" className="px-4 py-2 bg-amber-700 text-white rounded-lg hover:bg-amber-800">Search</button>
      </form>

      {/* Review Modal */}
      {selectedRecord && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold mb-4">KYC Review: {selectedRecord.full_legal_name}</h3>

            <div className="grid grid-cols-2 gap-4 mb-6 text-sm">
              <div><span className="text-gray-500">Email:</span> <span className="font-medium">{selectedRecord.email}</span></div>
              <div><span className="text-gray-500">Account:</span> <span className="font-medium">{selectedRecord.account_number || 'N/A'}</span></div>
              <div><span className="text-gray-500">Nationality:</span> <span className="font-medium">{selectedRecord.nationality || 'N/A'}</span></div>
              <div><span className="text-gray-500">Country:</span> <span className="font-medium">{selectedRecord.country_of_residence || 'N/A'}</span></div>
              <div><span className="text-gray-500">DOB:</span> <span className="font-medium">{selectedRecord.date_of_birth || 'N/A'}</span></div>
              <div><span className="text-gray-500">ID Type:</span> <span className="font-medium">{selectedRecord.government_id_type || 'N/A'}</span></div>
              <div><span className="text-gray-500">ID Number:</span> <span className="font-medium">{selectedRecord.government_id_number ? '***' + selectedRecord.government_id_number.slice(-4) : 'N/A'}</span></div>
              <div><span className="text-gray-500">City:</span> <span className="font-medium">{selectedRecord.city || 'N/A'}, {selectedRecord.state_province || ''}</span></div>
              <div><span className="text-gray-500">Submitted:</span> <span className="font-medium">{new Date(selectedRecord.submitted_at).toLocaleDateString()}</span></div>
              <div><span className="text-gray-500">Status:</span> <span className={`text-xs px-2 py-1 rounded-full ${statusColors[selectedRecord.status]}`}>{selectedRecord.status}</span></div>
            </div>

            <div className="border-t pt-4">
              <h4 className="font-semibold mb-3">Review Decision</h4>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <button onClick={() => setReviewAction({ ...reviewAction, status: 'approved' })}
                  className={`p-3 rounded-lg border text-center ${reviewAction.status === 'approved' ? 'bg-green-100 border-green-500' : ''}`}>
                  <CheckCircle className="w-5 h-5 mx-auto mb-1 text-green-600" /> Approve
                </button>
                <button onClick={() => setReviewAction({ ...reviewAction, status: 'rejected' })}
                  className={`p-3 rounded-lg border text-center ${reviewAction.status === 'rejected' ? 'bg-red-100 border-red-500' : ''}`}>
                  <XCircle className="w-5 h-5 mx-auto mb-1 text-red-600" /> Reject
                </button>
              </div>
              {reviewAction.status === 'rejected' && (
                <textarea value={reviewAction.rejection_reason} onChange={e => setReviewAction({ ...reviewAction, rejection_reason: e.target.value })}
                  placeholder="Rejection reason (required)..." className="w-full border rounded-lg p-3 mb-4" rows={3} />
              )}
              <div className="flex gap-3">
                <button onClick={handleReview} disabled={!reviewAction.status}
                  className="px-6 py-2 bg-amber-700 text-white rounded-lg hover:bg-amber-800 disabled:opacity-50">
                  Submit Review
                </button>
                <button onClick={() => { setSelectedRecord(null); setReviewAction({ status: '', reviewer: 'admin', rejection_reason: '' }) }}
                  className="px-6 py-2 bg-gray-100 rounded-lg hover:bg-gray-200">Cancel</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Records Table */}
      <div className="bg-white rounded-xl border overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left p-3 text-xs font-semibold text-gray-500 uppercase">Trader</th>
              <th className="text-left p-3 text-xs font-semibold text-gray-500 uppercase">Account</th>
              <th className="text-left p-3 text-xs font-semibold text-gray-500 uppercase">Country</th>
              <th className="text-left p-3 text-xs font-semibold text-gray-500 uppercase">Status</th>
              <th className="text-left p-3 text-xs font-semibold text-gray-500 uppercase">Checks</th>
              <th className="text-left p-3 text-xs font-semibold text-gray-500 uppercase">Submitted</th>
              <th className="text-left p-3 text-xs font-semibold text-gray-500 uppercase">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {loading ? (
              <tr><td colSpan={7} className="p-8 text-center text-gray-400">Loading...</td></tr>
            ) : records.length === 0 ? (
              <tr><td colSpan={7} className="p-8 text-center text-gray-400">No KYC records found</td></tr>
            ) : records.map(r => (
              <tr key={r.kyc_id} className="hover:bg-gray-50">
                <td className="p-3">
                  <div className="font-medium text-sm">{r.full_legal_name}</div>
                  <div className="text-xs text-gray-500">{r.email}</div>
                </td>
                <td className="p-3 text-sm text-gray-600">{r.account_number || '—'}</td>
                <td className="p-3 text-sm text-gray-600">{r.country_of_residence || '—'}</td>
                <td className="p-3">
                  <span className={`text-xs px-2 py-1 rounded-full ${statusColors[r.status]}`}>{r.status.replace('_', ' ')}</span>
                </td>
                <td className="p-3">
                  <div className="flex gap-1">
                    <span title="Identity" className={`w-5 h-5 rounded-full flex items-center justify-center text-xs ${r.identity_verified ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-400'}`}>ID</span>
                    <span title="Sanctions" className={`w-5 h-5 rounded-full flex items-center justify-center text-xs ${r.sanctions_check_passed ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-400'}`}>S</span>
                    <span title="PEP" className={`w-5 h-5 rounded-full flex items-center justify-center text-xs ${r.pep_check_passed ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-400'}`}>P</span>
                  </div>
                </td>
                <td className="p-3 text-sm text-gray-500">{new Date(r.submitted_at).toLocaleDateString()}</td>
                <td className="p-3">
                  <button onClick={() => setSelectedRecord(r)} className="text-sm text-amber-700 hover:text-amber-800 font-medium">
                    Review
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
