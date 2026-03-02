'use client';

import { useEffect, useState, useCallback } from 'react';
import { AlertTriangle, Shield, Search, Eye, CheckCircle, XCircle, Clock, Filter, RefreshCw, AlertOctagon, Zap, BarChart3, Copy, Newspaper, TrendingDown, Bot } from 'lucide-react';

interface FraudAlert {
  alert_id: string;
  account_id: string;
  account_number: string;
  trader_name: string;
  trader_email: string;
  program_name: string;
  alert_type: string;
  severity: string;
  status: string;
  title: string;
  description: string;
  evidence: Record<string, any>;
  flagged_trades: string[];
  detection_score: number;
  reviewed_by: string | null;
  reviewed_at: string | null;
  resolution_notes: string | null;
  action_taken: string | null;
  created_at: string;
}

interface Summary {
  total: number;
  open: number;
  investigating: number;
  confirmed: number;
  dismissed: number;
  resolved: number;
  critical_active: number;
  high_active: number;
}

const SEVERITY_COLORS: Record<string, string> = {
  critical: 'bg-red-100 text-red-800 border-red-200',
  high: 'bg-orange-100 text-orange-800 border-orange-200',
  medium: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  low: 'bg-blue-100 text-blue-800 border-blue-200',
};

const STATUS_COLORS: Record<string, string> = {
  open: 'bg-red-100 text-red-700',
  investigating: 'bg-yellow-100 text-yellow-700',
  confirmed: 'bg-red-200 text-red-800',
  dismissed: 'bg-gray-100 text-gray-600',
  resolved: 'bg-green-100 text-green-700',
};

const ALERT_TYPE_ICONS: Record<string, any> = {
  latency_arbitrage: Zap,
  overfit_scalping: TrendingDown,
  copy_trading: Copy,
  news_straddling: Newspaper,
  statistical_anomaly: BarChart3,
  account_cycling: RefreshCw,
  identity_fraud: Shield,
  collusion: Bot,
};

const ALERT_TYPE_LABELS: Record<string, string> = {
  latency_arbitrage: 'Latency Arbitrage',
  overfit_scalping: 'Overfit Scalping',
  copy_trading: 'Copy Trading',
  news_straddling: 'News Straddling',
  statistical_anomaly: 'Statistical Anomaly',
  account_cycling: 'Account Cycling',
  identity_fraud: 'Identity Fraud',
  collusion: 'Collusion',
};

