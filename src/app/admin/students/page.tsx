import { prisma } from '@/lib/prisma'
import TopHeader from '@/components/layout/TopHeader'
import StudentsClient from './StudentsClient'
import { auth } from '@/auth'
import { redirect } from 'next/navigation'

export default async function StudentsPage() {
  const session = await auth()
  if (!session) redirect('/auth/login')
  const clubId = parseInt((session.user as any).clubId)

  const [students, groups, parents] = await Promise.all([
    prisma.student.findMany({
      where: { clubId },
      include: {
        trainingGroup: { select: { groupName: true, ageGroup: true } },
        parent: { select: { name: true, email: true, phone: true } },
        payments: {
          where: { paymentMonth: `${new Date().getFullYear()}-${String(new Date().getMonth()+1).padStart(2,'0')}` },
          select: { status: true }
        }
      },
      orderBy: [{ status: 'asc' }, { firstName: 'asc' }]
    }),
    prisma.trainingGroup.findMany({ where: { clubId }, orderBy: { groupName: 'asc' } }),
    prisma.user.findMany({ where: { role: 'PARENT', clubId }, orderBy: { name: 'asc' } }),
  ])

  return (
    <>
      <TopHeader title="Students" subtitle="Manage all enrolled students" />
      <div className="page-content">
        <StudentsClient students={students} groups={groups} parents={parents} />
      </div>
    </>
  )
}
