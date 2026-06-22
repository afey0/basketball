'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard, Users, UserCheck, Calendar,
  CheckSquare, CreditCard, Settings,
  ChevronRight, X, Briefcase, Target, Shield, Trophy
} from 'lucide-react'
import { useAdminUser } from '@/components/layout/AdminUserContext'

const navSections = [
  {
    title: 'Overview',
    items: [
      { href: '/admin', icon: LayoutDashboard, label: 'Dashboard' },
    ]
  },
  {
    title: 'Management',
    items: [
      { href: '/admin/students', icon: Users, label: 'Students' },
      { href: '/admin/parents', icon: UserCheck, label: 'Parents' },
      { href: '/admin/staffs', icon: Briefcase, label: 'Staffs' },
      { href: '/admin/groups', icon: Target, label: 'Training Groups' },
    ]
  },
  {
    title: 'Operations',
    items: [
      { href: '/admin/schedule', icon: Calendar, label: 'Schedule' },
      { href: '/admin/attendance', icon: CheckSquare, label: 'Attendance' },
      { href: '/admin/payments', icon: CreditCard, label: 'Payments' },
    ]
  },
  {
    title: 'System',
    items: [
      { href: '/admin/users', icon: Shield, label: 'User Accounts' },
      { href: '/admin/settings', icon: Settings, label: 'Settings' },
    ]
  }
]

export default function AdminSidebar() {
  const pathname = usePathname()
  const [isOpen, setIsOpen] = useState(false)
  const { userRole } = useAdminUser()

  useEffect(() => {
    const handleToggle = () => setIsOpen(prev => !prev)
    const handleClose = () => setIsOpen(false)
    window.addEventListener('toggle-sidebar', handleToggle)
    window.addEventListener('close-sidebar', handleClose)
    return () => {
      window.removeEventListener('toggle-sidebar', handleToggle)
      window.removeEventListener('close-sidebar', handleClose)
    }
  }, [])

  // Auto-close sidebar on mobile when navigating
  useEffect(() => {
    setIsOpen(false)
  }, [pathname])

  // Filter sections by role
  const filteredSections = navSections.map((section) => {
    const filteredItems = section.items.filter((item) => {
      if (userRole !== 'ADMIN' && userRole !== 'VIEWER') {
        const adminPaths = ['/admin/parents', '/admin/payments', '/admin/users', '/admin/settings', '/admin/staffs']
        return !adminPaths.includes(item.href)
      }
      return true
    })
    return { ...section, items: filteredItems }
  }).filter((section) => section.items.length > 0)

  return (
    <>
      {/* Sidebar Backdrop Overlay on Mobile */}
      <div 
        className={`sidebar-overlay ${isOpen ? 'open' : ''}`}
        onClick={() => setIsOpen(false)}
      />

      <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
        {/* Logo */}
        <div className="sidebar-logo" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{
              width: 38, height: 38, borderRadius: 10,
              background: 'linear-gradient(135deg, #4f46e5, #6366f1)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0
            }}>
              <Trophy size={20} style={{ color: '#fff' }} />
            </div>
            <div>
              <div style={{ fontWeight: 800, fontSize: '0.9rem', lineHeight: 1.2, color: 'var(--text)' }}>MBC CRM</div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                {userRole === 'ADMIN' ? 'Admin Portal' : 'Staff Portal'}
              </div>
            </div>
          </div>
          
          <button
            onClick={() => setIsOpen(false)}
            className="mobile-close-btn"
            title="Close menu"
          >
            <X size={18} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="sidebar-nav">
          {filteredSections.map((section) => (
            <div key={section.title} className="sidebar-section">
              <div className="sidebar-section-title">{section.title}</div>
              {section.items.map((item) => {
                const isActive = pathname === item.href || 
                  (item.href !== '/admin' && pathname.startsWith(item.href))
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`sidebar-link ${isActive ? 'active' : ''}`}
                  >
                    <item.icon size={17} />
                    <span style={{ flex: 1 }}>{item.label}</span>
                    {isActive && <ChevronRight size={14} />}
                  </Link>
                )
              })}
            </div>
          ))}
        </nav>

      </aside>
    </>
  )
}
