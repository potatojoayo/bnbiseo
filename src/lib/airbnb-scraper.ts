/**
 * Fetch Airbnb listing info by scraping og: meta tags from the listing page.
 * Server-side only.
 */

export type AirbnbListingInfo = {
  name: string
  title: string
  imageUrl: string | null
  location: string | null
  propertyType: string | null
  bedrooms: number | null
  beds: number | null
  bathrooms: number | null
  rating: string | null
}

/**
 * Extract listing ID from various Airbnb URL formats.
 * Returns null if not a valid Airbnb listing URL.
 */
export function extractListingId(input: string): string | null {
  const urlMatch = input.match(/airbnb\.[a-z.]+\/rooms\/(\d+)/)
  if (urlMatch) return urlMatch[1]

  const numMatch = input.trim().match(/^(\d+)$/)
  if (numMatch) return numMatch[1]

  return null
}

/**
 * Parse og:title like "펜션 · 안성시 · ★5.0 · 침실 4개 · 침대 2개 · 욕실 3개"
 */
function parseOgTitle(title: string): {
  propertyType: string | null
  location: string | null
  rating: string | null
  bedrooms: number | null
  beds: number | null
  bathrooms: number | null
} {
  const parts = title.split('·').map((s) => s.trim())

  let propertyType: string | null = null
  let location: string | null = null
  let rating: string | null = null
  let bedrooms: number | null = null
  let beds: number | null = null
  let bathrooms: number | null = null

  for (const part of parts) {
    if (part.startsWith('★')) {
      rating = part.replace('★', '').trim()
    } else if (part.includes('침실')) {
      const m = part.match(/(\d+)/)
      if (m) bedrooms = Number(m[1])
    } else if (part.includes('침대')) {
      const m = part.match(/(\d+)/)
      if (m) beds = Number(m[1])
    } else if (part.includes('욕실')) {
      const m = part.match(/(\d+)/)
      if (m) bathrooms = Number(m[1])
    } else if (!propertyType) {
      propertyType = part
    } else if (!location) {
      location = part
    }
  }

  return { propertyType, location, rating, bedrooms, beds, bathrooms }
}

function extractMetaContent(html: string, property: string): string | null {
  // Match both property="og:xxx" and name="og:xxx" patterns
  const regex = new RegExp(
    `<meta[^>]*property="${property}"[^>]*content="([^"]*)"`,
    'i',
  )
  const match = html.match(regex)
  if (match) return decodeHtmlEntities(match[1])

  // Try reverse order (content before property)
  const regex2 = new RegExp(
    `<meta[^>]*content="([^"]*)"[^>]*property="${property}"`,
    'i',
  )
  const match2 = html.match(regex2)
  if (match2) return decodeHtmlEntities(match2[1])

  return null
}

function decodeHtmlEntities(str: string): string {
  return str
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
}

export async function fetchAirbnbListing(listingId: string): Promise<AirbnbListingInfo> {
  const url = `https://www.airbnb.co.kr/rooms/${listingId}`

  const res = await fetch(url, {
    headers: {
      'User-Agent':
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept-Language': 'ko-KR,ko;q=0.9',
    },
    cache: 'no-store',
  })

  if (!res.ok) {
    throw new Error(`Failed to fetch Airbnb listing: ${res.status}`)
  }

  const html = await res.text()

  const ogTitle = extractMetaContent(html, 'og:title') ?? ''
  const ogDescription = extractMetaContent(html, 'og:description') ?? ''
  const ogImage = extractMetaContent(html, 'og:image')

  const parsed = parseOgTitle(ogTitle)

  return {
    name: ogDescription || ogTitle,
    title: ogTitle,
    imageUrl: ogImage,
    location: parsed.location,
    propertyType: parsed.propertyType,
    bedrooms: parsed.bedrooms,
    beds: parsed.beds,
    bathrooms: parsed.bathrooms,
    rating: parsed.rating,
  }
}
