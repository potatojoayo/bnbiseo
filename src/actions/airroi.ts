'use server'

import { createServerClient } from '@/lib/supabase/server'
import {
  fetchAirbnbListing as scrapeAirbnbListing,
  type AirbnbListingInfo,
} from '@/lib/airbnb-scraper'

// ─── Types ────────────────────────────────────────────────────────────────────

export type FetchListingResult =
  | { success: true; listing: AirbnbListingInfo }
  | { success: false; error: string }

// ─── Actions ──────────────────────────────────────────────────────────────────

/**
 * Fetch Airbnb listing info by scraping og: meta tags.
 * Called from onboarding Step 2 (Airbnb URL input).
 */
export async function fetchAirbnbListing(listingId: string): Promise<FetchListingResult> {
  const supabase = await createServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { success: false, error: '로그인이 필요합니다.' }

  try {
    const listing = await scrapeAirbnbListing(listingId)
    return { success: true, listing }
  } catch (err) {
    console.error('[fetchAirbnbListing]', err)
    return {
      success: false,
      error: '리스팅 정보를 가져올 수 없습니다. URL을 확인해주세요.',
    }
  }
}
