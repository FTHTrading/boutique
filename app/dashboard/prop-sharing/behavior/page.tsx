'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  Brain, AlertTriangle, Shield, RefreshCw, Activity, TrendingUp,
  TrendingDown, Minus, Users, Settings, Eye, CheckCircle,
  XCircle, AlertOctagon, Lock, RotateCcw, ChevronDown,
} from 'lucide-react';

interface Summary {
  total_scored: number;
  avg_score: number;
  critical_low: number;
  at_risk: number;
  moderate: number;
  stable: number;
  avg_revenge: number;
  avg_martingale: number;
  avg_overtrade: number;
  avg_panic: number;
}

interface InterventionSummary {
  total: number;
  active: number;
  active_freezes: number;
  active_warnings: number;
  active_restrictions: number;
  active_rollbacks: number;
}

interface StabilityScore {
  score_id: string;
  account_id: string;
  account_number: string;
  trader_name: string;
  overall_score: number;
  discipline_score: number;
  consistency_score: number;
  aggression_score: number;
  rule_adherence: number;
  revenge_trade_count: number;
  martingale_count: number;
  overtrade_burst_count: number;
  panic_exit_count: number;
  score_delta: number;
  trend_direction: string;
  calculated_at: string;
}

interface Intervention {
  intervention_id: string;
  account_id: string;
  account_number: string;
  trader_name: string;
  intervention_type: string;
  trigger_reason: string;
  trigger_score: number;
  status: string;
  auto_triggered: boolean;
  expires_at: string;
  created_at: string;
}

interface BehaviorConfig {
  config_key: string;
  config_value: string;
  description: string;
}

const SCORE_COLORS = (score: number) => {
  if (score >= 70) return 'text-green-700 bg-green-50';
  if (score >= 50) return 'text-amber-700 bg-amber-50';
  if (score >= 30) return 'text-orange-700 bg-orange-50';
  return 'text-red-700 bg-red-50';
};

const TREND_ICONS: Record<string, any> = {
  improving: TrendingUp,
  declining: TrendingDown,
  stable: Minus,
};

const INT_COLORS: Record<string, string> = {
  freeze: 'bg-red-100 text-red-800 border-red-200',
  phase_rollback: 'bg-orange-100 text-orange-800 border-orange-200',
  restriction: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  warning: 'bg-blue-100 text-blue-800 border-blue-200',
};

const INT_ICONS: Record<string, any> = {
  freeze: Lock,
  phase_rollback: RotateCcw,
  restriction: Shield,
  warning: AlertTriangle,
};

type TabKey = 'overview' | 'scores' | 'interventions' | 'config';

