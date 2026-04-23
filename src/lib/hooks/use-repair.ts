import { useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api-client'
import { useAuth } from '@/lib/auth-provider'

export type RepairStatus =
  | 'submitted'
  | 'quoted'
  | 'confirmed'
  | 'in_progress'
  | 'completed'
  | 'cancelled'

export type AssetCategory =
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

export type RepairRequest = {
  id: string
  propertyId: string
  hostId: string
  status: RepairStatus
  description: string
  preferredScheduledDate: string
  preferredScheduledTime: string
  scheduledDate: string | null
  scheduledTime: string | null
  quotedCost: number | null
  quoteNote: string | null
  orderId: string | null
  paymentKey: string | null
  createdAt: string
  cancelledAt: string | null
  propertyName: string | null
  propertyAddress: string | null
}

export type RepairRequestDetail = RepairRequest & {
  quotedAt: string | null
  confirmedAt: string | null
  startedAt: string | null
  completedAt: string | null
  propertyAddressDetail: string | null
  managerName: string | null
  managerPhone: string | null
  managerAvatarSignedUrl: string | null
  managerAvatarThumbnailSignedUrl: string | null
  photos: Array<{
    id: string
    storagePath: string
    thumbnailStoragePath: string
    signedUrl: string | null
    thumbnailSignedUrl: string | null
  }>
  assets: Array<{
    id: string
    category: AssetCategory
    name: string
    location: string
    signedUrl: string | null
    thumbnailSignedUrl: string | null
  }>
}

export type RepairCompletionReport = {
  id: string
  propertyName: string | null
  status: RepairStatus
  report: {
    id: string
    actionNotes: string
    createdAt: string
    photos: Array<{
      id: string
      storagePath: string
      thumbnailStoragePath: string
      signedUrl: string | null
      thumbnailSignedUrl: string | null
    }>
  }
}

export function useRepairRequests() {
  const { user } = useAuth()

  return useQuery({
    queryKey: ['repair-requests'],
    queryFn: () => api.get<RepairRequest[]>('/repair'),
    enabled: !!user,
    staleTime: 0,
    refetchOnMount: true,
  })
}

export function useRepairRequest(id: string) {
  const { user } = useAuth()

  return useQuery({
    queryKey: ['repair-requests', id],
    queryFn: () => api.get<RepairRequestDetail>(`/repair/${id}`),
    enabled: !!user && !!id,
    staleTime: 0,
    refetchOnMount: 'always',
  })
}

export function useRepairReport(id: string) {
  const { user } = useAuth()

  return useQuery({
    queryKey: ['repair-requests', 'report', id],
    queryFn: () => api.get<RepairCompletionReport>(`/repair/${id}/report`),
    enabled: !!user && !!id,
    staleTime: 0,
    refetchOnMount: 'always',
  })
}

export function useInvalidateRepair() {
  const queryClient = useQueryClient()
  return () => queryClient.invalidateQueries({ queryKey: ['repair-requests'] })
}
