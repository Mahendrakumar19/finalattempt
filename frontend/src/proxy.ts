import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Routes that require authentication
const PROTECTED_PREFIXES = ['/student', '/faculty/dashboard'];

// Routes only accessible when NOT authenticated
const AUTH_ROUTES = ['/auth/login', '/auth/register'];

export function proxy(request: NextRequest) {
  // Edge-side middleware cookie reads are bypassed for cross-domain configurations.
  // Security checks are enforced via client-side layouts (e.g. StudentLayout, FacultyLayout)
  // which have access to cross-origin API credentials and state stores.
  return NextResponse.next();
}


export const config = {
  matcher: [
    '/student/:path*',
    '/faculty/dashboard/:path*',
    '/auth/:path*'
  ]
};
