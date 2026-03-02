'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  DollarSign, CheckCircle, Clock, AlertTriangle,
  RefreshCw, TrendingUp, XCircle, Filter,
} from 'lucide-react'

interface Payout {
  payout_id: string
  account_id: string
  program_id: string
  period_start: string
  period_end: string
  period_label?: string
  gross_profit: number
  trader_share_pct: number
  trader_payout: number
  firm_share: number
  fees_deducted: number
  status: string
  approved_by?: string
  approved_at?: string
  paid_at?: string
  payment_method?: string
  payment_reference?: string
  trader_name?: string
  account_number?: string
  program_name?: string
  created_at: string
}

export default function PayoutsPage() {
  const [payouts, setPayouts] = useState<Payout[]>([])
  const [loading, setLoading] = useState(true)
  const [filterStatus, setFilterStatus] = useState('all')

  const fetchPayouts = useCallback(async () => {
    setLoading(true)
    const p = new URLSearchParams()
    if (filterStatus !== 'all') p.set('status', filterStatus)
    try {
      const res = await fetch(`/api/prop-sharing/payouts?${p}`)
      const data = await res.json()
      setPayouts(data.payouts || [])
    } catch { /* ignore */ }
    finally { setLoading(false) }
  }, [filterStatus])

  useEffect(() => { fetchPayouts() }, [fetchPayouts])

  const statusBadge = (status: string) => {
    const styles: Record<string, string> = {
      pending: 'bg-amber-100 text-amber-700',
      approved: 'bg-blue-100 text-blue-700',
      processing: 'bg-purple-100 text-purple-700',
      paid: 'bg-green-100 text-green-700',
      disputed: 'bg-red-100 text-red-700',
      cancelled: 'bg-gray-100 text-gray-500',
    }
    return <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${styles[status] || 'bg-gray-100 text-gray-500'}`}>{status.toUpperCase()}</span>
  }

  const totals = payouts.reduce((acc, p) => ({
    gross: acc.gross + p.gross_profit,
    trader: acc.trader + p.trader_payout,
    firm: acc.firm + p.firm_share,
  }), { gross: 0, trader: 0, firm: 0 })

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Payouts</h1>
          <p className="text-sm text-gray-500 mt-1">Profit-share payout tracking and payment history.</p>
        </div>
        <button onClick={fetchPayouts} className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100">
          <RefreshCw size={16} />
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <p className="text-xs text-gray-500 mb-1">Total Gross Profit</p>
          <p className="text-xl font-bold text-gray-900">${totals.gross.toLocaleString()}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <p className="text-xs text-gray-500 mb-1">Trader Payouts</p>
          <p className="text-xl font-bold text-green-700">${totals.trader.toLocaleString()}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <p className="text-xs text-gray-500 mb-1">Firm Revenue</p>
          <p className="text-xl font-bold text-amber-700">${totals.firm.toLocaleString()}</p>
        </div>
      </div>

      {/* Filter */}
      <div className="flex items-center gap-3">
        <Filter size={14} className="text-gray-400" />
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-600">
          <option value="all">All Statuses</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="processing">Processing</option>
          <option value="paid">Paid</option>
          <option value="disputed">Disputed</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>

      {/* Payouts Table */}
      {loading ? (
        <div className="text-center py-12"><p className="text-sm text-gray-400">Loading payouts...</p></div>
      ) : payouts.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-gray-100">
          <DollarSign size={40} className="mx-auto text-gray-200 mb-4" />
          <p className="text-gray-500 mb-2">No payouts yet</p>
          <p className="text-xs text-gray-400">Payouts appear here once funded accounts generate profit.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-gray-500">
                  <th className="text-left px-4 py-3 font-medium text-xs">Trader</th>
                  <th className="text-left px-4 py-3 font-medium text-xs">Program</th>
                  <th className="text-left px-4 py-3 font-medium text-xs">Period</th>
                  <th className="text-right px-4 py-3 font-medium text-xs">Gross Profit</th>
                  <th className="text-right px-4 py-3 font-medium text-xs">Trader Payout</th>
                  <th className="text-right px-4 py-3 font-medium text-xs">Firm Share</th>
                  <th className="text-left px-4 py-3 font-medium text-xs">Status</th>
                  <th className="text-left px-4 py-3 font-medium text-xs">Payment</th>
                </tr>
              </thead>
              <tbody>
                {payouts.map((p) => (
                  <tr key={p.payout_id} className="border-b border-gray-50 hover:bg-gray-50/50">
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-900">{p.trader_name || '-'}</p>
                      <p className="text-xs text-gray-400">{p.account_number || '-'}</p>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-600">{p.program_name || '-'}</td>
                    <td className="px-4 py-3 text-xs text-gray-600">{p.period_label || `${p.period_start} - ${p.period_end}`}</td>
                    <td className="px-4 py-3 text-right font-medium text-gray-900">${p.gross_profit.toLocaleString()}</td>
                    <td className="px-4 py-3 text-right font-medium text-green-700">${p.trader_payout.toLocaleString()}</td>
                    <td className="px-4 py-3 text-right font-medium text-amber-700">${p.firm_share.toLocaleString()}</td>
                    <td className="px-4 py-3">{statusBadge(p.status)}</td>
                    <td className="px-4 py-3 text-xs text-gray-500">
                      {p.payment_method ? `${p.payment_method} ${p.payment_reference || ''}` : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
