import { prisma } from '@/lib/prisma'
import TopHeader from '@/components/layout/TopHeader'
import SettingsClient from './SettingsClient'
import { auth } from '@/auth'
import { redirect } from 'next/navigation'

export default async function SettingsPage() {
  const session = await auth()
  if (!session) redirect('/auth/login')

  const userRole = (session.user as any)?.role
  if (userRole !== 'ADMIN') {
    redirect('/admin')
  }
  let settings = await prisma.clubSettings.findFirst()
  if (!settings) {
    settings = await prisma.clubSettings.create({ data: { clubName: 'Basketball Club', paymentDueDay: 5, currency: 'MVR' } })
  }
  const coaches = await prisma.user.findMany({ where: { role: { in: ['COACH','ADMIN'] } }, orderBy: { name: 'asc' } })
  return (
    <>
      <TopHeader title="Settings" subtitle="Club configuration and system settings" />
      <div className="page-content">
        <SettingsClient settings={settings} coaches={coaches} />
      </div>
    </>
  )
}
