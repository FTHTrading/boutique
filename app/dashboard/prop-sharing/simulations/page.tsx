'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  Activity, Play, RefreshCw, CheckCircle, XCircle, AlertTriangle,
  BarChart3, Shield, TrendingUp, ChevronDown, ChevronUp,
  Clock, Zap, Eye, Filter,
} from 'lucide-react';

interface SimRun {
  run_id: number;
  scenario: string;
  scenario_name: string;
  status: string;
  seed: number;
  total_events: number;
  total_assertions: number;
  passed: number;
  failed: number;
  warnings: number;
  enforcement_score: number;
  trace_integrity_score: number;
  behavior_seam_score: number;
  funnel_cliff_score: number;
  compounding_readiness: number;
  started_at: string;
  completed_at: string;
  duration_ms: number;
  error_message?: string;
  created_at: string;
}

interface SimAssertion {
  assertion_id: number;
  run_id: number;
  event_id?: number;
  category: string;
  assertion_name: string;
  description: string;
  expected_value: string;
  actual_value: string;
  result: string;
  tolerance?: number;
  deviation?: number;
  severity: string;
  event_type?: string;
  event_description?: string;
}

interface SimEvent {
  event_id: number;
  run_id: number;
  sequence_num: number;
  event_type: string;
  description: string;
  input_state: Record<string, any>;
  output_state: Record<string, any>;
  entity_type: string;
  entity_id: string;
  duration_ms: number;
  created_at: string;
}

const RESULT_COLORS: Record<string, string> = {
  pass: 'bg-green-100 text-green-700',
  fail: 'bg-red-100 text-red-700',
  warn: 'bg-yellow-100 text-yellow-700',
  skip: 'bg-gray-100 text-gray-500',
};

const STATUS_COLORS: Record<string, string> = {
  completed: 'bg-green-100 text-green-700',
  running: 'bg-blue-100 text-blue-700',
  pending: 'bg-gray-100 text-gray-500',
  failed: 'bg-red-100 text-red-700',
};

const SCENARIO_ICONS: Record<string, any> = {
  full_lifecycle: Activity,
  treasury_throttle: Shield,
  behavior_seams: Zap,
  funnel_suppression: Filter,
  execution_blackout: XCircle,
  enforcement_verify: CheckCircle,
};

type TabKey = 'overview' | 'runs' | 'assertions' | 'readiness';

