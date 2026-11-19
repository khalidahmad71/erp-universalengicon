import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const accessToken = request.cookies.get('sb-access-token')?.value
  const ueSession = request.cookies.get('ue_session')?.value
  const ueRole = decodeURIComponent(request.cookies.get('ue_role')?.value || '')

  let isAuthenticated = false
  let role = 'admin'

  if (accessToken) {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { global: { headers: { Authorization: `Bearer ${accessToken}` } } }
    )
    const { data } = await supabase.auth.getUser()
    if (data?.user) {
      isAuthenticated = true
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('role, is_active')
        .eq('id', data.user.id)
        .single()
      if (profile && !profile.is_active) {
        return NextResponse.redirect(new URL('/login?error=account_disabled', request.url))
      }
      role = profile?.role || 'admin'
    }
  } else if (ueSession) {
    isAuthenticated = true
    if (ueRole === 'Site Engineer') role = 'site_engineer'
    else if (ueRole === 'Accounts Manager') role = 'accounts'
    else if (ueRole === 'Store Keeper') role = 'store_keeper'
    else role = 'admin'
  }

  if (!isAuthenticated && !pathname.startsWith('/login')) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  if (isAuthenticated && pathname.startsWith('/login')) {
    return NextResponse.redirect(new URL('/', request.url))
  }

  if (isAuthenticated) {
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
