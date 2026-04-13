'use client'

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { supabase } from '@/lib/api-client'
import type { User, Session } from '@supabase/supabase-js'

type AuthContextType = {
  user: User | null
  session: Session | null
  loading: boolean
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  loading: true,
})

export function useAuth() {
  return useContext(AuthContext)
}

const PUBLIC_PATHS = ['/', '/login', '/signup', '/terms', '/privacy']
const GUEST_PREFIX = '/guest'

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session: s } }) => {
      setSession(s)
      setUser(s?.user ?? null)
      setLoading(false)
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s)
      setUser(s?.user ?? null)
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  useEffect(() => {
    if (loading) return

    const isPublic =
      PUBLIC_PATHS.includes(pathname) ||
      pathname.startsWith(GUEST_PREFIX)

    if (!user && !isPublic) {
      router.replace(`/login?redirectTo=${encodeURIComponent(pathname)}`)
    }

    if (user && (pathname === '/login' || pathname === '/signup')) {
      router.replace('/dashboard')
    }
  }, [user, loading, pathname, router])

  return (
    <AuthContext.Provider value={{ user, session, loading }}>
      {children}
    </AuthContext.Provider>
  )
}
