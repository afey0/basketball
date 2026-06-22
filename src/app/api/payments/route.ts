import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/auth'

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const clubId = (session.user as any).clubId
  if (!clubId) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { searchParams } = new URL(req.url)
  const month = searchParams.get('month')
  const status = searchParams.get('status')
  const group = searchParams.get('group')

  const payments = await prisma.payment.findMany({
    where: {
      student: {
        clubId: clubId,
        ...(group ? { trainingGroupId: parseInt(group) } : {}),
      },
      ...(month ? { paymentMonth: month } : {}),
      ...(status && status !== 'ALL' ? { status } : {}),
    },
    include: {
      student: {
        select: {
          id: true, firstName: true, lastName: true,
          trainingGroup: { select: { groupName: true } },
          parent: { select: { name: true, email: true } },
        }
      },
      recordedBy: { select: { name: true } },
    },
    orderBy: [{ paymentMonth: 'desc' }, { student: { firstName: 'asc' } }],
  })
  return NextResponse.json(payments)
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const clubId = (session.user as any).clubId
  if (!clubId) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = await req.json()

  // Verify the student belongs to the same club
  const student = await prisma.student.findFirst({
    where: { id: body.studentId, clubId: clubId }
  })
  if (!student) {
    return NextResponse.json({ error: 'Student not found in this club' }, { status: 404 })
  }

  const payment = await prisma.payment.create({
    data: {
      studentId: body.studentId,
      amount: parseFloat(body.amount),
      currency: 'MVR',
      paymentMonth: body.paymentMonth,
      dueDate: new Date(body.dueDate),
      status: body.status || 'UNPAID',
      paymentMethod: body.paymentMethod || null,
      paymentDate: body.paymentDate ? new Date(body.paymentDate) : null,
      notes: body.notes || null,
      receiptNumber: body.receiptNumber || null,
      recordedById: parseInt((session.user as any).id),
    },
    include: { student: { include: { trainingGroup: true } } },
  })
  return NextResponse.json(payment, { status: 201 })
}
