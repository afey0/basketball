import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/auth'

export async function GET(req: NextRequest, props: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id: rawId } = await props.params
  const id = parseInt(rawId)
  const group = await prisma.trainingGroup.findUnique({
    where: { id },
    include: {
      coach: true,
      students: { where: { status: 'ACTIVE' }, include: { parent: { select: { name: true } } }, orderBy: { firstName: 'asc' } },
      schedules: true,
      paymentPlan: true,
      _count: { select: { students: true, attendance: true } },
    },
  })
  if (!group) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(group)
}

export async function PUT(req: NextRequest, props: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id: rawId } = await props.params
  const id = parseInt(rawId)
  const body = await req.json()

  const group = await prisma.trainingGroup.update({
    where: { id },
    data: {
      ...(body.groupName && { groupName: body.groupName }),
      ...(body.ageGroup && { ageGroup: body.ageGroup }),
      ...(body.coachId !== undefined && { coachId: body.coachId || null }),
      ...(body.maxCapacity && { maxCapacity: body.maxCapacity }),
      ...(body.description !== undefined && { description: body.description }),
    },
    include: { coach: true, _count: { select: { students: true } } },
  })

  if (body.monthlyFee !== undefined) {
    await prisma.paymentPlan.upsert({
      where: { trainingGroupId: id },
      update: { monthlyFee: parseFloat(body.monthlyFee) },
      create: { trainingGroupId: id, monthlyFee: parseFloat(body.monthlyFee), currency: 'MVR' },
    })
  }

  return NextResponse.json(group)
}

export async function DELETE(req: NextRequest, props: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id: rawId } = await props.params
  const id = parseInt(rawId)
  await prisma.trainingGroup.delete({ where: { id } })
  return NextResponse.json({ success: true })
}
