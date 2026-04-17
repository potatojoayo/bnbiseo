import { useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api-client'
import { useAuth } from '@/lib/auth-provider'

type ManagerMe = {
  profile: {
    id: string
    email: string | null
    fullName: string | null
    phone: string | null
    avatarStoragePath: string | null
    avatarThumbnailStoragePath: string | null
    avatarSignedUrl: string | null
    avatarThumbnailSignedUrl: string | null
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
  propertySpaceNames: string[]
  propertyPyeong: number | null
  propertyLivingRooms: number | null
  propertyBedrooms: number | null
  propertyBathrooms: number | null
}

type SpaceCategory = 'living_room' | 'bedroom' | 'bathroom'
type AssetCategory =
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
type InspectionStatus = 'normal' | 'caution' | 'defective'

export type ManagerCleaningDetail = ManagerCleaning & {
  entrancePassword: string | null
  doorLockPassword: string | null
  wifiSsid: string | null
  wifiPassword: string | null
  cleaningPhotos: Array<{
    id: string
    storagePath: string
    thumbnailStoragePath: string
    signedUrl: string | null
    thumbnailSignedUrl: string | null
  }>
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
  assets: Array<{
    id: string
    category: AssetCategory
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

export type ManagerCleaningReport = ManagerCleaningDetail & {
  report: {
    summaryMemo: string
    assets: Array<{
      assetId: string
      status: InspectionStatus | null
      memo: string | null
      photos: Array<{
        id: string
        storagePath: string
        thumbnailStoragePath: string
        signedUrl: string | null
        thumbnailSignedUrl: string | null
      }>
    }>
  }
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
    queryKey: ['manager', 'cleanings', 'open', 'v2'],
    queryFn: () => api.get<ManagerCleaning[]>('/manager/cleanings/open'),
    enabled: !!user,
    staleTime: 0,
    refetchOnMount: true,
  })
}

export function useManagerMyCleanings() {
  const { user } = useAuth()

  return useQuery({
    queryKey: ['manager', 'cleanings', 'me', 'v2'],
    queryFn: () => api.get<ManagerCleaning[]>('/manager/cleanings/me'),
    enabled: !!user,
    staleTime: 0,
    refetchOnMount: true,
  })
}

export function useManagerCleaning(id: string) {
  const { user } = useAuth()

  return useQuery({
    queryKey: ['manager', 'cleanings', 'detail', id],
    queryFn: () => api.get<ManagerCleaningDetail>(`/manager/cleanings/${id}`),
    enabled: !!user && !!id,
  })
}

export function useManagerCleaningReport(id: string) {
  const { user } = useAuth()

  return useQuery({
    queryKey: ['manager', 'cleanings', 'report', id],
    queryFn: () => api.get<ManagerCleaningReport>(`/manager/cleanings/${id}/report`),
    enabled: !!user && !!id,
  })
}

export function useInvalidateManager() {
  const queryClient = useQueryClient()

  return {
    all: () => queryClient.invalidateQueries({ queryKey: ['manager'] }),
    me: () => queryClient.invalidateQueries({ queryKey: ['manager', 'me'] }),
    openCleanings: () => queryClient.invalidateQueries({ queryKey: ['manager', 'cleanings', 'open', 'v2'] }),
    myCleanings: () => queryClient.invalidateQueries({ queryKey: ['manager', 'cleanings', 'me', 'v2'] }),
    cleaningDetail: (id: string) => queryClient.invalidateQueries({ queryKey: ['manager', 'cleanings', 'detail', id] }),
    cleaningReport: (id: string) => queryClient.invalidateQueries({ queryKey: ['manager', 'cleanings', 'report', id] }),
  }
}
