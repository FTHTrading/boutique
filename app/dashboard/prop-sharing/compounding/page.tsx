'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  TrendingUp, DollarSign, Shield, RefreshCw, Play, CheckCircle,
  XCircle, AlertTriangle, BarChart3, Settings, Clock, Eye,
  ChevronDown, ChevronUp, Pause, Zap, Lock,
} from 'lucide-react';

interface Policy {
  policy_id: number;
  name: string;
  description: string;
  status: string;
  priority: number;
  min_retained_earnings?: number;
  min_buffer_health?: number;
  min_buffer_days: number;
  min_channel_quality?: number;
  max_fraud_rate?: number;
  min_readiness_score: number;
  action_type: string;
  action_params: Record<string, any>;
  requires_approval: boolean;
  max_executions_per_quarter: number;
  cooldown_days: number;
  last_evaluated?: string;
  last_executed?: string;
  created_at: string;
}

interface CompRun {
  run_id: number;
  mode: string;
  retained_earnings: number;
  buffer_health: number;
  buffer_consecutive_days: number;
  avg_channel_quality: number;
  fraud_rate: number;
  readiness_score: number;
  treasury_status: string;
  policies_evaluated: number;
  policies_eligible: number;
  actions_proposed: number;
  actions_executed: number;
  actions_blocked: number;
  blocked_reason?: string;
  created_at: string;
}

interface CompAction {
  action_id: number;
  run_id: number;
  policy_id: number;
  policy_name?: string;
  action_type: string;
  amount: number;
  target_vertical?: string;
  mode: string;
  executed: boolean;
  approved_by?: string;
  approved_at?: string;
  blocked: boolean;
  blocked_reason?: string;
  created_at: string;
}

interface Allocation {
  allocation_id: number;
  vertical: string;
  amount: number;
  source: string;
  status: string;
  deployed_at?: string;
  notes?: string;
  created_at: string;
}

interface GateStatus {
  allowed: boolean;
  readinessScore: number;
  reason?: string;
  breakdown?: Record<string, any>;
}

const STATUS_COLORS: Record<string, string> = {
  active: 'bg-green-100 text-green-700',
  paused: 'bg-yellow-100 text-yellow-700',
  draft: 'bg-gray-100 text-gray-500',
  retired: 'bg-red-100 text-red-700',
};

const ACTION_COLORS: Record<string, string> = {
  execute: 'bg-green-100 text-green-700',
  dry_run: 'bg-blue-100 text-blue-700',
  proposed: 'bg-yellow-100 text-yellow-700',
};

type TabKey = 'overview' | 'policies' | 'dry-run' | 'actions' | 'allocations';

