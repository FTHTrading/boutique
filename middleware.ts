import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// If Clerk keys are present, use full Clerk auth middleware.
// If not (e.g. Vercel before env vars are configured), pass all traffic through
// so the site stays up — auth will activate once keys are added and redeployed.

const clerkPublishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;

let clerkMiddleware: ((req: NextRequest) => Promise<NextResponse> | NextResponse) | null = null;

if (clerkPublishableKey) {
  // Dynamically load Clerk only when keys are available
  const { authMiddleware } = require('@clerk/nextjs');
  const handler = authMiddleware({
    publicRoutes: [
      '/',
      '/commodities',
      '/commodities/(.*)',
      '/compliance',
      '/request-terms',
      '/api/leads',
      '/api/proposals/(.*)',
      '/sign-in',
      '/sign-up',
      '/_next/(.*)',
      '/favicon.ico',
    ],
    afterAuth(auth: any, req: NextRequest) {
      if (!auth.userId && req.nextUrl.pathname.startsWith('/dashboard')) {
        const signInUrl = new URL('/sign-in', req.url);
        signInUrl.searchParams.set('redirect_url', req.nextUrl.href);
        return Response.redirect(signInUrl);
      }
    },
  });
  clerkMiddleware = handler;
}

export default function middleware(req: NextRequest) {
  if (clerkMiddleware) {
    return (clerkMiddleware as any)(req);
  }
  // No Clerk keys yet — let everything through
  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
