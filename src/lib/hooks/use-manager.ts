import { useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api-client'
import { useAuth } from '@/lib/auth-provider'

type ManagerMe = {
  profile: {
    id: string
    email: string | null
    fullName: string | null
    phone: string | null
    role: 'user' | 'admin' | 'manager'
  }
  manager: {
    id: string
    profileId: string
    name: string
    phone: string
    memo: string | null
    isActive: boolean
    createdAt: string
  }
}

export type ManagerCleaning = {
  id: string
  status: 'pending' | 'confirmed' | 'in_progress' | 'completed'
  scheduledDate: string
  scheduledTime: string
  cleaningType: 'standard' | 'urgent'
  memo: string | null
  finalPrice: number
  createdAt: string
  propertyId: string | null
  propertyName: string | null
  propertyAddress: string | null
  propertyAddressDetail: string | null
}

export function useManagerMe() {
  const { user } = useAuth()

  return useQuery({
    queryKey: ['manager', 'me'],
    queryFn: () => api.get<ManagerMe>('/manager/me'),
    enabled: !!user,
    retry: false,
  })
}

export function useManagerOpenCleanings() {
  const { user } = useAuth()

  return useQuery({
    queryKey: ['manager', 'cleanings', 'open'],
    queryFn: () => api.get<ManagerCleaning[]>('/manager/cleanings/open'),
    enabled: !!user,
  })
}

export function useManagerMyCleanings() {
  const { user } = useAuth()

  return useQuery({
    queryKey: ['manager', 'cleanings', 'me'],
    queryFn: () => api.get<ManagerCleaning[]>('/manager/cleanings/me'),
    enabled: !!user,
  })
}

export function useInvalidateManager() {
  const queryClient = useQueryClient()

  return {
    all: () => queryClient.invalidateQueries({ queryKey: ['manager'] }),
    me: () => queryClient.invalidateQueries({ queryKey: ['manager', 'me'] }),
    openCleanings: () => queryClient.invalidateQueries({ queryKey: ['manager', 'cleanings', 'open'] }),
    myCleanings: () => queryClient.invalidateQueries({ queryKey: ['manager', 'cleanings', 'me'] }),
  }
}
