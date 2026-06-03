import { auth } from '@/auth'
import { NextResponse } from 'next/server'

export default auth((req) => {
  const { nextUrl, auth: session } = req
  const isLoggedIn = !!session
  const role = (session?.user as any)?.role

  const isAdminRoute = nextUrl.pathname.startsWith('/admin')
  const isPortalRoute = nextUrl.pathname.startsWith('/portal')
  const isAuthRoute = nextUrl.pathname.startsWith('/auth')

  // Redirect logged-in users away from auth pages
  if (isLoggedIn && isAuthRoute) {
    if (role === 'PARENT') return NextResponse.redirect(new URL('/portal', req.url))
    return NextResponse.redirect(new URL('/admin', req.url))
  }

  // Protect admin routes
  if (isAdminRoute) {
    if (!isLoggedIn) return NextResponse.redirect(new URL('/auth/login', req.url))
    if (role === 'PARENT') return NextResponse.redirect(new URL('/portal', req.url))
  }

  // Protect portal routes
  if (isPortalRoute) {
    if (!isLoggedIn) return NextResponse.redirect(new URL('/auth/login', req.url))
    if (role === 'ADMIN' || role === 'COACH') return NextResponse.redirect(new URL('/admin', req.url))
  }

  return NextResponse.next()
})

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|public).*)'],
}
