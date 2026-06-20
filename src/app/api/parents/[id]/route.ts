import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/auth'
import bcrypt from 'bcryptjs'
import { sendPasswordResetEmail } from '@/lib/email'

export async function PUT(req: NextRequest, props: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id: rawId } = await props.params
  const id = parseInt(rawId)
  const body = await req.json()

  const loggedInUserRole = (session.user as any).role
  const loggedInUserId = parseInt(session.user.id)

  if (loggedInUserRole !== 'ADMIN' && loggedInUserId !== id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  if (body.phone !== undefined && !body.phone) {
    return NextResponse.json({ error: 'Phone number is required' }, { status: 400 })
  }

  if (body.phone !== undefined && !/^\d+$/.test(body.phone.trim())) {
    return NextResponse.json({ error: 'Phone number must contain only digits' }, { status: 400 })
  }

  try {
    const data: any = {
      ...(body.name && { name: body.name }),
      ...(body.email && { email: body.email }),
      ...(body.phone !== undefined && { phone: body.phone }),
    }

    if (body.password) {
      if (loggedInUserRole === 'PARENT') {
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
      where: { id, role: 'PARENT' },
      data,
    })

    if (body.password) {
      sendPasswordResetEmail(updated.email, updated.name, updated.role, body.password)
        .catch(err => console.error('Failed to send password reset email:', err))
    }

    const { password: _, ...safeUser } = updated
    return NextResponse.json(safeUser)
  } catch (err: any) {
    if (err.code === 'P2002') return NextResponse.json({ error: 'Email already exists' }, { status: 400 })
    return NextResponse.json({ error: 'Failed to update parent' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, props: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const loggedInUserRole = (session.user as any).role
  if (loggedInUserRole !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { id: rawId } = await props.params
  const id = parseInt(rawId)

  try {
    // Delete the parent (or optionally unlink students, etc.)
    // Note: SQLite onDelete cascade or manual handle. Let's just unlink student parentId
    await prisma.student.updateMany({
      where: { parentId: id },
      data: { parentId: null }
    })

    await prisma.user.delete({
      where: { id, role: 'PARENT' }
    })

    return NextResponse.json({ success: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to delete parent' }, { status: 500 })
  }
}
