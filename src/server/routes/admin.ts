import { Hono } from 'hono'
import { z } from 'zod'
import { eq, and, ne, desc, isNull, sql, count } from 'drizzle-orm'
import { db } from '@/db'
import { profiles, properties, cleaningRequests, managers } from '@/db/schema'
import { authMiddleware, type AuthEnv } from '../middleware/auth'

export const adminRoutes = new Hono<AuthEnv>()

// Admin auth: verify user + admin role
adminRoutes.use('*', authMiddleware)
adminRoutes.use('*', async (c, next) => {
  const userId = c.get('userId')
  const [profile] = await db
    .select({ role: profiles.role })
    .from(profiles)
    .where(and(eq(profiles.userId, userId), isNull(profiles.deletedAt)))
    .limit(1)

  if (!profile || profile.role !== 'admin') {
    return c.json({ error: '관리자 권한이 없습니다.' }, 403)
  }
  await next()
})

// ─── Dashboard Stats ────────────────────────────────────────────────────────

adminRoutes.get('/stats', async (c) => {
  const today = new Date().toLocaleDateString('ko-KR', { timeZone: 'Asia/Seoul' })
    .replace(/\. /g, '-').replace('.', '').replace(/(\d+)-(\d+)-(\d+)/, (_, y, m, d) =>
      `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`)

  // Today's cleaning by status
  const todayCleanings = await db
    .select({
      status: cleaningRequests.status,
      count: count(),
    })
    .from(cleaningRequests)
    .where(eq(cleaningRequests.scheduledDate, today))
    .groupBy(cleaningRequests.status)

  const todayCleaning = { pending: 0, confirmed: 0, inProgress: 0, completed: 0 }
  for (const row of todayCleanings) {
    if (row.status === 'pending') todayCleaning.pending = row.count
    if (row.status === 'confirmed') todayCleaning.confirmed = row.count
    if (row.status === 'in_progress') todayCleaning.inProgress = row.count
    if (row.status === 'completed') todayCleaning.completed = row.count
  }

  // Today's revenue
  const [todayRevenueRow] = await db
    .select({ total: sql<number>`coalesce(sum(${cleaningRequests.finalPrice}), 0)` })
    .from(cleaningRequests)
    .where(and(
      eq(cleaningRequests.scheduledDate, today),
      ne(cleaningRequests.status, 'pending_payment'),
      ne(cleaningRequests.status, 'cancelled'),
    ))

  // This month's revenue
  const monthStart = today.slice(0, 7) + '-01'
  const [monthRevenueRow] = await db
    .select({ total: sql<number>`coalesce(sum(${cleaningRequests.finalPrice}), 0)` })
    .from(cleaningRequests)
    .where(and(
      sql`${cleaningRequests.scheduledDate} >= ${monthStart}`,
      ne(cleaningRequests.status, 'pending_payment'),
      ne(cleaningRequests.status, 'cancelled'),
    ))

  // Pending assignment (up to 5)
  const pendingAssignment = await db
    .select({
      id: cleaningRequests.id,
      scheduledDate: cleaningRequests.scheduledDate,
      scheduledTime: cleaningRequests.scheduledTime,
      cleaningType: cleaningRequests.cleaningType,
      finalPrice: cleaningRequests.finalPrice,
      propertyName: properties.name,
      hostName: profiles.fullName,
    })
    .from(cleaningRequests)
    .leftJoin(properties, eq(cleaningRequests.propertyId, properties.id))
    .leftJoin(profiles, eq(cleaningRequests.hostId, profiles.id))
    .where(eq(cleaningRequests.status, 'pending'))
    .orderBy(cleaningRequests.scheduledDate, cleaningRequests.scheduledTime)
    .limit(5)

  // Today's schedule
  const todaySchedule = await db
    .select({
      id: cleaningRequests.id,
      scheduledTime: cleaningRequests.scheduledTime,
      status: cleaningRequests.status,
      cleaningType: cleaningRequests.cleaningType,
      propertyName: properties.name,
      managerName: managers.name,
    })
    .from(cleaningRequests)
    .leftJoin(properties, eq(cleaningRequests.propertyId, properties.id))
    .leftJoin(managers, eq(cleaningRequests.managerId, managers.id))
    .where(and(
      eq(cleaningRequests.scheduledDate, today),
      ne(cleaningRequests.status, 'pending_payment'),
      ne(cleaningRequests.status, 'cancelled'),
    ))
    .orderBy(cleaningRequests.scheduledTime)

  const [propCount] = await db.select({ count: count() }).from(properties).where(isNull(properties.deletedAt))
  const [userCount] = await db.select({ count: count() }).from(profiles).where(and(isNull(profiles.deletedAt), eq(profiles.role, 'user')))
  const [managerCount] = await db.select({ count: count() }).from(managers).where(eq(managers.isActive, true))

  return c.json({
    todayCleaning,
    todayRevenue: todayRevenueRow.total,
    monthRevenue: monthRevenueRow.total,
    pendingAssignment,
    todaySchedule,
    totalProperties: propCount.count,
    totalUsers: userCount.count,
    totalManagers: managerCount.count,
  })
})

