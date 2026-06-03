import { prisma } from '../src/lib/prisma'

const BASE = 'http://localhost:3000'

const c = {
  green:  (s: string) => `\x1b[32m${s}\x1b[0m`,
  red:    (s: string) => `\x1b[31m${s}\x1b[0m`,
  yellow: (s: string) => `\x1b[33m${s}\x1b[0m`,
  cyan:   (s: string) => `\x1b[36m${s}\x1b[0m`,
  bold:   (s: string) => `\x1b[1m${s}\x1b[0m`,
  dim:    (s: string) => `\x1b[2m${s}\x1b[0m`,
}

let passed = 0
let failed = 0
let adminCookie = ''
let parentCookie = ''
let otherParentCookie = ''

function pass(label: string, detail = '') {
  passed++
  console.log(`  ${c.green('✔')} ${c.bold(label.padEnd(52))} ${c.dim(detail)}`)
}

function fail(label: string, detail = '') {
  failed++
  console.log(`  ${c.red('✘')} ${c.bold(label.padEnd(52))} ${c.red(detail)}`)
}

async function login(email: string, password: string): Promise<string> {
  let jar = ''
  const csrfR = await fetch(`${BASE}/api/auth/csrf`)
  const { csrfToken } = await csrfR.json()
  jar = (csrfR.headers.get('set-cookie') || '').split(',').map((c: string) => c.split(';')[0]).join('; ')

  const body = new URLSearchParams({ email, password, csrfToken, callbackUrl: BASE, json: 'true' })
  const r = await fetch(`${BASE}/api/auth/callback/credentials`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded', Cookie: jar },
    body: body.toString(),
    redirect: 'manual',
  })
  const newCookies = (r.headers.get('set-cookie') || '').split(',').map((c: string) => c.split(';')[0])
  const merged: Record<string, string> = {}
  ;[...jar.split('; '), ...newCookies].forEach(p => {
    const [k, ...v] = p.split('=')
    if (k?.trim()) merged[k.trim()] = v.join('=')
  })
  jar = Object.entries(merged).map(([k, v]) => `${k}=${v}`).join('; ')
  return jar
}

