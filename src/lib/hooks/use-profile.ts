import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '@/lib/auth-provider'
import { api } from '@/lib/api-client'

type Profile = {
  id: string
  email: string | null
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
  })
}

export function useInvalidateProfile() {
  const queryClient = useQueryClient()
  return () => queryClient.invalidateQueries({ queryKey: ['profile'] })
}
