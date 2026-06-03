'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signOut } from 'next-auth/react'
import { LogOut } from 'lucide-react'

const NAV_LINKS = [
  { href: '/portal', label: '🏠 Dashboard' },
  { href: '/portal/profile', label: '👦 Profile' },
  { href: '/portal/payments', label: '💰 Payments' },
  { href: '/portal/attendance', label: '✅ Attendance' },
  { href: '/portal/schedule', label: '📅 Schedule' },
]

export default function PortalHeader({ user }: { user: any }) {
  const pathname = usePathname()
  const initials = user?.name?.split(' ').map((n: string) => n[0]).join('').slice(0, 2) || 'P'

  return (
    <header style={{
      background: 'var(--surface)',
      borderBottom: '1px solid var(--border)',
      padding: '0 1.5rem',
      height: 64,
      display: 'flex',
      alignItems: 'center',
      gap: '1rem',
      position: 'sticky',
      top: 0,
      zIndex: 40,
    }}>
      {/* Logo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', marginRight: '0.5rem' }}>
        <span style={{ fontSize: 22 }}>🏀</span>
        <span style={{ fontWeight: 800, fontSize: '0.95rem', whiteSpace: 'nowrap', color: 'var(--text)' }}>
          MBC Parent Portal
        </span>
      </div>

      {/* Nav */}
      <nav style={{ 
        display: 'flex', 
        gap: '0.25rem', 
        flex: 1, 
        overflowX: 'auto',
        scrollbarWidth: 'none', /* Firefox */
      }}>
        {NAV_LINKS.map(({ href, label }) => {
          const isActive = pathname === href
          return (
            <Link
              key={href}
              href={href}
              style={{
                padding: '0.4rem 0.75rem',
                borderRadius: 8,
                fontSize: '0.8rem',
                fontWeight: isActive ? 700 : 500,
                color: isActive ? 'var(--brand)' : 'var(--text-muted)',
                textDecoration: 'none',
                background: isActive ? 'var(--brand-light)' : 'transparent',
                transition: 'all 0.15s',
                whiteSpace: 'nowrap',
              }}
            >
              {label}
            </Link>
          )
        })}
      </nav>

      {/* User + logout */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', flexShrink: 0 }}>
        <div style={{
          width: 32, height: 32, borderRadius: '50%',
          background: 'linear-gradient(135deg, var(--brand), #6366f1)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontWeight: 700, fontSize: '0.8rem', color: 'white',
        }}>{initials}</div>
        <span style={{ 
          fontSize: '0.8rem', 
          color: 'var(--text-muted)', 
          maxWidth: 120, 
          overflow: 'hidden', 
          textOverflow: 'ellipsis', 
          whiteSpace: 'nowrap',
          fontWeight: 500
        }}>
          {user?.name}
        </span>
        <button
          onClick={() => signOut({ callbackUrl: '/auth/login' })}
          title="Sign out"
          style={{
            background: 'none', border: 'none', cursor: 'pointer',
            color: 'var(--text-muted)', padding: '0.25rem', display: 'flex', alignItems: 'center',
          }}
        >
          <LogOut size={16} />
        </button>
      </div>
    </header>
  )
}
