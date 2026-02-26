'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  Users, DollarSign, TrendingUp, Briefcase, Plus, Shield,
  RefreshCw, Mail, Check, BarChart2, Star, UserCheck
} from 'lucide-react'

interface TeamMember {
  member_id: string
  clerk_user_id: string | null
  full_name: string
  email: string
  role: string
  title: string | null
  default_commission_pct: number | null
  active: boolean
  joined_at: string
  active_deals: number
  won_deals: number
  pipeline_value: number | null
  commission_earned: number | null
  commission_pending: number | null
  commission_this_month: number | null
}

const ROLE_CONFIG: Record<string, { color: string; label: string }> = {
  admin: { color: 'bg-purple-100 text-purple-700', label: 'Admin' },
  sales: { color: 'bg-amber-100 text-amber-700', label: 'Sales' },
  trader: { color: 'bg-blue-100 text-blue-700', label: 'Trader' },
  compliance: { color: 'bg-red-100 text-red-700', label: 'Compliance' },
  operations: { color: 'bg-green-100 text-green-700', label: 'Operations' },
  viewer: { color: 'bg-gray-100 text-gray-600', label: 'Viewer' },
}

function fmt(n: number | string | null | undefined) {
  const v = parseFloat(n as any ?? '0')
  if (!v) return '$0'
  if (v >= 1_000_000) return `$${(v / 1_000_000).toFixed(2)}M`
  if (v >= 1_000) return `$${(v / 1_000).toFixed(1)}K`
  return `$${v.toFixed(0)}`
}

function StatChip({ label, value, icon: Icon, color }: { label: string; value: string | number; icon: React.ElementType; color: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <Icon size={12} className={color} />
      <span className="text-xs text-gray-500">{label}:</span>
      <span className="text-xs font-semibold text-gray-800">{value}</span>
    </div>
  )
}

function MemberCard({ m }: { m: TeamMember }) {
  const role = ROLE_CONFIG[m.role] || ROLE_CONFIG.viewer
  const initials = m.full_name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()

  return (
    <div className={`bg-white rounded-2xl border shadow-sm p-5 relative ${m.active ? 'border-gray-100' : 'border-gray-100 opacity-60'}`}>
      {!m.active && (
        <span className="absolute top-3 right-3 text-xs bg-gray-100 text-gray-400 px-2 py-0.5 rounded-full">Inactive</span>
      )}

      {/* Avatar + name */}
      <div className="flex items-start gap-3 mb-4">
        <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center text-white font-bold text-sm shrink-0">
          {initials}
        </div>
        <div className="min-w-0">
          <p className="font-semibold text-gray-900 leading-tight truncate">{m.full_name}</p>
          <p className="text-xs text-gray-500 truncate">{m.title || m.role}</p>
          <a href={`mailto:${m.email}`} className="text-xs text-amber-600 hover:underline flex items-center gap-1 mt-0.5 truncate">
            <Mail size={10} /> {m.email}
          </a>
        </div>
      </div>

      {/* Role badge */}
      <span className={`inline-block text-xs font-medium px-2.5 py-0.5 rounded-full mb-4 ${role.color}`}>
        {role.label}
      </span>

      {/* Stats */}
      <div className="space-y-2 border-t border-gray-50 pt-3">
        <div className="grid grid-cols-2 gap-2">
          <StatChip label="Active Deals" value={m.active_deals} icon={Briefcase} color="text-blue-500" />
          <StatChip label="Won" value={m.won_deals} icon={Check} color="text-green-500" />
        </div>
        <StatChip label="Pipeline" value={fmt(m.pipeline_value)} icon={TrendingUp} color="text-amber-500" />
        <div className="grid grid-cols-2 gap-2">
          <StatChip label="Earned" value={fmt(m.commission_earned)} icon={DollarSign} color="text-green-600" />
          <StatChip label="Pending" value={fmt(m.commission_pending)} icon={DollarSign} color="text-amber-500" />
        </div>
        <StatChip label="This Month" value={fmt(m.commission_this_month)} icon={BarChart2} color="text-purple-500" />
      </div>

      {m.default_commission_pct && (
        <p className="text-xs text-gray-400 mt-3 border-t border-gray-50 pt-2">
          Default rate: {m.default_commission_pct}%
        </p>
      )}
    </div>
  )
}

