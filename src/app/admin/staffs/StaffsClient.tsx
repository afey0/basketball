'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Plus, Search, Edit, Trash2, FileText, CheckCircle, Upload, DollarSign, Briefcase, Paperclip, CreditCard, Loader2, Calendar } from 'lucide-react'
import { formatDate, COUNTRIES } from '@/lib/utils'

interface Props {
  staffs: any[]
}

const staffTypesList = [
  { value: 'COACH', label: 'Coach' },
  { value: 'HEAD_COACH', label: 'Head Coach' },
  { value: 'ASSISTANT', label: 'Assistant Coach / Helper' },
  { value: 'CLEANER', label: 'Cleaner' },
  { value: 'ADMINISTRATOR', label: 'Administrative Staff' },
  { value: 'OTHER', label: 'Other Staff' },
]

export default function StaffsClient({ staffs: initialStaffs }: Props) {
  const [staffs, setStaffs] = useState(initialStaffs)
  const [search, setSearch] = useState('')
  const [showAddModal, setShowAddModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [editingStaff, setEditingStaff] = useState<any | null>(null)
  const [showPaymentsModal, setShowPaymentsModal] = useState(false)
  const [selectedStaffForPayments, setSelectedStaffForPayments] = useState<any | null>(null)

  const filtered = staffs.filter(s => {
    const nameMatch = s.user.name.toLowerCase().includes(search.toLowerCase()) || 
                      s.user.email.toLowerCase().includes(search.toLowerCase())
    const typeMatch = s.staffType.toLowerCase().includes(search.toLowerCase())
    return nameMatch || typeMatch
  })

  async function handleDelete(id: number, userName: string) {
    if (!confirm(`Are you sure you want to delete ${userName} and their user account? This cannot be undone.`)) return

    try {
      const res = await fetch(`/api/admin/staffs/${id}`, { method: 'DELETE' })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Failed to delete')
      }
      setStaffs(prev => prev.filter(s => s.id !== id))
      toast.success('Staff record deleted successfully!')
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete staff member')
    }
  }

  return (
    <div>
      {/* Controls */}
      <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.25rem', flexWrap: 'wrap', alignItems: 'center' }}>
        <div className="search-wrapper" style={{ flex: 1, minWidth: 200 }}>
          <Search size={15} className="search-icon" />
          <input 
            className="search-input" 
            style={{ width: '100%' }} 
            placeholder="Search by name, email, or staff type..." 
            value={search} 
            onChange={e => setSearch(e.target.value)} 
          />
        </div>
        <button className="btn-primary" onClick={() => setShowAddModal(true)}>
          <Plus size={15} /> Add Staff Member
        </button>
      </div>

      {/* Stats bar */}
      <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1rem' }}>
        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{filtered.length} staff members listed</span>
      </div>

      {/* Table */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <table className="data-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Phone</th>
              <th>Staff Type</th>
              <th>Salary (MVR)</th>
              <th>Documents</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                  No staff members found
                </td>
              </tr>
            ) : filtered.map(s => (
              <tr key={s.id}>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
                    <div className="avatar" style={{ width: 32, height: 32, fontSize: '0.7rem' }}>
                      {s.user.name?.[0] || 'S'}
                    </div>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>{s.user.name}</div>
                    </div>
                  </div>
                </td>
                <td style={{ fontSize: '0.875rem' }}>{s.user.email}</td>
                <td style={{ fontSize: '0.875rem' }}>{s.user.phone || '—'}</td>
                <td>
                  <span className="badge badge-blue">
                    {s.staffType}
                  </span>
                </td>
                <td style={{ fontSize: '0.875rem', fontWeight: 600 }}>
                  {s.salary ? `${s.salary.toLocaleString()} MVR` : '0 MVR'}
                </td>
                <td>
                  <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
                    {s.contractUrl && (
                      <a href={s.contractUrl} target="_blank" rel="noopener noreferrer" className="badge badge-purple" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.2rem', textDecoration: 'none' }} title="Contract">
                        <FileText size={11} /> Contract
                      </a>
                    )}
                    {s.certificatesUrl && (
                      <a href={s.certificatesUrl} target="_blank" rel="noopener noreferrer" className="badge badge-blue" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.2rem', textDecoration: 'none' }} title="Certificates">
                        <Briefcase size={11} /> Certs
                      </a>
                    )}
                    {s.idCardUrl && (
                      <a href={s.idCardUrl} target="_blank" rel="noopener noreferrer" className="badge badge-orange" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.2rem', textDecoration: 'none' }} title="ID Card">
                        <Paperclip size={11} /> ID Card
                      </a>
                    )}
                    {s.passportUrl && (
                      <a href={s.passportUrl} target="_blank" rel="noopener noreferrer" className="badge badge-orange" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.2rem', textDecoration: 'none' }} title="Passport">
                        <Paperclip size={11} /> Passport
                      </a>
                    )}
                    {s.policeReportUrl && (
                      <a href={s.policeReportUrl} target="_blank" rel="noopener noreferrer" className="badge badge-gray" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.2rem', textDecoration: 'none' }} title="Police Report">
                        <FileText size={11} /> Police
                      </a>
                    )}
                    {!s.contractUrl && !s.certificatesUrl && !s.idCardUrl && !s.passportUrl && !s.policeReportUrl && (
                      <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>None</span>
                    )}
                  </div>
                </td>
                <td>
                  <div style={{ display: 'flex', gap: '0.375rem' }}>
                    <button 
                      className="btn-ghost" 
                      style={{ padding: '0.375rem', color: 'var(--brand)' }}
                      onClick={() => { setSelectedStaffForPayments(s); setShowPaymentsModal(true) }}
                      title="Salary Payment History"
                    >
                      <CreditCard size={14} />
                    </button>
                    <button 
                      className="btn-ghost" 
                      style={{ padding: '0.375rem' }}
                      onClick={() => { setEditingStaff(s); setShowEditModal(true) }}
                      title="Edit staff details"
                    >
                      <Edit size={14} />
                    </button>
                    <button 
                      className="btn-ghost" 
                      style={{ padding: '0.375rem', color: '#ef4444' }}
                      onClick={() => handleDelete(s.id, s.user.name)}
                      title="Delete staff member"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Add Staff Modal */}
      {showAddModal && (
        <StaffFormModal
          onClose={() => setShowAddModal(false)}
          onSave={newStaff => {
            setStaffs(prev => [newStaff, ...prev])
            setShowAddModal(false)
          }}
        />
      )}

      {/* Edit Staff Modal */}
      {showEditModal && editingStaff && (
        <StaffFormModal
          staff={editingStaff}
          onClose={() => { setShowEditModal(false); setEditingStaff(null) }}
          onSave={updatedStaff => {
            setStaffs(prev => prev.map(s => s.id === updatedStaff.id ? updatedStaff : s))
            setShowEditModal(false)
            setEditingStaff(null)
          }}
        />
      )}

      {/* Salary Payments Modal */}
      {showPaymentsModal && selectedStaffForPayments && (
        <StaffPaymentsModal
          staff={selectedStaffForPayments}
          onClose={() => { setShowPaymentsModal(false); setSelectedStaffForPayments(null) }}
        />
      )}
    </div>
  )
}

function StaffFormModal({ staff, onClose, onSave }: any) {
  const isEdit = !!staff

  const [form, setForm] = useState({
    name: staff?.user?.name || '',
    email: staff?.user?.email || '',
    phone: staff?.user?.phone || '',
    password: '',
    staffType: staff?.staffType || 'COACH',
    biography: staff?.biography || '',
    salary: staff?.salary || 0,
    contractUrl: staff?.contractUrl || '',
    certificatesUrl: staff?.certificatesUrl || '',
    passportUrl: staff?.passportUrl || '',
    idCardUrl: staff?.idCardUrl || '',
    policeReportUrl: staff?.policeReportUrl || '',
    country: staff?.user?.country || 'Maldives',
    idCardOrPassport: staff?.user?.idCardOrPassport || '',
  })

  const [uploading, setUploading] = useState<Record<string, boolean>>({})
  const [loading, setLoading] = useState(false)

  const set = (k: string, v: any) => setForm(f => ({ ...f, [k]: v }))

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>, field: string) {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(prev => ({ ...prev, [field]: true }))
    const formData = new FormData()
    formData.append('file', file)

    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      })
      if (!res.ok) throw new Error('Upload failed')
      const data = await res.json()
      set(field, data.url)
      toast.success(`${file.name} uploaded successfully!`)
    } catch {
      toast.error(`Failed to upload ${file.name}`)
    } finally {
      setUploading(prev => ({ ...prev, [field]: false }))
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (!isEdit && !form.password.trim()) {
      toast.error('Password is required when creating a new staff account.')
      return
    }

    let finalIdCard = form.idCardOrPassport.trim()
    if (form.country.toLowerCase() === 'maldives') {
      finalIdCard = finalIdCard.toUpperCase()
      if (!/^[Aa]\d{6}$/.test(finalIdCard)) {
        toast.error('ID Card must be in the format Axxxxxx (A followed by 6 digits).')
        return
      }
    }

    setLoading(true)
    try {
      const url = isEdit ? `/api/admin/staffs/${staff.id}` : '/api/admin/staffs'
      const method = isEdit ? 'PUT' : 'POST'
      
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, idCardOrPassport: finalIdCard || null }),
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Failed to save staff record')
      }

      const data = await res.json()
      onSave(data)
      toast.success(isEdit ? 'Staff member details updated!' : 'New staff member added!')
    } catch (err: any) {
      toast.error(err.message || 'Error occurred while saving')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: '650px', width: '95%' }}>
        <div className="modal-header">
          <h2 style={{ fontWeight: 700, margin: 0, fontSize: '1rem' }}>
            {isEdit ? 'Edit Staff Member' : 'Add Staff Member'}
          </h2>
          <button className="btn-ghost" style={{ padding: '0.375rem' }} onClick={onClose}>✕</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', maxHeight: '70vh', overflowY: 'auto' }}>
            
            {/* Account Credentials */}
            <div style={{ gridColumn: 'span 2', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem', marginBottom: '0.5rem' }}>
              <h3 style={{ fontSize: '0.85rem', fontWeight: 700, margin: 0, color: 'var(--brand)' }}>1. Account Credentials</h3>
            </div>

            <div className="form-group">
              <label className="form-label">Full Name *</label>
              <input className="input" required value={form.name} onChange={e => set('name', e.target.value)} />
            </div>

            <div className="form-group">
              <label className="form-label">Email Address *</label>
              <input className="input" type="email" required value={form.email} onChange={e => set('email', e.target.value)} />
            </div>

            <div className="form-group">
              <label className="form-label">Phone Number</label>
              <input className="input" value={form.phone} onChange={e => set('phone', e.target.value)} placeholder="e.g. 7771234" pattern="[0-9]*" title="Phone number must contain only digits" />
            </div>

            <div className="form-group">
              <label className="form-label">
                {isEdit ? 'Change Password (leave blank to keep)' : 'Password *'}
              </label>
              <input className="input" type="password" required={!isEdit} value={form.password} onChange={e => set('password', e.target.value)} placeholder={isEdit ? 'New password...' : 'Password...'} />
            </div>

            <div className="form-group">
              <label className="form-label">Country *</label>
              <select className="select" value={form.country} onChange={e => set('country', e.target.value)}>
                {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">
                {form.country.toLowerCase() === 'maldives' ? 'ID Card *' : 'Passport'}
              </label>
              <input 
                className="input" 
                required={form.country.toLowerCase() === 'maldives'} 
                value={form.idCardOrPassport} 
                onChange={e => {
                  const val = e.target.value
                  set('idCardOrPassport', form.country.toLowerCase() === 'maldives' ? val.toUpperCase() : val)
                }} 
                placeholder={form.country.toLowerCase() === 'maldives' ? 'e.g. A123456' : 'Passport number'}
              />
            </div>

            {/* Profile & Position Details */}
            <div style={{ gridColumn: 'span 2', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem', marginBottom: '0.5rem', marginTop: '0.5rem' }}>
              <h3 style={{ fontSize: '0.85rem', fontWeight: 700, margin: 0, color: 'var(--brand)' }}>2. Position & Profile Info</h3>
            </div>

            <div className="form-group">
              <label className="form-label">Staff Type / Position *</label>
              <select className="select" value={form.staffType} onChange={e => set('staffType', e.target.value)}>
                {staffTypesList.map(t => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Monthly Salary (MVR)</label>
              <div style={{ position: 'relative' }}>
                <DollarSign size={15} style={{ position: 'absolute', left: '0.625rem', top: '0.7rem', color: 'var(--text-muted)' }} />
                <input className="input" type="number" min="0" style={{ paddingLeft: '1.75rem' }} value={form.salary} onChange={e => set('salary', e.target.value)} />
              </div>
            </div>

            <div className="form-group" style={{ gridColumn: 'span 2' }}>
              <label className="form-label">Biography / Notes</label>
              <textarea className="input" rows={3} style={{ resize: 'vertical' }} value={form.biography} onChange={e => set('biography', e.target.value)} placeholder="A short biography or additional information..." />
            </div>

            {/* Documents Upload */}
            <div style={{ gridColumn: 'span 2', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem', marginBottom: '0.5rem', marginTop: '0.5rem' }}>
              <h3 style={{ fontSize: '0.85rem', fontWeight: 700, margin: 0, color: 'var(--brand)' }}>3. Documents & Uploads</h3>
            </div>

            {/* Contract / Job Agreement */}
            <div className="form-group">
              <label className="form-label">Contract / Job Agreement</label>
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <label className="btn-secondary" style={{ padding: '0.45rem 0.75rem', fontSize: '0.75rem', cursor: 'pointer', flexShrink: 0 }}>
                  <Upload size={13} /> {uploading.contractUrl ? 'Uploading...' : 'Upload Contract'}
                  <input type="file" style={{ display: 'none' }} accept=".pdf,image/*" onChange={e => handleFileUpload(e, 'contractUrl')} disabled={uploading.contractUrl} />
                </label>
                {form.contractUrl ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.75rem', color: 'var(--text)' }}>
                    <CheckCircle size={14} style={{ color: '#10b981' }} />
                    <a href={form.contractUrl} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--brand)', textDecoration: 'underline' }}>View</a>
                    <button type="button" onClick={() => set('contractUrl', '')} style={{ border: 'none', background: 'none', color: '#ef4444', cursor: 'pointer', padding: 0 }}>✕</button>
                  </div>
                ) : (
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>No contract uploaded</span>
                )}
              </div>
            </div>

            {/* Certificates */}
            <div className="form-group">
              <label className="form-label">Certificates (Degrees/Qualifications)</label>
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <label className="btn-secondary" style={{ padding: '0.45rem 0.75rem', fontSize: '0.75rem', cursor: 'pointer', flexShrink: 0 }}>
                  <Upload size={13} /> {uploading.certificatesUrl ? 'Uploading...' : 'Upload Certs'}
                  <input type="file" style={{ display: 'none' }} accept=".pdf,image/*" onChange={e => handleFileUpload(e, 'certificatesUrl')} disabled={uploading.certificatesUrl} />
                </label>
                {form.certificatesUrl ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.75rem', color: 'var(--text)' }}>
                    <CheckCircle size={14} style={{ color: '#10b981' }} />
                    <a href={form.certificatesUrl} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--brand)', textDecoration: 'underline' }}>View</a>
                    <button type="button" onClick={() => set('certificatesUrl', '')} style={{ border: 'none', background: 'none', color: '#ef4444', cursor: 'pointer', padding: 0 }}>✕</button>
                  </div>
                ) : (
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>No certificates uploaded</span>
                )}
              </div>
            </div>

            {/* Local ID Card */}
            <div className="form-group">
              <label className="form-label">ID Card (Local Staff)</label>
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <label className="btn-secondary" style={{ padding: '0.45rem 0.75rem', fontSize: '0.75rem', cursor: 'pointer', flexShrink: 0 }}>
                  <Upload size={13} /> {uploading.idCardUrl ? 'Uploading...' : 'Upload ID Card'}
                  <input type="file" style={{ display: 'none' }} accept=".pdf,image/*" onChange={e => handleFileUpload(e, 'idCardUrl')} disabled={uploading.idCardUrl} />
                </label>
                {form.idCardUrl ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.75rem', color: 'var(--text)' }}>
                    <CheckCircle size={14} style={{ color: '#10b981' }} />
                    <a href={form.idCardUrl} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--brand)', textDecoration: 'underline' }}>View</a>
                    <button type="button" onClick={() => set('idCardUrl', '')} style={{ border: 'none', background: 'none', color: '#ef4444', cursor: 'pointer', padding: 0 }}>✕</button>
                  </div>
                ) : (
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>No ID card uploaded</span>
                )}
              </div>
            </div>

            {/* Passport */}
            <div className="form-group">
              <label className="form-label">Passport (Foreign Staff)</label>
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <label className="btn-secondary" style={{ padding: '0.45rem 0.75rem', fontSize: '0.75rem', cursor: 'pointer', flexShrink: 0 }}>
                  <Upload size={13} /> {uploading.passportUrl ? 'Uploading...' : 'Upload Passport'}
                  <input type="file" style={{ display: 'none' }} accept=".pdf,image/*" onChange={e => handleFileUpload(e, 'passportUrl')} disabled={uploading.passportUrl} />
                </label>
                {form.passportUrl ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.75rem', color: 'var(--text)' }}>
                    <CheckCircle size={14} style={{ color: '#10b981' }} />
                    <a href={form.passportUrl} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--brand)', textDecoration: 'underline' }}>View</a>
                    <button type="button" onClick={() => set('passportUrl', '')} style={{ border: 'none', background: 'none', color: '#ef4444', cursor: 'pointer', padding: 0 }}>✕</button>
                  </div>
                ) : (
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>No passport uploaded</span>
                )}
              </div>
            </div>

            {/* Police Report */}
            <div className="form-group" style={{ gridColumn: 'span 2' }}>
              <label className="form-label">Police Report</label>
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <label className="btn-secondary" style={{ padding: '0.45rem 0.75rem', fontSize: '0.75rem', cursor: 'pointer', flexShrink: 0 }}>
                  <Upload size={13} /> {uploading.policeReportUrl ? 'Uploading...' : 'Upload Report'}
                  <input type="file" style={{ display: 'none' }} accept=".pdf,image/*" onChange={e => handleFileUpload(e, 'policeReportUrl')} disabled={uploading.policeReportUrl} />
                </label>
                {form.policeReportUrl ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.75rem', color: 'var(--text)' }}>
                    <CheckCircle size={14} style={{ color: '#10b981' }} />
                    <a href={form.policeReportUrl} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--brand)', textDecoration: 'underline' }}>View</a>
                    <button type="button" onClick={() => set('policeReportUrl', '')} style={{ border: 'none', background: 'none', color: '#ef4444', cursor: 'pointer', padding: 0 }}>✕</button>
                  </div>
                ) : (
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>No police report uploaded</span>
                )}
              </div>
            </div>

          </div>
          <div className="modal-footer">
            <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn-primary" disabled={loading || Object.values(uploading).some(Boolean)}>
              {loading ? 'Saving...' : isEdit ? 'Save Changes' : 'Create Staff'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function StaffPaymentsModal({ staff, onClose }: any) {
  const [payments, setPayments] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [uploadingPayId, setUploadingPayId] = useState<number | null>(null)

  const now = new Date()
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`

  const [form, setForm] = useState({
    paymentMonth: currentMonth,
    amount: staff.salary || 0,
    notes: '',
  })

  const set = (k: string, v: any) => setForm(f => ({ ...f, [k]: v }))

  // Fetch payments on load
  async function fetchPayments() {
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/staffs/${staff.id}/payments`)
      if (!res.ok) throw new Error()
      const data = await res.json()
      setPayments(data)
    } catch {
      toast.error('Failed to load salary payment history')
    } finally {
      setLoading(false)
    }
  }

  useState(() => {
    fetchPayments()
  })

  async function handleAddPayment(e: React.FormEvent) {
    e.preventDefault()
    if (!form.paymentMonth) return

    setSubmitting(true)
    try {
      const res = await fetch(`/api/admin/staffs/${staff.id}/payments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Failed')
      }
      const newPay = await res.json()
      setPayments(prev => [newPay, ...prev])
      set(
        'paymentMonth',
        `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`
      )
      set('notes', '')
      toast.success('Salary payment recorded!')
    } catch (err: any) {
      toast.error(err.message || 'Failed to record salary payment')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleReceiptUpload(e: React.ChangeEvent<HTMLInputElement>, paymentId: number) {
    const file = e.target.files?.[0]
    if (!file) return

    setUploadingPayId(paymentId)
    const formData = new FormData()
    formData.append('file', file)

    try {
      // 1. Upload file
      const uploadRes = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      })
      if (!uploadRes.ok) throw new Error('Upload failed')
      const { url } = await uploadRes.json()

      // 2. Save receipt URL to payment record
      const updateRes = await fetch(`/api/admin/staffs/${staff.id}/payments/${paymentId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ receiptUrl: url }),
      })
      if (!updateRes.ok) throw new Error('Update failed')
      const updated = await updateRes.json()

      setPayments(prev => prev.map(p => (p.id === paymentId ? updated : p)))
      toast.success('Payment receipt uploaded! Status is now Awaiting Verification.')
    } catch {
      toast.error('Failed to upload receipt')
    } finally {
      setUploadingPayId(null)
    }
  }

  async function handleClearReceipt(paymentId: number) {
    if (!confirm('Are you sure you want to remove the receipt for this payment?')) return

    try {
      const res = await fetch(`/api/admin/staffs/${staff.id}/payments/${paymentId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ receiptUrl: '' }),
      })
      if (!res.ok) throw new Error()
      const updated = await res.json()
      setPayments(prev => prev.map(p => (p.id === paymentId ? updated : p)))
      toast.success('Receipt removed.')
    } catch {
      toast.error('Failed to clear receipt')
    }
  }

  async function handleDeletePayment(paymentId: number) {
    if (!confirm('Are you sure you want to delete this payment record?')) return

    try {
      const res = await fetch(`/api/admin/staffs/${staff.id}/payments/${paymentId}`, {
        method: 'DELETE',
      })
      if (!res.ok) throw new Error()
      setPayments(prev => prev.filter(p => p.id !== paymentId))
      toast.success('Payment record deleted.')
    } catch {
      toast.error('Failed to delete payment record')
    }
  }

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: '750px', width: '95%' }}>
        <div className="modal-header">
          <h2 style={{ fontWeight: 700, margin: 0, fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <CreditCard size={18} style={{ color: 'var(--brand)' }} /> Salary Payments: {staff.user.name} ({staff.staffType})
          </h2>
          <button className="btn-ghost" style={{ padding: '0.375rem' }} onClick={onClose}>✕</button>
        </div>
        
        <div className="modal-body" style={{ maxHeight: '70vh', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          {/* Record New Payment Form */}
          <div style={{ background: 'var(--surface-2)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--border)' }}>
            <h3 style={{ fontSize: '0.85rem', fontWeight: 700, margin: '0 0 0.75rem', color: 'var(--brand)' }}>Record New Salary Payment</h3>
            <form onSubmit={handleAddPayment} style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'flex-end' }}>
              <div className="form-group" style={{ flex: 1, minWidth: '120px', margin: 0 }}>
                <label className="form-label" style={{ fontSize: '0.75rem', marginBottom: '0.25rem' }}>Month *</label>
                <input className="input" type="month" required value={form.paymentMonth} onChange={e => set('paymentMonth', e.target.value)} style={{ padding: '0.4rem 0.6rem', fontSize: '0.85rem' }} />
              </div>
              <div className="form-group" style={{ flex: 1, minWidth: '120px', margin: 0 }}>
                <label className="form-label" style={{ fontSize: '0.75rem', marginBottom: '0.25rem' }}>Amount (MVR) *</label>
                <input className="input" type="number" min="0" required value={form.amount} onChange={e => set('amount', e.target.value)} style={{ padding: '0.4rem 0.6rem', fontSize: '0.85rem' }} />
              </div>
              <div className="form-group" style={{ flex: 2, minWidth: '180px', margin: 0 }}>
                <label className="form-label" style={{ fontSize: '0.75rem', marginBottom: '0.25rem' }}>Notes</label>
                <input className="input" value={form.notes} onChange={e => set('notes', e.target.value)} placeholder="e.g. Bank transfer, cash paid..." style={{ padding: '0.4rem 0.6rem', fontSize: '0.85rem' }} />
              </div>
              <button type="submit" className="btn-primary" disabled={submitting} style={{ padding: '0.45rem 1rem', height: '36px', fontSize: '0.8rem' }}>
                {submitting ? 'Recording...' : 'Add Record'}
              </button>
            </form>
          </div>

          {/* Payments List */}
          <div>
            <h3 style={{ fontSize: '0.85rem', fontWeight: 700, margin: '0 0 0.75rem' }}>Payment History</h3>
            
            {loading ? (
              <div style={{ display: 'flex', justifyContent: 'center', padding: '2rem' }}>
                <Loader2 size={24} className="animate-spin" style={{ color: 'var(--brand)' }} />
              </div>
            ) : payments.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)', fontSize: '0.85rem', background: 'var(--surface)', border: '1px dashed var(--border)', borderRadius: '8px' }}>
                No salary payments recorded yet.
              </div>
            ) : (
              <div style={{ overflowX: 'auto', border: '1px solid var(--border)', borderRadius: '8px' }}>
                <table className="data-table" style={{ fontSize: '0.8rem' }}>
                  <thead>
                    <tr style={{ background: 'var(--surface-2)' }}>
                      <th>Month</th>
                      <th>Amount</th>
                      <th>Status</th>
                      <th>Notes</th>
                      <th>Receipt</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {payments.map(p => (
                      <tr key={p.id}>
                        <td style={{ fontWeight: 700 }}>{p.paymentMonth}</td>
                        <td>{p.amount?.toLocaleString()} MVR</td>
                        <td>
                          <span className={`badge ${
                            p.status === 'PAID' ? 'badge-green' :
                            p.status === 'PENDING_VERIFICATION' ? 'badge-orange' : 'badge-gray'
                          }`} style={{ fontSize: '0.65rem' }}>
                            {p.status === 'PENDING' ? 'Unpaid' :
                             p.status === 'PENDING_VERIFICATION' ? 'Awaiting Verification' :
                             'Paid & Verified'}
                          </span>
                        </td>
                        <td>{p.notes || '—'}</td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                            {p.receiptUrl ? (
                              <>
                                <a href={p.receiptUrl} target="_blank" rel="noopener noreferrer" className="badge badge-purple" style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '0.15rem' }}>
                                  <FileText size={10} /> View
                                </a>
                                {p.status !== 'PAID' && (
                                  <button type="button" onClick={() => handleClearReceipt(p.id)} style={{ border: 'none', background: 'none', color: '#ef4444', cursor: 'pointer', padding: 0, fontSize: '0.75rem' }} title="Clear receipt">✕</button>
                                )}
                              </>
                            ) : (
                              <label className="btn-secondary" style={{ padding: '0.25rem 0.5rem', fontSize: '0.65rem', cursor: 'pointer' }}>
                                <Upload size={10} /> {uploadingPayId === p.id ? '...' : 'Upload'}
                                <input type="file" style={{ display: 'none' }} accept=".pdf,image/*" onChange={e => handleReceiptUpload(e, p.id)} disabled={uploadingPayId !== null} />
                              </label>
                            )}
                          </div>
                        </td>
                        <td>
                          {p.status !== 'PAID' ? (
                            <button 
                              className="btn-ghost" 
                              style={{ padding: '0.25rem', color: '#ef4444' }}
                              onClick={() => handleDeletePayment(p.id)}
                              title="Delete record"
                            >
                              <Trash2 size={13} />
                            </button>
                          ) : (
                            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>—</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

        </div>
        <div className="modal-footer">
          <button type="button" className="btn-secondary" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  )
}
