'use client';

import { useEffect, useState, useCallback } from 'react';
import { TrendingUp, Settings, History, Users, ChevronUp, ChevronDown, Award, BarChart3, Target, Shield, Zap, Clock, CheckCircle, XCircle, Edit2, Save, X } from 'lucide-react';

interface ScalingRule {
  rule_id: string;
  name: string;
  min_sharpe_ratio: number;
  min_profit_factor: number;
  max_drawdown_pct: number;
  min_trading_days: number;
  cooldown_days: number;
  max_scaling_tiers: number;
  scale_pct_per_tier: number;
  is_active: boolean;
}

interface Candidate {
  account_id: string;
  account_number: string;
  trader_name: string;
  trader_email: string;
  balance: number;
  starting_balance: number;
  status: string;
  scaling_eligible: boolean;
  consistency_score: number | null;
  volatility_30d: number | null;
  scaling_tier: number;
  last_scaling_event: string | null;
  program_name: string;
  total_return_pct: number;
  total_trades: number;
  winning_trades: number;
  last_trade_at: string | null;
  total_scaling_events: number;
}

interface ScalingEvent {
  history_id: string;
  account_id: string;
  account_number: string;
  trader_name: string;
  program_name: string;
  direction: string;
  old_balance: number;
  new_balance: number;
  old_tier: number;
  new_tier: number;
  metrics_snapshot: Record<string, any>;
  scaled_at: string;
}

