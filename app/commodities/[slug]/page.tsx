import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, AlertTriangle, CheckCircle, FileText } from 'lucide-react'

const commoditiesData = {
  'coffee': {
    title: 'Coffee',
    category: 'Agricultural',
    hsCode: '0901.11 (Arabica), 0901.12 (Robusta)',
    description: 'Premium Arabica and Robusta coffee sourced from regenerative farms in Brazil and Colombia. Direct relationships with producer cooperatives ensure quality, traceability, and sustainable farming practices.',
    origins: ['Brazil', 'Colombia', 'Ethiopia', 'Vietnam'],
    grades: ['Specialty Grade (80+ SCA)', 'Premium Grade', 'Commercial Grade'],
    incoterms: ['EXW', 'FOB', 'CIF', 'DDP'],
    packaging: ['60kg jute bags', 'GrainPro liner bags', 'Bulk containers'],
    certifications: ['Rainforest Alliance', 'Fair Trade', 'Organic', 'B Corp', 'Regenerative Organic Certified'],
    leadTime: '45-60 days from origin',
    minOrder: '1 container (300 bags / 18MT)',
    complianceNotes: [
      'Phytosanitary certificate required',
      'Certificate of Origin required',
      'ICO (International Coffee Organization) documentation',
      'USDA Organic certification (if applicable)',
    ],
    restricted: false,
  },
  'cocoa': {
    title: 'Cocoa',
    category: 'Agricultural',
    hsCode: '1801.00',
    description: 'West African cocoa beans from Fair Trade certified cooperatives. Traceable supply chain from farm to warehouse. Sustainable sourcing programs supporting farmer livelihoods.',
    origins: ['Côte d\'Ivoire', 'Ghana', 'Ecuador', 'Nigeria'],
    grades: ['Grade I (Premium)', 'Grade II (Standard)'],
    incoterms: ['FOB', 'CIF', 'DDP'],
    packaging: ['60-65kg jute bags', 'Bulk containers'],
    certifications: ['Fair Trade', 'Rainforest Alliance', 'UTZ Certified', 'Organic'],
    leadTime: '30-45 days from origin',
    minOrder: '1 container (20MT)',
    complianceNotes: [
      'Phytosanitary certificate required',
      'Certificate of Origin required',
      'ICCO (International Cocoa Organization) documentation',
      'Child labor compliance verification (ILO Convention 182)',
    ],
    restricted: false,
  },
  'precious-metals': {
    title: 'Precious Metals',
    category: 'Metals',
    hsCode: '7108.13 (Gold), 7106.92 (Silver), 7110.11 (Platinum)',
    description: 'LBMA Good Delivery gold, silver, and platinum bars. Chain-of-custody verification from refinery. Secure allocated storage in London, Zurich, or Singapore vaults. Institutional custody arrangements available.',
    origins: ['Switzerland (Refiners)', 'UK (Refiners)', 'South Africa (Mine Origin)', 'Canada (Mine Origin)'],
    grades: ['LBMA Good Delivery (Gold: 400oz, Silver: 1000oz)', 'Kilo bars', 'Custom allocations'],
    incoterms: ['EXW (Vault)', 'FOB', 'DDP'],
    packaging: ['Allocated storage (vault)', 'Insured transport (armored)'],
    certifications: ['LBMA Approved Refiner', 'OECD Due Diligence Guidance Compliant', 'ISO 9001'],
    leadTime: '7-14 days (vault allocation), 21-30 days (physical delivery)',
    minOrder: 'Gold: 1 bar (400oz / 12.4kg), Silver: 1 bar (1000oz / 31.1kg)',
    complianceNotes: [
      'Enhanced AML/KYC documentation required',
      'Beneficial ownership disclosure (>25% owners)',
      'Source of funds verification mandatory',
      'OFAC sanctions screening on all parties',
      'Export license may be required depending on jurisdiction',
    ],
    restricted: true,
  },
  'base-metals': {
    title: 'Base Metals',
    category: 'Metals',
    hsCode: '7403.11 (Copper), 7601.10 (Aluminum), 7502.10 (Nickel)',
    description: 'Industrial-grade copper, aluminum, and nickel. LME-registered warehouse storage. Quality certification per international standards. Global logistics network for container and bulk shipments.',
    origins: ['Chile', 'Peru', 'Australia', 'China', 'Russia (sanctions screening required)'],
    grades: ['Copper Cathode Grade A', 'Aluminum 99.7%', 'Nickel Briquettes'],
    incoterms: ['FOB', 'CIF', 'DAP', 'DDP'],
    packaging: ['Bundled (Copper)', 'Ingots (Aluminum)', 'Briquettes (Nickel)', 'Container/bulk vessel'],
    certifications: ['LME Good Delivery', 'ISO 9001', 'ASTM Standards'],
    leadTime: '30-60 days',
    minOrder: 'Copper: 25MT, Aluminum: 20MT, Nickel: 10MT',
    complianceNotes: [
      'Certificate of Origin required',
      'Quality certificate from approved laboratory',
      'Export control screening (dual-use restrictions may apply)',
      'Sanctions screening on origin and destination',
    ],
    restricted: false,
  },
  'sugar': {
    title: 'Sugar',
    category: 'Agricultural',
    hsCode: '1701.14 (Cane Sugar, Raw), 1701.91 (Refined)',
    description: 'Raw and refined cane sugar from Brazilian and Thai plantations. ICE-compliant contracts. Available in bulk and containerized shipments.',
    origins: ['Brazil', 'Thailand', 'India', 'Australia'],
    grades: ['ICUMSA 45 (Refined)', 'ICUMSA 150', 'VHP (Very High Polarization)', 'Raw Sugar'],
    incoterms: ['FOB', 'CFR', 'CIF'],
    packaging: ['50kg PP bags', 'Bulk bags (1MT)', 'Bulk vessel'],
    certifications: ['Bonsucro', 'Fair Trade', 'Organic', 'Non-GMO'],
    leadTime: '30-45 days',
    minOrder: '1 container (25MT) or 1,000MT (bulk vessel)',
    complianceNotes: [
      'Phytosanitary certificate required',
      'Certificate of Origin required',
      'ISO (International Sugar Organization) documentation',
      'Halal/Kosher certification (if applicable)',
    ],
    restricted: false,
  },
  'energy': {
    title: 'Energy (Crude Oil)',
    category: 'Energy',
    hsCode: '2709.00',
    description: 'Crude oil spot and term contracts. Regional benchmarks including Brent, WTI, and Dubai. Trade finance structuring available. Comprehensive regulatory compliance screening for all jurisdictions.',
    origins: ['Middle East (Saudi Arabia, UAE, Iraq)', 'North Sea (UK, Norway)', 'Americas (US, Canada, Brazil)', 'West Africa (Nigeria, Angola)'],
    grades: ['Brent Crude', 'WTI (West Texas Intermediate)', 'Dubai Crude', 'Light Sweet', 'Heavy Sour'],
    incoterms: ['FOB', 'CIF', 'DES (Delivered Ex Ship)'],
    packaging: ['Tanker vessel (VLCC, Aframax, Suezmax)'],
    certifications: ['API Gravity certification', 'Sulfur content analysis', 'INTERTANKO member vessels'],
    leadTime: '30-60 days (term contracts), 7-14 days (spot)',
    minOrder: '500,000 barrels (1 Aframax cargo)',
    complianceNotes: [
      'OFAC sanctions screening MANDATORY on all parties and intermediaries',
      'Export license required from origin country',
      'Import authorization required in destination',
      'Enhanced due diligence on shipping, insurance, and payment intermediaries',
      'AML/KYC documentation required (beneficial owners, source of funds)',
      'Trade finance compliance (UCP 600, ISBP)',
      'Insurance (P&I, cargo, political risk)',
    ],
    restricted: true,
  },
}

