import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import PortalPaymentsClient from './PortalPaymentsClient'

export default async function PortalPaymentsPage(props: { searchParams: Promise<{ studentId?: string }> }) {
  const session = await auth()
  if (!session) redirect('/auth/login')
  const userId = parseInt((session.user as any).id)
  const searchParams = await props.searchParams
  const studentId = searchParams.studentId ? parseInt(searchParams.studentId) : undefined

  const children = await prisma.student.findMany({
    where: { 
      parentId: userId,
      ...(studentId ? { id: studentId } : {}),
      status: { not: 'DELETED_BY_PARENT' }
    },
    include: { 
      payments: { orderBy: { paymentMonth: 'desc' } }, 
      trainingGroup: { select: { groupName: true } } 
    },
  })

  return (
    <PortalPaymentsClient key={studentId || 'all'} initialChildren={children} />
  )
}
