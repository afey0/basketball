import { prisma } from '@/lib/prisma'
import TopHeader from '@/components/layout/TopHeader'
import ScheduleClient from './ScheduleClient'
import { auth } from '@/auth'
import { redirect } from 'next/navigation'

export default async function SchedulePage() {
  const session = await auth()
  if (!session) redirect('/auth/login')
  const clubId = parseInt((session.user as any).clubId)

  const [schedules, groups] = await Promise.all([
    prisma.schedule.findMany({
      where: {
        trainingGroup: { clubId }
      },
      include: {
        trainingGroup: { select: { groupName: true, ageGroup: true, coach: { select: { name: true } } } }
      },
      orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }],
    }),
    prisma.trainingGroup.findMany({
      where: { clubId },
      orderBy: { groupName: 'asc' }
    }),
  ])

  return (
    <>
      <TopHeader title="Schedule" subtitle="Weekly training session timetable" />
      <div className="page-content">
        <ScheduleClient schedules={schedules} groups={groups} />
      </div>
    </>
  )
}