export default function CompoundingPage() {
  const [tab, setTab] = useState<TabKey>('overview');
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [runs, setRuns] = useState<CompRun[]>([]);
  const [actions, setActions] = useState<CompAction[]>([]);
  const [allocations, setAllocations] = useState<Allocation[]>([]);
  const [gates, setGates] = useState<GateStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [expandedPolicy, setExpandedPolicy] = useState<number | null>(null);
  const [dryRunResult, setDryRunResult] = useState<any>(null);

  const fetchOverview = useCallback(async () => {
    setLoading(true);
    try {
      const [policiesRes, runsRes, actionsRes, allocRes, gatesRes] = await Promise.all([
        fetch('/api/prop-sharing/compounding?section=policies').then(r => r.json()),
        fetch('/api/prop-sharing/compounding?section=runs&limit=20').then(r => r.json()),
        fetch('/api/prop-sharing/compounding?section=actions&limit=50').then(r => r.json()),
        fetch('/api/prop-sharing/compounding?section=allocations&limit=50').then(r => r.json()),
        fetch('/api/prop-sharing/compounding?section=gates').then(r => r.json()),
      ]);
      if (policiesRes.success) setPolicies(policiesRes.data.policies || []);
      if (runsRes.success) setRuns(runsRes.data.runs || []);
      if (actionsRes.success) setActions(actionsRes.data.actions || []);
      if (allocRes.success) setAllocations(allocRes.data.allocations || []);
      if (gatesRes.success) setGates(gatesRes.data.gates || null);
    } catch (err) { console.error(err); }
    setLoading(false);
  }, []);

  useEffect(() => { fetchOverview(); }, [fetchOverview]);

  const runDryRun = async () => {
    setRunning(true);
    try {
      const res = await fetch('/api/prop-sharing/compounding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'evaluate' }),
      });
      const json = await res.json();
      if (json.success) {
        setDryRunResult(json.data);
        await fetchOverview();
      }
    } catch (err) { console.error(err); }
    setRunning(false);
  };

  const executeCompounding = async () => {
    if (!confirm('Execute compounding policies? This will allocate real capital.')) return;
    setRunning(true);
    try {
      const res = await fetch('/api/prop-sharing/compounding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'execute' }),
      });
      await res.json();
      await fetchOverview();
    } catch (err) { console.error(err); }
    setRunning(false);
  };

  const approveAction = async (actionId: number) => {
    try {
      await fetch('/api/prop-sharing/compounding', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ target: 'approve', action_id: actionId }),
      });
      await fetchOverview();
    } catch (err) { console.error(err); }
  };

  const rejectAction = async (actionId: number) => {
    const reason = prompt('Rejection reason:');
    if (!reason) return;
    try {
      await fetch('/api/prop-sharing/compounding', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ target: 'reject', action_id: actionId, reason }),
      });
      await fetchOverview();
    } catch (err) { console.error(err); }
  };

  const togglePolicyStatus = async (policyId: number, currentStatus: string) => {
    const newStatus = currentStatus === 'active' ? 'paused' : 'active';
    try {
      await fetch('/api/prop-sharing/compounding', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ target: 'policy', policy_id: policyId, status: newStatus }),
      });
      await fetchOverview();
    } catch (err) { console.error(err); }
  };

  const fmt = (n: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n);
  const pct = (v: number) => `${(v * 100).toFixed(1)}%`;
  const scoreColor = (v: number) => v >= 0.9 ? 'text-green-600' : v >= 0.7 ? 'text-yellow-600' : 'text-red-600';

  const activePolicies = policies.filter(p => p.status === 'active').length;
  const totalExecuted = actions.filter(a => a.executed).length;
  const totalAllocated = allocations.reduce((s, a) => s + Number(a.amount), 0);
  const pendingApproval = actions.filter(a => a.mode === 'proposed' && !a.blocked).length;

  const tabs: { key: TabKey; label: string; icon: any }[] = [
    { key: 'overview', label: 'Overview', icon: BarChart3 },
    { key: 'policies', label: 'Policies', icon: Settings },
    { key: 'dry-run', label: 'Dry Run', icon: Eye },
    { key: 'actions', label: 'Actions', icon: Zap },
    { key: 'allocations', label: 'Allocations', icon: TrendingUp },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Capital Compounding</h1>
          <p className="text-sm text-gray-500 mt-1">
            V5-B — Autonomous retained-earnings reinvestment engine
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={runDryRun}
            disabled={running}
            className="flex items-center gap-1.5 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 text-sm"
          >
            <Eye className="w-4 h-4" />
            Dry Run
          </button>
          <button
            onClick={executeCompounding}
            disabled={running || !gates?.allowed}
            className="flex items-center gap-1.5 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 text-sm"
            title={!gates?.allowed ? gates?.reason || 'Gates not passed' : 'Execute compounding'}
          >
            <Play className="w-4 h-4" />
            {running ? 'Running...' : 'Execute'}
          </button>
          <button
            onClick={fetchOverview}
            disabled={loading}
            className="p-2 text-gray-500 hover:text-gray-700 rounded-lg hover:bg-gray-100"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Gate Status Banner */}
      {gates && (
        <div className={`rounded-xl border p-4 ${gates.allowed ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
          <div className="flex items-center gap-3">
            {gates.allowed ? (
              <CheckCircle className="w-5 h-5 text-green-600" />
            ) : (
              <Lock className="w-5 h-5 text-red-600" />
            )}
            <div>
              <span className={`font-semibold ${gates.allowed ? 'text-green-700' : 'text-red-700'}`}>
                {gates.allowed ? 'Compounding Enabled' : 'Compounding Blocked'}
              </span>
              {gates.reason && (
                <p className="text-sm mt-0.5 text-gray-600">{gates.reason}</p>
              )}
              <p className="text-xs text-gray-500 mt-0.5">
                Readiness: <span className={`font-semibold ${scoreColor(gates.readinessScore)}`}>{pct(gates.readinessScore)}</span>
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-lg w-fit">
        {tabs.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition ${
              tab === t.key ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <t.icon className="w-4 h-4" />
            {t.label}
            {t.key === 'actions' && pendingApproval > 0 && (
              <span className="ml-1 px-1.5 py-0.5 bg-yellow-100 text-yellow-700 rounded-full text-xs">
                {pendingApproval}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ── Overview Tab ──────────────────────────────── */}
      {tab === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-xl border p-4">
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <Settings className="w-4 h-4" />
                Active Policies
              </div>
              <div className="text-2xl font-bold mt-1">{activePolicies}</div>
              <div className="text-xs text-gray-400 mt-1">{policies.length} total</div>
            </div>
            <div className="bg-white rounded-xl border p-4">
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <Zap className="w-4 h-4 text-green-500" />
                Actions Executed
              </div>
              <div className="text-2xl font-bold mt-1 text-green-600">{totalExecuted}</div>
            </div>
            <div className="bg-white rounded-xl border p-4">
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <DollarSign className="w-4 h-4 text-indigo-500" />
                Total Allocated
              </div>
              <div className="text-2xl font-bold mt-1">{fmt(totalAllocated)}</div>
            </div>
            <div className="bg-white rounded-xl border p-4">
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <AlertTriangle className="w-4 h-4 text-yellow-500" />
                Pending Approval
              </div>
              <div className="text-2xl font-bold mt-1 text-yellow-600">{pendingApproval}</div>
            </div>
          </div>

          {/* Recent Runs */}
          <div className="bg-white rounded-xl border p-6">
            <h2 className="text-lg font-semibold mb-4">Recent Compounding Runs</h2>
            {runs.length === 0 ? (
              <p className="text-gray-500 text-sm">No compounding runs yet. Try a &quot;Dry Run&quot; first.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left text-gray-500">
                      <th className="pb-2 pr-4">Mode</th>
                      <th className="pb-2 pr-4">Evaluated</th>
                      <th className="pb-2 pr-4">Eligible</th>
                      <th className="pb-2 pr-4">Executed</th>
                      <th className="pb-2 pr-4">Blocked</th>
                      <th className="pb-2 pr-4">Readiness</th>
                      <th className="pb-2">When</th>
                    </tr>
                  </thead>
                  <tbody>
                    {runs.slice(0, 10).map(r => (
                      <tr key={r.run_id} className="border-b last:border-0">
                        <td className="py-2 pr-4">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${ACTION_COLORS[r.mode] || ''}`}>
                            {r.mode}
                          </span>
                        </td>
                        <td className="py-2 pr-4">{r.policies_evaluated}</td>
                        <td className="py-2 pr-4">{r.policies_eligible}</td>
                        <td className="py-2 pr-4 text-green-600 font-semibold">{r.actions_executed}</td>
                        <td className="py-2 pr-4 text-red-600">{r.actions_blocked}</td>
                        <td className={`py-2 pr-4 font-semibold ${scoreColor(Number(r.readiness_score))}`}>
                          {pct(Number(r.readiness_score))}
                        </td>
                        <td className="py-2 text-gray-500">
                          {r.created_at ? new Date(r.created_at).toLocaleString() : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Policies Tab ──────────────────────────────── */}
      {tab === 'policies' && (
        <div className="space-y-3">
          {policies.map(p => (
            <div key={p.policy_id} className="bg-white rounded-xl border">
              <button
                className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-50"
                onClick={() => setExpandedPolicy(expandedPolicy === p.policy_id ? null : p.policy_id)}
              >
                <div className="flex items-center gap-3">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[p.status] || ''}`}>
                    {p.status}
                  </span>
                  <span className="font-semibold">{p.name}</span>
                  <span className="text-gray-500 text-sm">Priority {p.priority}</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={(e) => { e.stopPropagation(); togglePolicyStatus(p.policy_id, p.status); }}
                    className={`px-2 py-1 rounded text-xs ${
                      p.status === 'active' ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200' : 'bg-green-100 text-green-700 hover:bg-green-200'
                    }`}
                  >
                    {p.status === 'active' ? <Pause className="w-3 h-3 inline" /> : <Play className="w-3 h-3 inline" />}
                    {p.status === 'active' ? ' Pause' : ' Activate'}
                  </button>
                  {expandedPolicy === p.policy_id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </div>
              </button>

              {expandedPolicy === p.policy_id && (
                <div className="px-4 pb-4 border-t">
                  <p className="text-sm text-gray-600 mt-3">{p.description}</p>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
                    <div className="text-xs">
                      <span className="text-gray-500">Action Type</span>
                      <div className="font-medium mt-0.5">{p.action_type.replace(/_/g, ' ')}</div>
                    </div>
                    <div className="text-xs">
                      <span className="text-gray-500">Requires Approval</span>
                      <div className="font-medium mt-0.5">{p.requires_approval ? 'Yes' : 'No'}</div>
                    </div>
                    <div className="text-xs">
                      <span className="text-gray-500">Max/Quarter</span>
                      <div className="font-medium mt-0.5">{p.max_executions_per_quarter}</div>
                    </div>
                    <div className="text-xs">
                      <span className="text-gray-500">Cooldown</span>
                      <div className="font-medium mt-0.5">{p.cooldown_days} days</div>
                    </div>
                  </div>

                  <div className="mt-4">
                    <span className="text-xs font-semibold text-gray-500">CONDITIONS</span>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-2">
                      {p.min_retained_earnings != null && (
                        <div className="text-xs bg-gray-50 rounded p-2">
                          <span className="text-gray-500">Min Retained</span>
                          <div className="font-medium">{fmt(Number(p.min_retained_earnings))}</div>
                        </div>
                      )}
                      {p.min_buffer_health != null && (
                        <div className="text-xs bg-gray-50 rounded p-2">
                          <span className="text-gray-500">Min Buffer Health</span>
                          <div className="font-medium">{Number(p.min_buffer_health)}%</div>
                        </div>
                      )}
                      <div className="text-xs bg-gray-50 rounded p-2">
                        <span className="text-gray-500">Min Buffer Days</span>
                        <div className="font-medium">{p.min_buffer_days}</div>
                      </div>
                      {p.min_channel_quality != null && (
                        <div className="text-xs bg-gray-50 rounded p-2">
                          <span className="text-gray-500">Min Channel Quality</span>
                          <div className="font-medium">{Number(p.min_channel_quality)}</div>
                        </div>
                      )}
                      {p.max_fraud_rate != null && (
                        <div className="text-xs bg-gray-50 rounded p-2">
                          <span className="text-gray-500">Max Fraud Rate</span>
                          <div className="font-medium">{pct(Number(p.max_fraud_rate))}</div>
                        </div>
                      )}
                      <div className="text-xs bg-gray-50 rounded p-2">
                        <span className="text-gray-500">Min Readiness</span>
                        <div className="font-medium">{pct(Number(p.min_readiness_score))}</div>
                      </div>
                    </div>
                  </div>

                  {p.action_params && Object.keys(p.action_params).length > 0 && (
                    <div className="mt-4">
                      <span className="text-xs font-semibold text-gray-500">ACTION PARAMS</span>
                      <pre className="mt-1 bg-gray-50 rounded p-2 text-xs overflow-x-auto">
                        {JSON.stringify(p.action_params, null, 2)}
                      </pre>
                    </div>
                  )}

                  <div className="mt-3 flex gap-4 text-xs text-gray-400">
                    {p.last_evaluated && <span>Last evaluated: {new Date(p.last_evaluated).toLocaleDateString()}</span>}
                    {p.last_executed && <span>Last executed: {new Date(p.last_executed).toLocaleDateString()}</span>}
                  </div>
                </div>
              )}
            </div>
          ))}
          {policies.length === 0 && (
            <p className="text-gray-500 text-sm text-center py-8">No policies configured.</p>
          )}
        </div>
      )}

      {/* ── Dry Run Tab ───────────────────────────────── */}
      {tab === 'dry-run' && (
        <div className="space-y-6">
          <div className="bg-white rounded-xl border p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Dry-Run Planner</h2>
              <button
                onClick={runDryRun}
                disabled={running}
                className="flex items-center gap-1.5 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 text-sm"
              >
                <Eye className="w-4 h-4" />
                {running ? 'Evaluating...' : 'Evaluate Now'}
              </button>
            </div>
            <p className="text-sm text-gray-500 mb-4">
              See what would happen if compounding policies were executed today — no capital is moved.
            </p>

            {dryRunResult ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="bg-gray-50 rounded-lg p-3 text-center">
                    <div className="text-2xl font-bold">{dryRunResult.policies_evaluated}</div>
                    <div className="text-xs text-gray-500">Evaluated</div>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3 text-center">
                    <div className="text-2xl font-bold text-green-600">{dryRunResult.policies_eligible}</div>
                    <div className="text-xs text-gray-500">Eligible</div>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3 text-center">
                    <div className="text-2xl font-bold text-indigo-600">{dryRunResult.actions_proposed}</div>
                    <div className="text-xs text-gray-500">Proposed</div>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3 text-center">
                    <div className="text-2xl font-bold text-red-600">{dryRunResult.actions_blocked}</div>
                    <div className="text-xs text-gray-500">Would Block</div>
                  </div>
                </div>

                {dryRunResult.gate_blocked && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-red-700 text-sm">
                    <Lock className="w-4 h-4 inline mr-1" />
                    {dryRunResult.gate_reason}
                  </div>
                )}

                {dryRunResult.actions?.length > 0 && (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b text-left text-gray-500">
                          <th className="pb-2 pr-4">Policy</th>
                          <th className="pb-2 pr-4">Action</th>
                          <th className="pb-2 pr-4">Amount</th>
                          <th className="pb-2 pr-4">Vertical</th>
                          <th className="pb-2">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {dryRunResult.actions.map((a: any) => (
                          <tr key={a.action_id} className="border-b last:border-0">
                            <td className="py-2 pr-4 font-medium">{a.policy_name}</td>
                            <td className="py-2 pr-4 text-gray-600">{a.action_type.replace(/_/g, ' ')}</td>
                            <td className="py-2 pr-4 font-semibold">{fmt(a.amount)}</td>
                            <td className="py-2 pr-4">{a.target_vertical || '—'}</td>
                            <td className="py-2">
                              {a.blocked ? (
                                <span className="text-red-600 text-xs">{a.blocked_reason}</span>
                              ) : (
                                <span className="text-green-600 text-xs font-medium">Would Execute</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-400">
                <Eye className="w-12 h-12 mx-auto mb-3" />
                <p>Click &quot;Evaluate Now&quot; to preview compounding actions.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Actions Tab ───────────────────────────────── */}
      {tab === 'actions' && (
        <div className="bg-white rounded-xl border">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-gray-500 bg-gray-50">
                  <th className="p-3">ID</th>
                  <th className="p-3">Policy</th>
                  <th className="p-3">Type</th>
                  <th className="p-3">Amount</th>
                  <th className="p-3">Mode</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">When</th>
                  <th className="p-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {actions.map(a => (
                  <tr key={a.action_id} className="border-b last:border-0">
                    <td className="p-3 font-mono text-xs">{a.action_id}</td>
                    <td className="p-3 font-medium">{a.policy_name || `Policy #${a.policy_id}`}</td>
                    <td className="p-3 text-gray-600">{a.action_type.replace(/_/g, ' ')}</td>
                    <td className="p-3 font-semibold">{fmt(Number(a.amount))}</td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${ACTION_COLORS[a.mode] || ''}`}>
                        {a.mode}
                      </span>
                    </td>
                    <td className="p-3">
                      {a.executed ? (
                        <span className="text-green-600 text-xs font-medium">Executed</span>
                      ) : a.blocked ? (
                        <span className="text-red-600 text-xs" title={a.blocked_reason || ''}>Blocked</span>
                      ) : a.mode === 'proposed' ? (
                        <span className="text-yellow-600 text-xs font-medium">Pending</span>
                      ) : (
                        <span className="text-gray-500 text-xs">Dry Run</span>
                      )}
                    </td>
                    <td className="p-3 text-gray-500 text-xs">
                      {a.created_at ? new Date(a.created_at).toLocaleString() : '—'}
                    </td>
                    <td className="p-3">
                      {a.mode === 'proposed' && !a.executed && !a.blocked && (
                        <div className="flex gap-1">
                          <button
                            onClick={() => approveAction(a.action_id)}
                            className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs hover:bg-green-200"
                          >
                            <CheckCircle className="w-3 h-3 inline" /> Approve
                          </button>
                          <button
                            onClick={() => rejectAction(a.action_id)}
                            className="px-2 py-1 bg-red-100 text-red-700 rounded text-xs hover:bg-red-200"
                          >
                            <XCircle className="w-3 h-3 inline" /> Reject
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
                {actions.length === 0 && (
                  <tr>
                    <td colSpan={8} className="p-6 text-center text-gray-500">
                      No compounding actions yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Allocations Tab ───────────────────────────── */}
      {tab === 'allocations' && (
        <div className="space-y-6">
          {/* Allocation Summary */}
          {allocations.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {Object.entries(
                allocations.reduce<Record<string, number>>((acc, a) => {
                  acc[a.vertical] = (acc[a.vertical] || 0) + Number(a.amount);
                  return acc;
                }, {})
              ).map(([vertical, total]) => (
                <div key={vertical} className="bg-white rounded-xl border p-4">
                  <div className="text-sm text-gray-500 capitalize">{vertical}</div>
                  <div className="text-2xl font-bold mt-1">{fmt(total)}</div>
                  <div className="text-xs text-gray-400 mt-1">
                    {allocations.filter(a => a.vertical === vertical).length} allocations
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="bg-white rounded-xl border">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-gray-500 bg-gray-50">
                    <th className="p-3">Vertical</th>
                    <th className="p-3">Amount</th>
                    <th className="p-3">Source</th>
                    <th className="p-3">Status</th>
                    <th className="p-3">Deployed</th>
                    <th className="p-3">Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {allocations.map(a => (
                    <tr key={a.allocation_id} className="border-b last:border-0">
                      <td className="p-3 font-medium capitalize">{a.vertical}</td>
                      <td className="p-3 font-semibold">{fmt(Number(a.amount))}</td>
                      <td className="p-3 text-gray-600">{a.source}</td>
                      <td className="p-3">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                          a.status === 'deployed' ? 'bg-green-100 text-green-700' :
                          a.status === 'allocated' ? 'bg-blue-100 text-blue-700' :
                          a.status === 'returned' ? 'bg-gray-100 text-gray-500' :
                          'bg-yellow-100 text-yellow-700'
                        }`}>
                          {a.status}
                        </span>
                      </td>
                      <td className="p-3 text-gray-500 text-xs">
                        {a.deployed_at ? new Date(a.deployed_at).toLocaleDateString() : '—'}
                      </td>
                      <td className="p-3 text-gray-500 text-xs">{a.notes || '—'}</td>
                    </tr>
                  ))}
                  {allocations.length === 0 && (
                    <tr>
                      <td colSpan={6} className="p-6 text-center text-gray-500">
                        No vertical allocations yet. Execute compounding policies to allocate capital.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
