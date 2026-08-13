import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { LOCALE_COOKIE, DEFAULT_LOCALE, toLocale } from '@/i18n/index';

// Routes that require authentication
const PROTECTED_PREFIXES = ['/student', '/faculty/dashboard'];

// Routes only accessible when NOT authenticated
const AUTH_ROUTES = ['/auth/login', '/auth/register'];

export function proxy(request: NextRequest) {
  // Read locale from cookie and forward as x-locale request header.
  // This allows any future server-side rendering to be locale-aware.
  const localeCookie = request.cookies.get(LOCALE_COOKIE)?.value;
  const locale = toLocale(localeCookie);

  // Set x-locale header on the forwarded request so layouts/pages
  // can read it server-side if needed in the future.
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-locale', locale);

  // Edge-side auth checks are bypassed for cross-domain configurations.
  // Security is enforced via client-side layouts (StudentLayout, FacultyLayout)
  // which have access to cross-origin API credentials and Zustand state.
  const response = NextResponse.next({
    request: { headers: requestHeaders },
  });

  // Propagate x-locale to response headers for client consumption
  response.headers.set('x-locale', locale);

  return response;
}

export const config = {
  matcher: [
    // Run on all paths except static assets
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js)$).*)',
  ],
};
