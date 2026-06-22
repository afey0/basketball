import { prisma } from '@/lib/prisma'
import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import TopHeader from '@/components/layout/TopHeader'
import UsersClient from './UsersClient'

export default async function UsersPage() {
  const session = await auth()
  if (!session) redirect('/auth/login')
  
  const userRole = (session.user as any)?.role
  if (userRole !== 'ADMIN' && userRole !== 'VIEWER') {
    redirect('/admin')
  }

  const clubId = parseInt((session.user as any).clubId)

  const users = await prisma.user.findMany({
    where: { clubId },
    orderBy: { name: 'asc' },
  })

  // Exclude passwords for safety before passing to client component
  const safeUsers = users.map(u => {
    const { password, ...safe } = u
    return safe
  })

  return (
    <>
      <TopHeader title="User Accounts" subtitle="Manage all system accounts: Admins, Coaches, and Parents" />
      <div className="page-content">
        <UsersClient initialUsers={safeUsers} currentUserId={parseInt((session.user as any).id)} />
      </div>
    </>
  )
}
