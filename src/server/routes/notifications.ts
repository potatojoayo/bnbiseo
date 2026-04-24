import { Hono } from 'hono'
import { z } from 'zod'
import { authMiddleware, requireProfile, type AuthEnv } from '../middleware/auth'
import {
  listNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  markNotificationsRead,
} from '../lib/notifications'

export const notificationRoutes = new Hono<AuthEnv>()

const BulkReadSchema = z.object({
  ids: z.array(z.string().uuid()).default([]),
})

notificationRoutes.use('*', authMiddleware)
notificationRoutes.use('*', requireProfile)

notificationRoutes.get('/', async (c) => {
  const profileId = c.get('profileId')
  const result = await listNotifications(profileId)
  return c.json(result)
})

notificationRoutes.post('/:id/read', async (c) => {
  const profileId = c.get('profileId')
  const id = c.req.param('id')
  const updated = await markNotificationRead(profileId, id)

  if (!updated) {
    return c.json({ error: '알림을 찾을 수 없어요.' }, 404)
  }

  return c.json({ success: true, id: updated.id })
})

notificationRoutes.post('/read', async (c) => {
  const profileId = c.get('profileId')
  const body = await c.req.json().catch(() => null)
  const parsed = BulkReadSchema.safeParse(body)

  if (!parsed.success) {
    return c.json({ errors: parsed.error.flatten().fieldErrors }, 400)
  }

  const updated = await markNotificationsRead(profileId, parsed.data.ids)
  return c.json({ success: true, count: updated.length })
})

notificationRoutes.post('/read-all', async (c) => {
  const profileId = c.get('profileId')
  const updated = await markAllNotificationsRead(profileId)
  return c.json({ success: true, count: updated.length })
})
