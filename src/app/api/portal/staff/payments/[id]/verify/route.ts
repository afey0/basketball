import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/auth'

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const { id } = await params
    const paymentId = parseInt(id)
    const userId = parseInt((session.user as any).id)

    const payment = await prisma.staffPayment.findUnique({
      where: { id: paymentId },
      include: {
        staff: true
      }
    })

    if (!payment) {
      return NextResponse.json({ error: 'Payment record not found' }, { status: 404 })
    }

    // Verify ownership: the logged-in user's ID must match the userId on the Staff record
    if (payment.staff.userId !== userId) {
      return NextResponse.json({ error: 'Forbidden: You do not own this payment record' }, { status: 403 })
    }

    if (payment.status !== 'PENDING_VERIFICATION') {
      return NextResponse.json({ error: 'Payment is not in a verification pending state' }, { status: 400 })
    }

    const updated = await prisma.staffPayment.update({
      where: { id: paymentId },
      data: {
        status: 'PAID',
        paymentDate: new Date() // Set payment date to acceptance date
      }
    })

    return NextResponse.json(updated)
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 })
  }
}
