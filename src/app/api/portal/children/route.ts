import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/auth'
import { z } from 'zod'

const childSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  dateOfBirth: z.string(),
  gender: z.enum(['MALE', 'FEMALE']),
  ageGroup: z.string(),
  jerseyNumber: z.number().optional().nullable(),
  medicalNotes: z.string().optional().nullable(),
  profilePhoto: z.string().optional().nullable(),
  confirmRestore: z.boolean().optional(),
  forceCreate: z.boolean().optional(),
})

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const userId = parseInt((session.user as any).id)

  const children = await prisma.student.findMany({
    where: {
      parentId: userId,
      status: { not: 'DELETED_BY_PARENT' }
    },
    include: {
      trainingGroup: { select: { id: true, groupName: true, ageGroup: true } },
    },
    orderBy: [{ firstName: 'asc' }, { lastName: 'asc' }],
  })

  return NextResponse.json(children)
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const userId = parseInt((session.user as any).id)

  try {
    const body = await req.json()
    const data = childSchema.parse(body)

    // Normalize names for comparison
    const firstNameClean = data.firstName.trim()
    const lastNameClean = data.lastName.trim()

    // 1. Check if there is an existing child with the same name under this parent who was deleted by parent
    const duplicate = await prisma.student.findFirst({
      where: {
        firstName: { equals: firstNameClean },
        lastName: { equals: lastNameClean },
        parentId: userId,
        status: 'DELETED_BY_PARENT',
      }
    })

    if (duplicate && !data.confirmRestore && !data.forceCreate) {
      return NextResponse.json({
        duplicate: true,
        existingChild: {
          id: duplicate.id,
          firstName: duplicate.firstName,
          lastName: duplicate.lastName,
          dateOfBirth: duplicate.dateOfBirth,
        },
        message: `You have a deleted child named ${firstNameClean} ${lastNameClean}. Would you like to restore their profile (including history) or create a new child profile?`
      }, { status: 409 })
    }

    const dob = new Date(data.dateOfBirth)
    const age = new Date().getFullYear() - dob.getFullYear()

    if (duplicate && data.confirmRestore) {
      // 2. Restore deleted child
      const restored = await prisma.student.update({
        where: { id: duplicate.id },
        data: {
          status: 'ACTIVE',
          dateOfBirth: dob,
          age,
          gender: data.gender,
          ageGroup: data.ageGroup,
          jerseyNumber: data.jerseyNumber || null,
          medicalNotes: data.medicalNotes || null,
          profilePhoto: data.profilePhoto || null,
        },
        include: { trainingGroup: true }
      })
      return NextResponse.json(restored)
    }

    // 3. Create a new child
    const child = await prisma.student.create({
      data: {
        firstName: firstNameClean,
        lastName: lastNameClean,
        dateOfBirth: dob,
        age,
        gender: data.gender,
        ageGroup: data.ageGroup,
        jerseyNumber: data.jerseyNumber || null,
        medicalNotes: data.medicalNotes || null,
        profilePhoto: data.profilePhoto || null,
        parentId: userId,
        status: 'ACTIVE',
        enrollmentDate: new Date(),
      },
      include: { trainingGroup: true }
    })

    return NextResponse.json(child, { status: 201 })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Invalid data' }, { status: 400 })
  }
}
