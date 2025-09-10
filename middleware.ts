import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyToken, extractTokenFromHeader } from './lib/auth';

export function middleware(request: NextRequest) {
  // Public routes that don't require authentication
  const publicRoutes = [
    '/',
    '/shop',
    '/product',
    '/featured',
    '/orders',
    '/api/auth/signin',
    '/api/auth/signup',
    '/sign-in',
    '/sign-up'
  ];

  const isPublicRoute = publicRoutes.some(route =>
    request.nextUrl.pathname.startsWith(route)
  );

  // Admin routes that require admin role
  const adminRoutes = [
    '/admin',
    '/api/categories',
    '/api/products',
    '/api/product',
    '/api/billboards'
  ];

  const isAdminRoute = adminRoutes.some(route =>
    request.nextUrl.pathname.startsWith(route)
  );

  // Skip middleware for public routes
  if (isPublicRoute) {
    return NextResponse.next();
  }

  // Check authentication for protected routes
  const token = extractTokenFromHeader(request.headers.get('authorization'));

  if (!token) {
    // Redirect to sign-in page for unauthenticated requests
    if (request.nextUrl.pathname.startsWith('/admin')) {
      return NextResponse.redirect(new URL('/sign-in', request.url));
    }
    return NextResponse.json(
      { error: 'Authentication required' },
      { status: 401 }
    );
  }

  const payload = verifyToken(token);
  if (!payload) {
    if (request.nextUrl.pathname.startsWith('/admin')) {
      return NextResponse.redirect(new URL('/sign-in', request.url));
    }
    return NextResponse.json(
      { error: 'Invalid or expired token' },
      { status: 401 }
    );
  }

  // Check admin access for admin routes
  if (isAdminRoute && payload.role !== 'ADMIN') {
    return NextResponse.json(
      { error: 'Admin access required' },
      { status: 403 }
    );
  }

  // Clone the request and add user info to headers
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-user-id', payload.userId);
  requestHeaders.set('x-user-email', payload.email);
  requestHeaders.set('x-user-role', payload.role);

  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api/auth (auth endpoints)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api/auth|_next/static|_next/image|favicon.ico).*)',
  ],
};
