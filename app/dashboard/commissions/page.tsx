'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import {
  DollarSign, TrendingUp, Clock, CheckCircle, AlertCircle,
  Plus, Download, Filter, RefreshCw, ChevronDown, Star
} from 'lucide-react'

interface Commission {
  commission_id: string
  deal_id: string | null
  member_id: string
  member_name: string
  member_email?: string
  member_role?: string
  deal_number: string | null
  client_name: string | null
  commodity: string | null
  commission_type: string
  deal_value_usd: number | null
  rate_pct: number | null
  commission_usd: number
  period_month: string | null
  status: string
  approved_by: string | null
  approved_at: string | null
  paid_at: string | null
  notes: string | null
  created_at: string
}

interface Summary {
  total_paid: number
  total_pending: number
  total_approved: number
  this_month: number
  ytd: number
  total_records: number
}

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  pending: { label: 'Pending', color: 'bg-amber-100 text-amber-700 border-amber-200', icon: Clock },
  approved: { label: 'Approved', color: 'bg-blue-100 text-blue-700 border-blue-200', icon: CheckCircle },
  paid: { label: 'Paid', color: 'bg-green-100 text-green-700 border-green-200', icon: CheckCircle },
  disputed: { label: 'Disputed', color: 'bg-red-100 text-red-600 border-red-200', icon: AlertCircle },
  cancelled: { label: 'Cancelled', color: 'bg-gray-100 text-gray-500 border-gray-200', icon: AlertCircle },
}

const TYPE_LABELS: Record<string, string> = {
  deal_close: 'Deal Close',
  referral: 'Referral',
  management_override: 'Management Override',
  bonus: 'Bonus',
  penalty: 'Penalty',
}

function fmt(n: number | string | null | undefined) {
  const v = parseFloat(n as any ?? '0')
  if (!v) return '$0'
  if (v >= 1_000_000) return `$${(v / 1_000_000).toFixed(2)}M`
  if (v >= 1_000) return `$${(v / 1_000).toFixed(2)}K`
  return `$${v.toFixed(2)}`
}

function SummaryCard({ label, value, color, icon: Icon }: { label: string; value: string; color: string; icon: React.ElementType }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-5 py-4">
      <div className={`inline-flex items-center justify-center w-9 h-9 ${color} rounded-xl mb-3`}>
        <Icon size={16} className="text-white" />
      </div>
      <p className="text-xl font-bold text-gray-900">{value}</p>
      <p className="text-xs text-gray-500 mt-0.5">{label}</p>
    </div>
  )
}

