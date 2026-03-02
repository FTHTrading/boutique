'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  Zap, Settings, Clock, Shield, AlertTriangle, RefreshCw,
  BarChart3, Activity, TrendingUp, Power, Plus, ChevronDown,
  ChevronUp, Calendar, Filter, Eye, XCircle, CheckCircle,
} from 'lucide-react';

interface ExecOverview {
  configs: { total: number; active: number };
  blackouts: { total: number; currently_active: number; upcoming_24h: number };
  recent_execution: {
    total: number; avg_spread: number; avg_slippage: number;
    total_commissions: number; partial_fills: number; rejections: number;
    blackout_violations: number;
  };
  daily_summaries: any[];
  kill_switches: any[];
}

interface ExecConfig {
  config_id: string;
  instrument: string;
  session_name: string;
  base_spread_bps: number;
  volatility_spread_mult: number;
  base_slippage_bps: number;
  size_slippage_mult: number;
  size_threshold_lots: number;
  commission_per_lot: number;
  partial_fill_enabled: boolean;
  max_partial_pct: number;
  is_active: boolean;
}

interface Blackout {
  blackout_id: string;
  name: string;
  instruments: string[];
  blackout_start: string;
  blackout_end: string;
  pre_window_mins: number;
  post_window_mins: number;
  action: string;
  severity: string;
  is_active: boolean;
}

interface Trace {
  trace_id: string;
  trade_id: string;
  account_number: string;
  trader_name: string;
  instrument: string;
  direction: string;
  size: number;
  order_status: string;
  intended_price: number;
  fill_price: number;
  spread_applied: number;
  slippage_applied: number;
  commission_charged: number;
  fill_type: string;
  fill_pct: number;
  execution_latency_ms: number;
  market_session: string;
  blackout_active: boolean;
  executed_at: string;
}

interface KillSwitch {
  switch_id: string;
  scope: string;
  target_id: string | null;
  reason: string;
  activated_by: string;
  activated_at: string;
}

const STATUS_COLORS: Record<string, string> = {
  filled: 'bg-green-100 text-green-700',
  partial: 'bg-yellow-100 text-yellow-700',
  rejected: 'bg-red-100 text-red-700',
  pending: 'bg-blue-100 text-blue-700',
};

type TabKey = 'overview' | 'configs' | 'blackouts' | 'traces' | 'kill-switches';

