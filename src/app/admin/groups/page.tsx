import { prisma } from '@/lib/prisma'
import TopHeader from '@/components/layout/TopHeader'
import GroupsClient from './GroupsClient'

export default async function GroupsPage() {
  const [groups, coaches] = await Promise.all([
    prisma.trainingGroup.findMany({
      include: {
        coach: { select: { id: true, name: true } },
        _count: { select: { students: true } },
        schedules: true,
        paymentPlan: true,
      },
      orderBy: { groupName: 'asc' },
    }),
    prisma.user.findMany({ where: { role: { in: ['COACH', 'ADMIN'] } }, orderBy: { name: 'asc' } }),
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
