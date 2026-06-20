'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Plus, Edit, Trash2, Camera, Loader2, AlertCircle, FileText, Upload } from 'lucide-react'
import { AGE_GROUPS, formatDateForInput } from '@/lib/utils'

interface Props {
  initialChildren: any[]
}

export default function ProfileClient({ initialChildren }: Props) {
  const [children, setChildren] = useState(initialChildren)
  const [showModal, setShowModal] = useState(false)
  const [editChild, setEditChild] = useState<any | null>(null)
  const [loading, setLoading] = useState(false)

  // Duplicate prompt states
  const [showDupPrompt, setShowDupPrompt] = useState(false)
  const [dupChildData, setDupChildData] = useState<any | null>(null)
  const [pendingForm, setPendingForm] = useState<any | null>(null)

  function fmtDate(d: any) {
    if (!d) return '—'
    return new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })
  }

  function calcAge(dob: any) {
    if (!dob) return 0
    const d = new Date(dob)
    const t = new Date()
    let age = t.getFullYear() - d.getFullYear()
    if (t.getMonth() < d.getMonth() || (t.getMonth() === d.getMonth() && t.getDate() < d.getDate())) age--
    return age
  }

  async function handleDelete(id: number) {
    if (!confirm('Are you sure you want to delete this child profile? All historical data will be preserved under the admin panel, but the profile will be removed from your portal.')) return
    try {
      const res = await fetch(`/api/portal/children/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to delete')
      setChildren(prev => prev.filter(c => c.id !== id))
      toast.success('Child profile removed successfully.')
    } catch {
      toast.error('Failed to remove child profile.')
    }
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1.5rem' }}>
        <button className="btn-primary" onClick={() => { setEditChild(null); setShowModal(true) }}>
          <Plus size={15} /> Add Child Profile
        </button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        {children.map(child => (
          <div key={child.id} className="card" style={{ marginBottom: 0 }}>
            <div style={{ display: 'flex', gap: '1.25rem', alignItems: 'flex-start', flexWrap: 'wrap' }}>
              <div style={{ position: 'relative', flexShrink: 0 }}>
                {child.profilePhoto ? (
                  <img
                    src={child.profilePhoto}
                    alt={`${child.firstName} ${child.lastName}`}
                    style={{ width: 72, height: 72, borderRadius: 18, objectFit: 'cover' }}
                  />
                ) : (
                  <div style={{
                    width: 72, height: 72, borderRadius: 18,
                    background: child.gender === 'FEMALE' ? 'linear-gradient(135deg,#ec4899,#f43f5e)' : 'linear-gradient(135deg,var(--brand),#6366f1)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontWeight: 800, fontSize: '1.5rem', color: 'white',
                  }}>{child.firstName[0]}{child.lastName[0]}</div>
                )}
              </div>
              <div style={{ flex: 1, minWidth: 200 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <h2 style={{ fontWeight: 800, fontSize: '1.25rem', margin: 0 }}>
                    {child.firstName} {child.lastName}
                    {child.jerseyNumber && <span style={{ fontSize: '1rem', color: 'var(--brand)', marginLeft: '0.5rem' }}>#{child.jerseyNumber}</span>}
                  </h2>
                  <div style={{ display: 'flex', gap: '0.375rem', alignItems: 'center' }}>
                    {child.idCardUrl && (
                      <a 
                        href={child.idCardUrl} 
                        target="_blank" 
                        rel="noreferrer" 
                        className="btn-ghost" 
                        style={{ padding: '0.35rem', color: 'var(--brand)', display: 'inline-flex', alignItems: 'center' }} 
                        title="View ID Card / Passport"
                      >
                        <FileText size={14} />
                      </a>
                    )}
                    <button className="btn-ghost" style={{ padding: '0.35rem' }} onClick={() => { setEditChild(child); setShowModal(true) }} title="Edit child">
                      <Edit size={14} />
                    </button>
                    <button className="btn-ghost" style={{ padding: '0.35rem', color: '#ef4444' }} onClick={() => handleDelete(child.id)} title="Delete child">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem', flexWrap: 'wrap' }}>
                  <span className={`badge ${child.status === 'ACTIVE' ? 'badge-green' : 'badge-gray'}`}>{child.status}</span>
                  <span className="badge badge-purple">{child.ageGroup}</span>
                  <span className="badge badge-blue">{child.gender}</span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px,1fr))', gap: '0.875rem', marginTop: '1rem' }}>
                  {[
                    ['Date of Birth', fmtDate(child.dateOfBirth)],
                    ['Age', `${calcAge(child.dateOfBirth)} years`],
                    ['Training Group', child.trainingGroup?.groupName || 'No group assigned'],
                    ['Enrolled', fmtDate(child.enrollmentDate)]
                  ].map(([label, value]) => (
                    <div key={label}>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</div>
                      <div style={{ fontWeight: 600, fontSize: '0.875rem', marginTop: '0.2rem' }}>{value}</div>
                    </div>
                  ))}
                </div>
                {child.medicalNotes && (
                  <div className="alert alert-orange" style={{ marginTop: '1rem', padding: '0.75rem 1rem' }}>
                    ⚠️ Medical Notes: {child.medicalNotes}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
        {children.length === 0 && (
          <div className="empty-state">
            <div className="empty-state-icon">👦</div>
            <div className="empty-state-title">No children added yet</div>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginTop: '0.5rem' }}>Create a child profile using the button above.</p>
          </div>
        )}
      </div>

      {/* Child Form Modal */}
      {showModal && (
        <ChildModal
          child={editChild}
          onClose={() => setShowModal(false)}
          onSave={async (savedChild, formPayload) => {
            // First check if backend reported duplicate
            if (savedChild.duplicate) {
              setDupChildData(savedChild.existingChild)
              setPendingForm(formPayload)
              setShowModal(false)
              setShowDupPrompt(true)
              return
            }
            if (editChild) {
              setChildren(prev => prev.map(c => c.id === savedChild.id ? savedChild : c))
            } else {
              setChildren(prev => [...prev, savedChild])
            }
            setShowModal(false)
          }}
        />
      )}

      {/* Duplicate choice prompt Modal */}
      {showDupPrompt && dupChildData && (
        <DuplicatePromptModal
          childName={`${dupChildData.firstName} ${dupChildData.lastName}`}
          onClose={() => {
            setShowDupPrompt(false)
            setDupChildData(null)
            setPendingForm(null)
          }}
          onRestore={async () => {
            setLoading(true)
            try {
              const res = await fetch('/api/portal/children', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  ...pendingForm,
                  confirmRestore: true,
                })
              })
              if (!res.ok) throw new Error()
              const restoredChild = await res.json()
              setChildren(prev => [...prev, restoredChild])
              toast.success('Child profile restored successfully!')
              setShowDupPrompt(false)
              setDupChildData(null)
              setPendingForm(null)
            } catch {
              toast.error('Failed to restore child profile.')
            } finally {
              setLoading(false)
            }
          }}
          onForceCreate={async () => {
            setLoading(true)
            try {
              const res = await fetch('/api/portal/children', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  ...pendingForm,
                  forceCreate: true,
                })
              })
              if (!res.ok) throw new Error()
              const newChild = await res.json()
              setChildren(prev => [...prev, newChild])
              toast.success('New separate child profile created!')
              setShowDupPrompt(false)
              setDupChildData(null)
              setPendingForm(null)
            } catch {
              toast.error('Failed to create separate child profile.')
            } finally {
              setLoading(false)
            }
          }}
        />
      )}
    </div>
  )
}

function ChildModal({ child, onClose, onSave }: any) {
  const isEdit = !!child
  const [form, setForm] = useState(
    child
      ? {
          firstName: child.firstName,
          lastName: child.lastName,
          dateOfBirth: child.dateOfBirth ? new Date(child.dateOfBirth).toISOString().split('T')[0] : '',
          gender: child.gender,
          ageGroup: child.ageGroup,
          jerseyNumber: child.jerseyNumber || '',
          medicalNotes: child.medicalNotes || '',
          profilePhoto: child.profilePhoto || '',
          idCardUrl: child.idCardUrl || '',
        }
      : {
          firstName: '',
          lastName: '',
          dateOfBirth: '',
          gender: 'MALE',
          ageGroup: 'U-8',
          jerseyNumber: '',
          medicalNotes: '',
          profilePhoto: '',
          idCardUrl: '',
        }
  )
  const [uploading, setUploading] = useState(false)
  const [uploadingId, setUploadingId] = useState(false)
  const [saving, setSaving] = useState(false)
  const set = (k: string, v: any) => setForm(f => ({ ...f, [k]: v }))

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    const formData = new FormData()
    formData.append('file', file)

    try {
      const res = await fetch('/api/upload', { method: 'POST', body: formData })
      if (!res.ok) throw new Error()
      const data = await res.json()
      set('profilePhoto', data.url)
      toast.success('Photo uploaded!')
    } catch {
      toast.error('Failed to upload photo.')
    } finally {
      setUploading(false)
    }
  }

  async function handleIdCardChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadingId(true)
    const formData = new FormData()
    formData.append('file', file)

    try {
      const res = await fetch('/api/upload', { method: 'POST', body: formData })
      if (!res.ok) throw new Error()
      const data = await res.json()
      set('idCardUrl', data.url)
      toast.success('ID Card / Passport uploaded!')
    } catch {
      toast.error('Failed to upload ID Card / Passport.')
    } finally {
      setUploadingId(false)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      const url = isEdit ? `/api/portal/children/${child.id}` : '/api/portal/children'
      const method = isEdit ? 'PUT' : 'POST'
      const payload = {
        ...form,
        jerseyNumber: form.jerseyNumber ? parseInt(String(form.jerseyNumber)) : null,
      }
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (res.status === 409) {
        const data = await res.json()
        onSave(data, payload) // trigger duplicate prompt
        return
      }

      if (!res.ok) throw new Error(await res.text())
      const savedChild = await res.json()
      onSave(savedChild)
      toast.success(isEdit ? 'Child profile updated!' : 'Child profile created!')
    } catch (err: any) {
      toast.error(err.message || 'Failed to save child profile.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: 540 }}>
        <div className="modal-header">
          <h2 style={{ fontWeight: 700, margin: 0, fontSize: '1rem' }}>{isEdit ? 'Edit Child Profile' : 'Add Child Profile'}</h2>
          <button className="btn-ghost" style={{ padding: '0.375rem' }} onClick={onClose}>✕</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {/* Photo upload field */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '1.5rem', gap: '0.5rem' }}>
              <div style={{ position: 'relative', width: 80, height: 80, borderRadius: 20, overflow: 'hidden', border: '2px solid var(--border)', background: 'var(--surface-2)' }}>
                {form.profilePhoto ? (
                  <img src={form.profilePhoto} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyItems: 'center', justifyContent: 'center' }}>
                    <Camera size={24} style={{ color: 'var(--text-muted)' }} />
                  </div>
                )}
                {uploading && (
                  <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Loader2 size={16} className="animate-spin" style={{ color: 'white' }} />
                  </div>
                )}
              </div>
              <label className="btn-secondary" style={{ fontSize: '0.75rem', cursor: 'pointer', padding: '0.375rem 0.75rem' }}>
                Change Photo
                <input type="file" accept="image/*" onChange={handleFileChange} style={{ display: 'none' }} />
              </label>
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
                <input className="input" type="date" required max={formatDateForInput(new Date())} value={form.dateOfBirth} onChange={e => set('dateOfBirth', e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Gender *</label>
                <select className="select" required value={form.gender} onChange={e => set('gender', e.target.value)}>
                  <option value="MALE">Male</option>
                  <option value="FEMALE">Female</option>
                </select>
              </div>
            </div>

            <div className="grid-2">
              <div className="form-group">
                <label className="form-label">Age Group *</label>
                <select className="select" required value={form.ageGroup} onChange={e => set('ageGroup', e.target.value)}>
                  {AGE_GROUPS.map(g => (
                    <option key={g} value={g}>{g}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Jersey Number (optional)</label>
                <input className="input" type="number" placeholder="e.g. 23" value={form.jerseyNumber} onChange={e => set('jerseyNumber', e.target.value)} />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Medical Notes / Conditions (optional)</label>
              <textarea
                className="input"
                style={{ minHeight: 80, resize: 'vertical', fontFamily: 'inherit', padding: '0.5rem 0.75rem' }}
                placeholder="List any allergies, illnesses, or medical conditions..."
                value={form.medicalNotes}
                onChange={e => set('medicalNotes', e.target.value)}
              />
            </div>

            <div className="form-group" style={{ marginBottom: '1rem' }}>
              <label className="form-label">ID Card / Passport (PDF or Image)</label>
              <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                <label className="btn-secondary" style={{ fontSize: '0.8rem', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '0.375rem', padding: '0.5rem 0.875rem' }}>
                  {uploadingId ? (
                    <><Loader2 size={14} className="animate-spin" /> Uploading...</>
                  ) : (
                    <><Upload size={14} /> {form.idCardUrl ? 'Change File' : 'Upload File'}</>
                  )}
                  <input type="file" accept="image/*,application/pdf" onChange={handleIdCardChange} style={{ display: 'none' }} disabled={uploadingId} />
                </label>
                {form.idCardUrl && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem' }}>
                    <span style={{ color: '#166534', fontWeight: 600 }}>✓ Uploaded</span>
                    <a href={form.idCardUrl} target="_blank" rel="noreferrer" className="btn-ghost" style={{ padding: '0.25rem 0.5rem', display: 'inline-flex', alignItems: 'center', gap: '0.25rem', color: 'var(--brand)', textDecoration: 'none' }}>
                      <FileText size={14} /> View File
                    </a>
                  </div>
                )}
              </div>
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn-primary" disabled={saving || uploading || uploadingId}>
              {saving ? 'Saving...' : 'Save Profile'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function DuplicatePromptModal({ childName, onClose, onRestore, onForceCreate }: any) {
  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: 440, padding: '1.5rem' }}>
        <div style={{ display: 'flex', gap: '0.875rem', alignItems: 'flex-start' }}>
          <div style={{
            background: 'rgba(249,115,22,0.1)', color: 'var(--brand)',
            width: 40, height: 40, borderRadius: '50%',
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
          }}>
            <AlertCircle size={20} />
          </div>
          <div>
            <h3 style={{ fontWeight: 700, fontSize: '1.05rem', margin: '0 0 0.5rem' }}>Duplicate Child Profile Found</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', lineHeight: '1.4' }}>
              A previously deleted child named <strong style={{ color: 'var(--text)' }}>{childName}</strong> is linked to your account.
            </p>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', lineHeight: '1.4', marginTop: '0.5rem' }}>
              Would you like to **restore the existing profile** (re-linking all past attendance and payment history) or **create a new separate child profile**?
            </p>
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '1.5rem' }}>
          <button className="btn-primary" onClick={onRestore} style={{ justifyContent: 'center' }}>
            🔄 Restore Existing Profile (Recommended)
          </button>
          <button className="btn-secondary" onClick={onForceCreate} style={{ justifyContent: 'center' }}>
            ➕ Create New Separate Profile
          </button>
          <button className="btn-ghost" onClick={onClose} style={{ justifyContent: 'center', fontSize: '0.8rem', padding: '0.5rem' }}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}
