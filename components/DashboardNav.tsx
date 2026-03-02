'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { UserButton } from '@clerk/nextjs'
import {
  LayoutDashboard,
  Users,
  ShoppingCart,
  FileText,
  Shield,
  Mail,
  DollarSign,
  Anchor,
  Settings,
  Globe,
  ChevronRight,
  Menu,
  X,
  Star,
  BarChart2,
  TrendingUp,
  Briefcase,
  AlertTriangle,
  Wallet,
  BookOpen,
  UserCheck,
  BarChart3,
  ClipboardList,
  ShieldAlert,
  Scaling,
  Zap,
  Brain,
  Landmark,
  Target,
  Power,
  Activity,
  Coins,
} from 'lucide-react'
import { useState } from 'react'

const navSections = [
  {
    label: 'Main',
    items: [
      { href: '/dashboard', label: 'Overview', icon: LayoutDashboard, description: 'Summary & metrics' },
      { href: '/dashboard/my-hub', label: 'My Hub', icon: Star, description: 'Personal command centre' },
    ]
  },
  {
    label: 'Team & Finance',
    items: [
      { href: '/dashboard/commissions', label: 'Commissions', icon: DollarSign, description: 'Earnings & payments' },
      { href: '/dashboard/team', label: 'Team', icon: Users, description: 'Members & performance' },
    ]
  },
  {
    label: 'Contacts & Sales',
    items: [
      { href: '/dashboard/contacts', label: 'Contacts', icon: Users, description: 'Manage contacts' },
      { href: '/dashboard/outreach', label: 'Outreach', icon: Mail, description: 'Email campaigns' },
      { href: '/dashboard/deals', label: 'Deals', icon: ShoppingCart, description: 'Track deals' },
    ]
  },
  {
    label: 'Documents',
    items: [
      { href: '/dashboard/contracts', label: 'Contracts', icon: FileText, description: 'eSign contracts' },
      { href: '/dashboard/rules', label: 'Compliance Rules', icon: Shield, description: 'Jurisdiction rules' },
    ]
  },
  {
    label: 'Compliance',
    items: [
      { href: '/dashboard/compliance', label: 'Compliance Flags', icon: Shield, description: 'Review flags' },
    ]
  },
  {
    label: 'Funding & Settlement',
    items: [
      { href: '/dashboard/funding', label: 'Funding Overview', icon: DollarSign, description: 'Readiness score' },
      { href: '/dashboard/funding/instruments', label: 'Banking Instruments', icon: FileText, description: 'SBLC, LC, BG' },
      { href: '/dashboard/funding/settlement', label: 'Settlement', icon: Globe, description: 'FIAT / XRPL / Stellar' },
      { href: '/dashboard/funding/anchors', label: 'Proof Anchors', icon: Anchor, description: 'Blockchain audit trail' },
    ]
  },
  {
    label: 'Prop Sharing',
    items: [
      { href: '/dashboard/prop-sharing', label: 'Prop Overview', icon: TrendingUp, description: 'Program dashboard' },
      { href: '/dashboard/prop-sharing/programs', label: 'Programs', icon: Briefcase, description: 'Funding tiers & rules' },
      { href: '/dashboard/prop-sharing/accounts', label: 'Trader Accounts', icon: Users, description: 'Manage traders' },
      { href: '/dashboard/prop-sharing/applications', label: 'Applications', icon: ClipboardList, description: 'Challenge applicants' },
      { href: '/dashboard/prop-sharing/kyc', label: 'KYC / Compliance', icon: UserCheck, description: 'Identity verification' },
      { href: '/dashboard/prop-sharing/treasury', label: 'Treasury', icon: BookOpen, description: 'Capital accounting' },
      { href: '/dashboard/prop-sharing/performance', label: 'Performance', icon: BarChart3, description: 'Trader analytics' },
      { href: '/dashboard/prop-sharing/payouts', label: 'Payouts', icon: Wallet, description: 'Profit-share payments' },
      { href: '/dashboard/prop-sharing/risk', label: 'Risk Monitor', icon: AlertTriangle, description: 'Risk events & alerts' },
      { href: '/dashboard/prop-sharing/firm-risk', label: 'Firm Risk', icon: Shield, description: 'Firm-wide exposure' },
      { href: '/dashboard/prop-sharing/fraud', label: 'Fraud Detection', icon: ShieldAlert, description: 'Gaming & anomalies' },
      { href: '/dashboard/prop-sharing/scaling', label: 'Scaling Engine', icon: Scaling, description: 'Dynamic account scaling' },
      { href: '/dashboard/prop-sharing/execution', label: 'Execution', icon: Zap, description: 'Spread, slippage & latency' },
      { href: '/dashboard/prop-sharing/behavior', label: 'Behavior', icon: Brain, description: 'Stability scoring' },
      { href: '/dashboard/prop-sharing/treasury-guard', label: 'Treasury Guard', icon: Landmark, description: 'Reserve & throttle' },
      { href: '/dashboard/prop-sharing/funnel', label: 'Funnel', icon: Target, description: 'Channel quality & cohorts' },
      { href: '/dashboard/prop-sharing/simulations', label: 'Simulations', icon: Activity, description: 'Stress tests & readiness' },
      { href: '/dashboard/prop-sharing/compounding', label: 'Compounding', icon: Coins, description: 'Capital reinvestment' },
      { href: '/prop-sharing/docs', label: 'Docs & PDFs', icon: FileText, description: 'Institutional documents' },
    ]
  },
]

