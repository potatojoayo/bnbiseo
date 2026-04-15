import { useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api-client'
import { useAuth } from '@/lib/auth-provider'

type CleaningRequest = {
  id: string
  propertyId: string
  hostId: string
  cleaningType: 'standard' | 'urgent'
  status: 'pending_payment' | 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled'
  scheduledDate: string
  scheduledTime: string
  memo: string | null
  price: number
  discount: number
  finalPrice: number
  orderId: string | null
  paymentKey: string | null
  createdAt: string
  propertyName: string | null
  propertyAddress: string | null
}

export function useCleaningRequests() {
  const { user } = useAuth()

  return useQuery({
    queryKey: ['cleaning-requests'],
    queryFn: () => api.get<CleaningRequest[]>('/cleaning'),
    enabled: !!user,
  })
}

export function useCleaningRequest(id: string) {
  const { user } = useAuth()

  return useQuery({
    queryKey: ['cleaning-requests', id],
    queryFn: () => api.get<CleaningRequest>(`/cleaning/${id}`),
    enabled: !!user && !!id,
  })
}

export function useInvalidateCleaning() {
  const queryClient = useQueryClient()
  return () => queryClient.invalidateQueries({ queryKey: ['cleaning-requests'] })
}
