import { hc } from 'hono/client'
import type { AppType } from '@/server/app'
import { supabase } from '@/lib/api-client'

function getClient() {
  return hc<AppType>('/', {
    headers: async () => {
      const { data } = await supabase.auth.getSession()
      const token = data.session?.access_token
      return token ? { Authorization: `Bearer ${token}` } : ({} as Record<string, string>)
    },
  })
}

export const honoClient = getClient()
