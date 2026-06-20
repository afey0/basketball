import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

const BASE = 'http://localhost:3000'
let cookie = ''

async function loginAs(email: string, password: string): Promise<boolean> {
  // Step 1: get CSRF token
  const csrfRes = await fetch(`${BASE}/api/auth/csrf`, { headers: { Cookie: cookie } })
  const { csrfToken } = await csrfRes.json()
  const csrfCookie = csrfRes.headers.get('set-cookie') || ''
  if (csrfCookie) cookie = csrfCookie.split(',').map((c: string) => c.split(';')[0]).join('; ')

  // Step 2: POST credentials
  const body = new URLSearchParams({ email, password, csrfToken, callbackUrl: BASE, json: 'true' })
  const res = await fetch(`${BASE}/api/auth/callback/credentials`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded', Cookie: cookie },
    body: body.toString(),
    redirect: 'manual',
  })

  const cookies = res.headers.get('set-cookie') || ''
  if (cookies) {
    const parts = cookies.split(',').map((c: string) => c.split(';')[0])
    const merged: Record<string, string> = {}
    ;[...cookie.split('; '), ...parts].forEach((p) => {
      const [k, ...v] = p.split('=')
      if (k?.trim()) merged[k.trim()] = v.join('=')
    })
    cookie = Object.entries(merged).map(([k, v]) => `${k}=${v}`).join('; ')
  }

  // Verify session
  const sessRes = await fetch(`${BASE}/api/auth/session`, { headers: { Cookie: cookie } })
  const sess = await sessRes.json()
  return !!sess?.user?.email
}

async function main() {
  const loggedIn = await loginAs('admin@mbc.mv', 'admin123')
  if (!loggedIn) {
    console.error('Failed to log in as admin')
    return
  }
  console.log('Logged in successfully!')

  const student = await prisma.student.findFirst()
  if (!student) {
    console.log('No student found')
    return
  }

  console.log('Before API PUT:', {
    id: student.id,
    firstName: student.firstName,
    dateOfBirth: student.dateOfBirth,
    age: student.age,
  })

  // Perform HTTP PUT request
  const url = `${BASE}/api/students/${student.id}`
  const body = {
    ...student,
    dateOfBirth: '2013-05-20', // Change birthday
    firstName: 'UpdatedFirst', // Change firstName
  }

  const res = await fetch(url, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Cookie: cookie,
    },
    body: JSON.stringify(body),
  })

  console.log('Response Status:', res.status)
  if (res.ok) {
    const data = await res.json()
    console.log('API Response data:', {
      id: data.id,
      firstName: data.firstName,
      dateOfBirth: data.dateOfBirth,
      age: data.age,
    })
  } else {
    console.log('API Error:', await res.text())
  }

  const studentAfter = await prisma.student.findUnique({ where: { id: student.id } })
  console.log('After API PUT in DB:', {
    id: studentAfter?.id,
    firstName: studentAfter?.firstName,
    dateOfBirth: studentAfter?.dateOfBirth,
    age: studentAfter?.age,
  })
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
