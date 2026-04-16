import { Context, Hono } from 'hono'
import { z } from 'zod'
import { createClient } from '@supabase/supabase-js'
import { eq, and, ne, desc, isNull, sql, count, inArray } from 'drizzle-orm'
import { db } from '@/db'
import {
  profiles,
  properties,
  cleaningRequests,
  managers,
  fixtures,
  fixturePhotos,
  propertySpaces,
  propertySpacePhotos,
} from '@/db/schema'
import { authMiddleware, type AuthEnv } from '../middleware/auth'

export const adminRoutes = new Hono<AuthEnv>()

function warnJson<T extends Record<string, unknown>>(c: Context<AuthEnv>, payload: T, status: 400 | 403 | 404 | 500) {
  if (process.env.NODE_ENV !== 'production' && status >= 400) {
    console.warn('[admin api]', {
      method: c.req.method,
      path: c.req.path,
      status,
      payload,
    })
  }

  return c.json(payload, status)
}

function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SECRET_KEY!,
  )
}

const AdminCleaningStatusSchema = z.enum([
  'pending',
  'confirmed',
  'in_progress',
  'completed',
  'cancelled',
])

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
    return warnJson(c, { error: '관리자 권한이 없습니다.' }, 403)
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
  const statusQuery = c.req.query('status')
  const status = statusQuery ? AdminCleaningStatusSchema.safeParse(statusQuery) : null

  if (statusQuery && !status?.success) {
    return warnJson(c, { error: '유효하지 않은 상태값입니다.' }, 400)
  }

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
      status?.success ? eq(cleaningRequests.status, status.data) : undefined,
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
    return warnJson(c, { errors: validated.error.flatten().fieldErrors }, 400)
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
    return warnJson(c, { error: '청소 요청을 찾을 수 없어요' }, 404)
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
    return warnJson(c, { errors: validated.error.flatten().fieldErrors }, 400)
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
    return warnJson(c, { error: '청소 요청을 찾을 수 없어요' }, 404)
  }

  return c.json(updated)
})

// ─── Manager Management ─────────────────────────────────────────────────────

const CreateManagerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().min(1),
  phone: z.string().min(1),
  memo: z.string().optional(),
})

const UpdateManagerSchema = z.object({
  name: z.string().min(1).optional(),
  phone: z.string().min(1).optional(),
  memo: z.string().optional(),
})

const FixtureRegistrationSchema = z.object({
  id: z.string().uuid().optional(),
  category: z.enum([
    'lighting',
    'furniture',
    'faucet',
    'boiler',
    'appliance',
    'lock',
    'ac',
    'washer',
    'dryer',
    'vent',
    'other',
  ]),
  name: z.string().min(1),
  location: z.string().min(1),
  brand: z.string().optional(),
  modelNumber: z.string().optional(),
  specNotes: z.string().optional(),
  notes: z.string().optional(),
  photoPaths: z.array(z.string()).min(1, '사진을 최소 1장 추가해주세요.'),
})

const PropertyRegistrationSchema = z.object({
  entrancePassword: z.string().optional(),
  doorLockPassword: z.string().min(1),
  wifiSsid: z.string().optional(),
  wifiPassword: z.string().optional(),
  fixtures: z.array(FixtureRegistrationSchema),
})

const PropertyRegistrationDraftSchema = z.object({
  entrancePassword: z.string().optional(),
  doorLockPassword: z.string().optional(),
  wifiSsid: z.string().optional(),
  wifiPassword: z.string().optional(),
})

const CreateFixtureSchema = z.object({
  category: z.enum([
    'lighting',
    'furniture',
    'faucet',
    'boiler',
    'appliance',
    'lock',
    'ac',
    'washer',
    'dryer',
    'vent',
    'other',
  ]),
  name: z.string().min(1),
  location: z.string().min(1),
  brand: z.string().optional(),
  modelNumber: z.string().optional(),
  specNotes: z.string().optional(),
  notes: z.string().optional(),
  photoPaths: z.array(z.string()).min(1, '사진을 최소 1장 추가해주세요.'),
})

