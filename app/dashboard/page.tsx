import type { ReactNode } from 'react'
import Link from 'next/link'
import { sql } from '@/lib/sql'
import {
  Users, ShoppingCart, FileText, Shield, Mail,
  DollarSign, Anchor, Globe, TrendingUp, AlertTriangle,
  CheckCircle, ArrowRight, Activity
} from 'lucide-react'

// Static export: DB queries fail gracefully at build time, show zeros until DB env is set
async function getStats() {
  try {
    const [deals, contacts, flags, companies] = await Promise.all([
      sql`SELECT COUNT(*) as total, COUNT(CASE WHEN status = 'active' THEN 1 END) as active FROM deals`,
      sql`SELECT COUNT(*) as total FROM contacts`,
      sql`SELECT COUNT(*) as total, COUNT(CASE WHEN resolved = false AND severity IN ('CRITICAL','HIGH') THEN 1 END) as urgent FROM compliance_flags`,
      sql`SELECT COUNT(*) as total FROM companies`,
    ])
    return {
      deals: parseInt((deals.rows[0] as any)?.total ?? 0),
      activeDeals: parseInt((deals.rows[0] as any)?.active ?? 0),
      contacts: parseInt((contacts.rows[0] as any)?.total ?? 0),
      urgentFlags: parseInt((flags.rows[0] as any)?.urgent ?? 0),
      companies: parseInt((companies.rows[0] as any)?.total ?? 0),
    }
  } catch {
    return { deals: 0, activeDeals: 0, contacts: 0, urgentFlags: 0, companies: 0 }
  }
}

const sections = [
  {
    group: 'People & Outreach',
    color: 'blue',
    items: [
      {
        href: '/dashboard/contacts',
        label: 'Contacts',
        description: 'View and manage all your business contacts. Add new ones, track verification status, and manage consent.',
        icon: Users,
        statKey: 'contacts',
        statLabel: 'contacts',
        cta: 'Open Contacts',
      },
      {
        href: '/dashboard/outreach',
        label: 'Outreach Emails',
        description: 'Draft AI-generated outreach emails for leads and clients. Schedule follow-ups automatically.',
        icon: Mail,
        cta: 'Draft Emails',
      },
    ],
  },
  {
    group: 'Deals & Documents',
    color: 'amber',
    items: [
      {
        href: '/dashboard/deals',
        label: 'Deals',
        description: 'Create and track commodity deals. Each deal is automatically screened for compliance before activation.',
        icon: ShoppingCart,
        statKey: 'deals',
        statLabel: 'total deals',
        cta: 'View Deals',
      },
      {
        href: '/dashboard/contracts',
        label: 'Contracts & eSign',
        description: 'Generate NCNDAs, supply agreements, and other contracts. Send for eSignature — no DocuSign required.',
        icon: FileText,
        cta: 'Manage Contracts',
      },
    ],
  },
  {
    group: 'Compliance',
    color: 'red',
    items: [
      {
        href: '/dashboard/compliance',
        label: 'Compliance Flags',
        description: 'Review automated compliance flags raised on deals. All CRITICAL flags must be cleared before deal execution.',
        icon: Shield,
        statKey: 'urgentFlags',
        statLabel: 'urgent flags',
        urgent: true,
        cta: 'Review Flags',
      },
      {
        href: '/dashboard/rules',
        label: 'Jurisdiction Rules',
        description: 'View country-by-country compliance rules, sanctions risk levels, and documentation requirements.',
        icon: Globe,
        cta: 'View Rules',
      },
    ],
  },
  {
    group: 'Funding & Settlement',
    color: 'green',
    items: [
      {
        href: '/dashboard/funding',
        label: 'Funding Overview',
        description: "Check your deal's funding readiness score (0–100). See what documents and instruments are still needed.",
        icon: DollarSign,
        cta: 'Check Readiness',
      },
      {
        href: '/dashboard/funding/instruments',
        label: 'Banking Instruments',
        description: 'Manage SBLC, LC, Bank Guarantees, and other instruments. All require human review before activation.',
        icon: FileText,
        cta: 'View Instruments',
      },
      {
        href: '/dashboard/funding/settlement',
        label: 'Settlement Instructions',
        description: 'Build FIAT, XRPL, or Stellar settlement instructions for a deal. Includes validation checklist.',
        icon: TrendingUp,
        cta: 'Build Instructions',
      },
      {
        href: '/dashboard/funding/anchors',
        label: 'Proof Anchors',
        description: 'Create tamper-proof blockchain audit records (SHA-256 hash anchored to XRPL or Stellar).',
        icon: Anchor,
        cta: 'Create Anchors',
      },
    ],
  },
]

