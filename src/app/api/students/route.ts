import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/auth'
import { z } from 'zod'
import { validateCountryIdCard } from '@/lib/utils'

const studentSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  dateOfBirth: z.string(),
  gender: z.enum(['MALE', 'FEMALE']),
  ageGroup: z.string(),
  trainingGroupId: z.number().optional().nullable(),
  parentId: z.number({ required_error: 'Parent / Guardian is required' }),
  jerseyNumber: z.number().optional().nullable(),
  medicalNotes: z.string().optional().nullable(),
  status: z.string().optional(),
  profilePhoto: z.string().optional().nullable(),
  country: z.string().optional().nullable(),
  idCardOrPassport: z.string().optional().nullable(),
})

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const clubId = parseInt((session.user as any).clubId)

  const { searchParams } = new URL(req.url)
  const search = searchParams.get('search') || ''
  const group = searchParams.get('group')
  const ageGroup = searchParams.get('ageGroup')
  const status = searchParams.get('status') || 'ACTIVE'

  const students = await prisma.student.findMany({
    where: {
      clubId,
      status: status === 'ALL' ? undefined : status,
      ...(group ? { trainingGroupId: parseInt(group) } : {}),
      ...(ageGroup ? { ageGroup } : {}),
      ...(search ? {
        OR: [
          { firstName: { contains: search } },
          { lastName: { contains: search } },
        ]
      } : {}),
    },
    include: {
      trainingGroup: { select: { id: true, groupName: true, ageGroup: true } },
      parent: { select: { id: true, name: true, email: true, phone: true } },
      payments: {
        where: {
          paymentMonth: `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`
        },
        select: { status: true, amount: true }
      },
    },
    orderBy: [{ firstName: 'asc' }, { lastName: 'asc' }],
  })

  return NextResponse.json(students)
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const clubId = parseInt((session.user as any).clubId)

  try {
    const body = await req.json()
    const data = studentSchema.parse(body)
    const dob = new Date(data.dateOfBirth)
    if (isNaN(dob.getTime())) {
      return NextResponse.json({ error: 'Invalid Date of Birth' }, { status: 400 })
    }
    const today = new Date()
    today.setHours(23, 59, 59, 999)
    if (dob > today) {
      return NextResponse.json({ error: 'Date of Birth cannot be in the future' }, { status: 400 })
    }

    const validationError = validateCountryIdCard(data.country, data.idCardOrPassport)
    if (validationError) {
      return NextResponse.json({ error: validationError }, { status: 400 })
    }

    let finalIdCard = data.idCardOrPassport?.trim() || null
    if (finalIdCard && (data.country?.trim().toLowerCase() === 'maldives')) {
      finalIdCard = finalIdCard.toUpperCase()
    }

    const age = new Date().getFullYear() - dob.getFullYear()

    const student = await prisma.student.create({
      data: {
        firstName: data.firstName,
        lastName: data.lastName,
        dateOfBirth: dob,
        age,
        gender: data.gender,
        ageGroup: data.ageGroup,
        trainingGroupId: data.trainingGroupId || null,
        parentId: data.parentId || null,
        jerseyNumber: data.jerseyNumber || null,
        medicalNotes: data.medicalNotes || null,
        status: data.status || 'ACTIVE',
        profilePhoto: data.profilePhoto || null,
        enrollmentDate: new Date(),
        clubId,
        country: data.country || null,
        idCardOrPassport: finalIdCard,
      },
      include: {
        trainingGroup: true,
        parent: true,
      }
    })
    return NextResponse.json(student, { status: 201 })
  } catch (err: any) {
    if (err.code === 'P2002') {
      const target = String(err.meta?.target || '')
      if (target.includes('idCardOrPassport')) {
        return NextResponse.json({ error: 'Duplicate ID Card or Passport number found.' }, { status: 400 })
      }
    }
    return NextResponse.json({ error: err.message || 'Invalid data' }, { status: 400 })
  }
}
