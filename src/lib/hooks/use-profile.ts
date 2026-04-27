import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '@/lib/auth-provider'
import { api, ApiError } from '@/lib/api-client'

type Profile = {
  id: string
  email: string | null
  phone: string | null
  fullName: string | null
  onboardingCompleted: boolean
  role: 'user' | 'admin' | 'manager'
}

export function useProfile() {
  const { user } = useAuth()

  return useQuery({
    queryKey: ['profile'],
    queryFn: () => api.get<Profile>('/profiles/me'),
    enabled: !!user,
    retry: (failureCount, error) => {
      // 404 = profile doesn't exist yet (mid-signup). Not a transient failure.
      if (error instanceof ApiError && error.status === 404) return false
      return failureCount < 3
    },
  })
}

export function useInvalidateProfile() {
  const queryClient = useQueryClient()
  return () => queryClient.invalidateQueries({ queryKey: ['profile'] })
}
