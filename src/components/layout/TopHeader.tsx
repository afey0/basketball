'use client'

import { useState, useEffect } from 'react'
import { signOut } from 'next-auth/react'
import { Bell, Menu, LogOut } from 'lucide-react'
import { useAdminUser } from './AdminUserContext'

interface TopHeaderProps {
  title: string
  subtitle?: string
}

let hasMountedGlobal = false

export default function TopHeader({ title, subtitle }: TopHeaderProps) {
  const { userName, userRole } = useAdminUser()
  const [mounted, setMounted] = useState(hasMountedGlobal)

  useEffect(() => {
    hasMountedGlobal = true
    setMounted(true)
  }, [])

  const initials = userName
    ? userName.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()
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

        {mounted ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
            <div className="avatar" style={{ width: 34, height: 34, fontSize: '0.8rem' }}>
              {initials}
            </div>
            <div className="admin-user-info" style={{ lineHeight: 1.3 }}>
              <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text)' }}>{userName}</div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'capitalize' }}>
                {userRole.toLowerCase()}
              </div>
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
            <div className="skeleton" style={{ width: 34, height: 34, borderRadius: '50%' }} />
            <div className="admin-user-info" style={{ display: 'flex', flexDirection: 'column', gap: '4px', lineHeight: 1.3 }}>
              <div className="skeleton" style={{ width: 55, height: 10 }} />
              <div className="skeleton" style={{ width: 40, height: 8 }} />
            </div>
          </div>
        )}

        <button
          onClick={() => signOut({ callbackUrl: '/auth/login' })}
          title="Sign out"
          className="btn-ghost"
          style={{ padding: '0.5rem', borderRadius: '8px' }}
        >
          <LogOut size={18} />
        </button>
      </div>
    </header>
  )
}
