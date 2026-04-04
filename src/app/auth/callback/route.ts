import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'

/**
 * Supabase Auth Callback Route
 *
 * Handles the OAuth / magic-link / email-confirmation redirect from Supabase.
 * Exchanges the one-time `code` for a session, then redirects the user.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/dashboard'

  if (code) {
    const supabase = await createServerClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error) {
      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  // Redirect to error page or login on failure
  return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`)
}
