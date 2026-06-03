'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Plus, Download, Send, RefreshCw, AlertCircle, CheckCircle2, Filter, FileText, Check, X as XIcon } from 'lucide-react'
import { formatCurrency, formatDate, formatMonth, getCurrentMonth } from '@/lib/utils'

interface Props { payments: any[]; groups: any[]; settings: any; currentMonth: string }

export default function PaymentsClient({ payments: initial, groups, settings, currentMonth }: Props) {
  const [payments, setPayments] = useState(initial)
  const [reviewSlip, setReviewSlip] = useState<any | null>(null)
  const [reviewNotes, setReviewNotes] = useState('')
  const [processingReview, setProcessingReview] = useState(false)

  async function handleReviewAction(action: 'APPROVE' | 'REJECT') {
    if (action === 'REJECT' && !reviewNotes.trim()) {
      toast.error('Please provide a rejection reason in the feedback notes.')
      return
    }

    setProcessingReview(true)
    try {
      const res = await fetch(`/api/payments/${reviewSlip.id}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, notes: reviewNotes })
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Failed to process action')
      }

      const updated = await res.json()
      toast.success(action === 'APPROVE' ? 'Payment approved and recorded!' : 'Slip rejected and parent notified.')
      
      // Update local payments list
      setPayments(prev => prev.map(p => p.id === updated.id ? { ...p, ...updated } : p))
      setReviewSlip(null)
      setReviewNotes('')
    } catch (err: any) {
      toast.error(err.message || 'Error processing payment review')
    } finally {
      setProcessingReview(false)
    }
  }
  const [selectedMonth, setSelectedMonth] = useState(currentMonth)
  const [filterGroup, setFilterGroup] = useState('')
  const [filterStatus, setFilterStatus] = useState('ALL')
  const [showPayModal, setShowPayModal] = useState(false)
  const [selectedPayment, setSelectedPayment] = useState<any>(null)
  const [generating, setGenerating] = useState(false)
  const [flagging, setFlagging] = useState(false)

  const filtered = payments.filter(p => {
    const matchGroup = !filterGroup || p.student?.trainingGroup?.groupName === filterGroup
    const matchStatus = filterStatus === 'ALL' || p.status === filterStatus
    return matchGroup && matchStatus
  })

  const stats = {
    total: filtered.length,
    paid: filtered.filter(p => p.status === 'PAID').length,
    unpaid: filtered.filter(p => p.status === 'UNPAID').length,
    overdue: filtered.filter(p => p.status === 'OVERDUE').length,
    revenue: filtered.filter(p => p.status === 'PAID').reduce((s, p) => s + p.amount, 0),
    outstanding: filtered.filter(p => ['UNPAID','OVERDUE'].includes(p.status)).reduce((s, p) => s + p.amount, 0),
  }

  async function loadMonth(month: string) {
    setSelectedMonth(month)
    const res = await fetch(`/api/payments?month=${month}`)
    if (res.ok) setPayments(await res.json())
  }

  async function generateInvoices() {
    setGenerating(true)
    try {
      const dueDay = settings?.paymentDueDay || 5
      const res = await fetch('/api/payments/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ month: selectedMonth, dueDay }),
      })
      const data = await res.json()
      toast.success(`Generated ${data.created} invoices (${data.skipped} skipped)`)
      loadMonth(selectedMonth)
    } catch { toast.error('Failed to generate invoices') }
    finally { setGenerating(false) }
  }

  async function flagOverdue() {
    setFlagging(true)
    try {
      const res = await fetch('/api/payments/overdue', { method: 'POST' })
      const data = await res.json()
      toast.success(`Flagged ${data.updated} overdue payments`)
      loadMonth(selectedMonth)
    } catch { toast.error('Failed') }
    finally { setFlagging(false) }
  }

  async function sendReminder(payment: any) {
    const res = await fetch('/api/email/remind', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ paymentId: payment.id }),
    })
    if (res.ok) toast.success('Reminder sent!')
    else toast.error('Failed to send reminder')
  }

  function exportCSV() {
    const rows = [['Student','Group','Month','Amount','Due Date','Paid Date','Status','Method','Receipt']]
    filtered.forEach(p => rows.push([
      `${p.student?.firstName} ${p.student?.lastName}`,
      p.student?.trainingGroup?.groupName || '',
      p.paymentMonth, p.amount.toString(),
      formatDate(p.dueDate), p.paymentDate ? formatDate(p.paymentDate) : '',
      p.status, p.paymentMethod || '', p.receiptNumber || ''
    ]))
    const csv = rows.map(r => r.map(c => `"${c}"`).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a'); a.href = url; a.download = `payments-${selectedMonth}.csv`; a.click()
    URL.revokeObjectURL(url)
  }

  // Month picker options (last 12 months)
  const months = Array.from({ length: 12 }, (_, i) => {
    const d = new Date(); d.setMonth(d.getMonth() - i)
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`
  })

  return (
    <div>
      {/* Controls */}
      <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.25rem', flexWrap: 'wrap', alignItems: 'center' }}>
        <select className="select" style={{ width: 160 }} value={selectedMonth} onChange={e => loadMonth(e.target.value)}>
          {months.map(m => <option key={m} value={m}>{formatMonth(m)}</option>)}
        </select>
        <select className="select" style={{ width: 160 }} value={filterGroup} onChange={e => setFilterGroup(e.target.value)}>
          <option value="">All Groups</option>
          {groups.map(g => <option key={g.id} value={g.groupName}>{g.groupName}</option>)}
        </select>
        <select className="select" style={{ width: 140 }} value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
          <option value="ALL">All Status</option>
          <option value="PAID">Paid</option>
          <option value="UNPAID">Unpaid</option>
          <option value="PENDING">Pending Review</option>
          <option value="OVERDUE">Overdue</option>
          <option value="PARTIAL">Partial</option>
        </select>
        <div style={{ flex: 1 }} />
        <button className="btn-secondary" onClick={flagOverdue} disabled={flagging}>
          <RefreshCw size={14} className={flagging ? 'animate-spin' : ''} /> Flag Overdue
        </button>
        <button className="btn-secondary" onClick={exportCSV}><Download size={14} /> Export</button>
        <button className="btn-primary" onClick={generateInvoices} disabled={generating}>
          {generating ? 'Generating...' : <><Plus size={14} /> Generate Invoices</>}
        </button>
      </div>

      {/* Stats */}
      <div className="grid-4" style={{ marginBottom: '1.25rem' }}>
        {[{
          label: 'Collected', value: formatCurrency(stats.revenue), color: '#166534'
        },{
          label: 'Outstanding', value: formatCurrency(stats.outstanding), color: '#991b1b'
        },{
          label: 'Paid', value: `${stats.paid}/${stats.total}`, color: 'var(--brand)'
        },{
          label: 'Overdue', value: stats.overdue.toString(), color: '#dc2626'
        }].map(s => (
          <div key={s.label} className="stat-card">
            <div className="stat-card-label">{s.label}</div>
            <div className="stat-card-value" style={{ fontSize: '1.5rem', color: s.color }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <table className="data-table">
          <thead>
            <tr>
              <th>Student</th>
              <th>Group</th>
              <th>Amount</th>
              <th>Due Date</th>
              <th>Paid Date</th>
              <th>Method</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan={8} style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>No payments found</td></tr>
            ) : filtered.map(p => (
              <tr key={p.id}>
                <td>
                  <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>{p.student?.firstName} {p.student?.lastName}</div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{p.student?.parent?.name}</div>
                </td>
                <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{p.student?.trainingGroup?.groupName}</td>
                <td style={{ fontWeight: 600 }}>{formatCurrency(p.amount)}</td>
                <td style={{ fontSize: '0.8rem' }}>{formatDate(p.dueDate)}</td>
                <td style={{ fontSize: '0.8rem' }}>{p.paymentDate ? formatDate(p.paymentDate) : '—'}</td>
                <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{p.paymentMethod || '—'}</td>
                <td>
                  <span className={`badge ${
                    p.status === 'PAID' ? 'badge-green' :
                    p.status === 'OVERDUE' ? 'badge-red' :
                    p.status === 'PENDING' ? 'badge-yellow' :
                    p.status === 'PARTIAL' ? 'badge-orange' :
                    'badge-gray'
                  }`}>
                    {p.status === 'PENDING' ? 'PENDING' : p.status}
                  </span>
                </td>
                <td>
                  <div style={{ display: 'flex', gap: '0.375rem' }}>
                    {p.status === 'PENDING' ? (
                      <button className="btn-primary" style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem', background: 'var(--brand)' }}
                        onClick={() => { setReviewSlip(p); setReviewNotes('') }}>
                        Review Slip
                      </button>
                    ) : p.status !== 'PAID' ? (
                      <button className="btn-primary" style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem' }}
                        onClick={() => { setSelectedPayment(p); setShowPayModal(true) }}>
                        <CheckCircle2 size={12} /> Record
                      </button>
                    ) : null}
                    {p.status !== 'PAID' && p.status !== 'PENDING' && (
                      <button className="btn-ghost" style={{ padding: '0.3rem 0.5rem' }}
                        onClick={() => sendReminder(p)} title="Send reminder">
                        <Send size={12} />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showPayModal && selectedPayment && (
        <RecordPaymentModal payment={selectedPayment} onClose={() => setShowPayModal(false)}
          onSave={updated => {
            setPayments(prev => prev.map(p => p.id === updated.id ? updated : p))
            setShowPayModal(false)
            toast.success('Payment recorded!')
          }} />
      )}

      {reviewSlip && (
        <div className="modal-overlay" onClick={() => !processingReview && setReviewSlip(null)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 640 }}>
            <div className="modal-header">
              <h2 style={{ fontWeight: 700, margin: 0, fontSize: '1rem', color: 'var(--text)' }}>Review Payment Slip</h2>
              <button className="btn-ghost" style={{ padding: '0.375rem' }} disabled={processingReview} onClick={() => setReviewSlip(null)}>✕</button>
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
                  value={reviewNotes} 
                  onChange={e => setReviewNotes(e.target.value)} 
                  placeholder="e.g. Bank reference verified or Rejection reason..." 
                  disabled={processingReview}
                />
              </div>
            </div>
            <div className="modal-footer" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <button 
                type="button" 
                className="btn-danger" 
                disabled={processingReview} 
                onClick={() => handleReviewAction('REJECT')}
              >
                Reject Slip
              </button>
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button 
                  type="button" 
                  className="btn-secondary" 
                  disabled={processingReview} 
                  onClick={() => setReviewSlip(null)}
                >
                  Cancel
                </button>
                <button 
                  type="button" 
                  className="btn-primary" 
                  disabled={processingReview} 
                  onClick={() => handleReviewAction('APPROVE')}
                >
                  {processingReview ? 'Processing...' : 'Approve Payment'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function RecordPaymentModal({ payment, onClose, onSave }: any) {
  const [form, setForm] = useState({
    status: 'PAID',
    paymentMethod: 'CASH',
    paymentDate: new Date().toISOString().split('T')[0],
    notes: '',
  })
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await fetch(`/api/payments/${payment.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, studentId: payment.studentId, paymentMonth: payment.paymentMonth }),
      })
      if (!res.ok) throw new Error()
      onSave(await res.json())
    } catch { toast.error('Failed to record payment') }
    finally { setLoading(false) }
  }

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <h2 style={{ fontWeight: 700, margin: 0, fontSize: '1rem' }}>Record Payment</h2>
          <button className="btn-ghost" style={{ padding: '0.375rem' }} onClick={onClose}>✕</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="card-dark" style={{ marginBottom: '1rem', padding: '1rem' }}>
              <div style={{ fontWeight: 700 }}>{payment.student?.firstName} {payment.student?.lastName}</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{formatMonth(payment.paymentMonth)}</div>
              <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--brand)', marginTop: '0.25rem' }}>{formatCurrency(payment.amount)}</div>
            </div>
            <div className="form-group">
              <label className="form-label">Payment Status</label>
              <select className="select" value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}>
                <option value="PAID">Paid in Full</option>
                <option value="PARTIAL">Partial Payment</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Payment Method</label>
              <select className="select" value={form.paymentMethod} onChange={e => setForm(f => ({ ...f, paymentMethod: e.target.value }))}>
                <option value="CASH">Cash</option>
                <option value="BANK_TRANSFER">Bank Transfer</option>
                <option value="ONLINE">Online</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Payment Date</label>
              <input type="date" className="input" value={form.paymentDate} onChange={e => setForm(f => ({ ...f, paymentDate: e.target.value }))} />
            </div>
            <div className="form-group">
              <label className="form-label">Notes (optional)</label>
              <input className="input" placeholder="Any notes..." value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? 'Recording...' : 'Record Payment'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

