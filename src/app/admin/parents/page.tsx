import { prisma } from '@/lib/prisma'
import TopHeader from '@/components/layout/TopHeader'
import ParentsClient from './ParentsClient'
import { auth } from '@/auth'
import { redirect } from 'next/navigation'

export default async function ParentsPage() {
  const session = await auth()
  if (!session) redirect('/auth/login')

  const userRole = (session.user as any)?.role
  if (userRole !== 'ADMIN' && userRole !== 'VIEWER') {
    redirect('/admin')
  }
  const clubId = parseInt((session.user as any).clubId)
  const parents = await prisma.user.findMany({
    where: { role: 'PARENT', clubId },
    include: {
      parentStudents: {
        select: {
          id: true, firstName: true, lastName: true, status: true,
          trainingGroup: { select: { groupName: true } }
        }
      }
    },
    orderBy: { name: 'asc' },
  })

  return (
    <>
      <TopHeader title="Parents" subtitle="Manage parent accounts and linked children" />
      <div className="page-content">
        <ParentsClient parents={parents} />
      </div>
    </>
  )
}
