import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/auth'
import bcrypt from 'bcryptjs'
import { validateCountryIdCard } from '@/lib/utils'

export async function GET() {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const userRole = (session.user as any)?.role
  if (userRole !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden: Admins only' }, { status: 403 })
  }

  const users = await prisma.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      role: true,
      country: true,
      idCardOrPassport: true,
      createdAt: true,
    },
    orderBy: { name: 'asc' },
  })

  return NextResponse.json(users)
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const clubId = (session.user as any).clubId
  if (!clubId) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  try {
    const body = await req.json()
    const { name, email, phone, password, role, country, idCardOrPassport } = body

    if (!name || !email || !password || !role) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    if (!['ADMIN', 'VIEWER'].includes(role)) {
      return NextResponse.json({ error: 'Invalid role' }, { status: 400 })
    }

    if (phone && !/^\d+$/.test(phone.trim())) {
      return NextResponse.json({ error: 'Phone number must contain only digits' }, { status: 400 })
    }

    const validationError = validateCountryIdCard(country, idCardOrPassport)
    if (validationError) {
      return NextResponse.json({ error: validationError }, { status: 400 })
    }

    let finalIdCard = idCardOrPassport?.trim() || null
    if (finalIdCard && (country?.trim().toLowerCase() === 'maldives')) {
      finalIdCard = finalIdCard.toUpperCase()
    }

    const hashedPassword = await bcrypt.hash(password, 12)

    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        phone: phone || null,
        role,
        clubId,
        country: country || null,
        idCardOrPassport: finalIdCard,
      },
    })

    const { password: _, ...safeUser } = user
    return NextResponse.json(safeUser, { status: 201 })
  } catch (err: any) {
    if (err.code === 'P2002') {
      const target = String(err.meta?.target || '')
      if (target.includes('idCardOrPassport')) {
        return NextResponse.json({ error: 'Duplicate ID Card or Passport number found.' }, { status: 400 })
      }
      return NextResponse.json({ error: 'Email already exists' }, { status: 400 })
    }
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 })
  }
}
