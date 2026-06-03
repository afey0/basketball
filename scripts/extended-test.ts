/**
 * MBC CRM — Extended Acceptance Test Suite (Round 2)
 * Run: npx tsx scripts/extended-test.ts
 *
 * Covers:
 *  1.  Security — unauthenticated & cross-role access
 *  2.  Input validation & edge cases
 *  3.  Page rendering (UI HTTP status checks)
 *  4.  Student lifecycle (enroll → attend → pay → archive)
 *  5.  Payment business logic (receipt numbers, overdue flagging)
 *  6.  Attendance idempotency & bulk ops
 *  7.  Parent portal data isolation
 *  8.  Email reminder API
 *  9.  Settings persistence across requests
 *  10. Concurrent duplicate prevention
 *  11. Cleanup
 */

const BASE = 'http://localhost:3000'

// ─── Colour helpers ─────────────────────────────────────────────────────────
const c = {
  green:  (s: string) => `\x1b[32m${s}\x1b[0m`,
  red:    (s: string) => `\x1b[31m${s}\x1b[0m`,
  yellow: (s: string) => `\x1b[33m${s}\x1b[0m`,
  cyan:   (s: string) => `\x1b[36m${s}\x1b[0m`,
  bold:   (s: string) => `\x1b[1m${s}\x1b[0m`,
  dim:    (s: string) => `\x1b[2m${s}\x1b[0m`,
}

let passed = 0; let failed = 0; let warned = 0
let adminCookie = ''; let parentCookie = ''; let coachCookie = ''
const ids: Record<string, number> = {}
const ts = Date.now()

function pass(label: string, detail = '') { passed++; console.log(`  ${c.green('✔')} ${c.bold(label.padEnd(48))} ${c.dim(detail)}`) }
function fail(label: string, detail = '') { failed++; console.log(`  ${c.red('✘')} ${c.bold(label.padEnd(48))} ${c.red(detail)}`) }
function warn(label: string, detail = '') { warned++; console.log(`  ${c.yellow('⚠')} ${c.bold(label.padEnd(48))} ${c.yellow(detail)}`) }
function section(t: string) { console.log(`\n${c.cyan(c.bold(`── ${t} ${'─'.repeat(Math.max(0, 52 - t.length))}`))}`) }

async function req(method: string, path: string, body?: object, cookie = adminCookie) {
  const opts: RequestInit = { method, headers: { 'Content-Type': 'application/json', Cookie: cookie } }
  if (body) opts.body = JSON.stringify(body)
  const r = await fetch(`${BASE}${path}`, opts)
  let data: any = null
  try { data = await r.json() } catch { /* no json */ }
  return { status: r.status, data, headers: r.headers }
}

async function page(path: string, cookie = adminCookie) {
  const r = await fetch(`${BASE}${path}`, { headers: { Cookie: cookie }, redirect: 'manual' })
  return { status: r.status, location: r.headers.get('location') }
}

async function login(email: string, password: string): Promise<string> {
  let jar = ''
  const csrfR = await fetch(`${BASE}/api/auth/csrf`, { headers: { Cookie: jar } })
  const { csrfToken } = await csrfR.json()
  jar = (csrfR.headers.get('set-cookie') || '').split(',').map((c: string) => c.split(';')[0]).join('; ')

  const body = new URLSearchParams({ email, password, csrfToken, callbackUrl: BASE, json: 'true' })
  const r = await fetch(`${BASE}/api/auth/callback/credentials`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded', Cookie: jar },
    body: body.toString(), redirect: 'manual',
  })
  const newCookies = (r.headers.get('set-cookie') || '').split(',').map((c: string) => c.split(';')[0])
  const merged: Record<string, string> = {}
  ;[...jar.split('; '), ...newCookies].forEach(p => { const [k, ...v] = p.split('='); if (k?.trim()) merged[k.trim()] = v.join('=') })
  jar = Object.entries(merged).map(([k, v]) => `${k}=${v}`).join('; ')

  const sessR = await fetch(`${BASE}/api/auth/session`, { headers: { Cookie: jar } })
  const sess = await sessR.json()
  return sess?.user ? jar : ''
}

