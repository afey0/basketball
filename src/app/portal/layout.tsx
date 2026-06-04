import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import SessionProvider from '@/components/providers/SessionProvider'
import PortalHeader from '@/components/portal/PortalHeader'
import PwaInstallBanner from '@/components/portal/PwaInstallBanner'

export default async function PortalLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()
  if (!session) redirect('/auth/login')
  const role = (session.user as any)?.role
  if (role !== 'PARENT') redirect('/admin')

  return (
    <SessionProvider session={session}>
      <div style={{ minHeight: '100vh', background: 'var(--background)' }}>
        <PortalHeader user={session.user as any} />
        <main style={{ maxWidth: 960, margin: '0 auto', padding: '1.5rem 2rem' }}>
          {children}
        </main>
        <PwaInstallBanner />
      </div>
    </SessionProvider>
  )
}

