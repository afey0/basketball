'use client'

import { useState } from 'react'
import { signOut } from 'next-auth/react'
import { Plus, ShieldAlert, LogOut, Building2, Users, Loader2, Link as LinkIcon, Calendar, Check } from 'lucide-react'
import { toast } from 'sonner'

interface Props {
  initialClubs: any[]
  stats: {
    clubsCount: number
    totalUsers: number
  }
  user: any
}

export default function SuperAdminDashboard({ initialClubs, stats, user }: Props) {
  const [clubs, setClubs] = useState(initialClubs)
  const [showModal, setShowModal] = useState(false)
  const [loading, setLoading] = useState(false)

  // Form State
  const [name, setName] = useState('')
  const [slug, setSlug] = useState('')
  const [adminName, setAdminName] = useState('')
  const [adminEmail, setAdminEmail] = useState('')
  const [adminPassword, setAdminPassword] = useState('')

  // Edit State
  const [showEditModal, setShowEditModal] = useState(false)
  const [editClubId, setEditClubId] = useState<number | null>(null)
  const [editAdminName, setEditAdminName] = useState('')
  const [editAdminEmail, setEditAdminEmail] = useState('')
  const [editAdminPassword, setEditAdminPassword] = useState('')
  const [editClubName, setEditClubName] = useState('')

  const openEditModal = (club: any) => {
    const admin = club.users?.[0]
    setEditClubId(club.id)
    setEditClubName(club.name)
    setEditAdminName(admin?.name || '')
    setEditAdminEmail(admin?.email || '')
    setEditAdminPassword('')
    setShowEditModal(true)
  }

  async function handleEditAdmin(e: React.FormEvent) {
    e.preventDefault()
    if (!editClubId || !editAdminName || !editAdminEmail) {
      toast.error('Admin name and email are required.')
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/super-admin/clubs', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clubId: editClubId,
          adminName: editAdminName,
          adminEmail: editAdminEmail,
          adminPassword: editAdminPassword || undefined,
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to update admin credentials')
      }

      const updatedUser = await res.json()

      // Update local state
      setClubs(prev => prev.map(c => {
        if (c.id === editClubId) {
          return {
            ...c,
            users: [
              {
                ...c.users?.[0],
                name: updatedUser.name,
                email: updatedUser.email
              },
              ...(c.users?.slice(1) || [])
            ]
          }
        }
        return c
      }))

      toast.success(`Administrator for "${editClubName}" updated successfully!`)
      setShowEditModal(false)
    } catch (err: any) {
      toast.error(err.message || 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  // Auto-derive slug from club name
  const handleNameChange = (val: string) => {
    setName(val)
    setSlug(val.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''))
  }

  async function handleCreateClub(e: React.FormEvent) {
    e.preventDefault()
    if (!name || !slug || !adminName || !adminEmail || !adminPassword) {
      toast.error('All fields are required.')
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/super-admin/clubs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, slug, adminName, adminEmail, adminPassword }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to create club')
      }

      const newClub = await res.json()
      
      // Update local state
      setClubs(prev => [
        {
          ...newClub,
          users: [{ name: adminName, email: adminEmail }],
          _count: { users: 1, students: 0, trainingGroups: 0 },
        },
        ...prev,
      ])

      toast.success(`Club "${name}" created successfully!`)
      setShowModal(false)
      
      // Clear form
      setName('')
      setSlug('')
      setAdminName('')
      setAdminEmail('')
      setAdminPassword('')
    } catch (err: any) {
      toast.error(err.message || 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: '#0b0f19', color: '#f8fafc', paddingBottom: '3rem' }}>
      
      {/* Top Header Navigation */}
      <header style={{
        background: '#111827',
        borderBottom: '1px solid #1f2937',
        padding: '1rem 2rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'between',
        justifyContent: 'space-between',
        position: 'sticky',
        top: 0,
        zIndex: 50,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{
            background: 'linear-gradient(135deg, #4f46e5, #6366f1)',
            width: 36, height: 36, borderRadius: '8px',
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            <ShieldAlert size={20} color="white" />
          </div>
          <div>
            <h1 style={{ fontSize: '1.05rem', fontWeight: 800, margin: 0, lineHeight: 1 }}>SaaS Platform</h1>
            <span style={{ fontSize: '0.7rem', color: '#94a3b8', fontWeight: 600 }}>SUPER ADMIN PANEL</span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '0.85rem', fontWeight: 700 }}>{user?.name}</div>
            <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>{user?.email}</div>
          </div>
          <button 
            onClick={() => signOut()}
            style={{
              background: '#1f2937',
              border: 'none',
              borderRadius: '8px',
              width: 36, height: 36,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#ef4444', cursor: 'pointer',
              transition: 'background 0.2s',
            }}
            title="Log Out"
          >
            <LogOut size={16} />
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main style={{ maxWidth: '1200px', margin: '2rem auto', padding: '0 1.5rem' }}>
        
        {/* Metrics Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem', marginBottom: '2.5rem' }}>
          
          <div style={{
            background: 'linear-gradient(135deg, rgba(79, 70, 229, 0.15) 0%, rgba(99, 102, 241, 0.05) 100%)',
            border: '1px solid rgba(79, 70, 229, 0.3)',
            borderRadius: '16px',
            padding: '1.5rem',
            display: 'flex',
            alignItems: 'center',
            gap: '1.25rem',
          }}>
            <div style={{
              background: '#4f46e5',
              width: 48, height: 48, borderRadius: '12px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Building2 size={24} color="white" />
            </div>
            <div>
              <div style={{ fontSize: '0.75rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700 }}>Total Clubs / Tenants</div>
              <div style={{ fontSize: '1.875rem', fontWeight: 900, marginTop: '0.15rem' }}>{clubs.length}</div>
            </div>
          </div>

          <div style={{
            background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(16, 185, 129, 0.05) 100%)',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            borderRadius: '16px',
            padding: '1.5rem',
            display: 'flex',
            alignItems: 'center',
            gap: '1.25rem',
          }}>
            <div style={{
              background: '#10b981',
              width: 48, height: 48, borderRadius: '12px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Users size={24} color="white" />
            </div>
            <div>
              <div style={{ fontSize: '0.75rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700 }}>Active Club Users</div>
              <div style={{ fontSize: '1.875rem', fontWeight: 900, marginTop: '0.15rem' }}>{stats.totalUsers}</div>
            </div>
          </div>

        </div>

        {/* Content Card Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0 }}>Registered Clubs</h2>
            <p style={{ color: '#94a3b8', fontSize: '0.8rem', marginTop: '0.25rem' }}>View, manage, and provision new instances</p>
          </div>
          <button 
            className="btn-primary" 
            onClick={() => setShowModal(true)}
            style={{ background: '#4f46e5', display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.625rem 1.25rem' }}
          >
            <Plus size={16} /> Create New Club
          </button>
        </div>

        {/* Clubs Table Card */}
        <div className="card" style={{ padding: 0, background: '#111827', borderColor: '#1f2937', overflow: 'hidden' }}>
          <table className="data-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#1f2937', color: '#94a3b8', textAlign: 'left', fontSize: '0.75rem', textTransform: 'uppercase' }}>
                <th style={{ padding: '1rem 1.25rem' }}>Club Details</th>
                <th style={{ padding: '1rem 1.25rem' }}>URL Subpath</th>
                <th style={{ padding: '1rem 1.25rem' }}>Administrator</th>
                <th style={{ padding: '1rem 1.25rem' }}>Stats</th>
                <th style={{ padding: '1rem 1.25rem' }}>Created At</th>
                <th style={{ padding: '1rem 1.25rem', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {clubs.map(club => {
                const admin = club.users?.[0]
                return (
                  <tr key={club.id} style={{ borderBottom: '1px solid #1f2937', fontSize: '0.875rem' }}>
                    <td style={{ padding: '1.25rem' }}>
                      <div style={{ fontWeight: 700, fontSize: '0.95rem', color: '#fff' }}>{club.name}</div>
                      <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.15rem' }}>ID: #{club.id}</div>
                    </td>
                    <td style={{ padding: '1.25rem' }}>
                      <span style={{
                        display: 'inline-flex', alignItems: 'center', gap: '0.25rem',
                        background: '#0f172a', border: '1px solid #1f2937',
                        padding: '0.25rem 0.5rem', borderRadius: '6px',
                        fontSize: '0.75rem', fontFamily: 'monospace', color: '#818cf8'
                      }}>
                        <LinkIcon size={10} /> /{club.slug}
                      </span>
                    </td>
                    <td style={{ padding: '1.25rem' }}>
                      {admin ? (
                        <div>
                          <div style={{ fontWeight: 600 }}>{admin.name}</div>
                          <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.1rem' }}>{admin.email}</div>
                        </div>
                      ) : (
                        <span style={{ color: '#ef4444', fontSize: '0.75rem' }}>No admin set</span>
                      )}
                    </td>
                    <td style={{ padding: '1.25rem' }}>
                      <div style={{ display: 'flex', gap: '0.75rem', fontSize: '0.75rem' }}>
                        <span style={{ color: '#cbd5e1' }}>👥 {club._count?.users || 0} users</span>
                        <span style={{ color: '#cbd5e1' }}>👦 {club._count?.students || 0} students</span>
                      </div>
                    </td>
                    <td style={{ padding: '1.25rem', color: '#94a3b8', fontSize: '0.75rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        <Calendar size={12} />
                        {new Date(club.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </div>
                    </td>
                    <td style={{ padding: '1.25rem', textAlign: 'right' }}>
                      <button
                        onClick={() => openEditModal(club)}
                        style={{
                          background: '#1f2937',
                          color: '#f8fafc',
                          border: '1px solid #374151',
                          borderRadius: '6px',
                          padding: '0.375rem 0.75rem',
                          fontSize: '0.75rem',
                          fontWeight: 600,
                          cursor: 'pointer',
                          transition: 'background 0.2s, border-color 0.2s',
                        }}
                        onMouseOver={e => {
                          e.currentTarget.style.background = '#374151';
                          e.currentTarget.style.borderColor = '#4b5563';
                        }}
                        onMouseOut={e => {
                          e.currentTarget.style.background = '#1f2937';
                          e.currentTarget.style.borderColor = '#374151';
                        }}
                      >
                        Edit Admin
                      </button>
                    </td>
                  </tr>
                )
              })}
              {clubs.length === 0 && (
                <tr>
                  <td colSpan={6} style={{ padding: '3rem', textAlign: 'center', color: '#94a3b8' }}>
                    No clubs registered yet. Use the button above to create one.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </main>

      {/* Create Club Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => !loading && setShowModal(false)} style={{ background: 'rgba(0,0,0,0.7)', zIndex: 100 }}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ background: '#1e293b', borderColor: '#334155', maxWidth: '520px' }}>
            <div className="modal-header" style={{ borderBottom: '1px solid #334155', paddingBottom: '1rem' }}>
              <h2 style={{ fontWeight: 800, margin: 0, fontSize: '1.1rem', color: '#fff' }}>Provision New Club</h2>
              <button 
                className="btn-ghost" 
                style={{ padding: '0.375rem', color: '#94a3b8' }} 
                disabled={loading} 
                onClick={() => setShowModal(false)}
              >
                ✕
              </button>
            </div>
            
            <form onSubmit={handleCreateClub}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', padding: '1.5rem 0' }}>
                
                {/* Section 1: Club Info */}
                <div>
                  <h3 style={{ fontSize: '0.75rem', fontWeight: 800, color: '#818cf8', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.75rem' }}>
                    1. Club Details
                  </h3>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.875rem' }}>
                    <div className="form-group">
                      <label className="form-label" style={{ color: '#cbd5e1', fontSize: '0.75rem' }}>Club Name *</label>
                      <input 
                        className="input" 
                        required 
                        value={name} 
                        onChange={e => handleNameChange(e.target.value)} 
                        disabled={loading} 
                        placeholder="e.g. Apex Basketball"
                        style={{ background: '#0f172a', borderColor: '#334155', color: '#fff' }}
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label" style={{ color: '#cbd5e1', fontSize: '0.75rem' }}>URL Slug *</label>
                      <input 
                        className="input" 
                        required 
                        value={slug} 
                        onChange={e => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))} 
                        disabled={loading} 
                        placeholder="e.g. apex"
                        style={{ background: '#0f172a', borderColor: '#334155', color: '#fff' }}
                      />
                    </div>
                  </div>
                </div>

                {/* Section 2: Club Admin credentials */}
                <div style={{ borderTop: '1px solid #334155', paddingTop: '1.25rem', marginTop: '0.5rem' }}>
                  <h3 style={{ fontSize: '0.75rem', fontWeight: 800, color: '#818cf8', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.75rem' }}>
                    2. Club Administrator Account
                  </h3>
                  <div className="form-group">
                    <label className="form-label" style={{ color: '#cbd5e1', fontSize: '0.75rem' }}>Admin Full Name *</label>
                    <input 
                      className="input" 
                      required 
                      value={adminName} 
                      onChange={e => setAdminName(e.target.value)} 
                      disabled={loading} 
                      placeholder="e.g. Ahmed Ali"
                      style={{ background: '#0f172a', borderColor: '#334155', color: '#fff' }}
                    />
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.875rem', marginTop: '0.75rem' }}>
                    <div className="form-group">
                      <label className="form-label" style={{ color: '#cbd5e1', fontSize: '0.75rem' }}>Admin Email *</label>
                      <input 
                        type="email"
                        className="input" 
                        required 
                        value={adminEmail} 
                        onChange={e => setAdminEmail(e.target.value)} 
                        disabled={loading} 
                        placeholder="admin@apex.mv"
                        style={{ background: '#0f172a', borderColor: '#334155', color: '#fff' }}
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label" style={{ color: '#cbd5e1', fontSize: '0.75rem' }}>Admin Password *</label>
                      <input 
                        type="password"
                        className="input" 
                        required 
                        value={adminPassword} 
                        onChange={e => setAdminPassword(e.target.value)} 
                        disabled={loading} 
                        placeholder="Min 6 chars"
                        style={{ background: '#0f172a', borderColor: '#334155', color: '#fff' }}
                      />
                    </div>
                  </div>
                </div>

              </div>
              
              <div className="modal-footer" style={{ borderTop: '1px solid #334155', paddingTop: '1rem' }}>
                <button 
                  type="button" 
                  className="btn-secondary" 
                  disabled={loading} 
                  onClick={() => setShowModal(false)}
                  style={{ background: '#334155', border: 'none', color: '#fff' }}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="btn-primary" 
                  disabled={loading}
                  style={{ background: '#4f46e5', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                >
                  {loading ? (
                    <><Loader2 size={14} className="animate-spin" /> Provisioning...</>
                  ) : (
                    <><Check size={14} /> Provision Club</>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Admin Modal */}
      {showEditModal && (
        <div className="modal-overlay" onClick={() => !loading && setShowEditModal(false)} style={{ background: 'rgba(0,0,0,0.7)', zIndex: 100 }}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ background: '#1e293b', borderColor: '#334155', maxWidth: '500px' }}>
            <div className="modal-header" style={{ borderBottom: '1px solid #334155', paddingBottom: '1rem' }}>
              <h2 style={{ fontWeight: 800, margin: 0, fontSize: '1.1rem', color: '#fff' }}>Edit Admin: {editClubName}</h2>
              <button 
                className="btn-ghost" 
                style={{ padding: '0.375rem', color: '#94a3b8' }} 
                disabled={loading} 
                onClick={() => setShowEditModal(false)}
              >
                ✕
              </button>
            </div>
            
            <form onSubmit={handleEditAdmin}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', padding: '1.5rem 0' }}>
                
                <div className="form-group">
                  <label className="form-label" style={{ color: '#cbd5e1', fontSize: '0.75rem' }}>Admin Full Name *</label>
                  <input 
                    className="input" 
                    required 
                    value={editAdminName} 
                    onChange={e => setEditAdminName(e.target.value)} 
                    disabled={loading} 
                    placeholder="e.g. Ahmed Ali"
                    style={{ background: '#0f172a', borderColor: '#334155', color: '#fff' }}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" style={{ color: '#cbd5e1', fontSize: '0.75rem' }}>Admin Email *</label>
                  <input 
                    type="email"
                    className="input" 
                    required 
                    value={editAdminEmail} 
                    onChange={e => setEditAdminEmail(e.target.value)} 
                    disabled={loading} 
                    placeholder="admin@club.mv"
                    style={{ background: '#0f172a', borderColor: '#334155', color: '#fff' }}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" style={{ color: '#cbd5e1', fontSize: '0.75rem' }}>
                    New Admin Password <span style={{ color: '#94a3b8', fontSize: '0.7rem', fontWeight: 'normal' }}>(leave blank to keep current)</span>
                  </label>
                  <input 
                    type="password"
                    className="input" 
                    value={editAdminPassword} 
                    onChange={e => setEditAdminPassword(e.target.value)} 
                    disabled={loading} 
                    placeholder="Min 6 chars"
                    style={{ background: '#0f172a', borderColor: '#334155', color: '#fff' }}
                  />
                </div>

              </div>
              
              <div className="modal-footer" style={{ borderTop: '1px solid #334155', paddingTop: '1rem' }}>
                <button 
                  type="button" 
                  className="btn-secondary" 
                  disabled={loading} 
                  onClick={() => setShowEditModal(false)}
                  style={{ background: '#334155', border: 'none', color: '#fff' }}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="btn-primary" 
                  disabled={loading}
                  style={{ background: '#4f46e5', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                >
                  {loading ? (
                    <><Loader2 size={14} className="animate-spin" /> Saving...</>
                  ) : (
                    <><Check size={14} /> Save Changes</>
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
