import { prisma } from '@/lib/prisma'
import TopHeader from '@/components/layout/TopHeader'
import ScheduleClient from './ScheduleClient'

export default async function SchedulePage() {
  const [schedules, groups] = await Promise.all([
    prisma.schedule.findMany({
      include: {
        trainingGroup: { select: { groupName: true, ageGroup: true, coach: { select: { name: true } } } }
      },
      orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }],
    }),
    prisma.trainingGroup.findMany({ orderBy: { groupName: 'asc' } }),
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
