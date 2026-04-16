import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api-client'
import { extractListingId } from '@/lib/airbnb-scraper'
import type { AirbnbListingInfo } from '@/lib/airbnb-scraper'

type UseAirbnbListingOptions = {
  enabled?: boolean
}

export function useAirbnbListing(
  input?: string | null,
  options?: UseAirbnbListingOptions,
) {
  const listingId = input ? extractListingId(input) : null

  const query = useQuery({
    queryKey: ['airbnb-listing', listingId],
    queryFn: async () => {
      const data = await api.get<AirbnbListingInfo>(`/airroi/listing/${listingId}`)
      return data.name || data.imageUrl ? data : null
    },
    enabled: (options?.enabled ?? true) && !!listingId,
    staleTime: 1000 * 60 * 30,
  })

  return {
    ...query,
    listingId,
  }
}
