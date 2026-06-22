import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/auth'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const userRole = (session.user as any)?.role
  if (userRole !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden: Admins only' }, { status: 403 })
  }

  const { id } = await params
  const staffId = parseInt(id)

  const clubId = (session.user as any).clubId
  if (!clubId) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const staff = await prisma.staff.findFirst({
    where: { id: staffId, user: { clubId } }
  })
  if (!staff) {
    return NextResponse.json({ error: 'Staff member not found in this club' }, { status: 404 })
  }

  const payments = await prisma.staffPayment.findMany({
    where: { staffId },
    orderBy: { paymentMonth: 'desc' }
  })

  return NextResponse.json(payments)
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const userRole = (session.user as any)?.role
  if (userRole !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden: Admins only' }, { status: 403 })
  }

  try {
    const { id } = await params
    const staffId = parseInt(id)

    const clubId = (session.user as any).clubId
    if (!clubId) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const staff = await prisma.staff.findFirst({
      where: { id: staffId, user: { clubId } }
    })

    if (!staff) {
      return NextResponse.json({ error: 'Staff member not found in this club' }, { status: 404 })
    }

    const body = await req.json()
    const { amount, paymentMonth, notes } = body

    if (!amount || !paymentMonth) {
      return NextResponse.json({ error: 'Amount and Payment Month are required' }, { status: 400 })
    }

    if (!/^\d{4}-\d{2}$/.test(paymentMonth)) {
      return NextResponse.json({ error: 'Payment month must be in YYYY-MM format' }, { status: 400 })
    }

    const payment = await prisma.staffPayment.create({
      data: {
        staffId,
        amount: parseFloat(amount),
        paymentMonth,
        notes: notes || null,
        status: 'PENDING'
      }
    })

    return NextResponse.json(payment, { status: 201 })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 })
  }
}