const SignedUploadSchema = z.object({
  propertyId: z.string().uuid(),
  fileName: z.string().min(1),
  kind: z.enum(['fixtures', 'spaces']).optional(),
})

const PropertySpaceSchema = z.object({
  category: z.enum(['living_room', 'bedroom', 'bathroom']),
  floor: z.union([z.literal(1), z.literal(2), z.literal(3)]).default(1),
  name: z.string().min(1),
  pyeong: z.coerce.number().int().positive(),
  notes: z.string().optional(),
  photoPaths: z.array(z.string()).min(1, '사진을 최소 1장 추가해주세요.'),
})

async function createSignedUrlMap(paths: string[]) {
  const signedUrlMap = new Map<string, string | null>()
  if (paths.length === 0) return signedUrlMap

  const supabaseAdmin = getSupabaseAdmin()
  const { data } = await supabaseAdmin.storage
    .from('images')
    .createSignedUrls(paths, 60 * 60)

  data?.forEach((item, index) => {
    signedUrlMap.set(paths[index], item.signedUrl ?? null)
  })

  return signedUrlMap
}

// List managers
adminRoutes.get('/managers', async (c) => {
  const result = await db
    .select({
      id: managers.id,
      profileId: managers.profileId,
      name: managers.name,
      phone: managers.phone,
      memo: managers.memo,
      isActive: managers.isActive,
      createdAt: managers.createdAt,
      email: profiles.email,
    })
    .from(managers)
    .leftJoin(profiles, eq(managers.profileId, profiles.id))
    .orderBy(desc(managers.createdAt))

  return c.json(result)
})

// Create manager
adminRoutes.post('/managers', async (c) => {
  const body = await c.req.json()
  const validated = CreateManagerSchema.safeParse(body)

  if (!validated.success) {
    return warnJson(c, { errors: validated.error.flatten().fieldErrors }, 400)
  }

  const [existingProfile] = await db
    .select({ id: profiles.id })
    .from(profiles)
    .where(and(eq(profiles.email, validated.data.email), isNull(profiles.deletedAt)))
    .limit(1)

  if (existingProfile) {
    return warnJson(c, { error: '이미 사용 중인 이메일이에요.' }, 400)
  }

  const supabaseAdmin = getSupabaseAdmin()
  const { data: authUserData, error: authError } = await supabaseAdmin.auth.admin.createUser({
    email: validated.data.email,
    password: validated.data.password,
    email_confirm: true,
    user_metadata: {
      full_name: validated.data.name,
    },
  })

  if (authError || !authUserData.user) {
    return warnJson(c, { error: authError?.message || '매니저 계정을 만들 수 없어요.' }, 400)
  }

  try {
    const created = await db.transaction(async (tx) => {
      const [profile] = await tx
        .insert(profiles)
        .values({
          userId: authUserData.user.id,
          email: validated.data.email,
          fullName: validated.data.name,
          phone: validated.data.phone,
          role: 'manager',
          onboardingCompleted: true,
        })
        .returning()

      const [manager] = await tx
        .insert(managers)
        .values({
          profileId: profile.id,
          name: validated.data.name,
          phone: validated.data.phone,
          memo: validated.data.memo,
        })
        .returning()

      return {
        ...manager,
        email: profile.email,
      }
    })

    return c.json(created, 201)
  } catch {
    await supabaseAdmin.auth.admin.deleteUser(authUserData.user.id)
    return warnJson(c, { error: '매니저 정보를 저장하지 못했어요.' }, 500)
  }
})

