import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import AccountClient from './AccountClient'

export default async function AccountPage() {
  const session = await auth()
  if (!session) redirect('/auth/login')

  return (
    <div>
      <h1 style={{ fontWeight: 800, fontSize: '1.75rem', marginBottom: '1.5rem' }}>Manage Account</h1>
      <AccountClient user={session.user as any} />
    </div>
  )
}
