import { prisma } from '@/lib/prisma'
import TopHeader from '@/components/layout/TopHeader'
import GroupsClient from './GroupsClient'
import { auth } from '@/auth'
import { redirect } from 'next/navigation'

export default async function GroupsPage() {
  const session = await auth()
  if (!session) redirect('/auth/login')
  const clubId = parseInt((session.user as any).clubId)

  const [groups, coaches] = await Promise.all([
    prisma.trainingGroup.findMany({
      where: { clubId },
      include: {
        coach: { select: { id: true, name: true } },
        _count: { select: { students: true } },
        schedules: true,
        paymentPlan: true,
      },
      orderBy: { groupName: 'asc' },
    }),
    prisma.user.findMany({ where: { role: { in: ['COACH', 'ADMIN'] }, clubId }, orderBy: { name: 'asc' } }),
  ])
  return (
    <>
      <TopHeader title="Training Groups" subtitle="Manage training groups and sessions" />
      <div className="page-content">
        <GroupsClient groups={groups} coaches={coaches} />
      </div>
    </>
  )
}
