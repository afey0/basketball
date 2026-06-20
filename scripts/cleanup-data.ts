import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🧹 Starting data cleanup (preserving user data)...')

  try {
    // Delete in order to satisfy foreign key constraints
    const paymentDeleted = await prisma.payment.deleteMany()
    console.log(`Deleted ${paymentDeleted.count} payments.`)

    const attendanceDeleted = await prisma.attendance.deleteMany()
    console.log(`Deleted ${attendanceDeleted.count} attendance records.`)

    const scheduleDeleted = await prisma.schedule.deleteMany()
    console.log(`Deleted ${scheduleDeleted.count} schedules.`)

    const paymentPlanDeleted = await prisma.paymentPlan.deleteMany()
    console.log(`Deleted ${paymentPlanDeleted.count} payment plans.`)

    const studentDeleted = await prisma.student.deleteMany()
    console.log(`Deleted ${studentDeleted.count} students.`)

    const trainingGroupDeleted = await prisma.trainingGroup.deleteMany()
    console.log(`Deleted ${trainingGroupDeleted.count} training groups.`)

    // Delete any temporary parent/user records created by tests
    const tempUsersDeleted = await prisma.user.deleteMany({
      where: {
        OR: [
          { email: { startsWith: 'testparent-' } },
          { email: { startsWith: 'test-' } }
        ]
      }
    })
    console.log(`Deleted ${tempUsersDeleted.count} temporary test users.`)

    // Ensure Default Admin exists
    const adminEmail = 'admin@mbc.mv'
    const adminExists = await prisma.user.findUnique({ where: { email: adminEmail } })
    if (!adminExists) {
      const adminPassword = bcrypt.hashSync('admin123', 12)
      await prisma.user.create({
        data: {
          name: 'Ahmed Rasheed',
          email: adminEmail,
          password: adminPassword,
          phone: '+960 777-0001',
          role: 'ADMIN',
        }
      })
      console.log('Created default admin: admin@mbc.mv')
    }

    // Ensure Default Coaches exist
    const coaches = [
      { name: 'Ibrahim Waheed', email: 'ibrahim@mbc.mv', phone: '+960 777-0002' },
      { name: 'Fathimath Ali', email: 'fathimath@mbc.mv', phone: '+960 777-0003' }
    ]
    for (const c of coaches) {
      const coachExists = await prisma.user.findUnique({ where: { email: c.email } })
      if (!coachExists) {
        const coachPassword = bcrypt.hashSync('coach123', 12)
        await prisma.user.create({
          data: {
            name: c.name,
            email: c.email,
            password: coachPassword,
            phone: c.phone,
            role: 'COACH',
          }
        })
        console.log(`Created default coach: ${c.email}`)
      }
    }

    // Ensure Default Parents exist
    const parents = [
      { name: 'Mohamed Hassan', email: 'mohamed@gmail.com', phone: '+960 777-1001' },
      { name: 'Aminath Noor', email: 'aminath@gmail.com', phone: '+960 777-1002' },
      { name: 'Ali Saeed', email: 'ali.saeed@gmail.com', phone: '+960 777-1003' }
    ]
    for (const p of parents) {
      const parentExists = await prisma.user.findUnique({ where: { email: p.email } })
      if (!parentExists) {
        const parentPassword = bcrypt.hashSync('parent123', 12)
        await prisma.user.create({
          data: {
            name: p.name,
            email: p.email,
            password: parentPassword,
            phone: p.phone,
            role: 'PARENT',
          }
        })
        console.log(`Created default parent: ${p.email}`)
      }
    }

    // Ensure default ClubSettings exist if empty
    const settingsCount = await prisma.clubSettings.count()
    if (settingsCount === 0) {
      await prisma.clubSettings.create({
        data: {
          clubName: 'Maldives Basketball Club',
          contactEmail: 'admin@mbc.mv',
          contactPhone: '+960 300-0000',
          address: 'Malé, Republic of Maldives',
          paymentDueDay: 5,
          currency: 'MVR',
        },
      })
      console.log('Created default club settings.')
    }

    const userCount = await prisma.user.count()
    console.log(`Preserved ${userCount} total users.`)

    console.log('✅ Cleanup completed successfully!')
  } catch (error) {
    console.error('❌ Error executing cleanup:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

main()
