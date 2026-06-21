import { prisma } from '@/lib/prisma'
import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import TopHeader from '@/components/layout/TopHeader'
import StaffsClient from './StaffsClient'

export default async function StaffsPage() {
  const session = await auth()
  if (!session) redirect('/auth/login')

  const userRole = (session.user as any)?.role
  if (userRole !== 'ADMIN') {
    redirect('/admin')
  }

  // Ensure all existing coaches have a Staff record (auto-migration/on-the-fly seeding)
  const coaches = await prisma.user.findMany({
    where: { role: 'COACH' }
  })

  for (const coach of coaches) {
    const existingStaff = await prisma.staff.findUnique({
      where: { userId: coach.id }
    })
    if (!existingStaff) {
      await prisma.staff.create({
        data: {
          userId: coach.id,
          staffType: 'COACH',
          biography: 'No biography set.',
          salary: 0,
        }
      })
    }
  }

  // Query all staff records including User accounts
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

  return (
    <>
      <TopHeader title="Staff Management" subtitle="Manage coaches, assistants, helpers, and other staff members" />
      <div className="page-content">
        <StaffsClient staffs={staffs} />
      </div>
    </>
  )
}
