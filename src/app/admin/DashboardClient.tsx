'use client'

import { useState } from 'react'
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer
} from 'recharts'
import { Users, Trophy, TrendingUp, AlertCircle, Calendar, CheckSquare, CreditCard, ArrowUp, ArrowDown, FileText, Check, X as XIcon, Briefcase } from 'lucide-react'
import { formatCurrency, formatDate, formatMonth } from '@/lib/utils'
import Link from 'next/link'
import { toast } from 'sonner'

interface Props {
  stats: any
  revenueData: any[]
  groupAttendance: any[]
  flaggedStudents: any[]
  upcomingSchedules: any[]
  recentAttendance: any[]
  currentMonth: string
  pendingSlips?: any[]
}

const GROUP_COLORS = ['#4f46e5', '#10b981', '#3b82f6', '#f59e0b', '#ec4899']

export default function DashboardClient({
  stats, revenueData, groupAttendance, flaggedStudents, upcomingSchedules, recentAttendance, currentMonth, pendingSlips = []
}: Props) {
  const [slips, setSlips] = useState<any[]>(pendingSlips)
  const [reviewSlip, setReviewSlip] = useState<any | null>(null)
  const [notes, setNotes] = useState('')
  const [processing, setProcessing] = useState(false)

  const revenueChange = stats.lastRevenue > 0
    ? Math.round(((stats.currentRevenue - stats.lastRevenue) / stats.lastRevenue) * 100)
    : 0

  const todayDow = ['SUN','MON','TUE','WED','THU','FRI','SAT'][new Date().getDay()]
  const todaySessions = upcomingSchedules.filter(s => s.dayOfWeek === todayDow)

  async function handleReviewAction(action: 'APPROVE' | 'REJECT') {
    if (action === 'REJECT' && !notes.trim()) {
      toast.error('Please provide a rejection reason in the feedback notes.')
      return
    }

    setProcessing(true)
    try {
      const res = await fetch(`/api/payments/${reviewSlip.id}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, notes })
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Failed to process action')
      }

      toast.success(action === 'APPROVE' ? 'Payment approved and recorded!' : 'Slip rejected and parent notified.')
      
      // Update local slips list
      setSlips(prev => prev.filter(s => s.id !== reviewSlip.id))
      setReviewSlip(null)
      setNotes('')
    } catch (err: any) {
      toast.error(err.message || 'Error processing payment review')
    } finally {
      setProcessing(false)
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Stats Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem' }}>
        <div className="stat-card">
          <div className="stat-card-icon"><Users size={18} /></div>
          <div className="stat-card-label">Active Students</div>
          <div className="stat-card-value" style={{ color: 'var(--brand)' }}>{stats.totalStudents}</div>
          <div className="stat-card-change" style={{ color: 'var(--text-muted)' }}>across {stats.totalGroups} groups</div>
        </div>
        
        <div className="stat-card">
          <div className="stat-card-icon" style={{ background: '#dcfce7', color: '#15803d' }}><CreditCard size={18} /></div>
          <div className="stat-card-label">Revenue This Month</div>
          <div className="stat-card-value" style={{ color: '#15803d', fontSize: '1.5rem' }}>
            {formatCurrency(stats.currentRevenue)}
          </div>
          <div className="stat-card-change" style={{ color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', gap: '0.15rem', fontSize: '0.7rem', marginTop: '0.4rem', borderTop: '1px solid var(--border)', paddingTop: '0.4rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
              <span>Gross Fees:</span>
              <span style={{ fontWeight: 600, color: 'var(--text)' }}>{formatCurrency(stats.currentRevenue)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
              <span>Staff Paid:</span>
              <span style={{ fontWeight: 600, color: '#ef4444' }}>-{formatCurrency(stats.staffPaid)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', borderTop: '1px dashed var(--border)', paddingTop: '0.15rem', marginTop: '0.15rem', fontWeight: 700 }}>
              <span>Net Cashflow:</span>
              <span style={{ color: stats.currentRevenue - stats.staffPaid >= 0 ? '#15803d' : '#b91c1c' }}>
                {formatCurrency(stats.currentRevenue - stats.staffPaid)}
              </span>
            </div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-card-icon" style={{ background: '#ffedd5', color: '#ea580c' }}><Briefcase size={18} /></div>
          <div className="stat-card-label">Staff Payroll (This Month)</div>
          <div className="stat-card-value" style={{ color: '#ea580c', fontSize: '1.5rem' }}>
            {formatCurrency(stats.staffPaid)}
          </div>
          <div className="stat-card-change" style={{ color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', gap: '0.15rem', fontSize: '0.7rem', marginTop: '0.4rem', borderTop: '1px solid var(--border)', paddingTop: '0.4rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
              <span>Verified Paid:</span>
              <span style={{ fontWeight: 600, color: '#16a34a' }}>{formatCurrency(stats.staffPaid)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
              <span>Awaiting Verify:</span>
              <span style={{ fontWeight: 600, color: '#ea580c' }}>{formatCurrency(stats.staffPending)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
              <span>Unpaid / Recorded:</span>
              <span style={{ fontWeight: 600, color: '#6b7280' }}>{formatCurrency(stats.staffUnpaid)}</span>
            </div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-card-icon" style={{ background: '#dbeafe', color: '#1e40af' }}>
            <TrendingUp size={18} />
          </div>
          <div className="stat-card-label">Collection Rate</div>
          <div className="stat-card-value" style={{ color: '#1e40af' }}>{stats.collectionRate}%</div>
          <div className="progress-bar" style={{ marginTop: '0.5rem' }}>
            <div className="progress-fill" style={{ width: `${stats.collectionRate}%`, background: 'linear-gradient(90deg, #1e40af, #3b82f6)' }} />
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-card-icon" style={{ background: '#fee2e2', color: '#b91c1c' }}>
            <AlertCircle size={18} />
          </div>
          <div className="stat-card-label">Overdue Payments</div>
          <div className="stat-card-value" style={{ color: '#b91c1c' }}>{stats.overdueCount}</div>
          <Link href="/admin/payments?status=OVERDUE" style={{ fontSize: '0.7rem', color: 'var(--brand)', textDecoration: 'none', fontWeight: 600 }}>
            View all overdue →
          </Link>
        </div>
      </div>

      {/* Pending Slip Approvals Widget */}
      {slips.length > 0 && (
        <div className="card" style={{ borderColor: 'var(--brand)', borderWidth: '1.5px', borderStyle: 'solid' }}>
          <h3 style={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', color: 'var(--text)' }}>
            📄 Pending Slip Approvals <span className="badge badge-purple">{slips.length}</span>
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
            {slips.map(s => (
              <div key={s.id} style={{ 
                border: '1px solid var(--border)', 
                borderRadius: 10, 
                padding: '0.875rem', 
                background: 'var(--surface-2)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                gap: '0.75rem'
              }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>{s.student?.firstName} {s.student?.lastName}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.125rem' }}>
                    Month: {formatMonth(s.paymentMonth)} · Parent: {s.student?.parent?.name}
                  </div>
                  <div style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--brand)', marginTop: '0.5rem' }}>
                    {formatCurrency(s.amount)}
                  </div>
                </div>
                <button 
                  className="btn-primary" 
                  style={{ width: '100%', justifyContent: 'center', fontSize: '0.8rem', padding: '0.4rem 0.8rem' }}
                  onClick={() => { setReviewSlip(s); setNotes('') }}
                >
                  Review Slip
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Charts Row */}
      <div className="grid-2">
        {/* Revenue Chart */}
        <div className="card">
          <h3 style={{ fontWeight: 700, marginBottom: '1rem', color: 'var(--text)' }}>Monthly Revenue</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={revenueData} barSize={28}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="month" tick={{ fill: 'var(--text-muted)', fontSize: 11 }}
                tickFormatter={m => { const [, mo] = m.split('-'); return ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][parseInt(mo)-1] }} />
              <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 11 }} tickFormatter={v => `${(v/1000).toFixed(0)}k`} />
              <Tooltip
                contentStyle={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text)' }}
                formatter={(v: any) => [formatCurrency(v), 'Revenue']}
                labelFormatter={l => formatMonth(l)}
              />
              <Bar dataKey="revenue" fill="var(--brand)" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Group Attendance */}
        <div className="card">
          <h3 style={{ fontWeight: 700, marginBottom: '1rem', color: 'var(--text)' }}>Students by Group</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
            {groupAttendance.map((g, i) => (
              <div key={g.id}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.375rem' }}>
                  <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>{g.groupName}</span>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{g._count.students} students</span>
                </div>
                <div className="progress-bar">
                  <div className="progress-fill" style={{
                    width: `${Math.min((g._count.students / g.maxCapacity) * 100, 100)}%`,
                    background: `linear-gradient(90deg, ${GROUP_COLORS[i % GROUP_COLORS.length]}, ${GROUP_COLORS[i % GROUP_COLORS.length]}aa)`,
                  }} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.2rem' }}>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{g.ageGroup}</span>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{g._count.students}/{g.maxCapacity}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Row */}
      <div className="grid-2">
        {/* Flagged Students */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3 style={{ fontWeight: 700 }}>🔴 Unpaid / Overdue</h3>
            <Link href="/admin/payments" className="btn-ghost" style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem' }}>
              View all
            </Link>
          </div>
          {flaggedStudents.length === 0 ? (
            <div className="empty-state">
              <div style={{ fontSize: '2rem' }}>✅</div>
              <p>All payments collected!</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
              {flaggedStudents.slice(0, 6).map((p: any, i) => (
                <div key={`${p.id}-${i}`} style={{
                  display: 'flex', alignItems: 'center', gap: '0.75rem',
                  padding: '0.625rem', background: '#fee2e244',
                  borderRadius: 8, border: '1px solid #fee2e2',
                }}>
                  <div className="avatar" style={{
                    width: 32, height: 32, fontSize: '0.75rem',
                    background: '#fee2e2', color: '#b91c1c',
                  }}>
                    {p.student?.firstName?.[0]}{p.student?.lastName?.[0]}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '0.8rem', fontWeight: 600, truncate: true }}>
                      {p.student?.firstName} {p.student?.lastName}
                    </div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                      {p.student?.trainingGroup?.groupName} · {formatMonth(p.paymentMonth)}
                    </div>
                  </div>
                  <div>
                    <span className={`badge ${p.status === 'OVERDUE' ? 'badge-red' : p.status === 'PENDING' ? 'badge-yellow' : 'badge-yellow'}`}>
                      {p.status}
                    </span>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textAlign: 'right', marginTop: 2 }}>
                      MVR {p.amount}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Today's Sessions + Recent Activity */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div className="card">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.875rem' }}>
              <Calendar size={16} style={{ color: 'var(--brand)' }} />
              <h3 style={{ fontWeight: 700, margin: 0 }}>Today's Sessions</h3>
              <span className="badge badge-purple">{todaySessions.length}</span>
            </div>
            {todaySessions.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>No sessions scheduled for today</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {todaySessions.map(s => (
                  <div key={s.id} style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    padding: '0.5rem 0.75rem',
                    background: 'var(--brand-light)', borderRadius: 8,
                    border: '1px solid var(--border)',
                  }}>
                    <div>
                      <div style={{ fontSize: '0.8rem', fontWeight: 600 }}>{s.trainingGroup.groupName}</div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{s.location}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--brand)' }}>{s.startTime}</div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>–{s.endTime}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="card">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.875rem' }}>
              <CheckSquare size={16} style={{ color: '#10b981' }} />
              <h3 style={{ fontWeight: 700, margin: 0 }}>Recent Attendance</h3>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {recentAttendance.slice(0, 4).map(a => (
                <div key={a.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ fontSize: '0.8rem' }}>
                    <strong>{a.student?.firstName} {a.student?.lastName}</strong>
                    <span style={{ color: 'var(--text-muted)' }}> · {a.trainingGroup?.groupName}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{formatDate(a.date)}</span>
                    <span className={`badge ${a.status === 'PRESENT' ? 'badge-green' : a.status === 'ABSENT' ? 'badge-red' : a.status === 'LATE' ? 'badge-yellow' : 'badge-yellow'}`}>
                      {a.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Review Slip Modal */}
      {reviewSlip && (
        <div className="modal-overlay" onClick={() => !processing && setReviewSlip(null)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 640 }}>
            <div className="modal-header">
              <h2 style={{ fontWeight: 700, margin: 0, fontSize: '1rem', color: 'var(--text)' }}>Review Payment Slip</h2>
              <button className="btn-ghost" style={{ padding: '0.375rem' }} disabled={processing} onClick={() => setReviewSlip(null)}>✕</button>
            </div>
            <div className="modal-body">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.25rem' }}>
                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Student</div>
                  <div style={{ fontWeight: 700 }}>{reviewSlip.student?.firstName} {reviewSlip.student?.lastName}</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Parent</div>
                  <div style={{ fontWeight: 600 }}>{reviewSlip.student?.parent?.name || '—'}</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Amount</div>
                  <div style={{ fontWeight: 700, color: 'var(--brand)' }}>{formatCurrency(reviewSlip.amount)}</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Month</div>
                  <div style={{ fontWeight: 600 }}>{formatMonth(reviewSlip.paymentMonth)}</div>
                </div>
              </div>

              <div style={{ marginBottom: '1.25rem' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.375rem' }}>Uploaded Slip Document</div>
                <div style={{ 
                  border: '1px solid var(--border)', 
                  borderRadius: 8, 
                  overflow: 'hidden', 
                  maxHeight: 280, 
                  background: '#f8fafc',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  {reviewSlip.slipUrl?.toLowerCase().endsWith('.pdf') ? (
                    <div style={{ padding: '2rem', textAlign: 'center' }}>
                      <FileText size={48} style={{ color: 'var(--brand)', marginBottom: '0.5rem' }} />
                      <a href={reviewSlip.slipUrl} target="_blank" rel="noreferrer" className="btn-secondary">Open PDF Slip</a>
                    </div>
                  ) : (
                    <img 
                      src={reviewSlip.slipUrl} 
                      alt="Payment Slip" 
                      style={{ maxWidth: '100%', maxHeight: 280, objectFit: 'contain' }} 
                    />
                  )}
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Feedback Notes (Optional for approval, required for rejection)</label>
                <input 
                  type="text" 
                  className="input" 
                  value={notes} 
                  onChange={e => setNotes(e.target.value)} 
                  placeholder="e.g. Bank reference verified or Rejection reason..." 
                  disabled={processing}
                />
              </div>
            </div>
            <div className="modal-footer" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <button 
                type="button" 
                className="btn-danger" 
                disabled={processing} 
                onClick={() => handleReviewAction('REJECT')}
              >
                Reject Slip
              </button>
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button 
                  type="button" 
                  className="btn-secondary" 
                  disabled={processing} 
                  onClick={() => setReviewSlip(null)}
                >
                  Cancel
                </button>
                <button 
                  type="button" 
                  className="btn-primary" 
                  disabled={processing} 
                  onClick={() => handleReviewAction('APPROVE')}
                >
                  {processing ? 'Processing...' : 'Approve Payment'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
