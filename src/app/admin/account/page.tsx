import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import TopHeader from '@/components/layout/TopHeader'
import AdminAccountClient from './AdminAccountClient'

export default async function AdminAccountPage() {
  const session = await auth()
  if (!session) redirect('/auth/login')

  return (
    <>
      <TopHeader title="Manage Account" subtitle="Update your personal details and security credentials" />
      <div className="page-content">
        <AdminAccountClient user={session.user as any} />
      </div>
    </>
  )
}
