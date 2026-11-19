import { createClient } from '@supabase/supabase-js'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname

  // 1. Public login/auth routes aur home page allow karein
  if (pathname === '/' || pathname.startsWith('/login') || pathname.startsWith('/auth')) {
    return NextResponse.next()
  }

  // 2. Supabase auth cookie se access token nikaalein
  const allCookies = request.cookies.getAll()
  const authCookie = allCookies.find(
    (c) => c.name.startsWith('sb-') && c.name.endsWith('-auth-token')
  )

  let accessToken: string | null = null
  if (authCookie?.value) {
    try {
      const parsed = JSON.parse(decodeURIComponent(authCookie.value))
      accessToken = Array.isArray(parsed) ? parsed[0] : parsed?.access_token
    } catch {
      accessToken = authCookie.value
    }
  }

  // 3. Agar browser cookie mein token hai toh server-side role check karein
  if (accessToken) {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        global: {
          headers: { Authorization: `Bearer ${accessToken}` },
        },
      }
    )

    const { data: { user } } = await supabase.auth.getUser()

    if (user) {
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('role, is_active')
        .eq('id', user.id)
        .single()

      if (profile && !profile.is_active) {
        return NextResponse.redirect(new URL('/login?error=account_disabled', request.url))
      }

      const role = profile?.role || 'site_engineer'

      // Finance, Billing & Vendor Ledger routes: Site Engineers blocked
      const financeRoutes = ['/finance', '/ra', '/petty-cash', '/reports', '/vendors']
      if (role === 'site_engineer' && financeRoutes.some((route) => pathname.startsWith(route))) {
        return NextResponse.redirect(new URL('/dashboard?error=access_denied', request.url))
      }

      // Admin-only routes (Access Control / Role Management)
      const adminRoutes = ['/admin', '/users', '/settings']
      if (role !== 'admin' && adminRoutes.some((route) => pathname.startsWith(route))) {
        return NextResponse.redirect(new URL('/dashboard?error=admin_only', request.url))
      }
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}