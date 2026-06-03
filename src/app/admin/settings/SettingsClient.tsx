'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Save } from 'lucide-react'

interface Props { settings: any; coaches: any[] }

export default function SettingsClient({ settings: initial, coaches }: Props) {
  const [form, setForm] = useState(initial)
  const [saving, setSaving] = useState(false)
  const set = (k: string, v: any) => setForm((f: any) => ({ ...f, [k]: v }))

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      const res = await fetch('/api/settings', {
        method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form)
      })
      if (!res.ok) throw new Error()
      toast.success('Settings saved!')
    } catch { toast.error('Failed to save') }
    finally { setSaving(false) }
  }

  return (
    <div style={{ maxWidth: 720 }}>
      <form onSubmit={handleSave}>
        {/* Club Info */}
        <div className="card" style={{ marginBottom: '1.25rem' }}>
          <h3 style={{ fontWeight: 700, marginBottom: '1rem' }}>🏀 Club Information</h3>
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
          <h3 style={{ fontWeight: 700, marginBottom: '1rem' }}>💰 Payment Settings</h3>
          <div className="form-group">
            <label className="form-label">Payment Due Day (of each month)</label>
            <input className="input" type="number" min={1} max={28} value={form.paymentDueDay || 5} onChange={e => set('paymentDueDay', e.target.value)} style={{ maxWidth: 100 }} />
            <div style={{ fontSize: '0.75rem', color: '#8B8BA7', marginTop: '0.25rem' }}>e.g., 5 = payments due on the 5th of each month</div>
          </div>
        </div>

        {/* SMTP Email */}
        <div className="card" style={{ marginBottom: '1.25rem' }}>
          <h3 style={{ fontWeight: 700, marginBottom: '0.25rem' }}>📧 Email / SMTP Settings</h3>
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
        </div>

        <button type="submit" className="btn-primary" disabled={saving} style={{ width: '100%', justifyContent: 'center', padding: '0.875rem' }}>
          <Save size={16} /> {saving ? 'Saving...' : 'Save All Settings'}
        </button>
      </form>
    </div>
  )
}
