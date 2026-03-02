'use client';

import React, { useEffect, useState, useCallback } from 'react';
import {
  Landmark, RefreshCw, ShieldCheck, AlertTriangle, TrendingUp, TrendingDown,
  Pause, Play, Activity, Zap, DollarSign, BarChart3, Settings,
} from 'lucide-react';

interface ThrottleState {
  status: string;
  buffer_health: number;
  available_capital: number;
  reserve_required: number;
  reserve_actual: number;
  reserve_pct: number;
  funded_count: number;
  funded_cap: number;
  scaling_paused: boolean;
  new_funding_paused: boolean;
  reason: string;
  checked_at: string;
}

interface StressTest {
  test_id: number;
  scenario_name: string;
  scenario_type: string;
  gap_pct: number;
  correlation_shock: number;
  estimated_loss: number;
  capital_remaining: number;
  survival: boolean;
  survival_score: number;
  affected_accounts: number;
  run_at: string;
}

interface CapitalSnapshot {
  snapshot_date: string;
  total_capital: number;
  deployed_capital: number;
  reserve_capital: number;
  unrealized_pnl: number;
  retained_earnings: number;
  eval_fee_revenue: number;
  payout_obligations: number;
  net_position: number;
  firm_volatility_30d: number;
  throttle_status: string;
}

interface ReservePolicy {
  policy_id: number;
  name: string;
  min_reserve_absolute: number;
  min_reserve_pct: number;
  dynamic_buffer_enabled: boolean;
  volatility_lookback_days: number;
  volatility_buffer_mult: number;
  max_funded_traders: number;
  max_total_notional: number;
  max_per_instrument: number;
  max_per_sector_pct: number;
  stress_gap_pct: number;
  stress_correlation: number;
}

type Tab = 'overview' | 'stress-tests' | 'snapshots' | 'policy';

