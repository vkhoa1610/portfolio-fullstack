import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const accessToken = request.cookies.get('access_token');
  if (!accessToken) {
    return NextResponse.redirect(new URL('/auth/login', request.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/onboarding/:path*',
    '/dashboard/:path*',
    '/my-expenses/:path*',
    '/manager/:path*',
    '/finance/:path*',
    '/settings/:path*',
    '/settings',
    '/admin/:path*',
  ],
};
