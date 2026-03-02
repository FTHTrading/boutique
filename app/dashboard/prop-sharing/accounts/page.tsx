'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import {
  Plus, Search, Users, TrendingUp, TrendingDown,
  Clock, CheckCircle, AlertTriangle, XCircle, Shield,
  RefreshCw, DollarSign, BarChart3, Activity,
} from 'lucide-react'

interface PropAccount {
  account_id: string
  account_number: string
  program_id: string
  trader_name: string
  trader_email: string
  trader_country?: string
  trader_experience?: string
  phase: string
  starting_capital: number
  current_balance: number
  peak_balance: number
  current_drawdown: number
  daily_pnl: number
  total_pnl: number
  total_trades: number
  winning_trades: number
  losing_trades: number
  active_trading_days: number
  eval_deadline?: string
  eval_passed?: boolean
  funded_at?: string
  total_payouts: number
  risk_score: number
  created_at: string
  program_name?: string
  program_slug?: string
}

interface Program {
  program_id: string
  name: string
  slug: string
  funded_capital: number
}

export default function AccountsPage() {
  const [accounts, setAccounts] = useState<PropAccount[]>([])
  const [programs, setPrograms] = useState<Program[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterPhase, setFilterPhase] = useState('all')
  const [showNew, setShowNew] = useState(false)
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    program_id: '', trader_name: '', trader_email: '',
    trader_country: '', trader_experience: 'intermediate', notes: '',
  })

  const fetchAccounts = useCallback(async () => {
    setLoading(true)
    const p = new URLSearchParams()
    if (searchTerm) p.set('search', searchTerm)
    if (filterPhase !== 'all') p.set('phase', filterPhase)
    try {
      const res = await fetch(`/api/prop-sharing/accounts?${p}`)
      const data = await res.json()
      setAccounts(data.accounts || [])
    } catch { /* ignore */ }
    finally { setLoading(false) }
  }, [searchTerm, filterPhase])

  useEffect(() => { fetchAccounts() }, [fetchAccounts])
  useEffect(() => {
    fetch('/api/prop-sharing/programs?status=active').then(r => r.json()).then(d => setPrograms(d.programs || [])).catch(() => {})
  }, [])

  const handleCreate = async () => {
    if (!form.program_id || !form.trader_name || !form.trader_email) {
      setError('Program, trader name, and email are required')
      return
    }
    setCreating(true); setError('')
    try {
      const res = await fetch('/api/prop-sharing/accounts', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (data.account) {
        setShowNew(false)
        setForm({ program_id: '', trader_name: '', trader_email: '', trader_country: '', trader_experience: 'intermediate', notes: '' })
        fetchAccounts()
      } else { setError(data.error || 'Failed') }
    } catch { setError('Network error') }
    finally { setCreating(false) }
  }

  const phaseIcon = (phase: string) => {
    switch (phase) {
      case 'evaluation': return <Clock size={14} className="text-blue-600" />
      case 'verification': return <Shield size={14} className="text-amber-600" />
      case 'funded': return <CheckCircle size={14} className="text-green-600" />
      case 'suspended': return <AlertTriangle size={14} className="text-red-600" />
      case 'terminated': return <XCircle size={14} className="text-gray-400" />
      default: return null
    }
  }

  const phaseBadge = (phase: string) => {
    const colors: Record<string, string> = {
      evaluation: 'bg-blue-100 text-blue-700',
      verification: 'bg-amber-100 text-amber-700',
      funded: 'bg-green-100 text-green-700',
      suspended: 'bg-red-100 text-red-700',
      terminated: 'bg-gray-100 text-gray-500',
    }
    return <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${colors[phase] || 'bg-gray-100 text-gray-500'}`}>{phase.toUpperCase()}</span>
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Trader Accounts</h1>
          <p className="text-sm text-gray-500 mt-1">Evaluations, funded accounts, performance, and risk.</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={fetchAccounts} className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"><RefreshCw size={16} /></button>
          <button onClick={() => setShowNew(!showNew)} className="flex items-center gap-2 bg-amber-700 hover:bg-amber-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
            <Plus size={14} /> New Account
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input value={searchTerm} onChange={e => setSearchTerm(e.target.value)} placeholder="Search by name, email, account #..."
            className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm" />
        </div>
        <select value={filterPhase} onChange={e => setFilterPhase(e.target.value)}
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-600">
          <option value="all">All Phases</option>
          <option value="evaluation">Evaluation</option>
          <option value="verification">Verification</option>
          <option value="funded">Funded</option>
          <option value="suspended">Suspended</option>
          <option value="terminated">Terminated</option>
        </select>
      </div>

      {/* New Account Form */}
      {showNew && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
          <h3 className="font-semibold text-gray-900">Register Trader</h3>
          {error && <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Program *</label>
              <select value={form.program_id} onChange={e => setForm({...form, program_id: e.target.value})} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm">
                <option value="">Select program...</option>
                {programs.map(p => <option key={p.program_id} value={p.program_id}>{p.name} (${p.funded_capital.toLocaleString()})</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Trader Name *</label>
              <input value={form.trader_name} onChange={e => setForm({...form, trader_name: e.target.value})} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Trader Email *</label>
              <input type="email" value={form.trader_email} onChange={e => setForm({...form, trader_email: e.target.value})} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Country</label>
              <input value={form.trader_country} onChange={e => setForm({...form, trader_country: e.target.value})} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Experience</label>
              <select value={form.trader_experience} onChange={e => setForm({...form, trader_experience: e.target.value})} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm">
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
                <option value="professional">Professional</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Notes</label>
              <input value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" />
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={handleCreate} disabled={creating} className="bg-amber-700 text-white px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50">
              {creating ? 'Creating...' : 'Register Trader'}
            </button>
            <button onClick={() => setShowNew(false)} className="px-4 py-2 text-sm text-gray-600">Cancel</button>
          </div>
        </div>
      )}

      {/* Accounts Table */}
      {loading ? (
        <div className="text-center py-12"><p className="text-sm text-gray-400">Loading accounts...</p></div>
      ) : accounts.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-gray-100">
          <Users size={40} className="mx-auto text-gray-200 mb-4" />
          <p className="text-gray-500 mb-2">No accounts found</p>
          <p className="text-xs text-gray-400">Register a trader to begin their evaluation.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-gray-500">
                  <th className="text-left px-4 py-3 font-medium text-xs">Trader</th>
                  <th className="text-left px-4 py-3 font-medium text-xs">Program</th>
                  <th className="text-left px-4 py-3 font-medium text-xs">Phase</th>
                  <th className="text-right px-4 py-3 font-medium text-xs">Balance</th>
                  <th className="text-right px-4 py-3 font-medium text-xs">P&L</th>
                  <th className="text-right px-4 py-3 font-medium text-xs">Drawdown</th>
                  <th className="text-right px-4 py-3 font-medium text-xs">Win Rate</th>
                  <th className="text-right px-4 py-3 font-medium text-xs">Trades</th>
                </tr>
              </thead>
              <tbody>
                {accounts.map((a) => {
                  const winRate = a.total_trades > 0 ? ((a.winning_trades / a.total_trades) * 100).toFixed(1) : '-'
                  return (
                    <tr key={a.account_id} className="border-b border-gray-50 hover:bg-gray-50/50">
                      <td className="px-4 py-3">
                        <p className="font-medium text-gray-900">{a.trader_name}</p>
                        <p className="text-xs text-gray-400">{a.account_number}</p>
                      </td>
                      <td className="px-4 py-3 text-gray-600 text-xs">{a.program_name || '-'}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          {phaseIcon(a.phase)}
                          {phaseBadge(a.phase)}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right font-medium text-gray-900">${a.current_balance.toLocaleString()}</td>
                      <td className={`px-4 py-3 text-right font-medium ${a.total_pnl >= 0 ? 'text-green-700' : 'text-red-600'}`}>
                        <span className="flex items-center justify-end gap-1">
                          {a.total_pnl >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                          ${Math.abs(a.total_pnl).toLocaleString()}
                        </span>
                      </td>
                      <td className={`px-4 py-3 text-right text-xs font-medium ${a.current_drawdown > 5 ? 'text-red-600' : a.current_drawdown > 3 ? 'text-amber-600' : 'text-gray-600'}`}>
                        {a.current_drawdown.toFixed(2)}%
                      </td>
                      <td className="px-4 py-3 text-right text-xs text-gray-600">{winRate}%</td>
                      <td className="px-4 py-3 text-right text-xs text-gray-500">{a.total_trades}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
