'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Plus, Search, Edit, Trash2, FileText, CheckCircle, Upload, DollarSign, Briefcase, Paperclip } from 'lucide-react'
import { formatDate } from '@/lib/utils'

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

    setLoading(true)
    try {
      const url = isEdit ? `/api/admin/staffs/${staff.id}` : '/api/admin/staffs'
      const method = isEdit ? 'PUT' : 'POST'
      
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
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
