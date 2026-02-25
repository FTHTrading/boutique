import { sql } from '@vercel/postgres'
import { BarChart3, TrendingUp, Users, DollarSign, AlertCircle, Coffee } from 'lucide-react'

export default async function DashboardPage() {
  // Fetch real-time metrics
  const metrics = await getDashboardMetrics()
  
  return (
    <div className="min-h-screen bg-cream p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-coffee-dark mb-2">
            Distribution Intelligence Dashboard
          </h1>
          <p className="text-coffee-medium">
            Real-time visibility into your coffee distribution operation
          </p>
        </div>
        
        {/* Key Metrics Grid */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <MetricCard
            icon={<Users size={24} />}
            label="Active Clients"
            value={metrics.active_clients}
            change="+12%"
            positive
          />
          <MetricCard
            icon={<DollarSign size={24} />}
            label="Monthly Revenue"
            value={`$${metrics.monthly_revenue.toLocaleString()}`}
            change="+8%"
            positive
          />
          <MetricCard
            icon={<TrendingUp size={24} />}
            label="Conversion Rate"
            value={`${metrics.conversion_rate}%`}
            change="+5%"
            positive
          />
          <MetricCard
            icon={<AlertCircle size={24} />}
            label="Hot Leads"
            value={metrics.hot_leads}
            change="3 new"
            positive
          />
        </div>
        
        {/* Main Content Grid */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {/* Recent Proposals */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-coffee-dark mb-4 flex items-center gap-2">
              <BarChart3 size={20} />
              Recent Proposals
            </h2>
            <div className="space-y-3">
              {metrics.recent_proposals.map((proposal: any) => (
                <div
                  key={proposal.id}
                  className="border-l-4 border-coffee-medium pl-4 py-2"
                >
                  <div className="font-semibold text-coffee-dark">
                    {proposal.business_name}
                  </div>
                  <div className="text-sm text-coffee-light">
                    ${proposal.total_price.toLocaleString()} • {proposal.status}
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          {/* Credit Risk Distribution */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-coffee-dark mb-4">
              Credit Risk Distribution
            </h2>
            <div className="space-y-4">
              <RiskBar label="Low Risk (Net 30)" count={metrics.risk_distribution.low} color="bg-green-500" />
              <RiskBar label="Medium Risk (Net 15)" count={metrics.risk_distribution.medium} color="bg-yellow-500" />
              <RiskBar label="High Risk (Prepay)" count={metrics.risk_distribution.high} color="bg-red-500" />
            </div>
          </div>
        </div>
        
        {/* Follow-ups & Inventory */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Follow-ups Needed */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-coffee-dark mb-4">
              Follow-ups Needed
            </h2>
            <div className="space-y-2">
              {metrics.follow_ups.map((client: any) => (
                <div
                  key={client.id}
                  className="flex justify-between items-center p-3 hover:bg-cream rounded transition-colors"
                >
                  <div>
                    <div className="font-medium text-coffee-dark">
                      {client.business_name}
                    </div>
                    <div className="text-sm text-coffee-light">
                      Last contact: {client.days_ago} days ago
                    </div>
                  </div>
                  <button className="text-coffee-medium hover:text-coffee-dark font-semibold">
                    Follow Up
                  </button>
                </div>
              ))}
            </div>
          </div>
          
          {/* Inventory Alerts */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-coffee-dark mb-4 flex items-center gap-2">
              <Coffee size={20} />
              Inventory Alerts
            </h2>
            <div className="space-y-2">
              {metrics.low_stock.map((product: any) => (
                <div
                  key={product.id}
                  className="flex justify-between items-center p-3 bg-red-50 rounded"
                >
                  <div>
                    <div className="font-medium text-coffee-dark">
                      {product.name}
                    </div>
                    <div className="text-sm text-coffee-light">
                      {product.stock_lbs} lbs remaining
                    </div>
                  </div>
                  <span className="text-red-600 font-semibold">Low Stock</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function MetricCard({ icon, label, value, change, positive }: any) {
  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-2">
        <div className="text-coffee-medium">{icon}</div>
        <span className={`text-sm font-semibold ${positive ? 'text-green-600' : 'text-red-600'}`}>
          {change}
        </span>
      </div>
      <div className="text-3xl font-bold text-coffee-dark mb-1">{value}</div>
      <div className="text-sm text-coffee-light">{label}</div>
    </div>
  )
}

function RiskBar({ label, count, color }: any) {
  return (
    <div>
      <div className="flex justify-between text-sm mb-1">
        <span className="text-coffee-medium">{label}</span>
        <span className="font-semibold text-coffee-dark">{count}</span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div
          className={`${color} h-2 rounded-full`}
          style={{ width: `${(count / 30) * 100}%` }}
        />
      </div>
    </div>
  )
}

async function getDashboardMetrics() {
  // Fetch real metrics from database
  // Simplified for now - replace with actual queries
  
  return {
    active_clients: 24,
    monthly_revenue: 48500,
    conversion_rate: 68,
    hot_leads: 7,
    recent_proposals: [
      { id: 1, business_name: 'Espresso Haven', total_price: 2400, status: 'sent' },
      { id: 2, business_name: 'Bean & Brew Co', total_price: 3200, status: 'viewed' },
      { id: 3, business_name: 'Coastal Coffee', total_price: 1800, status: 'accepted' },
    ],
    risk_distribution: {
      low: 15,
      medium: 7,
      high: 2,
    },
    follow_ups: [
      { id: 1, business_name: 'Morning Brew Cafe', days_ago: 3 },
      { id: 2, business_name: 'Downtown Roasters', days_ago: 5 },
    ],
    low_stock: [
      { id: 1, name: 'Brazil Cerrado Medium Roast', stock_lbs: 45 },
      { id: 2, name: 'Colombia Huila Dark Roast', stock_lbs: 32 },
    ],
  }
}
