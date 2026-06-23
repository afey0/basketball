import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { writeFile, mkdir } from 'fs/promises'
import path from 'path'
import crypto from 'crypto'

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const formData = await req.formData()
    const file = formData.get('file') as File | null
    if (!file) return NextResponse.json({ error: 'No file uploaded' }, { status: 400 })

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    const cloudName = process.env.CLOUDINARY_CLOUD_NAME
    const uploadPreset = process.env.CLOUDINARY_UPLOAD_PRESET
    const apiKey = process.env.CLOUDINARY_API_KEY
    const apiSecret = process.env.CLOUDINARY_API_SECRET

    // 1. Unsigned Cloudinary Upload
    if (cloudName && uploadPreset) {
      const cloudinaryForm = new FormData()
      const fileBlob = new Blob([buffer], { type: file.type || 'image/png' })
      cloudinaryForm.append('file', fileBlob, file.name)
      cloudinaryForm.append('upload_preset', uploadPreset)
      
      const folder = process.env.CLOUDINARY_FOLDER || 'basketball_crm'
      cloudinaryForm.append('folder', folder)

      const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
        method: 'POST',
        body: cloudinaryForm,
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error?.message || 'Cloudinary unsigned upload failed')
      }

      const uploadResult = await response.json()
      return NextResponse.json({ url: uploadResult.secure_url })
    }

    // 2. Signed Cloudinary Upload
    if (cloudName && apiKey && apiSecret) {
      const timestamp = Math.round(new Date().getTime() / 1000).toString()
      const folder = process.env.CLOUDINARY_FOLDER || 'basketball_crm'
      
      // Calculate signature (sort keys alphabetically: folder, timestamp)
      const strToSign = `folder=${folder}&timestamp=${timestamp}${apiSecret}`
      const signature = crypto.createHash('sha1').update(strToSign).digest('hex')

      const cloudinaryForm = new FormData()
      const fileBlob = new Blob([buffer], { type: file.type || 'image/png' })
      cloudinaryForm.append('file', fileBlob, file.name)
      cloudinaryForm.append('api_key', apiKey)
      cloudinaryForm.append('timestamp', timestamp)
      cloudinaryForm.append('folder', folder)
      cloudinaryForm.append('signature', signature)

      const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
        method: 'POST',
        body: cloudinaryForm,
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error?.message || 'Cloudinary signed upload failed')
      }

      const uploadResult = await response.json()
      return NextResponse.json({ url: uploadResult.secure_url })
    }

    // 3. Fallback: Local filesystem storage
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
