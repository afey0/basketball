'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Save, Building2, CreditCard, Mail, Send, Palette, Upload } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface Props { settings: any; coaches: any[] }

export default function SettingsClient({ settings: initial, coaches }: Props) {
  const router = useRouter()
  const [form, setForm] = useState(initial)
  const [saving, setSaving] = useState(false)
  const [testEmail, setTestEmail] = useState('')
  const [sendingTest, setSendingTest] = useState(false)
  const [uploadingLogo, setUploadingLogo] = useState(false)

  const set = (k: string, v: any) => setForm((f: any) => ({ ...f, [k]: v }))

  const handleThemeChange = (newTheme: string) => {
    set('theme', newTheme)
    const htmlElement = document.documentElement
    const classes = Array.from(htmlElement.classList).filter(c => !c.startsWith('theme-'))
    htmlElement.className = [...classes, `theme-${newTheme}`].join(' ')
  }

  async function handleLogoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setUploadingLogo(true)
    const formData = new FormData()
    formData.append('file', file)

    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      })
      if (!res.ok) throw new Error('Upload failed')
      const data = await res.json()
      set('clubLogo', data.url)
      toast.success('Club logo uploaded successfully!')
    } catch {
      toast.error('Failed to upload club logo')
    } finally {
      setUploadingLogo(false)
    }
  }

  async function handleSendTestEmail() {
    if (!testEmail) {
      toast.error('Please enter a recipient email.')
      return
    }
    setSendingTest(true)
    try {
      const res = await fetch('/api/settings/test-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          toEmail: testEmail,
          smtpHost: form.smtpHost,
          smtpPort: form.smtpPort,
          smtpUser: form.smtpUser,
          smtpPassword: form.smtpPassword,
          smtpFromName: form.smtpFromName,
        })
      })
      const data = await res.json()
      if (res.ok && data.success) {
        toast.success('Test email sent successfully! Check your inbox.')
      } else {
        toast.error(data.error || 'Failed to send test email. Please check your SMTP settings.')
      }
    } catch {
      toast.error('Network error. Failed to connect to verification API.')
    } finally {
      setSendingTest(false)
    }
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      const res = await fetch('/api/settings', {
        method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form)
      })
      if (!res.ok) throw new Error()
      toast.success('Settings saved!')
      router.refresh()
    } catch { toast.error('Failed to save') }
    finally { setSaving(false) }
  }

  return (
    <div style={{ maxWidth: 720 }}>
      <form onSubmit={handleSave}>
        {/* Club Info */}
        <div className="card" style={{ marginBottom: '1.25rem' }}>
          <h3 style={{ fontWeight: 700, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Building2 size={18} style={{ color: 'var(--brand)' }} /> Club Information</h3>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.25rem' }}>
            <div style={{ position: 'relative' }}>
              {form.clubLogo ? (
                <img src={form.clubLogo} alt="Club Logo" className="avatar" style={{ width: 64, height: 64, borderRadius: '8px', objectFit: 'contain', background: 'var(--surface-2)', border: '1px solid var(--border)' }} />
              ) : (
                <div className="avatar" style={{ width: 64, height: 64, fontSize: '0.8rem', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '8px', background: 'var(--surface-2)', border: '1px solid var(--border)', color: 'var(--text-muted)' }}>
                  No Logo
                </div>
              )}
            </div>
            <div style={{ flex: 1 }}>
              <label className="form-label" style={{ marginBottom: '0.25rem' }}>Club Logo</label>
              <input 
                type="file" 
                className="input" 
                accept="image/png, image/jpeg, image/jpg"
                onChange={handleLogoUpload}
                disabled={uploadingLogo || saving}
                style={{ padding: '0.35rem 0.5rem', fontSize: '0.8rem', maxWidth: '300px' }}
              />
              {uploadingLogo && <span style={{ fontSize: '0.75rem', color: 'var(--brand)', marginTop: '0.25rem', display: 'block' }}>Uploading...</span>}
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Club Name *</label>
            <input className="input" value={form.clubName || ''} onChange={e => set('clubName', e.target.value)} required />
          </div>
          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">Contact Email</label>
              <input className="input" type="email" value={form.contactEmail || ''} onChange={e => set('contactEmail', e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Contact Phone</label>
              <input className="input" value={form.contactPhone || ''} onChange={e => set('contactPhone', e.target.value)} />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Address</label>
            <input className="input" value={form.address || ''} onChange={e => set('address', e.target.value)} />
          </div>
        </div>

        {/* Payment Settings */}
        <div className="card" style={{ marginBottom: '1.25rem' }}>
          <h3 style={{ fontWeight: 700, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><CreditCard size={18} style={{ color: 'var(--brand)' }} /> Payment Settings</h3>
          <div className="form-group">
            <label className="form-label">Payment Due Day (of each month)</label>
            <input className="input" type="number" min={1} max={28} value={form.paymentDueDay || 5} onChange={e => set('paymentDueDay', e.target.value)} style={{ maxWidth: 100 }} />
            <div style={{ fontSize: '0.75rem', color: '#8B8BA7', marginTop: '0.25rem' }}>e.g., 5 = payments due on the 5th of each month</div>
          </div>
        </div>

        {/* Interface Customization */}
        <div className="card" style={{ marginBottom: '1.25rem' }}>
          <h3 style={{ fontWeight: 700, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Palette size={18} style={{ color: 'var(--brand)' }} /> Interface Customization</h3>
          <div className="form-group">
            <label className="form-label">Active Portal Theme</label>
            <select className="input" value={form.theme || 'default'} onChange={e => handleThemeChange(e.target.value)}>
              <option value="default">Default Light</option>
              <option value="dark">Slate Dark</option>
              <option value="emerald">Emerald Green</option>
              <option value="orange">Amber Orange</option>
              <option value="rose">Rose Red</option>
              <option value="royal">Royal Blue</option>
              <option value="yellow">Yellow Gold</option>
              <option value="purple">Amethyst Purple</option>
              <option value="cyberpunk">Cyberpunk Neon (Hot Pink / Cyan)</option>
            </select>
            <div style={{ fontSize: '0.75rem', color: '#8B8BA7', marginTop: '0.25rem' }}>
              Choose a theme for your club's portal. This is applied instantly to the Admin and Parent portals.
            </div>
          </div>
        </div>

        {/* SMTP Email */}
        <div className="card" style={{ marginBottom: '1.25rem' }}>
          <h3 style={{ fontWeight: 700, marginBottom: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Mail size={18} style={{ color: 'var(--brand)' }} /> Email / SMTP Settings</h3>
          <p style={{ color: '#8B8BA7', fontSize: '0.8rem', marginBottom: '1rem' }}>Configure Gmail now or Hostinger SMTP later — just update the fields below.</p>
          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">SMTP Host</label>
              <input className="input" value={form.smtpHost || ''} onChange={e => set('smtpHost', e.target.value)} placeholder="smtp.gmail.com" />
            </div>
            <div className="form-group">
              <label className="form-label">SMTP Port</label>
              <input className="input" type="number" value={form.smtpPort || 587} onChange={e => set('smtpPort', e.target.value)} style={{ maxWidth: 100 }} />
            </div>
          </div>
          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">SMTP Username</label>
              <input className="input" value={form.smtpUser || ''} onChange={e => set('smtpUser', e.target.value)} placeholder="you@gmail.com" />
            </div>
            <div className="form-group">
              <label className="form-label">SMTP Password / App Password</label>
              <input className="input" type="password" value={form.smtpPassword || ''} onChange={e => set('smtpPassword', e.target.value)} placeholder="••••••••" />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">From Name</label>
            <input className="input" value={form.smtpFromName || ''} onChange={e => set('smtpFromName', e.target.value)} placeholder="Basketball Club" />
          </div>
          <div className="alert alert-orange">
            ⚠️ For Gmail: enable 2FA and generate an App Password at myaccount.google.com/apppasswords
          </div>
          
          <hr style={{ margin: '1.5rem 0', borderColor: 'var(--border)', opacity: 0.5 }} />
          <h4 style={{ fontWeight: 700, marginBottom: '0.5rem', fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}><Send size={14} style={{ color: 'var(--brand)' }} /> Verify SMTP Settings</h4>
          <p style={{ color: '#8B8BA7', fontSize: '0.75rem', marginBottom: '0.75rem' }}>
            Send a real test email to verify credentials before saving settings.
          </p>
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-end', flexWrap: 'wrap' }}>
            <div className="form-group" style={{ flex: 1, minWidth: 220, marginBottom: 0 }}>
              <label className="form-label" style={{ fontSize: '0.7rem' }}>Test Recipient Email Address</label>
              <input 
                className="input" 
                type="email" 
                placeholder="recipient@example.com" 
                value={testEmail} 
                onChange={e => setTestEmail(e.target.value)} 
              />
            </div>
            <button 
              type="button" 
              className="btn-secondary" 
              disabled={sendingTest || !testEmail} 
              onClick={handleSendTestEmail}
              style={{ padding: '0.625rem 1rem' }}
            >
              {sendingTest ? 'Sending...' : 'Send Test Email'}
            </button>
          </div>
        </div>

        <button type="submit" className="btn-primary" disabled={saving} style={{ width: '100%', justifyContent: 'center', padding: '0.875rem' }}>
          <Save size={16} /> {saving ? 'Saving...' : 'Save All Settings'}
        </button>
      </form>
    </div>
  )
}
