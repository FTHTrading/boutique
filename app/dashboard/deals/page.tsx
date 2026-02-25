'use client'

import { useState } from 'react'
import Link from 'next/link'
import { 
  Plus, 
  Search, 
  Filter, 
  CheckCircle, 
  AlertTriangle, 
  XCircle,
  DollarSign,
  MapPin,
  Package,
  ShieldAlert
} from 'lucide-react'

// Mock data - In production, fetch from API
const mockDeals = [
  {
    id: '1',
    deal_number: 'DEAL-2026-001',
    client_name: 'Acme Coffee Corp',
    commodity_name: 'Coffee',
    origin_country: 'Brazil',
    destination_country: 'United States',
    incoterm: 'FOB',
    quantity: 100,
    quantity_unit: 'MT',
    deal_value_usd: 320000,
    status: 'pending_compliance',
    compliance_cleared: false,
    critical_flags_count: 0,
    high_flags_count: 1,
    created_at: '2026-02-24',
  },
  {
    id: '2',
    deal_number: 'DEAL-2026-002',
    client_name: 'Global Metals Ltd',
    commodity_name: 'Gold',
    origin_country: 'Switzerland',
    destination_country: 'United States',
    incoterm: 'DDP',
    quantity: 400,
    quantity_unit: 'oz',
    deal_value_usd: 950000,
    status: 'blocked',
    compliance_cleared: false,
    critical_flags_count: 2,
    high_flags_count: 3,
    created_at: '2026-02-23',
  },
  {
    id: '3',
    deal_number: 'DEAL-2026-003',
    client_name: 'Industrial Supply Co',
    commodity_name: 'Copper',
    origin_country: 'Chile',
    destination_country: 'Germany',
    incoterm: 'CIF',
    quantity: 50,
    quantity_unit: 'MT',
    deal_value_usd: 450000,
    status: 'cleared',
    compliance_cleared: true,
    critical_flags_count: 0,
    high_flags_count: 0,
    created_at: '2026-02-22',
  },
]

export default function DealsPage() {
  const [deals] = useState(mockDeals)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')

  const filteredDeals = deals.filter(deal => {
    const matchesSearch = deal.client_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         deal.deal_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         deal.commodity_name.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesFilter = filterStatus === 'all' || deal.status === filterStatus
    return matchesSearch && matchesFilter
  })

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-coffee-dark text-cream py-8">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between">
            <div>
              <Link href="/dashboard" className="text-sm hover:underline mb-2 inline-block">
                ← Back to Dashboard
              </Link>
              <h1 className="text-4xl font-bold mb-2">Deals Management</h1>
              <p className="text-cream/80">View and manage all commodity deals with compliance status</p>
            </div>
            <Link
              href="/request-terms"
              className="bg-cream text-coffee-dark px-6 py-3 rounded-lg font-semibold hover:bg-cream/90 transition-colors flex items-center gap-2"
            >
              <Plus className="w-5 h-5" />
              New Deal
            </Link>
          </div>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="container mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <div className="flex gap-4 flex-wrap">
            {/* Search */}
            <div className="flex-1 min-w-[300px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search by client, deal number, commodity..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-coffee-medium focus:border-transparent"
                />
              </div>
            </div>

            {/* Status Filter */}
            <div className="flex items-center gap-2">
              <Filter className="w-5 h-5 text-gray-600" />
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-coffee-medium focus:border-transparent"
              >
                <option value="all">All Status</option>
                <option value="cleared">Cleared</option>
                <option value="pending_compliance">Pending Compliance</option>
                <option value="blocked">Blocked</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
              </select>
            </div>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-600 text-sm">Total Deals</span>
              <Package className="w-5 h-5 text-gray-400" />
            </div>
            <div className="text-3xl font-bold text-coffee-dark">{deals.length}</div>
          </div>
          
          <div className="bg-green-50 rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-green-800 text-sm">Cleared</span>
              <CheckCircle className="w-5 h-5 text-green-600" />
            </div>
            <div className="text-3xl font-bold text-green-800">
              {deals.filter(d => d.compliance_cleared).length}
            </div>
          </div>
          
          <div className="bg-amber-50 rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-amber-800 text-sm">Pending Review</span>
              <AlertTriangle className="w-5 h-5 text-amber-600" />
            </div>
            <div className="text-3xl font-bold text-amber-800">
              {deals.filter(d => d.status === 'pending_compliance').length}
            </div>
          </div>
          
          <div className="bg-red-50 rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-red-800 text-sm">Blocked</span>
              <XCircle className="w-5 h-5 text-red-600" />
            </div>
            <div className="text-3xl font-bold text-red-800">
              {deals.filter(d => d.critical_flags_count > 0).length}
            </div>
          </div>
        </div>

        {/* Deals Table */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Deal</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Client</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Commodity</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Route</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Value</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Compliance</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredDeals.map((deal) => (
                <tr key={deal.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <Link 
                      href={`/dashboard/deals/${deal.id}`}
                      className="font-semibold text-coffee-dark hover:text-coffee-medium"
                    >
                      {deal.deal_number}
                    </Link>
                    <div className="text-xs text-gray-500">{deal.created_at}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="font-medium text-gray-900">{deal.client_name}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="font-medium text-gray-900">{deal.commodity_name}</div>
                    <div className="text-xs text-gray-500">
                      {deal.quantity} {deal.quantity_unit} • {deal.incoterm}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1 text-sm">
                      <MapPin className="w-3 h-3 text-gray-400" />
                      <span className="text-gray-700">{deal.origin_country}</span>
                      <span className="text-gray-400">→</span>
                      <span className="text-gray-700">{deal.destination_country}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1 font-semibold text-gray-900">
                      <DollarSign className="w-4 h-4 text-gray-400" />
                      {deal.deal_value_usd.toLocaleString()}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {deal.critical_flags_count > 0 ? (
                      <div className="flex items-center gap-2">
                        <span className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-xs font-semibold flex items-center gap-1">
                          <ShieldAlert className="w-3 h-3" />
                          {deal.critical_flags_count} CRITICAL
                        </span>
                      </div>
                    ) : deal.high_flags_count > 0 ? (
                      <span className="px-3 py-1 bg-amber-100 text-amber-800 rounded-full text-xs font-semibold">
                        {deal.high_flags_count} HIGH
                      </span>
                    ) : deal.compliance_cleared ? (
                      <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-semibold flex items-center gap-1">
                        <CheckCircle className="w-3 h-3" />
                        CLEARED
                      </span>
                    ) : (
                      <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-xs font-semibold">
                        PENDING
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <StatusBadge status={deal.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filteredDeals.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              No deals found matching your criteria
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  const statusConfig: Record<string, { label: string; className: string }> = {
    cleared: { label: 'Cleared', className: 'bg-green-100 text-green-800' },
    pending_compliance: { label: 'Pending Review', className: 'bg-blue-100 text-blue-800' },
    blocked: { label: 'Blocked', className: 'bg-red-100 text-red-800' },
    in_progress: { label: 'In Progress', className: 'bg-purple-100 text-purple-800' },
    completed: { label: 'Completed', className: 'bg-gray-100 text-gray-800' },
  }

  const config = statusConfig[status] || { label: status, className: 'bg-gray-100 text-gray-600' }

  return (
    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${config.className}`}>
      {config.label}
    </span>
  )
}
