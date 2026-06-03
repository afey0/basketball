import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import ProfileClient from './ProfileClient'

export default async function PortalProfilePage() {
  const session = await auth()
  if (!session) redirect('/auth/login')
  const userId = parseInt((session.user as any).id)

  const children = await prisma.student.findMany({
    where: {
      parentId: userId,
      status: { not: 'DELETED_BY_PARENT' }
    },
    include: {
      trainingGroup: { include: { coach: { select: { name: true, email: true } }, schedules: true } }
    },
    orderBy: [{ firstName: 'asc' }, { lastName: 'asc' }]
  })

  return (
    <div>
      <h1 style={{ fontWeight: 900, fontSize: '1.5rem', marginBottom: '1.5rem' }}>👦 Child Profiles</h1>
      <ProfileClient initialChildren={children} />
    </div>
  )
}

