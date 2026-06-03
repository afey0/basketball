import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { writeFile, mkdir } from 'fs/promises'
import path from 'path'

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const formData = await req.formData()
    const file = formData.get('file') as File | null
    if (!file) return NextResponse.json({ error: 'No file uploaded' }, { status: 400 })

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'photos')
    await mkdir(uploadDir, { recursive: true })

    const ext = path.extname(file.name) || '.png'
    const fileName = `photo-${Date.now()}${ext}`
    const filePath = path.join(uploadDir, fileName)

    await writeFile(filePath, buffer)
    const url = `/uploads/photos/${fileName}`

    return NextResponse.json({ url })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 })
  }
}
