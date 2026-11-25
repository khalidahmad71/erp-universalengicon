// middleware.ts
import { NextResponse, type NextRequest } from 'next/server';
import { canAccessRoute } from '@/lib/rbac';

const PUBLIC_PATHS = ['/login', '/unauthorized', '/api/health'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (PUBLIC_PATHS.some((path) => pathname.startsWith(path))) {
    return NextResponse.next();
  }

  // Agar aap role cookie mein store karte hain (jaise `erp_role`), toh yahan se padh sakte hain:
  const role = request.cookies.get('erp_role')?.value ?? null;

  if (!canAccessRoute(pathname, role)) {
    const unauthorizedUrl = request.nextUrl.clone();
    unauthorizedUrl.pathname = '/unauthorized';
    return NextResponse.redirect(unauthorizedUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};