import { useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api-client'
import { useAuth } from '@/lib/auth-provider'

export type AppNotification = {
  id: string
  type:
    | 'property_submitted'
    | 'property_activated'
    | 'cleaning_requested'
    | 'cleaning_urgent_requested'
    | 'cleaning_assigned'
    | 'cleaning_started'
    | 'cleaning_completed'
    | 'cleaning_cancelled_by_host'
    | 'cleaning_cancelled_by_admin'
  title: string
  body: string
  targetPath: string
  entityType: string | null
  entityId: string | null
  payload: Record<string, unknown> | null
  isRead: boolean
  readAt: string | null
  createdAt: string
}

type NotificationListResponse = {
  items: AppNotification[]
  unreadCount: number
}

export function useNotifications() {
  const { user } = useAuth()

  return useQuery({
    queryKey: ['notifications'],
    queryFn: () => api.get<NotificationListResponse>('/notifications'),
    enabled: !!user,
    staleTime: 0,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
    refetchInterval: 30_000,
    refetchIntervalInBackground: false,
  })
}

export function useInvalidateNotifications() {
  const queryClient = useQueryClient()
  return () => queryClient.invalidateQueries({ queryKey: ['notifications'] })
}
