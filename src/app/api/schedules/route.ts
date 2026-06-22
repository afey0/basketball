import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/auth'

export async function GET() {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const clubId = (session.user as any).clubId
  if (!clubId) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const schedules = await prisma.schedule.findMany({
    where: {
      trainingGroup: { clubId: clubId }
    },
    include: { trainingGroup: { select: { groupName: true, ageGroup: true, coach: { select: { name: true } } } } },
    orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }],
  })
  return NextResponse.json(schedules)
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const clubId = (session.user as any).clubId
  if (!clubId) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = await req.json()

  // Verify the training group belongs to the same club
  const group = await prisma.trainingGroup.findFirst({
    where: { id: body.trainingGroupId, clubId: clubId }
  })
  if (!group) {
    return NextResponse.json({ error: 'Training group not found in this club' }, { status: 404 })
  }

  const schedule = await prisma.schedule.create({
    data: {
      trainingGroupId: body.trainingGroupId,
      dayOfWeek: body.dayOfWeek,
      startTime: body.startTime,
      endTime: body.endTime,
      location: body.location,
      isActive: body.isActive !== false,
    },
    include: { trainingGroup: { select: { groupName: true, ageGroup: true } } },
  })
  return NextResponse.json(schedule, { status: 201 })
}
