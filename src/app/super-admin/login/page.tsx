'use client'

import { useState } from 'react'
import { signIn, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Eye, EyeOff, Loader2, ShieldAlert } from 'lucide-react'

export default function SuperAdminLoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await signIn('credentials', {
        email,
        password,
        redirect: false,
      })

      if (res?.error) {
        toast.error('Invalid email or password')
      } else {
        // Double check session role
        const sessionRes = await fetch('/api/auth/session')
        const session = await sessionRes.json()
        const role = session?.user?.role

        if (role !== 'SUPERADMIN') {
          toast.error('Access Denied: Not a Super Administrator')
          await signOut({ redirect: false })
        } else {
          toast.success('Welcome to the Super Admin Panel')
          router.push('/super-admin')
          router.refresh()
        }
      }
    } catch {
      toast.error('Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '1rem',
    }}>
      <div style={{
        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
        backgroundImage: `radial-gradient(circle at 10% 20%, rgba(99,102,241,0.05) 0%, transparent 50%),
                          radial-gradient(circle at 90% 80%, rgba(79,70,229,0.05) 0%, transparent 50%)`,
        pointerEvents: 'none',
      }} />

      <div style={{ width: '100%', maxWidth: 400, position: 'relative' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{
            width: 64, height: 64, borderRadius: 16,
            background: 'linear-gradient(135deg, #4f46e5, #6366f1)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 1rem',
            boxShadow: '0 8px 24px rgba(79,70,229,0.3)',
          }}>
            <ShieldAlert size={32} style={{ color: '#fff' }} />
          </div>
          <h1 style={{ fontSize: '1.625rem', fontWeight: 900, marginBottom: '0.25rem', color: '#fff' }}>
            Super Admin
          </h1>
          <p style={{ color: '#94a3b8', fontSize: '0.85rem' }}>
            CRM Global Management Portal
          </p>
        </div>

        <div className="card" style={{ padding: '2rem', background: '#1e293b', borderColor: '#334155' }}>
          <h2 style={{ fontWeight: 700, fontSize: '1rem', marginBottom: '1.25rem', color: '#f8fafc' }}>
            Sign in as Super Admin
          </h2>

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label" style={{ color: '#cbd5e1' }}>Super Admin Email</label>
              <input
                type="email"
                className="input"
                placeholder="superadmin@bball.crm"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                autoFocus
                style={{ background: '#0f172a', borderColor: '#334155', color: '#fff' }}
              />
            </div>

            <div className="form-group" style={{ position: 'relative' }}>
              <label className="form-label" style={{ color: '#cbd5e1' }}>Password</label>
              <input
                type={showPassword ? 'text' : 'password'}
                className="input"
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                style={{ paddingRight: '2.75rem', background: '#0f172a', borderColor: '#334155', color: '#fff' }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute', right: '0.75rem', bottom: '0.625rem',
                  background: 'none', border: 'none', color: '#94a3b8',
                  cursor: 'pointer', padding: 0,
                }}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>

            <button
              type="submit"
              className="btn-primary"
              disabled={loading}
              style={{ width: '100%', justifyContent: 'center', padding: '0.75rem', marginTop: '0.5rem', background: '#4f46e5' }}
            >
              {loading ? (
                <><Loader2 size={16} className="animate-spin" /> Authenticating...</>
              ) : 'Access Panel'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
