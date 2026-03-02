'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  TrendingUp, Users, DollarSign, AlertTriangle,
  ArrowRight, BarChart3, Shield, Activity,
  CheckCircle, Clock, XCircle, Briefcase,
} from 'lucide-react'

interface Metrics {
  total_programs: number
  active_programs: number
  total_funded_capital: number
  total_accounts: number
  accounts_by_phase: {
    evaluation: number
    verification: number
    funded: number
    suspended: number
    terminated: number
  }
  total_pnl: number
  total_payouts_distributed: number
  avg_win_rate: number
  pending_payouts: number
  total_paid: number
  active_risk_events: number
}

export default function PropSharingDashboard() {
  const [metrics, setMetrics] = useState<Metrics | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/prop-sharing/dashboard')
      .then(r => r.json())
      .then(d => setMetrics(d.metrics))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const m = metrics || {
    total_programs: 0, active_programs: 0, total_funded_capital: 0,
    total_accounts: 0,
    accounts_by_phase: { evaluation: 0, verification: 0, funded: 0, suspended: 0, terminated: 0 },
    total_pnl: 0, total_payouts_distributed: 0, avg_win_rate: 0,
    pending_payouts: 0, total_paid: 0, active_risk_events: 0,
  }

  const statCards = [
    { label: 'Active Programs', value: m.active_programs, icon: Briefcase, color: 'blue' },
    { label: 'Total Accounts', value: m.total_accounts, icon: Users, color: 'amber' },
    { label: 'Funded Capital', value: `$${(m.total_funded_capital / 1000).toFixed(0)}K`, icon: DollarSign, color: 'green' },
    { label: 'Total P&L', value: `$${m.total_pnl.toLocaleString()}`, icon: TrendingUp, color: m.total_pnl >= 0 ? 'green' : 'red' },
    { label: 'Avg Win Rate', value: `${m.avg_win_rate}%`, icon: BarChart3, color: 'purple' },
    { label: 'Risk Events', value: m.active_risk_events, icon: AlertTriangle, color: m.active_risk_events > 0 ? 'red' : 'green' },
  ]

  const phaseData = [
    { label: 'Evaluation', count: m.accounts_by_phase.evaluation, icon: Clock, color: 'bg-blue-100 text-blue-700' },
    { label: 'Verification', count: m.accounts_by_phase.verification, icon: Shield, color: 'bg-amber-100 text-amber-700' },
    { label: 'Funded', count: m.accounts_by_phase.funded, icon: CheckCircle, color: 'bg-green-100 text-green-700' },
    { label: 'Suspended', count: m.accounts_by_phase.suspended, icon: AlertTriangle, color: 'bg-red-100 text-red-700' },
    { label: 'Terminated', count: m.accounts_by_phase.terminated, icon: XCircle, color: 'bg-gray-100 text-gray-500' },
  ]

  const quickLinks = [
    { href: '/dashboard/prop-sharing/programs', label: 'Manage Programs', description: 'Create and configure funded trading programs', icon: Briefcase },
    { href: '/dashboard/prop-sharing/accounts', label: 'Trader Accounts', description: 'View evaluations, funded accounts, and performance', icon: Users },
    { href: '/dashboard/prop-sharing/payouts', label: 'Payouts', description: 'Profit-share payouts and payment status', icon: DollarSign },
    { href: '/dashboard/prop-sharing/risk', label: 'Risk Monitor', description: 'Drawdown breaches, rule violations, and alerts', icon: Shield },
  ]

  return (
    <div className="p-6 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Prop Sharing</h1>
        <p className="text-sm text-gray-500 mt-1">Proprietary trading programs with profit-sharing. Fund traders, manage risk, distribute payouts.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {statCards.map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="bg-white rounded-xl border border-gray-100 p-4">
            <div className="flex items-center justify-between mb-2">
              <Icon size={16} className={`text-${color}-600`} />
              {loading && <Activity size={12} className="text-gray-300 animate-pulse" />}
            </div>
            <p className="text-2xl font-bold text-gray-900">{loading ? '-' : value}</p>
            <p className="text-xs text-gray-500 mt-1">{label}</p>
          </div>
        ))}
      </div>

      {/* Account Phase Distribution */}
      <div className="bg-white rounded-xl border border-gray-100 p-6">
        <h2 className="text-sm font-semibold text-gray-900 mb-4">Account Pipeline</h2>
        <div className="flex flex-wrap gap-3">
          {phaseData.map(({ label, count, icon: Icon, color }) => (
            <div key={label} className={`flex items-center gap-2 px-4 py-2 rounded-lg ${color}`}>
              <Icon size={14} />
              <span className="text-sm font-medium">{label}</span>
              <span className="text-sm font-bold">{loading ? '-' : count}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Financial Summary + Quick Links */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Financial Summary */}
        <div className="bg-white rounded-xl border border-gray-100 p-6">
          <h2 className="text-sm font-semibold text-gray-900 mb-4">Financial Summary</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between py-2 border-b border-gray-50">
              <span className="text-sm text-gray-600">Total Payouts Distributed</span>
              <span className="text-sm font-semibold text-gray-900">${m.total_payouts_distributed.toLocaleString()}</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-gray-50">
              <span className="text-sm text-gray-600">Pending Payouts</span>
              <span className="text-sm font-semibold text-amber-600">{m.pending_payouts}</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-gray-50">
              <span className="text-sm text-gray-600">Total Paid Out</span>
              <span className="text-sm font-semibold text-green-700">${m.total_paid.toLocaleString()}</span>
            </div>
            <div className="flex items-center justify-between py-2">
              <span className="text-sm text-gray-600">Platform P&L</span>
              <span className={`text-sm font-semibold ${m.total_pnl >= 0 ? 'text-green-700' : 'text-red-600'}`}>
                ${m.total_pnl.toLocaleString()}
              </span>
            </div>
          </div>
        </div>

        {/* Quick Links */}
        <div className="space-y-3">
          {quickLinks.map(({ href, label, description, icon: Icon }) => (
            <Link key={href} href={href} className="block bg-white rounded-xl border border-gray-100 p-4 hover:border-amber-200 hover:shadow-sm transition-all group">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-amber-50 flex items-center justify-center shrink-0">
                  <Icon size={16} className="text-amber-700" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900 group-hover:text-amber-800 transition-colors">{label}</p>
                  <p className="text-xs text-gray-500 truncate">{description}</p>
                </div>
                <ArrowRight size={14} className="text-gray-300 group-hover:text-amber-600 transition-colors shrink-0" />
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* How It Works */}
      <div className="bg-gradient-to-br from-amber-50 to-white rounded-xl border border-amber-100 p-6">
        <h2 className="text-sm font-semibold text-gray-900 mb-4">How Prop Sharing Works</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { step: '1', title: 'Evaluate', body: 'Trader enters evaluation with simulated capital. Must hit profit target within rules.' },
            { step: '2', title: 'Verify', body: 'Passed evaluation? Under human review for KYC, consistency checks, and approval.' },
            { step: '3', title: 'Fund', body: 'Approved traders receive live funded account. Real capital, real markets, real P&L.' },
            { step: '4', title: 'Share', body: 'Profits split per program terms (typically 80/20). Payouts weekly, biweekly, or monthly.' },
          ].map(({ step, title, body }) => (
            <div key={step} className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-amber-700 text-white flex items-center justify-center text-sm font-bold shrink-0">{step}</div>
              <div>
                <p className="text-sm font-semibold text-gray-900">{title}</p>
                <p className="text-xs text-gray-500 leading-relaxed mt-1">{body}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
