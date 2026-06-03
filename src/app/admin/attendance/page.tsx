import { prisma } from '@/lib/prisma'
import TopHeader from '@/components/layout/TopHeader'
import AttendanceClient from './AttendanceClient'

export default async function AttendancePage() {
  const groups = await prisma.trainingGroup.findMany({
    include: {
      students: { where: { status: 'ACTIVE' }, orderBy: { firstName: 'asc' } },
      schedules: true,
    },
    orderBy: { groupName: 'asc' },
  })

  return (
    <>
      <TopHeader title="Attendance" subtitle="Mark and track training session attendance" />
      <div className="page-content">
        <AttendanceClient groups={groups} />
      </div>
    </>
  )
}
