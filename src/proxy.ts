import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createServerClient as _createServerClient } from '@supabase/ssr'

/**
 * proxy.ts — Next.js 16 replacement for middleware.ts
 *
 * Responsibilities:
 * - Refresh Supabase session cookies on every request
 * - Protect /dashboard/** routes: redirect unauthenticated users to /login
 * - Allow /guest/** routes without authentication (QR guest access)
 */
export async function proxy(request: NextRequest) {
  let response = NextResponse.next({
    request,
  })

  // Refresh the Supabase session so it doesn't expire mid-visit
  const supabase = _createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          // Forward updated cookies to both the request and response
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          )
          response = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          )
        },
      },
    },
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { pathname } = request.nextUrl

  // Protect /dashboard/** and /onboarding/** — redirect to /login if not authenticated
  if (pathname.startsWith('/dashboard') || pathname.startsWith('/onboarding')) {
    if (!user) {
      const loginUrl = new URL('/login', request.url)
      loginUrl.searchParams.set('redirectTo', pathname)
      return NextResponse.redirect(loginUrl)
    }
  }

  // Redirect authenticated users away from auth pages
  if ((pathname === '/login' || pathname === '/signup') && user) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  return response
}

export const config = {
  matcher: [
    /*
     * Run proxy on all paths except:
     * - _next/static (static assets)
     * - _next/image (image optimisation)
     * - favicon.ico, sitemap.xml, robots.txt
     * - public folder files
     */
    '/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|fonts/).*)',
  ],
}
