import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/auth'

export async function GET(req: NextRequest, props: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id: rawId } = await props.params
  const id = parseInt(rawId)
  const student = await prisma.student.findUnique({
    where: { id },
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

  const { id: rawId } = await props.params
  const id = parseInt(rawId)
  const body = await req.json()

  const dob = body.dateOfBirth ? new Date(body.dateOfBirth) : undefined
  const age = dob ? new Date().getFullYear() - dob.getFullYear() : undefined

  const student = await prisma.student.update({
    where: { id },
    data: {
      ...(body.firstName && { firstName: body.firstName }),
      ...(body.lastName && { lastName: body.lastName }),
      ...(dob && { dateOfBirth: dob, age }),
      ...(body.gender && { gender: body.gender }),
      ...(body.ageGroup && { ageGroup: body.ageGroup }),
      ...(body.trainingGroupId !== undefined && { trainingGroupId: body.trainingGroupId || null }),
      ...(body.parentId !== undefined && { parentId: body.parentId || null }),
      ...(body.jerseyNumber !== undefined && { jerseyNumber: body.jerseyNumber || null }),
      ...(body.medicalNotes !== undefined && { medicalNotes: body.medicalNotes }),
      ...(body.status && { status: body.status }),
      ...(body.profilePhoto !== undefined && { profilePhoto: body.profilePhoto }),
    },
    include: { trainingGroup: true, parent: true },
  })
  return NextResponse.json(student)
}

export async function DELETE(req: NextRequest, props: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id: rawId } = await props.params
  const id = parseInt(rawId)
  await prisma.student.update({ where: { id }, data: { status: 'INACTIVE' } })
  return NextResponse.json({ success: true })
}
