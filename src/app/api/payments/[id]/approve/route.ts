import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/auth'
import { generateReceiptNumber } from '@/lib/utils'

export async function POST(req: NextRequest, props: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const userRole = (session.user as any)?.role
  if (userRole !== 'ADMIN' && userRole !== 'COACH') {
    return NextResponse.json({ error: 'Forbidden: Admins and Coaches only' }, { status: 403 })
  }

  const { id: rawId } = await props.params
  const paymentId = parseInt(rawId)

  try {
    const body = await req.json()
    const { action, notes } = body

    if (!['APPROVE', 'REJECT'].includes(action)) {
      return NextResponse.json({ error: 'Invalid action. Must be APPROVE or REJECT' }, { status: 400 })
    }

    const clubId = (session.user as any).clubId
    if (!clubId) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const payment = await prisma.payment.findFirst({
      where: { id: paymentId, student: { clubId } },
    })
    if (!payment) return NextResponse.json({ error: 'Payment not found in this club' }, { status: 404 })

    let updated
    const userId = parseInt((session.user as any).id)

    if (action === 'APPROVE') {
      const receiptNumber = generateReceiptNumber(payment.studentId, payment.paymentMonth)
      
      updated = await prisma.payment.update({
        where: { id: paymentId },
        data: {
          status: 'PAID',
          paymentDate: new Date(),
          paymentMethod: 'BANK_TRANSFER',
          recordedById: userId,
          receiptNumber,
          notes: notes ? `${payment.notes ? payment.notes + ' | ' : ''}Approval notes: ${notes}` : payment.notes,
        },
        include: { student: true }
      })
    } else {
      // Rejection flow
      const now = new Date()
      // If due date is in the past, set status back to OVERDUE, otherwise UNPAID
      const status = new Date(payment.dueDate) < now ? 'OVERDUE' : 'UNPAID'

      updated = await prisma.payment.update({
        where: { id: paymentId },
        data: {
          status,
          slipUrl: null,
          rejectionReason: notes || 'Payment slip rejected by admin/coach.',
          recordedById: userId,
        },
        include: { student: true }
      })
    }

    return NextResponse.json(updated)
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 })
  }
}
