'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  TrendingUp, Users, DollarSign, FileText, AlertTriangle,
  CheckCircle, Clock, ArrowRight, Briefcase, ShieldAlert,
  Plus, Mail, Globe, Star, Activity, ChevronRight
} from 'lucide-react'

interface HubData {
  member: { full_name: string; role: string; title: string; email: string } | null
  deals: { active_count: number; won_count: number; lost_count: number; pipeline_value: number; won_value: number }
  contacts: { total: number }
  commissions: { total_earned: number; pending: number; this_month: number; ytd: number }
  recentDeals: Array<{ deal_id: string; deal_number: string; client_name: string; commodity: string; deal_value_usd: number; status: string; compliance_status: string; created_at: string }>
  recentCommissions: Array<{ commission_id: string; deal_number: string; client_name: string; commission_usd: number; rate_pct: number; status: string; period_month: string }>
  pendingContracts: Array<{ contract_id: string; contract_number: string; contract_type: string; party_b_name: string; status: string; created_at: string }>
  flags: { urgent: number; total_unresolved: number }
}

const DEAL_STATUS_COLOR: Record<string, string> = {
  inquiry: 'bg-gray-100 text-gray-600',
  qualified: 'bg-blue-100 text-blue-700',
  proposal_sent: 'bg-amber-100 text-amber-700',
  negotiating: 'bg-purple-100 text-purple-700',
  compliance_review: 'bg-orange-100 text-orange-700',
  closed_won: 'bg-green-100 text-green-700',
  closed_lost: 'bg-red-100 text-red-600',
  on_hold: 'bg-gray-100 text-gray-500',
}

const COMMISSION_STATUS_COLOR: Record<string, string> = {
  pending: 'bg-amber-100 text-amber-700',
  approved: 'bg-blue-100 text-blue-700',
  paid: 'bg-green-100 text-green-700',
  disputed: 'bg-red-100 text-red-600',
  cancelled: 'bg-gray-100 text-gray-500',
}

