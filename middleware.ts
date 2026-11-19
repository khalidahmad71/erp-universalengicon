import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  const accessToken =
    request.cookies.get('sb-access-token')?.value ||
    request.cookies.get('sb-jvorxidiigvdznnpgxrj-auth-token')?.value

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    accessToken ? { global: { headers: { Authorization: `Bearer ${accessToken}` } } } : {}
  )

  const { data: { user } } = await supabase.auth.getUser()

  if (!user && !pathname.startsWith('/login')) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  if (user && pathname.startsWith('/login')) {
    return NextResponse.redirect(new URL('/', request.url))
  }

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
