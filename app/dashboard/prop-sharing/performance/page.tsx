'use client'

import { useEffect, useState } from 'react'
import { BarChart3, RefreshCw, Calculator, TrendingUp, TrendingDown, Target, Award, Zap } from 'lucide-react'

interface PerformanceMetrics {
  metrics_id: string
  account_id: string
  account_number: string
  trader_name: string
  current_phase: string
  account_status: string
  program_name: string
  total_trades: number
  winning_trades: number
  losing_trades: number
  total_pnl: number
  avg_win: number
  avg_loss: number
  largest_win: number
  largest_loss: number
  win_rate: number
  profit_factor: number
  expectancy: number
  kelly_criterion: number
  sharpe_ratio: number
  sortino_ratio: number
  calmar_ratio: number
  max_drawdown: number
  max_drawdown_pct: number
  longest_win_streak: number
  longest_lose_streak: number
  current_streak: number
  calculated_at: string
  period_start: string
  period_end: string
}

export default function PerformancePage() {
  const [metrics, setMetrics] = useState<PerformanceMetrics[]>([])
  const [loading, setLoading] = useState(true)
  const [calculating, setCalculating] = useState(false)
  const [sortBy, setSortBy] = useState('sharpe_ratio')
  const [selectedMetric, setSelectedMetric] = useState<PerformanceMetrics | null>(null)

  async function fetchData() {
    setLoading(true)
    try {
      const res = await fetch(`/api/prop-sharing/performance?sort=${sortBy}`)
      const data = await res.json()
      setMetrics(data.metrics || [])
    } catch (e) {
      console.error(e)
    }
    setLoading(false)
  }

  useEffect(() => { fetchData() }, [sortBy])

  async function recalculateAll() {
    setCalculating(true)
    try {
      await fetch('/api/prop-sharing/performance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      })
      fetchData()
    } catch (e) {
      console.error(e)
    }
    setCalculating(false)
  }

  const fmt = (n: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n)
  const fmtPct = (n: number) => `${Number(n).toFixed(2)}%`
  const fmtRatio = (n: number) => Number(n).toFixed(3)

  function getGrade(sharpe: number): { label: string; color: string } {
    const s = Number(sharpe)
    if (s >= 3) return { label: 'Elite', color: 'text-purple-700 bg-purple-100' }
    if (s >= 2) return { label: 'Excellent', color: 'text-emerald-700 bg-emerald-100' }
    if (s >= 1) return { label: 'Good', color: 'text-green-700 bg-green-100' }
    if (s >= 0.5) return { label: 'Average', color: 'text-yellow-700 bg-yellow-100' }
    if (s >= 0) return { label: 'Below Avg', color: 'text-orange-700 bg-orange-100' }
    return { label: 'Poor', color: 'text-red-700 bg-red-100' }
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-amber-700" /> Performance Analytics
          </h1>
          <p className="text-gray-500 mt-1">Deterministic trader metrics — Sharpe, Sortino, Expectancy &amp; more</p>
        </div>
        <div className="flex gap-3">
          <button onClick={fetchData} className="p-2 bg-gray-100 rounded-lg hover:bg-gray-200"><RefreshCw className="w-4 h-4" /></button>
          <button onClick={recalculateAll} disabled={calculating}
            className="flex items-center gap-2 px-4 py-2 bg-amber-700 text-white rounded-lg hover:bg-amber-800 disabled:opacity-50">
            <Calculator className="w-4 h-4" /> {calculating ? 'Calculating...' : 'Recalculate All'}
          </button>
        </div>
      </div>

      {/* Sort Controls */}
      <div className="flex items-center gap-3 mb-6">
        <span className="text-sm text-gray-500">Sort by:</span>
        {[
          { key: 'sharpe_ratio', label: 'Sharpe' },
          { key: 'sortino_ratio', label: 'Sortino' },
          { key: 'profit_factor', label: 'Profit Factor' },
          { key: 'win_rate', label: 'Win Rate' },
          { key: 'expectancy', label: 'Expectancy' },
          { key: 'total_pnl', label: 'Total P&L' },
        ].map(s => (
          <button key={s.key} onClick={() => setSortBy(s.key)}
            className={`px-3 py-1 rounded-full text-sm transition ${sortBy === s.key ? 'bg-amber-700 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
            {s.label}
          </button>
        ))}
      </div>

      {/* Detail Modal */}
      {selectedMetric && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-bold">{selectedMetric.trader_name}</h3>
                <p className="text-sm text-gray-500">{selectedMetric.account_number} — {selectedMetric.program_name}</p>
              </div>
              <span className={`text-sm px-3 py-1 rounded-full ${getGrade(selectedMetric.sharpe_ratio).color}`}>
                {getGrade(selectedMetric.sharpe_ratio).label}
              </span>
            </div>

            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="text-xs text-gray-500 mb-1">Sharpe Ratio</div>
                <div className="text-2xl font-bold">{fmtRatio(selectedMetric.sharpe_ratio)}</div>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="text-xs text-gray-500 mb-1">Sortino Ratio</div>
                <div className="text-2xl font-bold">{fmtRatio(selectedMetric.sortino_ratio)}</div>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="text-xs text-gray-500 mb-1">Calmar Ratio</div>
                <div className="text-2xl font-bold">{fmtRatio(selectedMetric.calmar_ratio)}</div>
              </div>
            </div>

            <div className="grid grid-cols-4 gap-4 mb-6 text-sm">
              <div><span className="text-gray-500">Total Trades</span><div className="font-bold text-lg">{selectedMetric.total_trades}</div></div>
              <div><span className="text-gray-500">Win Rate</span><div className="font-bold text-lg">{fmtPct(selectedMetric.win_rate * 100)}</div></div>
              <div><span className="text-gray-500">Profit Factor</span><div className="font-bold text-lg">{fmtRatio(selectedMetric.profit_factor)}</div></div>
              <div><span className="text-gray-500">Expectancy</span><div className="font-bold text-lg">{fmt(selectedMetric.expectancy)}</div></div>

              <div><span className="text-gray-500">Total P&L</span><div className={`font-bold text-lg ${Number(selectedMetric.total_pnl) >= 0 ? 'text-emerald-700' : 'text-red-700'}`}>{fmt(selectedMetric.total_pnl)}</div></div>
              <div><span className="text-gray-500">Avg Win</span><div className="font-bold text-lg text-emerald-700">{fmt(selectedMetric.avg_win)}</div></div>
              <div><span className="text-gray-500">Avg Loss</span><div className="font-bold text-lg text-red-700">{fmt(selectedMetric.avg_loss)}</div></div>
              <div><span className="text-gray-500">Kelly %</span><div className="font-bold text-lg">{fmtPct(selectedMetric.kelly_criterion * 100)}</div></div>

              <div><span className="text-gray-500">Max Drawdown</span><div className="font-bold text-lg text-red-700">{fmt(selectedMetric.max_drawdown)}</div></div>
              <div><span className="text-gray-500">Max DD %</span><div className="font-bold text-lg text-red-700">{fmtPct(selectedMetric.max_drawdown_pct)}</div></div>
              <div><span className="text-gray-500">Win Streak</span><div className="font-bold text-lg text-emerald-700">{selectedMetric.longest_win_streak}</div></div>
              <div><span className="text-gray-500">Lose Streak</span><div className="font-bold text-lg text-red-700">{selectedMetric.longest_lose_streak}</div></div>

              <div><span className="text-gray-500">Largest Win</span><div className="font-bold text-lg text-emerald-700">{fmt(selectedMetric.largest_win)}</div></div>
              <div><span className="text-gray-500">Largest Loss</span><div className="font-bold text-lg text-red-700">{fmt(selectedMetric.largest_loss)}</div></div>
              <div><span className="text-gray-500">Current Streak</span><div className={`font-bold text-lg ${selectedMetric.current_streak >= 0 ? 'text-emerald-700' : 'text-red-700'}`}>{selectedMetric.current_streak > 0 ? `+${selectedMetric.current_streak}` : selectedMetric.current_streak}</div></div>
              <div><span className="text-gray-500">Last Calculated</span><div className="font-bold text-sm">{new Date(selectedMetric.calculated_at).toLocaleString()}</div></div>
            </div>

            <button onClick={() => setSelectedMetric(null)} className="px-6 py-2 bg-gray-100 rounded-lg hover:bg-gray-200">Close</button>
          </div>
        </div>
      )}

      {/* Metrics Table */}
      <div className="bg-white rounded-xl border overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left p-3 text-xs font-semibold text-gray-500 uppercase">Trader</th>
              <th className="text-left p-3 text-xs font-semibold text-gray-500 uppercase">Grade</th>
              <th className="text-right p-3 text-xs font-semibold text-gray-500 uppercase">Sharpe</th>
              <th className="text-right p-3 text-xs font-semibold text-gray-500 uppercase">Sortino</th>
              <th className="text-right p-3 text-xs font-semibold text-gray-500 uppercase">Win Rate</th>
              <th className="text-right p-3 text-xs font-semibold text-gray-500 uppercase">Profit Factor</th>
              <th className="text-right p-3 text-xs font-semibold text-gray-500 uppercase">Expectancy</th>
              <th className="text-right p-3 text-xs font-semibold text-gray-500 uppercase">Max DD %</th>
              <th className="text-right p-3 text-xs font-semibold text-gray-500 uppercase">Total P&L</th>
              <th className="text-left p-3 text-xs font-semibold text-gray-500 uppercase">Detail</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {loading ? (
              <tr><td colSpan={10} className="p-8 text-center text-gray-400">Loading...</td></tr>
            ) : metrics.length === 0 ? (
              <tr><td colSpan={10} className="p-8 text-center text-gray-400">No performance data yet. Click &quot;Recalculate All&quot; after traders have closed trades.</td></tr>
            ) : metrics.map((m, i) => {
              const grade = getGrade(m.sharpe_ratio)
              return (
                <tr key={m.metrics_id} className="hover:bg-gray-50">
                  <td className="p-3">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-amber-100 text-amber-800 flex items-center justify-center text-xs font-bold">{i + 1}</span>
                      <div>
                        <div className="font-medium text-sm">{m.trader_name}</div>
                        <div className="text-xs text-gray-500">{m.account_number} · {m.total_trades} trades</div>
                      </div>
                    </div>
                  </td>
                  <td className="p-3">
                    <span className={`text-xs px-2 py-1 rounded-full ${grade.color}`}>{grade.label}</span>
                  </td>
                  <td className="p-3 text-sm text-right font-mono">{fmtRatio(m.sharpe_ratio)}</td>
                  <td className="p-3 text-sm text-right font-mono">{fmtRatio(m.sortino_ratio)}</td>
                  <td className="p-3 text-sm text-right font-mono">{fmtPct(Number(m.win_rate) * 100)}</td>
                  <td className="p-3 text-sm text-right font-mono">{fmtRatio(m.profit_factor)}</td>
                  <td className="p-3 text-sm text-right font-mono">{fmt(m.expectancy)}</td>
                  <td className="p-3 text-sm text-right font-mono text-red-700">{fmtPct(m.max_drawdown_pct)}</td>
                  <td className={`p-3 text-sm text-right font-mono font-medium ${Number(m.total_pnl) >= 0 ? 'text-emerald-700' : 'text-red-700'}`}>{fmt(m.total_pnl)}</td>
                  <td className="p-3">
                    <button onClick={() => setSelectedMetric(m)} className="text-sm text-amber-700 hover:text-amber-800 font-medium">View</button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
