import Link from 'next/link'
import { Coffee } from 'lucide-react'

export default function Home() {
  return (
    <main className="min-h-screen">
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-16">
        <div className="text-center max-w-4xl mx-auto">
          <div className="flex items-center justify-center mb-6">
            <Coffee size={64} className="text-coffee-dark" />
          </div>
          
          <h1 className="text-6xl font-bold text-coffee-dark mb-6">
            Coffee Advisory OS
          </h1>
          
          <p className="text-2xl text-coffee-medium mb-4">
            AI-Native Distribution Intelligence Platform
          </p>
          
          <p className="text-xl text-coffee-light mb-12">
            From warehouse to espresso machine — automated, intelligent, regenerative
          </p>
          
          <div className="flex gap-4 justify-center">
            <Link
              href="/dashboard"
              className="bg-coffee-dark text-cream px-8 py-4 rounded-lg text-lg font-semibold hover:bg-coffee-medium transition-colors"
            >
              Open Dashboard
            </Link>
            
            <Link
              href="/leads/new"
              className="border-2 border-coffee-dark text-coffee-dark px-8 py-4 rounded-lg text-lg font-semibold hover:bg-coffee-dark hover:text-cream transition-colors"
            >
              Add New Lead
            </Link>
          </div>
        </div>
      </div>
      
      {/* Features Grid */}
      <div className="container mx-auto px-4 py-16">
        <h2 className="text-3xl font-bold text-center text-coffee-dark mb-12">
          Distribution Intelligence Layer
        </h2>
        
        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow"
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
          Ready to transform your distribution?
        </h2>
        <p className="text-xl text-coffee-medium mb-8">
          This isn't a coffee CRM. It's a distribution intelligence layer.
        </p>
        <Link
          href="/dashboard"
          className="bg-coffee-dark text-cream px-8 py-4 rounded-lg text-lg font-semibold hover:bg-coffee-medium transition-colors inline-block"
        >
          Get Started
        </Link>
      </div>
    </main>
  )
}

const features = [
  {
    icon: '🎯',
    title: 'AI Proposal Generation',
    description: 'RAG-powered custom proposals tailored to each coffee shop's profile and needs',
  },
  {
    icon: '💳',
    title: 'Auto Credit Scoring',
    description: 'Instant creditworthiness assessment with payment term recommendations',
  },
  {
    icon: '🌱',
    title: 'Regenerative Sourcing',
    description: 'Brazil & Colombia regenerative lots with sustainability certificates',
  },
  {
    icon: '📧',
    title: 'Smart Outreach',
    description: 'AI-drafted emails and automated follow-ups that feel personal',
  },
  {
    icon: '📊',
    title: 'Predictive Analytics',
    description: '90-day reorder forecasting and inventory optimization',
  },
  {
    icon: '🔒',
    title: 'Compliance Guardian',
    description: 'Automated verification of terms, pricing, and legal requirements',
  },
]

const stats = [
  { value: '3×', label: 'Faster Deals' },
  { value: '71%', label: 'Conversion' },
  { value: '100%', label: 'Regenerative' },
  { value: '24/7', label: 'Intelligence' },
]
