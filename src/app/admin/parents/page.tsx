import { prisma } from '@/lib/prisma'
import TopHeader from '@/components/layout/TopHeader'
import ParentsClient from './ParentsClient'

export default async function ParentsPage() {
  const parents = await prisma.user.findMany({
    where: { role: 'PARENT' },
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
