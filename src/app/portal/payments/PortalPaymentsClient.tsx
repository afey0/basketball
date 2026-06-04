'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Upload, FileText, Check, AlertCircle, Loader2 } from 'lucide-react'
import { formatCurrency, formatDate, formatMonth } from '@/lib/utils'

interface Props {
  initialChildren: any[]
}

export default function PortalPaymentsClient({ initialChildren }: Props) {
  const [children, setChildren] = useState(initialChildren)
  const [uploadingPayment, setUploadingPayment] = useState<any | null>(null)
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)

  // Status mapping
  const getBadgeClass = (status: string) => {
    switch (status) {
      case 'PAID': return 'badge-green'
      case 'OVERDUE': return 'badge-red'
      case 'PENDING': return 'badge-yellow' // slip uploaded, awaiting approval
      case 'PARTIAL': return 'badge-orange'
      default: return 'badge-gray' // UNPAID
    }
  }

  async function handleUpload(e: React.FormEvent) {
    e.preventDefault()
    if (!file || !uploadingPayment) return

    setUploading(true)
    const formData = new FormData()
    formData.append('file', file)

    try {
      const res = await fetch(`/api/payments/${uploadingPayment.id}/slip`, {
        method: 'POST',
        body: formData
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Failed to upload slip')
      }

      const updatedPayment = await res.json()

      // Update the local state
      setChildren(prev => prev.map(child => {
        if (child.id === updatedPayment.studentId) {
          return {
            ...child,
            payments: child.payments.map((p: any) => p.id === updatedPayment.id ? updatedPayment : p)
          }
        }
        return child
      }))

      toast.success('Payment slip uploaded successfully! Awaiting review.')
      setUploadingPayment(null)
      setFile(null)
    } catch (err: any) {
      toast.error(err.message || 'Error uploading slip')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div>
      <h1 style={{ fontWeight: 900, fontSize: '1.5rem', marginBottom: '1.5rem' }}>💰 Payment History</h1>
      
      {children.map(child => {
        const outstanding = child.payments
          .filter((p: any) => ['UNPAID', 'OVERDUE'].includes(p.status))
          .reduce((s: number, p: any) => s + p.amount, 0)
          
        return (
          <div key={child.id} style={{ marginBottom: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.875rem', flexWrap: 'wrap', gap: '0.5rem' }}>
              <h2 style={{ fontWeight: 700, fontSize: '1.125rem', margin: 0 }}>{child.firstName} {child.lastName}</h2>
              {outstanding > 0 && (
                <div className="alert alert-red" style={{ padding: '0.4rem 0.875rem', margin: 0, fontSize: '0.8rem' }}>
                  Outstanding: {formatCurrency(outstanding)}
                </div>
              )}
            </div>

            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Month</th>
                    <th>Amount</th>
                    <th>Due Date</th>
                    <th>Paid Date</th>
                    <th>Method</th>
                    <th>Status</th>
                    <th>Receipt / Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {child.payments.map((p: any) => (
                    <tr key={p.id}>
                      <td style={{ fontWeight: 600 }}>
                        <div>{formatMonth(p.paymentMonth)}</div>
                        {p.rejectionReason && (
                          <div className="alert alert-red" style={{ display: 'inline-flex', padding: '0.25rem 0.5rem', fontSize: '0.65rem', marginTop: '0.375rem', gap: '0.25rem', alignItems: 'center' }}>
                            <AlertCircle size={10} /> Slip rejected: {p.rejectionReason}
                          </div>
                        )}
                      </td>
                      <td>{formatCurrency(p.amount)}</td>
                      <td>{formatDate(p.dueDate)}</td>
                      <td>{p.paymentDate ? formatDate(p.paymentDate) : '—'}</td>
                      <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{p.paymentMethod || '—'}</td>
                      <td>
                        <span className={`badge ${getBadgeClass(p.status)}`}>
                          {p.status === 'PENDING' ? 'Awaiting Review' : p.status}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          {['UNPAID', 'OVERDUE'].includes(p.status) && (
                            <button 
                              className="btn-primary" 
                              style={{ padding: '0.35rem 0.75rem', fontSize: '0.75rem' }}
                              onClick={() => setUploadingPayment(p)}
                            >
                              <Upload size={12} /> Upload Slip
                            </button>
                          )}
                          {p.status === 'PENDING' && p.slipUrl && (
                            <a 
                              href={p.slipUrl} 
                              target="_blank" 
                              rel="noreferrer" 
                              className="btn-secondary"
                              style={{ padding: '0.35rem 0.75rem', fontSize: '0.75rem', textDecoration: 'none' }}
                            >
                              <FileText size={12} /> View Slip
                            </a>
                          )}
                          {p.status === 'PAID' && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                                <Check size={12} style={{ color: '#166534' }} /> {p.receiptNumber || 'Paid'}
                              </div>
                              {p.slipUrl && (
                                <a 
                                  href={p.slipUrl} 
                                  target="_blank" 
                                  rel="noreferrer" 
                                  className="btn-secondary"
                                  style={{ padding: '0.25rem 0.5rem', fontSize: '0.7rem', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '0.25rem', width: 'fit-content' }}
                                >
                                  <FileText size={10} /> View Slip
                                </a>
                              )}
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                  {child.payments.length === 0 && (
                    <tr>
                      <td colSpan={7} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem' }}>
                        No payment records
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )
      })}

      {/* Upload Modal */}
      {uploadingPayment && (
        <div className="modal-overlay" onClick={() => !uploading && setUploadingPayment(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2 style={{ fontWeight: 700, margin: 0, fontSize: '1rem' }}>Upload Payment Slip</h2>
              <button className="btn-ghost" style={{ padding: '0.375rem' }} disabled={uploading} onClick={() => setUploadingPayment(null)}>✕</button>
            </div>
            <form onSubmit={handleUpload}>
              <div className="modal-body">
                <div className="card-dark" style={{ marginBottom: '1.25rem', padding: '1rem' }}>
                  <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>
                    {formatMonth(uploadingPayment.paymentMonth)} invoice
                  </div>
                  <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--brand)', marginTop: '0.25rem' }}>
                    {formatCurrency(uploadingPayment.amount)}
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Select Bank Transfer Slip *</label>
                  <input 
                    type="file" 
                    className="input" 
                    accept="image/png, image/jpeg, image/jpg, application/pdf"
                    required
                    onChange={e => setFile(e.target.files?.[0] || null)}
                    disabled={uploading}
                  />
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.375rem' }}>
                    Supported formats: PNG, JPG, JPEG, PDF. Max size: 5MB.
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn-secondary" disabled={uploading} onClick={() => setUploadingPayment(null)}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary" disabled={uploading || !file}>
                  {uploading ? (
                    <><Loader2 size={12} className="animate-spin" /> Uploading...</>
                  ) : (
                    <><Upload size={12} /> Submit Slip</>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
