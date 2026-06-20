'use client'

import { signOut } from 'next-auth/react'
import { Bell, Menu, LogOut } from 'lucide-react'
import { useAdminUser } from './AdminUserContext'

interface TopHeaderProps {
  title: string
  subtitle?: string
}

export default function TopHeader({ title, subtitle }: TopHeaderProps) {
  const { userName, userRole } = useAdminUser()

  const initials = userName
    ? userName.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()
    : 'U'

  const toggleSidebar = () => {
    window.dispatchEvent(new CustomEvent('toggle-sidebar'))
  }

  return (
    <header className="top-header">
      <button 
        className="mobile-menu-btn top-header-btn-icon top-header-menu-btn" 
        onClick={toggleSidebar}
        title="Open menu"
      >
        <Menu size={20} />
      </button>

      <div className="top-header-title-container">
        <h1 className="top-header-title">{title}</h1>
        {subtitle && <p className="top-header-subtitle">{subtitle}</p>}
      </div>

      <div className="top-header-actions">
        <button className="btn-ghost top-header-btn-icon">
          <Bell size={18} />
        </button>

        <div className="top-header-profile">
          <div className="avatar avatar-header">
            {initials}
          </div>
          <div className="admin-user-info">
            <div className="top-header-user-name">{userName}</div>
            <div className="top-header-user-role">
              {userRole.toLowerCase()}
            </div>
          </div>
        </div>

        <button
          onClick={() => signOut({ callbackUrl: '/auth/login' })}
          title="Sign out"
          className="btn-ghost top-header-btn-icon"
        >
          <LogOut size={18} />
        </button>
      </div>
    </header>
  )
}
