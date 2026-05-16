import { useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api-client'

// ─── Types ──────────────────────────────────────────────────────────────────

type PendingItem = {
  id: string
  scheduledDate: string
  scheduledTime: string
  cleaningType: string
  cleaningPlan: 'regular' | 'one_time'
  finalPrice: number
  propertyName: string | null
  hostName: string | null
}

type ScheduleItem = {
  id: string
  scheduledTime: string
  status: string
  cleaningType: string
  cleaningPlan: 'regular' | 'one_time'
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
  repair: { open: number; unassigned: number; inProgress: number }
}

type CleaningRequest = {
  id: string
  propertyId: string | null
  propertyName: string | null
  propertyAddress: string | null
  hostName: string | null
  hostEmail: string | null
  managerId: string | null
  managerName: string | null
  cleaningType: string
  cleaningPlan: 'regular' | 'one_time'
  status: string
  scheduledDate: string
  scheduledTime: string
  memo: string | null
  finalPrice: number
  paymentMethod: 'card' | 'bank_transfer'
  paidAt: string | null
  createdAt: string
}

type Manager = {
  id: string
  profileId: string
  email: string | null
  name: string
  phone: string
  memo: string | null
  avatarStoragePath: string | null
  avatarThumbnailStoragePath: string | null
  avatarSignedUrl: string | null
  avatarThumbnailSignedUrl: string | null
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
  hostPhone: string | null
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
  | 'bedding'
  | 'faucet'
  | 'boiler'
  | 'appliance'
  | 'lock'
  | 'ac'
  | 'washer'
  | 'dryer'
  | 'vent'
  | 'other'

type SpaceCategory = 'living_room' | 'bedroom' | 'bathroom' | 'veranda' | 'exterior' | 'other'

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
  cleaningClosetLocation: string | null
  extraLinenLocation: string | null
  trashDisposalLocation: string | null
  linenWashLocation: 'in_house' | 'external' | null
  linenWashExternalAddress: string | null
  linenWashExternalAddressDetail: string | null
  cleaningPrepPhotos: {
    cleaning_closet: Array<{
      id: string
      storagePath: string
      thumbnailStoragePath: string
      signedUrl: string | null
      thumbnailSignedUrl: string | null
    }>
    extra_linen: Array<{
      id: string
      storagePath: string
      thumbnailStoragePath: string
      signedUrl: string | null
      thumbnailSignedUrl: string | null
    }>
    trash_disposal: Array<{
      id: string
      storagePath: string
      thumbnailStoragePath: string
      signedUrl: string | null
      thumbnailSignedUrl: string | null
    }>
    linen_wash_external: Array<{
      id: string
      storagePath: string
      thumbnailStoragePath: string
      signedUrl: string | null
      thumbnailSignedUrl: string | null
    }>
  }
  hostName: string | null
  hostEmail: string | null
  hostPhone: string | null
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

export type AdminCleaningDetail = {
  id: string
  propertyId: string | null
  hostId: string | null
  managerId: string | null
  cleaningType: string
  cleaningPlan: 'regular' | 'one_time'
  status: string
  scheduledDate: string
  scheduledTime: string
  memo: string | null
  linenWash: string | null
  price: number
  discount: number
  finalPrice: number
  paymentMethod: 'card' | 'bank_transfer'
  paidAt: string | null
  createdAt: string
  propertyName: string | null
  propertyAddress: string | null
  propertyAddressDetail: string | null
  propertyPyeong: number | null
  propertyLivingRooms: number | null
  propertyBedrooms: number | null
  propertyBathrooms: number | null
  hostName: string | null
  hostEmail: string | null
  hostPhone: string | null
  managerName: string | null
  managerPhone: string | null
  managerAvatarSignedUrl: string | null
  managerAvatarThumbnailSignedUrl: string | null
  cleaningPhotos: Array<{
    id: string
    signedUrl: string | null
    thumbnailSignedUrl: string | null
  }>
}

export function useAdminCleaningDetail(id: string) {
  return useQuery({
    queryKey: ['admin', 'cleaning', 'detail', id],
    queryFn: () => api.get<AdminCleaningDetail>(`/admin/cleaning/${id}`),
    enabled: !!id,
    staleTime: 0,
    refetchOnMount: true,
  })
}

export type AdminRepairListItem = {
  id: string
  propertyId: string
  hostId: string
  managerId: string | null
  status: string
  description: string
  preferredScheduledDate: string
  preferredScheduledTime: string
  scheduledDate: string | null
  scheduledTime: string | null
  quotedCost: number | null
  quoteNote: string | null
  createdAt: string
  cancelledAt: string | null
  propertyName: string | null
  propertyAddress: string | null
  hostName: string | null
  hostEmail: string | null
  managerName: string | null
}

export type AdminRepairDetail = AdminRepairListItem & {
  hostPhone: string | null
  managerPhone: string | null
  managerAvatarSignedUrl: string | null
  managerAvatarThumbnailSignedUrl: string | null
  propertyAddressDetail: string | null
  quotedAt: string | null
  confirmedAt: string | null
  startedAt: string | null
  completedAt: string | null
  photos: Array<{
    id: string
    signedUrl: string | null
    thumbnailSignedUrl: string | null
  }>
  report: {
    id: string
    actionNotes: string
    additionalNotes: string | null
    createdAt: string
    photos: Array<{
      id: string
      signedUrl: string | null
      thumbnailSignedUrl: string | null
    }>
  } | null
}

export function useAdminRepair(status?: string) {
  return useQuery({
    queryKey: ['admin', 'repair', status ?? 'all'],
    queryFn: () => api.get<AdminRepairListItem[]>(`/admin/repair${status ? `?status=${status}` : ''}`),
    staleTime: 0,
    refetchOnMount: true,
  })
}

export function useAdminRepairDetail(id: string) {
  return useQuery({
    queryKey: ['admin', 'repair', 'detail', id],
    queryFn: () => api.get<AdminRepairDetail>(`/admin/repair/${id}`),
    enabled: !!id,
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
    staleTime: 0,
    refetchOnMount: true,
  })
}

export function useInvalidateAdmin() {
  const queryClient = useQueryClient()
  return {
    all: () => queryClient.invalidateQueries({ queryKey: ['admin'] }),
    stats: () => queryClient.invalidateQueries({ queryKey: ['admin', 'stats'] }),
    cleaning: () => queryClient.invalidateQueries({ queryKey: ['admin', 'cleaning'] }),
    repair: () => queryClient.invalidateQueries({ queryKey: ['admin', 'repair'] }),
    managers: () => queryClient.invalidateQueries({ queryKey: ['admin', 'managers'] }),
    properties: () => queryClient.invalidateQueries({ queryKey: ['admin', 'properties'] }),
    users: () => queryClient.invalidateQueries({ queryKey: ['admin', 'users'] }),
    propertyRegistration: (propertyId?: string) =>
      queryClient.invalidateQueries({
        queryKey: propertyId ? ['admin', 'property-registration', propertyId] : ['admin', 'property-registration'],
      }),
  }
}
