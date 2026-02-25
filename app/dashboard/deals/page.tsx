'use client'

import { useState, useEffect, useCallback } from 'react'
import { 
  Plus, 
  Search, 
  Filter, 
  CheckCircle, 
  AlertTriangle, 
  Clock,
  Briefcase,
  RefreshCw
} from 'lucide-react'

interface Deal {
  id: string
  deal_number: string
  title?: string
  commodity: string
  quantity?: number
  quantity_unit?: string
  deal_value?: number
  currency?: string
  buyer_country?: string
  seller_country?: string
  status: string
  compliance_status: string
  critical_flags: number
  total_flags: number
  unresolved_flags: number
  created_at: string
}


export default function DealsPage() {
  const [deals, setDeals] = useState<Deal[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [showNew, setShowNew] = useState(false)
  const [newDeal, setNewDeal] = useState({
    title: '', commodity: '', buyer_country: '', seller_country: '',
    quantity: '', quantity_unit: 'MT', deal_value: '', currency: 'USD', notes: '',
  })
  const [newDealLoading, setNewDealLoading] = useState(false)
  const [newDealError, setNewDealError] = useState('')

  const fetchDeals = useCallback(async () => {
    setLoading(true)
    const p = new URLSearchParams()
    if (searchTerm) p.set('search', searchTerm)
    if (filterStatus !== 'all') p.set('status', filterStatus)
    try {
      const res = await fetch(`/api/deals?${p}`)
      const data = await res.json()
      setDeals(data.deals || [])
    } catch { /* ignore */ }
    finally { setLoading(false) }
  }, [searchTerm, filterStatus])

  useEffect(() => { fetchDeals() }, [fetchDeals])

  const handleCreateDeal = async () => {
    if (!newDeal.commodity) { setNewDealError('Commodity is required'); return }
    setNewDealLoading(true); setNewDealError('')
    try {
      const res = await fetch('/api/deals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newDeal,
          quantity: newDeal.quantity ? parseFloat(newDeal.quantity) : undefined,
          deal_value: newDeal.deal_value ? parseFloat(newDeal.deal_value) : undefined,
        }),
      })
      const data = await res.json()
      if (data.deal) {
        setShowNew(false)
        setNewDeal({ title: '', commodity: '', buyer_country: '', seller_country: '', quantity: '', quantity_unit: 'MT', deal_value: '', currency: 'USD', notes: '' })
        fetchDeals()
      } else { setNewDealError(data.error || 'Failed to create deal') }
    } catch { setNewDealError('Network error') }
    finally { setNewDealLoading(false) }
  }

  const complianceBadge = (deal: Deal) => {
    if (deal.critical_flags > 0)
      return <span className="px-2 py-0.5 bg-red-100 text-red-700 rounded-full text-xs font-semibold">{deal.critical_flags} CRITICAL</span>
    if (deal.unresolved_flags > 0)
      return <span className="px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full text-xs font-semibold">{deal.unresolved_flags} FLAGS</span>
    if (deal.compliance_status === 'cleared')
      return <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-xs font-semibold flex items-center gap-1"><CheckCircle className="w-3 h-3" />CLEARED</span>
    return <span className="px-2 py-0.5 bg-gray-100 text-gray-500 rounded-full text-xs">PENDING</span>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Deals</h1>
          <p className="text-sm text-gray-500 mt-0.5">Live commodity trade deal pipeline</p>
        </div>
        <button onClick={() => setShowNew(true)}
          className="flex items-center gap-2 bg-gray-900 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-800">
          <Plus className="w-4 h-4" /> New Deal
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Total', value: deals.length, icon: Briefcase, color: 'text-gray-600' },
          { label: 'Active', value: deals.filter(d => ['qualified','in_negotiation','contracted'].includes(d.status)).length, icon: CheckCircle, color: 'text-blue-600' },
          { label: 'On Hold', value: deals.filter(d => d.status === 'on_hold').length, icon: Clock, color: 'text-red-500' },
          { label: 'Flagged', value: deals.filter(d => d.unresolved_flags > 0).length, icon: AlertTriangle, color: 'text-amber-500' },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="flex items-center gap-2 mb-1"><Icon className={`w-4 h-4 ${color}`} /><span className="text-xs text-gray-500">{label}</span></div>
            <p className="text-2xl font-bold text-gray-900">{value}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input type="text" placeholder="Search deals..." value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900" />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-gray-400" />
          <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900">
            <option value="all">All Status</option>
            {['prospect','qualified','in_negotiation','contracted','executed','on_hold','cancelled'].map(s => (
              <option key={s} value={s}>{s.replace(/_/g,' ')}</option>
            ))}
          </select>
        </div>
        <button onClick={fetchDeals} className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50">
          <RefreshCw className={`w-4 h-4 text-gray-500 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-gray-400">Loading deals...</div>
        ) : deals.length === 0 ? (
          <div className="p-12 text-center text-gray-400">
            <Briefcase className="w-8 h-8 mx-auto mb-2 text-gray-300" />
            <p>No deals found. Create your first deal — compliance screening runs automatically.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  {['Deal', 'Commodity', 'Route', 'Value', 'Status', 'Compliance', 'Date'].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {deals.map((deal) => (
                  <tr key={deal.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-900">{deal.deal_number}</div>
                      {deal.title && <div className="text-xs text-gray-400">{deal.title}</div>}
                    </td>
                    <td className="px-4 py-3 text-gray-700 capitalize">{deal.commodity}</td>
                    <td className="px-4 py-3 text-gray-500 text-xs">
                      {deal.seller_country && deal.buyer_country
                        ? `${deal.seller_country} → ${deal.buyer_country}`
                        : deal.buyer_country || deal.seller_country || '—'}
                    </td>
                    <td className="px-4 py-3 text-gray-700">
                      {deal.deal_value ? `${deal.currency || 'USD'} ${Number(deal.deal_value).toLocaleString()}` : '—'}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        { qualified:'bg-blue-100 text-blue-700', in_negotiation:'bg-amber-100 text-amber-700',
                          contracted:'bg-purple-100 text-purple-700', executed:'bg-green-100 text-green-700',
                          on_hold:'bg-red-100 text-red-600', prospect:'bg-gray-100 text-gray-600',
                          cancelled:'bg-gray-100 text-gray-400' }[deal.status] || 'bg-gray-100 text-gray-600'
                      }`}>
                        {deal.status.replace(/_/g,' ')}
                      </span>
                    </td>
                    <td className="px-4 py-3">{complianceBadge(deal)}</td>
                    <td className="px-4 py-3 text-gray-400 text-xs">{new Date(deal.created_at).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* New Deal Modal */}
      {showNew && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6 max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-semibold mb-4">New Deal</h2>
            <div className="space-y-3">
              {[
                { key: 'title', label: 'Deal Title (optional)' },
                { key: 'commodity', label: 'Commodity *' },
                { key: 'buyer_country', label: 'Buyer Country' },
                { key: 'seller_country', label: 'Seller Country' },
              ].map(({ key, label }) => (
                <div key={key}>
                  <label className="block text-xs text-gray-500 mb-1">{label}</label>
                  <input type="text" value={newDeal[key as keyof typeof newDeal] as string}
                    onChange={(e) => setNewDeal(n => ({ ...n, [key]: e.target.value }))}
                    className="w-full border border-gray-200 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900" />
                </div>
              ))}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Deal Value</label>
                  <input type="number" value={newDeal.deal_value}
                    onChange={(e) => setNewDeal(n => ({ ...n, deal_value: e.target.value }))}
                    className="w-full border border-gray-200 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900" />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Currency</label>
                  <select value={newDeal.currency} onChange={(e) => setNewDeal(n => ({ ...n, currency: e.target.value }))}
                    className="w-full border border-gray-200 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900">
                    {['USD','EUR','GBP','CHF','AED'].map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>
              </div>
              {newDealError && <p className="text-xs text-red-600">{newDealError}</p>}
              <p className="text-xs text-blue-600 bg-blue-50 rounded p-2">Compliance screening runs automatically on creation.</p>
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={() => setShowNew(false)} className="flex-1 border border-gray-200 rounded px-4 py-2 text-sm hover:bg-gray-50">Cancel</button>
              <button onClick={handleCreateDeal} disabled={newDealLoading} className="flex-1 bg-gray-900 text-white rounded px-4 py-2 text-sm hover:bg-gray-800 disabled:opacity-50">
                {newDealLoading ? 'Creating...' : 'Create Deal'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
