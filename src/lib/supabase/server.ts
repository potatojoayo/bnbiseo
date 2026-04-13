/**
 * @deprecated Server-side Supabase client is no longer used for auth.
 * Auth is handled via Authorization header + Hono middleware.
 * This file is kept temporarily for the auth callback route only.
 */

import { createClient } from '@supabase/supabase-js'

export function createSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY!,
  )
}
