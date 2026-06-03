import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding database...')

  // Clear existing data
  await prisma.payment.deleteMany()
  await prisma.attendance.deleteMany()
  await prisma.schedule.deleteMany()
  await prisma.paymentPlan.deleteMany()
  await prisma.student.deleteMany()
  await prisma.trainingGroup.deleteMany()
  await prisma.user.deleteMany()
  await prisma.clubSettings.deleteMany()

  // Club Settings
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

  // Admin user
  const adminPassword = await bcrypt.hash('admin123', 12)
  const admin = await prisma.user.create({
    data: {
      name: 'Ahmed Rasheed',
      email: 'admin@mbc.mv',
      password: adminPassword,
      phone: '+960 777-0001',
      role: 'ADMIN',
    },
  })

  // Coaches
  const coachPassword = await bcrypt.hash('coach123', 12)
  const coach1 = await prisma.user.create({
    data: {
      name: 'Ibrahim Waheed',
      email: 'ibrahim@mbc.mv',
      password: coachPassword,
      phone: '+960 777-0002',
      role: 'COACH',
    },
  })
  const coach2 = await prisma.user.create({
    data: {
      name: 'Fathimath Ali',
      email: 'fathimath@mbc.mv',
      password: coachPassword,
      phone: '+960 777-0003',
      role: 'COACH',
    },
  })

  // Parents
  const parentPassword = await bcrypt.hash('parent123', 12)
  const parent1 = await prisma.user.create({
    data: {
      name: 'Mohamed Hassan',
      email: 'mohamed@gmail.com',
      password: parentPassword,
      phone: '+960 777-1001',
      role: 'PARENT',
    },
  })
  const parent2 = await prisma.user.create({
    data: {
      name: 'Aminath Noor',
      email: 'aminath@gmail.com',
      password: parentPassword,
      phone: '+960 777-1002',
      role: 'PARENT',
    },
  })
  const parent3 = await prisma.user.create({
    data: {
      name: 'Ali Saeed',
      email: 'ali.saeed@gmail.com',
      password: parentPassword,
      phone: '+960 777-1003',
      role: 'PARENT',
    },
  })

  // Training Groups
  const group1 = await prisma.trainingGroup.create({
    data: {
      groupName: 'Little Dribblers',
      ageGroup: 'U-8',
      coachId: coach1.id,
      maxCapacity: 15,
      description: 'Beginner program for our youngest ballers aged 6-8.',
    },
  })
  const group2 = await prisma.trainingGroup.create({
    data: {
      groupName: 'Rising Stars',
      ageGroup: 'U-12',
      coachId: coach1.id,
      maxCapacity: 20,
      description: 'Intermediate training for players aged 9-12.',
    },
  })
  const group3 = await prisma.trainingGroup.create({
    data: {
      groupName: 'Elite Squad',
      ageGroup: 'U-16',
      coachId: coach2.id,
      maxCapacity: 18,
      description: 'Advanced competitive training for players aged 13-16.',
    },
  })

  // Payment Plans
  await prisma.paymentPlan.createMany({
    data: [
      { trainingGroupId: group1.id, monthlyFee: 500, currency: 'MVR' },
      { trainingGroupId: group2.id, monthlyFee: 650, currency: 'MVR' },
      { trainingGroupId: group3.id, monthlyFee: 800, currency: 'MVR' },
    ],
  })

  // Schedules
  await prisma.schedule.createMany({
    data: [
      { trainingGroupId: group1.id, dayOfWeek: 'MON', startTime: '15:00', endTime: '16:00', location: 'Court A - Galolhu Indoor', isActive: true },
      { trainingGroupId: group1.id, dayOfWeek: 'WED', startTime: '15:00', endTime: '16:00', location: 'Court A - Galolhu Indoor', isActive: true },
      { trainingGroupId: group1.id, dayOfWeek: 'FRI', startTime: '16:00', endTime: '17:00', location: 'Court A - Galolhu Indoor', isActive: true },
      { trainingGroupId: group2.id, dayOfWeek: 'MON', startTime: '16:30', endTime: '18:00', location: 'Court B - Galolhu Indoor', isActive: true },
      { trainingGroupId: group2.id, dayOfWeek: 'THU', startTime: '16:30', endTime: '18:00', location: 'Court B - Galolhu Indoor', isActive: true },
      { trainingGroupId: group2.id, dayOfWeek: 'SAT', startTime: '09:00', endTime: '10:30', location: 'Outdoor Court - Maafannu', isActive: true },
      { trainingGroupId: group3.id, dayOfWeek: 'TUE', startTime: '17:00', endTime: '19:00', location: 'National Arena', isActive: true },
      { trainingGroupId: group3.id, dayOfWeek: 'THU', startTime: '17:00', endTime: '19:00', location: 'National Arena', isActive: true },
      { trainingGroupId: group3.id, dayOfWeek: 'SAT', startTime: '10:00', endTime: '12:00', location: 'National Arena', isActive: true },
    ],
  })

  // Students
  const studentsData = [
    // Little Dribblers (U-8) - parent1 children
    { firstName: 'Ismail', lastName: 'Hassan', dob: '2019-03-15', gender: 'MALE', ageGroup: 'U-8', jerseyNumber: 5, groupId: group1.id, parentId: parent1.id },
    { firstName: 'Hawwa', lastName: 'Hassan', dob: '2018-07-22', gender: 'FEMALE', ageGroup: 'U-8', jerseyNumber: 7, groupId: group1.id, parentId: parent1.id },
    { firstName: 'Khalid', lastName: 'Noor', dob: '2019-01-10', gender: 'MALE', ageGroup: 'U-8', jerseyNumber: 10, groupId: group1.id, parentId: parent2.id },
    { firstName: 'Mariyam', lastName: 'Noor', dob: '2018-11-05', gender: 'FEMALE', ageGroup: 'U-8', jerseyNumber: 3, groupId: group1.id, parentId: parent2.id },
    { firstName: 'Yoosuf', lastName: 'Saeed', dob: '2019-06-18', gender: 'MALE', ageGroup: 'U-8', jerseyNumber: 8, groupId: group1.id, parentId: parent3.id },
    // Rising Stars (U-12) - mixed parents
    { firstName: 'Ahmed', lastName: 'Hassan', dob: '2015-04-12', gender: 'MALE', ageGroup: 'U-12', jerseyNumber: 11, groupId: group2.id, parentId: parent1.id },
    { firstName: 'Fareeha', lastName: 'Noor', dob: '2014-09-30', gender: 'FEMALE', ageGroup: 'U-12', jerseyNumber: 15, groupId: group2.id, parentId: parent2.id },
    { firstName: 'Hassan', lastName: 'Saeed', dob: '2015-02-14', gender: 'MALE', ageGroup: 'U-12', jerseyNumber: 23, groupId: group2.id, parentId: parent3.id },
    { firstName: 'Aishath', lastName: 'Mohamed', dob: '2014-12-01', gender: 'FEMALE', ageGroup: 'U-12', jerseyNumber: 4, groupId: group2.id, parentId: parent1.id },
    { firstName: 'Rashid', lastName: 'Ali', dob: '2015-07-19', gender: 'MALE', ageGroup: 'U-12', jerseyNumber: 9, groupId: group2.id, parentId: parent2.id },
    // Elite Squad (U-16) - mixed
    { firstName: 'Ibrahim', lastName: 'Hassan', dob: '2011-05-20', gender: 'MALE', ageGroup: 'U-16', jerseyNumber: 1, groupId: group3.id, parentId: parent3.id },
    { firstName: 'Zainab', lastName: 'Saeed', dob: '2010-08-14', gender: 'FEMALE', ageGroup: 'U-16', jerseyNumber: 12, groupId: group3.id, parentId: parent1.id },
    { firstName: 'Moosa', lastName: 'Noor', dob: '2011-11-03', gender: 'MALE', ageGroup: 'U-16', jerseyNumber: 22, groupId: group3.id, parentId: parent2.id },
    { firstName: 'Fathimath', lastName: 'Hassan', dob: '2010-03-28', gender: 'FEMALE', ageGroup: 'U-16', jerseyNumber: 6, groupId: group3.id, parentId: parent3.id },
    { firstName: 'Ali', lastName: 'Mohamed', dob: '2011-01-15', gender: 'MALE', ageGroup: 'U-16', jerseyNumber: 33, groupId: group3.id, parentId: parent1.id },
  ]

  const now = new Date()
  const students = []
  for (const s of studentsData) {
    const dob = new Date(s.dob)
    const age = now.getFullYear() - dob.getFullYear()
    const student = await prisma.student.create({
      data: {
        firstName: s.firstName,
        lastName: s.lastName,
        dateOfBirth: dob,
        age,
        gender: s.gender,
        ageGroup: s.ageGroup,
        jerseyNumber: s.jerseyNumber,
        trainingGroupId: s.groupId,
        parentId: s.parentId,
        enrollmentDate: new Date('2025-09-01'),
        status: 'ACTIVE',
      },
    })
    students.push({ ...student, groupId: s.groupId })
  }

  // Payments - last 2 months
  const currentDate = new Date()
  const months = [
    { month: `${currentDate.getFullYear()}-${String(currentDate.getMonth()).padStart(2, '0')}`, dueDay: 5 },
    { month: `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`, dueDay: 5 },
  ]

  const groupFees: Record<number, number> = {
    [group1.id]: 500,
    [group2.id]: 650,
    [group3.id]: 800,
  }

  for (const student of students) {
    const fee = groupFees[student.groupId] || 500
    for (let i = 0; i < months.length; i++) {
      const [yr, mo] = months[i].month.split('-').map(Number)
      const dueDate = new Date(yr, mo - 1, 5)
      const isPaid = Math.random() > 0.3
      const isOverdue = !isPaid && dueDate < currentDate

      await prisma.payment.create({
        data: {
          studentId: student.id,
          amount: fee,
          currency: 'MVR',
          paymentMonth: months[i].month,
          dueDate,
          paymentDate: isPaid ? new Date(yr, mo - 1, Math.floor(Math.random() * 4) + 1) : null,
          status: isPaid ? 'PAID' : isOverdue ? 'OVERDUE' : 'UNPAID',
          paymentMethod: isPaid ? (['CASH', 'BANK_TRANSFER'][Math.floor(Math.random() * 2)] as string) : null,
          receiptNumber: isPaid ? `RCP-${yr}${String(mo).padStart(2,'0')}-${String(student.id).padStart(3,'0')}` : null,
          recordedById: isPaid ? admin.id : null,
        },
      })
    }
  }

  // Attendance - last month
  const lastMonth = new Date()
  lastMonth.setMonth(lastMonth.getMonth() - 1)
  const attendanceDates = []
  for (let d = 1; d <= 28; d++) {
    const date = new Date(lastMonth.getFullYear(), lastMonth.getMonth(), d)
    if (date.getDay() !== 0 && date.getDay() !== 6) { // weekdays only
      attendanceDates.push(date)
    }
  }

  const statuses = ['PRESENT', 'PRESENT', 'PRESENT', 'ABSENT', 'LATE']
  for (const student of students) {
    // Pick 8 random attendance dates
    const dates = attendanceDates.slice(0, 10)
    for (const date of dates) {
      try {
        await prisma.attendance.create({
          data: {
            studentId: student.id,
            trainingGroupId: student.groupId,
            date,
            status: statuses[Math.floor(Math.random() * statuses.length)],
            markedById: admin.id,
          },
        })
      } catch {
        // Skip duplicates
      }
    }
  }

  console.log('✅ Seed complete!')
  console.log('\nTest accounts:')
  console.log('  Admin:  admin@mbc.mv / admin123')
  console.log('  Coach:  ibrahim@mbc.mv / coach123')
  console.log('  Parent: mohamed@gmail.com / parent123')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
