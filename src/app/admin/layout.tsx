import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import AdminSidebar from '@/components/layout/AdminSidebar'
import { AdminUserProvider } from '@/components/layout/AdminUserContext'
import SessionProvider from '@/components/providers/SessionProvider'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()
  if (!session) redirect('/auth/login')

  const user = session.user as any

  return (
    <SessionProvider session={session}>
      <AdminUserProvider
        userName={user?.name || 'Admin'}
        userRole={user?.role || 'ADMIN'}
      >
        <div className="admin-layout">
          <AdminSidebar />
          <div className="main-content">
            {children}
          </div>
        </div>
      </AdminUserProvider>
    </SessionProvider>
  )
}