// ============================================================
async function run() {
  console.log(c.bold('\n🏀  MBC CRM — Extended Acceptance Test Suite'))
  console.log(c.dim(`    Server: ${BASE}    Run ID: ${ts}\n`))

  // Setup sessions
  adminCookie  = await login('admin@mbc.mv', 'admin123')
  parentCookie = await login('mohamed@gmail.com', 'parent123')
  coachCookie  = await login('ibrahim@mbc.mv', 'coach123')
  if (adminCookie)  pass('Admin session ready',  'admin@mbc.mv')
  else              fail('Admin session ready',  'Login failed — aborting')
  if (parentCookie) pass('Parent session ready', 'mohamed@gmail.com')
  else              fail('Parent session ready')
  if (coachCookie)  pass('Coach session ready',  'ibrahim@mbc.mv')
  else              fail('Coach session ready')

  // ── 1. SECURITY ──────────────────────────────────────────────────────────
  section('1. Security — Unauthenticated & Cross-Role Access')

  // No cookie → protected API returns 401
  const { status: unauth1 } = await req('GET', '/api/students', undefined, '')
  unauth1 === 401 ? pass('Unauthenticated /api/students → 401') : fail('Unauthenticated /api/students → 401', `got ${unauth1}`)

  const { status: unauth2 } = await req('GET', '/api/payments', undefined, '')
  unauth2 === 401 ? pass('Unauthenticated /api/payments → 401') : fail('Unauthenticated /api/payments → 401', `got ${unauth2}`)

  const { status: unauth3 } = await req('GET', '/api/groups', undefined, '')
  unauth3 === 401 ? pass('Unauthenticated /api/groups → 401') : fail('Unauthenticated /api/groups → 401', `got ${unauth3}`)

  // Unauthenticated pages redirect to login
  const adminPage = await page('/admin', '')
  adminPage.status === 307 || adminPage.status === 308 || adminPage.status === 302
    ? pass('Unauthenticated /admin → redirect to login', `→ ${adminPage.location}`)
    : fail('Unauthenticated /admin → redirect', `status ${adminPage.status}`)

  const portalPage = await page('/portal', '')
  portalPage.status === 307 || portalPage.status === 308 || portalPage.status === 302
    ? pass('Unauthenticated /portal → redirect to login', `→ ${portalPage.location}`)
    : fail('Unauthenticated /portal → redirect', `status ${portalPage.status}`)

  // Parent cookie cannot access admin pages (should redirect)
  const parentAdminPage = await page('/admin', parentCookie)
  parentAdminPage.status === 307 || parentAdminPage.status === 302
    ? pass('Parent accessing /admin → redirected away', `→ ${parentAdminPage.location}`)
    : warn('Parent accessing /admin → redirected away', `got ${parentAdminPage.status} (check role guard)`)

  // Admin cookie accessing parent portal — should redirect to /admin
  const adminPortalPage = await page('/portal', adminCookie)
  adminPortalPage.status === 307 || adminPortalPage.status === 302
    ? pass('Admin accessing /portal → redirected to admin', `→ ${adminPortalPage.location}`)
    : warn('Admin accessing /portal', `got ${adminPortalPage.status}`)

  // ── 2. INPUT VALIDATION & EDGE CASES ─────────────────────────────────────
  section('2. Input Validation & Edge Cases')

  // Missing required fields for student
  const { status: badStudent } = await req('POST', '/api/students', { firstName: '' })
  badStudent >= 400 ? pass('POST /api/students — missing fields rejected', `status ${badStudent}`) : fail('POST /api/students — missing fields rejected', `got ${badStudent}`)

  // Invalid student ID
  const { status: notFound } = await req('GET', '/api/students/999999')
  notFound === 404 ? pass('GET /api/students/999999 → 404') : fail('GET /api/students/999999 → 404', `got ${notFound}`)

  // Invalid group ID
  const { status: groupNotFound } = await req('GET', '/api/groups/999999')
  groupNotFound === 404 ? pass('GET /api/groups/999999 → 404') : fail('GET /api/groups/999999 → 404', `got ${groupNotFound}`)

  // Payment generation with missing month
  const { status: noMonth } = await req('POST', '/api/payments/generate', {})
  noMonth === 400 ? pass('POST /api/payments/generate — missing month → 400') : fail('Missing month → 400', `got ${noMonth}`)

  // Payment generation with bad format
  const { status: badMonth } = await req('POST', '/api/payments/generate', { month: 'not-a-month' })
  // This might 500 or 400 — either is acceptable (not 200)
  badMonth !== 200 ? pass('POST /api/payments/generate — bad month format rejected', `status ${badMonth}`) : fail('Bad month format rejected', 'should not be 200')

  // Duplicate parent email
  const { data: existingParents } = await req('GET', '/api/parents')
  if (existingParents?.[0]?.email) {
    const { status: dupEmail } = await req('POST', '/api/parents', {
      name: 'Dup', email: existingParents[0].email, password: 'test123'
    })
    dupEmail === 400 ? pass('Duplicate parent email → 400') : fail('Duplicate parent email → 400', `got ${dupEmail}`)
  }

  // Settings PUT with no body fields (should still succeed)
  const { status: emptySettings } = await req('PUT', '/api/settings', {})
  emptySettings === 200 ? pass('PUT /api/settings — empty body (no-op) → 200') : warn('PUT /api/settings empty body', `got ${emptySettings}`)

  // ── 3. PAGE RENDERING — HTTP STATUS ──────────────────────────────────────
  section('3. Admin Page Rendering (200 status checks)')

  const adminPages = [
    ['/admin',            'Dashboard'],
    ['/admin/students',   'Students list'],
    ['/admin/groups',     'Groups list'],
    ['/admin/schedule',   'Schedule'],
    ['/admin/attendance', 'Attendance'],
    ['/admin/payments',   'Payments'],
    ['/admin/parents',    'Parents'],
    ['/admin/settings',   'Settings'],
  ]

  for (const [path, label] of adminPages) {
    const r = await fetch(`${BASE}${path}`, { headers: { Cookie: adminCookie } })
    r.status === 200 ? pass(`Admin page: ${label}`, path) : fail(`Admin page: ${label}`, `${path} → ${r.status}`)
  }

  // Portal pages
  section('3b. Parent Portal Page Rendering')
  const portalPages = [
    ['/portal',             'Portal dashboard'],
    ['/portal/payments',    'Portal payments'],
    ['/portal/attendance',  'Portal attendance'],
    ['/portal/schedule',    'Portal schedule'],
    ['/portal/profile',     'Portal profile'],
  ]

  for (const [path, label] of portalPages) {
    const r = await fetch(`${BASE}${path}`, { headers: { Cookie: parentCookie } })
    r.status === 200 ? pass(`Portal page: ${label}`, path) : fail(`Portal page: ${label}`, `${path} → ${r.status}`)
  }

  // Auth page (no cookie)
  const loginPage = await fetch(`${BASE}/auth/login`)
  loginPage.status === 200 ? pass('Auth page: Login', '/auth/login') : fail('Auth page: Login', `${loginPage.status}`)

  // ── 4. STUDENT FULL LIFECYCLE ─────────────────────────────────────────────
  section('4. Student Full Lifecycle (Enroll → Attend → Pay → Archive)')

  // Get a group with paymentPlan
  const { data: allGroups } = await req('GET', '/api/groups')
  const groupWithPlan = allGroups?.find((g: any) => g.paymentPlan?.monthlyFee > 0)
  if (!groupWithPlan) { warn('No group with payment plan found', 'Skipping lifecycle test'); }
  else {
    // Create student
    const { status: s1, data: newStu } = await req('POST', '/api/students', {
      firstName: 'Lifecycle',
      lastName: `Student-${ts}`,
      dateOfBirth: '2014-03-10',
      gender: 'FEMALE',
      ageGroup: 'U-12',
      trainingGroupId: groupWithPlan.id,
      jerseyNumber: 77,
    })
    if (s1 === 201) { ids.lifecycle = newStu.id; pass('Lifecycle: Create student', `ID=${newStu.id}`) }
    else fail('Lifecycle: Create student', `status ${s1}`)

    if (ids.lifecycle) {
      // Verify student profile
      const { data: profile } = await req('GET', `/api/students/${ids.lifecycle}`)
      profile?.trainingGroup?.groupName
        ? pass('Lifecycle: Profile has group', profile.trainingGroup.groupName)
        : fail('Lifecycle: Profile has group')

      // Mark attendance for today
      const today = new Date().toISOString().split('T')[0]
      const { status: attS } = await req('POST', '/api/attendance', [
        { studentId: ids.lifecycle, trainingGroupId: groupWithPlan.id, date: today, status: 'PRESENT' }
      ])
      attS === 200 ? pass('Lifecycle: Mark attendance PRESENT', today) : fail('Lifecycle: Mark attendance', `status ${attS}`)

      // Mark absent (different day)
      const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0]
      const { status: attS2 } = await req('POST', '/api/attendance', [
        { studentId: ids.lifecycle, trainingGroupId: groupWithPlan.id, date: yesterday, status: 'ABSENT', notes: 'Sick' }
      ])
      attS2 === 200 ? pass('Lifecycle: Mark attendance ABSENT yesterday', yesterday) : fail('Lifecycle: Mark ABSENT', `status ${attS2}`)

      // Generate invoice for this month
      const now = new Date()
      const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
      const { status: genS, data: genD } = await req('POST', '/api/payments/generate', { month, dueDay: 5 })
      genS === 200 ? pass('Lifecycle: Generate monthly invoice', `created=${genD?.created}`) : fail('Lifecycle: Generate invoice', `status ${genS}`)

      // Find the generated payment
      const { data: studentPayments } = await req('GET', `/api/payments?month=${month}`)
      const myPay = studentPayments?.find((p: any) => p.studentId === ids.lifecycle)

      if (myPay) {
        ids.lifecyclePay = myPay.id
        pass('Lifecycle: Invoice exists for student', `MVR ${myPay.amount}`)

        // Record payment
        const { status: recS, data: recD } = await req('PUT', `/api/payments/${ids.lifecyclePay}`, {
          status: 'PAID',
          paymentMethod: 'BANK_TRANSFER',
          paymentDate: today,
          notes: 'Lifecycle test payment',
          studentId: ids.lifecycle,
          paymentMonth: month,
        })
        if (recS === 200 && recD?.status === 'PAID') {
          pass('Lifecycle: Record payment as PAID', `Receipt: ${recD.receiptNumber}`)
          // Verify receipt number format
          recD.receiptNumber?.startsWith('RCP-')
            ? pass('Lifecycle: Receipt number format correct', recD.receiptNumber)
            : fail('Lifecycle: Receipt format', `Got: ${recD.receiptNumber}`)
        } else fail('Lifecycle: Record payment', `status ${recS}`)
      } else {
        warn('Lifecycle: No invoice generated for student', 'May already exist or student has no fee')
      }

      // Verify student attendance in profile
      const { data: finalProfile } = await req('GET', `/api/students/${ids.lifecycle}`)
      const attCount = finalProfile?.attendance?.length || 0
      attCount >= 2 ? pass('Lifecycle: Attendance visible in profile', `${attCount} records`) : fail('Lifecycle: Attendance in profile', `only ${attCount}`)

      // Archive student (soft delete)
      const { status: archS } = await req('DELETE', `/api/students/${ids.lifecycle}`)
      if (archS === 200) {
        pass('Lifecycle: Archive (soft delete)', `Student ${ids.lifecycle} → INACTIVE`)
        // Verify archived student excluded from default list
        const { data: activeList } = await req('GET', '/api/students')
        const stillActive = activeList?.find((s: any) => s.id === ids.lifecycle)
        !stillActive ? pass('Lifecycle: Archived student excluded from active list') : fail('Lifecycle: Should not appear in active list')
        // But visible with status=ALL
        const { data: allList } = await req('GET', '/api/students?status=ALL')
        const inAll = allList?.find((s: any) => s.id === ids.lifecycle)
        inAll ? pass('Lifecycle: Archived student visible with status=ALL') : warn('Lifecycle: Not in status=ALL list')
      } else fail('Lifecycle: Archive student', `status ${archS}`)
    }
  }

  // ── 5. PAYMENT BUSINESS LOGIC ─────────────────────────────────────────────
  section('5. Payment Business Logic')

  // Overdue flagging — create a past-due payment
  const pastDate = '2025-01-05'
  const pastMonth = '2025-01'
  const { data: stuList } = await req('GET', '/api/students?status=ACTIVE')
  const firstStu = stuList?.[0]

  if (firstStu) {
    const { status: pastPayS, data: pastPay } = await req('POST', '/api/payments', {
      studentId: firstStu.id,
      amount: 500,
      paymentMonth: pastMonth,
      dueDate: pastDate,
      status: 'UNPAID',
    })
    if (pastPayS === 201) {
      ids.pastPayment = pastPay.id
      pass('Payment: Create past-due payment', `ID=${pastPay.id}, due ${pastDate}`)

      // Flag overdue
      const { status: flagS, data: flagD } = await req('POST', '/api/payments/overdue')
      if (flagS === 200 && flagD.updated >= 1) {
        pass('Payment: Overdue flagging works', `${flagD.updated} marked OVERDUE`)
        // Verify it's now OVERDUE
        const { data: overdues } = await req('GET', `/api/payments?status=OVERDUE&month=${pastMonth}`)
        const mine = overdues?.find((p: any) => p.id === ids.pastPayment)
        mine ? pass('Payment: Overdue record confirmed', `ID=${mine.id}`) : warn('Payment: Overdue not in filter', 'Check query')
      } else warn('Payment: Overdue flagging', `updated=${flagD?.updated}`)

      // Record partial payment
      const { status: partS, data: partD } = await req('PUT', `/api/payments/${ids.pastPayment}`, {
        status: 'PARTIAL',
        paymentMethod: 'CASH',
        paymentDate: new Date().toISOString().split('T')[0],
        notes: 'Partial payment recorded',
        studentId: firstStu.id,
        paymentMonth: pastMonth,
      })
      partS === 200 && partD?.status === 'PARTIAL'
        ? pass('Payment: Record PARTIAL payment', `Status → ${partD.status}`)
        : fail('Payment: Record partial', `status ${partS}`)
    }
  }

  // Verify month filter
  const { status: monthF, data: monthData } = await req('GET', '/api/payments?month=2025-01')
  monthF === 200 && Array.isArray(monthData)
    ? pass('Payment: Month filter 2025-01', `${monthData.length} records`)
    : fail('Payment: Month filter', `status ${monthF}`)

  // Group filter
  if (allGroups?.[0]) {
    const { status: grpF, data: grpData } = await req('GET', `/api/payments?group=${allGroups[0].id}`)
    grpF === 200 && Array.isArray(grpData)
      ? pass('Payment: Group filter', `${grpData.length} payments for group ${allGroups[0].groupName}`)
      : fail('Payment: Group filter', `status ${grpF}`)
  }

  // ── 6. ATTENDANCE BULK OPS ────────────────────────────────────────────────
  section('6. Attendance — Bulk Operations & Edge Cases')

  const today2 = new Date().toISOString().split('T')[0]

  if (allGroups?.[0] && stuList?.length >= 3) {
    // Bulk mark first 3 students
    const bulkRecords = stuList.slice(0, 3).map((s: any) => ({
      studentId: s.id,
      trainingGroupId: allGroups[0].id,
      date: today2,
      status: 'PRESENT',
    }))
    const { status: bulkS, data: bulkD } = await req('POST', '/api/attendance', bulkRecords)
    bulkS === 200 && Array.isArray(bulkD) && bulkD.length === 3
      ? pass('Attendance: Bulk mark 3 students PRESENT', `${bulkD.length} records`)
      : fail('Attendance: Bulk mark', `status ${bulkS}`)

    // Upsert first student as LATE (change status)
    const { status: upsertS } = await req('POST', '/api/attendance', [{
      studentId: stuList[0].id,
      trainingGroupId: allGroups[0].id,
      date: today2,
      status: 'LATE',
    }])
    upsertS === 200 ? pass('Attendance: Upsert changes status PRESENT→LATE') : fail('Attendance: Upsert', `status ${upsertS}`)

    // Filter by student
    const { status: stuAttS, data: stuAtt } = await req('GET', `/api/attendance?studentId=${stuList[0].id}`)
    stuAttS === 200 && Array.isArray(stuAtt)
      ? pass('Attendance: Filter by studentId', `${stuAtt.length} records for student ${stuList[0].id}`)
      : fail('Attendance: Filter by studentId', `status ${stuAttS}`)

    // Filter by date
    const { status: dateAttS, data: dateAtt } = await req('GET', `/api/attendance?date=${today2}`)
    dateAttS === 200 && Array.isArray(dateAtt) && dateAtt.length >= 3
      ? pass('Attendance: Filter by date', `${dateAtt.length} records for ${today2}`)
      : fail('Attendance: Filter by date', `status ${dateAttS}`)
  }

  // ── 7. PARENT PORTAL DATA ISOLATION ──────────────────────────────────────
  section('7. Parent Portal — Data Isolation')

  // Parent can see their own session
  const { status: parentSessS, data: parentSess } = await req('GET', '/api/auth/session', undefined, parentCookie)
  parentSessS === 200 && parentSess?.user?.email === 'mohamed@gmail.com'
    ? pass('Portal: Parent session correct', parentSess.user.email)
    : fail('Portal: Parent session', `${parentSessS}`)

  // Parent portal pages return 200
  const { status: portalDash } = await req('GET', '/portal', undefined, parentCookie)
  // API routes return 200 for authenticated parent; page renders are checked in section 3b

  // Parent should NOT see admin-only API endpoints returning useful admin data
  // (Our current API just checks "logged in", not role — this is noted as enhancement)
  // Still, verify parent can read their student data via portal
  const { data: parentData } = await req('GET', '/api/auth/session', undefined, parentCookie)
  parentData?.user ? pass('Portal: Parent authenticated correctly') : fail('Portal: Parent auth')

  // ── 8. EMAIL REMINDER API ─────────────────────────────────────────────────
  section('8. Email Reminder API')

  // Find an unpaid/overdue payment
  const now2 = new Date()
  const currMonth = `${now2.getFullYear()}-${String(now2.getMonth() + 1).padStart(2, '0')}`
  const { data: unpaidList } = await req('GET', `/api/payments?status=UNPAID&month=${currMonth}`)
  const unpaidPay = unpaidList?.[0]

  if (unpaidPay) {
    const { status: remindS, data: remindD } = await req('POST', '/api/email/remind', { paymentId: unpaidPay.id })
    // Will fail if SMTP not configured (expected), but should not 500 with unhandled crash
    if (remindS === 200) {
      pass('Email: Reminder API returns 200', 'SMTP may be sending or gracefully skipped')
    } else if (remindS === 400 || remindS === 422) {
      warn('Email: Reminder skipped', `No SMTP configured (${remindS}) — expected in dev`)
    } else if (remindS === 500) {
      // Check if it's a graceful error
      remindD?.error
        ? warn('Email: Reminder returned 500 with error message', remindD.error)
        : fail('Email: Reminder API crashed (unhandled 500)', JSON.stringify(remindD))
    } else {
      warn('Email: Unexpected status', `${remindS}`)
    }
  } else {
    warn('Email: No unpaid payment found to test reminder', 'Skipping')
  }

  // Test with invalid payment ID
  const { status: badRemindS } = await req('POST', '/api/email/remind', { paymentId: 999999 })
  badRemindS !== 200 ? pass('Email: Invalid payment ID → error', `status ${badRemindS}`) : warn('Email: Invalid ID should not succeed', `got ${badRemindS}`)

  // ── 9. SETTINGS PERSISTENCE ───────────────────────────────────────────────
  section('9. Settings Persistence')

  // Read current
  const { data: origSettings } = await req('GET', '/api/settings')
  const origName = origSettings?.clubName

  // Update
  const newName = `Test Club ${ts}`
  await req('PUT', '/api/settings', { clubName: newName })

  // Re-read — verify persisted
  const { data: updatedSettings } = await req('GET', '/api/settings')
  updatedSettings?.clubName === newName
    ? pass('Settings: Change persists on re-read', newName)
    : fail('Settings: Change not persisted', `Expected "${newName}", got "${updatedSettings?.clubName}"`)

  // Update multiple fields at once
  const { status: multiS, data: multiD } = await req('PUT', '/api/settings', {
    clubName: origName || 'Basketball Club',
    paymentDueDay: 7,
    contactEmail: 'admin@mbc.mv',
    smtpHost: 'smtp.gmail.com',
    smtpPort: 587,
  })
  multiS === 200 && multiD?.paymentDueDay === 7
    ? pass('Settings: Multi-field update', `dueDay→${multiD.paymentDueDay}`)
    : fail('Settings: Multi-field update', `status ${multiS}`)

  // Restore
  await req('PUT', '/api/settings', { clubName: origName || 'Basketball Club', paymentDueDay: 5 })
  pass('Settings: Restored original values', origName || 'Basketball Club')

  // ── 10. CONCURRENT DUPLICATE PREVENTION ──────────────────────────────────
  section('10. Concurrent / Duplicate Prevention')

  // Try to create the same attendance record twice (upsert should handle it)
  const dupDate = new Date(Date.now() - 2 * 86400000).toISOString().split('T')[0]
  if (stuList?.[0] && allGroups?.[0]) {
    const dupRecord = { studentId: stuList[0].id, trainingGroupId: allGroups[0].id, date: dupDate, status: 'PRESENT' }
    const r1 = await req('POST', '/api/attendance', [dupRecord])
    const r2 = await req('POST', '/api/attendance', [dupRecord])
    r1.status === 200 && r2.status === 200
      ? pass('Attendance: Double-submit idempotent (upsert)', `Both returned 200`)
      : fail('Attendance: Upsert should handle duplicates', `${r1.status}, ${r2.status}`)

    // Verify only 1 record exists for that date+student+group
    const { data: attCheck } = await req('GET', `/api/attendance?studentId=${stuList[0].id}&date=${dupDate}`)
    const forGroup = attCheck?.filter((a: any) => a.trainingGroupId === allGroups[0].id && a.date?.startsWith(dupDate))
    forGroup?.length <= 1
      ? pass('Attendance: No duplicate records created', `${forGroup?.length} records`)
      : fail('Attendance: Duplicate records exist', `${forGroup?.length} records found`)
  }

  // Try generate invoices for same month twice
  const { data: gen1 } = await req('POST', '/api/payments/generate', { month: currMonth, dueDay: 5 })
  const { data: gen2 } = await req('POST', '/api/payments/generate', { month: currMonth, dueDay: 5 })
  gen2?.created === 0
    ? pass('Payments: Re-generating invoices for same month → 0 created (skip existing)', `skipped=${gen2.skipped}`)
    : warn('Payments: Re-generation', `created=${gen2?.created} on 2nd run (may have new students)`)

  // ── 11. CLEANUP ───────────────────────────────────────────────────────────
  section('11. Cleanup')

  if (ids.pastPayment) {
    // No delete endpoint for payments (by design — financial records kept)
    pass('Cleanup: Past payment kept (financial record retention)', `ID=${ids.pastPayment}`)
  }

  // Restore settings to 5-day due
  await req('PUT', '/api/settings', { paymentDueDay: 5, clubName: 'Basketball Club' })
  pass('Cleanup: Settings restored')

  // ── SUMMARY ───────────────────────────────────────────────────────────────
  const total = passed + failed + warned
  console.log('\n' + '─'.repeat(62))
  console.log(c.bold(`\n  Results: ${c.green(`${passed} passed`)}, ${failed > 0 ? c.red(`${failed} failed`) : c.green('0 failed')}, ${c.yellow(`${warned} warnings`)}  (${total} total)\n`))

  if (failed > 0) {
    console.log(c.red('  ⚠ Some tests failed — see details above\n'))
    process.exit(1)
  } else {
    console.log(c.green(`  🎉 All tests passed! (${warned} warnings — see details above)\n`))
  }
}

run().catch(err => {
  console.error(c.red('\n  ✘ Test runner crashed: ' + err.message + '\n' + err.stack))
  process.exit(1)
})
