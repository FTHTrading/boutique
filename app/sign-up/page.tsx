'use client'

import Link from 'next/link'
import { Globe, UserPlus, ArrowRight, CheckCircle } from 'lucide-react'
import dynamic from 'next/dynamic'

const ClerkSignUp = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
  ? dynamic(() => import('@clerk/nextjs').then((m) => ({ default: m.SignUp })), { ssr: false })
  : null

export default function SignUpPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-stone-50 flex flex-col">
      {/* Top bar */}
      <div className="border-b border-gray-100 bg-white/80 backdrop-blur px-6 py-4 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-amber-800 rounded-lg flex items-center justify-center">
            <Globe size={16} className="text-white" />
          </div>
          <span className="font-bold text-gray-900">FTH Trading</span>
        </Link>
        <span className="text-sm text-gray-500">Team Portal</span>
      </div>

      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-14 h-14 bg-amber-800 rounded-2xl mb-4 shadow-lg shadow-amber-800/20">
              <UserPlus size={24} className="text-white" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Join the team</h1>
            <p className="text-gray-500 text-sm">Create your FTH Trading team account</p>
          </div>

          {/* Perks */}
          <div className="grid grid-cols-2 gap-3 mb-6">
            {[
              'Personal deal pipeline',
              'Commission tracking',
              'Client management',
              'Document signing',
              'Compliance dashboard',
              'Real-time alerts',
            ].map((perk) => (
              <div key={perk} className="flex items-center gap-2 bg-white/60 rounded-lg px-3 py-2 border border-gray-100">
                <CheckCircle size={13} className="text-green-500 shrink-0" />
                <span className="text-xs text-gray-600">{perk}</span>
              </div>
            ))}
          </div>

          {/* Auth component or fallback */}
          {ClerkSignUp ? (
            <div className="flex justify-center">
              <ClerkSignUp
                routing="hash"
                afterSignUpUrl="/dashboard/my-hub"
                redirectUrl="/dashboard/my-hub"
              />
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8">
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
                <p className="text-sm text-amber-800 font-medium mb-1">Registration not yet configured</p>
                <p className="text-xs text-amber-700">
                  Add your Clerk keys to enable team registration. Contact your admin to get access.
                </p>
              </div>

              <Link
                href="/sign-in"
                className="flex items-center justify-between w-full bg-gray-900 text-white rounded-xl px-5 py-3.5 text-sm font-medium hover:bg-gray-800 transition-colors"
              >
                <span>Back to Sign In</span>
                <ArrowRight size={16} />
              </Link>

              <div className="mt-6 pt-5 border-t border-gray-100 text-center">
                <p className="text-xs text-gray-400">
                  Already have an account?{' '}
                  <Link href="/sign-in" className="text-amber-700 font-medium hover:underline">
                    Sign in here
                  </Link>
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="text-center pb-6 text-xs text-gray-400">
        © 2026 FTH Trading. All rights reserved.{' '}
        <Link href="/" className="hover:text-gray-600">Back to site</Link>
      </div>
    </div>
  )
}
