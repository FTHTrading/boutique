'use client'

import { useState, useEffect, useCallback } from 'react'
import { Shield, RefreshCw, AlertTriangle, TrendingUp, DollarSign, Users, Settings, Activity, ChevronDown, ChevronUp, Check, X } from 'lucide-react'

export default function FirmRiskPage() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [scanning, setScanning] = useState(false)
  const [editingConfig, setEditingConfig] = useState<string | null>(null)
  const [editValue, setEditValue] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/prop-sharing/firm-risk')
      const json = await res.json()
      if (json.success) setData(json.data)
    } catch (e) { console.error(e) }
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  const runScan = async () => {
    setScanning(true)
    try {
      await fetch('/api/prop-sharing/firm-risk', { method: 'POST' })
      await load()
    } catch (e) { console.error(e) }
    setScanning(false)
  }

  const updateConfig = async (key: string) => {
    try {
      const parsed = JSON.parse(editValue)
      await fetch('/api/prop-sharing/firm-risk', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ config_key: key, config_value: parsed }),
      })
      setEditingConfig(null)
      await load()
    } catch (e) { alert('Invalid JSON') }
  }

  if (loading && !data) {
    return <div className="p-6"><div className="animate-pulse space-y-4">{[...Array(4)].map((_, i) => <div key={i} className="h-24 bg-gray-200 rounded-xl" />)}</div></div>
  }

  const snap = data?.latest_snapshot
  const stats = data?.stats || {}
  const config = data?.config || []
  const sectors = data?.sectors || []
  const correlations = data?.correlation_alerts || []
  const history = data?.exposure_history || []
  const withinLimits = snap?.is_within_limits !== false
  const breaches = snap?.breach_flags || []

  const maxExposure = config.find((c: any) => c.config_key === 'max_total_exposure')?.config_value?.amount || 5000000
  const utilizationPct = snap?.capital_utilization_pct || (maxExposure > 0 ? ((parseFloat(stats.total_deployed) || 0) / maxExposure * 100) : 0)

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Shield className="text-amber-700" size={24} /> Firm-Wide Risk Monitor
          </h1>
          <p className="text-sm text-gray-500 mt-1">Capital buffer enforcement, sector concentration, and correlation tracking</p>
        </div>
        <button onClick={runScan} disabled={scanning} className="flex items-center gap-2 bg-amber-700 hover:bg-amber-600 text-white text-sm font-medium px-4 py-2.5 rounded-lg transition-colors disabled:opacity-50">
          <RefreshCw size={14} className={scanning ? 'animate-spin' : ''} />
          {scanning ? 'Scanning...' : 'Run Risk Scan'}
        </button>
      </div>

      {/* BREACH ALERT BANNER */}
      {!withinLimits && breaches.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle size={16} className="text-red-600" />
            <span className="text-sm font-semibold text-red-700">{breaches.length} Active Breach{breaches.length > 1 ? 'es' : ''}</span>
          </div>
          <ul className="space-y-1">
            {breaches.map((b: string, i: number) => (
              <li key={i} className="text-xs text-red-600 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500" />{b}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* STATUS CARDS */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Capital Deployed" value={fmt(parseFloat(stats.total_deployed) || 0)} icon={<DollarSign size={16} />} />
        <StatCard label="Net Exposure" value={fmt(snap?.net_exposure || 0)} icon={<TrendingUp size={16} />} />
        <StatCard label="Funded Accounts" value={parseFloat(stats.funded_accounts) || 0} icon={<Users size={16} />} />
        <StatCard
          label="Utilization"
          value={`${utilizationPct.toFixed(1)}%`}
          icon={<Activity size={16} />}
          color={utilizationPct > 80 ? 'red' : utilizationPct > 60 ? 'amber' : 'green'}
        />
      </div>

      {/* CAPACITY BAR */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-gray-700">Capital Capacity</h3>
          <span className="text-xs text-gray-500">{fmt(parseFloat(stats.total_deployed) || 0)} / {fmt(maxExposure)}</span>
        </div>
        <div className="w-full h-4 bg-gray-100 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${
              utilizationPct > 80 ? 'bg-red-500' : utilizationPct > 60 ? 'bg-amber-500' : 'bg-green-500'
            }`}
            style={{ width: `${Math.min(utilizationPct, 100)}%` }}
          />
        </div>
        <div className="flex justify-between mt-2 text-[10px] text-gray-400">
          <span>0%</span>
          <span className="text-amber-600 font-medium">Margin Reserve: {config.find((c: any) => c.config_key === 'margin_reserve_pct')?.config_value?.pct || 20}%</span>
          <span>100%</span>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">

        {/* SECTOR EXPOSURE */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
            <Activity size={14} className="text-amber-600" /> Sector Exposure
          </h3>
          {sectors.length === 0 ? (
            <p className="text-xs text-gray-400 py-4 text-center">No sector data — run a risk scan to populate</p>
          ) : (
            <div className="space-y-3">
              {sectors.map((s: any, i: number) => (
                <div key={i}>
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-gray-700 capitalize">{s.sector}</span>
                      {s.commodity && <span className="text-[10px] text-gray-400">({s.commodity})</span>}
                      {s.breach && <span className="text-[9px] font-bold text-red-600 bg-red-50 px-1.5 py-0.5 rounded">BREACH</span>}
                    </div>
                    <span className="text-[10px] text-gray-500">{s.num_accounts} acct{s.num_accounts !== 1 ? 's' : ''} · {(s.pct_of_total || 0).toFixed(1)}%</span>
                  </div>
                  <div className="flex gap-1">
                    <div className="h-2 bg-green-200 rounded-l" style={{ width: `${Math.max(s.pct_of_total || 0, 2)}%` }} title={`Long: ${fmt(s.long_exposure)}`} />
                    <div className="h-2 bg-red-200 rounded-r" style={{ width: `${Math.max(((parseFloat(s.short_exposure) || 0) / (parseFloat(s.long_exposure) + parseFloat(s.short_exposure) || 1)) * (s.pct_of_total || 0), 1)}%` }} title={`Short: ${fmt(s.short_exposure)}`} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* CORRELATION ALERTS */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
            <AlertTriangle size={14} className="text-amber-600" /> Correlation Alerts
          </h3>
          {correlations.length === 0 ? (
            <p className="text-xs text-gray-400 py-4 text-center">No active correlation alerts</p>
          ) : (
            <div className="space-y-3">
              {correlations.map((c: any, i: number) => (
                <div key={i} className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-semibold text-amber-800 capitalize">{c.commodity} — {c.direction}</span>
                    <span className="text-[10px] font-mono text-amber-600">corr: {(c.correlation || 0).toFixed(3)}</span>
                  </div>
                  <p className="text-[10px] text-amber-700">{c.num_accounts} accounts · combined exposure: {fmt(c.combined_exposure || 0)}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* RISK CONFIG */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h3 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
          <Settings size={14} className="text-amber-600" /> Risk Configuration
        </h3>
        <div className="space-y-2">
          {config.map((c: any) => (
            <div key={c.config_key} className="flex items-center justify-between py-2.5 border-b border-gray-100 last:border-0">
              <div className="flex-1">
                <p className="text-xs font-medium text-gray-700">{c.config_key.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}</p>
                <p className="text-[10px] text-gray-400 mt-0.5">{c.description}</p>
              </div>
              {editingConfig === c.config_key ? (
                <div className="flex items-center gap-2">
                  <input
                    value={editValue}
                    onChange={e => setEditValue(e.target.value)}
                    className="text-xs border border-gray-300 rounded px-2 py-1 w-48 font-mono"
                  />
                  <button onClick={() => updateConfig(c.config_key)} className="text-green-600 hover:text-green-700"><Check size={14} /></button>
                  <button onClick={() => setEditingConfig(null)} className="text-red-500 hover:text-red-600"><X size={14} /></button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <code className="text-xs bg-gray-50 px-2 py-1 rounded text-gray-600 font-mono">{JSON.stringify(c.config_value)}</code>
                  <button
                    onClick={() => { setEditingConfig(c.config_key); setEditValue(JSON.stringify(c.config_value, null, 0)) }}
                    className="text-gray-400 hover:text-amber-600 transition-colors"
                  >
                    <Settings size={12} />
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* EXPOSURE HISTORY */}
      {history.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">Exposure History</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead><tr className="text-left text-gray-400 border-b border-gray-100">
                <th className="pb-2 pr-3">Time</th>
                <th className="pb-2 pr-3">Deployed</th>
                <th className="pb-2 pr-3">Net Exposure</th>
                <th className="pb-2 pr-3">Utilization</th>
                <th className="pb-2">Status</th>
              </tr></thead>
              <tbody>
                {history.map((h: any, i: number) => (
                  <tr key={i} className="border-b border-gray-50">
                    <td className="py-2 pr-3 text-gray-500">{new Date(h.snapshot_time).toLocaleString()}</td>
                    <td className="py-2 pr-3 font-medium text-gray-700">{fmt(h.total_capital_deployed)}</td>
                    <td className="py-2 pr-3 text-gray-600">{fmt(h.net_exposure)}</td>
                    <td className="py-2 pr-3 text-gray-600">{(h.capital_utilization_pct || 0).toFixed(1)}%</td>
                    <td className="py-2">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${h.is_within_limits ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {h.is_within_limits ? 'OK' : 'BREACH'}
                      </span>
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

function StatCard({ label, value, icon, color }: { label: string; value: any; icon: React.ReactNode; color?: string }) {
  const colorMap: Record<string, string> = {
    red: 'text-red-600',
    amber: 'text-amber-600',
    green: 'text-green-600',
  }
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4">
      <div className="flex items-center gap-2 mb-2 text-gray-400">{icon}<span className="text-[10px] font-medium uppercase tracking-wider">{label}</span></div>
      <p className={`text-xl font-bold ${color ? colorMap[color] : 'text-gray-900'}`}>{value}</p>
    </div>
  )
}

function fmt(n: number): string {
  return '$' + Number(n || 0).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })
}
