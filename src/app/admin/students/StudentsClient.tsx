'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Plus, Search, Download, Eye, Edit, Trash2, Filter } from 'lucide-react'
import { formatDate, formatDateForInput, calculateAge, AGE_GROUPS, COUNTRIES } from '@/lib/utils'
import Link from 'next/link'

interface Props { students: any[]; groups: any[]; parents: any[] }

const statusColor = (s: string) => (
  s === 'ACTIVE' ? 'badge-green' : s === 'SUSPENDED' ? 'badge-red' : s === 'DELETED_BY_PARENT' ? 'badge-red' : 'badge-gray'
)

const paymentColor = (s: string | undefined) => (
  !s ? 'badge-gray' : s === 'PAID' ? 'badge-green' : s === 'OVERDUE' ? 'badge-red' : 'badge-yellow'
)

export default function StudentsClient({ students: initial, groups, parents }: Props) {
  const [students, setStudents] = useState(initial)
  const [search, setSearch] = useState('')
  const [filterGroup, setFilterGroup] = useState('')
  const [filterStatus, setFilterStatus] = useState('ACTIVE')
  const [filterAge, setFilterAge] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editStudent, setEditStudent] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  const filtered = students.filter(s => {
    const name = `${s.firstName} ${s.lastName}`.toLowerCase()
    const matchSearch = !search || name.includes(search.toLowerCase())
    const matchGroup = !filterGroup || s.trainingGroupId === parseInt(filterGroup)
    const matchStatus = !filterStatus || filterStatus === 'ALL' || s.status === filterStatus
    const matchAge = !filterAge || s.ageGroup === filterAge
    return matchSearch && matchGroup && matchStatus && matchAge
  })

  async function handleDelete(id: number) {
    if (!confirm('Archive this student? Their records will be preserved.')) return
    const res = await fetch(`/api/students/${id}`, { method: 'DELETE' })
    if (res.ok) {
      setStudents(prev => prev.map(s => s.id === id ? { ...s, status: 'INACTIVE' } : s))
      toast.success('Student archived')
    } else {
      toast.error('Failed to archive student')
    }
  }

  function exportCSV() {
    const rows = [['Name','Age','Age Group','Group','Status','Payment Status','Parent','Enrollment Date']]
    filtered.forEach(s => rows.push([
      `${s.firstName} ${s.lastName}`,
      calculateAge(s.dateOfBirth).toString(),
      s.ageGroup,
      s.trainingGroup?.groupName || '-',
      s.status,
      s.payments?.[0]?.status || 'N/A',
      s.parent?.name || '-',
      formatDate(s.enrollmentDate)
    ]))
    const csv = rows.map(r => r.map(c => `"${c}"`).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = 'students.csv'; a.click()
    URL.revokeObjectURL(url)
    toast.success('Export downloaded')
  }

  return (
    <div>
      {/* Controls */}
      <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.25rem', flexWrap: 'wrap', alignItems: 'center' }}>
        <div className="search-wrapper" style={{ flex: 1, minWidth: 200 }}>
          <Search size={15} className="search-icon" />
          <input className="search-input" style={{ width: '100%' }} placeholder="Search students..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select className="select" style={{ width: 160 }} value={filterGroup} onChange={e => setFilterGroup(e.target.value)}>
          <option value="">All Groups</option>
          {groups.map(g => <option key={g.id} value={g.id}>{g.groupName}</option>)}
        </select>
        <select className="select" style={{ width: 140 }} value={filterAge} onChange={e => setFilterAge(e.target.value)}>
          <option value="">All Ages</option>
          {AGE_GROUPS.map(a => <option key={a} value={a}>{a}</option>)}
        </select>
        <select className="select" style={{ width: 130 }} value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
          <option value="ALL">All Status</option>
          <option value="ACTIVE">Active</option>
          <option value="INACTIVE">Inactive</option>
          <option value="SUSPENDED">Suspended</option>
        </select>
        <button className="btn-secondary" onClick={exportCSV}><Download size={15} /> Export</button>
        <button className="btn-primary" onClick={() => { setEditStudent(null); setShowModal(true) }}>
          <Plus size={15} /> Add Student
        </button>
      </div>

      {/* Stats bar */}
      <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1rem' }}>
        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{filtered.length} students shown</span>
        <span style={{ fontSize: '0.8rem', color: '#166534' }}>{filtered.filter(s=>s.status==='ACTIVE').length} active</span>
        <span style={{ fontSize: '0.8rem', color: '#b91c1c' }}>{filtered.filter(s=>s.payments?.[0]?.status==='OVERDUE').length} overdue</span>
      </div>

      {/* Table */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <table className="data-table">
          <thead>
            <tr>
              <th>Student</th>
              <th>Age / Group</th>
              <th>Training Group</th>
              <th>Parent</th>
              <th>Status</th>
              <th>Payment</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan={7} style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>No students found</td></tr>
            ) : filtered.map(s => (
              <tr key={s.id}>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
                    {s.profilePhoto ? (
                      <img 
                        src={s.profilePhoto} 
                        alt={`${s.firstName} ${s.lastName}`}
                        className="avatar" 
                        style={{ width: 32, height: 32, objectFit: 'cover' }} 
                      />
                    ) : (
                      <div className="avatar" style={{ width: 32, height: 32, fontSize: '0.7rem' }}>
                        {s.firstName[0]}{s.lastName[0]}
                      </div>
                    )}
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>{s.firstName} {s.lastName}</div>
                      {s.jerseyNumber && <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>#{s.jerseyNumber}</div>}
                    </div>
                  </div>
                </td>
                <td>
                  <div style={{ fontSize: '0.875rem' }}>{calculateAge(s.dateOfBirth)} yrs</div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{s.ageGroup}</div>
                </td>
                <td><span style={{ fontSize: '0.875rem' }}>{s.trainingGroup?.groupName || <span style={{color:'var(--text-muted)'}}>—</span>}</span></td>
                <td>
                  <div style={{ fontSize: '0.8rem' }}>{s.parent?.name || '—'}</div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{s.parent?.phone}</div>
                </td>
                <td><span className={`badge ${statusColor(s.status)}`}>{s.status === 'DELETED_BY_PARENT' ? 'Deleted by Parent' : s.status}</span></td>
                <td>
                  <span className={`badge ${paymentColor(s.payments?.[0]?.status)}`}>
                    {s.payments?.[0]?.status || 'N/A'}
                  </span>
                </td>
                <td>
                  <div style={{ display: 'flex', gap: '0.375rem' }}>
                    <Link href={`/admin/students/${s.id}`} className="btn-ghost" style={{ padding: '0.375rem' }}>
                      <Eye size={14} />
                    </Link>
                    <button className="btn-ghost" style={{ padding: '0.375rem' }}
                      onClick={() => { setEditStudent(s); setShowModal(true) }}>
                      <Edit size={14} />
                    </button>
                    <button className="btn-ghost" style={{ padding: '0.375rem', color: '#ef4444' }}
                      onClick={() => handleDelete(s.id)}>
                      <Trash2 size={14} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Student Modal */}
      {showModal && <StudentModal groups={groups} parents={parents} student={editStudent}
        onClose={() => setShowModal(false)}
        onSave={(s) => {
          if (editStudent) setStudents(prev => prev.map(x => x.id === s.id ? s : x))
          else setStudents(prev => [s, ...prev])
          setShowModal(false)
        }} />}
    </div>
  )
}

export function StudentModal({ groups, parents, student, onClose, onSave }: any) {
  const isEdit = !!student
  const [form, setForm] = useState(() => {
    if (student) {
      return {
        ...student,
        profilePhoto: student.profilePhoto || '',
        country: student.country || 'Maldives',
        idCardOrPassport: student.idCardOrPassport || ''
      }
    }
    return {
      firstName: '', lastName: '', dateOfBirth: '', gender: 'MALE',
      ageGroup: 'U-8', trainingGroupId: '', parentId: '', jerseyNumber: '', medicalNotes: '',
      profilePhoto: '', country: 'Maldives', idCardOrPassport: ''
    }
  })
  const [loading, setLoading] = useState(false)
  const [uploadingPhoto, setUploadingPhoto] = useState(false)

  async function handlePhotoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setUploadingPhoto(true)
    const formData = new FormData()
    formData.append('file', file)

    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      })
      if (!res.ok) throw new Error('Upload failed')
      const data = await res.json()
      set('profilePhoto', data.url)
      toast.success('Photo uploaded successfully!')
    } catch {
      toast.error('Failed to upload profile photo')
    } finally {
      setUploadingPhoto(false)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

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
      const url = isEdit ? `/api/students/${student.id}` : '/api/students'
      const method = isEdit ? 'PUT' : 'POST'
      const res = await fetch(url, {
        method, headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          idCardOrPassport: finalIdCard || null,
          trainingGroupId: form.trainingGroupId ? parseInt(form.trainingGroupId) : null,
          parentId: form.parentId ? parseInt(form.parentId) : null,
          jerseyNumber: form.jerseyNumber ? parseInt(form.jerseyNumber) : null,
        }),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Failed to save student')
      }
      const data = await res.json()
      onSave(data)
      toast.success(isEdit ? 'Student updated' : 'Student added')
    } catch (err: any) {
      toast.error(err.message || 'Error saving student')
    } finally {
      setLoading(false)
    }
  }

  const set = (k: string, v: any) => setForm((f: any) => ({ ...f, [k]: v }))

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <h2 style={{ fontWeight: 700, margin: 0, fontSize: '1rem' }}>{isEdit ? 'Edit Student' : 'Add New Student'}</h2>
          <button className="btn-ghost" style={{ padding: '0.375rem' }} onClick={onClose}>✕</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.25rem' }}>
              <div style={{ position: 'relative' }}>
                {form.profilePhoto ? (
                  <img src={form.profilePhoto} alt="Preview" className="avatar" style={{ width: 56, height: 56, borderRadius: '50%', objectFit: 'cover' }} />
                ) : (
                  <div className="avatar" style={{ width: 56, height: 56, fontSize: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%' }}>
                    {form.firstName?.[0] || 'S'}
                  </div>
                )}
              </div>
              <div style={{ flex: 1 }}>
                <label className="form-label" style={{ marginBottom: '0.25rem' }}>Profile Picture</label>
                <input 
                  type="file" 
                  className="input" 
                  accept="image/png, image/jpeg, image/jpg"
                  onChange={handlePhotoUpload}
                  disabled={uploadingPhoto || loading}
                  style={{ padding: '0.35rem 0.5rem', fontSize: '0.8rem' }}
                />
                {uploadingPhoto && <span style={{ fontSize: '0.75rem', color: 'var(--brand)', marginTop: '0.25rem', display: 'block' }}>Uploading...</span>}
              </div>
            </div>
            <div className="grid-2">
              <div className="form-group">
                <label className="form-label">First Name *</label>
                <input className="input" required value={form.firstName} onChange={e => set('firstName', e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Last Name *</label>
                <input className="input" required value={form.lastName} onChange={e => set('lastName', e.target.value)} />
              </div>
            </div>
            <div className="grid-2">
              <div className="form-group">
                <label className="form-label">Date of Birth *</label>
                <input className="input" type="date" required max={formatDateForInput(new Date())} value={formatDateForInput(form.dateOfBirth)} onChange={e => set('dateOfBirth', e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Gender *</label>
                <select className="select" value={form.gender} onChange={e => set('gender', e.target.value)}>
                  <option value="MALE">Male</option>
                  <option value="FEMALE">Female</option>
                </select>
              </div>
            </div>
            <div className="grid-2">
              <div className="form-group">
                <label className="form-label">Age Group *</label>
                <select className="select" value={form.ageGroup} onChange={e => set('ageGroup', e.target.value)}>
                  {AGE_GROUPS.map(a => <option key={a} value={a}>{a}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Jersey Number</label>
                <input className="input" type="number" value={form.jerseyNumber || ''} onChange={e => set('jerseyNumber', e.target.value)} placeholder="#" />
              </div>
            </div>

            <div className="grid-2">
              <div className="form-group">
                <label className="form-label">Country *</label>
                <select className="select" value={form.country} onChange={e => set('country', e.target.value)}>
                  {COUNTRIES.map((c: any) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">
                  {form.country?.toLowerCase() === 'maldives' ? 'ID Card *' : 'Passport'}
                </label>
                <input 
                  className="input" 
                  required={form.country?.toLowerCase() === 'maldives'} 
                  value={form.idCardOrPassport || ''} 
                  onChange={e => {
                    const val = e.target.value
                    set('idCardOrPassport', form.country?.toLowerCase() === 'maldives' ? val.toUpperCase() : val)
                  }} 
                  placeholder={form.country?.toLowerCase() === 'maldives' ? 'e.g. A123456' : 'Passport number'}
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Training Group</label>
              <select className="select" value={form.trainingGroupId || ''} onChange={e => set('trainingGroupId', e.target.value)}>
                <option value="">No group assigned</option>
                {groups.map((g: any) => <option key={g.id} value={g.id}>{g.groupName} ({g.ageGroup})</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Parent / Guardian *</label>
              <select className="select" required value={form.parentId || ''} onChange={e => set('parentId', e.target.value)}>
                <option value="" disabled>Select parent/guardian *</option>
                {parents.map((p: any) => <option key={p.id} value={p.id}>{p.name} ({p.email})</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Medical Notes</label>
              <textarea className="input" rows={2} value={form.medicalNotes || ''} onChange={e => set('medicalNotes', e.target.value)} placeholder="Allergies, conditions..." style={{ resize: 'vertical' }} />
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn-primary" disabled={loading}>{loading ? 'Saving...' : isEdit ? 'Update Student' : 'Add Student'}</button>
          </div>
        </form>
      </div>
    </div>
  )
}
