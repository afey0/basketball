import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/auth'
import bcrypt from 'bcryptjs'

export async function PUT(req: NextRequest, props: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const userRole = (session.user as any)?.role
  if (userRole !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden: Admins only' }, { status: 403 })
  }

  const { id: rawId } = await props.params
  const id = parseInt(rawId)
  const body = await req.json()

  // Prevent self-role modification to non-admin or self-deletion to prevent lockouts
  if (id === parseInt((session.user as any).id) && body.role && body.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Cannot remove admin role from yourself' }, { status: 400 })
  }

  try {
    const data: any = {
      ...(body.name && { name: body.name }),
      ...(body.email && { email: body.email }),
      ...(body.phone !== undefined && { phone: body.phone || null }),
      ...(body.role && { role: body.role }),
    }

    if (body.password) {
      data.password = await bcrypt.hash(body.password, 12)
    }

    const updated = await prisma.user.update({
      where: { id },
      data,
    })

    const { password: _, ...safeUser } = updated
    return NextResponse.json(safeUser)
  } catch (err: any) {
    if (err.code === 'P2002') {
      return NextResponse.json({ error: 'Email already exists' }, { status: 400 })
    }
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, props: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const userRole = (session.user as any)?.role
  if (userRole !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden: Admins only' }, { status: 403 })
  }

  const { id: rawId } = await props.params
  const id = parseInt(rawId)

  // Prevent self-deletion
  if (id === parseInt((session.user as any).id)) {
    return NextResponse.json({ error: 'Cannot delete your own admin account' }, { status: 400 })
  }

  try {
    // If it's a coach, set coachId on training groups to null
    await prisma.trainingGroup.updateMany({
      where: { coachId: id },
      data: { coachId: null }
    })

    // If it's a parent, set parentId on students to null
    await prisma.student.updateMany({
      where: { parentId: id },
      data: { parentId: null }
    })

    await prisma.user.delete({
      where: { id }
    })

    return NextResponse.json({ success: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to delete user' }, { status: 500 })
  }
}
