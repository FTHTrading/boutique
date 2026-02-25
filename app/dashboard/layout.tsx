import { auth } from '@clerk/nextjs'
import { redirect } from 'next/navigation'
import { DashboardNav } from '@/components/DashboardNav'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { userId } = auth()
  if (!userId) redirect('/sign-in')

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardNav />
      {/* Content area — offset by sidebar on desktop, add top padding on mobile */}
      <div className="md:pl-56 pt-14 md:pt-0">
        <main className="min-h-screen">
          {children}
        </main>
      </div>
    </div>
  )
}
