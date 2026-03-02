'use client'

import { useEffect, useState } from 'react'
import { DollarSign, ArrowUpRight, ArrowDownRight, BookOpen, Plus, TrendingUp, TrendingDown, RefreshCw, Filter } from 'lucide-react'

interface TreasuryEntry {
  entry_id: string
  entry_type: string
  amount: number
  direction: string
  running_balance: number
  description: string
  reference: string | null
  performed_by: string
  account_id: string | null
  account_number?: string
  trader_name?: string
  program_name?: string
  created_at: string
}

interface TreasurySummary {
  total_capital_allocated: number
  total_capital_returned: number
  net_capital_deployed: number
  total_trader_payouts: number
  total_firm_revenue: number
  total_eval_fees: number
  total_losses_absorbed: number
  net_position: number
  entry_count: number
}

const entryTypeLabels: Record<string, string> = {
  capital_allocated: 'Capital Allocated',
  capital_returned: 'Capital Returned',
  trader_payout: 'Trader Payout',
  firm_revenue: 'Firm Revenue',
  eval_fee_received: 'Eval Fee Received',
  loss_absorbed: 'Loss Absorbed',
  adjustment: 'Adjustment',
}

const entryTypeColors: Record<string, string> = {
  capital_allocated: 'bg-blue-100 text-blue-800',
  capital_returned: 'bg-green-100 text-green-800',
  trader_payout: 'bg-orange-100 text-orange-800',
  firm_revenue: 'bg-emerald-100 text-emerald-800',
  eval_fee_received: 'bg-amber-100 text-amber-800',
  loss_absorbed: 'bg-red-100 text-red-800',
  adjustment: 'bg-gray-100 text-gray-800',
}

