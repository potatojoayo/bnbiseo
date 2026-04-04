'use server'

import { createServerClient } from '@/lib/supabase/server'
import { searchListings, getListingDetails } from '@/lib/airroi'
import type { AirroiComparable, AirroiListingDetail } from '@/lib/airroi'

// ─── Types ────────────────────────────────────────────────────────────────────

export type SearchListingsResult =
  | { success: true; listings: AirroiComparable[] }
  | { success: false; error: string }

export type FetchListingResult =
  | { success: true; listing: AirroiListingDetail }
  | { success: false; error: string }

// ─── Actions ──────────────────────────────────────────────────────────────────

/**
 * Search nearby Airbnb listings by address + room specs.
 * Called from Step 1 of onboarding.
 */
export async function searchAirbnbListings(
  address: string,
  bedrooms: number,
  baths: number,
  guests: number,
): Promise<SearchListingsResult> {
  // Auth guard — only logged-in users may use this API
  const supabase = await createServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { success: false, error: '로그인이 필요합니다.' }

  try {
    const listings = await searchListings(address, bedrooms, baths, guests)
    return { success: true, listings }
  } catch (err) {
    console.error('[searchAirbnbListings]', err)
    return {
      success: false,
      error: '에어비앤비 리스팅 검색 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.',
    }
  }
}

/**
 * Fetch full listing detail by AirROI listing ID.
 * Called from Step 2 when the host selects their property.
 */
export async function fetchAirbnbListing(listingId: number): Promise<FetchListingResult> {
  const supabase = await createServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { success: false, error: '로그인이 필요합니다.' }

  try {
    const listing = await getListingDetails(listingId)
    return { success: true, listing }
  } catch (err) {
    console.error('[fetchAirbnbListing]', err)
    return {
      success: false,
      error: '리스팅 정보를 불러오는 중 오류가 발생했습니다.',
    }
  }
}
