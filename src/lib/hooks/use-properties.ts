import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api-client'
import { useAuth } from '@/lib/auth-provider'

export type SpaceCategory = 'living_room' | 'bedroom' | 'bathroom' | 'veranda' | 'exterior' | 'other'
export type AssetCategory =
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

export type Property = {
  id: string
  status: 'pending_activation' | 'active'
  name: string
  address: string
  addressDetail: string | null
  pyeong: number | null
  livingRooms: number | null
  bedrooms: number | null
  bathrooms: number | null
  beddings: number | null
  airbnbListingId: string | null
  linenWashLocation: 'in_house' | 'external' | null
  activatedAt?: string | null
}

export type PropertyPhoto = {
  id: string
  storagePath: string
  thumbnailStoragePath: string
  signedUrl: string | null
  thumbnailSignedUrl: string | null
}

export type PropertySpace = {
  id: string
  category: SpaceCategory
  name: string
  pyeong: number
  notes: string | null
  photos: PropertyPhoto[]
}

export type PropertyAsset = {
  id: string
  category: AssetCategory
  name: string
  location: string
  brand: string | null
  modelNumber: string | null
  specNotes: string | null
  notes: string | null
  photos: PropertyPhoto[]
}

export type CleaningPrepPhoto = {
  id: string
  storagePath: string
  thumbnailStoragePath: string
  signedUrl: string | null
  thumbnailSignedUrl: string | null
}

export type CleaningPrepPhotosByKind = {
  cleaning_closet: CleaningPrepPhoto[]
  extra_linen: CleaningPrepPhoto[]
  trash_disposal: CleaningPrepPhoto[]
  linen_wash_external: CleaningPrepPhoto[]
}

export type PropertyDetail = Property & {
  entrancePassword: string | null
  doorLockPassword: string | null
  wifiSsid: string | null
  wifiPassword: string | null
  cleaningClosetLocation: string | null
  extraLinenLocation: string | null
  trashDisposalLocation: string | null
  linenWashExternalAddress: string | null
  linenWashExternalAddressDetail: string | null
  cleaningPrepPhotos: CleaningPrepPhotosByKind
  spaces: PropertySpace[]
  assets: PropertyAsset[]
}

export function useProperties() {
  const { user } = useAuth()

  return useQuery({
    queryKey: ['properties'],
    queryFn: () => api.get<Property[]>('/properties'),
    enabled: !!user,
    staleTime: 0,
    refetchOnMount: true,
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

export function usePropertyDetail(id: string) {
  const { user } = useAuth()

  return useQuery({
    queryKey: ['properties', 'detail', id],
    queryFn: () => api.get<PropertyDetail>(`/properties/${id}`),
    enabled: !!user && !!id,
  })
}

export function useInvalidateProperties() {
  const queryClient = useQueryClient()
  return async () => {
    await queryClient.invalidateQueries({ queryKey: ['properties'] })
  }
}
