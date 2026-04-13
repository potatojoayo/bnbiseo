import { Hono } from 'hono'
import { eq } from 'drizzle-orm'
import { db } from '@/db'
import { profiles } from '@/db/schema'
import { authMiddleware, type AuthEnv } from '../middleware/auth'

export const profilesRoutes = new Hono<AuthEnv>()

profilesRoutes.use('*', authMiddleware)

// Get current user's profile
profilesRoutes.get('/me', async (c) => {
  const userId = c.get('userId')

  const [profile] = await db
    .select()
    .from(profiles)
    .where(eq(profiles.id, userId))
    .limit(1)

  if (!profile) {
    return c.json({ error: '프로필을 찾을 수 없습니다.' }, 404)
  }

  return c.json(profile)
})

// Complete onboarding
profilesRoutes.post('/complete-onboarding', async (c) => {
  const userId = c.get('userId')

  const [updated] = await db
    .update(profiles)
    .set({ onboardingCompleted: true, updatedAt: new Date() })
    .where(eq(profiles.id, userId))
    .returning()

  if (!updated) {
    return c.json({ error: '프로필을 찾을 수 없습니다.' }, 404)
  }

  return c.json(updated)
})
