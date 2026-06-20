import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import { formatCurrency, formatMonth } from '@/lib/utils'
import Link from 'next/link'

export default async function PortalDashboard() {
  const session = await auth()
  if (!session) redirect('/auth/login')
  const userId = parseInt((session.user as any).id)
  const now = new Date()
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}`
  const todayDow = ['SUN','MON','TUE','WED','THU','FRI','SAT'][now.getDay()]

  const children = await prisma.student.findMany({
    where: { parentId: userId, status: { not: 'DELETED_BY_PARENT' } },
    include: {
      trainingGroup: { include: { schedules: true, coach: { select: { name: true } }, paymentPlan: true } },
      payments: { where: { paymentMonth: currentMonth }, take: 1 },
      attendance: {
        where: {
          date: {
            gte: new Date(now.getFullYear(), now.getMonth(), 1),
            lte: new Date(now.getFullYear(), now.getMonth()+1, 0),
          }
        }
      }
    },
  })

  return (
    <div>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontWeight: 900, fontSize: '1.75rem', margin: 0 }}>
          Welcome back, <span className="gradient-text">{session.user?.name?.split(' ')[0]}</span> 👋
        </h1>
        <p style={{ color: 'var(--text-muted)', marginTop: '0.375rem' }}>Here's your children's training overview for {formatMonth(currentMonth)}</p>
      </div>

      {children.map(child => {
        const payment = child.payments[0]
        const totalSessions = child.attendance.length
        const presentSessions = child.attendance.filter(a => a.status === 'PRESENT').length
        const attendanceRate = totalSessions > 0 ? Math.round((presentSessions/totalSessions)*100) : 0
        const nextSession = child.trainingGroup?.schedules.find(s => s.dayOfWeek === todayDow) ||
          child.trainingGroup?.schedules[0]

        return (
          <div key={child.id} style={{ marginBottom: '1.5rem' }}>
            {/* Child Header */}
            <div className="card" style={{
              background: 'linear-gradient(135deg, var(--brand-light), rgba(99,102,241,0.05))',
              borderColor: 'var(--border)',
              display: 'flex', alignItems: 'center', gap: '1.5rem', marginBottom: '1rem'
            }}>
              <div className="avatar avatar-lg" style={{ background: 'linear-gradient(135deg, var(--brand), #6366f1)', flexShrink: 0 }}>
                {child.firstName[0]}{child.lastName[0]}
              </div>
              <div style={{ flex: 1 }}>
                <h2 style={{ fontWeight: 800, fontSize: '1.375rem', margin: 0 }}>
                  {child.firstName} {child.lastName}
                  {child.jerseyNumber && <span style={{ fontSize: '1rem', color: 'var(--brand)', marginLeft: '0.5rem' }}>#{child.jerseyNumber}</span>}
                </h2>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginTop: '0.25rem' }}>
                  {child.trainingGroup?.groupName || 'No group'} · {child.ageGroup} · Coach: {child.trainingGroup?.coach?.name || 'TBD'}
                </div>
                <span className={`badge ${child.status==='ACTIVE'?'badge-green':'badge-gray'}`} style={{ marginTop: '0.5rem' }}>{child.status}</span>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="grid-4">
              <div className="stat-card">
                <div className="stat-card-label">This Month Payment</div>
                <div className="stat-card-value" style={{ fontSize: '1.1rem', color: payment?.status === 'PAID' ? '#166534' : '#b91c1c' }}>
                  {payment?.status === 'PAID' ? '✅ Paid' : payment ? '🔴 Unpaid' : '—'}
                </div>
                {payment && <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{formatCurrency(payment.amount)}</div>}
              </div>
              <div className="stat-card">
                <div className="stat-card-label">Attendance Rate</div>
                <div className="stat-card-value" style={{ fontSize: '1.5rem', color: attendanceRate >= 75 ? '#166534' : '#b91c1c' }}>{attendanceRate}%</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{presentSessions}/{totalSessions} sessions</div>
              </div>
              <div className="stat-card">
                <div className="stat-card-label">Monthly Fee</div>
                <div className="stat-card-value" style={{ fontSize: '1.1rem', color: 'var(--brand)' }}>
                  {child.trainingGroup?.paymentPlan ? formatCurrency(child.trainingGroup.paymentPlan.monthlyFee) : '—'}
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-card-label">Next Session</div>
                <div style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--brand)' }}>
                  {nextSession ? `${nextSession.dayOfWeek} ${nextSession.startTime}` : 'No session'}
                </div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{nextSession?.location}</div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.75rem', flexWrap: 'wrap' }}>
              <Link href={`/portal/payments?studentId=${child.id}`} className="btn-secondary" style={{ fontSize: '0.8rem' }}>💰 View Payments</Link>
              <Link href={`/portal/attendance?studentId=${child.id}`} className="btn-secondary" style={{ fontSize: '0.8rem' }}>✅ View Attendance</Link>
              <Link href={`/portal/schedule?studentId=${child.id}`} className="btn-secondary" style={{ fontSize: '0.8rem' }}>📅 View Schedule</Link>
              <Link href={`/portal/profile?studentId=${child.id}`} className="btn-secondary" style={{ fontSize: '0.8rem' }}>👦 Profile</Link>
            </div>
          </div>
        )
      })}

      {children.length === 0 && (
        <div className="empty-state">
          <div className="empty-state-icon">👦</div>
          <div className="empty-state-title">No children linked to your account</div>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginTop: '0.5rem' }}>Contact the admin to link your children's profiles.</p>
        </div>
      )}
    </div>
  )
}
