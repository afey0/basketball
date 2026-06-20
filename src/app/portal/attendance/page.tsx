import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'

export default async function PortalAttendancePage(props: { searchParams: Promise<{ studentId?: string }> }) {
  const session = await auth()
  if (!session) redirect('/auth/login')
  const userId = parseInt((session.user as any).id)
  const searchParams = await props.searchParams
  const studentId = searchParams.studentId ? parseInt(searchParams.studentId) : undefined
  const now = new Date()

  const children = await prisma.student.findMany({
    where: { 
      parentId: userId,
      ...(studentId ? { id: studentId } : {}),
      status: { not: 'DELETED_BY_PARENT' }
    },
    include: {
      attendance: { orderBy: { date: 'desc' }, take: 60 },
      trainingGroup: { select: { groupName: true } }
    },
  })

  function fmtDate(d: any) { return new Date(d).toLocaleDateString('en-GB', { day:'2-digit', month:'short', year:'numeric' }) }

  return (
    <div>
      <h1 style={{ fontWeight: 900, fontSize: '1.5rem', marginBottom: '1.5rem' }}>✅ Attendance History</h1>
      {children.map(child => {
        const present = child.attendance.filter(a => a.status === 'PRESENT').length
        const rate = child.attendance.length > 0 ? Math.round((present/child.attendance.length)*100) : 0
        return (
          <div key={child.id} style={{ marginBottom: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.875rem' }}>
              <h2 style={{ fontWeight: 700, fontSize: '1.125rem', margin: 0 }}>
                {child.firstName} {child.lastName} · <span style={{ color: rate >= 75 ? '#4ade80' : '#f87171' }}>{rate}% attendance</span>
              </h2>
              <div style={{ fontSize: '0.8rem', color: '#8B8BA7' }}>{present}/{child.attendance.length} sessions attended</div>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.75rem', flexWrap: 'wrap' }}>
              {[['badge-green','PRESENT',present],['badge-red','ABSENT',child.attendance.filter(a=>a.status==='ABSENT').length],
                ['badge-yellow','LATE',child.attendance.filter(a=>a.status==='LATE').length],
                ['badge-blue','EXCUSED',child.attendance.filter(a=>a.status==='EXCUSED').length]].map(([cls,lbl,cnt]) => (
                <span key={lbl as string} className={`badge ${cls}`}>{lbl as string}: {cnt as number}</span>
              ))}
            </div>
            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
              <table className="data-table">
                <thead><tr><th>Date</th><th>Status</th><th>Notes</th></tr></thead>
                <tbody>
                  {child.attendance.map(a => (
                    <tr key={a.id}>
                      <td style={{ fontWeight: 600 }}>{fmtDate(a.date)}</td>
                      <td><span className={`badge ${a.status==='PRESENT'?'badge-green':a.status==='ABSENT'?'badge-red':a.status==='LATE'?'badge-yellow':'badge-blue'}`}>{a.status}</span></td>
                      <td style={{ color: '#8B8BA7', fontSize: '0.8rem' }}>{a.notes || '—'}</td>
                    </tr>
                  ))}
                  {child.attendance.length === 0 && <tr><td colSpan={3} style={{ textAlign:'center', color:'#8B8BA7', padding:'2rem' }}>No records</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        )
      })}
    </div>
  )
}
