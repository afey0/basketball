import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/auth'

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; paymentId: string }> }
) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const userRole = (session.user as any)?.role
  if (userRole !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden: Admins only' }, { status: 403 })
  }

  try {
    const { id, paymentId } = await params
    const staffId = parseInt(id)
    const payId = parseInt(paymentId)

    const payment = await prisma.staffPayment.findUnique({
      where: { id: payId }
    })

    if (!payment || payment.staffId !== staffId) {
      return NextResponse.json({ error: 'Payment record not found' }, { status: 404 })
    }

    const body = await req.json()
    const { amount, paymentMonth, notes, receiptUrl } = body

    if (paymentMonth && !/^\d{4}-\d{2}$/.test(paymentMonth)) {
      return NextResponse.json({ error: 'Payment month must be in YYYY-MM format' }, { status: 400 })
    }

    let updateData: any = {}
    if (amount !== undefined) updateData.amount = parseFloat(amount)
    if (paymentMonth !== undefined) updateData.paymentMonth = paymentMonth
    if (notes !== undefined) updateData.notes = notes || null
    
    if (receiptUrl !== undefined) {
      updateData.receiptUrl = receiptUrl || null
      // If a receipt URL is uploaded and status is PENDING, transition it to PENDING_VERIFICATION
      if (receiptUrl && payment.status === 'PENDING') {
        updateData.status = 'PENDING_VERIFICATION'
        updateData.paymentDate = new Date()
      } else if (!receiptUrl && payment.status === 'PENDING_VERIFICATION') {
        // If receipt is cleared, go back to PENDING
        updateData.status = 'PENDING'
        updateData.paymentDate = null
      }
    }

    const updated = await prisma.staffPayment.update({
      where: { id: payId },
      data: updateData
    })

    return NextResponse.json(updated)
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 })
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; paymentId: string }> }
) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const userRole = (session.user as any)?.role
  if (userRole !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden: Admins only' }, { status: 403 })
  }

  try {
    const { id, paymentId } = await params
    const staffId = parseInt(id)
    const payId = parseInt(paymentId)

    const payment = await prisma.staffPayment.findUnique({
      where: { id: payId }
    })

    if (!payment || payment.staffId !== staffId) {
      return NextResponse.json({ error: 'Payment record not found' }, { status: 404 })
    }

    if (payment.status === 'PAID') {
      return NextResponse.json({ error: 'Cannot delete a verified/paid payment record' }, { status: 400 })
    }

    await prisma.staffPayment.delete({
      where: { id: payId }
    })

    return NextResponse.json({ success: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 })
  }
}
