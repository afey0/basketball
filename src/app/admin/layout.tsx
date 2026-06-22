import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import AdminSidebar from '@/components/layout/AdminSidebar'
import { AdminUserProvider } from '@/components/layout/AdminUserContext'
import SessionProvider from '@/components/providers/SessionProvider'
import { prisma } from '@/lib/prisma'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()
  if (!session) redirect('/auth/login')

  const user = session.user as any
  const role = user?.role

  if (role === 'SUPERADMIN') redirect('/super-admin')
  if (role === 'PARENT') redirect('/portal')

  const clubId = user?.clubId ? parseInt(user.clubId) : null
  let theme = 'default'
  let clubName = 'MBC CRM'
  let clubLogo = null

  if (clubId) {
    const settings = await prisma.clubSettings.findUnique({
      where: { clubId },
      select: { theme: true, clubName: true, clubLogo: true }
    })
    if (settings) {
      theme = settings.theme || 'default'
      clubName = settings.clubName || 'MBC CRM'
      clubLogo = settings.clubLogo || null
    }
  }

  return (
    <SessionProvider session={session}>
      <AdminUserProvider
        userName={user?.name || 'Admin'}
        userRole={user?.role || 'ADMIN'}
        clubName={clubName}
        clubLogo={clubLogo}
      >
        <div className={`admin-layout theme-${theme}`}>
          <AdminSidebar />
          <div className="main-content">
            {children}
          </div>
        </div>
      </AdminUserProvider>
    </SessionProvider>
  )
}
