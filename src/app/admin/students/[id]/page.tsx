import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import TopHeader from '@/components/layout/TopHeader'
import StudentDetailClient from './StudentDetailClient'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'

export default async function StudentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: rawId } = await params
  const id = parseInt(rawId)

  const student = await prisma.student.findUnique({
    where: { id },
    include: {
      trainingGroup: {
        include: {
          schedules: true,
          coach: { select: { name: true, email: true } },
          paymentPlan: true,
        },
      },
      parent: { select: { id: true, name: true, email: true, phone: true } },
      payments: { orderBy: { paymentMonth: 'desc' } },
      attendance: { orderBy: { date: 'desc' }, take: 90 },
    },
  })

  if (!student) notFound()

  const groups = await prisma.trainingGroup.findMany({ orderBy: { groupName: 'asc' } })
  const parents = await prisma.user.findMany({ where: { role: 'PARENT' }, orderBy: { name: 'asc' } })

  return (
    <>
      <TopHeader
        title={`${student.firstName} ${student.lastName}`}
        subtitle={`${student.ageGroup} · ${student.trainingGroup?.groupName || 'No group'}`}
      />
      <div className="page-content">
        <div style={{ marginBottom: '1rem' }}>
          <Link href="/admin/students" className="btn-ghost" style={{ padding: '0.375rem 0.75rem', fontSize: '0.8rem' }}>
            <ChevronLeft size={14} /> Back to Students
          </Link>
        </div>
        <StudentDetailClient student={student} groups={groups} parents={parents} />
      </div>
    </>
  )
}
