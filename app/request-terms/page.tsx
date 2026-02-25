'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Send, AlertCircle } from 'lucide-react'

export default function RequestTermsPage() {
  const [formData, setFormData] = useState({
    companyName: '',
    contactName: '',
    email: '',
    phone: '',
    commodity: 'coffee',
    quantity: '',
    quantityUnit: 'MT',
    originCountry: '',
    destinationCountry: '',
    incoterm: 'FOB',
    targetDelivery: '',
    additionalRequirements: '',
  })

  const [submitted, setSubmitted] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Basic validation
    const newErrors: Record<string, string> = {}
    if (!formData.companyName) newErrors.companyName = 'Required'
    if (!formData.contactName) newErrors.contactName = 'Required'
    if (!formData.email) newErrors.email = 'Required'
    if (!formData.quantity) newErrors.quantity = 'Required'
    if (!formData.destinationCountry) newErrors.destinationCountry = 'Required'

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    // TODO: Send to API endpoint that creates lead + draft deal
    // await fetch('/api/leads', { method: 'POST', body: JSON.stringify(formData) })

    setSubmitted(true)
  }

  const handleChange = (field: string, value: string) => {
    setFormData({ ...formData, [field]: value })
    if (errors[field]) {
      setErrors({ ...errors, [field]: '' })
    }
  }

  if (submitted) {
    return (
      <main className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="max-w-2xl w-full bg-white rounded-lg shadow-md p-8 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Send className="w-8 h-8 text-green-600" />
          </div>
          <h1 className="text-3xl font-bold text-coffee-dark mb-4">Request Received</h1>
          <p className="text-gray-700 mb-6">
            Thank you, <strong>{formData.contactName}</strong>. We've received your request for terms on <strong>{formData.commodity}</strong> and will respond within 24-48 hours.
          </p>
          <p className="text-sm text-gray-600 mb-8">
            Your request will be screened through our TradeComplianceAgent for sanctions risk, export controls, and documentation requirements. If any compliance flags are raised, we'll include them in our response along with recommended next steps.
          </p>
          <div className="flex gap-4 justify-center">
            <Link
              href="/commodities"
              className="border-2 border-coffee-dark text-coffee-dark px-6 py-3 rounded-lg font-semibold hover:bg-coffee-dark hover:text-cream transition-colors"
            >
              View Commodities
            </Link>
            <Link
              href="/"
              className="bg-coffee-dark text-cream px-6 py-3 rounded-lg font-semibold hover:bg-coffee-medium transition-colors"
            >
              Return Home
            </Link>
          </div>
        </div>
      </main>
    )
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
          <h1 className="text-5xl font-bold mb-4">Request Terms</h1>
          <p className="text-xl text-cream/80">
            Submit your sourcing requirements for custom structuring options with compliance pre-screening.
          </p>
        </div>
      </div>

      {/* Form */}
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-3xl mx-auto">
          {/* Disclaimer */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
            <div className="flex items-start gap-4">
              <AlertCircle className="w-6 h-6 text-blue-600 flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-bold text-blue-900 mb-2">Compliance Pre-Screening</h3>
                <p className="text-blue-800 text-sm">
                  All requests are automatically screened for sanctions risk, export controls, and documentation requirements. We'll flag any compliance concerns in our response. Terms are subject to final credit review, counterparty verification, and legal compliance clearance.
                </p>
              </div>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-md p-8">
            <h2 className="text-2xl font-bold text-coffee-dark mb-6">Company Information</h2>
            
            <div className="grid md:grid-cols-2 gap-6 mb-8">
              <div>
                <label className="block text-sm font-semibold text-coffee-dark mb-2">
                  Company Name *
                </label>
                <input
                  type="text"
                  value={formData.companyName}
                  onChange={(e) => handleChange('companyName', e.target.value)}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-coffee-medium focus:border-transparent ${errors.companyName ? 'border-red-500' : 'border-gray-300'}`}
                  placeholder="Acme Corp"
                />
                {errors.companyName && <p className="text-red-500 text-xs mt-1">{errors.companyName}</p>}
              </div>

              <div>
                <label className="block text-sm font-semibold text-coffee-dark mb-2">
                  Contact Name *
                </label>
                <input
                  type="text"
                  value={formData.contactName}
                  onChange={(e) => handleChange('contactName', e.target.value)}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-coffee-medium focus:border-transparent ${errors.contactName ? 'border-red-500' : 'border-gray-300'}`}
                  placeholder="John Smith"
                />
                {errors.contactName && <p className="text-red-500 text-xs mt-1">{errors.contactName}</p>}
              </div>

              <div>
                <label className="block text-sm font-semibold text-coffee-dark mb-2">
                  Email *
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleChange('email', e.target.value)}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-coffee-medium focus:border-transparent ${errors.email ? 'border-red-500' : 'border-gray-300'}`}
                  placeholder="john@acmecorp.com"
                />
                {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
              </div>

              <div>
                <label className="block text-sm font-semibold text-coffee-dark mb-2">
                  Phone
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => handleChange('phone', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-coffee-medium focus:border-transparent"
                  placeholder="+1 (555) 123-4567"
                />
              </div>
            </div>

            <h2 className="text-2xl font-bold text-coffee-dark mb-6">Commodity Requirements</h2>

            <div className="grid md:grid-cols-2 gap-6 mb-8">
              <div>
                <label className="block text-sm font-semibold text-coffee-dark mb-2">
                  Commodity *
                </label>
                <select
                  value={formData.commodity}
                  onChange={(e) => handleChange('commodity', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-coffee-medium focus:border-transparent"
                >
                  <option value="coffee">Coffee</option>
                  <option value="cocoa">Cocoa</option>
                  <option value="sugar">Sugar</option>
                  <option value="precious-metals">Precious Metals (Gold/Silver)</option>
                  <option value="base-metals">Base Metals (Copper/Aluminum)</option>
                  <option value="energy">Energy (Crude Oil)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-coffee-dark mb-2">
                  Quantity *
                </label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    value={formData.quantity}
                    onChange={(e) => handleChange('quantity', e.target.value)}
                    className={`flex-1 px-4 py-3 border rounded-lg focus:ring-2 focus:ring-coffee-medium focus:border-transparent ${errors.quantity ? 'border-red-500' : 'border-gray-300'}`}
                    placeholder="100"
                  />
                  <select
                    value={formData.quantityUnit}
                    onChange={(e) => handleChange('quantityUnit', e.target.value)}
                    className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-coffee-medium focus:border-transparent"
                  >
                    <option value="MT">MT (Metric Tons)</option>
                    <option value="kg">kg</option>
                    <option value="oz">oz (Troy Ounces)</option>
                    <option value="barrels">Barrels</option>
                    <option value="containers">Containers</option>
                  </select>
                </div>
                {errors.quantity && <p className="text-red-500 text-xs mt-1">{errors.quantity}</p>}
              </div>

              <div>
                <label className="block text-sm font-semibold text-coffee-dark mb-2">
                  Origin Country
                </label>
                <input
                  type="text"
                  value={formData.originCountry}
                  onChange={(e) => handleChange('originCountry', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-coffee-medium focus:border-transparent"
                  placeholder="Brazil (optional - we can source)"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-coffee-dark mb-2">
                  Destination Country *
                </label>
                <input
                  type="text"
                  value={formData.destinationCountry}
                  onChange={(e) => handleChange('destinationCountry', e.target.value)}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-coffee-medium focus:border-transparent ${errors.destinationCountry ? 'border-red-500' : 'border-gray-300'}`}
                  placeholder="United States"
                />
                {errors.destinationCountry && <p className="text-red-500 text-xs mt-1">{errors.destinationCountry}</p>}
              </div>

              <div>
                <label className="block text-sm font-semibold text-coffee-dark mb-2">
                  Preferred Incoterm® 2020
                </label>
                <select
                  value={formData.incoterm}
                  onChange={(e) => handleChange('incoterm', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-coffee-medium focus:border-transparent"
                >
                  <option value="EXW">EXW - Ex Works</option>
                  <option value="FOB">FOB - Free on Board</option>
                  <option value="CIF">CIF - Cost, Insurance, Freight</option>
                  <option value="CFR">CFR - Cost and Freight</option>
                  <option value="DAP">DAP - Delivered at Place</option>
                  <option value="DDP">DDP - Delivered Duty Paid</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-coffee-dark mb-2">
                  Target Delivery Date
                </label>
                <input
                  type="date"
                  value={formData.targetDelivery}
                  onChange={(e) => handleChange('targetDelivery', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-coffee-medium focus:border-transparent"
                />
              </div>
            </div>

            <div className="mb-8">
              <label className="block text-sm font-semibold text-coffee-dark mb-2">
                Additional Requirements
              </label>
              <textarea
                value={formData.additionalRequirements}
                onChange={(e) => handleChange('additionalRequirements', e.target.value)}
                rows={4}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-coffee-medium focus:border-transparent"
                placeholder="Certifications, payment terms preferences, specific grades, etc."
              />
            </div>

            <div className="bg-gray-50 p-6 rounded-lg mb-6">
              <p className="text-sm text-gray-700">
                <strong>What happens next:</strong>
              </p>
              <ol className="list-decimal list-inside text-sm text-gray-600 mt-2 space-y-1">
                <li>Your request is screened through TradeComplianceAgent for compliance risks</li>
                <li>Credit scoring and payment term recommendations generated</li>
                <li>Sourcing intelligence queries for availability and pricing</li>
                <li>Custom proposal sent to your email within 24-48 hours</li>
              </ol>
            </div>

            <button
              type="submit"
              className="w-full bg-coffee-dark text-cream px-8 py-4 rounded-lg text-lg font-semibold hover:bg-coffee-medium transition-colors flex items-center justify-center gap-2"
            >
              <Send className="w-5 h-5" />
              Submit Request
            </button>

            <p className="text-xs text-gray-600 text-center mt-4">
              By submitting this form, you acknowledge that all terms are subject to credit approval, compliance clearance, and market availability. This is not a binding offer.
            </p>
          </form>
        </div>
      </div>
    </main>
  )
}