export function DashboardNav() {
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)

  const isActive = (href: string) => {
    if (href === '/dashboard') return pathname === '/dashboard'
    return pathname.startsWith(href)
  }

  const NavContent = () => (
    <nav className="flex flex-col h-full bg-white border-r border-gray-100">
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 py-5 border-b border-gray-100">
        <div className="w-8 h-8 bg-amber-800 rounded-lg flex items-center justify-center shrink-0">
          <Globe size={16} className="text-white" />
        </div>
        <div className="min-w-0">
          <p className="font-bold text-gray-900 text-sm leading-tight">FTH Trading</p>
          <p className="text-gray-400 text-xs leading-tight truncate">Operations Platform</p>
        </div>
      </div>

      {/* Nav Links */}
      <div className="flex-1 overflow-y-auto py-3 px-3">
        {navSections.map((section) => (
          <div key={section.label} className="mb-4">
            <p className="text-gray-400 text-[10px] font-semibold uppercase tracking-wider px-2 mb-1">
              {section.label}
            </p>
            {section.items.map((item) => {
              const active = isActive(item.href)
              const Icon = item.icon
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg mb-0.5 group transition-all ${
                    active
                      ? 'bg-amber-50 text-amber-800'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  <Icon size={16} className={active ? 'text-amber-700' : 'text-gray-400 group-hover:text-gray-600'} />
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium leading-tight ${active ? 'text-amber-800' : ''}`}>
                      {item.label}
                    </p>
                    <p className="text-gray-400 text-[10px] leading-tight truncate">{item.description}</p>
                  </div>
                  {active && <ChevronRight size={12} className="text-amber-600 shrink-0" />}
                </Link>
              )
            })}
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="border-t border-gray-100 p-4">
        <div className="flex items-center gap-3">
          {process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY && <UserButton afterSignOutUrl="/" />}
          <div className="min-w-0">
            <p className="text-xs text-gray-500 truncate">Team Member</p>
            <Link href="/" className="text-[10px] text-gray-400 hover:text-amber-700 flex items-center gap-1">
              <Globe size={10} /> View public site
            </Link>
          </div>
        </div>
      </div>
    </nav>
  )

  return (
    <>
      {/* Desktop sidebar */}
      <div className="hidden md:flex md:w-56 md:shrink-0 md:flex-col md:fixed md:inset-y-0">
        <NavContent />
      </div>

      {/* Mobile hamburger */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-30 bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-amber-800 rounded flex items-center justify-center">
            <Globe size={12} className="text-white" />
          </div>
          <span className="font-bold text-sm text-gray-900">FTH Trading</span>
        </div>
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="p-1 text-gray-600 hover:text-gray-900"
        >
          {mobileOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Mobile slide-out */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-20 flex">
          <div className="w-64 h-full">
            <NavContent />
          </div>
          <div
            className="flex-1 bg-black/50"
            onClick={() => setMobileOpen(false)}
          />
        </div>
      )}
    </>
  )
}
