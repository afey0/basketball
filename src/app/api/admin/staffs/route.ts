import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/auth'
import bcrypt from 'bcryptjs'

export async function GET() {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const userRole = (session.user as any)?.role
  if (userRole !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden: Admins only' }, { status: 403 })
  }

  const staffs = await prisma.staff.findMany({
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          role: true,
          createdAt: true,
        }
      }
    },
    orderBy: {
      user: {
        name: 'asc'
      }
    }
  })

  return NextResponse.json(staffs)
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const userRole = (session.user as any)?.role
  if (userRole !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden: Admins only' }, { status: 403 })
  }

  try {
    const body = await req.json()
    const {
      name,
      email,
      phone,
      password,
      staffType,
      biography,
      certificatesUrl,
      passportUrl,
      idCardUrl,
      policeReportUrl,
      contractUrl,
      salary
    } = body

    if (!name || !email || !password || !staffType) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    if (phone && !/^\d+$/.test(phone.trim())) {
      return NextResponse.json({ error: 'Phone number must contain only digits' }, { status: 400 })
    }

    const hashedPassword = await bcrypt.hash(password, 12)

    // Execute in a transaction to ensure atomic User and Staff creation
    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          name,
          email,
          password: hashedPassword,
          phone: phone || null,
          role: 'COACH', // All staffs are given the COACH role to grant them access to dashboard/attendance
        }
      })

      const staff = await tx.staff.create({
        data: {
          userId: user.id,
          staffType,
          biography: biography || null,
          certificatesUrl: certificatesUrl || null,
          passportUrl: passportUrl || null,
          idCardUrl: idCardUrl || null,
          policeReportUrl: policeReportUrl || null,
          contractUrl: contractUrl || null,
          salary: salary ? parseFloat(salary) : 0,
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
              role: true,
              createdAt: true,
            }
          }
        }
      })

      return staff
    })

    return NextResponse.json(result, { status: 201 })
  } catch (err: any) {
    if (err.code === 'P2002') {
      return NextResponse.json({ error: 'Email already exists' }, { status: 400 })
    }
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 })
  }
}