export default function ExecutionPage() {
  const [tab, setTab] = useState<TabKey>('overview');
  const [overview, setOverview] = useState<ExecOverview | null>(null);
  const [configs, setConfigs] = useState<ExecConfig[]>([]);
  const [blackouts, setBlackouts] = useState<Blackout[]>([]);
  const [traces, setTraces] = useState<Trace[]>([]);
  const [killSwitches, setKillSwitches] = useState<KillSwitch[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewBlackout, setShowNewBlackout] = useState(false);
  const [showNewConfig, setShowNewConfig] = useState(false);
  const [newBlackout, setNewBlackout] = useState({ name: '', instruments: '', blackout_start: '', blackout_end: '', action: 'block', severity: 'high', pre_window_mins: 15, post_window_mins: 10 });
  const [newConfig, setNewConfig] = useState({ instrument: '', session_name: 'default', base_spread_bps: 2, base_slippage_bps: 1, commission_per_lot: 3.5 });

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      if (tab === 'overview') {
        const res = await fetch('/api/prop-sharing/execution');
        const d = await res.json();
        if (d.success) setOverview(d.data);
      } else if (tab === 'configs') {
        const res = await fetch('/api/prop-sharing/execution?section=configs');
        const d = await res.json();
        if (d.success) setConfigs(d.data.configs);
      } else if (tab === 'blackouts') {
        const res = await fetch('/api/prop-sharing/execution?section=blackouts');
        const d = await res.json();
        if (d.success) setBlackouts(d.data.blackouts);
      } else if (tab === 'traces') {
        const res = await fetch('/api/prop-sharing/execution?section=traces');
        const d = await res.json();
        if (d.success) setTraces(d.data.traces);
      } else if (tab === 'kill-switches') {
        const res = await fetch('/api/prop-sharing/execution?section=kill-switches');
        const d = await res.json();
        if (d.success) setKillSwitches(d.data.kill_switches);
      }
    } catch {}
    setLoading(false);
  }, [tab]);

  useEffect(() => { loadData(); }, [loadData]);

  const createBlackout = async () => {
    try {
      await fetch('/api/prop-sharing/execution', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'create_blackout', ...newBlackout, instruments: newBlackout.instruments.split(',').map(s => s.trim()) }),
      });
      setShowNewBlackout(false);
      setNewBlackout({ name: '', instruments: '', blackout_start: '', blackout_end: '', action: 'block', severity: 'high', pre_window_mins: 15, post_window_mins: 10 });
      loadData();
    } catch {}
  };

  const createConfig = async () => {
    try {
      await fetch('/api/prop-sharing/execution', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'create_config', ...newConfig }),
      });
      setShowNewConfig(false);
      setNewConfig({ instrument: '', session_name: 'default', base_spread_bps: 2, base_slippage_bps: 1, commission_per_lot: 3.5 });
      loadData();
    } catch {}
  };

  const toggleKillSwitch = async (scope: string, targetId: string | null, active: boolean, reason?: string) => {
    try {
      await fetch('/api/prop-sharing/execution', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'toggle_kill_switch', scope, target_id: targetId, is_active: active, reason: reason || 'Manual toggle', activated_by: 'admin' }),
      });
      loadData();
    } catch {}
  };

  const tabs: { key: TabKey; label: string; icon: any }[] = [
    { key: 'overview', label: 'Overview', icon: BarChart3 },
    { key: 'configs', label: 'Configs', icon: Settings },
    { key: 'blackouts', label: 'Blackouts', icon: Shield },
    { key: 'traces', label: 'Traces', icon: Activity },
    { key: 'kill-switches', label: 'Kill Switches', icon: Power },
  ];

  const o = overview || {
    configs: { total: 0, active: 0 },
    blackouts: { total: 0, currently_active: 0, upcoming_24h: 0 },
    recent_execution: { total: 0, avg_spread: 0, avg_slippage: 0, total_commissions: 0, partial_fills: 0, rejections: 0, blackout_violations: 0 },
    daily_summaries: [],
    kill_switches: [],
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Zap className="w-6 h-6 text-amber-600" /> Execution Architecture
          </h1>
          <p className="text-sm text-gray-500 mt-1">Simulated fills, spread/slippage modeling, blackouts, and kill switches.</p>
        </div>
        <button onClick={loadData} className="flex items-center gap-2 px-3 py-2 text-sm bg-white border border-gray-200 rounded-lg hover:bg-gray-50">
          <RefreshCw className="w-4 h-4" /> Refresh
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-white rounded-lg border border-gray-200 p-1">
        {tabs.map(({ key, label, icon: Icon }) => (
          <button key={key} onClick={() => setTab(key)}
            className={`flex items-center gap-2 px-4 py-2 text-sm rounded-md transition-all ${tab === key ? 'bg-amber-50 text-amber-800 font-medium' : 'text-gray-600 hover:bg-gray-50'}`}>
            <Icon className="w-4 h-4" /> {label}
          </button>
        ))}
      </div>

      {loading && <div className="flex items-center justify-center py-12"><Activity className="w-5 h-5 animate-spin text-gray-400" /></div>}

      {/* ── Overview ── */}
      {!loading && tab === 'overview' && (
        <div className="space-y-6">
          {/* Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: 'Active Configs', value: o.configs.active, icon: Settings, color: 'blue' },
              { label: 'Trades (24h)', value: o.recent_execution.total, icon: Activity, color: 'green' },
              { label: 'Avg Spread (bps)', value: Number(o.recent_execution.avg_spread).toFixed(2), icon: TrendingUp, color: 'amber' },
              { label: 'Active Kill Switches', value: o.kill_switches.length, icon: Power, color: o.kill_switches.length > 0 ? 'red' : 'green' },
            ].map(({ label, value, icon: Icon, color }) => (
              <div key={label} className="bg-white rounded-xl border border-gray-100 p-4">
                <div className="flex items-center justify-between mb-2"><Icon size={16} className={`text-${color}-600`} /></div>
                <p className="text-2xl font-bold text-gray-900">{value}</p>
                <p className="text-xs text-gray-500 mt-1">{label}</p>
              </div>
            ))}
          </div>

          {/* 24h Execution Stats */}
          <div className="bg-white rounded-xl border border-gray-100 p-6">
            <h2 className="text-sm font-semibold text-gray-900 mb-4">Last 24 Hours</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: 'Avg Slippage (bps)', value: Number(o.recent_execution.avg_slippage).toFixed(2) },
                { label: 'Total Commissions', value: `$${Number(o.recent_execution.total_commissions).toFixed(2)}` },
                { label: 'Partial Fills', value: o.recent_execution.partial_fills },
                { label: 'Rejections', value: o.recent_execution.rejections },
              ].map(({ label, value }) => (
                <div key={label} className="text-center p-3 bg-gray-50 rounded-lg">
                  <p className="text-lg font-bold text-gray-900">{value}</p>
                  <p className="text-xs text-gray-500">{label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Blackout Status */}
          <div className="bg-white rounded-xl border border-gray-100 p-6">
            <h2 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Shield className="w-4 h-4 text-amber-600" /> Blackout Status
            </h2>
            <div className="flex gap-6">
              <div className="text-center">
                <p className={`text-2xl font-bold ${Number(o.blackouts.currently_active) > 0 ? 'text-red-600' : 'text-green-600'}`}>
                  {o.blackouts.currently_active}
                </p>
                <p className="text-xs text-gray-500">Currently Active</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-amber-600">{o.blackouts.upcoming_24h}</p>
                <p className="text-xs text-gray-500">Upcoming (24h)</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-gray-600">{o.recent_execution.blackout_violations}</p>
                <p className="text-xs text-gray-500">Violations (24h)</p>
              </div>
            </div>
          </div>

          {/* Active Kill Switches */}
          {o.kill_switches.length > 0 && (
            <div className="bg-red-50 rounded-xl border border-red-200 p-6">
              <h2 className="text-sm font-semibold text-red-800 mb-3 flex items-center gap-2">
                <Power className="w-4 h-4" /> Active Kill Switches
              </h2>
              <div className="space-y-2">
                {o.kill_switches.map((ks: any) => (
                  <div key={ks.switch_id} className="flex items-center justify-between bg-white rounded-lg p-3 border border-red-100">
                    <div>
                      <span className="text-sm font-medium text-red-800">{ks.scope.toUpperCase()}</span>
                      {ks.target_id && <span className="text-xs text-red-600 ml-2">Target: {ks.target_id}</span>}
                      <p className="text-xs text-gray-500">{ks.reason}</p>
                    </div>
                    <button onClick={() => toggleKillSwitch(ks.scope, ks.target_id, false)}
                      className="text-xs px-3 py-1 bg-green-100 text-green-700 rounded-lg hover:bg-green-200">
                      Deactivate
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Daily Summaries */}
          {o.daily_summaries.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-100 p-6">
              <h2 className="text-sm font-semibold text-gray-900 mb-4">Daily Summaries (7d)</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead><tr className="border-b border-gray-100">
                    <th className="text-left py-2 text-gray-500 font-medium">Date</th>
                    <th className="text-right py-2 text-gray-500 font-medium">Orders</th>
                    <th className="text-right py-2 text-gray-500 font-medium">Fills</th>
                    <th className="text-right py-2 text-gray-500 font-medium">Partials</th>
                    <th className="text-right py-2 text-gray-500 font-medium">Avg Spread</th>
                    <th className="text-right py-2 text-gray-500 font-medium">Commissions</th>
                  </tr></thead>
                  <tbody>
                    {o.daily_summaries.map((s: any) => (
                      <tr key={s.summary_id} className="border-b border-gray-50">
                        <td className="py-2 text-gray-900">{new Date(s.summary_date).toLocaleDateString()}</td>
                        <td className="py-2 text-right">{s.total_orders}</td>
                        <td className="py-2 text-right text-green-700">{s.fills}</td>
                        <td className="py-2 text-right text-yellow-700">{s.partial_fills}</td>
                        <td className="py-2 text-right">{Number(s.avg_spread_bps).toFixed(2)} bps</td>
                        <td className="py-2 text-right">${Number(s.total_commissions).toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Configs ── */}
      {!loading && tab === 'configs' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button onClick={() => setShowNewConfig(!showNewConfig)}
              className="flex items-center gap-2 px-4 py-2 text-sm bg-amber-700 text-white rounded-lg hover:bg-amber-800">
              <Plus className="w-4 h-4" /> Add Config
            </button>
          </div>

          {showNewConfig && (
            <div className="bg-white rounded-xl border border-amber-200 p-6 space-y-4">
              <h3 className="text-sm font-semibold text-gray-900">New Execution Config</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <input placeholder="Instrument (e.g. XAUUSD)" value={newConfig.instrument}
                  onChange={e => setNewConfig({ ...newConfig, instrument: e.target.value })}
                  className="px-3 py-2 border border-gray-200 rounded-lg text-sm" />
                <select value={newConfig.session_name} onChange={e => setNewConfig({ ...newConfig, session_name: e.target.value })}
                  className="px-3 py-2 border border-gray-200 rounded-lg text-sm">
                  <option value="default">Default</option>
                  <option value="london">London</option>
                  <option value="new_york">New York</option>
                  <option value="asia">Asia</option>
                </select>
                <input type="number" step="0.1" placeholder="Spread (bps)" value={newConfig.base_spread_bps}
                  onChange={e => setNewConfig({ ...newConfig, base_spread_bps: Number(e.target.value) })}
                  className="px-3 py-2 border border-gray-200 rounded-lg text-sm" />
                <input type="number" step="0.1" placeholder="Slippage (bps)" value={newConfig.base_slippage_bps}
                  onChange={e => setNewConfig({ ...newConfig, base_slippage_bps: Number(e.target.value) })}
                  className="px-3 py-2 border border-gray-200 rounded-lg text-sm" />
                <input type="number" step="0.5" placeholder="Commission/lot" value={newConfig.commission_per_lot}
                  onChange={e => setNewConfig({ ...newConfig, commission_per_lot: Number(e.target.value) })}
                  className="px-3 py-2 border border-gray-200 rounded-lg text-sm" />
              </div>
              <button onClick={createConfig} className="px-4 py-2 text-sm bg-amber-700 text-white rounded-lg hover:bg-amber-800">Create</button>
            </div>
          )}

          {configs.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-100 p-12 text-center">
              <Settings className="w-8 h-8 text-gray-300 mx-auto mb-2" />
              <p className="text-sm text-gray-500">No execution configs. Add one to configure spread/slippage models.</p>
            </div>
          ) : (
            <div className="grid gap-4">
              {configs.map(c => (
                <div key={c.config_id} className="bg-white rounded-xl border border-gray-100 p-5">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-bold text-gray-900">{c.instrument}</span>
                      <span className="text-xs px-2 py-0.5 bg-blue-50 text-blue-700 rounded">{c.session_name}</span>
                      {!c.is_active && <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-500 rounded">Inactive</span>}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                    <div><p className="text-xs text-gray-400">Base Spread</p><p className="font-medium">{c.base_spread_bps} bps</p></div>
                    <div><p className="text-xs text-gray-400">Spread Mult</p><p className="font-medium">{c.volatility_spread_mult}x</p></div>
                    <div><p className="text-xs text-gray-400">Base Slippage</p><p className="font-medium">{c.base_slippage_bps} bps</p></div>
                    <div><p className="text-xs text-gray-400">Size Slip Mult</p><p className="font-medium">{c.size_slippage_mult}x</p></div>
                    <div><p className="text-xs text-gray-400">Size Threshold</p><p className="font-medium">{c.size_threshold_lots} lots</p></div>
                    <div><p className="text-xs text-gray-400">Commission</p><p className="font-medium">${c.commission_per_lot}/lot</p></div>
                    <div><p className="text-xs text-gray-400">Partial Fills</p><p className="font-medium">{c.partial_fill_enabled ? `Yes (max ${c.max_partial_pct}%)` : 'No'}</p></div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Blackouts ── */}
      {!loading && tab === 'blackouts' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button onClick={() => setShowNewBlackout(!showNewBlackout)}
              className="flex items-center gap-2 px-4 py-2 text-sm bg-amber-700 text-white rounded-lg hover:bg-amber-800">
              <Plus className="w-4 h-4" /> Add Blackout
            </button>
          </div>

          {showNewBlackout && (
            <div className="bg-white rounded-xl border border-amber-200 p-6 space-y-4">
              <h3 className="text-sm font-semibold text-gray-900">New News Blackout</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <input placeholder="Name (e.g. NFP Release)" value={newBlackout.name}
                  onChange={e => setNewBlackout({ ...newBlackout, name: e.target.value })}
                  className="px-3 py-2 border border-gray-200 rounded-lg text-sm" />
                <input placeholder="Instruments (comma-sep)" value={newBlackout.instruments}
                  onChange={e => setNewBlackout({ ...newBlackout, instruments: e.target.value })}
                  className="px-3 py-2 border border-gray-200 rounded-lg text-sm" />
                <input type="datetime-local" value={newBlackout.blackout_start}
                  onChange={e => setNewBlackout({ ...newBlackout, blackout_start: e.target.value })}
                  className="px-3 py-2 border border-gray-200 rounded-lg text-sm" />
                <input type="datetime-local" value={newBlackout.blackout_end}
                  onChange={e => setNewBlackout({ ...newBlackout, blackout_end: e.target.value })}
                  className="px-3 py-2 border border-gray-200 rounded-lg text-sm" />
                <select value={newBlackout.action} onChange={e => setNewBlackout({ ...newBlackout, action: e.target.value })}
                  className="px-3 py-2 border border-gray-200 rounded-lg text-sm">
                  <option value="block">Block</option>
                  <option value="warn">Warn</option>
                  <option value="log_only">Log Only</option>
                </select>
                <select value={newBlackout.severity} onChange={e => setNewBlackout({ ...newBlackout, severity: e.target.value })}
                  className="px-3 py-2 border border-gray-200 rounded-lg text-sm">
                  <option value="critical">Critical</option>
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                </select>
              </div>
              <button onClick={createBlackout} className="px-4 py-2 text-sm bg-amber-700 text-white rounded-lg hover:bg-amber-800">Create</button>
            </div>
          )}

          {blackouts.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-100 p-12 text-center">
              <Shield className="w-8 h-8 text-gray-300 mx-auto mb-2" />
              <p className="text-sm text-gray-500">No news blackouts configured.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {blackouts.map(b => {
                const isActive = new Date(b.blackout_start) <= new Date() && new Date(b.blackout_end) >= new Date();
                const isPast = new Date(b.blackout_end) < new Date();
                return (
                  <div key={b.blackout_id} className={`bg-white rounded-xl border p-5 ${isActive ? 'border-red-200 bg-red-50' : 'border-gray-100'}`}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-bold text-gray-900">{b.name}</span>
                        <span className={`text-xs px-2 py-0.5 rounded ${isActive ? 'bg-red-100 text-red-700' : isPast ? 'bg-gray-100 text-gray-500' : 'bg-amber-100 text-amber-700'}`}>
                          {isActive ? 'ACTIVE' : isPast ? 'Past' : 'Upcoming'}
                        </span>
                        <span className={`text-xs px-2 py-0.5 rounded ${b.action === 'block' ? 'bg-red-100 text-red-700' : b.action === 'warn' ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-500'}`}>
                          {b.action.toUpperCase()}
                        </span>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                      <div><p className="text-xs text-gray-400">Instruments</p><p className="font-medium">{b.instruments?.join(', ') || 'All'}</p></div>
                      <div><p className="text-xs text-gray-400">Start</p><p className="font-medium">{new Date(b.blackout_start).toLocaleString()}</p></div>
                      <div><p className="text-xs text-gray-400">End</p><p className="font-medium">{new Date(b.blackout_end).toLocaleString()}</p></div>
                      <div><p className="text-xs text-gray-400">Windows</p><p className="font-medium">-{b.pre_window_mins}m / +{b.post_window_mins}m</p></div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── Traces ── */}
      {!loading && tab === 'traces' && (
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          {traces.length === 0 ? (
            <div className="p-12 text-center">
              <Activity className="w-8 h-8 text-gray-300 mx-auto mb-2" />
              <p className="text-sm text-gray-500">No execution traces yet. Traces are created when trades are simulated.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="bg-gray-50 border-b border-gray-100">
                  <th className="text-left px-4 py-3 text-gray-500 font-medium">Trader</th>
                  <th className="text-left px-4 py-3 text-gray-500 font-medium">Instrument</th>
                  <th className="text-center px-4 py-3 text-gray-500 font-medium">Status</th>
                  <th className="text-right px-4 py-3 text-gray-500 font-medium">Intended</th>
                  <th className="text-right px-4 py-3 text-gray-500 font-medium">Filled</th>
                  <th className="text-right px-4 py-3 text-gray-500 font-medium">Spread</th>
                  <th className="text-right px-4 py-3 text-gray-500 font-medium">Slippage</th>
                  <th className="text-right px-4 py-3 text-gray-500 font-medium">Commission</th>
                  <th className="text-right px-4 py-3 text-gray-500 font-medium">Latency</th>
                  <th className="text-left px-4 py-3 text-gray-500 font-medium">Time</th>
                </tr></thead>
                <tbody>
                  {traces.map(t => (
                    <tr key={t.trace_id} className="border-b border-gray-50 hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <p className="font-medium text-gray-900">{t.trader_name}</p>
                        <p className="text-xs text-gray-400">{t.account_number}</p>
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-medium">{t.instrument}</span>
                        <span className={`ml-2 text-xs ${t.direction === 'long' ? 'text-green-600' : 'text-red-600'}`}>{t.direction?.toUpperCase()}</span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`text-xs px-2 py-0.5 rounded ${STATUS_COLORS[t.order_status] || 'bg-gray-100 text-gray-600'}`}>
                          {t.order_status}{t.fill_type === 'partial' ? ` (${t.fill_pct}%)` : ''}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-xs">{Number(t.intended_price).toFixed(4)}</td>
                      <td className="px-4 py-3 text-right font-mono text-xs">{Number(t.fill_price).toFixed(4)}</td>
                      <td className="px-4 py-3 text-right text-xs">{Number(t.spread_applied).toFixed(2)} bps</td>
                      <td className="px-4 py-3 text-right text-xs">{Number(t.slippage_applied).toFixed(2)} bps</td>
                      <td className="px-4 py-3 text-right text-xs">${Number(t.commission_charged).toFixed(2)}</td>
                      <td className="px-4 py-3 text-right text-xs">{t.execution_latency_ms}ms</td>
                      <td className="px-4 py-3 text-xs text-gray-500">{new Date(t.executed_at).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── Kill Switches ── */}
      {!loading && tab === 'kill-switches' && (
        <div className="space-y-4">
          {/* Quick Toggle Buttons */}
          <div className="bg-white rounded-xl border border-gray-100 p-6">
            <h3 className="text-sm font-semibold text-gray-900 mb-4">Emergency Controls</h3>
            <div className="flex flex-wrap gap-3">
              <button onClick={() => toggleKillSwitch('firm', null, true, 'Emergency firm-wide halt')}
                className="px-4 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center gap-2">
                <Power className="w-4 h-4" /> Firm Kill Switch
              </button>
              <button onClick={() => {
                const inst = prompt('Enter instrument to halt (e.g. XAUUSD):');
                if (inst) toggleKillSwitch('instrument', inst, true, `Manual halt: ${inst}`);
              }}
                className="px-4 py-2 text-sm bg-orange-600 text-white rounded-lg hover:bg-orange-700 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" /> Halt Instrument
              </button>
            </div>
          </div>

          {/* Active Kill Switches */}
          <div className="bg-white rounded-xl border border-gray-100 p-6">
            <h3 className="text-sm font-semibold text-gray-900 mb-4">Active Kill Switches</h3>
            {killSwitches.length === 0 ? (
              <div className="text-center py-6">
                <CheckCircle className="w-8 h-8 text-green-400 mx-auto mb-2" />
                <p className="text-sm text-gray-500">No active kill switches. All systems operational.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {killSwitches.map((ks: any) => (
                  <div key={ks.switch_id} className="flex items-center justify-between bg-red-50 rounded-lg p-4 border border-red-200">
                    <div>
                      <div className="flex items-center gap-2">
                        <Power className="w-4 h-4 text-red-600" />
                        <span className="text-sm font-semibold text-red-800">{ks.scope.toUpperCase()}</span>
                        {ks.target_id && <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded">{ks.target_id}</span>}
                      </div>
                      <p className="text-xs text-gray-600 mt-1">{ks.reason}</p>
                      <p className="text-xs text-gray-400 mt-0.5">Activated: {new Date(ks.activated_at).toLocaleString()}</p>
                    </div>
                    <button onClick={() => toggleKillSwitch(ks.scope, ks.target_id, false)}
                      className="px-4 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700">
                      Deactivate
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