// ─── Cleaning Management ────────────────────────────────────────────────────

// List all cleaning requests
adminRoutes.get('/cleaning', async (c) => {
  const status = c.req.query('status')

  const result = await db
    .select({
      id: cleaningRequests.id,
      propertyId: cleaningRequests.propertyId,
      hostId: cleaningRequests.hostId,
      managerId: cleaningRequests.managerId,
      cleaningType: cleaningRequests.cleaningType,
      status: cleaningRequests.status,
      scheduledDate: cleaningRequests.scheduledDate,
      scheduledTime: cleaningRequests.scheduledTime,
      memo: cleaningRequests.memo,
      price: cleaningRequests.price,
      discount: cleaningRequests.discount,
      finalPrice: cleaningRequests.finalPrice,
      createdAt: cleaningRequests.createdAt,
      propertyName: properties.name,
      propertyAddress: properties.address,
      hostName: profiles.fullName,
      hostEmail: profiles.email,
      managerName: managers.name,
    })
    .from(cleaningRequests)
    .leftJoin(properties, eq(cleaningRequests.propertyId, properties.id))
    .leftJoin(profiles, eq(cleaningRequests.hostId, profiles.id))
    .leftJoin(managers, eq(cleaningRequests.managerId, managers.id))
    .where(and(
      ne(cleaningRequests.status, 'pending_payment'),
      status ? eq(cleaningRequests.status, status as any) : undefined,
    ))
    .orderBy(desc(cleaningRequests.createdAt))

  return c.json(result)
})

// Assign manager to cleaning request
const AssignManagerSchema = z.object({
  managerId: z.string().uuid(),
})

adminRoutes.post('/cleaning/:id/assign', async (c) => {
  const id = c.req.param('id')
  const body = await c.req.json()
  const validated = AssignManagerSchema.safeParse(body)

  if (!validated.success) {
    return c.json({ errors: validated.error.flatten().fieldErrors }, 400)
  }

  const [updated] = await db
    .update(cleaningRequests)
    .set({
      managerId: validated.data.managerId,
      status: 'confirmed',
      updatedAt: new Date(),
    })
    .where(eq(cleaningRequests.id, id))
    .returning()

  if (!updated) {
    return c.json({ error: '청소 요청을 찾을 수 없어요' }, 404)
  }

  return c.json(updated)
})

// Update cleaning status
const UpdateStatusSchema = z.object({
  status: z.enum(['pending', 'confirmed', 'in_progress', 'completed', 'cancelled']),
})