// Update manager
adminRoutes.patch('/managers/:id', async (c) => {
  const id = c.req.param('id')
  const body = await c.req.json()
  const validated = UpdateManagerSchema.safeParse(body)

  if (!validated.success) {
    return warnJson(c, { errors: validated.error.flatten().fieldErrors }, 400)
  }

  const [current] = await db
    .select({
      id: managers.id,
      profileId: managers.profileId,
    })
    .from(managers)
    .where(eq(managers.id, id))
    .limit(1)

  if (!current) {
    return warnJson(c, { error: '매니저를 찾을 수 없어요' }, 404)
  }

  const updated = await db.transaction(async (tx) => {
    const [manager] = await tx
      .update(managers)
      .set({ ...validated.data, updatedAt: new Date() })
      .where(eq(managers.id, id))
      .returning()

    if (validated.data.name || validated.data.phone) {
      await tx
        .update(profiles)
        .set({
          ...(validated.data.name !== undefined ? { fullName: validated.data.name } : {}),
          ...(validated.data.phone !== undefined ? { phone: validated.data.phone } : {}),
          updatedAt: new Date(),
        })
        .where(eq(profiles.id, current.profileId))
    }

    return manager
  })

  if (!updated) {
    return warnJson(c, { error: '매니저를 찾을 수 없어요' }, 404)
  }

  return c.json(updated)
})

// Toggle manager active
adminRoutes.post('/managers/:id/toggle', async (c) => {
  const id = c.req.param('id')

  const [manager] = await db.select().from(managers).where(eq(managers.id, id)).limit(1)
  if (!manager) return warnJson(c, { error: '매니저를 찾을 수 없어요' }, 404)

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
    return warnJson(c, { error: '매니저를 찾을 수 없어요' }, 404)
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
      status: properties.status,
      name: properties.name,
      address: properties.address,
      pyeong: properties.pyeong,
      bedrooms: properties.bedrooms,
      bathrooms: properties.bathrooms,
      hostName: profiles.fullName,
      hostEmail: profiles.email,
      createdAt: properties.createdAt,
      activatedAt: properties.activatedAt,
    })
    .from(properties)
    .leftJoin(profiles, eq(properties.hostId, profiles.id))
    .where(isNull(properties.deletedAt))
    .orderBy(desc(properties.createdAt))

  return c.json(result)
})

adminRoutes.get('/properties/:id/registration', async (c) => {
  const id = c.req.param('id')

  const [property] = await db
    .select({
      id: properties.id,
      status: properties.status,
      name: properties.name,
      address: properties.address,
      addressDetail: properties.addressDetail,
      entrancePassword: properties.entrancePassword,
      doorLockPassword: properties.doorLockPassword,
      wifiSsid: properties.wifiSsid,
      wifiPassword: properties.wifiPassword,
      hostName: profiles.fullName,
      hostEmail: profiles.email,
    })
    .from(properties)
    .leftJoin(profiles, eq(properties.hostId, profiles.id))
    .where(and(eq(properties.id, id), isNull(properties.deletedAt)))
    .limit(1)

  if (!property) {
    return warnJson(c, { error: '숙소를 찾을 수 없어요' }, 404)
  }

  const propertyFixtures = await db
    .select({
      id: fixtures.id,
      category: fixtures.category,
      name: fixtures.name,
      location: fixtures.location,
      brand: fixtures.brand,
      modelNumber: fixtures.modelNumber,
      specNotes: fixtures.specNotes,
      notes: fixtures.notes,
    })
    .from(fixtures)
    .where(eq(fixtures.propertyId, id))

  const spaces = await db
    .select({
      id: propertySpaces.id,
      category: propertySpaces.category,
      floor: propertySpaces.floor,
      name: propertySpaces.name,
      pyeong: propertySpaces.pyeong,
      notes: propertySpaces.notes,
    })
    .from(propertySpaces)
    .where(eq(propertySpaces.propertyId, id))

  const fixtureIds = propertyFixtures.map((fixture) => fixture.id)
  const fixturePhotoRows = fixtureIds.length > 0
    ? await db
      .select({
        id: fixturePhotos.id,
        fixtureId: fixturePhotos.fixtureId,
        storagePath: fixturePhotos.storagePath,
        sortOrder: fixturePhotos.sortOrder,
      })
      .from(fixturePhotos)
      .where(inArray(fixturePhotos.fixtureId, fixtureIds))
    : []

  const spaceIds = spaces.map((space) => space.id)
  const spacePhotoRows = spaceIds.length > 0
    ? await db
      .select({
        id: propertySpacePhotos.id,
        propertySpaceId: propertySpacePhotos.propertySpaceId,
        storagePath: propertySpacePhotos.storagePath,
        sortOrder: propertySpacePhotos.sortOrder,
      })
      .from(propertySpacePhotos)
      .where(inArray(propertySpacePhotos.propertySpaceId, spaceIds))
    : []

  const signedUrlMap = await createSignedUrlMap([
    ...fixturePhotoRows.map((photo) => photo.storagePath),
    ...spacePhotoRows.map((photo) => photo.storagePath),
  ])

  const fixturesWithPhotos = propertyFixtures.map((fixture) => ({
    ...fixture,
    photos: fixturePhotoRows
      .filter((photo) => photo.fixtureId === fixture.id)
      .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
      .map((photo) => ({
        id: photo.id,
        storagePath: photo.storagePath,
        signedUrl: signedUrlMap.get(photo.storagePath) ?? null,
      })),
  }))

  const spacesWithPhotos = spaces.map((space) => ({
    ...space,
    photos: spacePhotoRows
      .filter((photo) => photo.propertySpaceId === space.id)
      .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
      .map((photo) => ({
        id: photo.id,
        storagePath: photo.storagePath,
        signedUrl: signedUrlMap.get(photo.storagePath) ?? null,
      })),
  }))

  return c.json({
    ...property,
    spaces: spacesWithPhotos,
    fixtures: fixturesWithPhotos,
  })
})

