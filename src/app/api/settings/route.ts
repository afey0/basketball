import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/auth'

export async function GET() {
  const session = await auth()
  if (!session || !session.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const clubId = (session.user as any).clubId
  if (!clubId) {
    return NextResponse.json({ error: 'No club associated with user' }, { status: 400 })
  }

  let settings = await prisma.clubSettings.findUnique({
    where: { clubId }
  })

  if (!settings) {
    // Attempt to load the club details to name the settings initially
    const club = await prisma.club.findUnique({ where: { id: clubId } })
    settings = await prisma.clubSettings.create({
      data: {
        clubId,
        clubName: club?.name || 'Basketball Club',
        paymentDueDay: 5,
        currency: 'MVR',
      }
    })
  }

  return NextResponse.json(settings)
}

export async function PUT(req: NextRequest) {
  const session = await auth()
  if (!session || !session.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const clubId = (session.user as any).clubId
  if (!clubId) {
    return NextResponse.json({ error: 'No club associated with user' }, { status: 400 })
  }

  const body = await req.json()
  let settings = await prisma.clubSettings.findUnique({
    where: { clubId }
  })

  if (!settings) {
    const club = await prisma.club.findUnique({ where: { id: clubId } })
    settings = await prisma.clubSettings.create({
      data: {
        clubId,
        clubName: club?.name || 'Basketball Club',
        paymentDueDay: 5,
        currency: 'MVR',
      }
    })
  }

  settings = await prisma.clubSettings.update({
    where: { clubId },
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
      ...(body.currency !== undefined && { currency: body.currency }),
      ...(body.theme !== undefined && { theme: body.theme }),
      ...(body.clubLogo !== undefined && { clubLogo: body.clubLogo }),
    },
  })

  // Sync to Club model
  await prisma.club.update({
    where: { id: clubId },
    data: {
      ...(body.clubName && { name: body.clubName }),
      ...(body.clubLogo !== undefined && { logo: body.clubLogo }),
    }
  })

  return NextResponse.json(settings)
}
