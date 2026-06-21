'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signOut } from 'next-auth/react'
import { 
  LogOut, 
  User as UserIcon, 
  ChevronDown, 
  Shield, 
  FileText, 
  Building2, 
  HelpCircle, 
  Phone, 
  Mail, 
  MapPin, 
  Loader2, 
  X,
  LayoutDashboard,
  CreditCard,
  CheckSquare,
  Calendar,
  Trophy
} from 'lucide-react'

const NAV_LINKS = [
  { href: '/portal', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/portal/profile', icon: UserIcon, label: 'Profile' },
  { href: '/portal/payments', icon: CreditCard, label: 'Payments' },
  { href: '/portal/attendance', icon: CheckSquare, label: 'Attendance' },
  { href: '/portal/schedule', icon: Calendar, label: 'Schedule' },
]

export default function PortalHeader({ user }: { user: any }) {
  const pathname = usePathname()
  const initials = user?.name?.split(' ').map((n: string) => n[0]).join('').slice(0, 2) || 'P'
  
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [showClubModal, setShowClubModal] = useState(false)
  const [clubSettings, setClubSettings] = useState<any>(null)
  const [loadingClub, setLoadingClub] = useState(false)
  
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  async function fetchClubSettings() {
    if (clubSettings) return
    setLoadingClub(true)
    try {
      const res = await fetch('/api/settings')
      if (res.ok) {
        const data = await res.json()
        setClubSettings(data)
      }
    } catch (err) {
      console.error('Failed to load club settings:', err)
    } finally {
      setLoadingClub(false)
    }
  }

  const handleOpenClubModal = () => {
    setDropdownOpen(false)
    setShowClubModal(true)
    fetchClubSettings()
  }

  const dropdownItemStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '0.625rem',
    padding: '0.6rem 1rem',
    fontSize: '0.8rem',
    color: 'var(--text)',
    textDecoration: 'none',
    background: 'none',
    border: 'none',
    width: '100%',
    textAlign: 'left' as const,
    cursor: 'pointer',
    transition: 'all 0.15s ease',
    fontWeight: 500,
  }

  return (
    <header className="portal-header" style={{
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
      <style>{`
        .dropdown-item:hover {
          background: var(--brand-light) !important;
          color: var(--brand) !important;
        }
        .portal-user-trigger:hover {
          background: var(--surface-2) !important;
        }
      `}</style>

      {/* Logo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginRight: '0.25rem' }}>
        <Trophy size={20} style={{ color: 'var(--brand)' }} />
        <span className="portal-logo-text" style={{ fontWeight: 800, fontSize: '0.95rem', whiteSpace: 'nowrap', color: 'var(--text)' }}>
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
        {NAV_LINKS.map(({ href, icon: IconComponent, label }) => {
          const isActive = pathname === href
          return (
            <Link
              key={href}
              href={href}
              className="portal-nav-link"
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
                display: 'flex',
                alignItems: 'center',
              }}
            >
              <IconComponent size={15} />
              <span className="portal-nav-label" style={{ marginLeft: '0.35rem' }}>{label}</span>
            </Link>
          )
        })}
      </nav>

      {/* User + dropdown trigger */}
      <div 
        ref={dropdownRef} 
        style={{ position: 'relative', display: 'flex', alignItems: 'center', flexShrink: 0 }}
      >
        <button
          onClick={() => setDropdownOpen(!dropdownOpen)}
          style={{
            background: 'none',
            border: 'none',
            padding: '0.35rem 0.6rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            color: 'var(--text)',
            borderRadius: 8,
            transition: 'background 0.15s',
          }}
          className="portal-user-trigger"
        >
          <div style={{
            width: 32, height: 32, borderRadius: '50%',
            background: 'linear-gradient(135deg, var(--brand), #6366f1)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontWeight: 700, fontSize: '0.8rem', color: 'white',
          }}>{initials}</div>
          <span className="portal-user-name" style={{ 
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
          <ChevronDown size={14} style={{ color: 'var(--text-muted)', transform: dropdownOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s' }} />
        </button>

        {/* Dropdown Menu */}
        {dropdownOpen && (
          <div style={{
            position: 'absolute',
            top: '100%',
            right: 0,
            marginTop: '0.5rem',
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 12,
            boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
            minWidth: 220,
            padding: '0.5rem 0',
            zIndex: 50,
            display: 'flex',
            flexDirection: 'column',
          }}>
            {/* Header info */}
            <div style={{ padding: '0.75rem 1rem', borderBottom: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: '0.15rem' }}>
              <span style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--text)' }}>{user?.name}</span>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.email}</span>
            </div>

            {/* Core links */}
            <Link 
              href="/portal/account" 
              onClick={() => setDropdownOpen(false)} 
              style={dropdownItemStyle}
              className="dropdown-item"
            >
              <UserIcon size={14} style={{ color: 'var(--brand)' }} />
              <span>Manage Account</span>
            </Link>

            <button 
              onClick={handleOpenClubModal} 
              style={dropdownItemStyle}
              className="dropdown-item"
            >
              <Building2 size={14} style={{ color: 'var(--brand)' }} />
              <span>Club Info</span>
            </button>

            <a 
              href={`mailto:${clubSettings?.contactEmail || 'admin@mbc.mv'}?subject=MBC Support`}
              style={dropdownItemStyle}
              className="dropdown-item"
            >
              <HelpCircle size={14} style={{ color: 'var(--brand)' }} />
              <span>Help & Support</span>
            </a>

            {/* Legal divider */}
            <div style={{ height: 1, background: 'var(--border)', margin: '0.25rem 0' }} />

            <Link 
              href="/privacy" 
              onClick={() => setDropdownOpen(false)} 
              style={dropdownItemStyle}
              className="dropdown-item"
            >
              <Shield size={14} style={{ color: 'var(--text-muted)' }} />
              <span>Privacy Policy</span>
            </Link>

            <Link 
              href="/terms" 
              onClick={() => setDropdownOpen(false)} 
              style={dropdownItemStyle}
              className="dropdown-item"
            >
              <FileText size={14} style={{ color: 'var(--text-muted)' }} />
              <span>Terms & Conditions</span>
            </Link>

            {/* Sign out divider */}
            <div style={{ height: 1, background: 'var(--border)', margin: '0.25rem 0' }} />

            <button 
              onClick={() => signOut({ callbackUrl: '/auth/login' })} 
              style={{ ...dropdownItemStyle, color: '#ef4444' }}
              className="dropdown-item"
            >
              <LogOut size={14} />
              <span>Sign Out</span>
            </button>
          </div>
        )}
      </div>

      {/* Club Info Modal */}
      {showClubModal && (
        <div 
          className="modal-overlay" 
          onClick={e => e.target === e.currentTarget && setShowClubModal(false)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.4)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 100,
          }}
        >
          <div className="modal" style={{ maxWidth: 400, width: '90%', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border)', paddingBottom: '0.75rem' }}>
              <h2 style={{ fontSize: '1rem', fontWeight: 700, margin: 0 }}>Club Details</h2>
              <button 
                className="btn-ghost" 
                style={{ padding: '0.25rem' }} 
                onClick={() => setShowClubModal(false)}
              >
                <X size={16} />
              </button>
            </div>

            {loadingClub ? (
              <div style={{ display: 'flex', justifyContent: 'center', padding: '2rem' }}>
                <Loader2 size={24} className="animate-spin" style={{ color: 'var(--brand)' }} />
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', fontSize: '0.85rem' }}>
                <div style={{ textAlign: 'center', padding: '0.5rem 0' }}>
                  <span style={{ fontSize: '2.5rem' }}>🏀</span>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 800, margin: '0.5rem 0 0 0', color: 'var(--text)' }}>
                    {clubSettings?.clubName || 'Maldives Basketball Club'}
                  </h3>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '0.5rem' }}>
                  {clubSettings?.contactEmail && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: 'var(--text)' }}>
                      <Mail size={16} style={{ color: 'var(--brand)', flexShrink: 0 }} />
                      <span>{clubSettings.contactEmail}</span>
                    </div>
                  )}
                  {clubSettings?.contactPhone && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: 'var(--text)' }}>
                      <Phone size={16} style={{ color: 'var(--brand)', flexShrink: 0 }} />
                      <span>{clubSettings.contactPhone}</span>
                    </div>
                  )}
                  {clubSettings?.address && (
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', color: 'var(--text)' }}>
                      <MapPin size={16} style={{ color: 'var(--brand)', flexShrink: 0, marginTop: '0.15rem' }} />
                      <span>{clubSettings.address}</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  )
}

