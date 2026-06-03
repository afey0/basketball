import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import PortalPaymentsClient from './PortalPaymentsClient'

export default async function PortalPaymentsPage() {
  const session = await auth()
  if (!session) redirect('/auth/login')
  const userId = parseInt((session.user as any).id)

  const children = await prisma.student.findMany({
    where: { parentId: userId },
    include: { 
      payments: { orderBy: { paymentMonth: 'desc' } }, 
      trainingGroup: { select: { groupName: true } } 
    },
  })

  return (
    <PortalPaymentsClient initialChildren={children} />
  )
}
