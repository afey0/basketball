import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import SuperAdminDashboard from './SuperAdminDashboard'

export default async function SuperAdminPage() {
  const session = await auth()
  if (!session || (session.user as any)?.role !== 'SUPERADMIN') {
    redirect('/super-admin/login')
  }

  // Fetch initial stats and clubs
  const [clubsCount, totalUsers, initialClubs] = await Promise.all([
    prisma.club.count(),
    prisma.user.count({ where: { role: { not: 'SUPERADMIN' } } }),
    prisma.club.findMany({
      include: {
        users: {
          where: { role: 'ADMIN' },
          select: { name: true, email: true },
        },
        _count: {
          select: {
            users: true,
            students: true,
            trainingGroups: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })
  ])

  const stats = {
    clubsCount,
    totalUsers,
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--background)' }}>
      <SuperAdminDashboard initialClubs={initialClubs} stats={stats} user={session.user as any} />
    </div>
  )
}