const colorMap: Record<string, { bg: string; icon: string; badge: string; border: string }> = {
  blue:  { bg: 'bg-blue-50',   icon: 'text-blue-600',  badge: 'bg-blue-100 text-blue-700',  border: 'border-blue-100' },
  amber: { bg: 'bg-amber-50',  icon: 'text-amber-700', badge: 'bg-amber-100 text-amber-800', border: 'border-amber-100' },
  red:   { bg: 'bg-red-50',    icon: 'text-red-600',   badge: 'bg-red-100 text-red-700',     border: 'border-red-100' },
  green: { bg: 'bg-green-50',  icon: 'text-green-700', badge: 'bg-green-100 text-green-800', border: 'border-green-100' },
}

export default async function DashboardPage() {
  const stats = await getStats()

  return (
    <div className="min-h-screen bg-gray-50 p-6 md:p-8">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Welcome to FTH Trading</h1>
          <p className="text-gray-500 mt-1">Your operations platform — deals, compliance, contracts, and settlement in one place.</p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <StatCard label="Total Deals" value={stats.deals} icon={<ShoppingCart size={18} className="text-amber-600" />} />
          <StatCard label="Contacts" value={stats.contacts} icon={<Users size={18} className="text-blue-600" />} />
          <StatCard label="Companies" value={stats.companies} icon={<Globe size={18} className="text-purple-600" />} />
          <StatCard
            label="Urgent Flags"
            value={stats.urgentFlags}
            icon={<AlertTriangle size={18} className={stats.urgentFlags > 0 ? 'text-red-600' : 'text-green-600'} />}
            urgent={stats.urgentFlags > 0}
          />
        </div>

        {/* Section groups */}
        {sections.map((group) => {
          const colors = colorMap[group.color]
          return (
            <div key={group.group} className="mb-8">
              <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">{group.group}</h2>
              <div className="grid md:grid-cols-2 gap-4">
                {group.items.map((item) => {
                  const Icon = item.icon
                  const statValue = item.statKey ? (stats as any)[item.statKey] : null
                  const isUrgent = (item as any).urgent && statValue > 0
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`group block bg-white rounded-xl border ${colors.border} hover:shadow-md transition-all p-5`}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className={`p-2 rounded-lg ${colors.bg}`}>
                          <Icon size={20} className={colors.icon} />
                        </div>
                        {statValue !== null && (
                          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${isUrgent ? 'bg-red-100 text-red-700 animate-pulse' : colors.badge}`}>
                            {statValue} {item.statLabel}
                          </span>
                        )}
                      </div>
                      <h3 className="font-semibold text-gray-900 mb-1">{item.label}</h3>
                      <p className="text-sm text-gray-500 leading-relaxed mb-3">{item.description}</p>
                      <div className="flex items-center gap-1 text-sm font-medium text-gray-600 group-hover:text-gray-900">
                        {item.cta} <ArrowRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
                      </div>
                    </Link>
                  )
                })}
              </div>
            </div>
          )
        })}

        {/* Platform Notice */}
        <div className="mt-8 bg-amber-50 border border-amber-200 rounded-xl p-5">
          <div className="flex gap-3">
            <CheckCircle size={20} className="text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-amber-900 text-sm mb-1">FTH Trading is an Orchestrator, not a Bank</p>
              <p className="text-amber-800 text-sm leading-relaxed">
                This platform helps you organize, analyze, and track trade deals. It does not issue banking instruments, hold funds, or replace legal/compliance counsel. All compliance flags and instrument verifications require human review before deal execution.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function StatCard({ label, value, icon, urgent }: { label: string; value: number; icon: ReactNode; urgent?: boolean }) {
  return (
    <div className={`bg-white rounded-xl border p-4 ${urgent ? 'border-red-200' : 'border-gray-100'}`}>
      <div className="flex items-center justify-between mb-2">
        {icon}
        <Activity size={12} className="text-gray-300" />
      </div>
      <p className={`text-2xl font-bold ${urgent ? 'text-red-600' : 'text-gray-900'}`}>{value}</p>
      <p className="text-xs text-gray-400 mt-0.5">{label}</p>
    </div>
  )
}