export default function TreasuryGuardPage() {
  const [tab, setTab] = useState<Tab>('overview');
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);

  const [throttle, setThrottle] = useState<ThrottleState | null>(null);
  const [policy, setPolicy] = useState<ReservePolicy | null>(null);
  const [stressTests, setStressTests] = useState<StressTest[]>([]);
  const [snapshots, setSnapshots] = useState<CapitalSnapshot[]>([]);

  const [policyEdits, setPolicyEdits] = useState<Record<string, any>>({});

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/prop-sharing/treasury-guard');
      const json = await res.json();
      if (json.success) {
        setThrottle(json.data.throttle);
        setPolicy(json.data.policy);
        setStressTests(json.data.stress_tests || []);
        setSnapshots(json.data.snapshots || []);
        if (json.data.policy) setPolicyEdits({});
      }
    } catch (err) { console.error(err); }
    setLoading(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const runHealthCheck = async () => {
    setRunning(true);
    try {
      const res = await fetch('/api/prop-sharing/treasury-guard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'health_check' }),
      });
      const json = await res.json();
      if (json.success) {
        await fetchData();
      }
    } catch (err) { console.error(err); }
    setRunning(false);
  };

  const updatePolicy = async () => {
    if (!policy || Object.keys(policyEdits).length === 0) return;
    try {
      await fetch('/api/prop-sharing/treasury-guard', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'update_policy', policy_id: policy.policy_id, ...policyEdits }),
      });
      setPolicyEdits({});
      await fetchData();
    } catch (err) { console.error(err); }
  };

  const fmtCurrency = (v: number) => {
    if (v >= 1_000_000) return `$${(v / 1_000_000).toFixed(1)}M`;
    if (v >= 1_000) return `$${(v / 1_000).toFixed(0)}K`;
    return `$${v.toFixed(0)}`;
  };

  const statusColor = (s: string) => {
    switch (s) {
      case 'normal': return 'bg-green-100 text-green-800';
      case 'caution': return 'bg-yellow-100 text-yellow-800';
      case 'throttled': return 'bg-orange-100 text-orange-800';
      case 'frozen': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const healthBarColor = (h: number) => {
    if (h >= 80) return 'bg-green-500';
    if (h >= 50) return 'bg-yellow-500';
    if (h >= 25) return 'bg-orange-500';
    return 'bg-red-500';
  };

  const tabs: { key: Tab; label: string; icon: React.ReactNode }[] = [
    { key: 'overview', label: 'Overview', icon: <Landmark className="w-4 h-4" /> },
    { key: 'stress-tests', label: 'Stress Tests', icon: <Zap className="w-4 h-4" /> },
    { key: 'snapshots', label: 'Capital History', icon: <BarChart3 className="w-4 h-4" /> },
    { key: 'policy', label: 'Policy', icon: <Settings className="w-4 h-4" /> },
  ];

  if (loading) {
    return (
      <div className="p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3" />
          <div className="h-64 bg-gray-200 rounded" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Landmark className="w-6 h-6 text-emerald-600" />
            Treasury Capital Guard
          </h1>
          <p className="text-gray-500 mt-1">Reserve management, throttle control, and stress testing</p>
        </div>
        <button
          onClick={runHealthCheck}
          disabled={running}
          className="flex items-center gap-2 bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${running ? 'animate-spin' : ''}`} />
          {running ? 'Running...' : 'Run Health Check'}
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-gray-100 p-1 rounded-lg w-fit">
        {tabs.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              tab === t.key ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {/* ── OVERVIEW TAB ── */}
      {tab === 'overview' && (
        <div className="space-y-6">
          {/* Buffer Health Gauge */}
          {throttle && (
            <div className="bg-white rounded-xl border p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold flex items-center gap-2">
                  <Activity className="w-5 h-5" />
                  Buffer Health
                </h2>
                <span className={`px-3 py-1 rounded-full text-sm font-semibold ${statusColor(throttle.status)}`}>
                  {throttle.status.toUpperCase()}
                </span>
              </div>

              {/* Health Bar */}
              <div className="mb-4">
                <div className="flex justify-between text-sm text-gray-500 mb-1">
                  <span>Reserve Health</span>
                  <span className="font-bold text-gray-900">{throttle.buffer_health}%</span>
                </div>
                <div className="w-full h-6 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-1000 ${healthBarColor(throttle.buffer_health)}`}
                    style={{ width: `${throttle.buffer_health}%` }}
                  />
                </div>
                <div className="flex justify-between text-xs text-gray-400 mt-1">
                  <span>Frozen &lt;25%</span>
                  <span>Throttled &lt;50%</span>
                  <span>Caution &lt;80%</span>
                  <span>Normal 80%+</span>
                </div>
              </div>

              {/* Stats Row */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-500">Available Capital</p>
                  <p className="text-lg font-bold">{fmtCurrency(parseFloat(String(throttle.available_capital)))}</p>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-500">Reserve Required</p>
                  <p className="text-lg font-bold">{fmtCurrency(parseFloat(String(throttle.reserve_required)))}</p>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-500">Funded Traders</p>
                  <p className="text-lg font-bold">{throttle.funded_count} / {throttle.funded_cap}</p>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-500">Reserve Actual</p>
                  <p className="text-lg font-bold">{fmtCurrency(parseFloat(String(throttle.reserve_actual)))}</p>
                </div>
              </div>

              {/* Pause indicators */}
              <div className="flex gap-4 mt-4">
                <div className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium ${
                  throttle.scaling_paused ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'
                }`}>
                  {throttle.scaling_paused ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                  Scaling: {throttle.scaling_paused ? 'PAUSED' : 'Active'}
                </div>
                <div className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium ${
                  throttle.new_funding_paused ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'
                }`}>
                  {throttle.new_funding_paused ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                  New Funding: {throttle.new_funding_paused ? 'PAUSED' : 'Active'}
                </div>
              </div>

              <p className="text-sm text-gray-500 mt-3">{throttle.reason}</p>
              <p className="text-xs text-gray-400 mt-1">Last checked: {new Date(throttle.checked_at).toLocaleString()}</p>
            </div>
          )}

          {!throttle && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6 text-center">
              <AlertTriangle className="w-8 h-8 text-yellow-500 mx-auto mb-2" />
              <p className="text-yellow-800 font-medium">No throttle data available</p>
              <p className="text-yellow-600 text-sm mt-1">Run a health check to initialize treasury monitoring</p>
            </div>
          )}

          {/* Recent Stress Tests */}
          {stressTests.length > 0 && (
            <div className="bg-white rounded-xl border p-6">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Zap className="w-5 h-5" /> Recent Stress Tests
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {stressTests.slice(0, 4).map(test => (
                  <div key={test.test_id} className={`p-4 rounded-lg border ${
                    test.survival ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'
                  }`}>
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium text-sm">{test.scenario_name}</p>
                        <p className="text-xs text-gray-500">{test.gap_pct}% gap</p>
                      </div>
                      <span className={`px-2 py-1 rounded text-xs font-bold ${
                        test.survival ? 'bg-green-200 text-green-800' : 'bg-red-200 text-red-800'
                      }`}>
                        {test.survival ? 'SURVIVES' : 'FAILS'}
                      </span>
                    </div>
                    <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <span className="text-gray-500">Est. Loss:</span>{' '}
                        <span className="font-semibold text-red-600">-{fmtCurrency(parseFloat(String(test.estimated_loss)))}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Survival:</span>{' '}
                        <span className="font-semibold">{test.survival_score}%</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recent Capital Snapshots */}
          {snapshots.length > 0 && (
            <div className="bg-white rounded-xl border p-6">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <DollarSign className="w-5 h-5" /> Capital Snapshots (Last 14 Days)
              </h2>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-gray-500 border-b">
                      <th className="pb-2">Date</th>
                      <th className="pb-2">Total</th>
                      <th className="pb-2">Deployed</th>
                      <th className="pb-2">Reserve</th>
                      <th className="pb-2">Retained</th>
                      <th className="pb-2">Vol (30d)</th>
                      <th className="pb-2">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {snapshots.map(s => (
                      <tr key={s.snapshot_date} className="border-b border-gray-50 hover:bg-gray-50">
                        <td className="py-2">{new Date(s.snapshot_date).toLocaleDateString()}</td>
                        <td className="py-2 font-medium">{fmtCurrency(parseFloat(String(s.total_capital)))}</td>
                        <td className="py-2">{fmtCurrency(parseFloat(String(s.deployed_capital)))}</td>
                        <td className="py-2">{fmtCurrency(parseFloat(String(s.reserve_capital)))}</td>
                        <td className="py-2">
                          <span className={parseFloat(String(s.retained_earnings)) >= 0 ? 'text-green-600' : 'text-red-600'}>
                            {fmtCurrency(parseFloat(String(s.retained_earnings)))}
                          </span>
                        </td>
                        <td className="py-2">{fmtCurrency(parseFloat(String(s.firm_volatility_30d)))}</td>
                        <td className="py-2">
                          <span className={`px-2 py-0.5 rounded text-xs font-medium ${statusColor(s.throttle_status)}`}>
                            {s.throttle_status}
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
      )}

      {/* ── STRESS TESTS TAB ── */}
      {tab === 'stress-tests' && (
        <div className="bg-white rounded-xl border p-6">
          <h2 className="text-lg font-semibold mb-4">Stress Test History</h2>
          {stressTests.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No stress tests run yet. Click "Run Health Check" to generate.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-gray-500 border-b">
                    <th className="pb-2">Scenario</th>
                    <th className="pb-2">Type</th>
                    <th className="pb-2">Gap %</th>
                    <th className="pb-2">Correlation</th>
                    <th className="pb-2">Est. Loss</th>
                    <th className="pb-2">Remaining</th>
                    <th className="pb-2">Score</th>
                    <th className="pb-2">Result</th>
                    <th className="pb-2">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {stressTests.map(t => (
                    <tr key={t.test_id} className="border-b border-gray-50 hover:bg-gray-50">
                      <td className="py-2 font-medium">{t.scenario_name}</td>
                      <td className="py-2 capitalize">{t.scenario_type.replace('_', ' ')}</td>
                      <td className="py-2">{parseFloat(String(t.gap_pct)).toFixed(1)}%</td>
                      <td className="py-2">{parseFloat(String(t.correlation_shock)).toFixed(2)}</td>
                      <td className="py-2 text-red-600">-{fmtCurrency(parseFloat(String(t.estimated_loss)))}</td>
                      <td className="py-2">{fmtCurrency(parseFloat(String(t.capital_remaining)))}</td>
                      <td className="py-2">
                        <div className="flex items-center gap-1">
                          <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div className={`h-full rounded-full ${t.survival_score >= 50 ? 'bg-green-500' : 'bg-red-500'}`}
                              style={{ width: `${t.survival_score}%` }} />
                          </div>
                          <span className="text-xs">{t.survival_score}%</span>
                        </div>
                      </td>
                      <td className="py-2">
                        <span className={`px-2 py-0.5 rounded text-xs font-bold ${
                          t.survival ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {t.survival ? 'PASS' : 'FAIL'}
                        </span>
                      </td>
                      <td className="py-2 text-gray-500">{new Date(t.run_at).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── SNAPSHOTS TAB ── */}
      {tab === 'snapshots' && (
        <div className="bg-white rounded-xl border p-6">
          <h2 className="text-lg font-semibold mb-4">Capital Snapshot History</h2>
          {snapshots.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No snapshots yet. Run a health check to capture capital state.</p>
          ) : (
            <div className="space-y-4">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-gray-500 border-b">
                      <th className="pb-2">Date</th>
                      <th className="pb-2">Total</th>
                      <th className="pb-2">Deployed</th>
                      <th className="pb-2">Reserve</th>
                      <th className="pb-2">P&L (Unreal.)</th>
                      <th className="pb-2">Retained</th>
                      <th className="pb-2">Eval Revenue</th>
                      <th className="pb-2">Payouts</th>
                      <th className="pb-2">Net</th>
                      <th className="pb-2">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {snapshots.map((s, i) => {
                      const prevRetained = i < snapshots.length - 1 ? parseFloat(String(snapshots[i + 1]?.retained_earnings || 0)) : 0;
                      const curRetained = parseFloat(String(s.retained_earnings));
                      const trend = i < snapshots.length - 1 ? curRetained - prevRetained : 0;
                      return (
                        <tr key={s.snapshot_date} className="border-b border-gray-50 hover:bg-gray-50">
                          <td className="py-2">{new Date(s.snapshot_date).toLocaleDateString()}</td>
                          <td className="py-2 font-medium">{fmtCurrency(parseFloat(String(s.total_capital)))}</td>
                          <td className="py-2">{fmtCurrency(parseFloat(String(s.deployed_capital)))}</td>
                          <td className="py-2">{fmtCurrency(parseFloat(String(s.reserve_capital)))}</td>
                          <td className="py-2">
                            <span className={parseFloat(String(s.unrealized_pnl)) >= 0 ? 'text-green-600' : 'text-red-600'}>
                              {fmtCurrency(parseFloat(String(s.unrealized_pnl)))}
                            </span>
                          </td>
                          <td className="py-2">
                            <div className="flex items-center gap-1">
                              <span className={curRetained >= 0 ? 'text-green-600' : 'text-red-600'}>
                                {fmtCurrency(curRetained)}
                              </span>
                              {trend !== 0 && (
                                trend > 0
                                  ? <TrendingUp className="w-3 h-3 text-green-500" />
                                  : <TrendingDown className="w-3 h-3 text-red-500" />
                              )}
                            </div>
                          </td>
                          <td className="py-2">{fmtCurrency(parseFloat(String(s.eval_fee_revenue)))}</td>
                          <td className="py-2 text-red-600">-{fmtCurrency(parseFloat(String(s.payout_obligations)))}</td>
                          <td className="py-2 font-medium">{fmtCurrency(parseFloat(String(s.net_position)))}</td>
                          <td className="py-2">
                            <span className={`px-2 py-0.5 rounded text-xs font-medium ${statusColor(s.throttle_status)}`}>
                              {s.throttle_status}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── POLICY TAB ── */}
      {tab === 'policy' && policy && (
        <div className="bg-white rounded-xl border p-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <ShieldCheck className="w-5 h-5" /> Reserve Policy: {policy.name}
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Reserve Minimums */}
            <div className="space-y-4">
              <h3 className="font-medium text-gray-700 border-b pb-2">Reserve Minimums</h3>
              <div>
                <label className="text-xs text-gray-500">Minimum Absolute Reserve ($)</label>
                <input
                  type="number"
                  className="w-full border rounded-lg p-2 mt-1"
                  value={policyEdits.min_reserve_absolute ?? policy.min_reserve_absolute}
                  onChange={e => setPolicyEdits(p => ({ ...p, min_reserve_absolute: parseFloat(e.target.value) }))}
                />
              </div>
              <div>
                <label className="text-xs text-gray-500">Min Reserve % of Exposure</label>
                <input
                  type="number"
                  step="0.1"
                  className="w-full border rounded-lg p-2 mt-1"
                  value={policyEdits.min_reserve_pct ?? policy.min_reserve_pct}
                  onChange={e => setPolicyEdits(p => ({ ...p, min_reserve_pct: parseFloat(e.target.value) }))}
                />
              </div>
            </div>

            {/* Dynamic Buffer */}
            <div className="space-y-4">
              <h3 className="font-medium text-gray-700 border-b pb-2">Dynamic Buffer</h3>
              <div className="flex items-center gap-3">
                <label className="text-xs text-gray-500">Dynamic Buffer Enabled</label>
                <input
                  type="checkbox"
                  className="w-5 h-5 rounded"
                  checked={policyEdits.dynamic_buffer_enabled ?? policy.dynamic_buffer_enabled}
                  onChange={e => setPolicyEdits(p => ({ ...p, dynamic_buffer_enabled: e.target.checked }))}
                />
              </div>
              <div>
                <label className="text-xs text-gray-500">Volatility Lookback (days)</label>
                <input
                  type="number"
                  className="w-full border rounded-lg p-2 mt-1"
                  value={policyEdits.volatility_lookback_days ?? policy.volatility_lookback_days}
                  onChange={e => setPolicyEdits(p => ({ ...p, volatility_lookback_days: parseInt(e.target.value) }))}
                />
              </div>
              <div>
                <label className="text-xs text-gray-500">Volatility Buffer Multiplier</label>
                <input
                  type="number"
                  step="0.1"
                  className="w-full border rounded-lg p-2 mt-1"
                  value={policyEdits.volatility_buffer_mult ?? policy.volatility_buffer_mult}
                  onChange={e => setPolicyEdits(p => ({ ...p, volatility_buffer_mult: parseFloat(e.target.value) }))}
                />
              </div>
            </div>

            {/* Capacity Limits */}
            <div className="space-y-4">
              <h3 className="font-medium text-gray-700 border-b pb-2">Capacity Limits</h3>
              <div>
                <label className="text-xs text-gray-500">Max Funded Traders</label>
                <input
                  type="number"
                  className="w-full border rounded-lg p-2 mt-1"
                  value={policyEdits.max_funded_traders ?? policy.max_funded_traders}
                  onChange={e => setPolicyEdits(p => ({ ...p, max_funded_traders: parseInt(e.target.value) }))}
                />
              </div>
              <div>
                <label className="text-xs text-gray-500">Max Total Notional ($)</label>
                <input
                  type="number"
                  className="w-full border rounded-lg p-2 mt-1"
                  value={policyEdits.max_total_notional ?? policy.max_total_notional}
                  onChange={e => setPolicyEdits(p => ({ ...p, max_total_notional: parseFloat(e.target.value) }))}
                />
              </div>
              <div>
                <label className="text-xs text-gray-500">Max Per Instrument ($)</label>
                <input
                  type="number"
                  className="w-full border rounded-lg p-2 mt-1"
                  value={policyEdits.max_per_instrument ?? policy.max_per_instrument}
                  onChange={e => setPolicyEdits(p => ({ ...p, max_per_instrument: parseFloat(e.target.value) }))}
                />
              </div>
            </div>

            {/* Stress Parameters */}
            <div className="space-y-4">
              <h3 className="font-medium text-gray-700 border-b pb-2">Stress Test Parameters</h3>
              <div>
                <label className="text-xs text-gray-500">Default Gap % for Stress</label>
                <input
                  type="number"
                  step="0.1"
                  className="w-full border rounded-lg p-2 mt-1"
                  value={policyEdits.stress_gap_pct ?? policy.stress_gap_pct}
                  onChange={e => setPolicyEdits(p => ({ ...p, stress_gap_pct: parseFloat(e.target.value) }))}
                />
              </div>
              <div>
                <label className="text-xs text-gray-500">Default Correlation Shock</label>
                <input
                  type="number"
                  step="0.01"
                  className="w-full border rounded-lg p-2 mt-1"
                  value={policyEdits.stress_correlation ?? policy.stress_correlation}
                  onChange={e => setPolicyEdits(p => ({ ...p, stress_correlation: parseFloat(e.target.value) }))}
                />
              </div>
              <div>
                <label className="text-xs text-gray-500">Max Per Sector %</label>
                <input
                  type="number"
                  step="0.1"
                  className="w-full border rounded-lg p-2 mt-1"
                  value={policyEdits.max_per_sector_pct ?? policy.max_per_sector_pct}
                  onChange={e => setPolicyEdits(p => ({ ...p, max_per_sector_pct: parseFloat(e.target.value) }))}
                />
              </div>
            </div>
          </div>

          {Object.keys(policyEdits).length > 0 && (
            <div className="mt-6 flex justify-end">
              <button
                onClick={updatePolicy}
                className="bg-emerald-600 text-white px-6 py-2 rounded-lg hover:bg-emerald-700"
              >
                Save Policy Changes
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
