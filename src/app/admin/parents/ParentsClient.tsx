'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Plus, Mail, Phone, User, ChevronDown, ChevronUp, Edit, Trash2 } from 'lucide-react'

interface Props { parents: any[] }

export default function ParentsClient({ parents: initial }: Props) {
  const [parents, setParents] = useState(initial)
  const [showModal, setShowModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [editingParent, setEditingParent] = useState<any | null>(null)
  const [expanded, setExpanded] = useState<number | null>(null)

  async function handleDeleteParent(id: number) {
    if (!confirm('Are you sure you want to delete this parent account? Any linked students will be unlinked.')) return
    try {
      const res = await fetch(`/api/parents/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to delete')
      setParents(prev => prev.filter(p => p.id !== id))
      toast.success('Parent account deleted')
    } catch {
      toast.error('Failed to delete parent account')
    }
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1.25rem' }}>
        <button className="btn-primary" onClick={() => setShowModal(true)}>
          <Plus size={15} /> Add Parent Account
        </button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        {parents.map(p => (
          <div key={p.id} className="card" style={{ padding: '1rem 1.25rem' }}>
            <div
              style={{ display: 'flex', alignItems: 'center', gap: '1rem', cursor: 'pointer' }}
              onClick={() => setExpanded(expanded === p.id ? null : p.id)}
            >
              <div className="avatar">{p.name?.[0]}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700 }}>{p.name}</div>
                <div style={{ display: 'flex', gap: '1rem', marginTop: '0.2rem' }}>
                  <span style={{ fontSize: '0.8rem', color: '#8B8BA7', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    <Mail size={12} /> {p.email}
                  </span>
                  {p.phone && (
                    <span style={{ fontSize: '0.8rem', color: '#8B8BA7', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                      <Phone size={12} /> {p.phone}
                    </span>
                  )}
                </div>
              </div>
              <span className="badge badge-orange">{p.parentStudents.length} child{p.parentStudents.length !== 1 ? 'ren' : ''}</span>
              <div style={{ display: 'flex', gap: '0.375rem', marginRight: '0.5rem' }} onClick={e => e.stopPropagation()}>
                <button className="btn-ghost" style={{ padding: '0.35rem' }} onClick={() => { setEditingParent(p); setShowEditModal(true) }} title="Edit parent">
                  <Edit size={14} />
                </button>
                <button className="btn-ghost" style={{ padding: '0.35rem', color: '#ef4444' }} onClick={() => handleDeleteParent(p.id)} title="Delete parent">
                  <Trash2 size={14} />
                </button>
              </div>
              {expanded === p.id ? <ChevronUp size={16} style={{ color: '#8B8BA7' }} /> : <ChevronDown size={16} style={{ color: '#8B8BA7' }} />}
            </div>

            {expanded === p.id && p.parentStudents.length > 0 && (
              <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#8B8BA7', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.5rem' }}>
                  Children
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {p.parentStudents.map((s: any) => (
                    <div key={s.id} style={{
                      display: 'flex', alignItems: 'center', gap: '0.75rem',
                      padding: '0.5rem 0.75rem',
                      background: 'rgba(255,107,0,0.06)', borderRadius: 8,
                    }}>
                      <div className="avatar" style={{ width: 28, height: 28, fontSize: '0.65rem' }}>
                        {s.firstName[0]}{s.lastName[0]}
                      </div>
                      <div style={{ flex: 1 }}>
                        <span style={{ fontWeight: 600, fontSize: '0.875rem' }}>{s.firstName} {s.lastName}</span>
                        <span style={{ fontSize: '0.75rem', color: '#8B8BA7', marginLeft: '0.5rem' }}>
                          {s.trainingGroup?.groupName || 'No group'}
                        </span>
                      </div>
                      <span className={`badge ${s.status === 'ACTIVE' ? 'badge-green' : 'badge-gray'}`}>{s.status}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
        {parents.length === 0 && (
          <div className="empty-state">
            <div className="empty-state-icon"><User /></div>
            <div className="empty-state-title">No parent accounts yet</div>
          </div>
        )}
      </div>

      {showModal && (
        <AddParentModal
          onClose={() => setShowModal(false)}
          onSave={p => { setParents(prev => [p, ...prev]); setShowModal(false) }}
        />
      )}

      {showEditModal && editingParent && (
        <EditParentModal
          parent={editingParent}
          onClose={() => { setShowEditModal(false); setEditingParent(null) }}
          onSave={updated => {
            setParents(prev => prev.map(p => p.id === updated.id ? { ...p, ...updated } : p))
            setShowEditModal(false)
            setEditingParent(null)
          }}
        />
      )}
    </div>
  )
}

function AddParentModal({ onClose, onSave }: any) {
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: 'parent123' })
  const [loading, setLoading] = useState(false)
  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await fetch('/api/parents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Failed')
      }
      const data = await res.json()
      onSave({ ...data, parentStudents: [] })
      toast.success('Parent account created!')
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <h2 style={{ fontWeight: 700, margin: 0, fontSize: '1rem' }}>Create Parent Account</h2>
          <button className="btn-ghost" style={{ padding: '0.375rem' }} onClick={onClose}>✕</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
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
              <input className="input" value={form.phone} onChange={e => set('phone', e.target.value)} placeholder="+960 ..." />
            </div>
            <div className="form-group">
              <label className="form-label">Initial Password</label>
              <input className="input" value={form.password} onChange={e => set('password', e.target.value)} />
              <div style={{ fontSize: '0.75rem', color: '#8B8BA7', marginTop: '0.25rem' }}>
                Parent should change this after first login
              </div>
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? 'Creating...' : 'Create Account'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function EditParentModal({ parent, onClose, onSave }: any) {
  const [form, setForm] = useState({ name: parent.name, email: parent.email, phone: parent.phone || '', password: '' })
  const [loading, setLoading] = useState(false)
  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await fetch(`/api/parents/${parent.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          phone: form.phone,
          ...(form.password ? { password: form.password } : {})
        }),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Failed')
      }
      const data = await res.json()
      onSave(data)
      toast.success('Parent account updated!')
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <h2 style={{ fontWeight: 700, margin: 0, fontSize: '1rem' }}>Edit Parent Account</h2>
          <button className="btn-ghost" style={{ padding: '0.375rem' }} onClick={onClose}>✕</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
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
              <input className="input" value={form.phone} onChange={e => set('phone', e.target.value)} placeholder="+960 ..." />
            </div>
            <div className="form-group">
              <label className="form-label">Change Password (leave blank to keep current)</label>
              <input className="input" value={form.password} onChange={e => set('password', e.target.value)} placeholder="New password..." />
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
