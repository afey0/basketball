import Link from 'next/link'
import { ArrowLeft, Shield } from 'lucide-react'

export default function PrivacyPage() {
  return (
    <div style={{ minHeight: '100vh', background: 'var(--background)', padding: '2rem 1.5rem', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
      <div className="card" style={{ maxWidth: 720, width: '100%', padding: '2.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', borderBottom: '1px solid var(--border)', paddingBottom: '1rem' }}>
          <div style={{ width: 40, height: 40, borderRadius: 12, background: 'var(--brand-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--brand)' }}>
            <Shield size={20} />
          </div>
          <div>
            <h1 style={{ fontWeight: 800, fontSize: '1.5rem', margin: 0 }}>Privacy Policy</h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', margin: '0.25rem 0 0 0' }}>Last updated: June 19, 2026</p>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', fontSize: '0.875rem', lineHeight: '1.6', color: 'var(--text)' }}>
          <section>
            <h2 style={{ fontWeight: 700, fontSize: '1.05rem', marginBottom: '0.5rem', color: 'var(--brand)' }}>1. Information We Collect</h2>
            <p style={{ margin: 0 }}>
              We collect personal information such as parent names, contact details, emails, and children's details (dates of birth, jersey numbers, and uploaded ID cards or passports) for membership and training enrollment purposes.
            </p>
          </section>

          <section>
            <h2 style={{ fontWeight: 700, fontSize: '1.05rem', marginBottom: '0.5rem', color: 'var(--brand)' }}>2. How We Use Information</h2>
            <p style={{ margin: 0 }}>
              Your information is used to schedule training sessions, track attendance, manage monthly payment invoicing, issue reminders, and verify children's age groups for official basketball tournaments.
            </p>
          </section>

          <section>
            <h2 style={{ fontWeight: 700, fontSize: '1.05rem', marginBottom: '0.5rem', color: 'var(--brand)' }}>3. Document Upload Security</h2>
            <p style={{ margin: 0 }}>
              Uploaded ID cards and passports are used strictly for age verification. These files are stored securely on our servers and are accessible only to authorized administrators and the parent who uploaded them. We do not share these files with third parties.
            </p>
          </section>

          <section>
            <h2 style={{ fontWeight: 700, fontSize: '1.05rem', marginBottom: '0.5rem', color: 'var(--brand)' }}>4. Your Rights</h2>
            <p style={{ margin: 0 }}>
              Parents can view, edit, or remove their children's profiles at any time through the parent portal. For complete account deletion or data portability requests, please contact club administration.
            </p>
          </section>
        </div>

        <div style={{ borderTop: '1px solid var(--border)', paddingTop: '1.5rem', display: 'flex', justifyContent: 'flex-start' }}>
          <Link href="/portal" className="btn-secondary" style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
            <ArrowLeft size={14} /> Back to Portal
          </Link>
        </div>
      </div>
    </div>
  )
}
