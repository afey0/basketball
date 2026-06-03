import { redirect } from 'next/navigation'
import { auth } from '@/auth'

export default async function HomePage() {
  const session = await auth()
  if (!session) redirect('/auth/login')
  const role = (session.user as any)?.role
  if (role === 'PARENT') redirect('/portal')
  redirect('/admin')
}
