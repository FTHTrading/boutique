import Link from 'next/link'
import { Coffee, Candy, Coins, Factory, ArrowRight } from 'lucide-react'

export default function CommoditiesPage() {
  return (
    <main className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-coffee-dark text-cream py-12">
        <div className="container mx-auto px-4">
          <Link href="/" className="text-sm hover:underline mb-4 inline-block">
            ← Back to Home
          </Link>
          <h1 className="text-5xl font-bold mb-4">Commodity Catalog</h1>
          <p className="text-xl text-cream/80">
            We source and structure supply for select commodities globally. All transactions subject to applicable laws; deals may require compliance review prior to execution.
          </p>
        </div>
      </div>

      {/* Commodities Grid */}
      <div className="container mx-auto px-4 py-16">
        <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
          {commodities.map((commodity) => (
            <Link
              key={commodity.slug}
              href={`/commodities/${commodity.slug}`}
              className="bg-white rounded-lg shadow-md hover:shadow-xl transition-all p-8 group"
            >
              <div className="flex items-start justify-between mb-6">
                <div className="p-4 bg-coffee-dark/5 rounded-lg">
                  {commodity.icon}
                </div>
                <ArrowRight className="w-6 h-6 text-coffee-medium opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              
              <h2 className="text-2xl font-bold text-coffee-dark mb-3 group-hover:text-coffee-medium transition-colors">
                {commodity.title}
              </h2>
              
              <p className="text-gray-600 mb-4">
                {commodity.description}
              </p>
              
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <span className="font-semibold text-coffee-dark">HS Code:</span>
                  <span className="text-gray-600">{commodity.hsCode}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <span className="font-semibold text-coffee-dark">Origins:</span>
                  <span className="text-gray-600">{commodity.origins}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <span className="font-semibold text-coffee-dark">Incoterms:</span>
                  <span className="text-gray-600">{commodity.incoterms}</span>
                </div>
              </div>
              
              {commodity.restricted && (
                <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded">
                  <p className="text-xs text-amber-800">
                    <strong>Compliance Note:</strong> This commodity may be subject to export controls or licensing requirements depending on jurisdiction and end-use.
                  </p>
                </div>
              )}
            </Link>
          ))}
        </div>

        {/* CTA Section */}
        <div className="max-w-3xl mx-auto mt-16 text-center">
          <div className="bg-white rounded-lg shadow-md p-8">
            <h2 className="text-2xl font-bold text-coffee-dark mb-4">
              Request Terms for Your Requirement
            </h2>
            <p className="text-gray-600 mb-6">
              Submit your sourcing requirements and we'll provide custom structuring options with transparent pricing and compliance pre-screening.
            </p>
            <Link
              href="/request-terms"
              className="bg-coffee-dark text-cream px-8 py-4 rounded-lg text-lg font-semibold hover:bg-coffee-medium transition-colors inline-block"
            >
              Request Terms
            </Link>
          </div>
        </div>
      </div>

      {/* Disclaimer */}
      <div className="bg-gray-100 py-8">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <p className="text-sm text-gray-600">
              <strong>Disclaimer:</strong> Commodity listings are indicative only. Availability, pricing, and terms subject to market conditions, counterparty verification, and compliance review. This platform flags potential compliance issues for human review and does not constitute legal advice, regulatory certification, or a guarantee of compliance. All transactions subject to applicable laws and regulations.
            </p>
          </div>
        </div>
      </div>
    </main>
  )
}

const commodities = [
  {
    slug: 'coffee',
    icon: <Coffee className="w-12 h-12 text-coffee-medium" />,
    title: 'Coffee',
    description: 'Arabica and Robusta. Brazil and Colombia origins. Regenerative certified lots available. Direct sourcing relationships with producer cooperatives.',
    hsCode: '0901.11 (Arabica), 0901.12 (Robusta)',
    origins: 'Brazil, Colombia, Ethiopia, Vietnam',
    incoterms: 'EXW, FOB, CIF',
    restricted: false,
  },
  {
    slug: 'cocoa',
    icon: <Candy className="w-12 h-12 text-coffee-medium" />,
    title: 'Cocoa',
    description: 'West African origins. Fair Trade certified. Sustainable sourcing programs. Traceable supply chain from farm to warehouse.',
    hsCode: '1801.00',
    origins: 'Côte d\'Ivoire, Ghana, Ecuador',
    incoterms: 'FOB, CIF, DDP',
    restricted: false,
  },
  {
    slug: 'precious-metals',
    icon: <Coins className="w-12 h-12 text-coffee-medium" />,
    title: 'Precious Metals',
    description: 'Gold, Silver, Platinum. LBMA Good Delivery. Chain-of-custody verification. Secure allocated storage. Institutional custody arrangements.',
    hsCode: '7108.13 (Gold), 7106.92 (Silver)',
    origins: 'Switzerland, UK (Refiners), South Africa (Origin)',
    incoterms: 'EXW, FOB, DDP',
    restricted: true,
  },
  {
    slug: 'base-metals',
    icon: <Factory className="w-12 h-12 text-coffee-medium" />,
    title: 'Base Metals',
    description: 'Copper, Aluminum, Nickel. Industrial grade. LME-registered warehousing. Quality certification. Global logistics network.',
    hsCode: '7403.11 (Copper), 7601.10 (Aluminum)',
    origins: 'Chile, Peru, Australia, China',
    incoterms: 'FOB, CIF, DAP',
    restricted: false,
  },
  {
    slug: 'sugar',
    icon: <Candy className="w-12 h-12 text-coffee-medium" />,
    title: 'Sugar',
    description: 'Raw and refined. Brazilian and Thai origins. ICE-compliant contracts. Bulk and containerized shipments.',
    hsCode: '1701.14 (Cane Sugar, Raw)',
    origins: 'Brazil, Thailand, India',
    incoterms: 'FOB, CFR, CIF',
    restricted: false,
  },
  {
    slug: 'energy',
    icon: <Factory className="w-12 h-12 text-coffee-medium" />,
    title: 'Energy (Crude Oil)',
    description: 'Crude oil spot and term contracts. Regional benchmarks (Brent, WTI). Trade finance structuring. Regulatory compliance screening.',
    hsCode: '2709.00',
    origins: 'Middle East, North Sea, Americas',
    incoterms: 'FOB, CIF, DES',
    restricted: true,
  },
]
