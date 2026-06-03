import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  const adminPassword = await bcrypt.hash('admin123', 12)
  const coachPassword = await bcrypt.hash('coach123', 12)
  const parentPassword = await bcrypt.hash('parent123', 12)

  // Upsert admin
  await prisma.user.upsert({
    where: { email: 'admin@mbc.mv' },
    update: {
      password: adminPassword,
      role: 'ADMIN',
      name: 'Admin Test User'
    },
    create: {
      email: 'admin@mbc.mv',
      password: adminPassword,
      role: 'ADMIN',
      name: 'Admin Test User'
    }
  })
  console.log('Ensured admin@mbc.mv is set to admin123')

  // Upsert coach
  await prisma.user.upsert({
    where: { email: 'ibrahim@mbc.mv' },
    update: {
      password: coachPassword,
      role: 'COACH',
      name: 'Ibrahim Waheed'
    },
    create: {
      email: 'ibrahim@mbc.mv',
      password: coachPassword,
      role: 'COACH',
      name: 'Ibrahim Waheed'
    }
  })
  console.log('Ensured ibrahim@mbc.mv is set to coach123')

  // Upsert parent
  await prisma.user.upsert({
    where: { email: 'mohamed@gmail.com' },
    update: {
      password: parentPassword,
      role: 'PARENT',
      name: 'Mohamed Hassan'
    },
    create: {
      email: 'mohamed@gmail.com',
      password: parentPassword,
      role: 'PARENT',
      name: 'Mohamed Hassan'
    }
  })
  console.log('Ensured mohamed@gmail.com is set to parent123')

  // Upsert other parent
  await prisma.user.upsert({
    where: { email: 'ali.saeed@gmail.com' },
    update: {
      password: parentPassword,
      role: 'PARENT',
      name: 'Ali Saeed'
    },
    create: {
      email: 'ali.saeed@gmail.com',
      password: parentPassword,
      role: 'PARENT',
      name: 'Ali Saeed'
    }
  })
  console.log('Ensured ali.saeed@gmail.com is set to parent123')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
