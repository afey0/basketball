import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/auth'
import bcrypt from 'bcryptjs'

// GET /api/super-admin/clubs - Fetch all clubs
export async function GET() {
  const session = await auth()
  if (!session || (session.user as any)?.role !== 'SUPERADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const clubs = await prisma.club.findMany({
      include: {
        users: {
          where: { role: 'ADMIN' },
          select: { name: true, email: true },
        },
        _count: {
          select: {
            users: true,
            students: true,
            trainingGroups: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json(clubs)
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to fetch clubs' }, { status: 500 })
  }
}

// POST /api/super-admin/clubs - Create a new club and its admin user
export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session || (session.user as any)?.role !== 'SUPERADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await req.json()
    const { name, slug, adminName, adminEmail, adminPassword } = body

    if (!name || !slug || !adminName || !adminEmail || !adminPassword) {
      return NextResponse.json({ error: 'All fields are required.' }, { status: 400 })
    }

    // Clean slug
    const cleanSlug = slug.toLowerCase().trim().replace(/[^a-z0-9-]/g, '')

    // Check slug uniqueness
    const existingClub = await prisma.club.findUnique({
      where: { slug: cleanSlug },
    })
    if (existingClub) {
      return NextResponse.json({ error: 'A club with this URL slug already exists.' }, { status: 409 })
    }

    // Check email uniqueness
    const existingUser = await prisma.user.findUnique({
      where: { email: adminEmail.trim().toLowerCase() },
    })
    if (existingUser) {
      return NextResponse.json({ error: 'A user with this email address already exists.' }, { status: 409 })
    }

    const hashedPassword = await bcrypt.hash(adminPassword, 12)

    // Execute in a transaction
    const newClub = await prisma.$transaction(async (tx) => {
      // 1. Create Club
      const club = await tx.club.create({
        data: {
          name: name.trim(),
          slug: cleanSlug,
        },
      })

      // 2. Create Club Settings
      await tx.clubSettings.create({
        data: {
          clubId: club.id,
          clubName: name.trim(),
          paymentDueDay: 5,
          currency: 'MVR',
        },
      })

      // 3. Create Admin User
      await tx.user.create({
        data: {
          name: adminName.trim(),
          email: adminEmail.trim().toLowerCase(),
          password: hashedPassword,
          role: 'ADMIN',
          clubId: club.id,
        },
      })

      return club
    })

    return NextResponse.json(newClub, { status: 201 })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to create club' }, { status: 500 })
  }
}

// PUT /api/super-admin/clubs - Update a club's admin details
export async function PUT(req: NextRequest) {
  const session = await auth()
  if (!session || (session.user as any)?.role !== 'SUPERADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await req.json()
    const { clubId, adminName, adminEmail, adminPassword } = body

    if (!clubId) {
      return NextResponse.json({ error: 'Club ID is required.' }, { status: 400 })
    }

    // Find the admin user for this club
    const adminUser = await prisma.user.findFirst({
      where: {
        clubId: parseInt(clubId),
        role: 'ADMIN',
      },
    })

    if (!adminUser) {
      return NextResponse.json({ error: 'Admin user for this club not found.' }, { status: 404 })
    }

    // Prepare update data
    const updateData: any = {}
    if (adminName) {
      updateData.name = adminName.trim()
    }

    if (adminEmail) {
      const cleanEmail = adminEmail.trim().toLowerCase()
      // Check email uniqueness
      const existingUser = await prisma.user.findFirst({
        where: {
          email: cleanEmail,
          NOT: { id: adminUser.id },
        },
      })
      if (existingUser) {
        return NextResponse.json({ error: 'A user with this email address already exists.' }, { status: 409 })
      }
      updateData.email = cleanEmail
    }

    if (adminPassword && adminPassword.trim() !== '') {
      if (adminPassword.length < 6) {
        return NextResponse.json({ error: 'Password must be at least 6 characters.' }, { status: 400 })
      }
      updateData.password = await bcrypt.hash(adminPassword, 12)
    }

    // Update the admin user
    const updatedUser = await prisma.user.update({
      where: { id: adminUser.id },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
      },
    })

    return NextResponse.json(updatedUser)
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to update admin credentials' }, { status: 500 })
  }
}
