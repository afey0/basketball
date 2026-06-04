'use client'

import { useState, useEffect } from 'react'
import { Smartphone, Download, X } from 'lucide-react'

export default function PwaInstallBanner() {
  const [showBanner, setShowBanner] = useState(false)

  useEffect(() => {
    // Check if the app is already installable (deferredPrompt exists)
    if (typeof window !== 'undefined') {
      if (window.deferredPrompt) {
        setShowBanner(true)
      }

      const handleInstallable = () => {
        // Double check sessionStorage to not annoy user
        const dismissed = sessionStorage.getItem('pwa-banner-dismissed')
        if (!dismissed) {
          setShowBanner(true)
        }
      }

      const handleInstalled = () => {
        setShowBanner(false)
      }

      window.addEventListener('pwa-installable', handleInstallable)
      window.addEventListener('pwa-installed', handleInstalled)

      return () => {
        window.removeEventListener('pwa-installable', handleInstallable)
        window.removeEventListener('pwa-installed', handleInstalled)
      }
    }
  }, [])

  const handleInstall = async () => {
    if (typeof window === 'undefined') return
    const promptEvent = window.deferredPrompt
    if (!promptEvent) return

    // Show the install prompt
    promptEvent.prompt()

    // Wait for the user to respond to the prompt
    const { outcome } = await promptEvent.userChoice
    console.log(`User response to the install prompt: ${outcome}`)

    // We've used the prompt, and can't use it again
    window.deferredPrompt = null
    setShowBanner(false)
  }

  const handleDismiss = () => {
    sessionStorage.setItem('pwa-banner-dismissed', 'true')
    setShowBanner(false)
  }

  if (!showBanner) return null

  return (
    <div style={{
      position: 'fixed',
      bottom: '1.5rem',
      left: '50%',
      transform: 'translateX(-50%)',
      width: 'calc(100% - 2rem)',
      maxWidth: '480px',
      background: 'rgba(30, 41, 59, 0.95)',
      backdropFilter: 'blur(12px)',
      border: '1px solid rgba(255, 107, 0, 0.25)',
      borderRadius: '16px',
      padding: '1rem 1.25rem',
      boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5), 0 8px 10px -6px rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      gap: '1rem',
      zIndex: 100,
      animation: 'slideUpBanner 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
    }}>
      
      {/* Icon */}
      <div style={{
        width: '42px',
        height: '42px',
        borderRadius: '10px',
        background: 'linear-gradient(135deg, var(--brand, #4f46e5), #3730a3)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        boxShadow: '0 4px 10px rgba(79, 70, 229, 0.3)',
      }}>
        <Smartphone size={20} color="white" />
      </div>

      {/* Text Info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <h4 style={{ margin: 0, fontSize: '0.875rem', fontWeight: 700, color: 'white' }}>
          Install MBC CRM App
        </h4>
        <p style={{ margin: '0.15rem 0 0 0', fontSize: '0.75rem', color: '#94a3b8', lineHeight: 1.3 }}>
          Add to home screen for quick offline access and updates.
        </p>
      </div>

      {/* Action Buttons */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexShrink: 0 }}>
        <button
          onClick={handleInstall}
          style={{
            background: 'var(--brand, #4f46e5)',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            padding: '0.5rem 0.75rem',
            fontSize: '0.75rem',
            fontWeight: 600,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.25rem',
            transition: 'all 0.2s',
          }}
          onMouseEnter={(e) => e.currentTarget.style.background = '#3730a3'}
          onMouseLeave={(e) => e.currentTarget.style.background = 'var(--brand, #4f46e5)'}
        >
          <Download size={13} />
          Install
        </button>
        
        <button
          onClick={handleDismiss}
          style={{
            background: 'rgba(255,255,255,0.05)',
            border: 'none',
            borderRadius: '50%',
            width: '28px',
            height: '28px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#94a3b8',
            cursor: 'pointer',
            transition: 'all 0.2s',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(255,255,255,0.1)'
            e.currentTarget.style.color = 'white'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(255,255,255,0.05)'
            e.currentTarget.style.color = '#94a3b8'
          }}
        >
          <X size={14} />
        </button>
      </div>
    </div>
  )
}
