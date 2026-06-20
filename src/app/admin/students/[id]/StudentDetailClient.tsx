'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Edit, Mail, Phone, Calendar, CreditCard, CheckSquare, User, AlertCircle, FileText } from 'lucide-react'
import { formatDate, formatCurrency, formatMonth, calculateAge, getStatusColor } from '@/lib/utils'
import { StudentModal } from '../StudentsClient'

interface Props {
  student: any
  groups: any[]
  parents: any[]
}

export default function StudentDetailClient({ student: initial, groups, parents }: Props) {
  const [student, setStudent] = useState(initial)
  const [tab, setTab] = useState<'overview' | 'attendance' | 'payments'>('overview')
  const [showEdit, setShowEdit] = useState(false)

  const attendanceRate = student.attendance?.length > 0
    ? Math.round((student.attendance.filter((a: any) => a.status === 'PRESENT').length / student.attendance.length) * 100)
    : 0

  const totalOwed = (student.payments || [])
    .filter((p: any) => ['UNPAID', 'OVERDUE'].includes(p.status))
    .reduce((sum: number, p: any) => sum + p.amount, 0)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* Profile Header */}
      <div className="card" style={{ display: 'flex', gap: '1.5rem', alignItems: 'flex-start' }}>
        {student.profilePhoto ? (
          <img 
            src={student.profilePhoto} 
            alt={`${student.firstName} ${student.lastName}`}
            className="avatar avatar-xl" 
            style={{ objectFit: 'cover' }} 
          />
        ) : (
          <div className="avatar avatar-xl" style={{
            background: student.gender === 'FEMALE'
              ? 'linear-gradient(135deg, #ec4899, #f43f5e)'
              : 'linear-gradient(135deg, var(--brand), #6366f1)',
          }}>
            {student.firstName[0]}{student.lastName[0]}
          </div>
        )}
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <h2 style={{ fontWeight: 800, fontSize: '1.5rem', margin: 0 }}>
                {student.firstName} {student.lastName}
                {student.jerseyNumber && <span style={{ fontSize: '1rem', color: 'var(--brand)', marginLeft: '0.5rem' }}>#{student.jerseyNumber}</span>}
              </h2>
              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem', flexWrap: 'wrap' }}>
                <span className={`badge ${student.status === 'ACTIVE' ? 'badge-green' : 'badge-gray'}`}>{student.status}</span>
                <span className="badge badge-purple">{student.ageGroup}</span>
                <span className="badge badge-blue">{student.gender}</span>
              </div>
            </div>
            <button className="btn-secondary" onClick={() => setShowEdit(true)}>
              <Edit size={14} /> Edit Profile
            </button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '1rem', marginTop: '1rem' }}>
            <div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Age</div>
              <div style={{ fontWeight: 600 }}>{calculateAge(student.dateOfBirth)} years</div>
            </div>
            <div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Date of Birth</div>
              <div style={{ fontWeight: 600 }}>{formatDate(student.dateOfBirth)}</div>
            </div>
            <div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Training Group</div>
              <div style={{ fontWeight: 600 }}>{student.trainingGroup?.groupName || '—'}</div>
            </div>
            <div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Enrolled</div>
              <div style={{ fontWeight: 600 }}>{formatDate(student.enrollmentDate)}</div>
            </div>
            <div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Attendance Rate</div>
              <div style={{ fontWeight: 700, color: attendanceRate >= 75 ? '#166534' : '#b91c1c' }}>{attendanceRate}%</div>
            </div>
            <div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Outstanding</div>
              <div style={{ fontWeight: 700, color: totalOwed > 0 ? '#b91c1c' : '#166534' }}>
                {totalOwed > 0 ? formatCurrency(totalOwed) : 'Paid up ✓'}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="tab-nav" style={{ width: 'fit-content' }}>
        {[['overview', 'Overview'], ['attendance', 'Attendance'], ['payments', 'Payments']].map(([t, l]) => (
          <button key={t} className={`tab-btn ${tab === t ? 'active' : ''}`} onClick={() => setTab(t as any)}>{l}</button>
        ))}
      </div>

      {/* Tab Content */}
      {tab === 'overview' && (
        <div className="grid-2">
          {/* Parent Info */}
          <div className="card">
            <h3 style={{ fontWeight: 700, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <User size={16} style={{ color: 'var(--brand)' }} /> Parent / Guardian
            </h3>
            {student.parent ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div className="avatar">{student.parent.name?.[0]}</div>
                  <div>
                    <div style={{ fontWeight: 600 }}>{student.parent.name}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Parent</div>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                  <Mail size={14} /> {student.parent.email}
                </div>
                {student.parent.phone && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                    <Phone size={14} /> {student.parent.phone}
                  </div>
                )}
              </div>
            ) : (
              <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>No parent linked</p>
            )}
          </div>

          {/* Group & Schedule */}
          <div className="card">
            <h3 style={{ fontWeight: 700, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Calendar size={16} style={{ color: 'var(--brand)' }} /> Training Schedule
            </h3>
            {student.trainingGroup ? (
              <>
                <div style={{ marginBottom: '0.875rem' }}>
                  <div style={{ fontWeight: 600 }}>{student.trainingGroup.groupName}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    Coach: {student.trainingGroup.coach?.name || 'Unassigned'}
                  </div>
                </div>
                {student.trainingGroup.schedules?.map((s: any) => (
                  <div key={s.id} style={{
                    display: 'flex', justifyContent: 'space-between',
                    padding: '0.5rem 0.75rem', background: 'var(--brand-light)',
                    borderRadius: 6, marginBottom: '0.375rem',
                  }}>
                    <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>{s.dayOfWeek}</span>
                    <span style={{ fontSize: '0.8rem', color: 'var(--brand)' }}>{s.startTime} – {s.endTime}</span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{s.location}</span>
                  </div>
                ))}
              </>
            ) : <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>No group assigned</p>}
          </div>

          {/* Medical Notes */}
          {student.medicalNotes && (
            <div className="card alert alert-orange" style={{ gridColumn: '1 / -1' }}>
              <AlertCircle size={16} style={{ flexShrink: 0 }} />
              <div>
                <div style={{ fontWeight: 700, marginBottom: '0.25rem' }}>Medical Notes</div>
                <div style={{ fontSize: '0.875rem' }}>{student.medicalNotes}</div>
              </div>
            </div>
          )}
        </div>
      )}

      {tab === 'attendance' && (
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3 style={{ fontWeight: 700 }}>Attendance History ({student.attendance?.length || 0} records)</h3>
            <div style={{ display: 'flex', gap: '0.5rem', fontSize: '0.75rem' }}>
              {[['present','#166534','PRESENT'],['absent','#b91c1c','ABSENT'],['late','#854d0e','LATE'],['excused','#1e40af','EXCUSED']].map(([cls, col, lbl]) => (
                <span key={cls} style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: col, display: 'inline-block' }} />
                  {lbl}
                </span>
              ))}
            </div>
          </div>
          <table className="data-table">
            <thead>
              <tr><th>Date</th><th>Status</th><th>Notes</th></tr>
            </thead>
            <tbody>
              {student.attendance?.map((a: any) => (
                <tr key={a.id}>
                  <td>{formatDate(a.date)}</td>
                  <td>
                    <span className={`badge ${a.status==='PRESENT'?'badge-green':a.status==='ABSENT'?'badge-red':a.status==='LATE'?'badge-yellow':'badge-blue'}`}>
                      {a.status}
                    </span>
                  </td>
                  <td style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>{a.notes || '—'}</td>
                </tr>
              ))}
              {(!student.attendance || student.attendance.length === 0) && (
                <tr><td colSpan={3} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem' }}>No attendance records</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'payments' && (
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem', alignItems: 'center' }}>
            <h3 style={{ fontWeight: 700 }}>Payment History</h3>
            {totalOwed > 0 && (
              <div className="alert alert-red" style={{ padding: '0.5rem 0.875rem', margin: 0 }}>
                <AlertCircle size={14} />
                Outstanding: {formatCurrency(totalOwed)}
              </div>
            )}
          </div>
          <table className="data-table">
            <thead>
              <tr><th>Month</th><th>Amount</th><th>Due Date</th><th>Paid Date</th><th>Method</th><th>Status</th><th>Receipt</th></tr>
            </thead>
            <tbody>
              {student.payments?.map((p: any) => (
                <tr key={p.id}>
                  <td style={{ fontWeight: 600 }}>{formatMonth(p.paymentMonth)}</td>
                  <td>{formatCurrency(p.amount)}</td>
                  <td>{formatDate(p.dueDate)}</td>
                  <td>{p.paymentDate ? formatDate(p.paymentDate) : '—'}</td>
                  <td style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>{p.paymentMethod || '—'}</td>
                  <td>
                    <span className={`badge ${p.status==='PAID'?'badge-green':p.status==='OVERDUE'?'badge-red':p.status==='PARTIAL'?'badge-orange':'badge-yellow'}`}>
                      {p.status}
                    </span>
                  </td>
                  <td style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    <div>{p.receiptNumber || '—'}</div>
                    {p.slipUrl && (
                      <a 
                        href={p.slipUrl} 
                        target="_blank" 
                        rel="noreferrer" 
                        style={{ color: 'var(--brand)', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '0.25rem', marginTop: '0.25rem' }}
                      >
                        <FileText size={10} /> View Slip
                      </a>
                    )}
                  </td>
                </tr>
              ))}
              {(!student.payments || student.payments.length === 0) && (
                <tr><td colSpan={7} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem' }}>No payment records</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {showEdit && (
        <StudentModal
          groups={groups}
          parents={parents}
          student={student}
          onClose={() => setShowEdit(false)}
          onSave={(updated: any) => {
            setStudent(updated)
            setShowEdit(false)
          }}
        />
      )}
    </div>
  )
}
