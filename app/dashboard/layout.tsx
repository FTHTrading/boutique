import { redirect } from 'next/navigation'
import { DashboardNav } from '@/components/DashboardNav'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Auth guard — only active when Clerk is configured
  if (process.env.CLERK_SECRET_KEY && process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY) {
    try {
      const { auth } = await import('@clerk/nextjs/server')
      const session = auth()
      if (!(session as any).userId) redirect('/sign-in')
    } catch {
      // Clerk not fully configured — allow access
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardNav />
      <div className="md:pl-56 pt-14 md:pt-0">
        <main className="min-h-screen">
          {children}
        </main>
      </div>
    </div>
  )
}
