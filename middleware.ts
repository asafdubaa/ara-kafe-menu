import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyToken } from '@/lib/auth-utils';

const PUBLIC_FILE = /^\.?\/|\/favicon\.ico|_next\/|.*\.(?:svg|png|jpg|jpeg|gif|webp|css|js)$/;
const ADMIN_ROUTE = /^\/admin(?:\/|$)/;
const AUTH_ROUTE = /^\/api\/auth/;
const PUBLIC_ROUTES = ['/admin/login'];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip middleware for public files, API auth routes, and public pages
  if (PUBLIC_FILE.test(pathname) || AUTH_ROUTE.test(pathname) || PUBLIC_ROUTES.includes(pathname)) {
    return NextResponse.next();
  }

  // Protect admin routes
  if (ADMIN_ROUTE.test(pathname)) {
    const token = request.cookies.get('auth_token')?.value;
    
    if (!token) {
      const url = new URL('/admin/login', request.url);
      return NextResponse.redirect(url);
    }

    // Verify the token
    const { valid } = await verifyToken();
    
    if (!valid) {
      const url = new URL('/admin/login', request.url);
      const response = NextResponse.redirect(url);
      response.cookies.set('auth_token', '', {
        expires: new Date(0),
        path: '/',
      });
      return response;
    }
  }

  return NextResponse.next();
}

export const config = {
  // Match all routes except static files and API routes
  matcher: ['/admin/:path*'],
};
