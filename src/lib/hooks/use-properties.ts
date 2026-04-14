import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api-client'
import { useAuth } from '@/lib/auth-provider'

type Property = {
  id: string
  name: string
  address: string
  addressDetail: string | null
  airbnbListingId: string | null
}

export function useProperties() {
  const { user } = useAuth()

  return useQuery({
    queryKey: ['properties'],
    queryFn: () => api.get<Property[]>('/properties'),
    enabled: !!user,
  })
}

export function useProperty(id: string) {
  const { user } = useAuth()

  return useQuery({
    queryKey: ['properties', id],
    queryFn: () => api.get<Property>(`/properties/${id}`),
    enabled: !!user && !!id,
  })
}

export function useInvalidateProperties() {
  const queryClient = useQueryClient()
  return () => queryClient.invalidateQueries({ queryKey: ['properties'] })
}
