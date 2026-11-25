import { NextRequest, NextResponse } from 'next/server';
import {
  canAccessRoute,
  ERP_ROLE_COOKIE,
  normalizeErpRole,
} from './lib/rbac';

const PUBLIC_PATHS = ['/login', '/unauthorized', '/_next', '/favicon.ico'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (
    PUBLIC_PATHS.some((path) => pathname.startsWith(path)) ||
    pathname.startsWith('/api')
  ) {
    return NextResponse.next();
  }

  const rawCookie = request.cookies.get(ERP_ROLE_COOKIE)?.value;
  const role = normalizeErpRole(rawCookie);

  if (!canAccessRoute(role, pathname)) {
    const unauthorizedUrl = request.nextUrl.clone();
    unauthorizedUrl.pathname = '/unauthorized';
    return NextResponse.redirect(unauthorizedUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};