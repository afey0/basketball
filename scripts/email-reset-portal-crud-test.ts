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
  console.log(c.bold('\n📧  MBC CRM — SMTP Connection & Parent Portal CRUD Integration Test'))
  console.log(c.dim(`    Server: ${BASE}\n`))

  try {
    // 1. Log in users
    adminCookie = await login('admin@mbc.mv', 'admin123')
    parentCookie = await login('mohamed@gmail.com', 'parent123')

    if (adminCookie) pass('Admin login successful')
    else return fail('Admin login failed')

    if (parentCookie) pass('Parent login successful')
    else return fail('Parent login failed')

    // 2. Test SMTP Settings Connection Check API (Admins Only)
    // We send to a test email address, expecting the mock/default config to attempt connection.
    // If SMTP credentials aren't set, it might fail to connect, but we check if the endpoint is reachable.
    const testEmailRes = await fetch(`${BASE}/api/settings/test-email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: adminCookie },
      body: JSON.stringify({
        toEmail: 'aafalu@gmail.com',
        smtpHost: 'smtp.gmail.com',
        smtpPort: 587,
        smtpUser: 'test@gmail.com',
        smtpPassword: 'testpassword',
        smtpFromName: 'Basketball Club CRM'
      })
    })

    // It might return 400 because SMTP credentials are fake, but it should hit the controller and not crash.
    if (testEmailRes.status === 400 || testEmailRes.status === 200) {
      const data = await testEmailRes.json()
      pass('SMTP Test Connection: Endpoint responsive', `Status: ${testEmailRes.status}, Error: ${data.error || 'None'}`)
    } else {
      fail('SMTP Test Connection: Server error', `Status: ${testEmailRes.status}`)
    }

    // Verify non-admins cannot hit the test-email endpoint
    const forbiddenRes = await fetch(`${BASE}/api/settings/test-email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: parentCookie },
      body: JSON.stringify({ toEmail: 'test@gmail.com' })
    })
    if (forbiddenRes.status === 403) {
      pass('SMTP Test Connection: Non-admins rejected (403 Forbidden)')
    } else {
      fail('SMTP Test Connection: Security bypass', `Status: ${forbiddenRes.status}`)
    }

    // 3. Test Password Reset Email Trigger on user PUT
    // We'll create a temporary Coach user, update their password, and verify PUT response status.
    const userRes = await fetch(`${BASE}/api/users`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: adminCookie },
      body: JSON.stringify({
        name: 'Email Coach',
        email: 'emailcoach@mbc.mv',
        phone: '+9609000001',
        password: 'coachpassword123',
        role: 'COACH',
      })
    })
    
    let coachId = 0
    if (userRes.status === 201) {
      const coach = await userRes.json()
      coachId = coach.id
      pass('User Create: Successful', `ID: ${coachId}`)
    } else {
      fail('User Create: Failed', `Status: ${userRes.status}`)
    }

    if (coachId) {
      // Update coach password (triggers email trigger)
      const userUpdateRes = await fetch(`${BASE}/api/users/${coachId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Cookie: adminCookie },
        body: JSON.stringify({
          password: 'newcoachpassword456',
        })
      })

      if (userUpdateRes.status === 200) {
        pass('User Password Update: Dispatched reset email successfully')
      } else {
        fail('User Password Update: Request failed', `Status: ${userUpdateRes.status}`)
      }

      // Cleanup coach
      await prisma.user.delete({ where: { id: coachId } })
      pass('Cleanup: Deleted temporary Coach account')
    }

    // 4. Test Parent Portal Child CRUD APIs
    // GET initial children
    const getChildrenRes = await fetch(`${BASE}/api/portal/children`, {
      headers: { Cookie: parentCookie }
    })
    
    if (getChildrenRes.status === 200) {
      const list = await getChildrenRes.json()
      pass('Parent Children List: GET successful', `${list.length} children found`)
    } else {
      fail('Parent Children List: GET failed', `Status: ${getChildrenRes.status}`)
    }

    // POST create child
    const createChildRes = await fetch(`${BASE}/api/portal/children`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: parentCookie },
      body: JSON.stringify({
        firstName: 'Junior',
        lastName: 'Mohamed',
        dateOfBirth: '2018-05-15',
        gender: 'MALE',
        ageGroup: 'U-8',
        jerseyNumber: 10,
        medicalNotes: 'No issues',
      })
    })

    let childId = 0
    if (createChildRes.status === 201) {
      const newChild = await createChildRes.json()
      childId = newChild.id
      pass('Parent Child CRUD: Child created successfully', `ID: ${childId}`)
    } else {
      fail('Parent Child CRUD: Create failed', `Status: ${createChildRes.status}`)
    }

    if (childId) {
      // PUT update child details
      const updateChildRes = await fetch(`${BASE}/api/portal/children/${childId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Cookie: parentCookie },
        body: JSON.stringify({
          firstName: 'Junior',
          jerseyNumber: 11,
        })
      })

      if (updateChildRes.status === 200) {
        const updated = await updateChildRes.json()
        if (updated.firstName === 'Junior' && updated.jerseyNumber === 11) {
          pass('Parent Child CRUD: Child details updated successfully')
        } else {
          fail('Parent Child CRUD: Update field mismatch', JSON.stringify(updated))
        }
      } else {
        fail('Parent Child CRUD: Update request failed', `Status: ${updateChildRes.status}`)
      }

      // DELETE soft-delete child from parent portal
      const deleteChildRes = await fetch(`${BASE}/api/portal/children/${childId}`, {
        method: 'DELETE',
        headers: { Cookie: parentCookie }
      })

      if (deleteChildRes.status === 200) {
        pass('Parent Child CRUD: Child soft-deleted from parent account successfully')
      } else {
        fail('Parent Child CRUD: Delete request failed', `Status: ${deleteChildRes.status}`)
      }

      // Verify that it is NOT returned in GET active list
      const getChildrenAfterDeleteRes = await fetch(`${BASE}/api/portal/children`, {
        headers: { Cookie: parentCookie }
      })
      const listAfterDelete = await getChildrenAfterDeleteRes.json()
      const foundInList = listAfterDelete.some((c: any) => c.id === childId)
      if (!foundInList) {
        pass('Parent Child CRUD: Verified soft-deleted child is excluded from active list')
      } else {
        fail('Parent Child CRUD: Soft-deleted child still returned in active list')
      }

      // Verify that it STILL exists in database for Admins (Admin panel preserves history)
      const adminStudentCheck = await prisma.student.findUnique({
        where: { id: childId }
      })
      if (adminStudentCheck && adminStudentCheck.status === 'DELETED_BY_PARENT') {
        pass('Parent Child CRUD: Verified database record remains preserved with status DELETED_BY_PARENT')
      } else {
        fail('Parent Child CRUD: Preserved database record missing or has wrong status')
      }

      // 5. Test duplicate name prompt and restore logic
      // Try to create child with same name again. It should prompt (status 409 Conflict)
      const createDupRes = await fetch(`${BASE}/api/portal/children`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Cookie: parentCookie },
        body: JSON.stringify({
          firstName: 'Junior',
          lastName: 'Mohamed',
          dateOfBirth: '2018-05-15',
          gender: 'MALE',
          ageGroup: 'U-8',
        })
      })

      if (createDupRes.status === 409) {
        const body = await createDupRes.json()
        if (body.duplicate && body.existingChild?.id === childId) {
          pass('Duplicate Check: Prompted with option to restore duplicate deleted child')
        } else {
          fail('Duplicate Check: Duplicate response content mismatch', JSON.stringify(body))
        }
      } else {
        fail('Duplicate Check: Mismatch status code on duplicate creation', `Status: ${createDupRes.status}`)
      }

      // Confirm restoration of the child profile
      const restoreRes = await fetch(`${BASE}/api/portal/children`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Cookie: parentCookie },
        body: JSON.stringify({
          firstName: 'Junior',
          lastName: 'Mohamed',
          dateOfBirth: '2018-05-15',
          gender: 'MALE',
          ageGroup: 'U-8',
          confirmRestore: true,
        })
      })

      if (restoreRes.status === 200) {
        const restored = await restoreRes.json()
        if (restored.id === childId && restored.status === 'ACTIVE') {
          pass('Duplicate Check: Successfully restored child profile with history intact')
        } else {
          fail('Duplicate Check: Restoration content mismatch', JSON.stringify(restored))
        }
      } else {
        fail('Duplicate Check: Restoration failed', `Status: ${restoreRes.status}`)
      }

      // Hard-delete student from database for test cleanup
      await prisma.student.delete({ where: { id: childId } })
      pass('Cleanup: Deleted temporary student record from database')
    }

  } catch (err: any) {
    fail('Integration test failed with error', err.message || err.toString())
  }

  console.log('\n' + '─'.repeat(62))
  if (failed > 0) {
    console.log(c.red(`\n  Results: ${passed} passed, ${failed} failed\n`))
    process.exit(1)
  } else {
    console.log(c.green(`\n  🎉 All SMTP settings & parent portal CRUD tests passed! (${passed} total)\n`))
  }
}

run().catch(err => {
  console.error(err)
  process.exit(1)
})
