import nodemailer from 'nodemailer'
import { prisma } from './prisma'

export async function getEmailTransport(clubId?: number) {
  const settings = clubId
    ? await prisma.clubSettings.findUnique({ where: { clubId } })
    : await prisma.clubSettings.findFirst()

  const host = settings?.smtpHost || process.env.SMTP_HOST || 'smtp.gmail.com'
  const port = settings?.smtpPort || parseInt(process.env.SMTP_PORT || '587')
  const user = settings?.smtpUser || process.env.SMTP_USER || ''
  const pass = settings?.smtpPassword || process.env.SMTP_PASSWORD || ''
  const fromName = settings?.smtpFromName || process.env.SMTP_FROM_NAME || 'Basketball Club CRM'

  const transport = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: user ? { user, pass } : undefined,
  })

  return { transport, from: `"${fromName}" <${user}>` }
}

export async function sendPaymentReminder(
  parentEmail: string,
  parentName: string,
  studentName: string,
  amount: number,
  month: string,
  dueDate: string,
  clubId?: number
) {
  try {
    const { transport, from } = await getEmailTransport(clubId)
    const settings = clubId
      ? await prisma.clubSettings.findUnique({ where: { clubId } })
      : await prisma.clubSettings.findFirst()
    const clubName = settings?.clubName || 'Basketball Club'

    await transport.sendMail({
      from,
      to: parentEmail,
      subject: `Payment Reminder - ${studentName} - ${month}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #1A1A2E; color: #ffffff; border-radius: 12px; overflow: hidden;">
          <div style="background: linear-gradient(135deg, #FF6B00, #FF8C42); padding: 30px; text-align: center;">
            <h1 style="margin: 0; font-size: 24px;">🏀 ${clubName}</h1>
            <p style="margin: 8px 0 0; opacity: 0.9;">Payment Reminder</p>
          </div>
          <div style="padding: 30px;">
            <p style="color: #ccc;">Dear ${parentName},</p>
            <p style="color: #ccc;">This is a friendly reminder that the monthly training fee for <strong style="color: #FF6B00">${studentName}</strong> is due.</p>
            <div style="background: rgba(255,107,0,0.1); border: 1px solid rgba(255,107,0,0.3); border-radius: 8px; padding: 20px; margin: 20px 0;">
              <table style="width: 100%; border-collapse: collapse;">
                <tr><td style="color: #888; padding: 6px 0;">Month:</td><td style="color: #fff; text-align: right;">${month}</td></tr>
                <tr><td style="color: #888; padding: 6px 0;">Amount Due:</td><td style="color: #FF6B00; text-align: right; font-weight: bold; font-size: 18px;">MVR ${amount.toFixed(2)}</td></tr>
                <tr><td style="color: #888; padding: 6px 0;">Due Date:</td><td style="color: #fff; text-align: right;">${dueDate}</td></tr>
              </table>
            </div>
            <p style="color: #ccc;">Please make payment at the club or via bank transfer. Contact us if you have any questions.</p>
            <p style="color: #888; font-size: 12px; margin-top: 30px;">This is an automated message from ${clubName} CRM.</p>
          </div>
        </div>
      `,
    })
    return { success: true }
  } catch (error) {
    console.error('Email send error:', error)
    return { success: false, error: String(error) }
  }
}