function fmt(n: number) {
  if (!n) return '$0'
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`
  return `$${n.toFixed(0)}`
}

function StatCard({
  label, value, sub, icon: Icon, color, href,
}: {
  label: string; value: string; sub?: string; icon: React.ElementType; color: string; href?: string
}) {
  const content = (
    <div className={`bg-white rounded-2xl border border-gray-100 shadow-sm p-5 hover:shadow-md transition-shadow ${href ? 'cursor-pointer' : ''}`}>
      <div className="flex items-start justify-between mb-3">
        <div className={`w-10 h-10 ${color} rounded-xl flex items-center justify-center`}>
          <Icon size={18} className="text-white" />
        </div>
        {href && <ChevronRight size={14} className="text-gray-300 mt-1" />}
      </div>
      <p className="text-2xl font-bold text-gray-900 mb-0.5">{value}</p>
      <p className="text-sm text-gray-500">{label}</p>
      {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
    </div>
  )
  return href ? <Link href={href}>{content}</Link> : content
}

const QUICK_ACTIONS = [
  { label: 'New Deal', icon: Briefcase, href: '/dashboard/deals', color: 'bg-blue-600' },
  { label: 'Add Contact', icon: Users, href: '/dashboard/contacts', color: 'bg-green-600' },
  { label: 'Draft Email', icon: Mail, href: '/dashboard/outreach', color: 'bg-purple-600' },
  { label: 'New Contract', icon: FileText, href: '/dashboard/contracts', color: 'bg-amber-600' },
  { label: 'Compliance', icon: ShieldAlert, href: '/dashboard/compliance', color: 'bg-red-600' },
  { label: 'Funding', icon: DollarSign, href: '/dashboard/funding', color: 'bg-teal-600' },
]

export default function MyHubPage() {
  const [data, setData] = useState<HubData | null>(null)
  const [loading, setLoading] = useState(true)
  const [userName, setUserName] = useState<string | null>(null)
  const [userEmail, setUserEmail] = useState<string | null>(null)

  useEffect(() => {
    // Try to get user identity from Clerk (client-side)
    async function init() {
      let email = ''
      let name = ''

      // Try Clerk
      try {
        const { useUser } = await import('@clerk/nextjs')
        // We can't call hooks outside components, so we'll use the window Clerk instance
        const clerk = (window as any).Clerk
        if (clerk?.user) {
          email = clerk.user.primaryEmailAddress?.emailAddress || ''
          name = `${clerk.user.firstName || ''} ${clerk.user.lastName || ''}`.trim() || email
        }
      } catch { /* Clerk not available */ }

      setUserName(name || 'Team Member')
      setUserEmail(email)

      const params = new URLSearchParams()
      if (email) params.set('email', email)

      try {
        const res = await fetch(`/api/my/stats?${params}`)
        const json = await res.json()
        setData(json)
        if (json.member?.full_name) setUserName(json.member.full_name)
      } catch { /* offline or no DB */ }
      finally { setLoading(false) }
    }
    init()
  }, [])

  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'
  const today = new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header banner */}
      <div className="bg-gradient-to-r from-amber-800 via-amber-700 to-amber-600 text-white">
        <div className="max-w-6xl mx-auto px-6 py-8">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-amber-200 text-sm mb-1">{today}</p>
              <h1 className="text-2xl md:text-3xl font-bold mb-1">
                {greeting}{userName ? `, ${userName.split(' ')[0]}` : ''}
              </h1>
              <p className="text-amber-200 text-sm">
                {loading ? 'Loading your dashboard…' : 'Here\'s your FTH Trading command centre'}
              </p>
            </div>
            <div className="hidden md:flex flex-col items-end gap-1.5">
              <Link
                href="/dashboard/commissions"
                className="flex items-center gap-2 bg-white/20 hover:bg-white/30 backdrop-blur text-white rounded-xl px-4 py-2 text-sm font-medium transition-colors"
              >
                <Star size={14} /> My Commissions
              </Link>
              <Link
                href="/dashboard/team"
                className="flex items-center gap-2 bg-white/10 hover:bg-white/20 backdrop-blur text-white rounded-xl px-4 py-2 text-sm font-medium transition-colors"
              >
                <Globe size={14} /> Team Overview
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 md:px-6 py-8 space-y-8">

        {/* STAT CARDS */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard
            label="Active Deals"
            value={loading ? '—' : String(data?.deals?.active_count ?? 0)}
            sub={`${data?.deals?.won_count ?? 0} won total`}
            icon={Briefcase}
            color="bg-blue-600"
            href="/dashboard/deals"
          />
          <StatCard
            label="Pipeline Value"
            value={loading ? '—' : fmt(parseFloat(data?.deals?.pipeline_value as any ?? '0'))}
            sub={`${fmt(parseFloat(data?.deals?.won_value as any ?? '0'))} closed won`}
            icon={TrendingUp}
            color="bg-green-600"
            href="/dashboard/deals"
          />
          <StatCard
            label="Commission (Month)"
            value={loading ? '—' : fmt(parseFloat(data?.commissions?.this_month as any ?? '0'))}
            sub={`YTD: ${fmt(parseFloat(data?.commissions?.ytd as any ?? '0'))}`}
            icon={DollarSign}
            color="bg-amber-600"
            href="/dashboard/commissions"
          />
          <StatCard
            label="Total Contacts"
            value={loading ? '—' : String(data?.contacts?.total ?? 0)}
            sub="in your CRM"
            icon={Users}
            color="bg-purple-600"
            href="/dashboard/contacts"
          />
        </div>

        {/* QUICK ACTIONS */}
        <div>
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Quick Actions</h2>
          <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
            {QUICK_ACTIONS.map(({ label, icon: Icon, href, color }) => (
              <Link
                key={label}
                href={href}
                className="flex flex-col items-center gap-2.5 bg-white rounded-2xl border border-gray-100 shadow-sm px-3 py-4 hover:shadow-md hover:border-gray-200 transition-all"
              >
                <div className={`w-10 h-10 ${color} rounded-xl flex items-center justify-center`}>
                  <Icon size={16} className="text-white" />
                </div>
                <span className="text-xs font-medium text-gray-700 text-center leading-tight">{label}</span>
              </Link>
            ))}
          </div>
        </div>

        {/* MIDDLE ROW */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

          {/* MY PIPELINE */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <div className="flex items-center gap-2.5">
                <Briefcase size={16} className="text-blue-600" />
                <h3 className="font-semibold text-gray-900 text-sm">My Pipeline</h3>
              </div>
              <Link href="/dashboard/deals" className="text-xs text-amber-700 hover:underline font-medium flex items-center gap-1">
                View all <ArrowRight size={11} />
              </Link>
            </div>

            {loading ? (
              <div className="p-5 space-y-3">
                {[1,2,3].map(i => <div key={i} className="h-12 bg-gray-100 rounded-lg animate-pulse" />)}
              </div>
            ) : !data?.recentDeals?.length ? (
              <div className="px-5 py-10 text-center">
                <Briefcase size={28} className="text-gray-200 mx-auto mb-2" />
                <p className="text-sm text-gray-400">No deals yet</p>
                <Link href="/dashboard/deals" className="mt-3 inline-flex items-center gap-1.5 text-xs text-amber-700 font-medium hover:underline">
                  <Plus size={11} /> Create your first deal
                </Link>
              </div>
            ) : (
              <div className="divide-y divide-gray-50">
                {data.recentDeals.map((d) => (
                  <div key={d.deal_id} className="flex items-center gap-3 px-5 py-3 hover:bg-gray-50 transition-colors">
                    <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center shrink-0">
                      <Briefcase size={13} className="text-blue-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{d.client_name || d.deal_number}</p>
                      <p className="text-xs text-gray-400 truncate">{d.commodity} {d.deal_value_usd ? `· ${fmt(parseFloat(d.deal_value_usd as any))}` : ''}</p>
                    </div>
                    <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full capitalize whitespace-nowrap ${DEAL_STATUS_COLOR[d.status] || 'bg-gray-100 text-gray-600'}`}>
                      {d.status.replace(/_/g, ' ')}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* MY COMMISSIONS */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <div className="flex items-center gap-2.5">
                <DollarSign size={16} className="text-amber-600" />
                <h3 className="font-semibold text-gray-900 text-sm">My Commissions</h3>
              </div>
              <Link href="/dashboard/commissions" className="text-xs text-amber-700 hover:underline font-medium flex items-center gap-1">
                Full view <ArrowRight size={11} />
              </Link>
            </div>

            {/* Summary row */}
            {!loading && data?.commissions && (
              <div className="grid grid-cols-2 gap-px bg-gray-100 border-b border-gray-100">
                {[
                  { label: 'Total Earned', value: fmt(parseFloat(data.commissions.total_earned as any)), color: 'text-green-700' },
                  { label: 'Pending', value: fmt(parseFloat(data.commissions.pending as any)), color: 'text-amber-700' },
                ].map(({ label, value, color }) => (
                  <div key={label} className="bg-white px-4 py-3 text-center">
                    <p className={`font-bold text-base ${color}`}>{value}</p>
                    <p className="text-[10px] text-gray-400 uppercase tracking-wide">{label}</p>
                  </div>
                ))}
              </div>
            )}

            {loading ? (
              <div className="p-5 space-y-3">
                {[1,2,3].map(i => <div key={i} className="h-12 bg-gray-100 rounded-lg animate-pulse" />)}
              </div>
            ) : !data?.recentCommissions?.length ? (
              <div className="px-5 py-10 text-center">
                <DollarSign size={28} className="text-gray-200 mx-auto mb-2" />
                <p className="text-sm text-gray-400">No commissions recorded yet</p>
                <p className="text-xs text-gray-400 mt-1">They appear here when deals are closed</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-50">
                {data.recentCommissions.map((c) => (
                  <div key={c.commission_id} className="flex items-center gap-3 px-5 py-3 hover:bg-gray-50">
                    <div className="w-8 h-8 bg-amber-50 rounded-lg flex items-center justify-center shrink-0">
                      <Star size={13} className="text-amber-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{c.client_name || c.deal_number || 'Commission'}</p>
                      <p className="text-xs text-gray-400">{c.period_month} {c.rate_pct ? `· ${c.rate_pct}% rate` : ''}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-bold text-gray-900">{fmt(parseFloat(c.commission_usd as any))}</p>
                      <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${COMMISSION_STATUS_COLOR[c.status] || 'bg-gray-100 text-gray-600'}`}>
                        {c.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* BOTTOM ROW */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

          {/* DOCS AWAITING ACTION */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <div className="flex items-center gap-2.5">
                <FileText size={16} className="text-purple-600" />
                <h3 className="font-semibold text-gray-900 text-sm">Docs Pending</h3>
              </div>
              <Link href="/dashboard/contracts" className="text-xs text-amber-700 hover:underline font-medium flex items-center gap-1">
                All docs <ArrowRight size={11} />
              </Link>
            </div>
            {loading ? (
              <div className="p-4 space-y-2">
                {[1,2].map(i => <div key={i} className="h-10 bg-gray-100 rounded animate-pulse" />)}
              </div>
            ) : !data?.pendingContracts?.length ? (
              <div className="px-5 py-8 text-center">
                <CheckCircle size={24} className="text-green-400 mx-auto mb-2" />
                <p className="text-sm text-gray-400">All clear</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-50">
                {data.pendingContracts.slice(0,4).map((c) => (
                  <div key={c.contract_id} className="flex items-center gap-3 px-4 py-2.5">
                    <Clock size={14} className="text-orange-400 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-gray-800 truncate">{c.party_b_name || c.contract_number}</p>
                      <p className="text-[10px] text-gray-400">{c.contract_type} · {c.status.replace(/_/g, ' ')}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* COMPLIANCE ALERTS */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <div className="flex items-center gap-2.5">
                <ShieldAlert size={16} className="text-red-500" />
                <h3 className="font-semibold text-gray-900 text-sm">Compliance</h3>
              </div>
              <Link href="/dashboard/compliance" className="text-xs text-amber-700 hover:underline font-medium flex items-center gap-1">
                Review <ArrowRight size={11} />
              </Link>
            </div>
            <div className="p-5 space-y-3">
              {[
                {
                  label: 'Urgent flags',
                  value: loading ? '—' : String(data?.flags?.urgent ?? 0),
                  color: parseFloat(data?.flags?.urgent as any ?? '0') > 0 ? 'text-red-600' : 'text-green-600',
                  bg: parseFloat(data?.flags?.urgent as any ?? '0') > 0 ? 'bg-red-50' : 'bg-green-50',
                  icon: AlertTriangle,
                },
                {
                  label: 'Unresolved total',
                  value: loading ? '—' : String(data?.flags?.total_unresolved ?? 0),
                  color: 'text-orange-600',
                  bg: 'bg-orange-50',
                  icon: Clock,
                },
              ].map(({ label, value, color, bg, icon: Icon }) => (
                <div key={label} className={`flex items-center justify-between ${bg} rounded-xl px-4 py-3`}>
                  <div className="flex items-center gap-2">
                    <Icon size={14} className={color} />
                    <span className="text-xs text-gray-600">{label}</span>
                  </div>
                  <span className={`font-bold text-sm ${color}`}>{value}</span>
                </div>
              ))}
              <Link
                href="/dashboard/compliance"
                className="flex items-center justify-center gap-1.5 w-full mt-1 text-xs text-amber-700 font-medium hover:underline"
              >
                Review all flags <ArrowRight size={11} />
              </Link>
            </div>
          </div>

          {/* ACTIVITY / LINKS */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="flex items-center gap-2.5 px-5 py-4 border-b border-gray-100">
              <Activity size={16} className="text-gray-500" />
              <h3 className="font-semibold text-gray-900 text-sm">Your Sections</h3>
            </div>
            <div className="p-3 space-y-1">
              {[
                { label: 'Deals & Pipeline', href: '/dashboard/deals', icon: Briefcase },
                { label: 'Contacts & CRM', href: '/dashboard/contacts', icon: Users },
                { label: 'Outreach Emails', href: '/dashboard/outreach', icon: Mail },
                { label: 'Contracts & eSign', href: '/dashboard/contracts', icon: FileText },
                { label: 'My Commissions', href: '/dashboard/commissions', icon: DollarSign },
                { label: 'Compliance Flags', href: '/dashboard/compliance', icon: ShieldAlert },
                { label: 'Funding Overview', href: '/dashboard/funding', icon: TrendingUp },
                { label: 'Team Overview', href: '/dashboard/team', icon: Globe },
              ].map(({ label, href, icon: Icon }) => (
                <Link
                  key={href}
                  href={href}
                  className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-amber-50 hover:text-amber-800 text-gray-600 transition-colors group"
                >
                  <Icon size={14} className="shrink-0 group-hover:text-amber-700" />
                  <span className="text-xs font-medium">{label}</span>
                  <ChevronRight size={11} className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
