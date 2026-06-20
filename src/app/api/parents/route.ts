import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/auth'
import bcrypt from 'bcryptjs'

export async function GET() {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const parents = await prisma.user.findMany({
    where: { role: 'PARENT' },
    include: {
      parentStudents: {
        select: { id: true, firstName: true, lastName: true, status: true, trainingGroup: { select: { groupName: true } } }
      }
    },
    orderBy: { name: 'asc' },
  })
  return NextResponse.json(parents)
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  if (!body.name || !body.email || !body.phone) {
    return NextResponse.json({ error: 'Name, email, and phone number are required' }, { status: 400 })
  }

  const cleanPhone = body.phone.trim()
  if (!/^\d+$/.test(cleanPhone)) {
    return NextResponse.json({ error: 'Phone number must contain only digits' }, { status: 400 })
  }

  const hashedPassword = await bcrypt.hash(body.password || 'parent123', 12)

  try {
    const parent = await prisma.user.create({
      data: {
        name: body.name,
        email: body.email,
        password: hashedPassword,
        phone: body.phone,
        role: 'PARENT',
      },
    })
    const { password: _, ...safeParent } = parent
    return NextResponse.json(safeParent, { status: 201 })
  } catch (err: any) {
    if (err.code === 'P2002') return NextResponse.json({ error: 'Email already exists' }, { status: 400 })
    return NextResponse.json({ error: 'Failed to create parent' }, { status: 500 })
  }
}
