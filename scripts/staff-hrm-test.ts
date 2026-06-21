/**
 * MBC CRM — Staff HRM & Access Control Test Suite
 * Run: npx tsx scripts/staff-hrm-test.ts
 */

const BASE = 'http://localhost:3000'

// ─── Colour helpers ───────────────────────────────────────────────────────────
const c = {
  green: (s: string) => `\x1b[32m${s}\x1b[0m`,
  red: (s: string) => `\x1b[31m${s}\x1b[0m`,
  yellow: (s: string) => `\x1b[33m${s}\x1b[0m`,
  cyan: (s: string) => `\x1b[36m${s}\x1b[0m`,
  bold: (s: string) => `\x1b[1m${s}\x1b[0m`,
  dim: (s: string) => `\x1b[2m${s}\x1b[0m`,
}

// ─── State ────────────────────────────────────────────────────────────────────
let passed = 0
let failed = 0
let cookie = ''
let staffId = 0
let staffUserId = 0

// ─── Helpers ─────────────────────────────────────────────────────────────────
function log(icon: string, label: string, msg: string) {
  console.log(`  ${icon} ${c.bold(label.padEnd(40))} ${msg}`)
}

function pass(label: string, detail = '') {
  passed++
  log(c.green('✔'), label, c.dim(detail))
}

function fail(label: string, detail = '') {
  failed++
  log(c.red('✘'), label, c.red(detail))
}

function section(title: string) {
  console.log(`\n${c.cyan(c.bold(`── ${title} ${'─'.repeat(50 - title.length)}`))}`)
}

async function api(
  method: string,
  path: string,
  body?: object,
): Promise<{ status: number; data: any }> {
  const opts: RequestInit = {
    method,
    headers: {
      'Content-Type': 'application/json',
      Cookie: cookie,
    },
  }
  if (body) opts.body = JSON.stringify(body)
  const r = await fetch(`${BASE}${path}`, opts)

  // Capture session cookie from login
  const setCookie = r.headers.get('set-cookie')
  if (setCookie) {
    const match = setCookie.match(/(authjs\.session-token|next-auth\.session-token)[^;]+/)
    if (match) cookie = match[0]
  }

  let data: any = null
  try { data = await r.json() } catch { data = null }
  return { status: r.status, data }
}

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