async function run() {
  console.log(c.bold('\n💳  MBC CRM — Payment Slip Verification Integration Test'))
  console.log(c.dim(`    Server: ${BASE}\n`))

  try {
    // 1. Log in users
    adminCookie = await login('admin@mbc.mv', 'admin123')
    parentCookie = await login('mohamed@gmail.com', 'parent123')
    otherParentCookie = await login('ali.saeed@gmail.com', 'parent123')

    if (adminCookie) pass('Admin login successful')
    else return fail('Admin login failed')

    if (parentCookie) pass('Parent login successful')
    else return fail('Parent login failed')

    if (otherParentCookie) pass('Other parent login successful')
    else return fail('Other parent login failed')

    // Find student belonging to parent mohamed@gmail.com
    const parentUser = await prisma.user.findUnique({
      where: { email: 'mohamed@gmail.com' },
      include: { parentStudents: true }
    })
    const student = parentUser?.parentStudents[0]
    if (!student) return fail('No student found for parent mohamed@gmail.com')
    pass('Target student found', `${student.firstName} ${student.lastName} (ID: ${student.id})`)

    // Create an unpaid payment
    const payment = await prisma.payment.create({
      data: {
        studentId: student.id,
        amount: 350.00,
        currency: 'MVR',
        paymentMonth: '2026-06',
        dueDate: new Date('2026-06-15'),
        status: 'UNPAID',
      }
    })
    pass('Unpaid payment created', `ID: ${payment.id}, Amount: MVR ${payment.amount}`)

    // 2. Try uploading a slip using ANOTHER parent's cookie (should return 403)
    const mockFile = new Blob(['mock file content'], { type: 'image/png' })
    const formData = new FormData()
    formData.append('file', mockFile, 'slip.png')

    const badUploadRes = await fetch(`${BASE}/api/payments/${payment.id}/slip`, {
      method: 'POST',
      headers: { Cookie: otherParentCookie },
      body: formData,
    })
    if (badUploadRes.status === 403) {
      pass('Security: Uploading slip for another parent\'s child is blocked with 403')
    } else {
      fail('Security: Uploading slip for another parent\'s child should return 403', `Got status ${badUploadRes.status}`)
    }

    // 3. Upload slip using correct parent cookie
    const uploadRes = await fetch(`${BASE}/api/payments/${payment.id}/slip`, {
      method: 'POST',
      headers: { Cookie: parentCookie },
      body: formData,
    })
    if (uploadRes.status === 200) {
      const updatedPayment = await uploadRes.json()
      if (updatedPayment.status === 'PENDING' && updatedPayment.slipUrl) {
        pass('Upload Slip: Success', `Status: ${updatedPayment.status}, URL: ${updatedPayment.slipUrl}`)
      } else {
        fail('Upload Slip: Missing status PENDING or slipUrl', JSON.stringify(updatedPayment))
      }
    } else {
      fail('Upload Slip: API failed', `Got status ${uploadRes.status}`)
    }

    // 4. Try approving slip as a parent (should return 403)
    const badApproveRes = await fetch(`${BASE}/api/payments/${payment.id}/approve`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: parentCookie },
      body: JSON.stringify({ action: 'APPROVE', notes: 'Try hacking' }),
    })
    if (badApproveRes.status === 403) {
      pass('Security: Approval by parent is blocked with 403')
    } else {
      fail('Security: Approval by parent should return 403', `Got status ${badApproveRes.status}`)
    }

    // 5. Approve slip as Admin
    const approveRes = await fetch(`${BASE}/api/payments/${payment.id}/approve`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: adminCookie },
      body: JSON.stringify({ action: 'APPROVE', notes: 'Slip verified by integration test' }),
    })
    if (approveRes.status === 200) {
      const approvedPayment = await approveRes.json()
      if (approvedPayment.status === 'PAID' && approvedPayment.receiptNumber) {
        pass('Admin Approve: Success', `Status: ${approvedPayment.status}, Receipt: ${approvedPayment.receiptNumber}`)
      } else {
        fail('Admin Approve: Fields not updated correctly', JSON.stringify(approvedPayment))
      }
    } else {
      fail('Admin Approve: API failed', `Got status ${approveRes.status}`)
    }

    // 6. Test Rejection flow
    const rejectPayment = await prisma.payment.create({
      data: {
        studentId: student.id,
        amount: 450.00,
        currency: 'MVR',
        paymentMonth: '2026-07',
        dueDate: new Date('2026-07-15'),
        status: 'UNPAID',
      }
    })
    pass('Unpaid payment created for rejection testing', `ID: ${rejectPayment.id}`)

    // Upload slip
    const rejectUploadRes = await fetch(`${BASE}/api/payments/${rejectPayment.id}/slip`, {
      method: 'POST',
      headers: { Cookie: parentCookie },
      body: formData,
    })
    if (rejectUploadRes.status === 200) {
      pass('Rejection flow: Slip uploaded')
    } else {
      return fail('Rejection flow: Slip upload failed')
    }

    // Reject slip as Admin
    const rejectRes = await fetch(`${BASE}/api/payments/${rejectPayment.id}/approve`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: adminCookie },
      body: JSON.stringify({ action: 'REJECT', notes: 'Incorrect amount or blurred slip image' }),
    })
    if (rejectRes.status === 200) {
      const rejectedPayment = await rejectRes.json()
      if (rejectedPayment.status === 'UNPAID' && rejectedPayment.slipUrl === null && rejectedPayment.rejectionReason) {
        pass('Admin Reject: Success', `Status: ${rejectedPayment.status}, Rejection reason: "${rejectedPayment.rejectionReason}"`)
      } else {
        fail('Admin Reject: Fields not updated correctly', JSON.stringify(rejectedPayment))
      }
    } else {
      fail('Admin Reject: API failed', `Got status ${rejectRes.status}`)
    }

    // Clean up
    await prisma.payment.delete({ where: { id: payment.id } })
    await prisma.payment.delete({ where: { id: rejectPayment.id } })
    pass('Cleanup: Integration test data removed')

  } catch (err: any) {
    fail('Integration test failed with error', err.message || err.toString())
  }

  console.log('\n' + '─'.repeat(62))
  if (failed > 0) {
    console.log(c.red(`\n  Results: ${passed} passed, ${failed} failed\n`))
    process.exit(1)
  } else {
    console.log(c.green(`\n  🎉 All payment verification tests passed! (${passed} total)\n`))
  }
}

run().catch(err => {
  console.error(err)
  process.exit(1)
})
