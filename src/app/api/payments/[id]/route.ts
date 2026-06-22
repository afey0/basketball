import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/auth'
import { generateReceiptNumber } from '@/lib/utils'

export async function PUT(req: NextRequest, props: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const clubId = (session.user as any).clubId
  if (!clubId) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { id: rawId } = await props.params
  const id = parseInt(rawId)

  // Verify the payment belongs to this club
  const existingPayment = await prisma.payment.findFirst({
    where: {
      id,
      student: { clubId }
    }
  })
  if (!existingPayment) {
    return NextResponse.json({ error: 'Payment not found in this club' }, { status: 404 })
  }

  const body = await req.json()

  const receiptNumber = body.status === 'PAID'
    ? generateReceiptNumber(body.studentId || 0, body.paymentMonth || '')
    : undefined

  const payment = await prisma.payment.update({
    where: { id },
    data: {
      ...(body.status && { status: body.status }),
      ...(body.amount !== undefined && { amount: parseFloat(body.amount) }),
      ...(body.paymentMethod && { paymentMethod: body.paymentMethod }),
      ...(body.paymentDate && { paymentDate: new Date(body.paymentDate) }),
      ...(body.notes !== undefined && { notes: body.notes }),
      ...(receiptNumber && { receiptNumber }),
      recordedById: parseInt((session.user as any).id),
    },
    include: { student: { include: { trainingGroup: true } } },
  })
  return NextResponse.json(payment)
}
