import { prisma } from '@/lib/prisma'
import TopHeader from '@/components/layout/TopHeader'
import StudentsClient from './StudentsClient'

export default async function StudentsPage() {
  const [students, groups, parents] = await Promise.all([
    prisma.student.findMany({
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
    prisma.trainingGroup.findMany({ orderBy: { groupName: 'asc' } }),
    prisma.user.findMany({ where: { role: 'PARENT' }, orderBy: { name: 'asc' } }),
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
