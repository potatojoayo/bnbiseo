import { Hono } from 'hono'
import { fetchAirbnbListing } from '@/lib/airbnb-scraper'
import { authMiddleware, type AuthEnv } from '../middleware/auth'

export const airroiRoutes = new Hono<AuthEnv>()

airroiRoutes.use('*', authMiddleware)

airroiRoutes.get('/listing/:listingId', async (c) => {
  const listingId = c.req.param('listingId')

  try {
    const listing = await fetchAirbnbListing(listingId)
    return c.json(listing)
  } catch (err) {
    console.error('[fetchAirbnbListing]', err)
    return c.json(
      { error: '리스팅 정보를 가져올 수 없습니다. URL을 확인해주세요.' },
      502,
    )
  }
})