export default function TeamPage() {
  const [members, setMembers] = useState<TeamMember[]>([])
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [filterRole, setFilterRole] = useState('all')
  const [saving, setSaving] = useState(false)

  const [newMember, setNewMember] = useState({
    full_name: '', email: '', role: 'sales', title: '', default_commission_pct: ''
  })

  const fetch_ = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/team/members')
      const data = await res.json()
      setMembers(data.members || [])
    } catch { /* offline */ }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { fetch_() }, [fetch_])

  async function handleAdd() {
    if (!newMember.full_name || !newMember.email) return
    setSaving(true)
    try {
      await fetch('/api/team/members', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newMember,
          default_commission_pct: newMember.default_commission_pct
            ? parseFloat(newMember.default_commission_pct) : null,
        }),
      })
      setShowAdd(false)
      setNewMember({ full_name: '', email: '', role: 'sales', title: '', default_commission_pct: '' })
      fetch_()
    } catch { /* ignore */ }
    finally { setSaving(false) }
  }

  const filtered = filterRole === 'all' ? members : members.filter(m => m.role === filterRole)
  const active = members.filter(m => m.active)
  const totalPipeline = members.reduce((s, m) => s + (parseFloat(m.pipeline_value as any) || 0), 0)
  const totalEarned = members.reduce((s, m) => s + (parseFloat(m.commission_earned as any) || 0), 0)
  const totalPending = members.reduce((s, m) => s + (parseFloat(m.commission_pending as any) || 0), 0)

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-5">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Users size={18} className="text-amber-600" />
              <h1 className="text-lg font-bold text-gray-900">Team Overview</h1>
            </div>
            <p className="text-sm text-gray-500">Manage team members and view individual performance</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={fetch_}
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
            </button>
            <button
              onClick={() => setShowAdd(!showAdd)}
              className="flex items-center gap-2 bg-amber-600 text-white rounded-xl px-4 py-2 text-sm font-medium hover:bg-amber-700 transition-colors"
            >
              <Plus size={15} /> Add Member
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 md:px-6 py-6 space-y-6">

        {/* SUMMARY STRIP */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: 'Active Members', value: active.length, icon: UserCheck, color: 'bg-amber-600' },
            { label: 'Total Pipeline', value: fmt(totalPipeline), icon: TrendingUp, color: 'bg-blue-600' },
            { label: 'Commission Earned', value: fmt(totalEarned), icon: DollarSign, color: 'bg-green-600' },
            { label: 'Commission Pending', value: fmt(totalPending), icon: Star, color: 'bg-purple-600' },
          ].map(({ label, value, icon: Icon, color }) => (
            <div key={label} className="bg-white rounded-2xl border border-gray-100 shadow-sm px-5 py-4">
              <div className={`inline-flex items-center justify-center w-9 h-9 ${color} rounded-xl mb-3`}>
                <Icon size={16} className="text-white" />
              </div>
              <p className="text-xl font-bold text-gray-900">{value}</p>
              <p className="text-xs text-gray-500 mt-0.5">{label}</p>
            </div>
          ))}
        </div>

        {/* ADD FORM */}
        {showAdd && (
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Users size={15} className="text-amber-600" /> Add Team Member
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">Full Name *</label>
                <input
                  value={newMember.full_name}
                  onChange={e => setNewMember(p => ({ ...p, full_name: e.target.value }))}
                  placeholder="Jane Smith"
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">Email *</label>
                <input
                  type="email"
                  value={newMember.email}
                  onChange={e => setNewMember(p => ({ ...p, email: e.target.value }))}
                  placeholder="jane@unykorn.org"
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">Role</label>
                <select
                  value={newMember.role}
                  onChange={e => setNewMember(p => ({ ...p, role: e.target.value }))}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                >
                  {Object.entries(ROLE_CONFIG).map(([v, { label }]) => (
                    <option key={v} value={v}>{label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">Job Title</label>
                <input
                  value={newMember.title}
                  onChange={e => setNewMember(p => ({ ...p, title: e.target.value }))}
                  placeholder="Senior Trader"
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">Default Commission %</label>
                <input
                  type="number"
                  value={newMember.default_commission_pct}
                  onChange={e => setNewMember(p => ({ ...p, default_commission_pct: e.target.value }))}
                  placeholder="2.50"
                  step="0.25"
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>
            </div>
            <div className="flex gap-3 mt-4">
              <button
                onClick={handleAdd}
                disabled={!newMember.full_name || !newMember.email || saving}
                className="bg-amber-600 text-white rounded-xl px-5 py-2.5 text-sm font-medium hover:bg-amber-700 disabled:opacity-40 transition-colors"
              >
                {saving ? 'Adding…' : 'Add to Team'}
              </button>
              <button
                onClick={() => setShowAdd(false)}
                className="bg-gray-100 text-gray-600 rounded-xl px-5 py-2.5 text-sm font-medium hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* ROLE FILTER */}
        <div className="flex flex-wrap gap-2">
          {['all', ...Object.keys(ROLE_CONFIG)].map(r => (
            <button
              key={r}
              onClick={() => setFilterRole(r)}
              className={`text-xs px-3 py-1.5 rounded-full font-medium transition-colors capitalize ${
                filterRole === r
                  ? 'bg-amber-600 text-white'
                  : 'bg-white border border-gray-200 text-gray-600 hover:border-amber-300'
              }`}
            >
              {r === 'all' ? 'All Roles' : ROLE_CONFIG[r]?.label}
            </button>
          ))}
        </div>

        {/* MEMBER GRID */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1,2,3,4,5,6].map(i => (
              <div key={i} className="bg-white rounded-2xl border border-gray-100 p-5 h-56 animate-pulse" />
            ))}
          </div>
        ) : !filtered.length ? (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-16 text-center">
            <Users size={40} className="text-gray-200 mx-auto mb-3" />
            <p className="text-gray-400 font-medium">No team members found</p>
            <p className="text-sm text-gray-400 mt-1">
              {filterRole !== 'all' ? `No ${filterRole} members found` : 'Add team members to get started'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map(m => <MemberCard key={m.member_id} m={m} />)}
          </div>
        )}

        {/* ROLES GUIDE */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
            <Shield size={14} className="text-amber-600" /> Role Permissions
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {[
              { role: 'admin', perms: 'Full access — manage all members, approve commissions, configure system' },
              { role: 'sales', perms: 'Deals, contacts, outreach, own commissions, own contracts' },
              { role: 'trader', perms: 'Deals, commodities, funding, compliance, own commissions' },
              { role: 'compliance', perms: 'Full compliance access, contracts, rules — read-only on deals' },
              { role: 'operations', perms: 'Deals, contracts, outreach, funding, team overview' },
              { role: 'viewer', perms: 'Read-only access to dashboard overview and reports' },
            ].map(({ role, perms }) => (
              <div key={role} className="bg-gray-50 rounded-xl p-3">
                <span className={`inline-block text-xs font-semibold px-2 py-0.5 rounded-full mb-2 ${ROLE_CONFIG[role]?.color}`}>
                  {ROLE_CONFIG[role]?.label}
                </span>
                <p className="text-xs text-gray-500 leading-relaxed">{perms}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
