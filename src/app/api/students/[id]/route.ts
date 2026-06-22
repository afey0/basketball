import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/auth'
import { validateCountryIdCard } from '@/lib/utils'

export async function GET(req: NextRequest, props: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const clubId = parseInt((session.user as any).clubId)

  const { id: rawId } = await props.params
  const id = parseInt(rawId)
  const student = await prisma.student.findFirst({
    where: { id, clubId },
    include: {
      trainingGroup: { include: { schedules: true, coach: true } },
      parent: true,
      payments: { orderBy: { paymentMonth: 'desc' } },
      attendance: { orderBy: { date: 'desc' }, take: 60 },
    },
  })
  if (!student) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(student)
}

export async function PUT(req: NextRequest, props: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const clubId = parseInt((session.user as any).clubId)

  const { id: rawId } = await props.params
  const id = parseInt(rawId)
  const body = await req.json()

  const existing = await prisma.student.findFirst({
    where: { id, clubId }
  })
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const dob = body.dateOfBirth ? new Date(body.dateOfBirth) : undefined
  if (dob && isNaN(dob.getTime())) {
    return NextResponse.json({ error: 'Invalid Date of Birth' }, { status: 400 })
  }
  if (dob) {
    const today = new Date()
    today.setHours(23, 59, 59, 999)
    if (dob > today) {
      return NextResponse.json({ error: 'Date of Birth cannot be in the future' }, { status: 400 })
    }
  }
  const age = dob ? new Date().getFullYear() - dob.getFullYear() : undefined

  if (body.parentId !== undefined && !body.parentId) {
    return NextResponse.json({ error: 'Parent / Guardian is required' }, { status: 400 })
  }

  // Validate country & ID card
  if (body.country !== undefined || body.idCardOrPassport !== undefined) {
    const valCountry = body.country !== undefined ? body.country : existing.country
    const valIdCard = body.idCardOrPassport !== undefined ? body.idCardOrPassport : existing.idCardOrPassport
    const validationError = validateCountryIdCard(valCountry, valIdCard)
    if (validationError) {
      return NextResponse.json({ error: validationError }, { status: 400 })
    }
  }

  let finalIdCard = body.idCardOrPassport !== undefined ? (body.idCardOrPassport?.trim() || null) : undefined
  const finalCountry = body.country !== undefined ? (body.country?.trim() || 'Maldives') : existing.country || 'Maldives'
  if (finalIdCard && finalCountry.toLowerCase() === 'maldives') {
    finalIdCard = finalIdCard.toUpperCase()
  }

  try {
    const student = await prisma.student.update({
      where: { id },
      data: {
        ...(body.firstName && { firstName: body.firstName }),
        ...(body.lastName && { lastName: body.lastName }),
        ...(dob && { dateOfBirth: dob, age }),
        ...(body.gender && { gender: body.gender }),
        ...(body.ageGroup && { ageGroup: body.ageGroup }),
        ...(body.trainingGroupId !== undefined && { trainingGroupId: body.trainingGroupId || null }),
        ...(body.parentId !== undefined && { parentId: body.parentId }),
        ...(body.jerseyNumber !== undefined && { jerseyNumber: body.jerseyNumber || null }),
        ...(body.medicalNotes !== undefined && { medicalNotes: body.medicalNotes }),
        ...(body.status && { status: body.status }),
        ...(body.profilePhoto !== undefined && { profilePhoto: body.profilePhoto }),
        ...(body.country !== undefined && { country: body.country || null }),
        ...(finalIdCard !== undefined && { idCardOrPassport: finalIdCard }),
      },
      include: {
        trainingGroup: {
          include: {
            schedules: true,
            coach: { select: { name: true, email: true } },
            paymentPlan: true,
          },
        },
        parent: { select: { id: true, name: true, email: true, phone: true } },
        payments: { orderBy: { paymentMonth: 'desc' } },
        attendance: { orderBy: { date: 'desc' }, take: 90 },
      },
    })
    return NextResponse.json(student)
  } catch (err: any) {
    if (err.code === 'P2002') {
      const target = String(err.meta?.target || '')
      if (target.includes('idCardOrPassport')) {
        return NextResponse.json({ error: 'Duplicate ID Card or Passport number found.' }, { status: 400 })
      }
    }
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, props: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const clubId = parseInt((session.user as any).clubId)

  const { id: rawId } = await props.params
  const id = parseInt(rawId)

  const existing = await prisma.student.findFirst({
    where: { id, clubId }
  })
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  await prisma.student.update({ where: { id }, data: { status: 'INACTIVE' } })
  return NextResponse.json({ success: true })
}
