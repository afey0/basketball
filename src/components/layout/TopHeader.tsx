'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { useSession, signOut } from 'next-auth/react'
import { 
  Bell, 
  Menu, 
  LogOut, 
  ChevronDown, 
  User as UserIcon, 
  Shield, 
  FileText, 
  Building2, 
  HelpCircle, 
  Phone, 
  Mail, 
  MapPin, 
  Loader2, 
  X 
} from 'lucide-react'
import { useAdminUser } from './AdminUserContext'

interface TopHeaderProps {
  title: string
  subtitle?: string
}

export default function TopHeader({ title, subtitle }: TopHeaderProps) {
  const { userName, userRole } = useAdminUser()
  const { data: session } = useSession()
  
  const initials = userName
    ? userName.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()
    : 'U'

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

  const toggleSidebar = () => {
    window.dispatchEvent(new CustomEvent('toggle-sidebar'))
  }

  const userEmail = session?.user?.email || ''

  return (
    <header className="top-header">
      <style>{`
        .admin-dropdown-item {
          display: flex;
          align-items: center;
          gap: 0.625rem;
          padding: 0.6rem 1rem;
          font-size: 0.8rem;
          color: var(--text);
          text-decoration: none;
          background: none;
          border: none;
          width: 100%;
          text-align: left;
          cursor: pointer;
          transition: all 0.15s ease;
          font-weight: 500;
        }
        .admin-dropdown-item:hover {
          background: var(--brand-light, #f0f0ff) !important;
          color: var(--brand, #4f46e5) !important;
        }
        .admin-user-trigger {
          background: none;
          border: none;
          padding: 0.35rem 0.6rem;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 0.625rem;
          color: var(--text);
          border-radius: 8px;
          transition: background 0.15s;
        }
        .admin-user-trigger:hover {
          background: var(--surface-2, #f8fafc) !important;
        }
      `}</style>

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

      <div className="top-header-actions" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <button className="btn-ghost top-header-btn-icon">
          <Bell size={18} />
        </button>

        {/* Dropdown Container */}
        <div ref={dropdownRef} style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="admin-user-trigger"
          >
            <div className="avatar avatar-header">
              {initials}
            </div>
            <div className="admin-user-info" style={{ textAlign: 'left' }}>
              <div className="top-header-user-name">{userName}</div>
              <div className="top-header-user-role">
                {userRole.toLowerCase()}
              </div>
            </div>
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
              borderRadius: '12px',
              boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
              minWidth: 220,
              padding: '0.5rem 0',
              zIndex: 50,
              display: 'flex',
              flexDirection: 'column',
            }}>
              {/* User header */}
              <div style={{ padding: '0.75rem 1rem', borderBottom: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: '0.15rem' }}>
                <span style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--text)' }}>{userName}</span>
                {userEmail && (
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{userEmail}</span>
                )}
              </div>

              {/* Items */}
              <Link 
                href="/admin/account" 
                onClick={() => setDropdownOpen(false)} 
                className="admin-dropdown-item"
              >
                <UserIcon size={14} style={{ color: 'var(--brand)' }} />
                <span>Manage Account</span>
              </Link>

              <button 
                onClick={handleOpenClubModal} 
                className="admin-dropdown-item"
              >
                <Building2 size={14} style={{ color: 'var(--brand)' }} />
                <span>Club Info</span>
              </button>

              <a 
                href={`mailto:${clubSettings?.contactEmail || 'admin@mbc.mv'}?subject=MBC Support`}
                className="admin-dropdown-item"
              >
                <HelpCircle size={14} style={{ color: 'var(--brand)' }} />
                <span>Help & Support</span>
              </a>

              {/* Divider */}
              <div style={{ height: 1, background: 'var(--border)', margin: '0.25rem 0' }} />

              <Link 
                href="/privacy" 
                onClick={() => setDropdownOpen(false)} 
                className="admin-dropdown-item"
              >
                <Shield size={14} style={{ color: 'var(--text-muted)' }} />
                <span>Privacy Policy</span>
              </Link>

              <Link 
                href="/terms" 
                onClick={() => setDropdownOpen(false)} 
                className="admin-dropdown-item"
              >
                <FileText size={14} style={{ color: 'var(--text-muted)' }} />
                <span>Terms & Conditions</span>
              </Link>

              {/* Divider */}
              <div style={{ height: 1, background: 'var(--border)', margin: '0.25rem 0' }} />

              <button 
                onClick={() => signOut({ callbackUrl: '/auth/login' })} 
                className="admin-dropdown-item"
                style={{ color: '#ef4444' }}
              >
                <LogOut size={14} />
                <span>Sign Out</span>
              </button>
            </div>
          )}
        </div>
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
