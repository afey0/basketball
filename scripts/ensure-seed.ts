import { PrismaClient } from '@prisma/client'
import { execSync } from 'child_process'

const prisma = new PrismaClient()

async function main() {
  try {
    const userCount = await prisma.user.count()
    if (userCount === 0) {
      console.log('Database is empty. Running prisma/seed.ts...')
      execSync('npx tsx prisma/seed.ts', { stdio: 'inherit' })
    } else {
      console.log(`Database already contains ${userCount} users. Skipping seed.`)
    }
  } catch (error) {
    console.error('Error during startup check:', error)
  } finally {
    await prisma.$disconnect()
  }
}

main()
