import { prisma } from '@/lib/prisma'
import TopHeader from '@/components/layout/TopHeader'
import AttendanceClient from './AttendanceClient'
import { auth } from '@/auth'
import { redirect } from 'next/navigation'

export default async function AttendancePage() {
  const session = await auth()
  if (!session) redirect('/auth/login')
  const clubId = parseInt((session.user as any).clubId)

  const groups = await prisma.trainingGroup.findMany({
    where: { clubId },
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
