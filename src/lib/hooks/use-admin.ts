import { useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api-client'

// ─── Types ──────────────────────────────────────────────────────────────────

type PendingItem = {
  id: string
  scheduledDate: string
  scheduledTime: string
  cleaningType: string
  finalPrice: number
  propertyName: string | null
  hostName: string | null
}

type ScheduleItem = {
  id: string
  scheduledTime: string
  status: string
  cleaningType: string
  propertyName: string | null
  managerName: string | null
}

type Stats = {
  todayCleaning: { pending: number; confirmed: number; inProgress: number; completed: number }
  todayRevenue: number
  monthRevenue: number
  pendingAssignment: PendingItem[]
  todaySchedule: ScheduleItem[]
  totalProperties: number
  totalUsers: number
  totalManagers: number
}

type CleaningRequest = {
  id: string
  propertyName: string | null
  propertyAddress: string | null
  hostName: string | null
  hostEmail: string | null
  managerId: string | null
  managerName: string | null
  cleaningType: string
  status: string
  scheduledDate: string
  scheduledTime: string
  memo: string | null
  finalPrice: number
  createdAt: string
}

type Manager = {
  id: string
  name: string
  phone: string
  memo: string | null
  isActive: boolean
  createdAt: string
}

type Property = {
  id: string
  name: string
  address: string
  pyeong: number | null
  bedrooms: number
  bathrooms: number
  hostName: string | null
  hostEmail: string | null
  createdAt: string
}

type User = {
  id: string
  email: string | null
  fullName: string | null
  phone: string | null
  role: string
  onboardingCompleted: boolean
  createdAt: string
}

// ─── Hooks ──────────────────────────────────────────────────────────────────

export function useAdminStats() {
  return useQuery({
    queryKey: ['admin', 'stats'],
    queryFn: () => api.get<Stats>('/admin/stats'),
  })
}

export function useAdminCleaning(status?: string) {
  return useQuery({
    queryKey: ['admin', 'cleaning', status ?? 'all'],
    queryFn: () => api.get<CleaningRequest[]>(`/admin/cleaning${status ? `?status=${status}` : ''}`),
  })
}

export function useAdminManagers() {
  return useQuery({
    queryKey: ['admin', 'managers'],
    queryFn: () => api.get<Manager[]>('/admin/managers'),
  })
}

export function useAdminProperties() {
  return useQuery({
    queryKey: ['admin', 'properties'],
    queryFn: () => api.get<Property[]>('/admin/properties'),
  })
}

export function useAdminUsers() {
  return useQuery({
    queryKey: ['admin', 'users'],
    queryFn: () => api.get<User[]>('/admin/users'),
  })
}

export function useInvalidateAdmin() {
  const queryClient = useQueryClient()
  return {
    all: () => queryClient.invalidateQueries({ queryKey: ['admin'] }),
    stats: () => queryClient.invalidateQueries({ queryKey: ['admin', 'stats'] }),
    cleaning: () => queryClient.invalidateQueries({ queryKey: ['admin', 'cleaning'] }),
    managers: () => queryClient.invalidateQueries({ queryKey: ['admin', 'managers'] }),
    properties: () => queryClient.invalidateQueries({ queryKey: ['admin', 'properties'] }),
    users: () => queryClient.invalidateQueries({ queryKey: ['admin', 'users'] }),
  }
}
