import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Simple middleware: protect /dashboard routes.
// When Clerk env vars are present they handle auth via the layout.
// Without them (unconfigured deployment) we pass all traffic through
// so the public site works immediately.
export function middleware(req: NextRequest) {
  // If Clerk is not configured, let everything through
  if (!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY) {
    return NextResponse.next();
  }

  // Clerk is configured: /dashboard requires auth.
  // Auth check happens server-side in app/dashboard/layout.tsx via auth().
  // Middleware just passes through — Clerk's server components handle the guard.
  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
