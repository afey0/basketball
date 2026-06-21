'use client'

import { useState } from 'react'
import { Award, FileText, CheckCircle, Calendar, MapPin, Phone, Mail, User, ShieldAlert, Download, ExternalLink, Users, CreditCard } from 'lucide-react'
import { formatDate } from '@/lib/utils'
import { toast } from 'sonner'

interface Props {
  staff: any
  groups: any[]
  recentAttendance: any[]
  payments: any[]
}

export default function StaffDashboardClient({ staff, groups, recentAttendance, payments }: Props) {
  const { user, staffType, biography, salary, contractUrl, certificatesUrl, idCardUrl, passportUrl, policeReportUrl } = staff
  const [showSalary, setShowSalary] = useState(false)
  const [localPayments, setLocalPayments] = useState(payments)
  const [verifyingId, setVerifyingId] = useState<number | null>(null)

  async function handleVerifyPayment(paymentId: number) {
    setVerifyingId(paymentId)
    try {
      const res = await fetch(`/api/portal/staff/payments/${paymentId}/verify`, {
        method: 'PUT',
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Failed')
      }
      const updated = await res.json()
      setLocalPayments(prev => prev.map(p => p.id === paymentId ? updated : p))
      toast.success('Salary payment accepted and verified!')
    } catch (err: any) {
      toast.error(err.message || 'Failed to verify payment')
    } finally {
      setVerifyingId(null)
    }
  }

  // Extract all schedules
  const allSchedules = groups.flatMap(group => 
    group.schedules.map((schedule: any) => ({
      ...schedule,
      groupName: group.groupName,
      ageGroup: group.ageGroup
    }))
  )

  const docList = [
    { name: 'Contract / Job Agreement', url: contractUrl, color: '#8b5cf6' },
    { name: 'Certificates & Qualifications', url: certificatesUrl, color: '#3b82f6' },
    { name: 'ID Card (Local Staff)', url: idCardUrl, color: '#f97316' },
    { name: 'Passport (Foreign Staff)', url: passportUrl, color: '#ec4899' },
    { name: 'Police Report', url: policeReportUrl, color: '#64748b' },
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      
      {/* Top Banner / Welcome Profile */}
      <div className="card" style={{
        background: 'linear-gradient(135deg, var(--brand) 0%, #3730a3 100%)',
        color: 'white',
        border: 'none',
        padding: '2rem',
        borderRadius: '16px',
        boxShadow: 'var(--shadow-lg)',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Decorative circle */}
        <div style={{
          position: 'absolute', right: '-5%', top: '-20%',
          width: '200px', height: '200px', borderRadius: '50%',
          background: 'rgba(255,255,255,0.05)', pointerEvents: 'none'
        }} />

        <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center', flexWrap: 'wrap', position: 'relative', zIndex: 1 }}>
          <div style={{
            width: 80, height: 80, borderRadius: '50%',
            background: 'rgba(255,255,255,0.2)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '2rem', fontWeight: 800, flexShrink: 0
          }}>
            {user.name?.[0] || 'S'}
          </div>
          <div style={{ flex: 1, minWidth: 200 }}>
            <span className="badge" style={{ background: 'rgba(255,255,255,0.25)', color: 'white', fontWeight: 700, marginBottom: '0.5rem', display: 'inline-block' }}>
              {staffType}
            </span>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 800, margin: 0, textShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>{user.name}</h1>
            <p style={{ margin: '0.25rem 0 0', opacity: 0.85, fontSize: '0.9rem' }}>
              Member since {formatDate(user.createdAt)}
            </p>
          </div>
          <div 
            onClick={() => setShowSalary(!showSalary)}
            style={{
              background: 'rgba(255,255,255,0.1)',
              padding: '1rem 1.5rem',
              borderRadius: '12px',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255,255,255,0.15)',
              textAlign: 'right',
              flexShrink: 0,
              cursor: 'pointer',
              userSelect: 'none',
              transition: 'background 0.2s'
            }}
            title="Click to toggle visibility"
          >
            <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', opacity: 0.8 }}>Monthly Salary</div>
            <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#fcd34d' }}>
              {showSalary ? (
                salary ? `${salary.toLocaleString()} MVR` : '0 MVR'
              ) : (
                '•••••• MVR'
              )}
            </div>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', flexWrap: 'wrap' }}>
        
        {/* Biography & Basic Details */}
        <div style={{ gridColumn: 'span 2 / span 2' }}>
          <div className="card" style={{ height: '100%' }}>
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.1rem', fontWeight: 700, margin: '0 0 1rem' }}>
              <User size={18} style={{ color: 'var(--brand)' }} /> Biography & Info
            </h3>
            <p style={{ color: 'var(--text-muted)', lineHeight: 1.6, fontSize: '0.9rem', margin: '0 0 1.25rem' }}>
              {biography || 'No biography set.'}
            </p>
            <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap', borderTop: '1px solid var(--border)', paddingTop: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem' }}>
                <Mail size={15} style={{ color: 'var(--text-muted)' }} />
                <strong>Email:</strong> <span style={{ color: 'var(--text)' }}>{user.email}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem' }}>
                <Phone size={15} style={{ color: 'var(--text-muted)' }} />
                <strong>Phone:</strong> <span style={{ color: 'var(--text)' }}>{user.phone || '—'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Uploaded Documents List */}
        <div style={{ gridColumn: 'span 2 / span 1' }}>
          <div className="card" style={{ height: '100%' }}>
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.1rem', fontWeight: 700, margin: '0 0 1rem' }}>
              <FileText size={18} style={{ color: 'var(--brand)' }} /> Contract & Documents
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {docList.map(doc => {
                const isUploaded = !!doc.url
                // Avoid showing Passport line if local, or ID card line if foreigner if they are not uploaded,
                // but displaying them clearly is fine.
                if (doc.name.includes('Passport') && !passportUrl && idCardUrl) return null
                if (doc.name.includes('ID Card') && !idCardUrl && passportUrl) return null

                return (
                  <div key={doc.name} style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '0.75rem 1rem',
                    background: 'var(--surface-2)',
                    borderRadius: '8px',
                    border: '1px solid var(--border)'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <div style={{
                        width: '32px', height: '32px', borderRadius: '6px',
                        background: isUploaded ? `${doc.color}15` : '#f1f5f9',
                        color: isUploaded ? doc.color : '#94a3b8',
                        display: 'flex', alignItems: 'center', justifyContent: 'center'
                      }}>
                        <FileText size={16} />
                      </div>
                      <div>
                        <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>{doc.name}</div>
                        <div style={{ fontSize: '0.7rem', color: isUploaded ? '#10b981' : 'var(--text-muted)' }}>
                          {isUploaded ? '✓ Active File' : '✕ Missing / Pending Upload'}
                        </div>
                      </div>
                    </div>
                    {isUploaded ? (
                      <a href={doc.url} target="_blank" rel="noopener noreferrer" className="btn-secondary" style={{
                        padding: '0.35rem 0.75rem',
                        fontSize: '0.75rem',
                        gap: '0.25rem',
                        borderColor: 'var(--border)'
                      }}>
                        View <ExternalLink size={12} />
                      </a>
                    ) : (
                      <span className="badge" style={{ background: '#fee2e2', color: '#ef4444', fontSize: '0.7rem' }}>
                        Required
                      </span>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* Assigned Groups & Schedules */}
        <div style={{ gridColumn: 'span 2 / span 1' }}>
          <div className="card" style={{ height: '100%' }}>
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.1rem', fontWeight: 700, margin: '0 0 1rem' }}>
              <Users size={18} style={{ color: 'var(--brand)' }} /> Assigned Groups
            </h3>
            
            {groups.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '2rem 1rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                You are not currently assigned to any training groups.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {groups.map(group => (
                  <div key={group.id} style={{
                    padding: '1rem',
                    background: 'var(--surface)',
                    border: '1px solid var(--border)',
                    borderRadius: '8px'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                      <h4 style={{ margin: 0, fontSize: '0.9rem', fontWeight: 700 }}>{group.groupName}</h4>
                      <span className="badge badge-purple">{group.ageGroup}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      <span>Active Students: <strong>{group._count?.students || 0}</strong></span>
                      <span>Schedules: <strong>{group.schedules?.length || 0} weekly</strong></span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Coached Weekly Schedule */}
        <div style={{ gridColumn: 'span 2 / span 1' }}>
          <div className="card" style={{ height: '100%' }}>
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.1rem', fontWeight: 700, margin: '0 0 1rem' }}>
              <Calendar size={18} style={{ color: 'var(--brand)' }} /> Weekly Training Schedule
            </h3>
            {allSchedules.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '2rem 1rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                No training schedules found.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {allSchedules.map((sched: any) => (
                  <div key={sched.id} style={{
                    display: 'flex',
                    alignItems: 'center',
                    padding: '0.75rem',
                    background: 'var(--surface-2)',
                    borderRadius: '8px',
                    border: '1px solid var(--border)',
                    gap: '0.75rem'
                  }}>
                    <div style={{
                      width: '40px', height: '40px', borderRadius: '6px',
                      background: 'var(--brand-light)', color: 'var(--brand)',
                      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                      fontWeight: 800, fontSize: '0.7rem'
                    }}>
                      {sched.dayOfWeek}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '0.85rem', fontWeight: 700 }}>{sched.groupName} ({sched.ageGroup})</div>
                      <div style={{ display: 'flex', gap: '0.75rem', fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                          <Calendar size={11} /> {sched.startTime} - {sched.endTime}
                        </span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                          <MapPin size={11} /> {sched.location}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Recent Marked Attendance */}
        <div style={{ gridColumn: 'span 2 / span 1' }}>
          <div className="card" style={{ height: '100%' }}>
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.1rem', fontWeight: 700, margin: '0 0 1rem' }}>
              <CheckCircle size={18} style={{ color: 'var(--brand)' }} /> Recent Marked Attendance
            </h3>
            {recentAttendance.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '2rem 1rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                No attendance logs registered recently.
              </div>
            ) : (
              <div style={{ maxHeight: '250px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                {recentAttendance.map((att: any) => (
                  <div key={att.id} style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '0.5rem 0.75rem',
                    borderBottom: '1px solid var(--border)'
                  }}>
                    <div>
                      <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>{att.student.firstName} {att.student.lastName}</div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Group: {att.trainingGroup.groupName}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <span className={`badge ${
                        att.status === 'PRESENT' ? 'badge-green' :
                        att.status === 'ABSENT' ? 'badge-red' :
                        att.status === 'LATE' ? 'badge-orange' : 'badge-gray'
                      }`} style={{ fontSize: '0.65rem' }}>
                        {att.status}
                      </span>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
                        {new Date(att.date).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Salary Payment History */}
        <div style={{ gridColumn: 'span 2 / span 2' }}>
          <div className="card">
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.1rem', fontWeight: 700, margin: '0 0 1rem' }}>
              <CreditCard size={18} style={{ color: 'var(--brand)' }} /> Salary & Payment History
            </h3>
            
            {localPayments.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '2rem 1rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                No salary payments recorded yet.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {localPayments.map(p => (
                  <div key={p.id} style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '1rem',
                    background: 'var(--surface-2)',
                    borderRadius: '8px',
                    border: '1px solid var(--border)',
                    flexWrap: 'wrap',
                    gap: '0.75rem'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                      <div style={{
                        width: '40px', height: '40px', borderRadius: '6px',
                        background: 'var(--brand-light)', color: 'var(--brand)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontWeight: 800, fontSize: '0.85rem'
                      }}>
                        💵
                      </div>
                      <div>
                        <div style={{ fontSize: '0.9rem', fontWeight: 700 }}>
                          Salary for {p.paymentMonth}
                        </div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
                          Amount: <strong>{p.amount?.toLocaleString()} MVR</strong>
                          {p.notes && <span style={{ marginLeft: '0.5rem' }}>• {p.notes}</span>}
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                      {/* Receipt File */}
                      {p.receiptUrl ? (
                        <a href={p.receiptUrl} target="_blank" rel="noopener noreferrer" className="btn-secondary" style={{
                          padding: '0.35rem 0.75rem',
                          fontSize: '0.75rem',
                          gap: '0.25rem',
                          borderColor: 'var(--border)'
                        }}>
                          View Receipt <ExternalLink size={12} />
                        </a>
                      ) : (
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>No receipt uploaded</span>
                      )}

                      {/* Status Badge */}
                      <span className={`badge ${
                        p.status === 'PAID' ? 'badge-green' :
                        p.status === 'PENDING_VERIFICATION' ? 'badge-orange' : 'badge-gray'
                      }`} style={{ fontSize: '0.75rem' }}>
                        {p.status === 'PENDING' ? 'Awaiting Payment' :
                         p.status === 'PENDING_VERIFICATION' ? 'Awaiting Verification' :
                         'Paid & Verified'}
                      </span>

                      {/* Verification button */}
                      {p.status === 'PENDING_VERIFICATION' && (
                        <button
                          onClick={() => handleVerifyPayment(p.id)}
                          disabled={verifyingId === p.id}
                          className="btn-primary"
                          style={{
                            padding: '0.35rem 0.75rem',
                            fontSize: '0.75rem',
                            height: 'auto',
                            boxShadow: 'none'
                          }}
                        >
                          {verifyingId === p.id ? 'Accepting...' : 'Accept Payment'}
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  )
}