export async function sendOverdueNotice(
  parentEmail: string,
  parentName: string,
  studentName: string,
  amount: number,
  month: string,
  daysOverdue: number,
  clubId?: number
) {
  try {
    const { transport, from } = await getEmailTransport(clubId)
    const settings = clubId
      ? await prisma.clubSettings.findUnique({ where: { clubId } })
      : await prisma.clubSettings.findFirst()
    const clubName = settings?.clubName || 'Basketball Club'

    await transport.sendMail({
      from,
      to: parentEmail,
      subject: `⚠️ Overdue Payment - ${studentName}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #1A1A2E; color: #ffffff; border-radius: 12px; overflow: hidden;">
          <div style="background: linear-gradient(135deg, #dc2626, #b91c1c); padding: 30px; text-align: center;">
            <h1 style="margin: 0; font-size: 24px;">⚠️ Overdue Payment</h1>
            <p style="margin: 8px 0 0; opacity: 0.9;">${clubName}</p>
          </div>
          <div style="padding: 30px;">
            <p style="color: #ccc;">Dear ${parentName},</p>
            <p style="color: #ccc;">The monthly training fee for <strong style="color: #FF6B00">${studentName}</strong> is <strong style="color: #ef4444">${daysOverdue} days overdue</strong>.</p>
            <div style="background: rgba(239,68,68,0.1); border: 1px solid rgba(239,68,68,0.3); border-radius: 8px; padding: 20px; margin: 20px 0;">
              <table style="width: 100%; border-collapse: collapse;">
                <tr><td style="color: #888; padding: 6px 0;">Month:</td><td style="color: #fff; text-align: right;">${month}</td></tr>
                <tr><td style="color: #888; padding: 6px 0;">Amount Due:</td><td style="color: #ef4444; text-align: right; font-weight: bold; font-size: 18px;">MVR ${amount.toFixed(2)}</td></tr>
                <tr><td style="color: #888; padding: 6px 0;">Days Overdue:</td><td style="color: #ef4444; text-align: right;">${daysOverdue} days</td></tr>
              </table>
            </div>
            <p style="color: #ccc;">Please make payment as soon as possible to avoid suspension. Contact us immediately if you need assistance.</p>
            <p style="color: #888; font-size: 12px; margin-top: 30px;">This is an automated message from ${clubName} CRM.</p>
          </div>
        </div>
      `,
    })
    return { success: true }
  } catch (error) {
    console.error('Email send error:', error)
    return { success: false, error: String(error) }
  }
}

export async function sendSlipUploadNotification(
  adminEmail: string,
  parentName: string,
  studentName: string,
  amount: number,
  month: string,
  clubId?: number
) {
  try {
    const { transport, from } = await getEmailTransport(clubId)
    const settings = clubId
      ? await prisma.clubSettings.findUnique({ where: { clubId } })
      : await prisma.clubSettings.findFirst()
    const clubName = settings?.clubName || 'Basketball Club'

    await transport.sendMail({
      from,
      to: adminEmail,
      subject: `📄 Payment Slip Uploaded - ${studentName} - ${month}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff; color: #334155; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden;">
          <div style="background: linear-gradient(135deg, #4f46e5, #6366f1); padding: 30px; text-align: center; color: #ffffff;">
            <h1 style="margin: 0; font-size: 24px;">🏀 ${clubName}</h1>
            <p style="margin: 8px 0 0; opacity: 0.9;">Payment Slip Review Pending</p>
          </div>
          <div style="padding: 30px;">
            <p>Hello Admin / Coach,</p>
            <p>A payment slip has been uploaded by parent <strong>${parentName}</strong> for student <strong>${studentName}</strong> for the month of <strong>${month}</strong>.</p>
            <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px; margin: 20px 0;">
              <table style="width: 100%; border-collapse: collapse;">
                <tr><td style="color: #64748b; padding: 6px 0;">Student:</td><td style="color: #0f172a; text-align: right; font-weight: bold;">${studentName}</td></tr>
                <tr><td style="color: #64748b; padding: 6px 0;">Month:</td><td style="color: #0f172a; text-align: right;">${month}</td></tr>
                <tr><td style="color: #64748b; padding: 6px 0;">Amount:</td><td style="color: #4f46e5; text-align: right; font-weight: bold; font-size: 18px;">MVR ${amount.toFixed(2)}</td></tr>
              </table>
            </div>
            <p>Please log in to the MBC CRM dashboard to review and approve the payment slip.</p>
            <p style="color: #64748b; font-size: 12px; margin-top: 30px;">This is an automated message from ${clubName} CRM.</p>
          </div>
        </div>
      `,
    })
    return { success: true }
  } catch (error) {
    console.error('Email send error:', error)
    return { success: false, error: String(error) }
  }
}

