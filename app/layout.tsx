import './globals.css'
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'FTH Trading - Commodity Trading Platform',
  description: 'AI-Native Sales + Credit + Distribution Intelligence Infrastructure',
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const inner = (
    <html lang="en">
      <body className={inter.className}>
        <div className="min-h-screen bg-cream">
          {children}
        </div>
      </body>
    </html>
  )

  // Only wrap with ClerkProvider when keys are configured
  if (process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY) {
    const { ClerkProvider } = await import('@clerk/nextjs')
    return <ClerkProvider>{inner}</ClerkProvider>
  }

  return inner
}
