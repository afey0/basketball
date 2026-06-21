import { prisma } from '@/lib/prisma'
import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import TopHeader from '@/components/layout/TopHeader'
import DashboardClient from './DashboardClient'
import StaffDashboardClient from './StaffDashboardClient'

export default async function AdminDashboard() {
  const session = await auth()
  if (!session) redirect('/auth/login')

  const user = session.user as any
  const role = user?.role

  if (role === 'COACH') {
    // 1. Fetch staff profile (or create a default one on the fly if not found)
    let staffProfile = await prisma.staff.findUnique({
      where: { userId: parseInt(user.id) },
      include: { user: true }
    })

    if (!staffProfile) {
      staffProfile = await prisma.staff.create({
        data: {
          userId: parseInt(user.id),
          staffType: 'COACH',
          biography: 'No biography set.',
          salary: 0,
        },
        include: { user: true }
      })
    }

    // 2. Fetch coached groups
    const coachedGroups = await prisma.trainingGroup.findMany({
      where: { coachId: parseInt(user.id) },
      include: {
        _count: { select: { students: true } },
        schedules: true,
      },
      orderBy: { groupName: 'asc' },
    })

    const groupIds = coachedGroups.map(g => g.id)

    // 3. Fetch recent attendance marked by this user or for these groups
    const recentAttendance = await prisma.attendance.findMany({
      where: {
        trainingGroupId: { in: groupIds },
      },
      include: {
        student: { select: { firstName: true, lastName: true } },
        trainingGroup: { select: { groupName: true } }
      },
      orderBy: { date: 'desc' },
      take: 10,
    })

    // 4. Fetch salary payments
    const salaryPayments = await prisma.staffPayment.findMany({
      where: { staffId: staffProfile.id },
      orderBy: { paymentMonth: 'desc' },
    })

    return (
      <>
        <TopHeader title="Staff Dashboard" subtitle={`Welcome back, ${user.name?.split(' ')[0]} 👋`} />
        <div className="page-content">
          <StaffDashboardClient
            staff={staffProfile}
            groups={coachedGroups}
            recentAttendance={recentAttendance}
            payments={salaryPayments}
          />
        </div>
      </>
    )
  }

  // Fetch all stats in parallel for Admin / Owner
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
