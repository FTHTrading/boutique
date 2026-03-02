'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  Plus, Briefcase, DollarSign, Users, Clock,
  TrendingUp, Percent, RefreshCw, ChevronDown,
} from 'lucide-react'

interface Program {
  program_id: string
  name: string
  slug: string
  description?: string
  commodity_focus?: string[]
  status: string
  funded_capital: number
  currency: string
  eval_duration_days: number
  eval_profit_target: number
  eval_max_drawdown: number
  eval_daily_loss_limit: number
  eval_min_trading_days: number
  eval_fee: number
  max_drawdown: number
  daily_loss_limit: number
  max_position_size: number
  max_open_positions: number
  trader_profit_pct: number
  firm_profit_pct: number
  payout_frequency: string
  min_payout_amount: number
  created_at: string
}

export default function ProgramsPage() {
  const [programs, setPrograms] = useState<Program[]>([])
  const [loading, setLoading] = useState(true)
  const [showNew, setShowNew] = useState(false)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    name: '', slug: '', description: '', commodity_focus: '',
    funded_capital: '', eval_duration_days: '30', eval_profit_target: '8',
    eval_max_drawdown: '5', eval_daily_loss_limit: '2', eval_min_trading_days: '10',
    eval_fee: '0', max_drawdown: '10', daily_loss_limit: '3',
    max_position_size: '20', max_open_positions: '5',
    trader_profit_pct: '80', firm_profit_pct: '20',
    payout_frequency: 'monthly', min_payout_amount: '100',
  })

  const fetchPrograms = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/prop-sharing/programs')
      const data = await res.json()
      setPrograms(data.programs || [])
    } catch { /* ignore */ }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { fetchPrograms() }, [fetchPrograms])

  const handleCreate = async () => {
    if (!form.name || !form.slug || !form.funded_capital) {
      setError('Name, slug, and funded capital are required')
      return
    }
    setCreating(true); setError('')
    try {
      const res = await fetch('/api/prop-sharing/programs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          funded_capital: parseFloat(form.funded_capital),
          eval_duration_days: parseInt(form.eval_duration_days),
          eval_profit_target: parseFloat(form.eval_profit_target),
          eval_max_drawdown: parseFloat(form.eval_max_drawdown),
          eval_daily_loss_limit: parseFloat(form.eval_daily_loss_limit),
          eval_min_trading_days: parseInt(form.eval_min_trading_days),
          eval_fee: parseFloat(form.eval_fee),
          max_drawdown: parseFloat(form.max_drawdown),
          daily_loss_limit: parseFloat(form.daily_loss_limit),
          max_position_size: parseFloat(form.max_position_size),
          max_open_positions: parseInt(form.max_open_positions),
          trader_profit_pct: parseFloat(form.trader_profit_pct),
          firm_profit_pct: parseFloat(form.firm_profit_pct),
          min_payout_amount: parseFloat(form.min_payout_amount),
          commodity_focus: form.commodity_focus ? form.commodity_focus.split(',').map(s => s.trim()) : null,
        }),
      })
      const data = await res.json()
      if (data.program) {
        setShowNew(false)
        setForm({ name: '', slug: '', description: '', commodity_focus: '', funded_capital: '', eval_duration_days: '30', eval_profit_target: '8', eval_max_drawdown: '5', eval_daily_loss_limit: '2', eval_min_trading_days: '10', eval_fee: '0', max_drawdown: '10', daily_loss_limit: '3', max_position_size: '20', max_open_positions: '5', trader_profit_pct: '80', firm_profit_pct: '20', payout_frequency: 'monthly', min_payout_amount: '100' })
        fetchPrograms()
      } else { setError(data.error || 'Failed') }
    } catch { setError('Network error') }
    finally { setCreating(false) }
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Trading Programs</h1>
          <p className="text-sm text-gray-500 mt-1">Define funded tiers, evaluation rules, risk limits, and profit splits.</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={fetchPrograms} className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100">
            <RefreshCw size={16} />
          </button>
          <button onClick={() => setShowNew(!showNew)} className="flex items-center gap-2 bg-amber-700 hover:bg-amber-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
            <Plus size={14} /> New Program
          </button>
        </div>
      </div>

      {/* New Program Form */}
      {showNew && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
          <h3 className="font-semibold text-gray-900">Create Program</h3>
          {error && <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Program Name *</label>
              <input value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" placeholder="Gold Trader $50K" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Slug *</label>
              <input value={form.slug} onChange={e => setForm({...form, slug: e.target.value})} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" placeholder="gold-trader-50k" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Funded Capital ($) *</label>
              <input type="number" value={form.funded_capital} onChange={e => setForm({...form, funded_capital: e.target.value})} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" placeholder="50000" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Commodity Focus</label>
              <input value={form.commodity_focus} onChange={e => setForm({...form, commodity_focus: e.target.value})} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" placeholder="gold, coffee (comma-separated)" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Eval Fee ($)</label>
              <input type="number" value={form.eval_fee} onChange={e => setForm({...form, eval_fee: e.target.value})} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Payout Frequency</label>
              <select value={form.payout_frequency} onChange={e => setForm({...form, payout_frequency: e.target.value})} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm">
                <option value="weekly">Weekly</option>
                <option value="biweekly">Biweekly</option>
                <option value="monthly">Monthly</option>
              </select>
            </div>
          </div>
          <details className="text-sm">
            <summary className="cursor-pointer text-amber-700 font-medium">Advanced Rules</summary>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-3">
              {[
                { key: 'eval_duration_days', label: 'Eval Days', suffix: 'days' },
                { key: 'eval_profit_target', label: 'Eval Profit Target', suffix: '%' },
                { key: 'eval_max_drawdown', label: 'Eval Max Drawdown', suffix: '%' },
                { key: 'eval_daily_loss_limit', label: 'Eval Daily Loss', suffix: '%' },
                { key: 'eval_min_trading_days', label: 'Min Trading Days', suffix: 'days' },
                { key: 'max_drawdown', label: 'Funded Max Drawdown', suffix: '%' },
                { key: 'daily_loss_limit', label: 'Funded Daily Loss', suffix: '%' },
                { key: 'max_position_size', label: 'Max Position Size', suffix: '%' },
                { key: 'max_open_positions', label: 'Max Open Positions', suffix: '' },
                { key: 'trader_profit_pct', label: 'Trader Profit Share', suffix: '%' },
                { key: 'firm_profit_pct', label: 'Firm Profit Share', suffix: '%' },
                { key: 'min_payout_amount', label: 'Min Payout', suffix: '$' },
              ].map(({ key, label, suffix }) => (
                <div key={key}>
                  <label className="block text-xs font-medium text-gray-600 mb-1">{label}{suffix ? ` (${suffix})` : ''}</label>
                  <input type="number" value={(form as any)[key]} onChange={e => setForm({...form, [key]: e.target.value})} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" />
                </div>
              ))}
            </div>
          </details>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Description</label>
            <textarea value={form.description} onChange={e => setForm({...form, description: e.target.value})} rows={2} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" />
          </div>
          <div className="flex gap-2">
            <button onClick={handleCreate} disabled={creating} className="bg-amber-700 hover:bg-amber-600 text-white px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50">
              {creating ? 'Creating...' : 'Create Program'}
            </button>
            <button onClick={() => setShowNew(false)} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800">Cancel</button>
          </div>
        </div>
      )}

      {/* Programs List */}
      {loading ? (
        <div className="text-center py-12"><p className="text-sm text-gray-400">Loading programs...</p></div>
      ) : programs.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-gray-100">
          <Briefcase size={40} className="mx-auto text-gray-200 mb-4" />
          <p className="text-gray-500 mb-2">No programs yet</p>
          <p className="text-xs text-gray-400">Create your first funding program to get started.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {programs.map((p) => (
            <div key={p.program_id} className="bg-white rounded-xl border border-gray-100 overflow-hidden">
              <button onClick={() => setExpandedId(expandedId === p.program_id ? null : p.program_id)} className="w-full p-5 flex items-center gap-4 text-left hover:bg-gray-50 transition-colors">
                <div className="w-10 h-10 rounded-lg bg-amber-50 flex items-center justify-center shrink-0">
                  <Briefcase size={18} className="text-amber-700" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-gray-900">{p.name}</h3>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${p.status === 'active' ? 'bg-green-100 text-green-700' : p.status === 'paused' ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-500'}`}>
                      {p.status.toUpperCase()}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 mt-1">
                    <span className="text-xs text-gray-500 flex items-center gap-1"><DollarSign size={10} />${p.funded_capital.toLocaleString()} {p.currency}</span>
                    <span className="text-xs text-gray-500 flex items-center gap-1"><Percent size={10} />{p.trader_profit_pct}/{p.firm_profit_pct} split</span>
                    <span className="text-xs text-gray-500 flex items-center gap-1"><Clock size={10} />{p.eval_duration_days}d eval</span>
                    {p.commodity_focus && <span className="text-xs text-gray-500">{p.commodity_focus.join(', ')}</span>}
                  </div>
                </div>
                <ChevronDown size={16} className={`text-gray-400 transition-transform ${expandedId === p.program_id ? 'rotate-180' : ''}`} />
              </button>
              {expandedId === p.program_id && (
                <div className="border-t border-gray-100 px-5 py-4 bg-gray-50/50">
                  {p.description && <p className="text-sm text-gray-600 mb-4">{p.description}</p>}
                  <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
                    <div>
                      <p className="font-semibold text-gray-700 mb-2">Evaluation Rules</p>
                      <ul className="space-y-1 text-gray-500">
                        <li>Profit Target: {p.eval_profit_target}%</li>
                        <li>Max Drawdown: {p.eval_max_drawdown}%</li>
                        <li>Daily Loss Limit: {p.eval_daily_loss_limit}%</li>
                        <li>Min Trading Days: {p.eval_min_trading_days}</li>
                        <li>Duration: {p.eval_duration_days} days</li>
                        <li>Fee: ${p.eval_fee}</li>
                      </ul>
                    </div>
                    <div>
                      <p className="font-semibold text-gray-700 mb-2">Funded Rules</p>
                      <ul className="space-y-1 text-gray-500">
                        <li>Max Drawdown: {p.max_drawdown}%</li>
                        <li>Daily Loss Limit: {p.daily_loss_limit}%</li>
                        <li>Max Position: {p.max_position_size}%</li>
                        <li>Max Open: {p.max_open_positions}</li>
                      </ul>
                    </div>
                    <div>
                      <p className="font-semibold text-gray-700 mb-2">Payouts</p>
                      <ul className="space-y-1 text-gray-500">
                        <li>Trader: {p.trader_profit_pct}%</li>
                        <li>Firm: {p.firm_profit_pct}%</li>
                        <li>Frequency: {p.payout_frequency}</li>
                        <li>Min Amount: ${p.min_payout_amount}</li>
                      </ul>
                    </div>
                    <div>
                      <p className="font-semibold text-gray-700 mb-2">Info</p>
                      <ul className="space-y-1 text-gray-500">
                        <li>Slug: {p.slug}</li>
                        <li>Currency: {p.currency}</li>
                        <li>Created: {new Date(p.created_at).toLocaleDateString()}</li>
                      </ul>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
