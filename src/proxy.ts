import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

/**
 * proxy.ts — Minimal proxy for Next.js 16
 *
 * Auth is handled client-side via Supabase JS SDK + Authorization header.
 * This proxy only handles basic request forwarding.
 */
export async function proxy(request: NextRequest) {
  return NextResponse.next({ request })
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|fonts/).*)',
  ],
}
