import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

export async function middleware(request: NextRequest) {
  console.log('--- Middleware triggered ---');
  console.log('Request URL:', request.nextUrl.href);
  console.log('Request cookie header:', request.headers.get('cookie'));

  // Log environment details
  if (process.env.NODE_ENV === 'development') {
    console.log('Environment: development');
    console.log('NEXTAUTH_SECRET:', process.env.NEXTAUTH_SECRET);
  } else {
    console.log('Environment: production');
    console.log('NEXTAUTH_SECRET is set:', !!process.env.NEXTAUTH_SECRET);
  }

  // Bypass API routes to let NextAuth endpoints work correctly.
  if (request.nextUrl.pathname.startsWith('/api')) {
    console.log('Bypassing API route:', request.nextUrl.pathname);
    return NextResponse.next();
  }

  // Bypass auth pages to avoid redirect loops.
  if (request.nextUrl.pathname.startsWith('/auth')) {
    console.log('Bypassing auth route:', request.nextUrl.pathname);
    return NextResponse.next();
  }

  // Retrieve the token with secureCookie set appropriately.
  let token;
  try {
    token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
      secureCookie: process.env.NODE_ENV === 'production', // false in development
    });
  } catch (error) {
    console.error('Error retrieving token:', error);
  }
  console.log('Token from getToken:', token);

  // If no token is found, redirect to the sign-in page.
  if (!token) {
    console.warn('No token found, redirecting to sign-in');
    const signInUrl = new URL('/auth/signin', request.url);
    return NextResponse.redirect(signInUrl);
  }

  console.log('Token found, allowing request');
  return NextResponse.next();
}

// Apply middleware to all routes except static assets.
export const config = {
  matcher: ['/((?!_next|favicon.ico).*)'],
};