export default function BehaviorPage() {
  const [tab, setTab] = useState<TabKey>('overview');
  const [summary, setSummary] = useState<Summary | null>(null);
  const [intSummary, setIntSummary] = useState<InterventionSummary | null>(null);
  const [worstScores, setWorstScores] = useState<StabilityScore[]>([]);
  const [activeInterventions, setActiveInterventions] = useState<Intervention[]>([]);
  const [allScores, setAllScores] = useState<StabilityScore[]>([]);
  const [allInterventions, setAllInterventions] = useState<Intervention[]>([]);
  const [config, setConfig] = useState<BehaviorConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [scoring, setScoring] = useState(false);
  const [selectedScore, setSelectedScore] = useState<StabilityScore | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      if (tab === 'overview') {
        const res = await fetch('/api/prop-sharing/behavior');
        const d = await res.json();
        if (d.success) {
          setSummary(d.data.summary);
          setIntSummary(d.data.interventions_summary);
          setWorstScores(d.data.worst_scores);
          setActiveInterventions(d.data.active_interventions);
          setConfig(d.data.config);
        }
      } else if (tab === 'scores') {
        const res = await fetch('/api/prop-sharing/behavior?section=scores');
        const d = await res.json();
        if (d.success) setAllScores(d.data.scores);
      } else if (tab === 'interventions') {
        const res = await fetch('/api/prop-sharing/behavior?section=interventions');
        const d = await res.json();
        if (d.success) setAllInterventions(d.data.interventions);
      } else if (tab === 'config') {
        const res = await fetch('/api/prop-sharing/behavior?section=config');
        const d = await res.json();
        if (d.success) setConfig(d.data.config);
      }
    } catch {}
    setLoading(false);
  }, [tab]);

  useEffect(() => { loadData(); }, [loadData]);

  const runScoring = async () => {
    setScoring(true);
    try {
      await fetch('/api/prop-sharing/behavior', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'calculate_all' }),
      });
      loadData();
    } catch {}
    setScoring(false);
  };

  const resolveIntervention = async (id: string, notes?: string) => {
    try {
      await fetch('/api/prop-sharing/behavior', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'resolve_intervention', intervention_id: id, resolution_notes: notes || 'Resolved by admin' }),
      });
      loadData();
    } catch {}
  };

  const updateConfig = async (key: string, value: string) => {
    try {
      await fetch('/api/prop-sharing/behavior', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'update_config', config_key: key, config_value: value }),
      });
      loadData();
    } catch {}
  };

  const s = summary || { total_scored: 0, avg_score: 0, critical_low: 0, at_risk: 0, moderate: 0, stable: 0, avg_revenge: 0, avg_martingale: 0, avg_overtrade: 0, avg_panic: 0 };
  const is = intSummary || { total: 0, active: 0, active_freezes: 0, active_warnings: 0, active_restrictions: 0, active_rollbacks: 0 };

  const tabs: { key: TabKey; label: string; icon: any }[] = [
    { key: 'overview', label: 'Overview', icon: Brain },
    { key: 'scores', label: 'Stability Scores', icon: Activity },
    { key: 'interventions', label: 'Interventions', icon: Shield },
    { key: 'config', label: 'Config', icon: Settings },
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Brain className="w-6 h-6 text-purple-600" /> Behavioral Risk Scoring
          </h1>
          <p className="text-sm text-gray-500 mt-1">Trader stability scores, pattern detection, and automated interventions.</p>
        </div>
        <div className="flex gap-2">
          <button onClick={runScoring} disabled={scoring}
            className="flex items-center gap-2 px-4 py-2 text-sm bg-purple-700 text-white rounded-lg hover:bg-purple-800 disabled:opacity-50">
            <Brain className="w-4 h-4" /> {scoring ? 'Scoring...' : 'Run All Scoring'}
          </button>
          <button onClick={loadData} className="flex items-center gap-2 px-3 py-2 text-sm bg-white border border-gray-200 rounded-lg hover:bg-gray-50">
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-white rounded-lg border border-gray-200 p-1">
        {tabs.map(({ key, label, icon: Icon }) => (
          <button key={key} onClick={() => setTab(key)}
            className={`flex items-center gap-2 px-4 py-2 text-sm rounded-md transition-all ${tab === key ? 'bg-purple-50 text-purple-800 font-medium' : 'text-gray-600 hover:bg-gray-50'}`}>
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
              { label: 'Avg Stability', value: Number(s.avg_score).toFixed(0), icon: Brain, color: Number(s.avg_score) >= 50 ? 'green' : 'red' },
              { label: 'Critical (<30)', value: s.critical_low, icon: AlertOctagon, color: Number(s.critical_low) > 0 ? 'red' : 'green' },
              { label: 'At Risk (30-50)', value: s.at_risk, icon: AlertTriangle, color: Number(s.at_risk) > 0 ? 'amber' : 'green' },
              { label: 'Active Interventions', value: is.active, icon: Shield, color: Number(is.active) > 0 ? 'red' : 'green' },
            ].map(({ label, value, icon: Icon, color }) => (
              <div key={label} className="bg-white rounded-xl border border-gray-100 p-4">
                <div className="flex items-center justify-between mb-2"><Icon size={16} className={`text-${color}-600`} /></div>
                <p className="text-2xl font-bold text-gray-900">{value}</p>
                <p className="text-xs text-gray-500 mt-1">{label}</p>
              </div>
            ))}
          </div>

          {/* Score Distribution */}
          <div className="bg-white rounded-xl border border-gray-100 p-6">
            <h2 className="text-sm font-semibold text-gray-900 mb-4">Score Distribution</h2>
            <div className="flex gap-2 h-8">
              {[
                { label: 'Critical', count: Number(s.critical_low), color: 'bg-red-500' },
                { label: 'At Risk', count: Number(s.at_risk), color: 'bg-orange-500' },
                { label: 'Moderate', count: Number(s.moderate), color: 'bg-amber-500' },
                { label: 'Stable', count: Number(s.stable), color: 'bg-green-500' },
              ].map(({ label, count, color }) => {
                const total = Number(s.total_scored) || 1;
                const pct = (count / total) * 100;
                return pct > 0 ? (
                  <div key={label} className={`${color} rounded flex items-center justify-center text-white text-xs font-medium`}
                    style={{ width: `${Math.max(pct, 5)}%` }} title={`${label}: ${count}`}>
                    {count}
                  </div>
                ) : null;
              })}
            </div>
            <div className="flex gap-4 mt-3 text-xs text-gray-500">
              <span className="flex items-center gap-1"><span className="w-3 h-3 bg-red-500 rounded" /> Critical (&lt;30)</span>
              <span className="flex items-center gap-1"><span className="w-3 h-3 bg-orange-500 rounded" /> At Risk (30-50)</span>
              <span className="flex items-center gap-1"><span className="w-3 h-3 bg-amber-500 rounded" /> Moderate (50-70)</span>
              <span className="flex items-center gap-1"><span className="w-3 h-3 bg-green-500 rounded" /> Stable (70+)</span>
            </div>
          </div>

          {/* Pattern Signals (Averages) */}
          <div className="bg-white rounded-xl border border-gray-100 p-6">
            <h2 className="text-sm font-semibold text-gray-900 mb-4">Average Pattern Signals</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: 'Revenge Trades', value: Number(s.avg_revenge).toFixed(1) },
                { label: 'Martingale', value: Number(s.avg_martingale).toFixed(1) },
                { label: 'Overtrade Bursts', value: Number(s.avg_overtrade).toFixed(1) },
                { label: 'Panic Exits', value: Number(s.avg_panic).toFixed(1) },
              ].map(({ label, value }) => (
                <div key={label} className="text-center p-3 bg-gray-50 rounded-lg">
                  <p className="text-lg font-bold text-gray-900">{value}</p>
                  <p className="text-xs text-gray-500">{label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Worst Scores */}
          {worstScores.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-100 p-6">
              <h2 className="text-sm font-semibold text-gray-900 mb-4">Lowest Stability Scores</h2>
              <div className="space-y-2">
                {worstScores.map(sc => {
                  const TrendIcon = TREND_ICONS[sc.trend_direction] || Minus;
                  return (
                    <div key={sc.score_id} className="flex items-center justify-between py-3 px-4 rounded-lg bg-gray-50 hover:bg-gray-100 cursor-pointer"
                      onClick={() => setSelectedScore(selectedScore?.score_id === sc.score_id ? null : sc)}>
                      <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center text-sm font-bold ${SCORE_COLORS(Number(sc.overall_score))}`}>
                          {sc.overall_score}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">{sc.trader_name}</p>
                          <p className="text-xs text-gray-400">{sc.account_number}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4 text-xs">
                        <div className="flex items-center gap-1">
                          <TrendIcon className={`w-3 h-3 ${sc.trend_direction === 'improving' ? 'text-green-600' : sc.trend_direction === 'declining' ? 'text-red-600' : 'text-gray-400'}`} />
                          <span className={sc.score_delta > 0 ? 'text-green-600' : sc.score_delta < 0 ? 'text-red-600' : 'text-gray-400'}>
                            {sc.score_delta > 0 ? '+' : ''}{Number(sc.score_delta).toFixed(0)}
                          </span>
                        </div>
                        <span className="text-gray-400">{new Date(sc.calculated_at).toLocaleDateString()}</span>
                        <ChevronDown className="w-4 h-4 text-gray-400" />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Active Interventions */}
          {activeInterventions.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-100 p-6">
              <h2 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Shield className="w-4 h-4 text-red-600" /> Active Interventions ({activeInterventions.length})
              </h2>
              <div className="space-y-3">
                {activeInterventions.map(int => {
                  const IntIcon = INT_ICONS[int.intervention_type] || AlertTriangle;
                  return (
                    <div key={int.intervention_id} className={`rounded-lg border p-4 ${INT_COLORS[int.intervention_type] || 'bg-gray-50'}`}>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <IntIcon className="w-4 h-4" />
                          <span className="text-sm font-semibold">{int.intervention_type.toUpperCase()}</span>
                          <span className="text-xs">{int.trader_name} ({int.account_number})</span>
                          {int.auto_triggered && <span className="text-xs px-1 py-0.5 bg-white/50 rounded">Auto</span>}
                        </div>
                        <button onClick={() => resolveIntervention(int.intervention_id)}
                          className="text-xs px-3 py-1 bg-white rounded-lg hover:bg-gray-50 border">Resolve</button>
                      </div>
                      <p className="text-xs">{int.trigger_reason}</p>
                      {int.expires_at && <p className="text-xs mt-1 opacity-60">Expires: {new Date(int.expires_at).toLocaleString()}</p>}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── All Scores ── */}
      {!loading && tab === 'scores' && (
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          {allScores.length === 0 ? (
            <div className="p-12 text-center">
              <Brain className="w-8 h-8 text-gray-300 mx-auto mb-2" />
              <p className="text-sm text-gray-500">No stability scores calculated yet. Click &quot;Run All Scoring&quot; to start.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="bg-gray-50 border-b border-gray-100">
                  <th className="text-left px-4 py-3 text-gray-500 font-medium">Trader</th>
                  <th className="text-center px-4 py-3 text-gray-500 font-medium">Overall</th>
                  <th className="text-center px-4 py-3 text-gray-500 font-medium">Discipline</th>
                  <th className="text-center px-4 py-3 text-gray-500 font-medium">Consistency</th>
                  <th className="text-center px-4 py-3 text-gray-500 font-medium">Aggression</th>
                  <th className="text-center px-4 py-3 text-gray-500 font-medium">Rules</th>
                  <th className="text-center px-4 py-3 text-gray-500 font-medium">Revenge</th>
                  <th className="text-center px-4 py-3 text-gray-500 font-medium">Martingale</th>
                  <th className="text-center px-4 py-3 text-gray-500 font-medium">Trend</th>
                  <th className="text-left px-4 py-3 text-gray-500 font-medium">Updated</th>
                </tr></thead>
                <tbody>
                  {allScores.map(sc => {
                    const TrendIcon = TREND_ICONS[sc.trend_direction] || Minus;
                    return (
                      <tr key={sc.score_id} className="border-b border-gray-50 hover:bg-gray-50">
                        <td className="px-4 py-3">
                          <p className="font-medium text-gray-900">{sc.trader_name}</p>
                          <p className="text-xs text-gray-400">{sc.account_number}</p>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className={`inline-flex items-center justify-center w-10 h-10 rounded-full text-sm font-bold ${SCORE_COLORS(Number(sc.overall_score))}`}>
                            {sc.overall_score}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center font-mono text-xs">{sc.discipline_score}</td>
                        <td className="px-4 py-3 text-center font-mono text-xs">{sc.consistency_score}</td>
                        <td className="px-4 py-3 text-center font-mono text-xs">{sc.aggression_score}</td>
                        <td className="px-4 py-3 text-center font-mono text-xs">{sc.rule_adherence}</td>
                        <td className="px-4 py-3 text-center">
                          <span className={Number(sc.revenge_trade_count) > 0 ? 'text-red-600 font-bold' : 'text-gray-400'}>{sc.revenge_trade_count}</span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className={Number(sc.martingale_count) > 0 ? 'text-red-600 font-bold' : 'text-gray-400'}>{sc.martingale_count}</span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <TrendIcon className={`w-4 h-4 mx-auto ${sc.trend_direction === 'improving' ? 'text-green-600' : sc.trend_direction === 'declining' ? 'text-red-600' : 'text-gray-400'}`} />
                        </td>
                        <td className="px-4 py-3 text-xs text-gray-500">{new Date(sc.calculated_at).toLocaleDateString()}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── All Interventions ── */}
      {!loading && tab === 'interventions' && (
        <div className="space-y-3">
          {allInterventions.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-100 p-12 text-center">
              <Shield className="w-8 h-8 text-gray-300 mx-auto mb-2" />
              <p className="text-sm text-gray-500">No interventions recorded.</p>
            </div>
          ) : (
            allInterventions.map(int => {
              const IntIcon = INT_ICONS[int.intervention_type] || AlertTriangle;
              const isActive = ['pending', 'active'].includes(int.status);
              return (
                <div key={int.intervention_id} className={`bg-white rounded-xl border p-5 ${isActive ? 'border-red-200' : 'border-gray-100'}`}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <IntIcon className={`w-4 h-4 ${isActive ? 'text-red-600' : 'text-gray-400'}`} />
                      <span className={`text-xs px-2 py-0.5 rounded ${INT_COLORS[int.intervention_type] || 'bg-gray-100'}`}>
                        {int.intervention_type.toUpperCase()}
                      </span>
                      <span className="text-sm font-medium text-gray-900">{int.trader_name}</span>
                      <span className="text-xs text-gray-400">{int.account_number}</span>
                      {int.auto_triggered && <span className="text-xs px-1.5 py-0.5 bg-purple-50 text-purple-600 rounded">Auto</span>}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs px-2 py-0.5 rounded ${isActive ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-500'}`}>
                        {int.status}
                      </span>
                      {isActive && (
                        <button onClick={() => resolveIntervention(int.intervention_id)}
                          className="text-xs px-3 py-1 bg-green-100 text-green-700 rounded-lg hover:bg-green-200">Resolve</button>
                      )}
                    </div>
                  </div>
                  <p className="text-xs text-gray-600">{int.trigger_reason}</p>
                  <div className="flex gap-4 mt-2 text-xs text-gray-400">
                    {int.trigger_score && <span>Score: {int.trigger_score}</span>}
                    <span>Created: {new Date(int.created_at).toLocaleString()}</span>
                    {int.expires_at && <span>Expires: {new Date(int.expires_at).toLocaleString()}</span>}
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* ── Config ── */}
      {!loading && tab === 'config' && (
        <div className="bg-white rounded-xl border border-gray-100 p-6">
          <h2 className="text-sm font-semibold text-gray-900 mb-4">Behavior Detection Thresholds</h2>
          {config.length === 0 ? (
            <p className="text-sm text-gray-500">No behavior config found. Run the V4 schema migration to seed defaults.</p>
          ) : (
            <div className="space-y-3">
              {config.map(c => (
                <div key={c.config_key} className="flex items-center justify-between py-3 px-4 bg-gray-50 rounded-lg">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{c.config_key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</p>
                    <p className="text-xs text-gray-500">{c.description}</p>
                  </div>
                  <input type="number" value={c.config_value}
                    onChange={e => {
                      setConfig(config.map(cfg => cfg.config_key === c.config_key ? { ...cfg, config_value: e.target.value } : cfg));
                    }}
                    onBlur={e => updateConfig(c.config_key, e.target.value)}
                    className="w-24 px-3 py-1.5 text-sm text-right border border-gray-200 rounded-lg" />
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
