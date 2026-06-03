import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/auth'

export async function PUT(req: NextRequest, props: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id: rawId } = await props.params
  const id = parseInt(rawId)
  const body = await req.json()

  const schedule = await prisma.schedule.update({
    where: { id },
    data: {
      ...(body.dayOfWeek && { dayOfWeek: body.dayOfWeek }),
      ...(body.startTime && { startTime: body.startTime }),
      ...(body.endTime && { endTime: body.endTime }),
      ...(body.location && { location: body.location }),
      ...(body.isActive !== undefined && { isActive: body.isActive }),
    },
    include: { trainingGroup: { select: { groupName: true } } },
  })
  return NextResponse.json(schedule)
}

export async function DELETE(req: NextRequest, props: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id: rawId } = await props.params
  const id = parseInt(rawId)
  await prisma.schedule.delete({ where: { id } })
  return NextResponse.json({ success: true })
}
