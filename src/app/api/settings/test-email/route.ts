import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { sendTestEmail } from '@/lib/email'

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const userRole = (session.user as any)?.role
  if (userRole !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden: Admins only' }, { status: 403 })
  }

  try {
    const body = await req.json()
    const { toEmail, smtpHost, smtpPort, smtpUser, smtpPassword, smtpFromName } = body

    if (!toEmail) {
      return NextResponse.json({ error: 'Recipient email (toEmail) is required' }, { status: 400 })
    }

    const result = await sendTestEmail(toEmail, {
      smtpHost,
      smtpPort,
      smtpUser,
      smtpPassword,
      smtpFromName,
    })

    if (!result.success) {
      return NextResponse.json({ error: result.error || 'Failed to send test email' }, { status: 400 })
    }

    return NextResponse.json({ success: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 })
  }
}
