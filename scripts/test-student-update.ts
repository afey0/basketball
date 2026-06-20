import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
  const student = await prisma.student.findFirst()
  if (!student) {
    console.log('No student found')
    return
  }

  console.log('Current student:', {
    id: student.id,
    firstName: student.firstName,
    lastName: student.lastName,
    dateOfBirth: student.dateOfBirth,
    age: student.age,
  })

  // Mimic the PUT request payload
  const body = {
    dateOfBirth: '2014-06-19', // Change birthday to some date
  }

  const dob = body.dateOfBirth ? new Date(body.dateOfBirth) : undefined
  if (dob && isNaN(dob.getTime())) {
    console.error('Invalid Date of Birth')
    return
  }
  const age = dob ? new Date().getFullYear() - dob.getFullYear() : undefined

  console.log('Calculated update data:', { dob, age })

  const updated = await prisma.student.update({
    where: { id: student.id },
    data: {
      ...(dob && { dateOfBirth: dob, age }),
    },
  })

  console.log('Updated student:', {
    id: updated.id,
    firstName: updated.firstName,
    lastName: updated.lastName,
    dateOfBirth: updated.dateOfBirth,
    age: updated.age,
  })
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
