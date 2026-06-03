import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import AdminSidebar from '@/components/layout/AdminSidebar'
import SessionProvider from '@/components/providers/SessionProvider'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()
  if (!session) redirect('/auth/login')

  return (
    <SessionProvider session={session}>
      <div className="admin-layout">
        <AdminSidebar />
        <div className="main-content">
          {children}
        </div>
      </div>
    </SessionProvider>
  )
}
