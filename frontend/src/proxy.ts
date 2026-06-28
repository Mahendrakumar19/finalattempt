import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Routes that require authentication
const PROTECTED_PREFIXES = ['/student', '/faculty/dashboard'];

// Routes only accessible when NOT authenticated (redirect to dashboard if logged in)
const AUTH_ROUTES = ['/auth/login', '/auth/register'];

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Check for refresh token cookie to determine auth status
  // (Access tokens are in-memory; we use the presence of the refresh token as a gate)
  const hasRefreshToken = request.cookies.has('refreshToken');

  // Redirect to login if trying to access protected routes without auth
  const isProtected = PROTECTED_PREFIXES.some(prefix => pathname.startsWith(prefix));
  if (isProtected && !hasRefreshToken) {
    const loginUrl = new URL('/auth/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Redirect to Student dashboard if trying to access auth pages while already logged in
  const isAuthRoute = AUTH_ROUTES.some(route => pathname.startsWith(route));
  if (isAuthRoute && hasRefreshToken) {
    return NextResponse.redirect(new URL('/student/dashboard', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/student/:path*',
    '/faculty/dashboard/:path*',
    '/auth/:path*'
  ]
};
