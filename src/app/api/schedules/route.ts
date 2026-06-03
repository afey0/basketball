import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/auth'

export async function GET() {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const schedules = await prisma.schedule.findMany({
    include: { trainingGroup: { select: { groupName: true, ageGroup: true, coach: { select: { name: true } } } } },
    orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }],
  })
  return NextResponse.json(schedules)
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
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