adminRoutes.post('/properties/:id/registration/upload-url', async (c) => {
  const propertyId = c.req.param('id')
  const body = await c.req.json()
  const validated = SignedUploadSchema.safeParse({
    ...body,
    propertyId,
  })

  if (!validated.success) {
    return warnJson(c, { errors: validated.error.flatten().fieldErrors }, 400)
  }

  const [property] = await db
    .select({ id: properties.id })
    .from(properties)
    .where(and(eq(properties.id, propertyId), isNull(properties.deletedAt)))
    .limit(1)

  if (!property) {
    return warnJson(c, { error: '숙소를 찾을 수 없어요' }, 404)
  }

  const ext = validated.data.fileName.split('.').pop()?.toLowerCase() || 'jpg'
  const kind = validated.data.kind ?? 'fixtures'
  const path = `properties/${propertyId}/${kind}/${crypto.randomUUID()}.${ext}`
  const supabaseAdmin = getSupabaseAdmin()
  const { data, error } = await supabaseAdmin.storage
    .from('images')
    .createSignedUploadUrl(path)

  if (error || !data) {
    return warnJson(c, { error: error?.message || '업로드 URL을 만들 수 없어요.' }, 400)
  }

  return c.json({
    path,
    token: data.token,
  })
})

adminRoutes.post('/properties/:id/registration/draft', async (c) => {
  const id = c.req.param('id')
  const body = await c.req.json()
  const validated = PropertyRegistrationDraftSchema.safeParse(body)

  if (!validated.success) {
    return warnJson(c, { errors: validated.error.flatten().fieldErrors }, 400)
  }

  const [updated] = await db
    .update(properties)
    .set({
      entrancePassword: validated.data.entrancePassword?.trim() || null,
      doorLockPassword: validated.data.doorLockPassword?.trim() || null,
      wifiSsid: validated.data.wifiSsid?.trim() || null,
      wifiPassword: validated.data.wifiPassword?.trim() || null,
      updatedAt: new Date(),
    })
    .where(and(eq(properties.id, id), isNull(properties.deletedAt)))
    .returning({ id: properties.id })

  if (!updated) {
    return warnJson(c, { error: '숙소를 찾을 수 없어요' }, 404)
  }

  return c.json({ success: true })
})

