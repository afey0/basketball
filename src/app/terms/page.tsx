import Link from 'next/link'
import { ArrowLeft, FileText } from 'lucide-react'

export default function TermsPage() {
  return (
    <div style={{ minHeight: '100vh', background: 'var(--background)', padding: '2rem 1.5rem', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
      <div className="card" style={{ maxWidth: 720, width: '100%', padding: '2.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', borderBottom: '1px solid var(--border)', paddingBottom: '1rem' }}>
          <div style={{ width: 40, height: 40, borderRadius: 12, background: 'var(--brand-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--brand)' }}>
            <FileText size={20} />
          </div>
          <div>
            <h1 style={{ fontWeight: 800, fontSize: '1.5rem', margin: 0 }}>Terms & Conditions</h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', margin: '0.25rem 0 0 0' }}>Last updated: June 19, 2026</p>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', fontSize: '0.875rem', lineHeight: '1.6', color: 'var(--text)' }}>
          <section>
            <h2 style={{ fontWeight: 700, fontSize: '1.05rem', marginBottom: '0.5rem', color: 'var(--brand)' }}>1. Acceptance of Terms</h2>
            <p style={{ margin: 0 }}>
              By enrolling your child in the Maldives Basketball Club (MBC), you agree to comply with and be bound by these terms and conditions. If you do not agree, please do not proceed with enrollment.
            </p>
          </section>

          <section>
            <h2 style={{ fontWeight: 700, fontSize: '1.05rem', marginBottom: '0.5rem', color: 'var(--brand)' }}>2. Training Fees & Payments</h2>
            <p style={{ margin: 0 }}>
              Monthly training fees must be paid in full by the due date specified in your invoice (typically the 5th of each month). Failure to make payments on time may result in training suspension. Paid fees are non-refundable.
            </p>
          </section>

          <section>
            <h2 style={{ fontWeight: 700, fontSize: '1.05rem', marginBottom: '0.5rem', color: 'var(--brand)' }}>3. Attendance & Scheduling</h2>
            <p style={{ margin: 0 }}>
              Training schedules are decided by the coaching staff. MBC reserves the right to change schedule times or training venues with prior notice. Parents are responsible for the timely drop-off and pick-up of children.
            </p>
          </section>

          <section>
            <h2 style={{ fontWeight: 700, fontSize: '1.05rem', marginBottom: '0.5rem', color: 'var(--brand)' }}>4. Liability & Insurance</h2>
            <p style={{ margin: 0 }}>
              While we prioritize safety, basketball training carries inherent physical risks. By signing up, you acknowledge that Maldives Basketball Club, its coaches, and its management are not liable for any injuries sustained during official practices or tournaments.
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
