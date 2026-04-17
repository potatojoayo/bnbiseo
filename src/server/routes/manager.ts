import { Hono } from 'hono'
import { and, asc, desc, eq, inArray, isNull, ne } from 'drizzle-orm'
import { db } from '@/db'
import { cleaningRequests, managers, profiles, properties, propertySpaces } from '@/db/schema'
import { authMiddleware, type AuthEnv } from '../middleware/auth'
import { summarizeSpacesByProperty } from '@/lib/property-space-summary'

type ManagerEnv = {
  Variables: AuthEnv['Variables'] & {
    managerId: string
  }
}

export const managerRoutes = new Hono<ManagerEnv>()

managerRoutes.use('*', authMiddleware)

managerRoutes.use('*', async (c, next) => {
  const profileId = c.get('profileId')

  if (!profileId) {
    return c.json({ error: '프로필을 찾을 수 없어요.' }, 401)
  }

  const [linked] = await db
    .select({
      profileId: profiles.id,
      role: profiles.role,
      managerId: managers.id,
    })
    .from(profiles)
    .leftJoin(managers, eq(managers.profileId, profiles.id))
    .where(and(eq(profiles.id, profileId), isNull(profiles.deletedAt)))
    .limit(1)

  if (!linked || linked.role !== 'manager' || !linked.managerId) {
    return c.json({ error: '연결된 매니저 계정이 아니에요.' }, 403)
  }

  c.set('managerId', linked.managerId)
  await next()
})

managerRoutes.get('/me', async (c) => {
  const profileId = c.get('profileId')
  const managerId = c.get('managerId')

  const [result] = await db
    .select({
      profileId: profiles.id,
      email: profiles.email,
      fullName: profiles.fullName,
      phone: profiles.phone,
      role: profiles.role,
      managerId: managers.id,
      managerProfileId: managers.profileId,
      managerName: managers.name,
      managerPhone: managers.phone,
      managerMemo: managers.memo,
      managerIsActive: managers.isActive,
      managerCreatedAt: managers.createdAt,
    })
    .from(profiles)
    .innerJoin(managers, eq(managers.profileId, profiles.id))
    .where(and(eq(profiles.id, profileId), eq(managers.id, managerId), isNull(profiles.deletedAt)))
    .limit(1)

  if (!result) {
    return c.json({ error: '매니저 정보를 찾을 수 없어요.' }, 404)
  }

  return c.json({
    profile: {
      id: result.profileId,
      email: result.email,
      fullName: result.fullName,
      phone: result.phone,
      role: result.role,
    },
    manager: {
      id: result.managerId,
      profileId: result.managerProfileId,
      name: result.managerName,
      phone: result.managerPhone,
      memo: result.managerMemo,
      isActive: result.managerIsActive,
      createdAt: result.managerCreatedAt,
    },
  })
})

