import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/auth'
import bcrypt from 'bcryptjs'

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
    where: {
      id: staffId,
      user: { clubId: clubId }
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          role: true,
        }
      }
    }
  })

  if (!staff) {
    return NextResponse.json({ error: 'Staff not found in this club' }, { status: 404 })
  }

  return NextResponse.json(staff)
}

export async function PUT(
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
      where: {
        id: staffId,
        user: { clubId: clubId }
      }
    })

    if (!staff) {
      return NextResponse.json({ error: 'Staff not found in this club' }, { status: 404 })
    }

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

    if (!name || !email || !staffType) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    if (phone && !/^\d+$/.test(phone.trim())) {
      return NextResponse.json({ error: 'Phone number must contain only digits' }, { status: 400 })
    }

    let updateUserData: any = {
      name,
      email,
      phone: phone || null,
    }

    if (password && password.trim() !== '') {
      updateUserData.password = await bcrypt.hash(password, 12)
    }

    // Execute updates
    const updatedStaff = await prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: staff.userId },
        data: updateUserData
      })

      const updated = await tx.staff.update({
        where: { id: staffId },
        data: {
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
            }
          }
        }
      })

      return updated
    })

    return NextResponse.json(updatedStaff)
  } catch (err: any) {
    if (err.code === 'P2002') {
      return NextResponse.json({ error: 'Email already exists' }, { status: 400 })
    }
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 })
  }
}

export async function DELETE(
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
      where: {
        id: staffId,
        user: { clubId: clubId }
      }
    })

    if (!staff) {
      return NextResponse.json({ error: 'Staff not found in this club' }, { status: 404 })
    }

    // Deleting the user will cascade delete the staff profile because of Prisma schema definition
    await prisma.user.delete({
      where: { id: staff.userId }
    })

    return NextResponse.json({ success: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 })
  }
}
