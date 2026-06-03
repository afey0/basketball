'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Plus, Search, Edit, Trash2, Shield, User, Award } from 'lucide-react'
import { formatDate } from '@/lib/utils'

interface Props {
  initialUsers: any[]
  currentUserId: number
}

const getRoleBadgeClass = (role: string) => {
  switch (role) {
    case 'ADMIN': return 'badge-purple'
    case 'COACH': return 'badge-blue'
    case 'PARENT': return 'badge-orange'
    default: return 'badge-gray'
  }
}

export default function UsersClient({ initialUsers, currentUserId }: Props) {
  const [users, setUsers] = useState(initialUsers)
  const [search, setSearch] = useState('')
  const [filterRole, setFilterRole] = useState('ALL')
  const [showAddModal, setShowAddModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [editingUser, setEditingUser] = useState<any | null>(null)

  const filtered = users.filter(u => {
    const nameMatch = u.name.toLowerCase().includes(search.toLowerCase()) || 
                      u.email.toLowerCase().includes(search.toLowerCase())
    const roleMatch = filterRole === 'ALL' || u.role === filterRole
    return nameMatch && roleMatch
  })

  async function handleDelete(id: number) {
    if (id === currentUserId) {
      toast.error('You cannot delete your own account.')
      return
    }

    if (!confirm('Are you sure you want to delete this account? Any linked data (coached groups or parent relations) will be unlinked.')) return

    try {
      const res = await fetch(`/api/users/${id}`, { method: 'DELETE' })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Failed to delete')
      }
      setUsers(prev => prev.filter(u => u.id !== id))
      toast.success('Account deleted successfully!')
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete user account')
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
            placeholder="Search by name or email..." 
            value={search} 
            onChange={e => setSearch(e.target.value)} 
          />
        </div>
        <select 
          className="select" 
          style={{ width: 160 }} 
          value={filterRole} 
          onChange={e => setFilterRole(e.target.value)}
        >
          <option value="ALL">All Roles</option>
          <option value="ADMIN">Administrators</option>
          <option value="COACH">Coaches</option>
          <option value="PARENT">Parents</option>
        </select>
        <button className="btn-primary" onClick={() => setShowAddModal(true)}>
          <Plus size={15} /> Add User Account
        </button>
      </div>

      {/* Stats bar */}
      <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1rem' }}>
        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{filtered.length} accounts shown</span>
        <span style={{ fontSize: '0.8rem', color: '#8b5cf6' }}>{filtered.filter(u => u.role === 'ADMIN').length} admins</span>
        <span style={{ fontSize: '0.8rem', color: '#3b82f6' }}>{filtered.filter(u => u.role === 'COACH').length} coaches</span>
        <span style={{ fontSize: '0.8rem', color: '#f97316' }}>{filtered.filter(u => u.role === 'PARENT').length} parents</span>
      </div>

      {/* Table */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <table className="data-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Phone</th>
              <th>Role</th>
              <th>Created Date</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                  No accounts found
                </td>
              </tr>
            ) : filtered.map(u => (
              <tr key={u.id}>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
                    <div className="avatar" style={{ width: 32, height: 32, fontSize: '0.7rem' }}>
                      {u.name?.[0] || 'U'}
                    </div>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>{u.name}</div>
                      {u.id === currentUserId && (
                        <div style={{ fontSize: '0.65rem', color: 'var(--brand)', fontWeight: 600 }}>Current Account</div>
                      )}
                    </div>
                  </div>
                </td>
                <td style={{ fontSize: '0.875rem' }}>{u.email}</td>
                <td style={{ fontSize: '0.875rem' }}>{u.phone || '—'}</td>
                <td>
                  <span className={`badge ${getRoleBadgeClass(u.role)}`}>
                    {u.role}
                  </span>
                </td>
                <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{formatDate(u.createdAt)}</td>
                <td>
                  <div style={{ display: 'flex', gap: '0.375rem' }}>
                    <button 
                      className="btn-ghost" 
                      style={{ padding: '0.375rem' }}
                      onClick={() => { setEditingUser(u); setShowEditModal(true) }}
                      title="Edit account"
                    >
                      <Edit size={14} />
                    </button>
                    {u.id !== currentUserId && (
                      <button 
                        className="btn-ghost" 
                        style={{ padding: '0.375rem', color: '#ef4444' }}
                        onClick={() => handleDelete(u.id)}
                        title="Delete account"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Add User Modal */}
      {showAddModal && (
        <AddUserModal
          onClose={() => setShowAddModal(false)}
          onSave={newUser => {
            setUsers(prev => [newUser, ...prev])
            setShowAddModal(false)
          }}
        />
      )}

      {/* Edit User Modal */}
      {showEditModal && editingUser && (
        <EditUserModal
          user={editingUser}
          currentUserId={currentUserId}
          onClose={() => { setShowEditModal(false); setEditingUser(null) }}
          onSave={updatedUser => {
            setUsers(prev => prev.map(u => u.id === updatedUser.id ? { ...u, ...updatedUser } : u))
            setShowEditModal(false)
            setEditingUser(null)
          }}
        />
      )}
    </div>
  )
}

function AddUserModal({ onClose, onSave }: any) {
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '', role: 'COACH' })
  const [loading, setLoading] = useState(false)
  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.password.trim()) {
      toast.error('Password is required.')
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Failed')
      }
      const data = await res.json()
      onSave(data)
      toast.success('User account created!')
    } catch (err: any) {
      toast.error(err.message || 'Failed to create user account')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <h2 style={{ fontWeight: 700, margin: 0, fontSize: '1rem' }}>Create User Account</h2>
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
              <label className="form-label">User Role *</label>
              <select className="select" value={form.role} onChange={e => set('role', e.target.value)}>
                <option value="ADMIN">Administrator (Full Access)</option>
                <option value="COACH">Coach (Attendance & Schedules)</option>
                <option value="PARENT">Parent (Portal Only)</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Password *</label>
              <input className="input" type="text" required value={form.password} onChange={e => set('password', e.target.value)} placeholder="Type password..." />
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

function EditUserModal({ user, currentUserId, onClose, onSave }: any) {
  const [form, setForm] = useState({ name: user.name, email: user.email, phone: user.phone || '', password: '', role: user.role })
  const [loading, setLoading] = useState(false)
  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await fetch(`/api/users/${user.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          phone: form.phone,
          role: form.role,
          ...(form.password.trim() ? { password: form.password } : {})
        }),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Failed')
      }
      const data = await res.json()
      onSave(data)
      toast.success('Account updated successfully!')
    } catch (err: any) {
      toast.error(err.message || 'Failed to update user account')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <h2 style={{ fontWeight: 700, margin: 0, fontSize: '1rem' }}>Edit User Account</h2>
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
              <label className="form-label">User Role *</label>
              <select 
                className="select" 
                value={form.role} 
                onChange={e => set('role', e.target.value)}
                disabled={user.id === currentUserId}
              >
                <option value="ADMIN">Administrator (Full Access)</option>
                <option value="COACH">Coach (Attendance & Schedules)</option>
                <option value="PARENT">Parent (Portal Only)</option>
              </select>
              {user.id === currentUserId && (
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                  You cannot change the role on your own account.
                </div>
              )}
            </div>
            <div className="form-group">
              <label className="form-label">Change Password (leave blank to keep current)</label>
              <input className="input" type="text" value={form.password} onChange={e => set('password', e.target.value)} placeholder="Type new password..." />
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
