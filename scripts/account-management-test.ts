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
  console.log(c.bold('\n👥  MBC CRM — Account Management & Photo Upload Integration Test'))
  console.log(c.dim(`    Server: ${BASE}\n`))

  try {
    // 1. Log in users
    adminCookie = await login('admin@mbc.mv', 'admin123')
    parentCookie = await login('mohamed@gmail.com', 'parent123')

    if (adminCookie) pass('Admin login successful')
    else return fail('Admin login failed')

    if (parentCookie) pass('Parent login successful')
    else return fail('Parent login failed')

    // 2. Test generic image upload
    const mockFile = new Blob(['mock image content'], { type: 'image/png' })
    const formData = new FormData()
    formData.append('file', mockFile, 'profile.png')

    const uploadRes = await fetch(`${BASE}/api/upload`, {
      method: 'POST',
      headers: { Cookie: adminCookie },
      body: formData,
    })

    let uploadedUrl = ''
    if (uploadRes.status === 200) {
      const data = await uploadRes.json()
      if (data.url && data.url.startsWith('/uploads/photos/')) {
        uploadedUrl = data.url
        pass('Upload API: Success', `URL: ${uploadedUrl}`)
      } else {
        fail('Upload API: Unexpected response format', JSON.stringify(data))
      }
    } else {
      fail('Upload API: Request failed', `status: ${uploadRes.status}`)
    }

    // Fetch first parent for linking
    const parentsRes = await fetch(`${BASE}/api/parents`, { headers: { Cookie: adminCookie } })
    const parents = await parentsRes.json()
    const firstParentId = parents?.[0]?.id || 1

    // 3. Test Student create and update with profilePhoto
    const studentRes = await fetch(`${BASE}/api/students`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: adminCookie },
      body: JSON.stringify({
        firstName: 'Photo',
        lastName: 'Student',
        dateOfBirth: '2016-08-12',
        gender: 'MALE',
        ageGroup: 'U-10',
        parentId: firstParentId,
        profilePhoto: uploadedUrl,
      })
    })

    let studentId = 0
    if (studentRes.status === 201) {
      const stu = await studentRes.json()
      studentId = stu.id
      if (stu.profilePhoto === uploadedUrl) {
        pass('Student Create: Saved profilePhoto correctly', `ID: ${studentId}`)
      } else {
        fail('Student Create: profilePhoto mismatch', stu.profilePhoto)
      }
    } else {
      fail('Student Create: Request failed', `status: ${studentRes.status}`)
    }

    // Test Student edit profilePhoto
    if (studentId) {
      const editRes = await fetch(`${BASE}/api/students/${studentId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Cookie: adminCookie },
        body: JSON.stringify({
          firstName: 'PhotoUpdated',
          profilePhoto: '/uploads/photos/another-one.png',
        })
      })

      if (editRes.status === 200) {
        const editedStu = await editRes.json()
        if (editedStu.firstName === 'PhotoUpdated' && editedStu.profilePhoto === '/uploads/photos/another-one.png') {
          pass('Student Edit: Updated profilePhoto successfully')
        } else {
          fail('Student Edit: Fields not updated correctly', JSON.stringify(editedStu))
        }
      } else {
        fail('Student Edit: Request failed', `status: ${editRes.status}`)
      }
    }

    // 4. Test Parent edit detail API /api/parents/[id]
    const parentsListRes = await fetch(`${BASE}/api/parents`, { headers: { Cookie: adminCookie } })
    const parentsList = await parentsListRes.json()
    const targetParent = parentsList.find((p: any) => p.email === 'aminath@gmail.com')

    if (targetParent) {
      const origName = targetParent.name
      const parentEditRes = await fetch(`${BASE}/api/parents/${targetParent.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Cookie: adminCookie },
        body: JSON.stringify({
          name: 'Aminath Saeed (Updated)',
          email: 'aminath@gmail.com',
          phone: '9609999999',
        })
      })

      if (parentEditRes.status === 200) {
        const updatedParent = await parentEditRes.json()
        if (updatedParent.name === 'Aminath Saeed (Updated)' && updatedParent.phone === '9609999999') {
          pass('Parent Edit: Details updated successfully')
        } else {
          fail('Parent Edit: Details mismatch', JSON.stringify(updatedParent))
        }

        // Restore original parent name
        await fetch(`${BASE}/api/parents/${targetParent.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', Cookie: adminCookie },
          body: JSON.stringify({ name: origName, email: 'aminath@gmail.com', phone: (targetParent.phone || '').replace(/\D/g, '') })
        })
      } else {
        fail('Parent Edit: API failed', `status: ${parentEditRes.status}`)
      }
    } else {
      warn('Parent Edit: Target parent not found, skipping')
    }

    // 5. Test Unified User API /api/users
    // Create new coach account
    const userCreateRes = await fetch(`${BASE}/api/users`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: adminCookie },
      body: JSON.stringify({
        name: 'Integration Coach',
        email: 'intcoach@mbc.mv',
        phone: '9607777777',
        password: 'coachpassword123',
        role: 'COACH',
      })
    })

    let testUserId = 0
    if (userCreateRes.status === 201) {
      const user = await userCreateRes.json()
      testUserId = user.id
      pass('User API: Coach account created successfully', `ID: ${testUserId}`)
    } else {
      fail('User API: Create coach failed', `status: ${userCreateRes.status}`)
    }

    // Verify coach login
    if (testUserId) {
      const coachLoginCookie = await login('intcoach@mbc.mv', 'coachpassword123')
      if (coachLoginCookie) {
        pass('User API: New Coach login verified')
      } else {
        fail('User API: New Coach login failed')
      }

      // Update user account details (change role to ADMIN & change password)
      const userUpdateRes = await fetch(`${BASE}/api/users/${testUserId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Cookie: adminCookie },
        body: JSON.stringify({
          name: 'Integration Coach Updated',
          email: 'intcoach@mbc.mv',
          role: 'ADMIN',
          password: 'newadminpassword123',
        })
      })

      if (userUpdateRes.status === 200) {
        const updatedUser = await userUpdateRes.json()
        if (updatedUser.name === 'Integration Coach Updated' && updatedUser.role === 'ADMIN') {
          pass('User API: Updated details and role ADMIN successfully')
        } else {
          fail('User API: Update fields mismatch', JSON.stringify(updatedUser))
        }

        // Verify login with new password and role
        const newLoginCookie = await login('intcoach@mbc.mv', 'newadminpassword123')
        if (newLoginCookie) {
          pass('User API: Login with updated password successful')
          const sessionRes = await fetch(`${BASE}/api/auth/session`, { headers: { Cookie: newLoginCookie } })
          const sessionData = await sessionRes.json()
          if (sessionData?.user?.role === 'ADMIN') {
            pass('User API: Role change reflected in session (ADMIN)')
          } else {
            fail('User API: Session role mismatch', sessionData?.user?.role)
          }
        } else {
          fail('User API: Login with updated password failed')
        }
      } else {
        fail('User API: Update request failed', `status: ${userUpdateRes.status}`)
      }

      // Delete user account
      const userDeleteRes = await fetch(`${BASE}/api/users/${testUserId}`, {
        method: 'DELETE',
        headers: { Cookie: adminCookie },
      })
      if (userDeleteRes.status === 200) {
        pass('User API: Deleted account successfully')
      } else {
        fail('User API: Delete request failed', `status: ${userDeleteRes.status}`)
      }
    }

    // Cleanup student
    if (studentId) {
      // Clean delete from database for test integrity
      await prisma.student.delete({ where: { id: studentId } })
      pass('Cleanup: Integration student record deleted')
    }

  } catch (err: any) {
    fail('Integration test failed with error', err.message || err.toString())
  }

  console.log('\n' + '─'.repeat(62))
  if (failed > 0) {
    console.log(c.red(`\n  Results: ${passed} passed, ${failed} failed\n`))
    process.exit(1)
  } else {
    console.log(c.green(`\n  🎉 All account management & photo upload tests passed! (${passed} total)\n`))
  }
}

run().catch(err => {
  console.error(err)
  process.exit(1)
})
