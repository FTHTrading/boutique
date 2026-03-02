'use client'

import { useEffect, useState } from 'react'
import { Users, Search, Filter, RefreshCw, CheckCircle, XCircle, Clock, CreditCard, DollarSign, TrendingUp } from 'lucide-react'

interface Application {
  application_id: string
  program_id: string
  program_name?: string
  program_capital?: number
  eval_fee?: number
  applicant_name: string
  applicant_email: string
  applicant_phone?: string
  trading_experience?: string
  preferred_markets?: string
  motivation?: string
  referral_source?: string
  status: string
  payment_amount?: number
  payment_confirmed?: boolean
  payment_reference?: string
  reviewed_by?: string
  reviewed_at?: string
  rejection_reason?: string
  resulting_account_id?: string
  applied_at: string
}

interface Pipeline {
  submitted: number
  payment_pending: number
  payment_confirmed: number
  under_review: number
  approved: number
  rejected: number
  waitlisted: number
  total: number
  total_revenue: number
}

const statusColors: Record<string, string> = {
  submitted: 'bg-blue-100 text-blue-800',
  payment_pending: 'bg-yellow-100 text-yellow-800',
  payment_confirmed: 'bg-cyan-100 text-cyan-800',
  under_review: 'bg-indigo-100 text-indigo-800',
  approved: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-800',
  waitlisted: 'bg-orange-100 text-orange-800',
}

