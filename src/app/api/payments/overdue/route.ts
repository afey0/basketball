import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/auth'

export async function POST() {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const clubId = (session.user as any).clubId
  if (!clubId) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const now = new Date()

  const result = await prisma.payment.updateMany({
    where: {
      status: 'UNPAID',
      dueDate: { lt: now },
      student: { clubId: clubId },
    },
    data: { status: 'OVERDUE' },
  })

  return NextResponse.json({ updated: result.count })
}
