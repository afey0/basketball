import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import SessionProvider from '@/components/providers/SessionProvider'
import PortalHeader from '@/components/portal/PortalHeader'
import PwaInstallBanner from '@/components/portal/PwaInstallBanner'
import { prisma } from '@/lib/prisma'

export default async function PortalLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()
  if (!session) redirect('/auth/login')
  const user = session.user as any
  const role = user?.role
  if (role !== 'PARENT') redirect('/admin')

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
      <div className={`theme-${theme}`} style={{ minHeight: '100vh', background: 'var(--background)' }}>
        <PortalHeader user={user} clubName={clubName} clubLogo={clubLogo} />
        <main style={{ maxWidth: 960, margin: '0 auto', padding: '1.5rem 2rem' }}>
          {children}
        </main>
        <PwaInstallBanner />
      </div>
    </SessionProvider>
  )
}

