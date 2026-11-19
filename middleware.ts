import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const accessToken = request.cookies.get('sb-access-token')?.value

  let user = null
  let supabase = null

  if (accessToken) {
    supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { global: { headers: { Authorization: `Bearer ${accessToken}` } } }
    )
    const { data } = await supabase.auth.getUser()
    user = data?.user || null
  }

  // Bina valid session ke koi bhi page khule toh /login par bhejein
  if (!user && !pathname.startsWith('/login')) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // Login ho chuka hai aur /login khole toh seedha Dashboard (/) par bhejein
  if (user && pathname.startsWith('/login')) {
    return NextResponse.redirect(new URL('/', request.url))
  }

  // Role-Based Access Control (RBAC)
  if (user && supabase) {
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('role, is_active')
      .eq('id', user.id)
      .single()

    if (profile && !profile.is_active) {
      return NextResponse.redirect(new URL('/login?error=account_disabled', request.url))
    }

    const role = profile?.role || 'admin'

    const financeRoutes = ['/finance', '/ra', '/petty-cash', '/reports', '/vendors']
    if (role === 'site_engineer' && financeRoutes.some((route) => pathname.startsWith(route))) {
      return NextResponse.redirect(new URL('/?error=access_denied', request.url))
    }

    const adminRoutes = ['/admin', '/users', '/settings']
    if (role !== 'admin' && adminRoutes.some((route) => pathname.startsWith(route))) {
      return NextResponse.redirect(new URL('/?error=admin_only', request.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}