// ─── Test Runner ──────────────────────────────────────────────────────────────
async function run() {
  console.log(c.bold('\n🏀  MBC CRM — Staff HRM & Access Control Test Suite'))
  console.log(c.dim(`    Server: ${BASE}\n`))

  // ── 1. AUTH & LOGINS ──────────────────────────────────────────────────────
  section('1. Initial Authentications')

  // Good credentials — Admin
  cookie = ''
  const adminOk = await loginAs('admin@mbc.mv', 'admin123')
  if (adminOk) pass('Admin login succeeds', 'admin@mbc.mv')
  else {
    fail('Admin login succeeds', 'Login returned no session')
    return
  }

  // ── 2. ADMIN STAFF MANAGEMENT ─────────────────────────────────────────────
  section('2. Admin Staff CRUD')

  // List staffs (should succeed)
  const { status: listStatus, data: staffs } = await api('GET', '/api/admin/staffs')
  if (listStatus === 200 && Array.isArray(staffs)) {
    pass('GET /api/admin/staffs (succeeds)', `${staffs.length} staffs found`)
  } else {
    fail('GET /api/admin/staffs (succeeds)', `Status: ${listStatus}`)
  }

  // Create a new staff member
  const newStaffData = {
    name: 'Test Cleaner',
    email: 'cleaner.test@mbc.mv',
    phone: '7779999',
    password: 'cleanerpassword123',
    staffType: 'CLEANER',
    biography: 'Experienced office cleaner.',
    salary: 4500,
    contractUrl: '/uploads/photos/contract-test.pdf',
    certificatesUrl: '/uploads/photos/certs-test.pdf'
  }

  const { status: createStatus, data: createdStaff } = await api('POST', '/api/admin/staffs', newStaffData)
  if (createStatus === 201 && createdStaff?.id) {
    staffId = createdStaff.id
    staffUserId = createdStaff.userId
    pass('POST /api/admin/staffs (creates staff)', `ID: ${staffId}, UserID: ${staffUserId}`)
  } else {
    fail('POST /api/admin/staffs (creates staff)', `Status: ${createStatus}, Error: ${createdStaff?.error}`)
    return
  }

  // Get specific staff member details
  const { status: getStatus, data: fetchedStaff } = await api('GET', `/api/admin/staffs/${staffId}`)
  if (getStatus === 200 && fetchedStaff?.staffType === 'CLEANER') {
    pass('GET /api/admin/staffs/[id] (retrieves details)', `StaffType: ${fetchedStaff.staffType}`)
  } else {
    fail('GET /api/admin/staffs/[id] (retrieves details)', `Status: ${getStatus}`)
  }

  // Update staff member details (PUT)
  const updateStaffData = {
    ...newStaffData,
    salary: 5000,
    staffType: 'HEAD_CLEANER'
  }

  const { status: updateStatus, data: updatedStaff } = await api('PUT', `/api/admin/staffs/${staffId}`, updateStaffData)
  if (updateStatus === 200 && updatedStaff?.salary === 5000 && updatedStaff?.staffType === 'HEAD_CLEANER') {
    pass('PUT /api/admin/staffs/[id] (updates salary & position)', `Salary: ${updatedStaff.salary}, Position: ${updatedStaff.staffType}`)
  } else {
    fail('PUT /api/admin/staffs/[id] (updates salary & position)', `Status: ${updateStatus}`)
  }

  // ── 3. ACCESS CONTROL / ROLE SEPARATION ──────────────────────────────────
  section('3. Access Control & Role Boundaries')

  // Log in as Coach
  cookie = ''
  const coachOk = await loginAs('ibrahim@mbc.mv', 'coach123')
  if (coachOk) pass('Coach login succeeds', 'ibrahim@mbc.mv')
  else {
    fail('Coach login succeeds', 'Login returned no session')
    return
  }

  // Verify Coach cannot view staff list
  const { status: coachListStatus } = await api('GET', '/api/admin/staffs')
  if (coachListStatus === 403) {
    pass('Coach blocked from GET /api/admin/staffs', '403 Forbidden')
  } else {
    fail('Coach blocked from GET /api/admin/staffs', `Status: ${coachListStatus} (should be 403)`)
  }

  // Verify Coach cannot create staff
  const { status: coachCreateStatus } = await api('POST', '/api/admin/staffs', newStaffData)
  if (coachCreateStatus === 403) {
    pass('Coach blocked from POST /api/admin/staffs', '403 Forbidden')
  } else {
    fail('Coach blocked from POST /api/admin/staffs', `Status: ${coachCreateStatus}`)
  }

  // Verify Coach cannot edit staff
  const { status: coachPutStatus } = await api('PUT', `/api/admin/staffs/${staffId}`, updateStaffData)
  if (coachPutStatus === 403) {
    pass('Coach blocked from PUT /api/admin/staffs/[id]', '403 Forbidden')
  } else {
    fail('Coach blocked from PUT /api/admin/staffs/[id]', `Status: ${coachPutStatus}`)
  }

  // Verify Coach cannot delete staff
  const { status: coachDeleteStatus } = await api('DELETE', `/api/admin/staffs/${staffId}`)
  if (coachDeleteStatus === 403) {
    pass('Coach blocked from DELETE /api/admin/staffs/[id]', '403 Forbidden')
  } else {
    fail('Coach blocked from DELETE /api/admin/staffs/[id]', `Status: ${coachDeleteStatus}`)
  }

  // ── 4. STAFF ACCOUNT LOG IN & AUTH ────────────────────────────────────────
  section('4. Staff Account Log In')

  // Log in as the new staff member
  cookie = ''
  const staffLoginOk = await loginAs('cleaner.test@mbc.mv', 'cleanerpassword123')
  if (staffLoginOk) {
    pass('Staff member login succeeds', 'cleaner.test@mbc.mv')
  } else {
    fail('Staff member login succeeds', 'Could not establish session')
  }

  // Verify session role is COACH (assigned to all staff)
  const { data: staffSess } = await api('GET', '/api/auth/session')
  if (staffSess?.user?.role === 'COACH') {
    pass('Staff session returns role COACH', staffSess.user.role)
  } else {
    fail('Staff session returns role COACH', JSON.stringify(staffSess))
  }

  // ── 5. ADMIN DELETION & CASCADE CLEANUP ────────────────────────────────────
  section('5. Admin Deletion & Cascade Cleanup')

  // Log in as Admin again to delete
  cookie = ''
  await loginAs('admin@mbc.mv', 'admin123')

  // Delete the staff member
  const { status: deleteStatus } = await api('DELETE', `/api/admin/staffs/${staffId}`)
  if (deleteStatus === 200) {
    pass('DELETE /api/admin/staffs/[id] (deletes successfully)', '200 OK')
  } else {
    fail('DELETE /api/admin/staffs/[id] (deletes successfully)', `Status: ${deleteStatus}`)
  }

  // Verify staff details are gone (GET returns 404)
  const { status: verifyGetStatus } = await api('GET', `/api/admin/staffs/${staffId}`)
  if (verifyGetStatus === 404) {
    pass('Staff details successfully deleted (returns 404)', '404 Not Found')
  } else {
    fail('Staff details successfully deleted (returns 404)', `Status: ${verifyGetStatus}`)
  }

  // Verify that the User account was also deleted (GET single user or attempt login)
  cookie = ''
  const staffLoginDeleted = await loginAs('cleaner.test@mbc.mv', 'cleanerpassword123')
  if (!staffLoginDeleted) {
    pass('Staff User account cascade deleted (login rejected)', 'Success')
  } else {
    fail('Staff User account cascade deleted (login rejected)', 'Login still succeeded!')
  }

  // ─── Finish ────────────────────────────────────────────────────────────────
  console.log(`\n────────────────────────────────────────────────────────────`)
  console.log(`\n  Results: ${c.green(`${passed} passed`)}, ${failed > 0 ? c.red(`${failed} failed`) : c.green('0 failed')}  (${passed + failed} total)\n`)
  if (failed === 0) {
    console.log(`  ${c.green('🎉 All HRM tests passed!')}\n`)
  } else {
    console.log(`  ${c.red('❌ Some HRM tests failed.')}\n`)
    process.exit(1)
  }
}

run().catch(console.error)
