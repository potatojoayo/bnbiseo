import { Hono } from 'hono'
import { z } from 'zod'
import { eq, and, isNull } from 'drizzle-orm'
import { db } from '@/db'
import { profiles } from '@/db/schema'
import { authMiddleware, type AuthEnv } from '../middleware/auth'

const UpdateProfileSchema = z.object({
  fullName: z.string().min(1).optional(),
  phone: z.string().optional(),
})

export const profilesRoutes = new Hono<AuthEnv>()

profilesRoutes.use('*', authMiddleware)

// Get current user's profile
profilesRoutes.get('/me', async (c) => {
  const userId = c.get('userId')

  const [profile] = await db
    .select()
    .from(profiles)
    .where(and(eq(profiles.userId, userId), isNull(profiles.deletedAt)))
    .limit(1)

  if (!profile) {
    return c.json({ error: '프로필을 찾을 수 없습니다.' }, 404)
  }

  return c.json(profile)
})

// Update profile
profilesRoutes.patch('/me', async (c) => {
  const userId = c.get('userId')

  const [updated] = await db
    .update(profiles)
    .set({ ...UpdateProfileSchema.parse(await c.req.json()), updatedAt: new Date() })
    .where(and(eq(profiles.userId, userId), isNull(profiles.deletedAt)))
    .returning()

  if (!updated) {
    return c.json({ error: '프로필을 찾을 수 없습니다.' }, 404)
  }

  return c.json(updated)
})

// Delete account (soft delete + mask PII)
profilesRoutes.delete('/me', async (c) => {
  const userId = c.get('userId')

  const [deleted] = await db
    .update(profiles)
    .set({
      fullName: '탈퇴회원',
      email: null,
      phone: null,
      avatarUrl: null,
      deletedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(and(eq(profiles.userId, userId), isNull(profiles.deletedAt)))
    .returning()

  if (!deleted) {
    return c.json({ error: '프로필을 찾을 수 없습니다.' }, 404)
  }

  return c.json({ success: true })
})

// Complete onboarding
profilesRoutes.post('/complete-onboarding', async (c) => {
  const userId = c.get('userId')

  const [updated] = await db
    .update(profiles)
    .set({ onboardingCompleted: true, updatedAt: new Date() })
    .where(and(eq(profiles.userId, userId), isNull(profiles.deletedAt)))
    .returning()

  if (!updated) {
    return c.json({ error: '프로필을 찾을 수 없습니다.' }, 404)
  }

  return c.json(updated)
})
