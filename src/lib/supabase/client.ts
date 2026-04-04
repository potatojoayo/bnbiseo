import { createBrowserClient } from '@supabase/ssr'

/**
 * Creates a Supabase client for browser use.
 * Only used for Supabase Storage file uploads — all DB operations go via Drizzle.
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY!,
  )
}
