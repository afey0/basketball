'use client'

import { useSession, signOut } from 'next-auth/react'
import { Bell, Menu, LogOut } from 'lucide-react'

interface TopHeaderProps {
  title: string
  subtitle?: string
}

export default function TopHeader({ title, subtitle }: TopHeaderProps) {
  const { data: session } = useSession()
  const user = session?.user as any

  const initials = user?.name
    ? user.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()
    : 'U'

  const toggleSidebar = () => {
    window.dispatchEvent(new CustomEvent('toggle-sidebar'))
  }

  return (
    <header className="top-header">
      <button 
        className="mobile-menu-btn" 
        onClick={toggleSidebar}
        title="Open menu"
        style={{ marginRight: '0.25rem' }}
      >
        <Menu size={20} />
      </button>

      <div style={{ flex: 1 }}>
        <h1 style={{ fontWeight: 800, fontSize: '1.125rem', margin: 0, color: 'var(--text)' }}>{title}</h1>
        {subtitle && <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: 0 }}>{subtitle}</p>}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <button className="btn-ghost" style={{ padding: '0.5rem', borderRadius: '8px' }}>
          <Bell size={18} />
        </button>

        <style dangerouslySetInnerHTML={{ __html: `
          @media (max-width: 480px) {
            .admin-user-info {
              display: none !important;
            }
          }
        `}} />

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
          <div className="avatar" style={{ width: 34, height: 34, fontSize: '0.8rem' }}>
            {initials}
          </div>
          <div className="admin-user-info" style={{ lineHeight: 1.3 }}>
            <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text)' }}>{user?.name || 'Admin'}</div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'capitalize' }}>
              {user?.role?.toLowerCase() || 'admin'}
            </div>
          </div>
          <button
            onClick={() => signOut({ callbackUrl: '/auth/login' })}
            title="Sign out"
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              color: 'var(--text-muted)', padding: '0.25rem', display: 'flex', alignItems: 'center',
              marginLeft: '0.25rem'
            }}
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </header>
  )
}

