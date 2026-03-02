'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  Shield, AlertTriangle, AlertOctagon, Info, CheckCircle,
  RefreshCw, Filter, Clock,
} from 'lucide-react'

interface RiskEvent {
  event_id: string
  account_id: string
  event_type: string
  severity: string
  description: string
  metric_value?: number
  threshold_value?: number
  resolved: boolean
  resolved_at?: string
  resolved_by?: string
  resolution_notes?: string
  action_taken?: string
  trader_name?: string
  account_number?: string
  created_at: string
}

export default function RiskMonitorPage() {
  const [events, setEvents] = useState<RiskEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [filterSeverity, setFilterSeverity] = useState('all')
  const [filterResolved, setFilterResolved] = useState('unresolved')
  const [resolvingId, setResolvingId] = useState<string | null>(null)
  const [resolveNotes, setResolveNotes] = useState('')
  const [resolveAction, setResolveAction] = useState('')

  const fetchEvents = useCallback(async () => {
    setLoading(true)
    const p = new URLSearchParams()
    if (filterSeverity !== 'all') p.set('severity', filterSeverity)
    if (filterResolved !== 'all') p.set('resolved', filterResolved === 'resolved' ? 'true' : 'false')
    try {
      const res = await fetch(`/api/prop-sharing/risk-events?${p}`)
      const data = await res.json()
      setEvents(data.events || [])
    } catch { /* ignore */ }
    finally { setLoading(false) }
  }, [filterSeverity, filterResolved])

  useEffect(() => { fetchEvents() }, [fetchEvents])

  const severityIcon = (severity: string) => {
    switch (severity) {
      case 'critical': return <AlertOctagon size={16} className="text-red-500" />
      case 'warning': return <AlertTriangle size={16} className="text-amber-500" />
      default: return <Info size={16} className="text-blue-500" />
    }
  }

  const severityBadge = (severity: string) => {
    const styles: Record<string, string> = {
      critical: 'bg-red-100 text-red-700',
      warning: 'bg-amber-100 text-amber-700',
      info: 'bg-blue-100 text-blue-700',
    }
    return <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${styles[severity] || 'bg-gray-100 text-gray-500'}`}>{severity.toUpperCase()}</span>
  }

  async function handleResolve(eventId: string) {
    try {
      await fetch('/api/prop-sharing/risk-events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event_id: eventId,
          resolved_by: 'admin',
          resolution_notes: resolveNotes,
          action_taken: resolveAction || 'acknowledged',
        }),
      })
      setResolvingId(null)
      setResolveNotes('')
      setResolveAction('')
      fetchEvents()
    } catch { /* ignore */ }
  }

  const counts = events.reduce((acc, e) => {
    acc[e.severity] = (acc[e.severity] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Risk Monitor</h1>
          <p className="text-sm text-gray-500 mt-1">Real-time risk events from prop trading accounts.</p>
        </div>
        <button onClick={fetchEvents} className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100">
          <RefreshCw size={16} />
        </button>
      </div>

      {/* Severity Summary */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-red-50 rounded-xl border border-red-100 p-4 flex items-center gap-3">
          <AlertOctagon size={28} className="text-red-500" />
          <div>
            <p className="text-xs text-red-500 font-medium">Critical</p>
            <p className="text-2xl font-bold text-red-700">{counts.critical || 0}</p>
          </div>
        </div>
        <div className="bg-amber-50 rounded-xl border border-amber-100 p-4 flex items-center gap-3">
          <AlertTriangle size={28} className="text-amber-500" />
          <div>
            <p className="text-xs text-amber-500 font-medium">Warnings</p>
            <p className="text-2xl font-bold text-amber-700">{counts.warning || 0}</p>
          </div>
        </div>
        <div className="bg-blue-50 rounded-xl border border-blue-100 p-4 flex items-center gap-3">
          <Info size={28} className="text-blue-500" />
          <div>
            <p className="text-xs text-blue-500 font-medium">Info</p>
            <p className="text-2xl font-bold text-blue-700">{counts.info || 0}</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3">
        <Filter size={14} className="text-gray-400" />
        <select value={filterSeverity} onChange={e => setFilterSeverity(e.target.value)}
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-600">
          <option value="all">All Severities</option>
          <option value="critical">Critical</option>
          <option value="warning">Warning</option>
          <option value="info">Info</option>
        </select>
        <select value={filterResolved} onChange={e => setFilterResolved(e.target.value)}
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-600">
          <option value="unresolved">Unresolved</option>
          <option value="resolved">Resolved</option>
          <option value="all">All</option>
        </select>
      </div>

      {/* Events List */}
      {loading ? (
        <div className="text-center py-12"><p className="text-sm text-gray-400">Loading risk events...</p></div>
      ) : events.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-gray-100">
          <Shield size={40} className="mx-auto text-green-200 mb-4" />
          <p className="text-gray-500 mb-2">No risk events</p>
          <p className="text-xs text-gray-400">All prop accounts are operating within limits.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {events.map((event) => (
            <div key={event.event_id} className={`bg-white rounded-xl border p-4 ${event.resolved ? 'border-gray-100 opacity-60' : event.severity === 'critical' ? 'border-red-200' : event.severity === 'warning' ? 'border-amber-200' : 'border-blue-200'}`}>
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  {severityIcon(event.severity)}
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      {severityBadge(event.severity)}
                      <span className="text-xs font-mono text-gray-400">{event.event_type}</span>
                    </div>
                    <p className="text-sm text-gray-800 font-medium">{event.description}</p>
                    <div className="flex items-center gap-4 mt-2 text-xs text-gray-400">
                      <span>{event.trader_name || 'Unknown Trader'}</span>
                      <span>{event.account_number || '-'}</span>
                      {event.metric_value != null && (
                        <span>Value: {event.metric_value.toFixed(2)} / Limit: {event.threshold_value?.toFixed(2)}</span>
                      )}
                      <span className="flex items-center gap-1"><Clock size={10} />{new Date(event.created_at).toLocaleString()}</span>
                    </div>

                    {event.resolved && (
                      <div className="mt-2 p-2 bg-green-50 rounded text-xs text-green-700">
                        <span className="font-medium">Resolved</span>: {event.resolution_notes || 'No details'}
                        {event.action_taken && <span className="ml-2 text-green-500">({event.action_taken})</span>}
                      </div>
                    )}
                  </div>
                </div>

                {!event.resolved && (
                  <button onClick={() => setResolvingId(resolvingId === event.event_id ? null : event.event_id)}
                    className="text-xs px-3 py-1 bg-green-50 text-green-700 rounded-lg hover:bg-green-100">
                    Resolve
                  </button>
                )}
              </div>

              {resolvingId === event.event_id && (
                <div className="mt-3 pt-3 border-t border-gray-100 space-y-2">
                  <select value={resolveAction} onChange={e => setResolveAction(e.target.value)}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm">
                    <option value="">Select action...</option>
                    <option value="acknowledged">Acknowledged</option>
                    <option value="warning_issued">Warning Issued</option>
                    <option value="account_suspended">Account Suspended</option>
                    <option value="account_terminated">Account Terminated</option>
                    <option value="false_alarm">False Alarm</option>
                  </select>
                  <textarea value={resolveNotes} onChange={e => setResolveNotes(e.target.value)}
                    rows={2} placeholder="Resolution notes..."
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" />
                  <div className="flex gap-2">
                    <button onClick={() => handleResolve(event.event_id)}
                      className="px-4 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700">
                      <CheckCircle size={14} className="inline mr-1" /> Confirm Resolve
                    </button>
                    <button onClick={() => { setResolvingId(null); setResolveNotes(''); setResolveAction('') }}
                      className="px-4 py-2 border border-gray-200 text-sm rounded-lg hover:bg-gray-50">
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
