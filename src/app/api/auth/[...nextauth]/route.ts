import { NextResponse } from 'next/server'
import { handlers } from '@/auth'

export const runtime = 'edge'

export const { GET, POST } = handlers
