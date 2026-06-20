import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import ProfileClient from './ProfileClient'

export default async function PortalProfilePage(props: { searchParams: Promise<{ studentId?: string }> }) {
  const session = await auth()
  if (!session) redirect('/auth/login')
  const userId = parseInt((session.user as any).id)
  const searchParams = await props.searchParams
  const studentId = searchParams.studentId ? parseInt(searchParams.studentId) : undefined

  const children = await prisma.student.findMany({
    where: {
      parentId: userId,
      ...(studentId ? { id: studentId } : {}),
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
      <ProfileClient key={studentId || 'all'} initialChildren={children} />
    </div>
  )
}

