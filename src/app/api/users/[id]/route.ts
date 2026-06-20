import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/auth'
import bcrypt from 'bcryptjs'
import { sendPasswordResetEmail } from '@/lib/email'

export async function GET(req: NextRequest, props: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id: rawId } = await props.params
  const id = parseInt(rawId)
  const loggedInUserId = parseInt((session.user as any).id)
  const loggedInUserRole = (session.user as any)?.role

  if (loggedInUserRole !== 'ADMIN' && loggedInUserId !== id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id }
    })
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

    const { password, ...safe } = user
    return NextResponse.json(safe)
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 })
  }
}

export async function PUT(req: NextRequest, props: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id: rawId } = await props.params
  const id = parseInt(rawId)
  const body = await req.json()

  const loggedInUserRole = (session.user as any)?.role
  const loggedInUserId = parseInt((session.user as any).id)

  // A user can update their own profile, but only admins can update other profiles
  if (loggedInUserRole !== 'ADMIN' && loggedInUserId !== id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  // Prevent self-role modification to non-admin or self-deletion to prevent lockouts
  if (id === loggedInUserId && body.role && body.role !== 'ADMIN' && loggedInUserRole === 'ADMIN') {
    return NextResponse.json({ error: 'Cannot remove admin role from yourself' }, { status: 400 })
  }

  if (body.phone !== undefined && body.phone && !/^\d+$/.test(body.phone.trim())) {
    return NextResponse.json({ error: 'Phone number must contain only digits' }, { status: 400 })
  }

  try {
    const data: any = {
      ...(body.name && { name: body.name }),
      ...(body.email && { email: body.email }),
      ...(body.phone !== undefined && { phone: body.phone || null }),
      ...(body.role && loggedInUserRole === 'ADMIN' && { role: body.role }),
    }

    if (body.password) {
      if (loggedInUserId === id) {
        if (!body.currentPassword) {
          return NextResponse.json({ error: 'Current password is required to change password' }, { status: 400 })
        }
        const currentUser = await prisma.user.findUnique({ where: { id } })
        if (!currentUser) {
          return NextResponse.json({ error: 'User not found' }, { status: 404 })
        }
        const valid = await bcrypt.compare(body.currentPassword, currentUser.password)
        if (!valid) {
          return NextResponse.json({ error: 'Incorrect current password' }, { status: 400 })
        }
      }
      data.password = await bcrypt.hash(body.password, 12)
    }

    const updated = await prisma.user.update({
      where: { id },
      data,
    })

    if (body.password) {
      sendPasswordResetEmail(updated.email, updated.name, updated.role, body.password)
        .catch(err => console.error('Failed to send password reset email:', err))
    }

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
