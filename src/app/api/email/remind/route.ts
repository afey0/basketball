import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/auth'
import { sendPaymentReminder, sendOverdueNotice } from '@/lib/email'
import { formatMonth } from '@/lib/utils'

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { paymentId } = await req.json()

  const payment = await prisma.payment.findUnique({
    where: { id: paymentId },
    include: {
      student: { include: { parent: true } },
    },
  })

  if (!payment || !payment.student.parent) {
    return NextResponse.json({ error: 'Payment or parent not found' }, { status: 404 })
  }

  const { student } = payment
  const parent = student.parent!
  const daysOverdue = payment.status === 'OVERDUE'
    ? Math.floor((Date.now() - new Date(payment.dueDate).getTime()) / (1000 * 60 * 60 * 24))
    : 0

  let result
  if (payment.status === 'OVERDUE') {
    result = await sendOverdueNotice(
      parent.email,
      parent.name,
      `${student.firstName} ${student.lastName}`,
      payment.amount,
      formatMonth(payment.paymentMonth),
      daysOverdue
    )
  } else {
    result = await sendPaymentReminder(
      parent.email,
      parent.name,
      `${student.firstName} ${student.lastName}`,
      payment.amount,
      formatMonth(payment.paymentMonth),
      new Date(payment.dueDate).toLocaleDateString()
    )
  }

  return NextResponse.json(result)
}
