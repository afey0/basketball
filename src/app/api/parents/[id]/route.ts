import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/auth'
import bcrypt from 'bcryptjs'

export async function PUT(req: NextRequest, props: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id: rawId } = await props.params
  const id = parseInt(rawId)
  const body = await req.json()

  try {
    const data: any = {
      ...(body.name && { name: body.name }),
      ...(body.email && { email: body.email }),
      ...(body.phone !== undefined && { phone: body.phone || null }),
    }

    if (body.password) {
      data.password = await bcrypt.hash(body.password, 12)
    }

    const updated = await prisma.user.update({
      where: { id, role: 'PARENT' },
      data,
    })

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