managerRoutes.get('/cleanings/open', async (c) => {
  const now = new Date()
  const currentDate = new Intl.DateTimeFormat('sv-SE', {
    timeZone: 'Asia/Seoul',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(now)
  const currentTime = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Seoul',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(now)

  const result = await db
    .select({
      id: cleaningRequests.id,
      status: cleaningRequests.status,
      scheduledDate: cleaningRequests.scheduledDate,
      scheduledTime: cleaningRequests.scheduledTime,
      cleaningType: cleaningRequests.cleaningType,
      memo: cleaningRequests.memo,
      finalPrice: cleaningRequests.finalPrice,
      createdAt: cleaningRequests.createdAt,
      propertyId: properties.id,
      propertyName: properties.name,
      propertyAddress: properties.address,
      propertyAddressDetail: properties.addressDetail,
    })
    .from(cleaningRequests)
    .leftJoin(properties, eq(cleaningRequests.propertyId, properties.id))
    .where(and(
      eq(cleaningRequests.status, 'pending'),
      isNull(cleaningRequests.managerId),
      isNull(properties.deletedAt),
    ))
    .orderBy(asc(cleaningRequests.scheduledDate), asc(cleaningRequests.scheduledTime), desc(cleaningRequests.createdAt))
  const upcomingResult = result.filter((cleaning) =>
    cleaning.scheduledDate > currentDate ||
    (cleaning.scheduledDate === currentDate && cleaning.scheduledTime >= currentTime),
  )

  const propertyIds = Array.from(new Set(upcomingResult.map((cleaning) => cleaning.propertyId).filter((id): id is string => !!id)))
  const spaces = propertyIds.length > 0
    ? await db
        .select({
          propertyId: propertySpaces.propertyId,
          name: propertySpaces.name,
          category: propertySpaces.category,
          pyeong: propertySpaces.pyeong,
        })
        .from(propertySpaces)
        .where(inArray(propertySpaces.propertyId, propertyIds))
    : []
  const summaryByProperty = summarizeSpacesByProperty(spaces)
  const spaceNamesByProperty = new Map<string, string[]>()

  for (const space of spaces) {
    const current = spaceNamesByProperty.get(space.propertyId) ?? []
    current.push(space.name)
    spaceNamesByProperty.set(space.propertyId, current)
  }

  return c.json(
    upcomingResult.map((cleaning) => {
      const summary = cleaning.propertyId ? summaryByProperty.get(cleaning.propertyId) : null
      const spaceNames = cleaning.propertyId ? spaceNamesByProperty.get(cleaning.propertyId) ?? [] : []

      return {
        ...cleaning,
        propertySpaceNames: spaceNames,
        propertyPyeong: summary?.pyeong ?? null,
        propertyLivingRooms: summary?.livingRooms ?? null,
        propertyBedrooms: summary?.bedrooms ?? null,
        propertyBathrooms: summary?.bathrooms ?? null,
      }
    }),
  )
})

managerRoutes.get('/cleanings/me', async (c) => {
  const managerId = c.get('managerId')

  const result = await db
    .select({
      id: cleaningRequests.id,
      status: cleaningRequests.status,
      scheduledDate: cleaningRequests.scheduledDate,
      scheduledTime: cleaningRequests.scheduledTime,
      cleaningType: cleaningRequests.cleaningType,
      memo: cleaningRequests.memo,
      finalPrice: cleaningRequests.finalPrice,
      createdAt: cleaningRequests.createdAt,
      propertyId: properties.id,
      propertyName: properties.name,
      propertyAddress: properties.address,
      propertyAddressDetail: properties.addressDetail,
    })
    .from(cleaningRequests)
    .leftJoin(properties, eq(cleaningRequests.propertyId, properties.id))
    .where(and(
      eq(cleaningRequests.managerId, managerId),
      ne(cleaningRequests.status, 'pending_payment'),
      ne(cleaningRequests.status, 'cancelled'),
    ))
    .orderBy(asc(cleaningRequests.scheduledDate), asc(cleaningRequests.scheduledTime), desc(cleaningRequests.createdAt))

  const propertyIds = Array.from(new Set(result.map((cleaning) => cleaning.propertyId).filter((id): id is string => !!id)))
  const spaces = propertyIds.length > 0
    ? await db
        .select({
          propertyId: propertySpaces.propertyId,
          name: propertySpaces.name,
          category: propertySpaces.category,
          pyeong: propertySpaces.pyeong,
        })
        .from(propertySpaces)
        .where(inArray(propertySpaces.propertyId, propertyIds))
    : []
  const summaryByProperty = summarizeSpacesByProperty(spaces)
  const spaceNamesByProperty = new Map<string, string[]>()

  for (const space of spaces) {
    const current = spaceNamesByProperty.get(space.propertyId) ?? []
    current.push(space.name)
    spaceNamesByProperty.set(space.propertyId, current)
  }

  return c.json(
    result.map((cleaning) => {
      const summary = cleaning.propertyId ? summaryByProperty.get(cleaning.propertyId) : null
      const spaceNames = cleaning.propertyId ? spaceNamesByProperty.get(cleaning.propertyId) ?? [] : []

      return {
        ...cleaning,
        propertySpaceNames: spaceNames,
        propertyPyeong: summary?.pyeong ?? null,
        propertyLivingRooms: summary?.livingRooms ?? null,
        propertyBedrooms: summary?.bedrooms ?? null,
        propertyBathrooms: summary?.bathrooms ?? null,
      }
    }),
  )
})

managerRoutes.post('/cleanings/:id/claim', async (c) => {
  const id = c.req.param('id')
  const managerId = c.get('managerId')

  const [claimable] = await db
    .select({ id: cleaningRequests.id })
    .from(cleaningRequests)
    .leftJoin(properties, eq(cleaningRequests.propertyId, properties.id))
    .where(and(
      eq(cleaningRequests.id, id),
      eq(cleaningRequests.status, 'pending'),
      isNull(cleaningRequests.managerId),
      isNull(properties.deletedAt),
    ))
    .limit(1)

  if (!claimable) {
    return c.json({ error: '다른 매니저가 먼저 배정했어요.' }, 409)
  }

  const [claimed] = await db
    .update(cleaningRequests)
    .set({
      managerId,
      status: 'confirmed',
      updatedAt: new Date(),
    })
    .where(and(
      eq(cleaningRequests.id, id),
      eq(cleaningRequests.status, 'pending'),
      isNull(cleaningRequests.managerId),
    ))
    .returning({ id: cleaningRequests.id })

  if (!claimed) {
    return c.json({ error: '다른 매니저가 먼저 배정했어요.' }, 409)
  }

  return c.json({ success: true, id: claimed.id })
})
