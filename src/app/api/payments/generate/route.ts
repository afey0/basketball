import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/auth'
import { generateReceiptNumber } from '@/lib/utils'

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { month, dueDay = 5 } = body

  if (!month) return NextResponse.json({ error: 'Month required (YYYY-MM)' }, { status: 400 })
  if (!/^\d{4}-\d{2}$/.test(month)) {
    return NextResponse.json({ error: 'Invalid month format, must be YYYY-MM' }, { status: 400 })
  }

  const [yr, mo] = month.split('-').map(Number)
  if (isNaN(yr) || isNaN(mo) || mo < 1 || mo > 12) {
    return NextResponse.json({ error: 'Invalid year or month numbers' }, { status: 400 })
  }
  const dueDate = new Date(yr, mo - 1, dueDay)

  // Get all active students with their payment plans
  const students = await prisma.student.findMany({
    where: { status: 'ACTIVE', trainingGroupId: { not: null } },
    include: { trainingGroup: { include: { paymentPlan: true } } },
  })

  let created = 0
  let skipped = 0

  for (const student of students) {
    const fee = student.trainingGroup?.paymentPlan?.monthlyFee || 0
    if (fee <= 0) { skipped++; continue }

    const existing = await prisma.payment.findFirst({
      where: { studentId: student.id, paymentMonth: month }
    })
    if (existing) { skipped++; continue }

    await prisma.payment.create({
      data: {
        studentId: student.id,
        amount: fee,
        currency: 'MVR',
        paymentMonth: month,
        dueDate,
        status: 'UNPAID',
        recordedById: parseInt((session.user as any).id),
      }
    })
    created++
  }

  return NextResponse.json({ created, skipped, total: students.length })
}
