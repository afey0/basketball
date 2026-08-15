import NextAuth from 'next-auth'
import Credentials from '@auth/core/providers/credentials'
import { prisma } from '@/lib/prisma'
import * as bcrypt from 'bcryptjs'
import { z } from 'zod'
import { authConfig } from './auth.config'

console.log('📦 DIAGNOSTICS - NextAuth:', typeof NextAuth)
console.log('📦 DIAGNOSTICS - Credentials:', typeof Credentials)
console.log('📦 DIAGNOSTICS - bcrypt:', typeof bcrypt)

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        console.log('🔑 NextAuth authorize callback triggered', { email: credentials?.email })

        const parsed = z.object({
          email: z.string().email(),
          password: z.string().min(6),
        }).safeParse(credentials)

        if (!parsed.success) {
          console.warn('❌ NextAuth credentials validation failed', parsed.error.format())
          return null
        }

        console.log('🔍 Searching user in D1 database...', parsed.data.email)
        const user = await prisma.user.findUnique({
          where: { email: parsed.data.email },
        })

        if (!user) {
          console.warn('❌ User not found in D1 database for email:', parsed.data.email)
          return null
        }

        console.log('👤 User found in D1 database. Verifying password...')
        const valid = await bcrypt.compare(parsed.data.password, user.password)
        
        if (!valid) {
          console.warn('❌ Password mismatch for user:', parsed.data.email)
          return null
        }

        console.log('✅ Password verified successfully. Logging in user:', user.email)
        return {
          id: String(user.id),
          name: user.name,
          email: user.email,
          role: user.role,
          clubId: user.clubId,
        }
      },
    }),
  ],
})
