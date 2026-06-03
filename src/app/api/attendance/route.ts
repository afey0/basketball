import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/auth'

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const date = searchParams.get('date')
  const groupId = searchParams.get('groupId')
  const studentId = searchParams.get('studentId')

  const attendance = await prisma.attendance.findMany({
    where: {
      ...(date ? { date: new Date(date) } : {}),
      ...(groupId ? { trainingGroupId: parseInt(groupId) } : {}),
      ...(studentId ? { studentId: parseInt(studentId) } : {}),
    },
    include: {
      student: { select: { id: true, firstName: true, lastName: true, jerseyNumber: true } },
      trainingGroup: { select: { groupName: true } },
    },
    orderBy: { date: 'desc' },
  })
  return NextResponse.json(attendance)
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  // Support bulk upsert
  const records = Array.isArray(body) ? body : [body]
  const userId = parseInt((session.user as any).id)

  const results = []
  for (const r of records) {
    const result = await prisma.attendance.upsert({
      where: {
        studentId_date_trainingGroupId: {
          studentId: r.studentId,
          date: new Date(r.date),
          trainingGroupId: r.trainingGroupId,
        }
      },
      update: { status: r.status, notes: r.notes || null, markedById: userId },
      create: {
        studentId: r.studentId,
        trainingGroupId: r.trainingGroupId,
        date: new Date(r.date),
        status: r.status,
        notes: r.notes || null,
        markedById: userId,
      },
    })
    results.push(result)
  }
  return NextResponse.json(results)
}
