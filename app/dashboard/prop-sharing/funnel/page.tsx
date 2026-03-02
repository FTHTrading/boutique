'use client';

import React, { useEffect, useState, useCallback } from 'react';
import {
  Target, RefreshCw, TrendingUp, TrendingDown, BarChart3, Users,
  ShieldAlert, ShieldCheck, Ban, CheckCircle, Filter, Megaphone,
  ArrowRight, AlertTriangle, Settings, Plus,
} from 'lucide-react';

interface ChannelQuality {
  source: string;
  total_apps: number;
  approved: number;
  in_eval: number;
  funded: number;
  rejected: number;
  conversion_rate: number;
  fraud_rate: number;
  avg_funded_pnl: number;
  quality_score: number;
  suppressed: boolean;
  suppress_reason: string | null;
  last_calculated: string;
}

interface Cohort {
  cohort_month: string;
  primary_source: string;
  total_applicants: number;
  approved: number;
  funded: number;
  blown: number;
  total_pnl: number;
  avg_time_to_fund_days: number;
  funnel_conversion: number;
  survival_rate_90d: number;
  ltv_per_trader: number;
}

interface FunnelSnapshot {
  snapshot_date: string;
  total_applications: number;
  new_applications_24h: number;
  approved_24h: number;
  total_funded: number;
  total_blown: number;
  overall_conversion: number;
  active_channels: number;
  suppressed_channels: number;
  avg_channel_quality: number;
}

interface SuppressRule {
  rule_id: number;
  metric: string;
  threshold_value: number;
  auto_suppress: boolean;
  is_active: boolean;
}

interface FunnelStats {
  total_applicants: number;
  in_phase1: number;
  in_phase2: number;
  funded: number;
  rejected: number;
  overall_conversion: number;
}

type Tab = 'overview' | 'channels' | 'cohorts' | 'rules';

