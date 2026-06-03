import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/auth'
import { writeFile, mkdir } from 'fs/promises'
import path from 'path'
import { sendSlipUploadNotification } from '@/lib/email'

export async function POST(req: NextRequest, props: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id: rawId } = await props.params
  const paymentId = parseInt(rawId)

  try {
    const formData = await req.formData()
    const file = formData.get('file') as File | null
    if (!file) return NextResponse.json({ error: 'No file uploaded' }, { status: 400 })

    const payment = await prisma.payment.findUnique({
      where: { id: paymentId },
      include: { student: { include: { parent: true } } }
    })
    if (!payment) return NextResponse.json({ error: 'Payment not found' }, { status: 404 })

    // Verify parent owns this child's payment
    if (session.user?.role === 'PARENT' && payment.student.parentId !== parseInt((session.user as any).id)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'slips')
    await mkdir(uploadDir, { recursive: true })

    const ext = path.extname(file.name) || '.png'
    const fileName = `slip-${paymentId}-${Date.now()}${ext}`
    const filePath = path.join(uploadDir, fileName)

    await writeFile(filePath, buffer)
    const slipUrl = `/uploads/slips/${fileName}`

    // Update payment record to PENDING approval
    const updated = await prisma.payment.update({
      where: { id: paymentId },
      data: {
        status: 'PENDING',
        slipUrl,
        rejectionReason: null,
      },
      include: { student: { include: { parent: true } } }
    })

    // Email notification to Admin
    const settings = await prisma.clubSettings.findFirst()
    const adminEmail = settings?.contactEmail || process.env.SMTP_USER || ''
    if (adminEmail) {
      await sendSlipUploadNotification(
        adminEmail,
        payment.student.parent?.name || 'Parent',
        `${payment.student.firstName} ${payment.student.lastName}`,
        payment.amount,
        payment.paymentMonth
      )
    }

    return NextResponse.json(updated)
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 })
  }
}
