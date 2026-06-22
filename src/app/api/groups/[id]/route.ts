import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/auth'

export async function GET(req: NextRequest, props: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const clubId = parseInt((session.user as any).clubId)

  const { id: rawId } = await props.params
  const id = parseInt(rawId)
  const group = await prisma.trainingGroup.findFirst({
    where: { id, clubId },
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
  const clubId = parseInt((session.user as any).clubId)

  const { id: rawId } = await props.params
  const id = parseInt(rawId)
  const body = await req.json()

  const existing = await prisma.trainingGroup.findFirst({
    where: { id, clubId }
  })
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  if (body.monthlyFee !== undefined) {
    await prisma.paymentPlan.upsert({
      where: { trainingGroupId: id },
      update: { monthlyFee: parseFloat(body.monthlyFee) },
      create: { trainingGroupId: id, monthlyFee: parseFloat(body.monthlyFee), currency: 'MVR' },
    })
  }

  const group = await prisma.trainingGroup.update({
    where: { id },
    data: {
      ...(body.groupName && { groupName: body.groupName }),
      ...(body.ageGroup && { ageGroup: body.ageGroup }),
      ...(body.coachId !== undefined && { coachId: body.coachId || null }),
      ...(body.maxCapacity && { maxCapacity: body.maxCapacity }),
      ...(body.description !== undefined && { description: body.description }),
    },
    include: {
      coach: true,
      schedules: true,
      paymentPlan: true,
      _count: { select: { students: true } }
    },
  })

  return NextResponse.json(group)
}

export async function DELETE(req: NextRequest, props: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const clubId = parseInt((session.user as any).clubId)

  const { id: rawId } = await props.params
  const id = parseInt(rawId)

  const existing = await prisma.trainingGroup.findFirst({
    where: { id, clubId }
  })
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  await prisma.trainingGroup.delete({ where: { id } })
  return NextResponse.json({ success: true })
}
