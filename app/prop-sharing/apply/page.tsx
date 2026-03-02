'use client'

import { useState, useEffect } from 'react'
import { Target, ChevronRight, CheckCircle, ArrowLeft, Zap, Shield, TrendingUp, DollarSign, Users, Clock } from 'lucide-react'
import Link from 'next/link'

interface Program {
  program_id: string
  name: string
  capital: number
  trader_profit_pct: number
  firm_profit_pct: number
  eval_fee: number
  eval_profit_target: number
  eval_max_drawdown: number
  eval_daily_loss_limit: number
  eval_min_trading_days: number
  status: string
}

export default function ApplyPage() {
  const [programs, setPrograms] = useState<Program[]>([])
  const [step, setStep] = useState(1)
  const [selectedProgram, setSelectedProgram] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')

  const [form, setForm] = useState({
    applicant_name: '',
    applicant_email: '',
    applicant_phone: '',
    trading_experience: '',
    preferred_markets: '',
    motivation: '',
    referral_source: '',
  })

  useEffect(() => {
    fetch('/api/prop-sharing/programs')
      .then(r => r.json())
      .then(data => {
        setPrograms((data.programs || []).filter((p: Program) => p.status === 'active'))
        setLoading(false)
      })
      .catch(() => setLoading(false))

    // Capture UTM params
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search)
      ;(window as any).__utm = {
        utm_source: params.get('utm_source') || '',
        utm_medium: params.get('utm_medium') || '',
        utm_campaign: params.get('utm_campaign') || '',
      }
    }
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setSubmitting(true)

    try {
      const utm = (window as any).__utm || {}
      const res = await fetch('/api/prop-sharing/applications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          program_id: selectedProgram,
          ...form,
          ...utm,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Failed to submit application')
      } else {
        setSubmitted(true)
      }
    } catch (e) {
      setError('Network error. Please try again.')
    }
    setSubmitting(false)
  }

  const fmt = (n: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(n)
  const selectedProg = programs.find(p => p.program_id === selectedProgram)

  if (submitted) {
    return (
      <div className="min-h-screen bg-[#0d0906] flex items-center justify-center">
        <div className="text-center max-w-lg px-6">
          <div className="w-16 h-16 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-8 h-8 text-emerald-400" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-4">Application Submitted!</h1>
          <p className="text-gray-400 mb-2">Thank you for applying to the FTH Prop Challenge.</p>
          <p className="text-gray-500 mb-8 text-sm">You&apos;ll receive payment instructions at <span className="text-white">{form.applicant_email}</span> within 24 hours. Once payment is confirmed, your evaluation account will be provisioned.</p>
          <Link href="/prop-sharing" className="inline-flex items-center gap-2 px-6 py-3 bg-amber-600 text-white rounded-lg hover:bg-amber-700">
            <ArrowLeft className="w-4 h-4" /> Back to Prop Sharing
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0d0906]">
      {/* Header */}
      <div className="border-b border-white/10">
        <div className="max-w-5xl mx-auto px-6 py-6 flex items-center justify-between">
          <Link href="/prop-sharing" className="flex items-center gap-3 text-white hover:text-amber-400 transition">
            <ArrowLeft className="w-4 h-4" />
            <span className="text-lg font-bold">FTH Trading</span>
          </Link>
          <div className="text-sm text-gray-500">Prop Challenge Application</div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-6 py-12">
        {/* Progress */}
        <div className="flex items-center gap-3 mb-12">
          {[1, 2, 3].map(s => (
            <div key={s} className="flex items-center gap-2 flex-1">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition ${step >= s ? 'bg-amber-600 text-white' : 'bg-white/10 text-gray-500'}`}>{s}</div>
              <span className={`text-sm ${step >= s ? 'text-white' : 'text-gray-600'}`}>
                {s === 1 ? 'Choose Program' : s === 2 ? 'Your Info' : 'Trading Profile'}
              </span>
              {s < 3 && <ChevronRight className="w-4 h-4 text-gray-600 ml-auto" />}
            </div>
          ))}
        </div>

        {/* Step 1: Choose Program */}
        {step === 1 && (
          <div>
            <h2 className="text-2xl font-bold text-white mb-2">Choose Your Challenge</h2>
            <p className="text-gray-400 mb-8">Select the program that matches your trading level and goals.</p>

            {loading ? (
              <div className="text-gray-500 text-center py-12">Loading programs...</div>
            ) : programs.length === 0 ? (
              <div className="text-gray-500 text-center py-12">No programs available at this time.</div>
            ) : (
              <div className="grid gap-4">
                {programs.map(prog => (
                  <button key={prog.program_id}
                    onClick={() => setSelectedProgram(prog.program_id)}
                    className={`w-full text-left p-6 rounded-xl border transition ${selectedProgram === prog.program_id
                      ? 'border-amber-500 bg-amber-500/10'
                      : 'border-white/10 bg-white/5 hover:border-white/20'
                    }`}>
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-lg font-bold text-white">{prog.name}</h3>
                      <span className="text-2xl font-bold text-amber-400">{fmt(prog.capital)}</span>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                      <div className="text-gray-400">
                        <span className="block text-xs text-gray-600">Profit Split</span>
                        {prog.trader_profit_pct}/{prog.firm_profit_pct}
                      </div>
                      <div className="text-gray-400">
                        <span className="block text-xs text-gray-600">Eval Fee</span>
                        {fmt(prog.eval_fee)}
                      </div>
                      <div className="text-gray-400">
                        <span className="block text-xs text-gray-600">Profit Target</span>
                        {prog.eval_profit_target}%
                      </div>
                      <div className="text-gray-400">
                        <span className="block text-xs text-gray-600">Max Drawdown</span>
                        {prog.eval_max_drawdown}%
                      </div>
                    </div>
                    <div className="flex gap-4 mt-3 text-xs text-gray-500">
                      <span>Daily Loss Limit: {prog.eval_daily_loss_limit}%</span>
                      <span>Min Trading Days: {prog.eval_min_trading_days}</span>
                    </div>
                  </button>
                ))}
              </div>
            )}

            <div className="flex justify-end mt-8">
              <button onClick={() => selectedProgram && setStep(2)} disabled={!selectedProgram}
                className="flex items-center gap-2 px-6 py-3 bg-amber-600 text-white rounded-lg hover:bg-amber-700 disabled:opacity-50 disabled:cursor-not-allowed">
                Continue <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Personal Info */}
        {step === 2 && (
          <div>
            <h2 className="text-2xl font-bold text-white mb-2">Your Information</h2>
            <p className="text-gray-400 mb-8">We need basic contact info to set up your challenge account.</p>

            <div className="grid gap-4">
              <div>
                <label className="block text-sm text-gray-300 mb-2">Full Name *</label>
                <input type="text" value={form.applicant_name} onChange={e => setForm({ ...form, applicant_name: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-white placeholder-gray-600 focus:border-amber-500 focus:outline-none"
                  placeholder="Your full legal name" required />
              </div>
              <div>
                <label className="block text-sm text-gray-300 mb-2">Email *</label>
                <input type="email" value={form.applicant_email} onChange={e => setForm({ ...form, applicant_email: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-white placeholder-gray-600 focus:border-amber-500 focus:outline-none"
                  placeholder="your@email.com" required />
              </div>
              <div>
                <label className="block text-sm text-gray-300 mb-2">Phone</label>
                <input type="tel" value={form.applicant_phone} onChange={e => setForm({ ...form, applicant_phone: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-white placeholder-gray-600 focus:border-amber-500 focus:outline-none"
                  placeholder="+1 (555) 000-0000" />
              </div>
            </div>

            <div className="flex justify-between mt-8">
              <button onClick={() => setStep(1)} className="px-6 py-3 text-gray-400 hover:text-white">
                Back
              </button>
              <button onClick={() => form.applicant_name && form.applicant_email && setStep(3)}
                disabled={!form.applicant_name || !form.applicant_email}
                className="flex items-center gap-2 px-6 py-3 bg-amber-600 text-white rounded-lg hover:bg-amber-700 disabled:opacity-50">
                Continue <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Trading Profile */}
        {step === 3 && (
          <form onSubmit={handleSubmit}>
            <h2 className="text-2xl font-bold text-white mb-2">Trading Profile</h2>
            <p className="text-gray-400 mb-8">Help us understand your trading background. This is optional but helps with review priority.</p>

            <div className="grid gap-4">
              <div>
                <label className="block text-sm text-gray-300 mb-2">Trading Experience</label>
                <select value={form.trading_experience} onChange={e => setForm({ ...form, trading_experience: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-white focus:border-amber-500 focus:outline-none">
                  <option value="" className="text-gray-900">Select...</option>
                  <option value="beginner" className="text-gray-900">Beginner (0-1 years)</option>
                  <option value="intermediate" className="text-gray-900">Intermediate (1-3 years)</option>
                  <option value="advanced" className="text-gray-900">Advanced (3-5 years)</option>
                  <option value="professional" className="text-gray-900">Professional (5+ years)</option>
                </select>
              </div>
              <div>
                <label className="block text-sm text-gray-300 mb-2">Preferred Markets</label>
                <input type="text" value={form.preferred_markets} onChange={e => setForm({ ...form, preferred_markets: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-white placeholder-gray-600 focus:border-amber-500 focus:outline-none"
                  placeholder="e.g., Oil, Gold, Natural Gas, Wheat" />
              </div>
              <div>
                <label className="block text-sm text-gray-300 mb-2">Why do you want to join FTH?</label>
                <textarea value={form.motivation} onChange={e => setForm({ ...form, motivation: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-white placeholder-gray-600 focus:border-amber-500 focus:outline-none"
                  rows={4} placeholder="Tell us about your trading goals and what excites you about FTH..." />
              </div>
              <div>
                <label className="block text-sm text-gray-300 mb-2">How did you hear about us?</label>
                <select value={form.referral_source} onChange={e => setForm({ ...form, referral_source: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-white focus:border-amber-500 focus:outline-none">
                  <option value="" className="text-gray-900">Select...</option>
                  <option value="social_media" className="text-gray-900">Social Media</option>
                  <option value="search" className="text-gray-900">Google / Search</option>
                  <option value="friend" className="text-gray-900">Friend / Referral</option>
                  <option value="youtube" className="text-gray-900">YouTube</option>
                  <option value="discord" className="text-gray-900">Discord / Community</option>
                  <option value="other" className="text-gray-900">Other</option>
                </select>
              </div>
            </div>

            {/* Summary */}
            {selectedProg && (
              <div className="mt-8 p-4 rounded-xl border border-white/10 bg-white/5">
                <h4 className="text-sm text-gray-400 mb-2">Application Summary</h4>
                <div className="flex items-center justify-between text-white">
                  <div>
                    <div className="font-bold">{selectedProg.name}</div>
                    <div className="text-sm text-gray-400">{fmt(selectedProg.capital)} account · {selectedProg.trader_profit_pct}/{selectedProg.firm_profit_pct} split</div>
                  </div>
                  <div className="text-right">
                    <div className="text-amber-400 font-bold text-lg">{fmt(selectedProg.eval_fee)}</div>
                    <div className="text-xs text-gray-500">Evaluation Fee</div>
                  </div>
                </div>
              </div>
            )}

            {error && (
              <div className="mt-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">{error}</div>
            )}

            <div className="flex justify-between mt-8">
              <button type="button" onClick={() => setStep(2)} className="px-6 py-3 text-gray-400 hover:text-white">
                Back
              </button>
              <button type="submit" disabled={submitting}
                className="flex items-center gap-2 px-8 py-3 bg-amber-600 text-white rounded-lg hover:bg-amber-700 disabled:opacity-50 font-semibold">
                {submitting ? 'Submitting...' : 'Submit Application'} <Zap className="w-4 h-4" />
              </button>
            </div>
          </form>
        )}

        {/* Trust Badges */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-16 pt-8 border-t border-white/10">
          <div className="text-center">
            <Shield className="w-6 h-6 text-amber-500 mx-auto mb-2" />
            <div className="text-xs text-gray-400">Real Capital</div>
          </div>
          <div className="text-center">
            <TrendingUp className="w-6 h-6 text-amber-500 mx-auto mb-2" />
            <div className="text-xs text-gray-400">Instant Payouts</div>
          </div>
          <div className="text-center">
            <Users className="w-6 h-6 text-amber-500 mx-auto mb-2" />
            <div className="text-xs text-gray-400">250+ Traders</div>
          </div>
          <div className="text-center">
            <DollarSign className="w-6 h-6 text-amber-500 mx-auto mb-2" />
            <div className="text-xs text-gray-400">$1M+ Paid Out</div>
          </div>
        </div>
      </div>
    </div>
  )
}
