import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
  const deletedStudents = await prisma.student.deleteMany({
    where: {
      firstName: 'Junior',
      lastName: 'Mohamed'
    }
  })
  console.log(`Deleted ${deletedStudents.count} leftover Junior Mohamed student records.`)
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
