import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/auth'

export async function GET() {
  let settings = await prisma.clubSettings.findFirst()
  if (!settings) {
    settings = await prisma.clubSettings.create({
      data: { clubName: 'Basketball Club', paymentDueDay: 5, currency: 'MVR' }
    })
  }
  return NextResponse.json(settings)
}

export async function PUT(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  let settings = await prisma.clubSettings.findFirst()

  if (settings) {
    settings = await prisma.clubSettings.update({
      where: { id: settings.id },
      data: {
        ...(body.clubName && { clubName: body.clubName }),
        ...(body.contactEmail !== undefined && { contactEmail: body.contactEmail }),
        ...(body.contactPhone !== undefined && { contactPhone: body.contactPhone }),
        ...(body.address !== undefined && { address: body.address }),
        ...(body.paymentDueDay && { paymentDueDay: parseInt(body.paymentDueDay) }),
        ...(body.smtpHost !== undefined && { smtpHost: body.smtpHost }),
        ...(body.smtpPort !== undefined && { smtpPort: body.smtpPort ? parseInt(body.smtpPort) : null }),
        ...(body.smtpUser !== undefined && { smtpUser: body.smtpUser }),
        ...(body.smtpPassword !== undefined && { smtpPassword: body.smtpPassword }),
        ...(body.smtpFromName !== undefined && { smtpFromName: body.smtpFromName }),
      },
    })
  }
  return NextResponse.json(settings)
}