export default function FraudDetectionPage() {
  const [alerts, setAlerts] = useState<FraudAlert[]>([]);
  const [summary, setSummary] = useState<Summary>({ total: 0, open: 0, investigating: 0, confirmed: 0, dismissed: 0, resolved: 0, critical_active: 0, high_active: 0 });
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);
  const [statusFilter, setStatusFilter] = useState('');
  const [severityFilter, setSeverityFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [selectedAlert, setSelectedAlert] = useState<FraudAlert | null>(null);
  const [reviewNotes, setReviewNotes] = useState('');
  const [reviewAction, setReviewAction] = useState('');

  const fetchAlerts = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (statusFilter) params.set('status', statusFilter);
      if (severityFilter) params.set('severity', severityFilter);
      if (typeFilter) params.set('type', typeFilter);
      const res = await fetch(`/api/prop-sharing/fraud?${params}`);
      const json = await res.json();
      if (json.success) {
        setAlerts(json.data.alerts);
        setSummary(json.data.summary);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [statusFilter, severityFilter, typeFilter]);

  useEffect(() => { fetchAlerts(); }, [fetchAlerts]);

  const runScan = async () => {
    setScanning(true);
    try {
      const res = await fetch('/api/prop-sharing/fraud', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      const json = await res.json();
      if (json.success) {
        alert(`Scan complete: ${json.data.accounts_scanned} accounts scanned, ${json.data.alerts_created} new alerts`);
        fetchAlerts();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setScanning(false);
    }
  };

  const reviewAlert = async (alertId: string, newStatus: string) => {
    try {
      const res = await fetch('/api/prop-sharing/fraud', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          alert_id: alertId,
          status: newStatus,
          reviewed_by: 'admin',
          resolution_notes: reviewNotes,
          action_taken: reviewAction || undefined,
        }),
      });
      const json = await res.json();
      if (json.success) {
        setSelectedAlert(null);
        setReviewNotes('');
        setReviewAction('');
        fetchAlerts();
      }
    } catch (err) {
      console.error(err);
    }
  };

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

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Shield className="w-7 h-7 text-red-600" />
            Fraud &amp; Gaming Detection
          </h1>
          <p className="text-gray-500 mt-1">Monitor trader behavior anomalies and gaming patterns</p>
        </div>
        <button
          onClick={runScan}
          disabled={scanning}
          className="flex items-center gap-2 bg-red-600 text-white px-5 py-2.5 rounded-lg hover:bg-red-700 disabled:opacity-50 transition"
        >
          <Search className={`w-4 h-4 ${scanning ? 'animate-spin' : ''}`} />
          {scanning ? 'Scanning...' : 'Run Fraud Scan'}
        </button>
      </div>

      {/* Critical Alert Banner */}
      {(Number(summary.critical_active) > 0 || Number(summary.high_active) > 0) && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
          <AlertOctagon className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold text-red-800">Active Alerts Require Attention</h3>
            <p className="text-red-700 text-sm">
              {Number(summary.critical_active) > 0 && <span className="font-bold">{summary.critical_active} critical</span>}
              {Number(summary.critical_active) > 0 && Number(summary.high_active) > 0 && ' and '}
              {Number(summary.high_active) > 0 && <span className="font-bold">{summary.high_active} high severity</span>}
              {' '}alert{(Number(summary.critical_active) + Number(summary.high_active)) !== 1 ? 's' : ''} pending review.
            </p>
          </div>
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border p-4">
          <div className="flex items-center gap-2 text-gray-500 text-sm mb-1">
            <AlertTriangle className="w-4 h-4" /> Total Alerts
          </div>
          <p className="text-2xl font-bold text-gray-900">{summary.total}</p>
        </div>
        <div className="bg-white rounded-xl border p-4 border-red-200">
          <div className="flex items-center gap-2 text-red-600 text-sm mb-1">
            <AlertOctagon className="w-4 h-4" /> Open
          </div>
          <p className="text-2xl font-bold text-red-700">{summary.open}</p>
        </div>
        <div className="bg-white rounded-xl border p-4 border-yellow-200">
          <div className="flex items-center gap-2 text-yellow-600 text-sm mb-1">
            <Eye className="w-4 h-4" /> Investigating
          </div>
          <p className="text-2xl font-bold text-yellow-700">{summary.investigating}</p>
        </div>
        <div className="bg-white rounded-xl border p-4 border-green-200">
          <div className="flex items-center gap-2 text-green-600 text-sm mb-1">
            <CheckCircle className="w-4 h-4" /> Resolved
          </div>
          <p className="text-2xl font-bold text-green-700">{summary.resolved}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border p-4 flex flex-wrap items-center gap-4">
        <Filter className="w-4 h-4 text-gray-400" />
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="border rounded-lg px-3 py-1.5 text-sm">
          <option value="">All Statuses</option>
          <option value="open">Open</option>
          <option value="investigating">Investigating</option>
          <option value="confirmed">Confirmed</option>
          <option value="dismissed">Dismissed</option>
          <option value="resolved">Resolved</option>
        </select>
        <select value={severityFilter} onChange={(e) => setSeverityFilter(e.target.value)} className="border rounded-lg px-3 py-1.5 text-sm">
          <option value="">All Severities</option>
          <option value="critical">Critical</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>
        <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className="border rounded-lg px-3 py-1.5 text-sm">
          <option value="">All Types</option>
          <option value="latency_arbitrage">Latency Arbitrage</option>
          <option value="overfit_scalping">Overfit Scalping</option>
          <option value="copy_trading">Copy Trading</option>
          <option value="news_straddling">News Straddling</option>
          <option value="statistical_anomaly">Statistical Anomaly</option>
          <option value="account_cycling">Account Cycling</option>
          <option value="identity_fraud">Identity Fraud</option>
          <option value="collusion">Collusion</option>
        </select>
        {(statusFilter || severityFilter || typeFilter) && (
          <button onClick={() => { setStatusFilter(''); setSeverityFilter(''); setTypeFilter(''); }} className="text-sm text-blue-600 hover:underline">
            Clear Filters
          </button>
        )}
      </div>

      {/* Alert List */}
      <div className="space-y-3">
        {alerts.length === 0 ? (
          <div className="bg-white rounded-xl border p-12 text-center">
            <Shield className="w-12 h-12 text-green-400 mx-auto mb-3" />
            <h3 className="font-semibold text-gray-700">No Alerts Found</h3>
            <p className="text-gray-500 text-sm mt-1">
              {statusFilter || severityFilter || typeFilter
                ? 'No alerts match your current filters.'
                : 'Run a fraud scan to analyze trader behavior patterns.'}
            </p>
          </div>
        ) : (
          alerts.map((alert) => {
            const TypeIcon = ALERT_TYPE_ICONS[alert.alert_type] || AlertTriangle;
            return (
              <div
                key={alert.alert_id}
                className={`bg-white rounded-xl border p-5 hover:shadow-md transition cursor-pointer ${
                  alert.severity === 'critical' ? 'border-l-4 border-l-red-500' :
                  alert.severity === 'high' ? 'border-l-4 border-l-orange-500' :
                  'border-l-4 border-l-yellow-400'
                }`}
                onClick={() => setSelectedAlert(alert)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3 flex-1">
                    <div className={`p-2 rounded-lg ${SEVERITY_COLORS[alert.severity] || 'bg-gray-100'}`}>
                      <TypeIcon className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900 text-sm">{alert.title}</h3>
                      <p className="text-gray-500 text-xs mt-0.5">{alert.description}</p>
                      <div className="flex items-center gap-3 mt-2 flex-wrap">
                        <span className="text-xs text-gray-600">
                          <strong>{alert.trader_name}</strong> &middot; {alert.account_number} &middot; {alert.program_name}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2 ml-4">
                    <div className="flex items-center gap-2">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${SEVERITY_COLORS[alert.severity]}`}>
                        {alert.severity}
                      </span>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[alert.status]}`}>
                        {alert.status}
                      </span>
                    </div>
                    <span className="text-xs text-gray-400 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {new Date(alert.created_at).toLocaleDateString()}
                    </span>
                    {alert.detection_score > 0 && (
                      <div className="text-xs text-gray-500">
                        Score: <span className={`font-bold ${alert.detection_score > 0.7 ? 'text-red-600' : alert.detection_score > 0.4 ? 'text-orange-600' : 'text-yellow-600'}`}>
                          {(alert.detection_score * 100).toFixed(0)}%
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Review Modal */}
      {selectedAlert && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setSelectedAlert(null)}>
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-900">Review Alert</h2>
              <button onClick={() => setSelectedAlert(null)} className="text-gray-400 hover:text-gray-600">
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Alert Detail */}
              <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                <div className="flex items-center gap-2">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${SEVERITY_COLORS[selectedAlert.severity]}`}>
                    {selectedAlert.severity}
                  </span>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[selectedAlert.status]}`}>
                    {selectedAlert.status}
                  </span>
                  <span className="text-xs text-gray-500 ml-auto">
                    {ALERT_TYPE_LABELS[selectedAlert.alert_type] || selectedAlert.alert_type}
                  </span>
                </div>
                <h3 className="font-semibold text-gray-900">{selectedAlert.title}</h3>
                <p className="text-gray-600 text-sm">{selectedAlert.description}</p>

                <div className="grid grid-cols-2 gap-2 text-sm mt-3">
                  <div><span className="text-gray-500">Trader:</span> <strong>{selectedAlert.trader_name}</strong></div>
                  <div><span className="text-gray-500">Account:</span> <strong>{selectedAlert.account_number}</strong></div>
                  <div><span className="text-gray-500">Program:</span> <strong>{selectedAlert.program_name}</strong></div>
                  <div><span className="text-gray-500">Detection Score:</span> <strong>{(selectedAlert.detection_score * 100).toFixed(0)}%</strong></div>
                  <div><span className="text-gray-500">Detected:</span> <strong>{new Date(selectedAlert.created_at).toLocaleString()}</strong></div>
                  {selectedAlert.reviewed_at && (
                    <div><span className="text-gray-500">Reviewed:</span> <strong>{new Date(selectedAlert.reviewed_at).toLocaleString()}</strong></div>
                  )}
                </div>
              </div>

              {/* Evidence */}
              {selectedAlert.evidence && Object.keys(selectedAlert.evidence).length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold text-gray-700 mb-2">Evidence</h4>
                  <div className="bg-gray-900 text-green-400 rounded-lg p-3 text-xs font-mono overflow-x-auto">
                    <pre>{JSON.stringify(selectedAlert.evidence, null, 2)}</pre>
                  </div>
                </div>
              )}

              {/* Flagged Trades */}
              {selectedAlert.flagged_trades && selectedAlert.flagged_trades.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold text-gray-700 mb-2">Flagged Trades ({selectedAlert.flagged_trades.length})</h4>
                  <div className="flex flex-wrap gap-1">
                    {selectedAlert.flagged_trades.map((tid: string, i: number) => (
                      <span key={i} className="bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded font-mono">{tid.slice(0, 8)}...</span>
                    ))}
                  </div>
                </div>
              )}

              {/* Previous Resolution */}
              {selectedAlert.resolution_notes && (
                <div className="bg-blue-50 rounded-lg p-3">
                  <h4 className="text-sm font-semibold text-blue-800 mb-1">Previous Notes</h4>
                  <p className="text-blue-700 text-sm">{selectedAlert.resolution_notes}</p>
                  {selectedAlert.action_taken && (
                    <p className="text-blue-600 text-xs mt-1">Action: {selectedAlert.action_taken}</p>
                  )}
                </div>
              )}

              {/* Review Actions */}
              {selectedAlert.status !== 'resolved' && selectedAlert.status !== 'dismissed' && (
                <div className="border-t pt-4">
                  <h4 className="text-sm font-semibold text-gray-700 mb-2">Take Action</h4>

                  <textarea
                    value={reviewNotes}
                    onChange={(e) => setReviewNotes(e.target.value)}
                    placeholder="Resolution notes..."
                    className="w-full border rounded-lg p-3 text-sm h-20 resize-none mb-3"
                  />

                  <select
                    value={reviewAction}
                    onChange={(e) => setReviewAction(e.target.value)}
                    className="w-full border rounded-lg px-3 py-2 text-sm mb-4"
                  >
                    <option value="">Select action (optional)</option>
                    <option value="warning_issued">Issue Warning</option>
                    <option value="account_suspended">Suspend Account</option>
                    <option value="payout_held">Hold Payout</option>
                    <option value="monitoring_increased">Increase Monitoring</option>
                    <option value="no_action">No Action Required</option>
                  </select>

                  <div className="flex gap-2">
                    {selectedAlert.status === 'open' && (
                      <button
                        onClick={() => reviewAlert(selectedAlert.alert_id, 'investigating')}
                        className="flex-1 bg-yellow-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-yellow-600 transition"
                      >
                        <Eye className="w-4 h-4 inline mr-1" /> Investigate
                      </button>
                    )}
                    <button
                      onClick={() => reviewAlert(selectedAlert.alert_id, 'confirmed')}
                      className="flex-1 bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-red-700 transition"
                    >
                      <AlertTriangle className="w-4 h-4 inline mr-1" /> Confirm Fraud
                    </button>
                    <button
                      onClick={() => reviewAlert(selectedAlert.alert_id, 'dismissed')}
                      className="flex-1 bg-gray-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-600 transition"
                    >
                      <XCircle className="w-4 h-4 inline mr-1" /> Dismiss
                    </button>
                    <button
                      onClick={() => reviewAlert(selectedAlert.alert_id, 'resolved')}
                      className="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-700 transition"
                    >
                      <CheckCircle className="w-4 h-4 inline mr-1" /> Resolve
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