adminRoutes.post('/properties/:id/registration/spaces', async (c) => {
  const propertyId = c.req.param('id')
  const body = await c.req.json()
  const validated = PropertySpaceSchema.safeParse(body)

  if (!validated.success) {
    return warnJson(c, { errors: validated.error.flatten().fieldErrors }, 400)
  }

  const [property] = await db
    .select({ id: properties.id })
    .from(properties)
    .where(and(eq(properties.id, propertyId), isNull(properties.deletedAt)))
    .limit(1)

  if (!property) {
    return warnJson(c, { error: '숙소를 찾을 수 없어요' }, 404)
  }

  const created = await db.transaction(async (tx) => {
    const [space] = await tx
      .insert(propertySpaces)
      .values({
        propertyId,
        category: validated.data.category,
        floor: validated.data.floor,
        name: validated.data.name.trim(),
        pyeong: validated.data.pyeong,
        notes: validated.data.notes?.trim() || null,
      })
      .returning()

    if (validated.data.photoPaths.length > 0) {
      await tx.insert(propertySpacePhotos).values(
        validated.data.photoPaths.map((storagePath, index) => ({
          propertySpaceId: space.id,
          storagePath,
          sortOrder: index,
        })),
      )
    }

    return space
  })

  return c.json(created, 201)
})

adminRoutes.patch('/properties/:id/registration/spaces/:spaceId', async (c) => {
  const propertyId = c.req.param('id')
  const spaceId = c.req.param('spaceId')
  const body = await c.req.json()
  const validated = PropertySpaceSchema.safeParse(body)

  if (!validated.success) {
    return warnJson(c, { errors: validated.error.flatten().fieldErrors }, 400)
  }

  const [space] = await db
    .select({ id: propertySpaces.id, name: propertySpaces.name })
    .from(propertySpaces)
    .where(and(eq(propertySpaces.id, spaceId), eq(propertySpaces.propertyId, propertyId)))
    .limit(1)

  if (!space) {
    return warnJson(c, { error: '공간 정보를 찾을 수 없어요' }, 404)
  }

  await db.transaction(async (tx) => {
    await tx
      .update(propertySpaces)
      .set({
        category: validated.data.category,
        floor: validated.data.floor,
        name: validated.data.name.trim(),
        pyeong: validated.data.pyeong,
        notes: validated.data.notes?.trim() || null,
        updatedAt: new Date(),
      })
      .where(eq(propertySpaces.id, spaceId))

    await tx.delete(propertySpacePhotos).where(eq(propertySpacePhotos.propertySpaceId, spaceId))

    if (validated.data.photoPaths.length > 0) {
      await tx.insert(propertySpacePhotos).values(
        validated.data.photoPaths.map((storagePath, index) => ({
          propertySpaceId: spaceId,
          storagePath,
          sortOrder: index,
        })),
      )
    }
  })

  return c.json({ success: true })
})

adminRoutes.delete('/properties/:id/registration/spaces/:spaceId', async (c) => {
  const propertyId = c.req.param('id')
  const spaceId = c.req.param('spaceId')

  const [space] = await db
    .select({ id: propertySpaces.id, name: propertySpaces.name })
    .from(propertySpaces)
    .where(and(eq(propertySpaces.id, spaceId), eq(propertySpaces.propertyId, propertyId)))
    .limit(1)

  if (!space) {
    return warnJson(c, { error: '공간 정보를 찾을 수 없어요' }, 404)
  }

  const [linkedFixture] = await db
    .select({ id: fixtures.id })
    .from(fixtures)
    .where(
      and(
        eq(fixtures.propertyId, propertyId),
        sql`${fixtures.location} = ${space.name} or ${fixtures.location} like ${space.name + ' · %'}`,
      ),
    )
    .limit(1)

  if (linkedFixture) {
    return warnJson(c, { error: '연결된 시설물이 있어 공간을 삭제할 수 없어요.' }, 400)
  }

  await db.delete(propertySpaces).where(eq(propertySpaces.id, spaceId))

  return c.json({ success: true })
})