export default function CommissionsPage() {
  const [commissions, setCommissions] = useState<Commission[]>([])
  const [summary, setSummary] = useState<Summary | null>(null)
  const [loading, setLoading] = useState(true)
  const [filterStatus, setFilterStatus] = useState('all')
  const [filterMember, setFilterMember] = useState('')
  const [showAdd, setShowAdd] = useState(false)
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  const [newCommission, setNewCommission] = useState({
    member_name: '', deal_number: '', client_name: '', commodity: '',
    commission_type: 'deal_close', deal_value_usd: '', rate_pct: '', commission_usd: '',
    period_month: new Date().toISOString().slice(0, 7), notes: '',
  })

  const fetch_ = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams()
    if (filterStatus !== 'all') params.set('status', filterStatus)
    if (filterMember) params.set('member_name', filterMember)
    try {
      const res = await fetch(`/api/commissions?${params}`)
      const data = await res.json()
      setCommissions(data.commissions || [])
      setSummary(data.summary)
    } catch { /* offline */ }
    finally { setLoading(false) }
  }, [filterStatus, filterMember])

  useEffect(() => { fetch_() }, [fetch_])

  // Auto-calculate commission if rate + deal value provided
  useEffect(() => {
    const dv = parseFloat(newCommission.deal_value_usd)
    const rate = parseFloat(newCommission.rate_pct)
    if (dv > 0 && rate > 0) {
      setNewCommission(prev => ({ ...prev, commission_usd: ((dv * rate) / 100).toFixed(2) }))
    }
  }, [newCommission.deal_value_usd, newCommission.rate_pct])

  async function handleAdd() {
    if (!newCommission.member_name || !newCommission.commission_usd) return
    setActionLoading('add')
    try {
      await fetch('/api/commissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newCommission,
          deal_value_usd: newCommission.deal_value_usd ? parseFloat(newCommission.deal_value_usd) : null,
          rate_pct: newCommission.rate_pct ? parseFloat(newCommission.rate_pct) : null,
          commission_usd: parseFloat(newCommission.commission_usd),
        }),
      })
      setShowAdd(false)
      setNewCommission({ member_name: '', deal_number: '', client_name: '', commodity: '', commission_type: 'deal_close', deal_value_usd: '', rate_pct: '', commission_usd: '', period_month: new Date().toISOString().slice(0, 7), notes: '' })
      fetch_()
    } catch { /* ignore */ }
    finally { setActionLoading(null) }
  }

  async function updateStatus(id: string, status: string, extra?: Record<string, string>) {
    setActionLoading(id)
    try {
      await fetch('/api/commissions', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ commission_id: id, status, ...extra }),
      })
      fetch_()
    } catch { /* ignore */ }
    finally { setActionLoading(null) }
  }

  const members = Array.from(new Set(commissions.map(c => c.member_name))).filter(Boolean)

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-5">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <DollarSign size={18} className="text-amber-600" />
              <h1 className="text-lg font-bold text-gray-900">Commissions</h1>
            </div>
            <p className="text-sm text-gray-500">Track and manage all team commission earnings</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={fetch_}
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              title="Refresh"
            >
              <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
            </button>
            <button
              onClick={() => setShowAdd(!showAdd)}
              className="flex items-center gap-2 bg-amber-600 text-white rounded-xl px-4 py-2 text-sm font-medium hover:bg-amber-700 transition-colors"
            >
              <Plus size={15} /> Record Commission
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 md:px-6 py-6 space-y-6">

        {/* SUMMARY CARDS */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <SummaryCard label="Total Paid" value={fmt(summary?.total_paid)} color="bg-green-600" icon={CheckCircle} />
          <SummaryCard label="Pending" value={fmt(summary?.total_pending)} color="bg-amber-500" icon={Clock} />
          <SummaryCard label="Approved" value={fmt(summary?.total_approved)} color="bg-blue-600" icon={Star} />
          <SummaryCard label="This Month" value={fmt(summary?.this_month)} color="bg-purple-600" icon={TrendingUp} />
          <SummaryCard label="Year to Date" value={fmt(summary?.ytd)} color="bg-gray-700" icon={DollarSign} />
        </div>

        {/* ADD FORM */}
        {showAdd && (
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
            <h3 className="font-semibold text-gray-900 mb-4">Record New Commission</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">Team Member *</label>
                <input
                  value={newCommission.member_name}
                  onChange={e => setNewCommission(p => ({ ...p, member_name: e.target.value }))}
                  placeholder="Full name"
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">Deal / Reference</label>
                <input
                  value={newCommission.deal_number}
                  onChange={e => setNewCommission(p => ({ ...p, deal_number: e.target.value }))}
                  placeholder="FTH-001"
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">Client</label>
                <input
                  value={newCommission.client_name}
                  onChange={e => setNewCommission(p => ({ ...p, client_name: e.target.value }))}
                  placeholder="Client name"
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">Type</label>
                <select
                  value={newCommission.commission_type}
                  onChange={e => setNewCommission(p => ({ ...p, commission_type: e.target.value }))}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                >
                  {Object.entries(TYPE_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">Deal Value (USD)</label>
                <input
                  type="number"
                  value={newCommission.deal_value_usd}
                  onChange={e => setNewCommission(p => ({ ...p, deal_value_usd: e.target.value }))}
                  placeholder="0.00"
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">Rate (%)</label>
                <input
                  type="number"
                  value={newCommission.rate_pct}
                  onChange={e => setNewCommission(p => ({ ...p, rate_pct: e.target.value }))}
                  placeholder="2.50"
                  step="0.25"
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">Commission Amount (USD) *</label>
                <input
                  type="number"
                  value={newCommission.commission_usd}
                  onChange={e => setNewCommission(p => ({ ...p, commission_usd: e.target.value }))}
                  placeholder="auto-calculated or enter manually"
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">Period</label>
                <input
                  type="month"
                  value={newCommission.period_month}
                  onChange={e => setNewCommission(p => ({ ...p, period_month: e.target.value }))}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">Commodity</label>
                <input
                  value={newCommission.commodity}
                  onChange={e => setNewCommission(p => ({ ...p, commodity: e.target.value }))}
                  placeholder="Coffee, Cocoa, Gold…"
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>
            </div>
            <div className="mt-4">
              <label className="block text-xs font-medium text-gray-600 mb-1.5">Notes</label>
              <textarea
                value={newCommission.notes}
                onChange={e => setNewCommission(p => ({ ...p, notes: e.target.value }))}
                placeholder="Optional notes…"
                rows={2}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 resize-none"
              />
            </div>
            <div className="flex gap-3 mt-4">
              <button
                onClick={handleAdd}
                disabled={!newCommission.member_name || !newCommission.commission_usd || actionLoading === 'add'}
                className="bg-amber-600 text-white rounded-xl px-5 py-2.5 text-sm font-medium hover:bg-amber-700 disabled:opacity-40 transition-colors"
              >
                {actionLoading === 'add' ? 'Saving…' : 'Save Commission'}
              </button>
              <button
                onClick={() => setShowAdd(false)}
                className="bg-gray-100 text-gray-600 rounded-xl px-5 py-2.5 text-sm font-medium hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* FILTERS */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-3 py-2">
            <Filter size={13} className="text-gray-400" />
            <select
              value={filterStatus}
              onChange={e => setFilterStatus(e.target.value)}
              className="text-sm text-gray-700 bg-transparent focus:outline-none"
            >
              <option value="all">All statuses</option>
              {Object.entries(STATUS_CONFIG).map(([v, { label }]) => <option key={v} value={v}>{label}</option>)}
            </select>
          </div>
          {members.length > 0 && (
            <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-3 py-2">
              <select
                value={filterMember}
                onChange={e => setFilterMember(e.target.value)}
                className="text-sm text-gray-700 bg-transparent focus:outline-none"
              >
                <option value="">All members</option>
                {members.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
              <ChevronDown size={13} className="text-gray-400" />
            </div>
          )}
          <span className="text-xs text-gray-400 ml-auto">{summary?.total_records ?? 0} records</span>
        </div>

        {/* TABLE */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          {loading ? (
            <div className="p-8 space-y-3">
              {[1,2,3,4].map(i => <div key={i} className="h-14 bg-gray-100 rounded-xl animate-pulse" />)}
            </div>
          ) : !commissions.length ? (
            <div className="p-16 text-center">
              <DollarSign size={36} className="text-gray-200 mx-auto mb-3" />
              <p className="text-gray-400 font-medium">No commission records found</p>
              <p className="text-sm text-gray-400 mt-1">Records appear here when deals close or commissions are added manually</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Member</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Deal / Client</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Type</th>
                    <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Deal Value</th>
                    <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Rate</th>
                    <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Commission</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Period</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</th>
                    <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {commissions.map((c) => {
                    const statusCfg = STATUS_CONFIG[c.status] || STATUS_CONFIG.pending
                    const StatusIcon = statusCfg.icon
                    return (
                      <tr key={c.commission_id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-5 py-3.5">
                          <p className="font-medium text-gray-900">{c.member_name}</p>
                          {c.member_role && <p className="text-xs text-gray-400 capitalize">{c.member_role}</p>}
                        </td>
                        <td className="px-4 py-3.5">
                          <p className="text-gray-700">{c.client_name || '—'}</p>
                          {c.deal_number && <p className="text-xs text-gray-400">{c.deal_number}</p>}
                        </td>
                        <td className="px-4 py-3.5">
                          <span className="text-gray-600 text-xs">{TYPE_LABELS[c.commission_type] || c.commission_type}</span>
                        </td>
                        <td className="px-4 py-3.5 text-right text-gray-600 text-xs">
                          {c.deal_value_usd ? fmt(c.deal_value_usd) : '—'}
                        </td>
                        <td className="px-4 py-3.5 text-right text-gray-600 text-xs">
                          {c.rate_pct ? `${c.rate_pct}%` : '—'}
                        </td>
                        <td className="px-4 py-3.5 text-right">
                          <span className="font-bold text-gray-900">{fmt(c.commission_usd)}</span>
                        </td>
                        <td className="px-4 py-3.5">
                          <span className="text-xs text-gray-500">{c.period_month || '—'}</span>
                        </td>
                        <td className="px-4 py-3.5">
                          <span className={`inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full border ${statusCfg.color}`}>
                            <StatusIcon size={10} /> {statusCfg.label}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 text-right">
                          <div className="flex items-center justify-end gap-1">
                            {c.status === 'pending' && (
                              <button
                                onClick={() => updateStatus(c.commission_id, 'approved')}
                                disabled={actionLoading === c.commission_id}
                                className="text-xs bg-blue-50 text-blue-700 hover:bg-blue-100 px-2.5 py-1 rounded-lg font-medium transition-colors disabled:opacity-50"
                              >
                                Approve
                              </button>
                            )}
                            {c.status === 'approved' && (
                              <button
                                onClick={() => updateStatus(c.commission_id, 'paid')}
                                disabled={actionLoading === c.commission_id}
                                className="text-xs bg-green-50 text-green-700 hover:bg-green-100 px-2.5 py-1 rounded-lg font-medium transition-colors disabled:opacity-50"
                              >
                                Mark Paid
                              </button>
                            )}
                            {['pending', 'approved'].includes(c.status) && (
                              <button
                                onClick={() => updateStatus(c.commission_id, 'disputed')}
                                disabled={actionLoading === c.commission_id}
                                className="text-xs bg-red-50 text-red-600 hover:bg-red-100 px-2.5 py-1 rounded-lg font-medium transition-colors disabled:opacity-50"
                              >
                                Dispute
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
