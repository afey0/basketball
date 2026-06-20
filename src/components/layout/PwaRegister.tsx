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
      if (process.env.NODE_ENV === 'development') {
        // Active cleanup in development to prevent stale caches
        navigator.serviceWorker.getRegistrations().then((registrations) => {
          for (const registration of registrations) {
            registration.unregister().then((success) => {
              if (success) {
                console.log('Unregistered active service worker in development mode')
              }
            })
          }
        })
        if ('caches' in window) {
          caches.keys().then((keys) => {
            keys.forEach((key) => {
              caches.delete(key).then(() => {
                console.log(`Deleted cache storage: ${key}`)
              })
            })
          })
        }
        return
      }

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
