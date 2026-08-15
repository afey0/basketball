import type { NextAuthConfig } from 'next-auth'

export const authConfig = {
  trustHost: true,
  session: { strategy: 'jwt' },
  pages: {
    signIn: '/auth/login',
    error: '/auth/error',
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.role = (user as any).role
        token.clubId = (user as any).clubId
      }
      return token
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string
        ;(session.user as any).role = token.role
        ;(session.user as any).clubId = token.clubId
      }
      return session
    },
  },
  providers: [], // to be configured in auth.ts
} satisfies NextAuthConfig
