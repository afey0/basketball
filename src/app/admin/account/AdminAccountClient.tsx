'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Loader2, ShieldCheck, User } from 'lucide-react'

interface Props {
  user: any
}

export default function AdminAccountClient({ user }: Props) {
  const router = useRouter()

  // Profile Form States
  const [name, setName] = useState(user?.name || '')
  const [phone, setPhone] = useState('')
  const [updatingProfile, setUpdatingProfile] = useState(false)
  const [loading, setLoading] = useState(true)

  // Password Form States
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [updatingPassword, setUpdatingPassword] = useState(false)

  useEffect(() => {
    fetch(`/api/users/${user.id}`)
      .then(res => res.json())
      .then(data => {
        if (data.name) setName(data.name)
        if (data.phone) setPhone(data.phone)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [user.id])

  async function handleUpdateProfile(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) {
      toast.error('Name is required.')
      return
    }

    if (phone.trim() && !/^\d+$/.test(phone.trim())) {
      toast.error('Phone number must contain only digits.')
      return
    }

    setUpdatingProfile(true)
    try {
      const res = await fetch(`/api/users/${user.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, phone: phone.trim() || null }),
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Failed to update profile')
      }

      toast.success('Profile updated successfully!')
      router.refresh()
    } catch (err: any) {
      toast.error(err.message || 'Failed to update profile.')
    } finally {
      setUpdatingProfile(false)
    }
  }

  async function handleUpdatePassword(e: React.FormEvent) {
    e.preventDefault()
    if (!currentPassword) {
      toast.error('Current password is required.')
      return
    }
    if (newPassword.length < 6) {
      toast.error('New password must be at least 6 characters.')
      return
    }
    if (newPassword !== confirmPassword) {
      toast.error('New passwords do not match.')
      return
    }

    setUpdatingPassword(true)
    try {
      const res = await fetch(`/api/users/${user.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          password: newPassword,
          currentPassword,
        }),
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Failed to update password')
      }

      toast.success('Password updated successfully!')
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
    } catch (err: any) {
      toast.error(err.message || 'Failed to update password.')
    } finally {
      setUpdatingPassword(false)
    }
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}>
        <Loader2 size={32} className="animate-spin" style={{ color: 'var(--brand)' }} />
      </div>
    )
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
      
      {/* Profile Details Card */}
      <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', height: 'fit-content', marginBottom: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.75rem' }}>
          <User size={18} style={{ color: 'var(--brand)' }} />
          <h2 style={{ fontSize: '1rem', fontWeight: 700, margin: 0 }}>Profile Details</h2>
        </div>

        <form onSubmit={handleUpdateProfile} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div className="form-group">
            <label className="form-label">Email Address (Read-only)</label>
            <input className="input" type="email" disabled value={user?.email || ''} style={{ background: 'var(--surface-2)', cursor: 'not-allowed', color: 'var(--text-muted)' }} />
            <small style={{ color: 'var(--text-muted)', fontSize: '0.7rem', marginTop: '0.25rem', display: 'block' }}>
              Email address is used for secure system login and cannot be altered.
            </small>
          </div>

          <div className="form-group">
            <label className="form-label">Full Name *</label>
            <input className="input" required value={name} onChange={e => setName(e.target.value)} />
          </div>

          <div className="form-group">
            <label className="form-label">Phone Number (optional)</label>
            <input className="input" value={phone} onChange={e => setPhone(e.target.value)} placeholder="e.g. 7771234" />
          </div>

          <button className="btn-primary" type="submit" disabled={updatingProfile} style={{ marginTop: '0.5rem', justifyContent: 'center' }}>
            {updatingProfile ? (
              <>
                <Loader2 size={14} className="animate-spin" style={{ marginRight: '0.35rem' }} />
                Saving Changes...
              </>
            ) : (
              'Save Changes'
            )}
          </button>
        </form>
      </div>

      {/* Security / Password Card */}
      <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', height: 'fit-content', marginBottom: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.75rem' }}>
          <ShieldCheck size={18} style={{ color: 'var(--brand)' }} />
          <h2 style={{ fontSize: '1rem', fontWeight: 700, margin: 0 }}>Security Settings</h2>
        </div>

        <form onSubmit={handleUpdatePassword} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div className="form-group">
            <label className="form-label">Current Password *</label>
            <input className="input" type="password" required value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} placeholder="••••••••" />
          </div>

          <div className="form-group">
            <label className="form-label">New Password *</label>
            <input className="input" type="password" required value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="Min 6 characters" />
          </div>

          <div className="form-group">
            <label className="form-label">Confirm New Password *</label>
            <input className="input" type="password" required value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} placeholder="Confirm new password" />
          </div>

          <button className="btn-primary" type="submit" disabled={updatingPassword} style={{ marginTop: '0.5rem', justifyContent: 'center' }}>
            {updatingPassword ? (
              <>
                <Loader2 size={14} className="animate-spin" style={{ marginRight: '0.35rem' }} />
                Updating Password...
              </>
            ) : (
              'Update Password'
            )}
          </button>
        </form>
      </div>

    </div>
  )
}
