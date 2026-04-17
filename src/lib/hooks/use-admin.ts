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
  profileId: string
  email: string | null
  name: string
  phone: string
  memo: string | null
  isActive: boolean
  createdAt: string
}

type Property = {
  id: string
  status: 'pending_activation' | 'active'
  name: string
  address: string
  pyeong: number | null
  livingRooms: number | null
  bedrooms: number | null
  bathrooms: number | null
  hostName: string | null
  hostEmail: string | null
  createdAt: string
  activatedAt: string | null
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

type FixtureCategory =
  | 'lighting'
  | 'furniture'
  | 'faucet'
  | 'boiler'
  | 'appliance'
  | 'lock'
  | 'ac'
  | 'washer'
  | 'dryer'
  | 'vent'
  | 'other'

type SpaceCategory = 'living_room' | 'bedroom' | 'bathroom'

type RegistrationDetail = {
  id: string
  status: 'pending_activation' | 'active'
  name: string
  address: string
  addressDetail: string | null
  pyeong: number | null
  livingRooms: number | null
  bedrooms: number | null
  bathrooms: number | null
  entrancePassword: string | null
  doorLockPassword: string | null
  wifiSsid: string | null
  wifiPassword: string | null
  hostName: string | null
  hostEmail: string | null
  spaces: Array<{
    id: string
    category: SpaceCategory
    floor: number
    name: string
    pyeong: number
    notes: string | null
    photos: Array<{
      id: string
      storagePath: string
      thumbnailStoragePath: string
      signedUrl: string | null
      thumbnailSignedUrl: string | null
    }>
  }>
  fixtures: Array<{
    id: string
    category: FixtureCategory
    name: string
    location: string
    brand: string | null
    modelNumber: string | null
    specNotes: string | null
    notes: string | null
    photos: Array<{
      id: string
      storagePath: string
      thumbnailStoragePath: string
      signedUrl: string | null
      thumbnailSignedUrl: string | null
    }>
  }>
}

// ─── Hooks ──────────────────────────────────────────────────────────────────

export function useAdminStats() {
  return useQuery({
    queryKey: ['admin', 'stats'],
    queryFn: () => api.get<Stats>('/admin/stats'),
    staleTime: 0,
    refetchOnMount: true,
  })
}

export function useAdminCleaning(status?: string) {
  return useQuery({
    queryKey: ['admin', 'cleaning', status ?? 'all'],
    queryFn: () => api.get<CleaningRequest[]>(`/admin/cleaning${status ? `?status=${status}` : ''}`),
    staleTime: 0,
    refetchOnMount: true,
  })
}

export function useAdminManagers() {
  return useQuery({
    queryKey: ['admin', 'managers'],
    queryFn: () => api.get<Manager[]>('/admin/managers'),
    staleTime: 0,
    refetchOnMount: true,
  })
}

export function useAdminProperties() {
  return useQuery({
    queryKey: ['admin', 'properties'],
    queryFn: () => api.get<Property[]>('/admin/properties'),
    staleTime: 0,
    refetchOnMount: true,
  })
}

export function useAdminUsers() {
  return useQuery({
    queryKey: ['admin', 'users'],
    queryFn: () => api.get<User[]>('/admin/users'),
    staleTime: 0,
    refetchOnMount: true,
  })
}

export function useAdminPropertyRegistration(propertyId: string) {
  return useQuery({
    queryKey: ['admin', 'property-registration', propertyId],
    queryFn: () => api.get<RegistrationDetail>(`/admin/properties/${propertyId}/registration`),
    enabled: !!propertyId,
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
    propertyRegistration: (propertyId?: string) =>
      queryClient.invalidateQueries({
        queryKey: propertyId ? ['admin', 'property-registration', propertyId] : ['admin', 'property-registration'],
      }),
  }
}
