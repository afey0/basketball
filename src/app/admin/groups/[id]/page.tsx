import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import TopHeader from '@/components/layout/TopHeader'
import Link from 'next/link'
import { ChevronLeft, Users } from 'lucide-react'
import { formatDate, calculateAge } from '@/lib/utils'

export default async function GroupDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: rawId } = await params
  const id = parseInt(rawId)

  const group = await prisma.trainingGroup.findUnique({
    where: { id },
    include: {
      coach: { select: { name: true, email: true } },
      students: {
        where: { status: 'ACTIVE' },
        include: { parent: { select: { name: true } } },
        orderBy: { firstName: 'asc' },
      },
      schedules: { where: { isActive: true } },
      paymentPlan: true,
      _count: { select: { students: true } },
    },
  })

  if (!group) notFound()

  const now = new Date()
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  const DAY_LABELS: Record<string, string> = { MON:'Monday',TUE:'Tuesday',WED:'Wednesday',THU:'Thursday',FRI:'Friday',SAT:'Saturday',SUN:'Sunday' }

  return (
    <>
      <TopHeader title={group.groupName} subtitle={`${group.ageGroup} · ${group._count.students} students`} />
      <div className="page-content">
        <div style={{ marginBottom: '1rem' }}>
          <Link href="/admin/groups" className="btn-ghost" style={{ padding: '0.375rem 0.75rem', fontSize: '0.8rem' }}>
            <ChevronLeft size={14} /> Back to Groups
          </Link>
        </div>

        <div className="grid-2">
          {/* Group Info */}
          <div className="card">
            <h3 style={{ fontWeight: 700, marginBottom: '1rem' }}>Group Details</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {[
                ['Age Group', group.ageGroup],
                ['Coach', group.coach?.name || 'Unassigned'],
                ['Coach Email', group.coach?.email || '—'],
                ['Capacity', `${group._count.students} / ${group.maxCapacity}`],
                ['Monthly Fee', group.paymentPlan ? `MVR ${group.paymentPlan.monthlyFee}` : 'Not set'],
              ].map(([label, value]) => (
                <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: '1px solid var(--border)' }}>
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>{label}</span>
                  <span style={{ fontWeight: 600, fontSize: '0.875rem' }}>{value}</span>
                </div>
              ))}
            </div>
            {group.description && (
              <p style={{ marginTop: '1rem', fontSize: '0.875rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>{group.description}</p>
            )}
          </div>

          {/* Training Schedules */}
          <div className="card">
            <h3 style={{ fontWeight: 700, marginBottom: '1rem' }}>Training Sessions</h3>
            {group.schedules.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>No sessions scheduled</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
                {group.schedules.map(s => (
                  <div key={s.id} style={{
                    padding: '0.75rem 1rem',
                    background: 'var(--brand-light)',
                    borderRadius: 10, border: '1px solid var(--border)',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  }}>
                    <div>
                      <div style={{ fontWeight: 700 }}>{DAY_LABELS[s.dayOfWeek] || s.dayOfWeek}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{s.location}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontWeight: 700, color: 'var(--brand)' }}>{s.startTime} – {s.endTime}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Students List */}
        <div className="card" style={{ marginTop: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
            <Users size={16} style={{ color: 'var(--brand)' }} />
            <h3 style={{ fontWeight: 700, margin: 0 }}>Enrolled Students ({group.students.length})</h3>
          </div>
          <table className="data-table">
            <thead>
              <tr><th>#</th><th>Student</th><th>Age</th><th>Jersey</th><th>Parent</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {group.students.map((s, i) => (
                <tr key={s.id}>
                  <td style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>{i + 1}</td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
                      <div className="avatar" style={{ width: 30, height: 30, fontSize: '0.7rem' }}>{s.firstName[0]}{s.lastName[0]}</div>
                      <span style={{ fontWeight: 600 }}>{s.firstName} {s.lastName}</span>
                    </div>
                  </td>
                  <td>{calculateAge(s.dateOfBirth)} yrs</td>
                  <td style={{ color: 'var(--brand)', fontWeight: 700 }}>{s.jerseyNumber ? `#${s.jerseyNumber}` : '—'}</td>
                  <td style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>{s.parent?.name || '—'}</td>
                  <td>
                    <Link href={`/admin/students/${s.id}`} className="btn-ghost" style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem' }}>
                      View Profile
                    </Link>
                  </td>
                </tr>
              ))}
              {group.students.length === 0 && (
                <tr><td colSpan={6} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem' }}>No active students in this group</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  )
}
