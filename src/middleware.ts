import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getToken } from 'next-auth/jwt'

export const config = {
  // Make sure "/" is matched so it's protected
  matcher: ['/((?!api|_next|static|favicon.ico).*)'],
}

export async function middleware(request: NextRequest) {
  // Read token from next-auth
  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET })
  const { pathname } = request.nextUrl

  console.log('🌐 Middleware triggered:', pathname)
  console.log('📦 Token:', token)

  // If user is NOT logged in and not on /auth/signin, redirect them
  if (!token && pathname !== '/auth/signin') {
    return NextResponse.redirect(new URL('/auth/signin', request.url))
  }

  // If user IS logged in and tries to go to /auth/signin, redirect to home
  if (token && pathname === '/auth/signin') {
    return NextResponse.redirect(new URL('/', request.url))
  }

  // Otherwise, allow them through
  return NextResponse.next()
}