export default function DynamicScalingPage() {
  const [rules, setRules] = useState<ScalingRule[]>([]);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [history, setHistory] = useState<ScalingEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [evaluating, setEvaluating] = useState(false);
  const [editingRule, setEditingRule] = useState<ScalingRule | null>(null);
  const [editForm, setEditForm] = useState<Partial<ScalingRule>>({});
  const [activeTab, setActiveTab] = useState<'candidates' | 'history' | 'rules'>('candidates');

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch('/api/prop-sharing/scaling?section=all');
      const json = await res.json();
      if (json.success) {
        setRules(json.data.rules || []);
        setCandidates(json.data.candidates || []);
        setHistory(json.data.history || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const runEvaluation = async (accountId?: string) => {
    setEvaluating(true);
    try {
      const res = await fetch('/api/prop-sharing/scaling', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(accountId ? { account_id: accountId } : {}),
      });
      const json = await res.json();
      if (json.success) {
        const scaled = json.data.scaled;
        alert(`Evaluation complete: ${json.data.evaluated} accounts evaluated, ${scaled} scaled up`);
        fetchData();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setEvaluating(false);
    }
  };

  const saveRule = async () => {
    if (!editingRule) return;
    try {
      const res = await fetch('/api/prop-sharing/scaling', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rule_id: editingRule.rule_id, ...editForm }),
      });
      const json = await res.json();
      if (json.success) {
        setEditingRule(null);
        setEditForm({});
        fetchData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const activeRule = rules.find(r => r.is_active) || rules[0];

  if (loading) {
    return (
      <div className="p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3" />
          <div className="grid grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => <div key={i} className="h-24 bg-gray-200 rounded" />)}
          </div>
        </div>
      </div>
    );
  }

  const eligibleCount = candidates.filter(c => c.scaling_eligible).length;
  const totalScaled = candidates.reduce((s, c) => s + (c.scaling_tier || 0), 0);
  const avgConsistency = candidates.filter(c => c.consistency_score).length > 0
    ? candidates.filter(c => c.consistency_score).reduce((s, c) => s + (c.consistency_score || 0), 0) / candidates.filter(c => c.consistency_score).length
    : 0;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <TrendingUp className="w-7 h-7 text-emerald-600" />
            Dynamic Scaling Engine
          </h1>
          <p className="text-gray-500 mt-1">Automatically scale funded accounts based on performance metrics</p>
        </div>
        <button
          onClick={() => runEvaluation()}
          disabled={evaluating}
          className="flex items-center gap-2 bg-emerald-600 text-white px-5 py-2.5 rounded-lg hover:bg-emerald-700 disabled:opacity-50 transition"
        >
          <Zap className={`w-4 h-4 ${evaluating ? 'animate-pulse' : ''}`} />
          {evaluating ? 'Evaluating...' : 'Run Scaling Evaluation'}
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border p-4">
          <div className="flex items-center gap-2 text-gray-500 text-sm mb-1">
            <Users className="w-4 h-4" /> Funded Accounts
          </div>
          <p className="text-2xl font-bold text-gray-900">{candidates.length}</p>
        </div>
        <div className="bg-white rounded-xl border p-4 border-emerald-200">
          <div className="flex items-center gap-2 text-emerald-600 text-sm mb-1">
            <CheckCircle className="w-4 h-4" /> Scaling Eligible
          </div>
          <p className="text-2xl font-bold text-emerald-700">{eligibleCount}</p>
        </div>
        <div className="bg-white rounded-xl border p-4">
          <div className="flex items-center gap-2 text-gray-500 text-sm mb-1">
            <Award className="w-4 h-4" /> Total Tier-Ups
          </div>
          <p className="text-2xl font-bold text-gray-900">{totalScaled}</p>
        </div>
        <div className="bg-white rounded-xl border p-4">
          <div className="flex items-center gap-2 text-gray-500 text-sm mb-1">
            <BarChart3 className="w-4 h-4" /> Avg Consistency
          </div>
          <p className="text-2xl font-bold text-gray-900">{avgConsistency.toFixed(0)}%</p>
        </div>
      </div>

      {/* Active Rule Summary */}
      {activeRule && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold text-emerald-800 flex items-center gap-2">
              <Settings className="w-4 h-4" /> Active Scaling Rule: {activeRule.name}
            </h3>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
            <div><span className="text-emerald-600">Min Sharpe:</span> <strong>{activeRule.min_sharpe_ratio}</strong></div>
            <div><span className="text-emerald-600">Min Profit Factor:</span> <strong>{activeRule.min_profit_factor}</strong></div>
            <div><span className="text-emerald-600">Max Drawdown:</span> <strong>{activeRule.max_drawdown_pct}%</strong></div>
            <div><span className="text-emerald-600">Scale/Tier:</span> <strong>+{activeRule.scale_pct_per_tier}%</strong></div>
            <div><span className="text-emerald-600">Max Tiers:</span> <strong>{activeRule.max_scaling_tiers}</strong></div>
            <div><span className="text-emerald-600">Cooldown:</span> <strong>{activeRule.cooldown_days}d</strong></div>
          </div>
        </div>
      )}

      {/* Tab Selector */}
      <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
        {[
          { key: 'candidates' as const, label: 'Candidates', icon: Users, count: candidates.length },
          { key: 'history' as const, label: 'Scaling History', icon: History, count: history.length },
          { key: 'rules' as const, label: 'Rules Config', icon: Settings, count: rules.length },
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-md text-sm font-medium transition ${
              activeTab === tab.key ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
            <span className="text-xs bg-gray-200 px-1.5 py-0.5 rounded-full">{tab.count}</span>
          </button>
        ))}
      </div>

      {/* Candidates Tab */}
      {activeTab === 'candidates' && (
        <div className="space-y-3">
          {candidates.length === 0 ? (
            <div className="bg-white rounded-xl border p-12 text-center">
              <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <h3 className="font-semibold text-gray-600">No Funded Accounts</h3>
              <p className="text-gray-400 text-sm">Active funded accounts will appear here for scaling evaluation.</p>
            </div>
          ) : (
            <div className="bg-white rounded-xl border overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 text-left text-gray-500 text-xs uppercase">
                    <th className="px-4 py-3">Trader</th>
                    <th className="px-4 py-3">Balance</th>
                    <th className="px-4 py-3">Return</th>
                    <th className="px-4 py-3">Win Rate</th>
                    <th className="px-4 py-3">Consistency</th>
                    <th className="px-4 py-3">Tier</th>
                    <th className="px-4 py-3">Eligible</th>
                    <th className="px-4 py-3">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {candidates.map((c) => {
                    const winRate = c.total_trades > 0 ? (c.winning_trades / c.total_trades * 100) : 0;
                    return (
                      <tr key={c.account_id} className="hover:bg-gray-50">
                        <td className="px-4 py-3">
                          <div className="font-medium text-gray-900">{c.trader_name}</div>
                          <div className="text-xs text-gray-500">{c.account_number} &middot; {c.program_name}</div>
                        </td>
                        <td className="px-4 py-3 font-mono">${parseFloat(String(c.balance)).toLocaleString()}</td>
                        <td className="px-4 py-3">
                          <span className={parseFloat(String(c.total_return_pct)) >= 0 ? 'text-green-600' : 'text-red-600'}>
                            {parseFloat(String(c.total_return_pct)).toFixed(1)}%
                          </span>
                        </td>
                        <td className="px-4 py-3">{winRate.toFixed(0)}%</td>
                        <td className="px-4 py-3">
                          {c.consistency_score !== null ? (
                            <div className="flex items-center gap-2">
                              <div className="w-16 bg-gray-200 rounded-full h-2">
                                <div
                                  className={`h-2 rounded-full ${c.consistency_score >= 70 ? 'bg-green-500' : c.consistency_score >= 50 ? 'bg-yellow-500' : 'bg-red-500'}`}
                                  style={{ width: `${Math.min(c.consistency_score, 100)}%` }}
                                />
                              </div>
                              <span className="text-xs">{c.consistency_score.toFixed(0)}%</span>
                            </div>
                          ) : (
                            <span className="text-gray-400">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1">
                            {[...Array(activeRule?.max_scaling_tiers || 5)].map((_, i) => (
                              <div
                                key={i}
                                className={`w-3 h-3 rounded-sm ${i < (c.scaling_tier || 0) ? 'bg-emerald-500' : 'bg-gray-200'}`}
                              />
                            ))}
                            <span className="text-xs text-gray-500 ml-1">{c.scaling_tier || 0}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          {c.scaling_eligible ? (
                            <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">Eligible</span>
                          ) : (
                            <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">Not Yet</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <button
                            onClick={() => runEvaluation(c.account_id)}
                            disabled={evaluating}
                            className="text-xs bg-emerald-50 text-emerald-700 px-3 py-1 rounded-lg hover:bg-emerald-100 disabled:opacity-50"
                          >
                            Evaluate
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* History Tab */}
      {activeTab === 'history' && (
        <div className="space-y-3">
          {history.length === 0 ? (
            <div className="bg-white rounded-xl border p-12 text-center">
              <History className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <h3 className="font-semibold text-gray-600">No Scaling Events</h3>
              <p className="text-gray-400 text-sm">Scaling history will appear after accounts are evaluated.</p>
            </div>
          ) : (
            <div className="bg-white rounded-xl border overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 text-left text-gray-500 text-xs uppercase">
                    <th className="px-4 py-3">Date</th>
                    <th className="px-4 py-3">Trader</th>
                    <th className="px-4 py-3">Direction</th>
                    <th className="px-4 py-3">Balance Change</th>
                    <th className="px-4 py-3">Tier</th>
                    <th className="px-4 py-3">Metrics</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {history.map((evt) => (
                    <tr key={evt.history_id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-gray-600">{new Date(evt.scaled_at).toLocaleDateString()}</td>
                      <td className="px-4 py-3">
                        <div className="font-medium text-gray-900">{evt.trader_name}</div>
                        <div className="text-xs text-gray-500">{evt.account_number}</div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`flex items-center gap-1 text-xs font-medium ${evt.direction === 'up' ? 'text-green-600' : 'text-red-600'}`}>
                          {evt.direction === 'up' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                          Scale {evt.direction}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-mono">
                        <span className="text-gray-400">${parseFloat(String(evt.old_balance)).toLocaleString()}</span>
                        <span className="mx-1">&rarr;</span>
                        <span className="font-semibold text-gray-900">${parseFloat(String(evt.new_balance)).toLocaleString()}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-gray-400">{evt.old_tier}</span>
                        <span className="mx-1">&rarr;</span>
                        <span className="font-semibold">{evt.new_tier}</span>
                      </td>
                      <td className="px-4 py-3">
                        {evt.metrics_snapshot && (
                          <div className="flex gap-2 text-xs">
                            {evt.metrics_snapshot.sharpe && <span className="bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded">SR {parseFloat(evt.metrics_snapshot.sharpe).toFixed(2)}</span>}
                            {evt.metrics_snapshot.profit_factor && <span className="bg-purple-50 text-purple-700 px-1.5 py-0.5 rounded">PF {parseFloat(evt.metrics_snapshot.profit_factor).toFixed(2)}</span>}
                            {evt.metrics_snapshot.max_dd !== undefined && <span className="bg-red-50 text-red-700 px-1.5 py-0.5 rounded">DD {parseFloat(evt.metrics_snapshot.max_dd).toFixed(1)}%</span>}
                          </div>
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

      {/* Rules Tab */}
      {activeTab === 'rules' && (
        <div className="space-y-4">
          {rules.length === 0 ? (
            <div className="bg-white rounded-xl border p-12 text-center">
              <Settings className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <h3 className="font-semibold text-gray-600">No Scaling Rules</h3>
              <p className="text-gray-400 text-sm">Run the V3 schema to seed default scaling rules.</p>
            </div>
          ) : (
            rules.map((rule) => (
              <div key={rule.rule_id} className={`bg-white rounded-xl border p-5 ${rule.is_active ? 'border-emerald-300' : ''}`}>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <h3 className="font-semibold text-gray-900">{rule.name}</h3>
                    {rule.is_active && (
                      <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full">Active</span>
                    )}
                  </div>
                  {editingRule?.rule_id === rule.rule_id ? (
                    <div className="flex gap-2">
                      <button onClick={saveRule} className="text-xs bg-emerald-600 text-white px-3 py-1 rounded-lg flex items-center gap-1">
                        <Save className="w-3 h-3" /> Save
                      </button>
                      <button onClick={() => { setEditingRule(null); setEditForm({}); }} className="text-xs bg-gray-200 text-gray-700 px-3 py-1 rounded-lg flex items-center gap-1">
                        <X className="w-3 h-3" /> Cancel
                      </button>
                    </div>
                  ) : (
                    <button onClick={() => { setEditingRule(rule); setEditForm(rule); }} className="text-xs bg-gray-100 text-gray-700 px-3 py-1 rounded-lg flex items-center gap-1 hover:bg-gray-200">
                      <Edit2 className="w-3 h-3" /> Edit
                    </button>
                  )}
                </div>

                {editingRule?.rule_id === rule.rule_id ? (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[
                      { key: 'min_sharpe_ratio', label: 'Min Sharpe Ratio', step: 0.1 },
                      { key: 'min_profit_factor', label: 'Min Profit Factor', step: 0.1 },
                      { key: 'max_drawdown_pct', label: 'Max Drawdown %', step: 0.5 },
                      { key: 'min_trading_days', label: 'Min Trading Days', step: 1 },
                      { key: 'cooldown_days', label: 'Cooldown Days', step: 1 },
                      { key: 'max_scaling_tiers', label: 'Max Tiers', step: 1 },
                      { key: 'scale_pct_per_tier', label: 'Scale % Per Tier', step: 5 },
                    ].map(({ key, label, step }) => (
                      <div key={key}>
                        <label className="text-xs text-gray-500 block mb-1">{label}</label>
                        <input
                          type="number"
                          step={step}
                          value={(editForm as any)[key] || ''}
                          onChange={(e) => setEditForm({ ...editForm, [key]: parseFloat(e.target.value) })}
                          className="w-full border rounded-lg px-3 py-1.5 text-sm"
                        />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div className="flex items-center gap-2"><Target className="w-4 h-4 text-blue-500" /><span className="text-gray-500">Sharpe:</span> <strong>{rule.min_sharpe_ratio}</strong></div>
                    <div className="flex items-center gap-2"><BarChart3 className="w-4 h-4 text-purple-500" /><span className="text-gray-500">PF:</span> <strong>{rule.min_profit_factor}</strong></div>
                    <div className="flex items-center gap-2"><Shield className="w-4 h-4 text-red-500" /><span className="text-gray-500">Max DD:</span> <strong>{rule.max_drawdown_pct}%</strong></div>
                    <div className="flex items-center gap-2"><TrendingUp className="w-4 h-4 text-emerald-500" /><span className="text-gray-500">Scale:</span> <strong>+{rule.scale_pct_per_tier}%/tier</strong></div>
                    <div className="flex items-center gap-2"><Clock className="w-4 h-4 text-gray-400" /><span className="text-gray-500">Cooldown:</span> <strong>{rule.cooldown_days}d</strong></div>
                    <div className="flex items-center gap-2"><Award className="w-4 h-4 text-yellow-500" /><span className="text-gray-500">Max Tiers:</span> <strong>{rule.max_scaling_tiers}</strong></div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
