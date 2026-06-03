import { prisma } from '@/lib/prisma'
import { auth } from '@/auth'
import TopHeader from '@/components/layout/TopHeader'
import DashboardClient from './DashboardClient'

export default async function AdminDashboard() {
  const session = await auth()

  // Fetch all stats in parallel
  const now = new Date()
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  const lastMonth = `${now.getFullYear()}-${String(now.getMonth()).padStart(2, '0')}`

  const [
    totalStudents,
    totalGroups,
    currentMonthPayments,
    lastMonthPayments,
    overduePayments,
    recentAttendance,
    upcomingSchedules,
    revenueData,
    groupAttendance,
    flaggedStudents,
    pendingSlips,
  ] = await Promise.all([
    prisma.student.count({ where: { status: 'ACTIVE' } }),
    prisma.trainingGroup.count(),
    prisma.payment.aggregate({
      where: { paymentMonth: currentMonth, status: 'PAID' },
      _sum: { amount: true },
    }),
    prisma.payment.aggregate({
      where: { paymentMonth: lastMonth, status: 'PAID' },
      _sum: { amount: true },
    }),
    prisma.payment.findMany({
      where: { status: 'OVERDUE' },
      include: {
        student: { select: { firstName: true, lastName: true, trainingGroup: { select: { groupName: true } } } },
      },
      orderBy: { dueDate: 'asc' },
      take: 8,
    }),
    prisma.attendance.findMany({
      where: { date: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } },
      include: { student: { select: { firstName: true, lastName: true } }, trainingGroup: { select: { groupName: true } } },
      orderBy: { date: 'desc' },
      take: 10,
    }),
    prisma.schedule.findMany({
      where: { isActive: true },
      include: { trainingGroup: { select: { groupName: true, ageGroup: true } } },
    }),
    // Revenue for last 6 months
    Promise.all(Array.from({ length: 6 }, (_, i) => {
      const d = new Date()
      d.setMonth(d.getMonth() - (5 - i))
      const m = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
      return prisma.payment.aggregate({
        where: { paymentMonth: m, status: 'PAID' },
        _sum: { amount: true },
      }).then(r => ({ month: m, revenue: r._sum.amount || 0 }))
    })),
    // Attendance rate by group
    prisma.trainingGroup.findMany({
      include: {
        _count: { select: { attendance: true, students: true } },
      },
    }),
    // Unpaid this month
    prisma.payment.findMany({
      where: { paymentMonth: currentMonth, status: { in: ['UNPAID', 'OVERDUE'] } },
      include: {
        student: { select: { firstName: true, lastName: true, trainingGroup: { select: { groupName: true } } } },
      },
      take: 6,
    }),
    // Pending slips
    prisma.payment.findMany({
      where: { status: 'PENDING' },
      include: {
        student: { select: { firstName: true, lastName: true, parent: { select: { name: true } } } },
      },
      orderBy: { createdAt: 'desc' },
    }),
  ])

  // Payment collection rate
  const totalCurrentMonth = await prisma.payment.count({ where: { paymentMonth: currentMonth } })
  const paidCurrentMonth = await prisma.payment.count({ where: { paymentMonth: currentMonth, status: 'PAID' } })
  const collectionRate = totalCurrentMonth > 0 ? Math.round((paidCurrentMonth / totalCurrentMonth) * 100) : 0

  const stats = {
    totalStudents,
    totalGroups,
    currentRevenue: currentMonthPayments._sum.amount || 0,
    lastRevenue: lastMonthPayments._sum.amount || 0,
    collectionRate,
    overdueCount: overduePayments.length,
  }

  return (
    <>
      <TopHeader title="Dashboard" subtitle={`Welcome back, ${session?.user?.name?.split(' ')[0]} 👋`} />
      <div className="page-content">
        <DashboardClient
          stats={stats}
          revenueData={revenueData}
          groupAttendance={groupAttendance}
          flaggedStudents={[...overduePayments, ...flaggedStudents]}
          pendingSlips={pendingSlips}
          upcomingSchedules={upcomingSchedules}
          recentAttendance={recentAttendance}
          currentMonth={currentMonth}
        />
      </div>
    </>
  )
}
