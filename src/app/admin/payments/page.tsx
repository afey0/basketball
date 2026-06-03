import { prisma } from '@/lib/prisma'
import TopHeader from '@/components/layout/TopHeader'
import PaymentsClient from './PaymentsClient'

export default async function PaymentsPage() {
  const now = new Date()
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}`

  const [payments, groups, settings] = await Promise.all([
    prisma.payment.findMany({
      where: { paymentMonth: currentMonth },
      include: {
        student: {
          select: {
            id: true, firstName: true, lastName: true,
            trainingGroup: { select: { groupName: true } },
            parent: { select: { name: true, email: true } },
          }
        },
      },
      orderBy: [{ status: 'asc' }, { student: { firstName: 'asc' } }],
    }),
    prisma.trainingGroup.findMany({ orderBy: { groupName: 'asc' } }),
    prisma.clubSettings.findFirst(),
  ])

  return (
    <>
      <TopHeader title="Payments" subtitle="Track and manage monthly training fees" />
      <div className="page-content">
        <PaymentsClient payments={payments} groups={groups} settings={settings} currentMonth={currentMonth} />
      </div>
    </>
  )
}