adminRoutes.post('/properties/:id/registration/fixtures', async (c) => {
  const propertyId = c.req.param('id')
  const body = await c.req.json()
  const validated = CreateFixtureSchema.safeParse(body)

  if (!validated.success) {
    return warnJson(c, { errors: validated.error.flatten().fieldErrors }, 400)
  }

  const [property] = await db
    .select({ id: properties.id })
    .from(properties)
    .where(and(eq(properties.id, propertyId), isNull(properties.deletedAt)))
    .limit(1)

  if (!property) {
    return warnJson(c, { error: '숙소를 찾을 수 없어요' }, 404)
  }

  const created = await db.transaction(async (tx) => {
    const [fixture] = await tx
      .insert(fixtures)
      .values({
        propertyId,
        category: validated.data.category,
        name: validated.data.name.trim(),
        location: validated.data.location.trim(),
        brand: validated.data.brand?.trim() || null,
        modelNumber: validated.data.modelNumber?.trim() || null,
        specNotes: validated.data.specNotes?.trim() || null,
        notes: validated.data.notes?.trim() || null,
      })
      .returning()

    if (validated.data.photoPaths.length > 0) {
      await tx.insert(fixturePhotos).values(
        validated.data.photoPaths.map((storagePath, index) => ({
          fixtureId: fixture.id,
          storagePath,
          sortOrder: index,
        })),
      )
    }

    return fixture
  })

  return c.json(created, 201)
})

adminRoutes.patch('/properties/:id/registration/fixtures/:fixtureId', async (c) => {
  const propertyId = c.req.param('id')
  const fixtureId = c.req.param('fixtureId')
  const body = await c.req.json()
  const validated = CreateFixtureSchema.safeParse(body)

  if (!validated.success) {
    return warnJson(c, { errors: validated.error.flatten().fieldErrors }, 400)
  }

  const [fixture] = await db
    .select({ id: fixtures.id })
    .from(fixtures)
    .where(and(eq(fixtures.id, fixtureId), eq(fixtures.propertyId, propertyId)))
    .limit(1)

  if (!fixture) {
    return warnJson(c, { error: '시설물을 찾을 수 없어요' }, 404)
  }

  await db.transaction(async (tx) => {
    await tx
      .update(fixtures)
      .set({
        category: validated.data.category,
        name: validated.data.name.trim(),
        location: validated.data.location.trim(),
        brand: validated.data.brand?.trim() || null,
        modelNumber: validated.data.modelNumber?.trim() || null,
        specNotes: validated.data.specNotes?.trim() || null,
        notes: validated.data.notes?.trim() || null,
        updatedAt: new Date(),
      })
      .where(eq(fixtures.id, fixtureId))

    await tx.delete(fixturePhotos).where(eq(fixturePhotos.fixtureId, fixtureId))

    if (validated.data.photoPaths.length > 0) {
      await tx.insert(fixturePhotos).values(
        validated.data.photoPaths.map((storagePath, index) => ({
          fixtureId,
          storagePath,
          sortOrder: index,
        })),
      )
    }
  })

  return c.json({ success: true })
})

adminRoutes.delete('/properties/:id/registration/fixtures/:fixtureId', async (c) => {
  const propertyId = c.req.param('id')
  const fixtureId = c.req.param('fixtureId')

  const [fixture] = await db
    .select({ id: fixtures.id })
    .from(fixtures)
    .where(and(eq(fixtures.id, fixtureId), eq(fixtures.propertyId, propertyId)))
    .limit(1)

  if (!fixture) {
    return warnJson(c, { error: '시설물을 찾을 수 없어요' }, 404)
  }

  await db.delete(fixtures).where(eq(fixtures.id, fixtureId))

  return c.json({ success: true })
})