export default function FunnelPage() {
  const [tab, setTab] = useState<Tab>('overview');
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);

  const [channels, setChannels] = useState<ChannelQuality[]>([]);
  const [cohorts, setCohorts] = useState<Cohort[]>([]);
  const [snapshots, setSnapshots] = useState<FunnelSnapshot[]>([]);
  const [rules, setRules] = useState<SuppressRule[]>([]);
  const [stats, setStats] = useState<FunnelStats | null>(null);

  // New rule form
  const [newRule, setNewRule] = useState({ metric: 'fraud_rate', threshold_value: 30 });

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/prop-sharing/funnel');
      const json = await res.json();
      if (json.success) {
        setChannels(json.data.channels || []);
        setCohorts(json.data.cohorts || []);
        setSnapshots(json.data.snapshots || []);
        setRules(json.data.suppress_rules || []);
        setStats(json.data.funnel_stats || null);
      }
    } catch (err) { console.error(err); }
    setLoading(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const recalculate = async () => {
    setRunning(true);
    try {
      // Calculate channels, cohorts, and take snapshot
      await fetch('/api/prop-sharing/funnel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'calculate_channels' }),
      });
      await fetch('/api/prop-sharing/funnel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'calculate_cohorts' }),
      });
      await fetch('/api/prop-sharing/funnel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'snapshot_funnel' }),
      });
      await fetchData();
    } catch (err) { console.error(err); }
    setRunning(false);
  };

  const suppressChannel = async (source: string) => {
    await fetch('/api/prop-sharing/funnel', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'suppress_channel', source, reason: 'Manual suppression' }),
    });
    await fetchData();
  };

  const unsuppressChannel = async (source: string) => {
    await fetch('/api/prop-sharing/funnel', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'unsuppress_channel', source }),
    });
    await fetchData();
  };

  const createRule = async () => {
    await fetch('/api/prop-sharing/funnel', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'create_suppress_rule', ...newRule }),
    });
    setNewRule({ metric: 'fraud_rate', threshold_value: 30 });
    await fetchData();
  };

  const toggleRule = async (rule_id: number, is_active: boolean) => {
    await fetch('/api/prop-sharing/funnel', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'update_suppress_rule', rule_id, is_active }),
    });
    await fetchData();
  };

  const fmtCurrency = (v: number) => {
    if (v >= 1_000_000) return `$${(v / 1_000_000).toFixed(1)}M`;
    if (v >= 1_000) return `$${(v / 1_000).toFixed(0)}K`;
    return `$${v.toFixed(0)}`;
  };

  const qualityColor = (score: number) => {
    if (score >= 70) return 'text-green-600 bg-green-50';
    if (score >= 40) return 'text-yellow-600 bg-yellow-50';
    return 'text-red-600 bg-red-50';
  };

  const tabs: { key: Tab; label: string; icon: React.ReactNode }[] = [
    { key: 'overview', label: 'Overview', icon: <Target className="w-4 h-4" /> },
    { key: 'channels', label: 'Channels', icon: <Megaphone className="w-4 h-4" /> },
    { key: 'cohorts', label: 'Cohorts', icon: <Users className="w-4 h-4" /> },
    { key: 'rules', label: 'Suppress Rules', icon: <Settings className="w-4 h-4" /> },
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
            <Target className="w-6 h-6 text-violet-600" />
            Funnel Optimization Engine
          </h1>
          <p className="text-gray-500 mt-1">Channel quality, cohort analysis, and acquisition intelligence</p>
        </div>
        <button
          onClick={recalculate}
          disabled={running}
          className="flex items-center gap-2 bg-violet-600 text-white px-4 py-2 rounded-lg hover:bg-violet-700 disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${running ? 'animate-spin' : ''}`} />
          {running ? 'Calculating...' : 'Recalculate All'}
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
          {/* Funnel Stats */}
          {stats && (
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {[
                { label: 'Total Applicants', value: stats.total_applicants, icon: <Users className="w-5 h-5 text-gray-400" /> },
                { label: 'Phase 1', value: stats.in_phase1, icon: <ArrowRight className="w-5 h-5 text-blue-400" /> },
                { label: 'Phase 2', value: stats.in_phase2, icon: <ArrowRight className="w-5 h-5 text-indigo-400" /> },
                { label: 'Funded', value: stats.funded, icon: <CheckCircle className="w-5 h-5 text-green-500" /> },
                { label: 'Conversion', value: `${stats.overall_conversion || 0}%`, icon: <TrendingUp className="w-5 h-5 text-violet-500" /> },
              ].map((s, i) => (
                <div key={i} className="bg-white rounded-xl border p-4 flex items-center gap-3">
                  {s.icon}
                  <div>
                    <p className="text-xs text-gray-500">{s.label}</p>
                    <p className="text-xl font-bold">{s.value}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Funnel Visual */}
          {stats && (
            <div className="bg-white rounded-xl border p-6">
              <h2 className="text-lg font-semibold mb-4">Funnel Flow</h2>
              <div className="flex items-center justify-center gap-2">
                {[
                  { label: 'Applications', count: stats.total_applicants, color: 'bg-gray-500', width: '100%' },
                  { label: 'Phase 1', count: stats.in_phase1, color: 'bg-blue-500', width: stats.total_applicants > 0 ? `${Math.max(20, (stats.in_phase1 + stats.in_phase2 + stats.funded) / stats.total_applicants * 100)}%` : '0%' },
                  { label: 'Phase 2', count: stats.in_phase2, color: 'bg-indigo-500', width: stats.total_applicants > 0 ? `${Math.max(15, (stats.in_phase2 + stats.funded) / stats.total_applicants * 100)}%` : '0%' },
                  { label: 'Funded', count: stats.funded, color: 'bg-green-500', width: stats.total_applicants > 0 ? `${Math.max(10, stats.funded / stats.total_applicants * 100)}%` : '0%' },
                ].map((stage, i) => (
                  <div key={i} className="flex-1 text-center">
                    <div className={`${stage.color} text-white rounded-lg py-3 px-2 mx-1`} style={{ width: stage.width, margin: '0 auto' }}>
                      <p className="text-lg font-bold">{stage.count}</p>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">{stage.label}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Channel Leaderboard (top 5) */}
          {channels.length > 0 && (
            <div className="bg-white rounded-xl border p-6">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Megaphone className="w-5 h-5" /> Top Channels
              </h2>
              <div className="space-y-3">
                {channels.filter(c => !c.suppressed).slice(0, 5).map((ch, i) => (
                  <div key={ch.source} className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
                    <span className="text-lg font-bold text-gray-300 w-6">#{i + 1}</span>
                    <div className="flex-1">
                      <p className="font-medium">{ch.source}</p>
                      <p className="text-xs text-gray-500">{ch.total_apps} apps · {ch.funded} funded</p>
                    </div>
                    <div className="text-right">
                      <span className={`px-2 py-1 rounded text-sm font-bold ${qualityColor(ch.quality_score)}`}>
                        {ch.quality_score}
                      </span>
                      <p className="text-xs text-gray-500 mt-1">{parseFloat(String(ch.conversion_rate)).toFixed(1)}% conv</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Suppressed Channels */}
          {channels.filter(c => c.suppressed).length > 0 && (
            <div className="bg-red-50 rounded-xl border border-red-200 p-6">
              <h2 className="text-lg font-semibold mb-3 flex items-center gap-2 text-red-800">
                <Ban className="w-5 h-5" /> Suppressed Channels ({channels.filter(c => c.suppressed).length})
              </h2>
              <div className="space-y-2">
                {channels.filter(c => c.suppressed).map(ch => (
                  <div key={ch.source} className="flex items-center justify-between p-3 bg-white rounded-lg border border-red-100">
                    <div>
                      <span className="font-medium">{ch.source}</span>
                      <p className="text-xs text-red-600">{ch.suppress_reason}</p>
                    </div>
                    <button
                      onClick={() => unsuppressChannel(ch.source)}
                      className="text-xs bg-green-100 text-green-700 px-3 py-1 rounded hover:bg-green-200"
                    >
                      Unsuppress
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── CHANNELS TAB ── */}
      {tab === 'channels' && (
        <div className="bg-white rounded-xl border p-6">
          <h2 className="text-lg font-semibold mb-4">Channel Quality Leaderboard</h2>
          {channels.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No channel data yet. Click "Recalculate All" to generate.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-gray-500 border-b">
                    <th className="pb-2">Source</th>
                    <th className="pb-2">Apps</th>
                    <th className="pb-2">Approved</th>
                    <th className="pb-2">Funded</th>
                    <th className="pb-2">Conv %</th>
                    <th className="pb-2">Fraud %</th>
                    <th className="pb-2">Avg PnL</th>
                    <th className="pb-2">Score</th>
                    <th className="pb-2">Status</th>
                    <th className="pb-2">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {channels.map(ch => (
                    <tr key={ch.source} className={`border-b border-gray-50 hover:bg-gray-50 ${ch.suppressed ? 'opacity-50' : ''}`}>
                      <td className="py-2 font-medium">{ch.source}</td>
                      <td className="py-2">{ch.total_apps}</td>
                      <td className="py-2">{ch.approved}</td>
                      <td className="py-2">{ch.funded}</td>
                      <td className="py-2">{parseFloat(String(ch.conversion_rate)).toFixed(1)}%</td>
                      <td className="py-2">
                        <span className={parseFloat(String(ch.fraud_rate)) > 20 ? 'text-red-600 font-bold' : ''}>
                          {parseFloat(String(ch.fraud_rate)).toFixed(1)}%
                        </span>
                      </td>
                      <td className="py-2">
                        <span className={parseFloat(String(ch.avg_funded_pnl)) >= 0 ? 'text-green-600' : 'text-red-600'}>
                          {fmtCurrency(parseFloat(String(ch.avg_funded_pnl || 0)))}
                        </span>
                      </td>
                      <td className="py-2">
                        <span className={`px-2 py-0.5 rounded text-xs font-bold ${qualityColor(ch.quality_score)}`}>
                          {ch.quality_score}
                        </span>
                      </td>
                      <td className="py-2">
                        {ch.suppressed ? (
                          <span className="flex items-center gap-1 text-red-600 text-xs">
                            <Ban className="w-3 h-3" /> Suppressed
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-green-600 text-xs">
                            <CheckCircle className="w-3 h-3" /> Active
                          </span>
                        )}
                      </td>
                      <td className="py-2">
                        {ch.suppressed ? (
                          <button
                            onClick={() => unsuppressChannel(ch.source)}
                            className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded hover:bg-green-200"
                          >
                            Restore
                          </button>
                        ) : (
                          <button
                            onClick={() => suppressChannel(ch.source)}
                            className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded hover:bg-red-200"
                          >
                            Suppress
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── COHORTS TAB ── */}
      {tab === 'cohorts' && (
        <div className="bg-white rounded-xl border p-6">
          <h2 className="text-lg font-semibold mb-4">Cohort Analysis</h2>
          {cohorts.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No cohort data yet. Click "Recalculate All" to analyze.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-gray-500 border-b">
                    <th className="pb-2">Month</th>
                    <th className="pb-2">Source</th>
                    <th className="pb-2">Applicants</th>
                    <th className="pb-2">Funded</th>
                    <th className="pb-2">Blown</th>
                    <th className="pb-2">Conv %</th>
                    <th className="pb-2">Survival</th>
                    <th className="pb-2">Total PnL</th>
                    <th className="pb-2">LTV/Trader</th>
                    <th className="pb-2">Avg Days</th>
                  </tr>
                </thead>
                <tbody>
                  {cohorts.map((c, i) => (
                    <tr key={`${c.cohort_month}-${c.primary_source}`} className="border-b border-gray-50 hover:bg-gray-50">
                      <td className="py-2 font-medium">{c.cohort_month}</td>
                      <td className="py-2">{c.primary_source}</td>
                      <td className="py-2">{c.total_applicants}</td>
                      <td className="py-2">{c.funded}</td>
                      <td className="py-2 text-red-600">{c.blown}</td>
                      <td className="py-2">{parseFloat(String(c.funnel_conversion)).toFixed(1)}%</td>
                      <td className="py-2">
                        <span className={parseFloat(String(c.survival_rate_90d)) >= 70 ? 'text-green-600' : 'text-orange-600'}>
                          {parseFloat(String(c.survival_rate_90d)).toFixed(0)}%
                        </span>
                      </td>
                      <td className="py-2">
                        <span className={parseFloat(String(c.total_pnl)) >= 0 ? 'text-green-600' : 'text-red-600'}>
                          {fmtCurrency(parseFloat(String(c.total_pnl)))}
                        </span>
                      </td>
                      <td className="py-2">
                        <span className={parseFloat(String(c.ltv_per_trader)) >= 0 ? 'text-green-600' : 'text-red-600'}>
                          {fmtCurrency(parseFloat(String(c.ltv_per_trader)))}
                        </span>
                      </td>
                      <td className="py-2">{parseFloat(String(c.avg_time_to_fund_days)).toFixed(0)}d</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── RULES TAB ── */}
      {tab === 'rules' && (
        <div className="space-y-6">
          {/* Create Rule */}
          <div className="bg-white rounded-xl border p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Plus className="w-5 h-5" /> Create Suppress Rule
            </h2>
            <div className="flex gap-4 items-end">
              <div>
                <label className="text-xs text-gray-500">Metric</label>
                <select
                  className="w-full border rounded-lg p-2 mt-1"
                  value={newRule.metric}
                  onChange={e => setNewRule(r => ({ ...r, metric: e.target.value }))}
                >
                  <option value="fraud_rate">Fraud Rate (suppress if above)</option>
                  <option value="conversion_rate">Conversion Rate (suppress if below)</option>
                  <option value="rejection_rate">Rejection Rate (suppress if above)</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-gray-500">Threshold (%)</label>
                <input
                  type="number"
                  className="w-full border rounded-lg p-2 mt-1"
                  value={newRule.threshold_value}
                  onChange={e => setNewRule(r => ({ ...r, threshold_value: parseFloat(e.target.value) }))}
                />
              </div>
              <button
                onClick={createRule}
                className="bg-violet-600 text-white px-4 py-2 rounded-lg hover:bg-violet-700"
              >
                Create
              </button>
            </div>
          </div>

          {/* Existing Rules */}
          <div className="bg-white rounded-xl border p-6">
            <h2 className="text-lg font-semibold mb-4">Active Rules</h2>
            {rules.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No suppress rules configured.</p>
            ) : (
              <div className="space-y-3">
                {rules.map(rule => (
                  <div key={rule.rule_id} className={`flex items-center justify-between p-4 rounded-lg border ${
                    rule.is_active ? 'bg-white' : 'bg-gray-50 opacity-60'
                  }`}>
                    <div className="flex items-center gap-3">
                      <Filter className="w-5 h-5 text-gray-400" />
                      <div>
                        <p className="font-medium capitalize">{rule.metric.replace('_', ' ')}</p>
                        <p className="text-sm text-gray-500">
                          {rule.metric === 'conversion_rate' ? 'Suppress if below' : 'Suppress if above'}{' '}
                          <span className="font-bold">{parseFloat(String(rule.threshold_value))}%</span>
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {rule.auto_suppress && (
                        <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">Auto</span>
                      )}
                      <button
                        onClick={() => toggleRule(rule.rule_id, !rule.is_active)}
                        className={`text-xs px-3 py-1 rounded ${
                          rule.is_active
                            ? 'bg-red-100 text-red-700 hover:bg-red-200'
                            : 'bg-green-100 text-green-700 hover:bg-green-200'
                        }`}
                      >
                        {rule.is_active ? 'Disable' : 'Enable'}
                      </button>
                    </div>
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
