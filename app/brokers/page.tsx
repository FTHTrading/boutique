'use client'
import { useState } from 'react'
import Link from 'next/link'
import { Globe, ArrowLeft, Check, Users, TrendingUp, Shield, FileText, ChevronRight } from 'lucide-react'

const COMMODITIES = ['Coffee', 'Cocoa', 'Precious Metals (Gold/Silver/Platinum)', 'Base Metals (Copper/Aluminum/Nickel)', 'Energy', 'Soft Commodities (Sugar/Cotton)', 'Multiple Categories']
const JURISDICTIONS = ['United Arab Emirates', 'United Kingdom', 'European Union', 'Singapore', 'Hong Kong', 'Switzerland', 'United States', 'Canada', 'Australia', 'Other']
const VOLUMES = ['Under $500K/year', '$500K - $2M/year', '$2M - $10M/year', '$10M - $50M/year', '$50M+/year']

export default function BrokersPage() {
  const [form, setForm] = useState({
    firmName: '', contactName: '', email: '', phone: '', country: '',
    licenseNumber: '', regulatoryBody: '', commodity: '', volume: '',
    experience: '', message: '',
  })
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle')

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }))

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setStatus('submitting')
    try {
      const res = await fetch('/api/brokers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      setStatus(res.ok ? 'success' : 'error')
    } catch {
      setStatus('error')
    }
  }

  return (
    <main className="bg-[#0d0906] text-[#efebe9] min-h-screen">
      {/* Nav */}
      <header className="border-b border-white/5 bg-[#0d0906]/80 backdrop-blur-md px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-lg bg-amber-700 flex items-center justify-center">
              <Globe size={13} className="text-amber-100" />
            </div>
            <span className="font-bold text-[#efebe9] tracking-tight text-sm">FTH Trading</span>
          </Link>
          <Link href="/" className="flex items-center gap-1.5 text-xs text-[#6d4c41] hover:text-[#a1887f] transition-colors">
            <ArrowLeft size={13} /> Back
          </Link>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-6 py-16">
        <div className="grid lg:grid-cols-5 gap-12">

          {/* Left column  -  info */}
          <div className="lg:col-span-2">
            <span className="inline-block text-xs font-semibold tracking-widest uppercase text-amber-600 border border-amber-900/40 bg-amber-950/30 px-3 py-1 rounded-full mb-6">
              Broker Network
            </span>
            <h1 className="text-3xl md:text-4xl font-bold text-[#efebe9] mb-4 leading-tight">
              Join the FTH Trading Broker Network
            </h1>
            <p className="text-[#6d4c41] leading-relaxed mb-8 text-sm">
              We work with independent commodity brokers, trade agents, and introducing firms worldwide.
              Submit your inquiry below and our team will contact you within 2 business days.
            </p>

            <div className="space-y-4 mb-8">
              {[
                { icon: TrendingUp, title: 'Tiered Commission (1-3%)', body: 'Performance-linked rates increasing with deal volume and tenure.' },
                { icon: Shield, title: 'Compliance Support', body: 'Pre-screening for your clients  -  OFAC, KYC/KYB, sanctions checks included.' },
                { icon: Users, title: 'Platform Access', body: 'Full dashboard access: pipeline, contracts, funding tools, and team hub.' },
                { icon: FileText, title: 'Dedicated RM', body: 'A relationship manager assigned to your firm from day one.' },
              ].map(({ icon: Icon, title, body }) => (
                <div key={title} className="flex gap-3">
                  <div className="w-8 h-8 rounded-lg bg-amber-950/60 border border-amber-800/20 flex items-center justify-center shrink-0 mt-0.5">
                    <Icon size={14} className="text-amber-600" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-[#efebe9]">{title}</p>
                    <p className="text-xs text-[#6d4c41] leading-relaxed">{body}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="bg-white/[0.03] border border-white/5 rounded-2xl p-5">
              <p className="text-xs font-semibold text-[#efebe9] mb-3">Eligible Firm Types</p>
              <ul className="space-y-1.5">
                {[
                  'Independent commodity brokers',
                  'Trade finance intermediaries',
                  'Import/export agents',
                  'Private equity / family offices',
                  'Trading houses & offtakers',
                  'Banks introducing commodity clients',
                ].map((t) => (
                  <li key={t} className="flex items-center gap-2 text-xs text-[#6d4c41]">
                    <Check size={10} className="text-amber-700 shrink-0" />{t}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Right column  -  form */}
          <div className="lg:col-span-3">
            {status === 'success' ? (
              <div className="bg-white/[0.03] border border-green-900/40 rounded-2xl p-10 text-center">
                <div className="w-14 h-14 rounded-full bg-green-950/50 border border-green-800/30 flex items-center justify-center mx-auto mb-5">
                  <Check size={22} className="text-green-500" />
                </div>
                <h2 className="text-xl font-bold text-[#efebe9] mb-3">Inquiry Received</h2>
                <p className="text-[#6d4c41] text-sm mb-6">
                  Thank you for your interest. Our broker relations team will review your application and contact you within 2 business days.
                </p>
                <Link href="/" className="inline-flex items-center gap-2 text-sm text-amber-500 hover:text-amber-400 transition-colors">
                  Return to Home <ChevronRight size={14} />
                </Link>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="bg-white/[0.03] border border-white/5 rounded-2xl p-8 space-y-5">
                <h2 className="text-lg font-bold text-[#efebe9] mb-2">Broker Inquiry Form</h2>
                <p className="text-xs text-[#6d4c41] mb-6">All fields marked * are required. Inquiries are subject to compliance review.</p>

                <div className="grid sm:grid-cols-2 gap-4">
                  <Field label="Firm / Company Name *" value={form.firmName} onChange={(v) => set('firmName', v)} placeholder="Acme Commodities Ltd" required />
                  <Field label="Your Full Name *" value={form.contactName} onChange={(v) => set('contactName', v)} placeholder="Jane Smith" required />
                </div>
                <div className="grid sm:grid-cols-2 gap-4">
                  <Field label="Email Address *" type="email" value={form.email} onChange={(v) => set('email', v)} placeholder="jane@firmname.com" required />
                  <Field label="Phone / WhatsApp" value={form.phone} onChange={(v) => set('phone', v)} placeholder="+971 50 000 0000" />
                </div>

                <SelectField label="Country of Registration *" value={form.country} onChange={(v) => set('country', v)} options={JURISDICTIONS} required />

                <div className="grid sm:grid-cols-2 gap-4">
                  <Field label="License / Reg. Number" value={form.licenseNumber} onChange={(v) => set('licenseNumber', v)} placeholder="DMCC-123456" />
                  <Field label="Regulatory Body" value={form.regulatoryBody} onChange={(v) => set('regulatoryBody', v)} placeholder="DMCC, FCA, MAS..." />
                </div>

                <SelectField label="Primary Commodity Specialty *" value={form.commodity} onChange={(v) => set('commodity', v)} options={COMMODITIES} required />
                <SelectField label="Estimated Annual Trade Volume *" value={form.volume} onChange={(v) => set('volume', v)} options={VOLUMES} required />

                <Field label="Years of Experience in Commodity Trade" value={form.experience} onChange={(v) => set('experience', v)} placeholder="e.g. 8 years" />

                <div>
                  <label className="block text-xs font-semibold text-[#a1887f] mb-1.5 tracking-wide uppercase">
                    Additional Notes
                  </label>
                  <textarea
                    rows={4}
                    value={form.message}
                    onChange={(e) => set('message', e.target.value)}
                    placeholder="Tell us about your current network, typical deal sizes, and what you're looking to source or offtake..."
                    className="w-full bg-white/[0.04] border border-white/8 rounded-xl px-4 py-3 text-sm text-[#efebe9] placeholder:text-[#3e2723] focus:outline-none focus:border-amber-700 resize-none"
                  />
                </div>

                <div className="bg-amber-950/20 border border-amber-900/20 rounded-xl p-4">
                  <p className="text-xs text-[#6d4c41]">
                    By submitting this form you confirm that the information provided is accurate and that your firm operates in compliance with applicable laws. All applications are subject to KYB/KYC due diligence and compliance screening.
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={status === 'submitting'}
                  className="w-full bg-amber-700 hover:bg-amber-600 disabled:opacity-50 text-white font-semibold py-3.5 rounded-xl transition-colors"
                >
                  {status === 'submitting' ? 'Submitting...' : 'Submit Broker Inquiry'}
                </button>

                {status === 'error' && (
                  <p className="text-xs text-red-400 text-center">Something went wrong. Please try again or email us directly.</p>
                )}
              </form>
            )}
          </div>
        </div>
      </div>
    </main>
  )
}

function Field({
  label, value, onChange, placeholder, type = 'text', required,
}: {
  label: string; value: string; onChange: (v: string) => void
  placeholder?: string; type?: string; required?: boolean
}) {
  return (
    <div>
      <label className="block text-xs font-semibold text-[#a1887f] mb-1.5 tracking-wide uppercase">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
        className="w-full bg-white/[0.04] border border-white/8 rounded-xl px-4 py-3 text-sm text-[#efebe9] placeholder:text-[#3e2723] focus:outline-none focus:border-amber-700"
      />
    </div>
  )
}

function SelectField({
  label, value, onChange, options, required,
}: {
  label: string; value: string; onChange: (v: string) => void; options: string[]; required?: boolean
}) {
  return (
    <div>
      <label className="block text-xs font-semibold text-[#a1887f] mb-1.5 tracking-wide uppercase">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        className="w-full bg-[#1a0f08] border border-white/8 rounded-xl px-4 py-3 text-sm text-[#efebe9] focus:outline-none focus:border-amber-700"
      >
        <option value="">Select...</option>
        {options.map((o) => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  )
}