adminRoutes.post('/properties/:id/registration', async (c) => {
  const id = c.req.param('id')
  const body = await c.req.json()
  const validated = PropertyRegistrationSchema.safeParse(body)

  if (!validated.success) {
    return warnJson(c, { errors: validated.error.flatten().fieldErrors }, 400)
  }

  const [property] = await db
    .select({ id: properties.id })
    .from(properties)
    .where(and(eq(properties.id, id), isNull(properties.deletedAt)))
    .limit(1)

  if (!property) {
    return warnJson(c, { error: '숙소를 찾을 수 없어요' }, 404)
  }

  await db.transaction(async (tx) => {
    const spaces = await tx
      .select({
        category: propertySpaces.category,
        pyeong: propertySpaces.pyeong,
      })
      .from(propertySpaces)
      .where(eq(propertySpaces.propertyId, id))

    const totalPyeong = spaces.reduce((sum, space) => sum + (space.pyeong ?? 0), 0)
    const bedroomCount = spaces.filter((space) => space.category === 'bedroom').length
    const bathroomCount = spaces.filter((space) => space.category === 'bathroom').length

    await tx
      .update(properties)
      .set({
        entrancePassword: validated.data.entrancePassword || null,
        doorLockPassword: validated.data.doorLockPassword,
        wifiSsid: validated.data.wifiSsid || null,
        wifiPassword: validated.data.wifiPassword || null,
        pyeong: totalPyeong > 0 ? totalPyeong : null,
        bedrooms: bedroomCount > 0 ? bedroomCount : null,
        bathrooms: bathroomCount > 0 ? bathroomCount : null,
        status: 'active',
        activatedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(properties.id, id))

    const existingFixtures = await tx
      .select({ id: fixtures.id })
      .from(fixtures)
      .where(eq(fixtures.propertyId, id))

    const incomingIds = validated.data.fixtures
      .map((fixture) => fixture.id)
      .filter((fixtureId): fixtureId is string => Boolean(fixtureId))

    const fixturesToDelete = existingFixtures
      .map((fixture) => fixture.id)
      .filter((fixtureId) => !incomingIds.includes(fixtureId))

    if (fixturesToDelete.length > 0) {
      await tx.delete(fixtures).where(inArray(fixtures.id, fixturesToDelete))
    }

    for (const fixture of validated.data.fixtures) {
      let fixtureId = fixture.id

      if (fixtureId) {
        await tx
          .update(fixtures)
          .set({
            category: fixture.category,
            name: fixture.name,
            location: fixture.location,
            brand: fixture.brand || null,
            modelNumber: fixture.modelNumber || null,
            specNotes: fixture.specNotes || null,
            notes: fixture.notes || null,
            updatedAt: new Date(),
          })
          .where(eq(fixtures.id, fixtureId))

        await tx.delete(fixturePhotos).where(eq(fixturePhotos.fixtureId, fixtureId))
      } else {
        const [createdFixture] = await tx
          .insert(fixtures)
          .values({
            propertyId: id,
            category: fixture.category,
            name: fixture.name,
            location: fixture.location,
            brand: fixture.brand || null,
            modelNumber: fixture.modelNumber || null,
            specNotes: fixture.specNotes || null,
            notes: fixture.notes || null,
          })
          .returning({ id: fixtures.id })

        fixtureId = createdFixture.id
      }

      if (fixture.photoPaths.length > 0) {
        await tx.insert(fixturePhotos).values(
          fixture.photoPaths.map((path, index) => ({
            fixtureId: fixtureId!,
            storagePath: path,
            sortOrder: index,
          })),
        )
      }
    }
  })

  return c.json({ success: true })
})

adminRoutes.post('/properties/:id/activate', async (c) => {
  const id = c.req.param('id')

  const [updated] = await db
    .update(properties)
    .set({
      status: 'active',
      activatedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(and(eq(properties.id, id), isNull(properties.deletedAt)))
    .returning({
      id: properties.id,
      status: properties.status,
      activatedAt: properties.activatedAt,
    })

  if (!updated) {
    return warnJson(c, { error: '숙소를 찾을 수 없어요' }, 404)
  }

  return c.json(updated)
})
