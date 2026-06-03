import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'

export default async function PortalProfilePage() {
  const session = await auth()
  if (!session) redirect('/auth/login')
  const userId = parseInt((session.user as any).id)

  const children = await prisma.student.findMany({
    where: { parentId: userId },
    include: {
      trainingGroup: { include: { coach: { select: { name: true, email: true } }, schedules: true } }
    }
  })

  function fmtDate(d: any) { return new Date(d).toLocaleDateString('en-GB', { day:'2-digit', month:'long', year:'numeric' }) }
  function calcAge(dob: any) { const d = new Date(dob); const t = new Date(); let age = t.getFullYear()-d.getFullYear(); if(t.getMonth()<d.getMonth()||(t.getMonth()===d.getMonth()&&t.getDate()<d.getDate())) age--; return age }

  return (
    <div>
      <h1 style={{ fontWeight: 900, fontSize: '1.5rem', marginBottom: '1.5rem' }}>👦 Child Profiles</h1>
      {children.map(child => (
        <div key={child.id} className="card" style={{ marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', gap: '1.25rem', alignItems: 'flex-start' }}>
            <div style={{
              width: 72, height: 72, borderRadius: 18, flexShrink: 0,
              background: child.gender === 'FEMALE' ? 'linear-gradient(135deg,#ec4899,#f43f5e)' : 'linear-gradient(135deg,var(--brand),#6366f1)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontWeight: 800, fontSize: '1.5rem', color: 'white',
            }}>{child.firstName[0]}{child.lastName[0]}</div>
            <div style={{ flex: 1 }}>
              <h2 style={{ fontWeight: 800, fontSize: '1.25rem', margin: 0 }}>
                {child.firstName} {child.lastName}
                {child.jerseyNumber && <span style={{ fontSize: '1rem', color: 'var(--brand)', marginLeft: '0.5rem' }}>#{child.jerseyNumber}</span>}
              </h2>
              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem', flexWrap: 'wrap' }}>
                <span className={`badge ${child.status==='ACTIVE'?'badge-green':'badge-gray'}`}>{child.status}</span>
                <span className="badge badge-purple">{child.ageGroup}</span>
                <span className="badge badge-blue">{child.gender}</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px,1fr))', gap: '0.875rem', marginTop: '1rem' }}>
                {[['Date of Birth', fmtDate(child.dateOfBirth)],['Age', `${calcAge(child.dateOfBirth)} years`],
                  ['Training Group', child.trainingGroup?.groupName || '—'],
                  ['Coach', child.trainingGroup?.coach?.name || '—'],
                  ['Enrolled', fmtDate(child.enrollmentDate)]
                ].map(([label, value]) => (
                  <div key={label as string}>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</div>
                    <div style={{ fontWeight: 600, fontSize: '0.875rem', marginTop: '0.2rem' }}>{value}</div>
                  </div>
                ))}
              </div>
              {child.medicalNotes && (
                <div className="alert alert-orange" style={{ marginTop: '1rem' }}>
                  ⚠️ Medical Notes: {child.medicalNotes}
                </div>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