export async function generateStaticParams() {
  return Object.keys(commoditiesData).map((slug) => ({
    slug,
  }))
}

export default function CommodityPage({ params }: { params: { slug: string } }) {
  const commodity = commoditiesData[params.slug as keyof typeof commoditiesData]

  if (!commodity) {
    notFound()
  }

  return (
    <main className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-coffee-dark text-cream py-12">
        <div className="container mx-auto px-4">
          <Link href="/commodities" className="text-sm hover:underline mb-4 inline-flex items-center gap-2">
            <ArrowLeft className="w-4 h-4" />
            Back to Commodities
          </Link>
          <h1 className="text-5xl font-bold mb-4">{commodity.title}</h1>
          <p className="text-xl text-cream/80">
            {commodity.category} • HS Code: {commodity.hsCode}
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-5xl mx-auto">
          {/* Restricted Warning */}
          {commodity.restricted && (
            <div className="mb-8 bg-amber-50 border-l-4 border-amber-500 p-6 rounded-r-lg">
              <div className="flex items-start gap-4">
                <AlertTriangle className="w-6 h-6 text-amber-600 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-bold text-amber-900 mb-2">Compliance Review Required</h3>
                  <p className="text-amber-800 text-sm">
                    This commodity is flagged as restricted and requires enhanced compliance screening. Export controls, licensing requirements, and sanctions screening apply. All transactions subject to human review gates before execution.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Description */}
          <div className="bg-white rounded-lg shadow-md p-8 mb-8">
            <h2 className="text-2xl font-bold text-coffee-dark mb-4">Description</h2>
            <p className="text-gray-700 leading-relaxed">
              {commodity.description}
            </p>
          </div>

          {/* Specifications Grid */}
          <div className="grid md:grid-cols-2 gap-8 mb-8">
            {/* Origins */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-xl font-bold text-coffee-dark mb-4">Origins</h3>
              <ul className="space-y-2">
                {commodity.origins.map((origin) => (
                  <li key={origin} className="flex items-center gap-2 text-gray-700">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    {origin}
                  </li>
                ))}
              </ul>
            </div>

            {/* Grades */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-xl font-bold text-coffee-dark mb-4">Grades Available</h3>
              <ul className="space-y-2">
                {commodity.grades.map((grade) => (
                  <li key={grade} className="flex items-center gap-2 text-gray-700">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    {grade}
                  </li>
                ))}
              </ul>
            </div>

            {/* Incoterms */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-xl font-bold text-coffee-dark mb-4">Incoterms® 2020</h3>
              <div className="flex gap-2 flex-wrap">
                {commodity.incoterms.map((term) => (
                  <span key={term} className="px-3 py-1 bg-coffee-dark/10 text-coffee-dark rounded-full text-sm font-semibold">
                    {term}
                  </span>
                ))}
              </div>
            </div>

            {/* Packaging */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-xl font-bold text-coffee-dark mb-4">Packaging Options</h3>
              <ul className="space-y-2">
                {commodity.packaging.map((pkg) => (
                  <li key={pkg} className="flex items-center gap-2 text-gray-700">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    {pkg}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Certifications */}
          <div className="bg-white rounded-lg shadow-md p-8 mb-8">
            <h3 className="text-xl font-bold text-coffee-dark mb-4">Certifications & Standards</h3>
            <div className="flex gap-2 flex-wrap">
              {commodity.certifications.map((cert) => (
                <span key={cert} className="px-4 py-2 bg-green-50 text-green-800 border border-green-200 rounded-lg text-sm font-medium">
                  {cert}
                </span>
              ))}
            </div>
          </div>

          {/* Commercial Terms */}
          <div className="bg-white rounded-lg shadow-md p-8 mb-8">
            <h3 className="text-xl font-bold text-coffee-dark mb-4">Commercial Terms (Indicative)</h3>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <p className="text-sm font-semibold text-coffee-dark mb-1">Lead Time</p>
                <p className="text-gray-700">{commodity.leadTime}</p>
              </div>
              <div>
                <p className="text-sm font-semibold text-coffee-dark mb-1">Minimum Order</p>
                <p className="text-gray-700">{commodity.minOrder}</p>
              </div>
            </div>
          </div>

          {/* Compliance Notes */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-8 mb-8">
            <div className="flex items-start gap-4">
              <FileText className="w-6 h-6 text-blue-600 flex-shrink-0 mt-1" />
              <div>
                <h3 className="text-xl font-bold text-blue-900 mb-4">Compliance & Documentation</h3>
                <ul className="space-y-2">
                  {commodity.complianceNotes.map((note, index) => (
                    <li key={index} className="text-blue-800 text-sm flex items-start gap-2">
                      <span className="text-blue-600 font-bold">•</span>
                      {note}
                    </li>
                  ))}
                </ul>
                <p className="text-xs text-blue-700 mt-4 italic">
                  All transactions screened through TradeComplianceAgent. CRITICAL flags block execution pending human review.
                </p>
              </div>
            </div>
          </div>

          {/* CTA */}
          <div className="bg-coffee-dark text-cream rounded-lg p-8 text-center">
            <h3 className="text-2xl font-bold mb-4">Request Terms for {commodity.title}</h3>
            <p className="text-cream/80 mb-6">
              Submit your sourcing requirements and we'll provide custom structuring options with transparent pricing and compliance pre-screening.
            </p>
            <Link
              href="/request-terms"
              className="bg-cream text-coffee-dark px-8 py-4 rounded-lg text-lg font-semibold hover:bg-cream/90 transition-colors inline-block"
            >
              Request Terms
            </Link>
          </div>
        </div>
      </div>
    </main>
  )
}
