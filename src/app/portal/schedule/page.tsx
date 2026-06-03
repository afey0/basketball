import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'

export default async function PortalSchedulePage() {
  const session = await auth()
  if (!session) redirect('/auth/login')
  const userId = parseInt((session.user as any).id)
  const todayDow = ['SUN','MON','TUE','WED','THU','FRI','SAT'][new Date().getDay()]

  const children = await prisma.student.findMany({
    where: { parentId: userId },
    include: {
      trainingGroup: {
        include: {
          schedules: { where: { isActive: true }, orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }] },
          coach: { select: { name: true } }
        }
      }
    }
  })

  const DAY_ORDER: Record<string, number> = { MON:0,TUE:1,WED:2,THU:3,FRI:4,SAT:5,SUN:6 }
  const DAY_LABELS: Record<string, string> = { MON:'Monday',TUE:'Tuesday',WED:'Wednesday',THU:'Thursday',FRI:'Friday',SAT:'Saturday',SUN:'Sunday' }

  return (
    <div>
      <h1 style={{ fontWeight: 900, fontSize: '1.5rem', marginBottom: '1.5rem' }}>📅 Training Schedule</h1>
      {children.map(child => (
        <div key={child.id} style={{ marginBottom: '2rem' }}>
          <h2 style={{ fontWeight: 700, fontSize: '1.125rem', marginBottom: '0.875rem' }}>
            {child.firstName} {child.lastName} · {child.trainingGroup?.groupName || 'No group'}
          </h2>
          {!child.trainingGroup || !child.trainingGroup.schedules || child.trainingGroup.schedules.length === 0 ? (
            <p style={{ color: 'var(--text-muted)' }}>No sessions scheduled</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {[...(child.trainingGroup?.schedules || [])].sort((a,b) => (DAY_ORDER[a.dayOfWeek]||0) - (DAY_ORDER[b.dayOfWeek]||0)).map(s => (
                <div key={s.id} className="card" style={{
                  display: 'flex', alignItems: 'center', gap: '1.25rem',
                  borderColor: s.dayOfWeek === todayDow ? 'var(--brand)' : undefined,
                  background: s.dayOfWeek === todayDow ? 'var(--brand-light)' : undefined,
                  padding: '1rem 1.25rem'
                }}>
                  <div style={{ textAlign: 'center', minWidth: 70 }}>
                    <div style={{ fontSize: '0.65rem', textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.08em' }}>Day</div>
                    <div style={{ fontWeight: 800, fontSize: '1rem', color: s.dayOfWeek === todayDow ? 'var(--brand)' : 'var(--text)' }}>
                      {DAY_LABELS[s.dayOfWeek]?.slice(0,3)}
                    </div>
                    {s.dayOfWeek === todayDow && <span className="badge badge-purple" style={{ fontSize: '0.6rem', marginTop: '0.2rem' }}>TODAY</span>}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700 }}>{s.startTime} – {s.endTime}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>📍 {s.location}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Coach</div>
                    <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>{child.trainingGroup?.coach?.name || 'TBD'}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
