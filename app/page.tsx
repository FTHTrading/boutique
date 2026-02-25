import Link from 'next/link'
import { TrendingUp, Shield, Globe } from 'lucide-react'

export default function Home() {
  return (
    <main className="min-h-screen">
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-16">
        <div className="text-center max-w-4xl mx-auto">
          <div className="flex items-center justify-center mb-6">
            <Globe size={64} className="text-coffee-dark" />
          </div>
          
          <h1 className="text-6xl font-bold text-coffee-dark mb-6">
            FTH Trading
          </h1>
          
          <p className="text-2xl text-coffee-medium mb-4">
            Global Commodity Sourcing & Structuring
          </p>
          
          <p className="text-xl text-coffee-light mb-8">
            We source and structure supply for select commodities globally. All transactions subject to applicable laws; deals may require compliance review prior to execution.
          </p>
          
          <p className="text-sm text-gray-600 mb-12 italic">
            Serving institutional buyers since 1976 • Coffee • Cocoa • Metals • Energy
          </p>
          
          <div className="flex flex-wrap gap-4 justify-center">
            <Link
              href="/commodities"
              className="bg-coffee-dark text-cream px-8 py-4 rounded-lg text-lg font-semibold hover:bg-coffee-medium transition-colors"
            >
              View Commodities
            </Link>
            
            <Link
              href="/request-terms"
              className="border-2 border-coffee-dark text-coffee-dark px-8 py-4 rounded-lg text-lg font-semibold hover:bg-coffee-dark hover:text-cream transition-colors"
            >
              Request Terms
            </Link>

            <Link
              href="/sign-in"
              className="bg-amber-600 text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-amber-700 transition-colors"
            >
              Team Login →
            </Link>
          </div>
        </div>
      </div>
      
      {/* Commodities Grid */}
      <div className="container mx-auto px-4 py-16">
        <h2 className="text-3xl font-bold text-center text-coffee-dark mb-12">
          Commodity Categories
        </h2>
        
        <div className="grid md:grid-cols-4 gap-8 max-w-6xl mx-auto">
          {commodities.map((commodity) => (
            <Link
              href={`/commodities/${commodity.slug}`}
              key={commodity.title}
              className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow group"
            >
              <div className="text-3xl mb-4">{commodity.icon}</div>
              <h3 className="text-xl font-semibold text-coffee-dark mb-2 group-hover:text-coffee-medium transition-colors">
                {commodity.title}
              </h3>
              <p className="text-coffee-light text-sm">
                {commodity.description}
              </p>
            </Link>
          ))}
        </div>
      </div>
      
      {/* Features Grid */}
      <div className="bg-gray-50 py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center text-coffee-dark mb-12">
            Compliance-First Structuring
          </h2>
          
          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="bg-white p-6 rounded-lg shadow-md"
              >
                <div className="text-3xl mb-4">{feature.icon}</div>
                <h3 className="text-xl font-semibold text-coffee-dark mb-2">
                  {feature.title}
                </h3>
                <p className="text-coffee-light">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
      
      {/* Stats Section */}
      <div className="bg-coffee-dark text-cream py-16">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8 text-center max-w-4xl mx-auto">
            {stats.map((stat) => (
              <div key={stat.label}>
                <div className="text-4xl font-bold mb-2">{stat.value}</div>
                <div className="text-coffee-light">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
      
      {/* CTA */}
      <div className="container mx-auto px-4 py-16 text-center">
        <h2 className="text-3xl font-bold text-coffee-dark mb-4">
          Global Sourcing, Institutional Standards
        </h2>
        <p className="text-xl text-coffee-medium mb-4">
          50 years of relationship capital. AI-powered compliance intelligence.
        </p>
        <p className="text-sm text-gray-600 mb-8 max-w-2xl mx-auto">
          <strong>Disclaimer:</strong> This platform flags potential compliance issues for human review. It does not constitute legal advice, regulatory certification, or a guarantee of compliance. All determinations subject to review by qualified professionals.
        </p>
        <Link
          href="/request-terms"
          className="bg-coffee-dark text-cream px-8 py-4 rounded-lg text-lg font-semibold hover:bg-coffee-medium transition-colors inline-block"
        >
          Request Terms
        </Link>
      </div>
    </main>
  )
}

const commodities = [
  {
    slug: 'coffee',
    icon: '☕',
    title: 'Coffee',
    description: 'Arabica & Robusta. Brazil, Colombia origins. Regenerative certified.',
  },
  {
    slug: 'cocoa',
    icon: '🍫',
    title: 'Cocoa',
    description: 'West African origins. Fair trade certified. Sustainable sourcing.',
  },
  {
    slug: 'precious-metals',
    icon: '🥇',
    title: 'Precious Metals',
    description: 'Gold, Silver, Platinum. LBMA custody. Chain-of-custody verification.',
  },
  {
    slug: 'base-metals',
    icon: '⚙️',
    title: 'Base Metals',
    description: 'Copper, Aluminum, Nickel. Industrial grade. Global warehousing.',
  },
]

const features = [
  {
    icon: <Shield className="w-12 h-12 text-coffee-medium" />,
    title: 'Compliance Intelligence',
    description: 'Risk-based sanctions screening, export controls, and AML flagging. Human-reviewed gates before execution.',
  },
  {
    icon: <TrendingUp className="w-12 h-12 text-coffee-medium" />,
    title: 'Credit Structuring',
    description: '110-point credit scoring with payment term recommendations. Bankability analysis and counterparty verification.',
  },
  {
    icon: <Globe className="w-12 h-12 text-coffee-medium" />,
    title: 'Jurisdiction Intelligence',
    description: 'Country-specific sanctions risk, licensing requirements, and documentation frameworks. Source-tracked metadata.',
  },
]

const stats = [
  { value: '50+', label: 'Years Trading' },
  { value: '4', label: 'Commodity Categories' },
  { value: '24/7', label: 'Compliance Screening' },
  { value: 'ISO', label: 'Standards' },
]