export async function sendPasswordResetEmail(
  email: string,
  name: string,
  role: string,
  newPassword?: string,
  clubId?: number
) {
  try {
    const { transport, from } = await getEmailTransport(clubId)
    const settings = clubId
      ? await prisma.clubSettings.findUnique({ where: { clubId } })
      : await prisma.clubSettings.findFirst()
    const clubName = settings?.clubName || 'Basketball Club'

    await transport.sendMail({
      from,
      to: email,
      subject: `🔑 Password Updated - ${clubName}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #1A1A2E; color: #ffffff; border-radius: 12px; overflow: hidden;">
          <div style="background: linear-gradient(135deg, #4f46e5, #6366f1); padding: 30px; text-align: center;">
            <h1 style="margin: 0; font-size: 24px;">🔑 Password Updated</h1>
            <p style="margin: 8px 0 0; opacity: 0.9;">${clubName}</p>
          </div>
          <div style="padding: 30px;">
            <p style="color: #ccc;">Dear ${name},</p>
            <p style="color: #ccc;">The password for your account has been updated by an administrator.</p>
            <div style="background: rgba(99,102,241,0.1); border: 1px solid rgba(99,102,241,0.3); border-radius: 8px; padding: 20px; margin: 20px 0;">
              <table style="width: 100%; border-collapse: collapse;">
                <tr><td style="color: #888; padding: 6px 0;">Username/Email:</td><td style="color: #fff; text-align: right; font-weight: bold;">${email}</td></tr>
                <tr><td style="color: #888; padding: 6px 0;">Account Role:</td><td style="color: #fff; text-align: right;">${role}</td></tr>
                ${newPassword ? `<tr><td style="color: #888; padding: 6px 0;">New Password:</td><td style="color: #FF6B00; text-align: right; font-weight: bold; font-size: 16px;">${newPassword}</td></tr>` : ''}
              </table>
            </div>
            <p style="color: #ccc;">Please log in to the portal to access your account. If you did not request this change, please contact the administrator immediately.</p>
            <p style="color: #888; font-size: 12px; margin-top: 30px;">This is an automated message from ${clubName} CRM.</p>
          </div>
        </div>
      `,
    })
    return { success: true }
  } catch (error) {
    console.error('Email send error:', error)
    return { success: false, error: String(error) }
  }
}

export async function sendTestEmail(
  toEmail: string,
  config?: {
    smtpHost?: string
    smtpPort?: number
    smtpUser?: string
    smtpPassword?: string
    smtpFromName?: string
  },
  clubId?: number
) {
  try {
    let host = config?.smtpHost
    let port = config?.smtpPort ? parseInt(String(config.smtpPort)) : undefined
    let user = config?.smtpUser
    let pass = config?.smtpPassword
    let fromName = config?.smtpFromName

    if (!host || !user) {
      const settings = clubId
        ? await prisma.clubSettings.findUnique({ where: { clubId } })
        : await prisma.clubSettings.findFirst()
      host = host || settings?.smtpHost || process.env.SMTP_HOST || 'smtp.gmail.com'
      port = port || settings?.smtpPort || parseInt(process.env.SMTP_PORT || '587')
      user = user || settings?.smtpUser || process.env.SMTP_USER || ''
      pass = pass || settings?.smtpPassword || process.env.SMTP_PASSWORD || ''
      fromName = fromName || settings?.smtpFromName || process.env.SMTP_FROM_NAME || 'Basketball Club CRM'
    }

    const transport = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: user ? { user, pass } : undefined,
    })

    const from = `"${fromName}" <${user}>`

    await transport.sendMail({
      from,
      to: toEmail,
      subject: `🏀 Test Email - Basketball Club CRM`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #1A1A2E; color: #ffffff; border-radius: 12px; overflow: hidden;">
          <div style="background: linear-gradient(135deg, #FF6B00, #FF8C42); padding: 30px; text-align: center;">
            <h1 style="margin: 0; font-size: 24px;">🏀 Test Connection</h1>
            <p style="margin: 8px 0 0; opacity: 0.9;">SMTP Verification</p>
          </div>
          <div style="padding: 30px;">
            <p style="color: #ccc;">Hello,</p>
            <p style="color: #ccc;">This is a test email sent from the <strong>Basketball Club CRM</strong> application.</p>
            <p style="color: #ccc;">If you are reading this message, your SMTP configuration is correct and emails are working properly!</p>
            <div style="background: rgba(255,107,0,0.1); border: 1px solid rgba(255,107,0,0.3); border-radius: 8px; padding: 20px; margin: 20px 0;">
              <table style="width: 100%; border-collapse: collapse;">
                <tr><td style="color: #888; padding: 6px 0;">SMTP Host:</td><td style="color: #fff; text-align: right;">${host}</td></tr>
                <tr><td style="color: #888; padding: 6px 0;">SMTP Port:</td><td style="color: #fff; text-align: right;">${port}</td></tr>
                <tr><td style="color: #888; padding: 6px 0;">SMTP User:</td><td style="color: #fff; text-align: right;">${user}</td></tr>
              </table>
            </div>
            <p style="color: #888; font-size: 12px; margin-top: 30px;">Sent at: ${new Date().toLocaleString()}</p>
          </div>
        </div>
      `,
    })
    return { success: true }
  } catch (error) {
    console.error('Test email send error:', error)
    return { success: false, error: String(error) }
  }
}