export default function SimulationsPage() {
  const [tab, setTab] = useState<TabKey>('overview');
  const [runs, setRuns] = useState<SimRun[]>([]);
  const [selectedRun, setSelectedRun] = useState<SimRun | null>(null);
  const [runEvents, setRunEvents] = useState<SimEvent[]>([]);
  const [runAssertions, setRunAssertions] = useState<SimAssertion[]>([]);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [expandedEvent, setExpandedEvent] = useState<number | null>(null);
  const [filterResult, setFilterResult] = useState<string>('');

  const fetchRuns = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/prop-sharing/simulations?section=runs&limit=50');
      const json = await res.json();
      if (json.success) setRuns(json.data.runs || []);
    } catch (err) { console.error(err); }
    setLoading(false);
  }, []);

  const fetchRunDetail = useCallback(async (runId: number) => {
    try {
      const res = await fetch(`/api/prop-sharing/simulations?section=run&run_id=${runId}`);
      const json = await res.json();
      if (json.success) {
        setSelectedRun(json.data.run);
        setRunEvents(json.data.events || []);
        setRunAssertions(json.data.assertions || []);
      }
    } catch (err) { console.error(err); }
  }, []);

  useEffect(() => { fetchRuns(); }, [fetchRuns]);

  const runScenario = async (scenario: string) => {
    setRunning(true);
    try {
      const res = await fetch('/api/prop-sharing/simulations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'run_scenario', scenario }),
      });
      const json = await res.json();
      if (json.success) {
        await fetchRuns();
        if (json.data.run_id) await fetchRunDetail(json.data.run_id);
      }
    } catch (err) { console.error(err); }
    setRunning(false);
  };

  const runSuite = async () => {
    setRunning(true);
    try {
      const res = await fetch('/api/prop-sharing/simulations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'run_suite' }),
      });
      await res.json();
      await fetchRuns();
    } catch (err) { console.error(err); }
    setRunning(false);
  };

  const verifyEnforcement = async () => {
    setRunning(true);
    try {
      const res = await fetch('/api/prop-sharing/simulations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'verify_enforcement' }),
      });
      const json = await res.json();
      if (json.success) {
        await fetchRuns();
        if (json.data.run?.run_id) await fetchRunDetail(json.data.run.run_id);
      }
    } catch (err) { console.error(err); }
    setRunning(false);
  };

  const latestReadiness = runs.find(r => r.status === 'completed');
  const passRate = runs.length
    ? runs.filter(r => r.status === 'completed' && r.failed === 0).length / runs.filter(r => r.status === 'completed').length
    : 0;

  const filteredAssertions = filterResult
    ? runAssertions.filter(a => a.result === filterResult)
    : runAssertions;

  const scorePct = (v: number) => `${(v * 100).toFixed(1)}%`;
  const scoreColor = (v: number) => v >= 0.9 ? 'text-green-600' : v >= 0.7 ? 'text-yellow-600' : 'text-red-600';

  const tabs: { key: TabKey; label: string; icon: any }[] = [
    { key: 'overview', label: 'Overview', icon: BarChart3 },
    { key: 'runs', label: 'Runs', icon: Activity },
    { key: 'assertions', label: 'Assertions', icon: CheckCircle },
    { key: 'readiness', label: 'Readiness', icon: TrendingUp },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Stress Simulations</h1>
          <p className="text-sm text-gray-500 mt-1">
            V5-D — Prove every V4 reflex fires, find seams, verify enforcement
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={verifyEnforcement}
            disabled={running}
            className="flex items-center gap-1.5 px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 text-sm"
          >
            <Shield className="w-4 h-4" />
            Verify Enforcement
          </button>
          <button
            onClick={runSuite}
            disabled={running}
            className="flex items-center gap-1.5 px-3 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 text-sm"
          >
            <Play className="w-4 h-4" />
            {running ? 'Running...' : 'Run Full Suite'}
          </button>
          <button
            onClick={fetchRuns}
            disabled={loading}
            className="p-2 text-gray-500 hover:text-gray-700 rounded-lg hover:bg-gray-100"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

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
          </button>
        ))}
      </div>

      {/* ── Overview Tab ──────────────────────────────── */}
      {tab === 'overview' && (
        <div className="space-y-6">
          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-xl border p-4">
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <Activity className="w-4 h-4" />
                Total Runs
              </div>
              <div className="text-2xl font-bold mt-1">{runs.length}</div>
            </div>
            <div className="bg-white rounded-xl border p-4">
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <CheckCircle className="w-4 h-4 text-green-500" />
                Pass Rate
              </div>
              <div className={`text-2xl font-bold mt-1 ${scoreColor(passRate)}`}>
                {scorePct(passRate)}
              </div>
            </div>
            <div className="bg-white rounded-xl border p-4">
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <TrendingUp className="w-4 h-4 text-indigo-500" />
                Readiness Score
              </div>
              <div className={`text-2xl font-bold mt-1 ${scoreColor(Number(latestReadiness?.compounding_readiness ?? 0))}`}>
                {latestReadiness ? scorePct(Number(latestReadiness.compounding_readiness)) : '—'}
              </div>
            </div>
            <div className="bg-white rounded-xl border p-4">
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <Shield className="w-4 h-4 text-purple-500" />
                Enforcement
              </div>
              <div className={`text-2xl font-bold mt-1 ${scoreColor(Number(latestReadiness?.enforcement_score ?? 0))}`}>
                {latestReadiness ? scorePct(Number(latestReadiness.enforcement_score)) : '—'}
              </div>
            </div>
          </div>

          {/* Run Scenarios */}
          <div className="bg-white rounded-xl border p-6">
            <h2 className="text-lg font-semibold mb-4">Run Individual Scenarios</h2>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
              {['full_lifecycle', 'treasury_throttle', 'behavior_seams', 'funnel_suppression', 'execution_blackout'].map(s => {
                const Icon = SCENARIO_ICONS[s] || Activity;
                return (
                  <button
                    key={s}
                    onClick={() => runScenario(s)}
                    disabled={running}
                    className="flex flex-col items-center gap-2 p-4 border rounded-lg hover:bg-gray-50 disabled:opacity-50 transition"
                  >
                    <Icon className="w-6 h-6 text-indigo-600" />
                    <span className="text-sm font-medium text-center">
                      {s.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Recent Runs */}
          <div className="bg-white rounded-xl border p-6">
            <h2 className="text-lg font-semibold mb-4">Recent Runs</h2>
            {runs.length === 0 ? (
              <p className="text-gray-500 text-sm">No simulation runs yet. Click &quot;Run Full Suite&quot; to start.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left text-gray-500">
                      <th className="pb-2 pr-4">Scenario</th>
                      <th className="pb-2 pr-4">Status</th>
                      <th className="pb-2 pr-4">Pass/Fail</th>
                      <th className="pb-2 pr-4">Readiness</th>
                      <th className="pb-2 pr-4">Duration</th>
                      <th className="pb-2">When</th>
                    </tr>
                  </thead>
                  <tbody>
                    {runs.slice(0, 10).map(r => (
                      <tr key={r.run_id} className="border-b last:border-0 hover:bg-gray-50 cursor-pointer" onClick={() => { fetchRunDetail(r.run_id); setTab('assertions'); }}>
                        <td className="py-2 pr-4 font-medium">{r.scenario_name}</td>
                        <td className="py-2 pr-4">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[r.status] || ''}`}>
                            {r.status}
                          </span>
                        </td>
                        <td className="py-2 pr-4">
                          <span className="text-green-600">{r.passed}P</span>
                          {' / '}
                          <span className="text-red-600">{r.failed}F</span>
                          {r.warnings > 0 && <span className="text-yellow-600"> / {r.warnings}W</span>}
                        </td>
                        <td className="py-2 pr-4">
                          <span className={`font-semibold ${scoreColor(Number(r.compounding_readiness))}`}>
                            {scorePct(Number(r.compounding_readiness))}
                          </span>
                        </td>
                        <td className="py-2 pr-4 text-gray-500">{r.duration_ms ? `${Math.round(r.duration_ms)}ms` : '—'}</td>
                        <td className="py-2 text-gray-500">{r.created_at ? new Date(r.created_at).toLocaleString() : '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Runs Tab ──────────────────────────────────── */}
      {tab === 'runs' && (
        <div className="space-y-4">
          <div className="bg-white rounded-xl border">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-gray-500 bg-gray-50">
                    <th className="p-3">ID</th>
                    <th className="p-3">Scenario</th>
                    <th className="p-3">Status</th>
                    <th className="p-3">Assertions</th>
                    <th className="p-3">Enforcement</th>
                    <th className="p-3">Trace</th>
                    <th className="p-3">Behavior</th>
                    <th className="p-3">Funnel</th>
                    <th className="p-3">Readiness</th>
                    <th className="p-3">Duration</th>
                  </tr>
                </thead>
                <tbody>
                  {runs.map(r => (
                    <tr
                      key={r.run_id}
                      className={`border-b last:border-0 hover:bg-gray-50 cursor-pointer ${selectedRun?.run_id === r.run_id ? 'bg-indigo-50' : ''}`}
                      onClick={() => fetchRunDetail(r.run_id)}
                    >
                      <td className="p-3 font-mono text-xs">{r.run_id}</td>
                      <td className="p-3 font-medium">{r.scenario_name}</td>
                      <td className="p-3">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[r.status] || ''}`}>
                          {r.status}
                        </span>
                      </td>
                      <td className="p-3">
                        <span className="text-green-600">{r.passed}</span>/{r.total_assertions}
                      </td>
                      <td className={`p-3 font-semibold ${scoreColor(Number(r.enforcement_score))}`}>
                        {scorePct(Number(r.enforcement_score))}
                      </td>
                      <td className={`p-3 font-semibold ${scoreColor(Number(r.trace_integrity_score))}`}>
                        {scorePct(Number(r.trace_integrity_score))}
                      </td>
                      <td className={`p-3 font-semibold ${scoreColor(Number(r.behavior_seam_score))}`}>
                        {scorePct(Number(r.behavior_seam_score))}
                      </td>
                      <td className={`p-3 font-semibold ${scoreColor(Number(r.funnel_cliff_score))}`}>
                        {scorePct(Number(r.funnel_cliff_score))}
                      </td>
                      <td className={`p-3 font-bold ${scoreColor(Number(r.compounding_readiness))}`}>
                        {scorePct(Number(r.compounding_readiness))}
                      </td>
                      <td className="p-3 text-gray-500">{r.duration_ms ? `${Math.round(r.duration_ms)}ms` : '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Run Detail Panel */}
          {selectedRun && (
            <div className="bg-white rounded-xl border p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">
                  Run #{selectedRun.run_id}: {selectedRun.scenario_name}
                </h2>
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[selectedRun.status] || ''}`}>
                  {selectedRun.status}
                </span>
              </div>

              {selectedRun.error_message && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-red-700 text-sm">
                  {selectedRun.error_message}
                </div>
              )}

              {/* Event Timeline */}
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-2">Event Timeline</h3>
                <div className="space-y-2">
                  {runEvents.map(e => (
                    <div key={e.event_id} className="border rounded-lg">
                      <button
                        className="w-full flex items-center justify-between p-3 text-left hover:bg-gray-50"
                        onClick={() => setExpandedEvent(expandedEvent === e.event_id ? null : e.event_id)}
                      >
                        <div className="flex items-center gap-2">
                          <span className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-xs font-mono">
                            {e.sequence_num}
                          </span>
                          <span className="font-medium text-sm">{e.event_type}</span>
                          <span className="text-gray-500 text-sm">{e.description}</span>
                        </div>
                        {expandedEvent === e.event_id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </button>
                      {expandedEvent === e.event_id && (
                        <div className="px-3 pb-3 text-xs">
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <span className="font-semibold text-gray-500">Input State</span>
                              <pre className="mt-1 bg-gray-50 rounded p-2 overflow-x-auto">
                                {JSON.stringify(e.input_state, null, 2)}
                              </pre>
                            </div>
                            <div>
                              <span className="font-semibold text-gray-500">Output State</span>
                              <pre className="mt-1 bg-gray-50 rounded p-2 overflow-x-auto">
                                {JSON.stringify(e.output_state, null, 2)}
                              </pre>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                  {runEvents.length === 0 && (
                    <p className="text-gray-500 text-sm">No events recorded.</p>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Assertions Tab ────────────────────────────── */}
      {tab === 'assertions' && (
        <div className="space-y-4">
          {/* Filter */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">Filter:</span>
            {['', 'pass', 'fail', 'warn'].map(f => (
              <button
                key={f}
                onClick={() => setFilterResult(f)}
                className={`px-3 py-1 rounded-full text-xs font-medium transition ${
                  filterResult === f ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                }`}
              >
                {f || 'All'}
              </button>
            ))}
            {selectedRun && (
              <span className="ml-auto text-sm text-gray-500">
                Run #{selectedRun.run_id}: {selectedRun.scenario_name}
              </span>
            )}
          </div>

          <div className="bg-white rounded-xl border">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-gray-500 bg-gray-50">
                    <th className="p-3">Result</th>
                    <th className="p-3">Category</th>
                    <th className="p-3">Assertion</th>
                    <th className="p-3">Description</th>
                    <th className="p-3">Expected</th>
                    <th className="p-3">Actual</th>
                    <th className="p-3">Severity</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAssertions.map(a => (
                    <tr key={a.assertion_id} className="border-b last:border-0">
                      <td className="p-3">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${RESULT_COLORS[a.result] || ''}`}>
                          {a.result}
                        </span>
                      </td>
                      <td className="p-3 text-gray-600">{a.category}</td>
                      <td className="p-3 font-medium font-mono text-xs">{a.assertion_name}</td>
                      <td className="p-3 text-gray-600">{a.description}</td>
                      <td className="p-3 font-mono text-xs">{a.expected_value}</td>
                      <td className="p-3 font-mono text-xs">{a.actual_value}</td>
                      <td className="p-3">
                        <span className={`text-xs font-medium ${
                          a.severity === 'critical' ? 'text-red-600' :
                          a.severity === 'major' ? 'text-yellow-600' : 'text-gray-500'
                        }`}>
                          {a.severity}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {filteredAssertions.length === 0 && (
                    <tr>
                      <td colSpan={7} className="p-6 text-center text-gray-500">
                        {selectedRun ? 'No assertions match the filter.' : 'Select a run from the Runs tab to view assertions.'}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ── Readiness Tab ─────────────────────────────── */}
      {tab === 'readiness' && (
        <div className="space-y-6">
          {/* Readiness Score Cards */}
          {latestReadiness ? (
            <>
              <div className="bg-white rounded-xl border p-6">
                <h2 className="text-lg font-semibold mb-4">Compounding Readiness Score</h2>
                <div className="flex items-center gap-6">
                  <div className={`text-5xl font-bold ${scoreColor(Number(latestReadiness.compounding_readiness))}`}>
                    {scorePct(Number(latestReadiness.compounding_readiness))}
                  </div>
                  <div className="text-sm text-gray-500">
                    <p>This score determines whether the Capital Compounding Engine (V5-B) is permitted to operate.</p>
                    <p className="mt-1">Threshold: <span className="font-semibold">70%</span> minimum required.</p>
                    <p className="mt-1">
                      Status:{' '}
                      {Number(latestReadiness.compounding_readiness) >= 0.7 ? (
                        <span className="text-green-600 font-semibold">Ready for compounding</span>
                      ) : (
                        <span className="text-red-600 font-semibold">Not ready — fix failing assertions</span>
                      )}
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {[
                  { label: 'Enforcement', key: 'enforcement_score', desc: 'Treasury gates + kill switches respond correctly' },
                  { label: 'Trace Integrity', key: 'trace_integrity_score', desc: 'All V4 tables accessible and joinable' },
                  { label: 'Behavior Seams', key: 'behavior_seam_score', desc: 'No gaps between scoring and interventions' },
                  { label: 'Funnel Cliffs', key: 'funnel_cliff_score', desc: 'Channel quality → suppression path intact' },
                ].map(s => {
                  const val = Number((latestReadiness as any)[s.key] ?? 0);
                  return (
                    <div key={s.key} className="bg-white rounded-xl border p-4">
                      <div className="text-sm text-gray-500 mb-1">{s.label}</div>
                      <div className={`text-2xl font-bold ${scoreColor(val)}`}>
                        {scorePct(val)}
                      </div>
                      <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full ${val >= 0.9 ? 'bg-green-500' : val >= 0.7 ? 'bg-yellow-500' : 'bg-red-500'}`}
                          style={{ width: `${val * 100}%` }}
                        />
                      </div>
                      <p className="text-xs text-gray-400 mt-2">{s.desc}</p>
                    </div>
                  );
                })}
              </div>
            </>
          ) : (
            <div className="bg-white rounded-xl border p-6 text-center text-gray-500">
              <Activity className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p className="font-medium">No readiness data yet</p>
              <p className="text-sm mt-1">Run the full simulation suite to generate readiness scores.</p>
              <button
                onClick={runSuite}
                disabled={running}
                className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 text-sm"
              >
                {running ? 'Running...' : 'Run Full Suite'}
              </button>
            </div>
          )}

          {/* Readiness History */}
          <div className="bg-white rounded-xl border p-6">
            <h2 className="text-lg font-semibold mb-4">Readiness History</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-gray-500">
                    <th className="pb-2 pr-4">Run</th>
                    <th className="pb-2 pr-4">Scenario</th>
                    <th className="pb-2 pr-4">Enforcement</th>
                    <th className="pb-2 pr-4">Trace</th>
                    <th className="pb-2 pr-4">Behavior</th>
                    <th className="pb-2 pr-4">Funnel</th>
                    <th className="pb-2 pr-4">Readiness</th>
                    <th className="pb-2">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {runs.filter(r => r.status === 'completed').slice(0, 20).map(r => (
                    <tr key={r.run_id} className="border-b last:border-0">
                      <td className="py-2 pr-4 font-mono text-xs">{r.run_id}</td>
                      <td className="py-2 pr-4">{r.scenario_name}</td>
                      <td className={`py-2 pr-4 font-semibold ${scoreColor(Number(r.enforcement_score))}`}>
                        {scorePct(Number(r.enforcement_score))}
                      </td>
                      <td className={`py-2 pr-4 font-semibold ${scoreColor(Number(r.trace_integrity_score))}`}>
                        {scorePct(Number(r.trace_integrity_score))}
                      </td>
                      <td className={`py-2 pr-4 font-semibold ${scoreColor(Number(r.behavior_seam_score))}`}>
                        {scorePct(Number(r.behavior_seam_score))}
                      </td>
                      <td className={`py-2 pr-4 font-semibold ${scoreColor(Number(r.funnel_cliff_score))}`}>
                        {scorePct(Number(r.funnel_cliff_score))}
                      </td>
                      <td className={`py-2 pr-4 font-bold ${scoreColor(Number(r.compounding_readiness))}`}>
                        {scorePct(Number(r.compounding_readiness))}
                      </td>
                      <td className="py-2 text-gray-500">
                        {r.completed_at ? new Date(r.completed_at).toLocaleDateString() : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