adminRoutes.post('/cleaning/:id/status', async (c) => {
  const id = c.req.param('id')
  const body = await c.req.json()
  const validated = UpdateStatusSchema.safeParse(body)

  if (!validated.success) {
    return c.json({ errors: validated.error.flatten().fieldErrors }, 400)
  }

  const [updated] = await db
    .update(cleaningRequests)
    .set({
      status: validated.data.status,
      updatedAt: new Date(),
    })
    .where(eq(cleaningRequests.id, id))
    .returning()

  if (!updated) {
    return c.json({ error: '청소 요청을 찾을 수 없어요' }, 404)
  }

  return c.json(updated)
})

// ─── Manager Management ─────────────────────────────────────────────────────

const ManagerSchema = z.object({
  name: z.string().min(1),
  phone: z.string().min(1),
  memo: z.string().optional(),
})

// List managers
adminRoutes.get('/managers', async (c) => {
  const result = await db
    .select()
    .from(managers)
    .orderBy(desc(managers.createdAt))

  return c.json(result)
})

// Create manager
adminRoutes.post('/managers', async (c) => {
  const body = await c.req.json()
  const validated = ManagerSchema.safeParse(body)

  if (!validated.success) {
    return c.json({ errors: validated.error.flatten().fieldErrors }, 400)
  }

  const [created] = await db
    .insert(managers)
    .values(validated.data)
    .returning()

  return c.json(created, 201)
})

// Update manager
adminRoutes.patch('/managers/:id', async (c) => {
  const id = c.req.param('id')
  const body = await c.req.json()
  const validated = ManagerSchema.partial().safeParse(body)

  if (!validated.success) {
    return c.json({ errors: validated.error.flatten().fieldErrors }, 400)
  }

  const [updated] = await db
    .update(managers)
    .set({ ...validated.data, updatedAt: new Date() })
    .where(eq(managers.id, id))
    .returning()

  if (!updated) {
    return c.json({ error: '매니저를 찾을 수 없어요' }, 404)
  }

  return c.json(updated)
})

// Toggle manager active
adminRoutes.post('/managers/:id/toggle', async (c) => {
  const id = c.req.param('id')

  const [manager] = await db.select().from(managers).where(eq(managers.id, id)).limit(1)
  if (!manager) return c.json({ error: '매니저를 찾을 수 없어요' }, 404)

  const [updated] = await db
    .update(managers)
    .set({ isActive: !manager.isActive, updatedAt: new Date() })
    .where(eq(managers.id, id))
    .returning()

  return c.json(updated)
})

// Delete manager
adminRoutes.delete('/managers/:id', async (c) => {
  const id = c.req.param('id')

  const [deleted] = await db
    .delete(managers)
    .where(eq(managers.id, id))
    .returning()

  if (!deleted) {
    return c.json({ error: '매니저를 찾을 수 없어요' }, 404)
  }

  return c.json({ success: true })
})

// ─── Users ──────────────────────────────────────────────────────────────────

adminRoutes.get('/users', async (c) => {
  const result = await db
    .select({
      id: profiles.id,
      email: profiles.email,
      fullName: profiles.fullName,
      phone: profiles.phone,
      role: profiles.role,
      onboardingCompleted: profiles.onboardingCompleted,
      createdAt: profiles.createdAt,
    })
    .from(profiles)
    .where(isNull(profiles.deletedAt))
    .orderBy(desc(profiles.createdAt))

  return c.json(result)
})

// ─── Properties ─────────────────────────────────────────────────────────────

adminRoutes.get('/properties', async (c) => {
  const result = await db
    .select({
      id: properties.id,
      name: properties.name,
      address: properties.address,
      pyeong: properties.pyeong,
      bedrooms: properties.bedrooms,
      bathrooms: properties.bathrooms,
      hostName: profiles.fullName,
      hostEmail: profiles.email,
      createdAt: properties.createdAt,
    })
    .from(properties)
    .leftJoin(profiles, eq(properties.hostId, profiles.id))
    .where(isNull(properties.deletedAt))
    .orderBy(desc(properties.createdAt))

  return c.json(result)
})
