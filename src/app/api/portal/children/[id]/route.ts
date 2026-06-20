import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/auth'
import { z } from 'zod'

const childUpdateSchema = z.object({
  firstName: z.string().min(1).optional(),
  lastName: z.string().min(1).optional(),
  dateOfBirth: z.string().optional(),
  gender: z.enum(['MALE', 'FEMALE']).optional(),
  ageGroup: z.string().optional(),
  jerseyNumber: z.number().optional().nullable(),
  medicalNotes: z.string().optional().nullable(),
  profilePhoto: z.string().optional().nullable(),
  idCardUrl: z.string().optional().nullable(),
})

export async function PUT(req: NextRequest, props: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const userId = parseInt((session.user as any).id)
  const { id: rawId } = await props.params
  const id = parseInt(rawId)

  // Verify ownership
  const child = await prisma.student.findUnique({
    where: { id },
  })

  if (!child || child.parentId !== userId) {
    return NextResponse.json({ error: 'Child profile not found or access denied' }, { status: 404 })
  }

  try {
    const body = await req.json()
    const data = childUpdateSchema.parse(body)

    const dob = data.dateOfBirth ? new Date(data.dateOfBirth) : undefined
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

    const updated = await prisma.student.update({
      where: { id },
      data: {
        ...(data.firstName && { firstName: data.firstName.trim() }),
        ...(data.lastName && { lastName: data.lastName.trim() }),
        ...(dob && { dateOfBirth: dob, age }),
        ...(data.gender && { gender: data.gender }),
        ...(data.ageGroup && { ageGroup: data.ageGroup }),
        ...(data.jerseyNumber !== undefined && { jerseyNumber: data.jerseyNumber }),
        ...(data.medicalNotes !== undefined && { medicalNotes: data.medicalNotes }),
        ...(data.profilePhoto !== undefined && { profilePhoto: data.profilePhoto }),
        ...(data.idCardUrl !== undefined && { idCardUrl: data.idCardUrl }),
      },
      include: { trainingGroup: true }
    })

    return NextResponse.json(updated)
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Invalid data' }, { status: 400 })
  }
}

export async function DELETE(req: NextRequest, props: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const userId = parseInt((session.user as any).id)
  const { id: rawId } = await props.params
  const id = parseInt(rawId)

  // Verify ownership
  const child = await prisma.student.findUnique({
    where: { id },
  })

  if (!child || child.parentId !== userId) {
    return NextResponse.json({ error: 'Child profile not found or access denied' }, { status: 404 })
  }

  // Soft delete child by setting status to DELETED_BY_PARENT
  await prisma.student.update({
    where: { id },
    data: { status: 'DELETED_BY_PARENT' }
  })

  return NextResponse.json({ success: true })
}
