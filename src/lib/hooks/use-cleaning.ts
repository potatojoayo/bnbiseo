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
  linenWash: boolean
  price: number
  discount: number
  finalPrice: number
  orderId: string | null
  paymentKey: string | null
  paymentMethod: 'card' | 'bank_transfer'
  paidAt: string | null
  createdAt: string
  propertyName: string | null
  propertyAddress: string | null
}

type CleaningRequestDetail = CleaningRequest & {
  cancelledAt: string | null
  propertyAddressDetail: string | null
  propertyPyeong: number | null
  propertyBedrooms: number | null
  propertyBathrooms: number | null
  managerName: string | null
  managerPhone: string | null
  managerAvatarSignedUrl: string | null
  managerAvatarThumbnailSignedUrl: string | null
  cleaningPhotos: Array<{
    id: string
    storagePath: string
    thumbnailStoragePath: string
    signedUrl: string | null
    thumbnailSignedUrl: string | null
  }>
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

export type CleaningRequestReport = {
  id: string
  propertyName: string | null
  status: CleaningRequest['status']
  spaces: Array<{
    id: string
    category: SpaceCategory
    floor: number
    name: string
    pyeong: number
  }>
  assets: Array<{
    id: string
    category: AssetCategory
    name: string
    location: string
  }>
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

export function useCleaningRequests() {
  const { user } = useAuth()

  return useQuery({
    queryKey: ['cleaning-requests'],
    queryFn: () => api.get<CleaningRequest[]>('/cleaning'),
    enabled: !!user,
    staleTime: 0,
    refetchOnMount: true,
  })
}

export function useCleaningRequest(id: string) {
  const { user } = useAuth()

  return useQuery({
    queryKey: ['cleaning-requests', id],
    queryFn: () => api.get<CleaningRequestDetail>(`/cleaning/${id}`),
    enabled: !!user && !!id,
    staleTime: 0,
    refetchOnMount: true,
  })
}

export function useCleaningReport(id: string) {
  const { user } = useAuth()

  return useQuery({
    queryKey: ['cleaning-requests', 'report', id],
    queryFn: () => api.get<CleaningRequestReport>(`/cleaning/${id}/report`),
    enabled: !!user && !!id,
    staleTime: 0,
    refetchOnMount: true,
  })
}

export function useInvalidateCleaning() {
  const queryClient = useQueryClient()
  return () => queryClient.invalidateQueries({ queryKey: ['cleaning-requests'] })
}
