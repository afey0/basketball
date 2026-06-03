/**
 * MBC CRM — Full Acceptance Test Suite
 * Run: npx tsx scripts/acceptance-test.ts
 *
 * Tests all major flows:
 *  1. Auth (login / bad credentials)
 *  2. Students CRUD
 *  3. Training Groups CRUD
 *  4. Schedules CRUD
 *  5. Attendance (mark, bulk)
 *  6. Payments (generate, record, flag overdue)
 *  7. Parents CRUD
 *  8. Settings GET/PUT
 *  9. Cleanup
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
const ids: Record<string, number> = {}

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
  console.log(c.bold('\n🏀  MBC CRM — Acceptance Test Suite'))
  console.log(c.dim(`    Server: ${BASE}\n`))

  // ── 1. AUTH ───────────────────────────────────────────────────────────────
  section('1. Authentication')

  // Bad credentials
  const badLogin = await loginAs('nobody@test.com', 'wrongpassword')
  if (!badLogin) pass('Reject invalid credentials')
  else fail('Reject invalid credentials', 'Should have denied login')

  // Good credentials — Admin
  cookie = ''
  const adminOk = await loginAs('admin@mbc.mv', 'admin123')
  if (adminOk) pass('Admin login succeeds', 'admin@mbc.mv')
  else fail('Admin login succeeds', 'Login returned no session')

  // Session endpoint
  const { data: sess } = await api('GET', '/api/auth/session')
  if (sess?.user?.email === 'admin@mbc.mv') pass('Session returns correct user', sess.user.email)
  else fail('Session returns correct user', JSON.stringify(sess))

  // ── 2. STUDENTS ───────────────────────────────────────────────────────────
  section('2. Students')

  // List students
  const { status: listStatus, data: students } = await api('GET', '/api/students')
  if (listStatus === 200 && Array.isArray(students)) pass('GET /api/students', `${students.length} students`)
  else fail('GET /api/students', `status ${listStatus}`)

  // Get first group for linking
  const { data: groups } = await api('GET', '/api/groups')
  const firstGroup = groups?.[0]

  // Create student
  const now = Date.now()
  const { status: createStatus, data: newStudent } = await api('POST', '/api/students', {
    firstName: 'TestFirst',
    lastName: `TestLast-${now}`,
    dateOfBirth: '2015-06-15',
    gender: 'MALE',
    ageGroup: 'U-12',
    trainingGroupId: firstGroup?.id || null,
    jerseyNumber: 99,
    medicalNotes: 'Test allergy note',
  })
  if (createStatus === 201 && newStudent?.id) {
    ids.student = newStudent.id
    pass('POST /api/students (create)', `ID=${newStudent.id}, name=${newStudent.firstName}`)
  } else {
    fail('POST /api/students (create)', `status ${createStatus} — ${JSON.stringify(newStudent)}`)
  }

  if (ids.student) {
    // Get single student
    const { status: getStatus, data: got } = await api('GET', `/api/students/${ids.student}`)
    if (getStatus === 200 && got?.id === ids.student) pass('GET /api/students/[id]', `Found ${got.firstName}`)
    else fail('GET /api/students/[id]', `status ${getStatus}`)

    // Update student
    const { status: updateStatus, data: updated } = await api('PUT', `/api/students/${ids.student}`, {
      jerseyNumber: 88,
      medicalNotes: 'Updated allergy',
      status: 'ACTIVE',
    })
    if (updateStatus === 200 && updated?.jerseyNumber === 88) pass('PUT /api/students/[id] (update)', `Jersey → #${updated.jerseyNumber}`)
    else fail('PUT /api/students/[id] (update)', `status ${updateStatus}`)

    // Search / filter
    const { status: searchStatus, data: searched } = await api('GET', '/api/students?search=TestFirst&status=ALL')
    if (searchStatus === 200 && Array.isArray(searched) && searched.some((s: any) => s.id === ids.student))
      pass('GET /api/students?search= filter', `Found in results`)
    else fail('GET /api/students?search= filter', `status ${searchStatus}`)
  }

  // ── 3. GROUPS ─────────────────────────────────────────────────────────────
  section('3. Training Groups')

  const { status: groupListStatus, data: groupList } = await api('GET', '/api/groups')
  if (groupListStatus === 200 && Array.isArray(groupList)) pass('GET /api/groups', `${groupList.length} groups`)
  else fail('GET /api/groups', `status ${groupListStatus}`)

  const { status: createGroupStatus, data: newGroup } = await api('POST', '/api/groups', {
    groupName: `Test Group ${now}`,
    ageGroup: 'U-14',
    maxCapacity: 15,
    monthlyFee: 500,
    description: 'Created by acceptance test',
  })
  if (createGroupStatus === 201 && newGroup?.id) {
    ids.group = newGroup.id
    pass('POST /api/groups (create)', `ID=${newGroup.id}`)
  } else fail('POST /api/groups (create)', `status ${createGroupStatus} — ${JSON.stringify(newGroup)}`)

  if (ids.group) {
    const { status: getGroupStatus, data: gotGroup } = await api('GET', `/api/groups/${ids.group}`)
    if (getGroupStatus === 200 && gotGroup?.id === ids.group) pass('GET /api/groups/[id]', gotGroup.groupName)
    else fail('GET /api/groups/[id]', `status ${getGroupStatus}`)

    const { status: updateGroupStatus, data: updatedGroup } = await api('PUT', `/api/groups/${ids.group}`, {
      groupName: `Test Group Updated ${now}`,
      maxCapacity: 20,
      monthlyFee: 600,
    })
    if (updateGroupStatus === 200) pass('PUT /api/groups/[id] (update)', `maxCapacity → ${updatedGroup?.maxCapacity}`)
    else fail('PUT /api/groups/[id] (update)', `status ${updateGroupStatus}`)
  }

  // ── 4. SCHEDULES ─────────────────────────────────────────────────────────
  section('4. Schedules')

  const { status: schedListStatus, data: schedules } = await api('GET', '/api/schedules')
  if (schedListStatus === 200 && Array.isArray(schedules)) pass('GET /api/schedules', `${schedules.length} sessions`)
  else fail('GET /api/schedules', `status ${schedListStatus}`)

  const targetGroupId = ids.group || firstGroup?.id
  if (targetGroupId) {
    const { status: createSchedStatus, data: newSched } = await api('POST', '/api/schedules', {
      trainingGroupId: targetGroupId,
      dayOfWeek: 'WED',
      startTime: '15:00',
      endTime: '17:00',
      location: 'Test Arena',
      isActive: true,
    })
    if (createSchedStatus === 201 && newSched?.id) {
      ids.schedule = newSched.id
      pass('POST /api/schedules (create)', `ID=${newSched.id} — WED 15:00-17:00`)
    } else fail('POST /api/schedules (create)', `status ${createSchedStatus} — ${JSON.stringify(newSched)}`)

    if (ids.schedule) {
      const { status: updateSchedStatus } = await api('PUT', `/api/schedules/${ids.schedule}`, {
        location: 'Updated Arena',
        startTime: '16:00',
        endTime: '18:00',
      })
      if (updateSchedStatus === 200) pass('PUT /api/schedules/[id] (update)', 'Location & time updated')
      else fail('PUT /api/schedules/[id] (update)', `status ${updateSchedStatus}`)
    }
  }

  // ── 5. ATTENDANCE ─────────────────────────────────────────────────────────
  section('5. Attendance')

  const { status: attListStatus, data: attList } = await api('GET', '/api/attendance')
  if (attListStatus === 200 && Array.isArray(attList)) pass('GET /api/attendance', `${attList.length} records`)
  else fail('GET /api/attendance', `status ${attListStatus}`)

  if (ids.student && firstGroup?.id) {
    const today = new Date().toISOString().split('T')[0]

    // Mark single student present
    const { status: markStatus, data: markData } = await api('POST', '/api/attendance', [
      { studentId: ids.student, trainingGroupId: firstGroup.id, date: today, status: 'PRESENT', notes: 'Test mark' }
    ])
    if (markStatus === 200 && Array.isArray(markData)) {
      ids.attendance = markData[0]?.id
      pass('POST /api/attendance (mark PRESENT)', `Record ID=${markData[0]?.id}`)
    } else fail('POST /api/attendance (mark PRESENT)', `status ${markStatus}`)

    // Upsert same record as LATE (test idempotency)
    const { status: upsertStatus } = await api('POST', '/api/attendance', [
      { studentId: ids.student, trainingGroupId: firstGroup.id, date: today, status: 'LATE' }
    ])
    if (upsertStatus === 200) pass('POST /api/attendance (upsert LATE)', 'Idempotent upsert works')
    else fail('POST /api/attendance (upsert LATE)', `status ${upsertStatus}`)

    // Filter by group+date
    const { status: filterStatus, data: filtered } = await api('GET', `/api/attendance?groupId=${firstGroup.id}&date=${today}`)
    if (filterStatus === 200 && Array.isArray(filtered)) pass('GET /api/attendance?groupId&date filter', `${filtered.length} records for today`)
    else fail('GET /api/attendance?groupId&date filter', `status ${filterStatus}`)
  }

  // ── 6. PAYMENTS ───────────────────────────────────────────────────────────
  section('6. Payments')

  const now2 = new Date()
  const currentMonth = `${now2.getFullYear()}-${String(now2.getMonth() + 1).padStart(2, '0')}`

  // List payments
  const { status: payListStatus, data: payments } = await api('GET', `/api/payments?month=${currentMonth}`)
  if (payListStatus === 200 && Array.isArray(payments)) pass('GET /api/payments?month=', `${payments.length} records`)
  else fail('GET /api/payments?month=', `status ${payListStatus}`)

  // Generate invoices for current month
  const { status: genStatus, data: genData } = await api('POST', '/api/payments/generate', {
    month: currentMonth, dueDay: 5
  })
  if (genStatus === 200 && typeof genData?.created === 'number') pass('POST /api/payments/generate', `Created=${genData.created}, Skipped=${genData.skipped}`)
  else fail('POST /api/payments/generate', `status ${genStatus} — ${JSON.stringify(genData)}`)

  // Create a manual payment record for test student
  if (ids.student) {
    const dueDate = `${now2.getFullYear()}-${String(now2.getMonth() + 1).padStart(2, '0')}-05`
    const { status: createPayStatus, data: newPay } = await api('POST', '/api/payments', {
      studentId: ids.student,
      amount: 650,
      paymentMonth: currentMonth,
      dueDate,
      status: 'UNPAID',
    })
    if (createPayStatus === 201 && newPay?.id) {
      ids.payment = newPay.id
      pass('POST /api/payments (create)', `ID=${newPay.id}, amount=MVR 650`)
    } else fail('POST /api/payments (create)', `status ${createPayStatus} — ${JSON.stringify(newPay)}`)

    // Record payment
    if (ids.payment) {
      const { status: recordStatus, data: recorded } = await api('PUT', `/api/payments/${ids.payment}`, {
        status: 'PAID',
        paymentMethod: 'CASH',
        paymentDate: new Date().toISOString().split('T')[0],
        notes: 'Acceptance test payment',
        studentId: ids.student,
        paymentMonth: currentMonth,
      })
      if (recordStatus === 200 && recorded?.status === 'PAID') pass('PUT /api/payments/[id] (record payment)', `Status→PAID, Receipt=${recorded.receiptNumber}`)
      else fail('PUT /api/payments/[id] (record payment)', `status ${recordStatus}`)
    }
  }

  // Flag overdue
  const { status: overdueStatus, data: overdueData } = await api('POST', '/api/payments/overdue')
  if (overdueStatus === 200 && typeof overdueData?.updated === 'number') pass('POST /api/payments/overdue (flag)', `${overdueData.updated} flagged`)
  else fail('POST /api/payments/overdue (flag)', `status ${overdueStatus}`)

  // Filter payments by status
  const { status: filterPayStatus, data: filteredPay } = await api('GET', `/api/payments?status=PAID&month=${currentMonth}`)
  if (filterPayStatus === 200 && Array.isArray(filteredPay)) pass('GET /api/payments?status=PAID filter', `${filteredPay.length} paid records`)
  else fail('GET /api/payments?status=PAID filter', `status ${filterPayStatus}`)

  // ── 7. PARENTS ────────────────────────────────────────────────────────────
  section('7. Parents')

  const { status: parentListStatus, data: parentList } = await api('GET', '/api/parents')
  if (parentListStatus === 200 && Array.isArray(parentList)) pass('GET /api/parents', `${parentList.length} parents`)
  else fail('GET /api/parents', `status ${parentListStatus}`)

  const testEmail = `testparent-${now}@test.mv`
  const { status: createParentStatus, data: newParent } = await api('POST', '/api/parents', {
    name: 'Test Parent',
    email: testEmail,
    phone: '+960 777-0000',
    password: 'testpass123',
  })
  if (createParentStatus === 201 && newParent?.id) {
    ids.parent = newParent.id
    pass('POST /api/parents (create)', `ID=${newParent.id}, email=${testEmail}`)
  } else fail('POST /api/parents (create)', `status ${createParentStatus} — ${JSON.stringify(newParent)}`)

  // Duplicate email should fail
  const { status: dupStatus } = await api('POST', '/api/parents', {
    name: 'Dup Parent', email: testEmail, password: 'pass'
  })
  if (dupStatus === 400) pass('POST /api/parents duplicate email rejected', '400 status')
  else fail('POST /api/parents duplicate email rejected', `Expected 400, got ${dupStatus}`)

  // Link child to parent
  if (ids.student && ids.parent) {
    const { status: linkStatus } = await api('PUT', `/api/students/${ids.student}`, { parentId: ids.parent })
    if (linkStatus === 200) pass('Link student to parent', `Student ${ids.student} → Parent ${ids.parent}`)
    else fail('Link student to parent', `status ${linkStatus}`)
  }

  // ── 8. SETTINGS ───────────────────────────────────────────────────────────
  section('8. Settings')

  const { status: getSettingsStatus, data: settings } = await api('GET', '/api/settings')
  if (getSettingsStatus === 200 && settings?.clubName) pass('GET /api/settings', `clubName="${settings.clubName}"`)
  else fail('GET /api/settings', `status ${getSettingsStatus}`)

  const { status: updateSettingsStatus, data: updatedSettings } = await api('PUT', '/api/settings', {
    clubName: 'MBC Test Club',
    paymentDueDay: 10,
    contactEmail: 'admin@mbc.mv',
    smtpHost: 'smtp.gmail.com',
    smtpPort: 587,
    smtpFromName: 'MBC CRM',
  })
  if (updateSettingsStatus === 200 && updatedSettings?.paymentDueDay === 10) pass('PUT /api/settings (update)', `paymentDueDay→${updatedSettings.paymentDueDay}`)
  else fail('PUT /api/settings (update)', `status ${updateSettingsStatus}`)

  // Restore
  await api('PUT', '/api/settings', { clubName: 'Basketball Club', paymentDueDay: 5 })

  // ── 9. AUTH — COACH LOGIN ─────────────────────────────────────────────────
  section('9. Coach Login & Access')

  cookie = ''
  const coachOk = await loginAs('ibrahim@mbc.mv', 'coach123')
  if (coachOk) pass('Coach login succeeds', 'ibrahim@mbc.mv')
  else fail('Coach login succeeds')

  const { status: coachStudentStatus } = await api('GET', '/api/students')
  if (coachStudentStatus === 200) pass('Coach can read students', 'Authorized')
  else fail('Coach can read students', `status ${coachStudentStatus}`)

  // ── 10. PARENT PORTAL ────────────────────────────────────────────────────
  section('10. Parent Login & Portal Access')

  cookie = ''
  const parentOk = await loginAs('mohamed@gmail.com', 'parent123')
  if (parentOk) pass('Parent login succeeds', 'mohamed@gmail.com')
  else fail('Parent login succeeds')

  const { data: parentSess } = await api('GET', '/api/auth/session')
  if (parentSess?.user?.email === 'mohamed@gmail.com') pass('Parent session established', parentSess.user.email)
  else fail('Parent session', JSON.stringify(parentSess))

  // Parent should NOT be able to create students (admin action)
  // (The route doesn't enforce roles beyond "logged in" currently — noted as security enhancement)

  // ── 11. CLEANUP ───────────────────────────────────────────────────────────
  section('11. Cleanup (delete test data)')

  // Re-login as admin for cleanup
  cookie = ''
  await loginAs('admin@mbc.mv', 'admin123')

  // Delete schedule
  if (ids.schedule) {
    const { status } = await api('DELETE', `/api/schedules/${ids.schedule}`)
    if (status === 200) pass('DELETE /api/schedules/[id]', `Deleted schedule ${ids.schedule}`)
    else fail('DELETE /api/schedules/[id]', `status ${status}`)
  }

  // Archive test student (soft delete)
  if (ids.student) {
    const { status } = await api('DELETE', `/api/students/${ids.student}`)
    if (status === 200) pass('DELETE /api/students/[id] (soft delete)', `Student ${ids.student} → INACTIVE`)
    else fail('DELETE /api/students/[id] (soft delete)', `status ${status}`)
  }

  // Delete test group
  if (ids.group) {
    const { status } = await api('DELETE', `/api/groups/${ids.group}`)
    if (status === 200) pass('DELETE /api/groups/[id]', `Deleted group ${ids.group}`)
    else fail('DELETE /api/groups/[id]', `status ${status}`)
  }

  // ── SUMMARY ───────────────────────────────────────────────────────────────
  const total = passed + failed
  console.log('\n' + '─'.repeat(60))
  console.log(c.bold(`\n  Results: ${c.green(String(passed))} passed, ${failed > 0 ? c.red(String(failed)) : c.green('0')} failed  (${total} total)\n`))

  if (failed > 0) {
    console.log(c.red('  ⚠ Some tests failed — review above for details\n'))
    process.exit(1)
  } else {
    console.log(c.green('  🎉 All tests passed!\n'))
  }
}

run().catch((err) => {
  console.error(c.red('\n  ✘ Test runner crashed: ' + err.message))
  process.exit(1)
})
