import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/auth'

export async function GET() {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const groups = await prisma.trainingGroup.findMany({
    include: {
      coach: { select: { id: true, name: true, email: true } },
      _count: { select: { students: true } },
      schedules: true,
      paymentPlan: true,
    },
    orderBy: { groupName: 'asc' },
  })
  return NextResponse.json(groups)
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const group = await prisma.trainingGroup.create({
    data: {
      groupName: body.groupName,
      ageGroup: body.ageGroup,
      coachId: body.coachId || null,
      maxCapacity: body.maxCapacity || 20,
      description: body.description || null,
    },
    include: { coach: true, _count: { select: { students: true } } },
  })

  if (body.monthlyFee) {
    await prisma.paymentPlan.create({
      data: { trainingGroupId: group.id, monthlyFee: parseFloat(body.monthlyFee), currency: 'MVR' }
    })
  }

  return NextResponse.json(group, { status: 201 })
}
