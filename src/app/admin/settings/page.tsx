import { prisma } from '@/lib/prisma'
import TopHeader from '@/components/layout/TopHeader'
import SettingsClient from './SettingsClient'
import { auth } from '@/auth'
import { redirect } from 'next/navigation'

export default async function SettingsPage() {
  const session = await auth()
  if (!session) redirect('/auth/login')

  const userRole = (session.user as any)?.role
  if (userRole !== 'ADMIN' && userRole !== 'VIEWER') {
    redirect('/admin')
  }
  const clubId = parseInt((session.user as any).clubId)
  let settings = await prisma.clubSettings.findUnique({
    where: { clubId }
  })
  if (!settings) {
    settings = await prisma.clubSettings.create({
      data: {
        clubId,
        clubName: 'Basketball Club',
        paymentDueDay: 5,
        currency: 'MVR'
      }
    })
  }
  const coaches = await prisma.user.findMany({
    where: {
      role: { in: ['COACH','ADMIN'] },
      clubId
    },
    orderBy: { name: 'asc' }
  })
  return (
    <>
      <TopHeader title="Settings" subtitle="Club configuration and system settings" />
      <div className="page-content">
        <SettingsClient settings={settings} coaches={coaches} />
      </div>
    </>
  )
}