export default function TreasuryPage() {
  const [entries, setEntries] = useState<TreasuryEntry[]>([])
  const [summary, setSummary] = useState<TreasurySummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('')
  const [showForm, setShowForm] = useState(false)

  const [form, setForm] = useState({
    entry_type: 'adjustment',
    amount: '',
    direction: 'credit',
    description: '',
    reference: '',
    performed_by: 'admin',
  })

  async function fetchData() {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (filter) params.set('type', filter)
      const res = await fetch(`/api/prop-sharing/treasury?${params}`)
      const data = await res.json()
      setEntries(data.entries || [])
      setSummary(data.summary || null)
    } catch (e) {
      console.error(e)
    }
    setLoading(false)
  }

  useEffect(() => { fetchData() }, [filter])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    try {
      await fetch('/api/prop-sharing/treasury', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, amount: parseFloat(form.amount) }),
      })
      setShowForm(false)
      setForm({ entry_type: 'adjustment', amount: '', direction: 'credit', description: '', reference: '', performed_by: 'admin' })
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
          <h1 className="text-2xl font-bold text-gray-900">Treasury Ledger</h1>
          <p className="text-gray-500 mt-1">Capital accounting &amp; fund flow monitoring</p>
        </div>
        <div className="flex gap-3">
          <button onClick={fetchData} className="p-2 bg-gray-100 rounded-lg hover:bg-gray-200"><RefreshCw className="w-4 h-4" /></button>
          <button onClick={() => setShowForm(!showForm)} className="flex items-center gap-2 px-4 py-2 bg-amber-700 text-white rounded-lg hover:bg-amber-800">
            <Plus className="w-4 h-4" /> Record Entry
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-xl border p-4">
            <div className="flex items-center gap-2 text-sm text-gray-500 mb-1"><TrendingDown className="w-4 h-4" /> Capital Deployed</div>
            <div className="text-xl font-bold text-blue-700">{fmt(summary.net_capital_deployed)}</div>
          </div>
          <div className="bg-white rounded-xl border p-4">
            <div className="flex items-center gap-2 text-sm text-gray-500 mb-1"><TrendingUp className="w-4 h-4" /> Firm Revenue</div>
            <div className="text-xl font-bold text-emerald-700">{fmt(summary.total_firm_revenue)}</div>
          </div>
          <div className="bg-white rounded-xl border p-4">
            <div className="flex items-center gap-2 text-sm text-gray-500 mb-1"><DollarSign className="w-4 h-4" /> Eval Fees</div>
            <div className="text-xl font-bold text-amber-700">{fmt(summary.total_eval_fees)}</div>
          </div>
          <div className="bg-white rounded-xl border p-4">
            <div className="flex items-center gap-2 text-sm text-gray-500 mb-1"><BookOpen className="w-4 h-4" /> Net Position</div>
            <div className={`text-xl font-bold ${summary.net_position >= 0 ? 'text-emerald-700' : 'text-red-700'}`}>{fmt(summary.net_position)}</div>
          </div>
          <div className="bg-white rounded-xl border p-4">
            <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">Trader Payouts</div>
            <div className="text-xl font-bold text-orange-700">{fmt(summary.total_trader_payouts)}</div>
          </div>
          <div className="bg-white rounded-xl border p-4">
            <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">Losses Absorbed</div>
            <div className="text-xl font-bold text-red-700">{fmt(summary.total_losses_absorbed)}</div>
          </div>
          <div className="bg-white rounded-xl border p-4">
            <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">Capital Allocated</div>
            <div className="text-xl font-bold text-gray-700">{fmt(summary.total_capital_allocated)}</div>
          </div>
          <div className="bg-white rounded-xl border p-4">
            <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">Ledger Entries</div>
            <div className="text-xl font-bold text-gray-700">{summary.entry_count}</div>
          </div>
        </div>
      )}

      {/* New Entry Form */}
      {showForm && (
        <div className="bg-white rounded-xl border p-6 mb-6">
          <h3 className="text-lg font-semibold mb-4">Record Treasury Entry</h3>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
              <select value={form.entry_type} onChange={e => setForm({ ...form, entry_type: e.target.value })} className="w-full border rounded-lg p-2">
                {Object.entries(entryTypeLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Amount</label>
              <input type="number" step="0.01" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} className="w-full border rounded-lg p-2" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Direction</label>
              <select value={form.direction} onChange={e => setForm({ ...form, direction: e.target.value })} className="w-full border rounded-lg p-2">
                <option value="credit">Credit (In)</option>
                <option value="debit">Debit (Out)</option>
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <input type="text" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} className="w-full border rounded-lg p-2" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Reference</label>
              <input type="text" value={form.reference} onChange={e => setForm({ ...form, reference: e.target.value })} className="w-full border rounded-lg p-2" placeholder="Optional" />
            </div>
            <div className="md:col-span-3 flex gap-3">
              <button type="submit" className="px-6 py-2 bg-amber-700 text-white rounded-lg hover:bg-amber-800">Record Entry</button>
              <button type="button" onClick={() => setShowForm(false)} className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200">Cancel</button>
            </div>
          </form>
        </div>
      )}

      {/* Filters */}
      <div className="flex items-center gap-3 mb-4">
        <Filter className="w-4 h-4 text-gray-400" />
        <select value={filter} onChange={e => setFilter(e.target.value)} className="border rounded-lg p-2 text-sm">
          <option value="">All Types</option>
          {Object.entries(entryTypeLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
      </div>

      {/* Ledger Table */}
      <div className="bg-white rounded-xl border overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left p-3 text-xs font-semibold text-gray-500 uppercase">Date</th>
              <th className="text-left p-3 text-xs font-semibold text-gray-500 uppercase">Type</th>
              <th className="text-left p-3 text-xs font-semibold text-gray-500 uppercase">Description</th>
              <th className="text-left p-3 text-xs font-semibold text-gray-500 uppercase">Account</th>
              <th className="text-right p-3 text-xs font-semibold text-gray-500 uppercase">Amount</th>
              <th className="text-right p-3 text-xs font-semibold text-gray-500 uppercase">Balance</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {loading ? (
              <tr><td colSpan={6} className="p-8 text-center text-gray-400">Loading...</td></tr>
            ) : entries.length === 0 ? (
              <tr><td colSpan={6} className="p-8 text-center text-gray-400">No treasury entries yet</td></tr>
            ) : entries.map(entry => (
              <tr key={entry.entry_id} className="hover:bg-gray-50">
                <td className="p-3 text-sm text-gray-600">{new Date(entry.created_at).toLocaleDateString()}</td>
                <td className="p-3">
                  <span className={`text-xs px-2 py-1 rounded-full ${entryTypeColors[entry.entry_type] || 'bg-gray-100'}`}>
                    {entryTypeLabels[entry.entry_type] || entry.entry_type}
                  </span>
                </td>
                <td className="p-3 text-sm text-gray-700">{entry.description}</td>
                <td className="p-3 text-sm text-gray-500">{entry.account_number || entry.program_name || '—'}</td>
                <td className="p-3 text-sm text-right font-medium">
                  <span className={`flex items-center justify-end gap-1 ${entry.direction === 'credit' ? 'text-emerald-700' : 'text-red-700'}`}>
                    {entry.direction === 'credit' ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                    {fmt(entry.amount)}
                  </span>
                </td>
                <td className="p-3 text-sm text-right font-mono text-gray-700">{fmt(entry.running_balance)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
