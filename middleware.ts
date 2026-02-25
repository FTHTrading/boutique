import { authMiddleware } from '@clerk/nextjs';

/**
 * Authentication Middleware
 * 
 * Enforces Clerk auth on all /dashboard/* routes.
 * Public routes are explicitly whitelisted.
 * 
 * Role enforcement happens at the route level via auth().sessionClaims
 */
export default authMiddleware({
  // Public routes - no auth required
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

  // All other routes (/dashboard/*, /api/companies, /api/contacts, etc.)
  // require authentication. If unauthenticated, redirects to /sign-in.
  afterAuth(auth, req) {
    // If accessing dashboard without auth, redirect
    if (!auth.userId && req.nextUrl.pathname.startsWith('/dashboard')) {
      const signInUrl = new URL('/sign-in', req.url);
      signInUrl.searchParams.set('redirect_url', req.nextUrl.href);
      return Response.redirect(signInUrl);
    }
  },
});

export const config = {
  matcher: [
    // Run on all routes except static files
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