export default function ApplicationsPage() {
  const [applications, setApplications] = useState<Application[]>([])
  const [pipeline, setPipeline] = useState<Pipeline | null>(null)
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('')
  const [search, setSearch] = useState('')
  const [selectedApp, setSelectedApp] = useState<Application | null>(null)
  const [reviewForm, setReviewForm] = useState({ status: '', reviewer: 'admin', rejection_reason: '', payment_confirmed: false, payment_reference: '' })

  async function fetchData() {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (filter) params.set('status', filter)
      if (search) params.set('search', search)
      const res = await fetch(`/api/prop-sharing/applications?${params}`)
      const data = await res.json()
      setApplications(data.applications || [])
      setPipeline(data.pipeline || null)
    } catch (e) {
      console.error(e)
    }
    setLoading(false)
  }

  useEffect(() => { fetchData() }, [filter])

  async function handleReview() {
    if (!selectedApp || !reviewForm.status) return
    try {
      await fetch('/api/prop-sharing/applications', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ application_id: selectedApp.application_id, ...reviewForm }),
      })
      setSelectedApp(null)
      setReviewForm({ status: '', reviewer: 'admin', rejection_reason: '', payment_confirmed: false, payment_reference: '' })
      fetchData()
    } catch (e) {
      console.error(e)
    }
  }

  const fmt = (n: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n)

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Users className="w-6 h-6 text-amber-700" /> Challenge Applications
          </h1>
          <p className="text-gray-500 mt-1">Public prop challenge application pipeline</p>
        </div>
        <button onClick={fetchData} className="p-2 bg-gray-100 rounded-lg hover:bg-gray-200"><RefreshCw className="w-4 h-4" /></button>
      </div>

      {/* Pipeline Funnel */}
      {pipeline && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            <div className="bg-white rounded-xl border p-4">
              <div className="text-sm text-gray-500 mb-1">Total Applicants</div>
              <div className="text-2xl font-bold text-gray-800">{pipeline.total}</div>
            </div>
            <div className="bg-white rounded-xl border p-4">
              <div className="text-sm text-gray-500 mb-1 flex items-center gap-1"><DollarSign className="w-3 h-3" /> Revenue</div>
              <div className="text-2xl font-bold text-emerald-700">{fmt(pipeline.total_revenue)}</div>
            </div>
            <div className="bg-white rounded-xl border p-4">
              <div className="text-sm text-gray-500 mb-1 flex items-center gap-1"><CheckCircle className="w-3 h-3" /> Approved</div>
              <div className="text-2xl font-bold text-green-700">{pipeline.approved}</div>
            </div>
            <div className="bg-white rounded-xl border p-4">
              <div className="text-sm text-gray-500 mb-1 flex items-center gap-1"><TrendingUp className="w-3 h-3" /> Conversion</div>
              <div className="text-2xl font-bold text-amber-700">{pipeline.total > 0 ? ((pipeline.approved / pipeline.total) * 100).toFixed(1) : 0}%</div>
            </div>
          </div>

          {/* Pipeline stages */}
          <div className="bg-white rounded-xl border p-4 mb-8">
            <div className="flex items-center gap-2 text-sm text-gray-500 mb-3">Pipeline Stages</div>
            <div className="flex gap-1 h-3 rounded-full overflow-hidden">
              {pipeline.submitted > 0 && <div className="bg-blue-400" style={{ flex: pipeline.submitted }} title={`Submitted: ${pipeline.submitted}`} />}
              {pipeline.payment_pending > 0 && <div className="bg-yellow-400" style={{ flex: pipeline.payment_pending }} title={`Payment Pending: ${pipeline.payment_pending}`} />}
              {pipeline.payment_confirmed > 0 && <div className="bg-cyan-400" style={{ flex: pipeline.payment_confirmed }} title={`Payment Confirmed: ${pipeline.payment_confirmed}`} />}
              {pipeline.under_review > 0 && <div className="bg-indigo-400" style={{ flex: pipeline.under_review }} title={`Under Review: ${pipeline.under_review}`} />}
              {pipeline.approved > 0 && <div className="bg-green-400" style={{ flex: pipeline.approved }} title={`Approved: ${pipeline.approved}`} />}
              {pipeline.rejected > 0 && <div className="bg-red-400" style={{ flex: pipeline.rejected }} title={`Rejected: ${pipeline.rejected}`} />}
              {pipeline.waitlisted > 0 && <div className="bg-orange-400" style={{ flex: pipeline.waitlisted }} title={`Waitlisted: ${pipeline.waitlisted}`} />}
            </div>
            <div className="flex flex-wrap gap-4 mt-3 text-xs">
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-400" /> Submitted ({pipeline.submitted})</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-yellow-400" /> Payment Pending ({pipeline.payment_pending})</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-cyan-400" /> Confirmed ({pipeline.payment_confirmed})</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-indigo-400" /> Review ({pipeline.under_review})</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-400" /> Approved ({pipeline.approved})</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-400" /> Rejected ({pipeline.rejected})</span>
            </div>
          </div>
        </>
      )}

      {/* Search & Filter */}
      <div className="flex gap-3 mb-6">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
          <input type="text" value={search} onChange={e => setSearch(e.target.value)} onKeyDown={e => e.key === 'Enter' && fetchData()}
            placeholder="Search by name or email..." className="w-full pl-10 pr-4 py-2 border rounded-lg" />
        </div>
        <select value={filter} onChange={e => setFilter(e.target.value)} className="border rounded-lg px-3 py-2 text-sm">
          <option value="">All Statuses</option>
          {Object.keys(statusColors).map(s => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
        </select>
      </div>

      {/* Review Modal */}
      {selectedApp && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold mb-4">Review: {selectedApp.applicant_name}</h3>

            <div className="grid grid-cols-2 gap-3 mb-6 text-sm">
              <div><span className="text-gray-500">Email:</span> <span className="font-medium">{selectedApp.applicant_email}</span></div>
              <div><span className="text-gray-500">Phone:</span> <span className="font-medium">{selectedApp.applicant_phone || 'N/A'}</span></div>
              <div><span className="text-gray-500">Program:</span> <span className="font-medium">{selectedApp.program_name}</span></div>
              <div><span className="text-gray-500">Capital:</span> <span className="font-medium">{selectedApp.program_capital ? fmt(selectedApp.program_capital) : 'N/A'}</span></div>
              <div><span className="text-gray-500">Eval Fee:</span> <span className="font-medium">{selectedApp.eval_fee ? fmt(selectedApp.eval_fee) : 'N/A'}</span></div>
              <div><span className="text-gray-500">Experience:</span> <span className="font-medium">{selectedApp.trading_experience || 'N/A'}</span></div>
              <div className="col-span-2"><span className="text-gray-500">Markets:</span> <span className="font-medium">{selectedApp.preferred_markets || 'N/A'}</span></div>
              <div className="col-span-2"><span className="text-gray-500">Motivation:</span> <span className="font-medium">{selectedApp.motivation || 'N/A'}</span></div>
              <div><span className="text-gray-500">Referral:</span> <span className="font-medium">{selectedApp.referral_source || 'N/A'}</span></div>
              <div><span className="text-gray-500">Applied:</span> <span className="font-medium">{new Date(selectedApp.applied_at).toLocaleDateString()}</span></div>
            </div>

            <div className="border-t pt-4">
              <h4 className="font-semibold mb-3">Payment & Decision</h4>
              <div className="flex items-center gap-4 mb-4">
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={reviewForm.payment_confirmed} onChange={e => setReviewForm({ ...reviewForm, payment_confirmed: e.target.checked })}
                    className="rounded" />
                  Payment Confirmed
                </label>
                <input type="text" value={reviewForm.payment_reference} onChange={e => setReviewForm({ ...reviewForm, payment_reference: e.target.value })}
                  placeholder="Payment reference..." className="border rounded-lg p-2 text-sm flex-1" />
              </div>

              <div className="grid grid-cols-3 gap-3 mb-4">
                <button onClick={() => setReviewForm({ ...reviewForm, status: 'approved' })}
                  className={`p-3 rounded-lg border text-center text-sm ${reviewForm.status === 'approved' ? 'bg-green-100 border-green-500' : ''}`}>
                  <CheckCircle className="w-5 h-5 mx-auto mb-1 text-green-600" /> Approve
                </button>
                <button onClick={() => setReviewForm({ ...reviewForm, status: 'rejected' })}
                  className={`p-3 rounded-lg border text-center text-sm ${reviewForm.status === 'rejected' ? 'bg-red-100 border-red-500' : ''}`}>
                  <XCircle className="w-5 h-5 mx-auto mb-1 text-red-600" /> Reject
                </button>
                <button onClick={() => setReviewForm({ ...reviewForm, status: 'waitlisted' })}
                  className={`p-3 rounded-lg border text-center text-sm ${reviewForm.status === 'waitlisted' ? 'bg-orange-100 border-orange-500' : ''}`}>
                  <Clock className="w-5 h-5 mx-auto mb-1 text-orange-600" /> Waitlist
                </button>
              </div>

              {reviewForm.status === 'rejected' && (
                <textarea value={reviewForm.rejection_reason} onChange={e => setReviewForm({ ...reviewForm, rejection_reason: e.target.value })}
                  placeholder="Rejection reason..." className="w-full border rounded-lg p-3 mb-4" rows={3} />
              )}

              <div className="flex gap-3">
                <button onClick={handleReview} disabled={!reviewForm.status}
                  className="px-6 py-2 bg-amber-700 text-white rounded-lg hover:bg-amber-800 disabled:opacity-50">Submit Decision</button>
                <button onClick={() => { setSelectedApp(null); setReviewForm({ status: '', reviewer: 'admin', rejection_reason: '', payment_confirmed: false, payment_reference: '' }) }}
                  className="px-6 py-2 bg-gray-100 rounded-lg hover:bg-gray-200">Cancel</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Applications Table */}
      <div className="bg-white rounded-xl border overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left p-3 text-xs font-semibold text-gray-500 uppercase">Applicant</th>
              <th className="text-left p-3 text-xs font-semibold text-gray-500 uppercase">Program</th>
              <th className="text-left p-3 text-xs font-semibold text-gray-500 uppercase">Status</th>
              <th className="text-left p-3 text-xs font-semibold text-gray-500 uppercase">Payment</th>
              <th className="text-left p-3 text-xs font-semibold text-gray-500 uppercase">Applied</th>
              <th className="text-left p-3 text-xs font-semibold text-gray-500 uppercase">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {loading ? (
              <tr><td colSpan={6} className="p-8 text-center text-gray-400">Loading...</td></tr>
            ) : applications.length === 0 ? (
              <tr><td colSpan={6} className="p-8 text-center text-gray-400">No applications found</td></tr>
            ) : applications.map(app => (
              <tr key={app.application_id} className="hover:bg-gray-50">
                <td className="p-3">
                  <div className="font-medium text-sm">{app.applicant_name}</div>
                  <div className="text-xs text-gray-500">{app.applicant_email}</div>
                </td>
                <td className="p-3 text-sm text-gray-600">
                  {app.program_name || '—'}
                  {app.program_capital ? <span className="text-xs text-gray-400 ml-1">({fmt(app.program_capital)})</span> : null}
                </td>
                <td className="p-3">
                  <span className={`text-xs px-2 py-1 rounded-full ${statusColors[app.status] || 'bg-gray-100'}`}>{app.status.replace(/_/g, ' ')}</span>
                </td>
                <td className="p-3">
                  {app.payment_confirmed
                    ? <span className="flex items-center gap-1 text-xs text-green-700"><CreditCard className="w-3 h-3" /> Paid</span>
                    : <span className="text-xs text-gray-400">Pending</span>
                  }
                </td>
                <td className="p-3 text-sm text-gray-500">{new Date(app.applied_at).toLocaleDateString()}</td>
                <td className="p-3">
                  <button onClick={() => setSelectedApp(app)} className="text-sm text-amber-700 hover:text-amber-800 font-medium">Review</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
