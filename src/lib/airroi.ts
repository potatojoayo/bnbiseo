/**
 * AirROI API client utilities
 * Used server-side only (API key must not be exposed to client)
 */

const AIRROI_BASE_URL = 'https://api.airroi.com'

function getApiKey(): string {
  const key = process.env.AIRROI_API_KEY
  if (!key) throw new Error('AIRROI_API_KEY is not configured')
  return key
}

// ─── Types ────────────────────────────────────────────────────────────────────

export type AirroiComparable = {
  id: number
  listing_name: string
  cover_photo_url: string | null
  address: string | null
  bedrooms: number | null
  baths: number | null
  guests: number | null
}

export type AirroiListingDetail = {
  id: number
  listing_info: {
    listing_name: string
    description: string | null
    cover_photo_url: string | null
    photo_urls: string[]
  }
  property_details: {
    amenities: string[]
    bedrooms: number | null
    baths: number | null
    guests: number | null
    address: string | null
  }
}

// ─── API helpers ──────────────────────────────────────────────────────────────

/**
 * Search for nearby Airbnb listings via AirROI comparables endpoint.
 */
export async function searchListings(
  address: string,
  bedrooms: number,
  baths: number,
  guests: number,
): Promise<AirroiComparable[]> {
  const params = new URLSearchParams({
    address,
    bedrooms: String(bedrooms),
    baths: String(baths),
    guests: String(guests),
  })

  const res = await fetch(`${AIRROI_BASE_URL}/listings/comparables?${params}`, {
    headers: {
      'X-API-KEY': getApiKey(),
    },
    // No caching — real-time search results
    cache: 'no-store',
  })

  if (!res.ok) {
    throw new Error(`AirROI comparables error: ${res.status} ${res.statusText}`)
  }

  const data = await res.json()
  // API returns array or { data: [...] } depending on version
  const listings = Array.isArray(data) ? data : (data.data ?? data.listings ?? [])
  return listings as AirroiComparable[]
}

/**
 * Fetch full listing details by listing ID.
 */
export async function getListingDetails(listingId: number): Promise<AirroiListingDetail> {
  const params = new URLSearchParams({ id: String(listingId) })

  const res = await fetch(`${AIRROI_BASE_URL}/listings?${params}`, {
    headers: {
      'X-API-KEY': getApiKey(),
    },
    cache: 'no-store',
  })

  if (!res.ok) {
    throw new Error(`AirROI listing detail error: ${res.status} ${res.statusText}`)
  }

  const data = await res.json()
  // API may wrap in { data: {...} }
  return (data.data ?? data) as AirroiListingDetail
}
