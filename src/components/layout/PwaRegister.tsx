'use client'

import { useEffect } from 'react'

declare global {
  interface Window {
    deferredPrompt: any
  }
}

export default function PwaRegister() {
  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      // Register service worker
      navigator.serviceWorker.register('/sw.js')
        .then((reg) => {
          console.log('Service Worker registered successfully with scope:', reg.scope)
        })
        .catch((err) => {
          console.error('Service Worker registration failed:', err)
        })

      // Capture install prompt
      const handleBeforeInstallPrompt = (e: Event) => {
        e.preventDefault()
        window.deferredPrompt = e
        // Notify components that the PWA is installable
        window.dispatchEvent(new CustomEvent('pwa-installable'))
      }

      window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)

      // Handle successful installation
      const handleAppInstalled = () => {
        console.log('PWA installed successfully')
        window.deferredPrompt = null
        window.dispatchEvent(new CustomEvent('pwa-installed'))
      }

      window.addEventListener('appinstalled', handleAppInstalled)

      return () => {
        window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
        window.removeEventListener('appinstalled', handleAppInstalled)
      }
    }
  }, [])

  return null
}
