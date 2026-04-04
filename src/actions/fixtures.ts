'use server'

import { z } from 'zod'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { eq, and } from 'drizzle-orm'
import { db } from '@/db'
import { fixtures, properties, fixturePhotos } from '@/db/schema'
import { createServerClient } from '@/lib/supabase/server'

// ─── Zod Schemas ─────────────────────────────────────────────────────────────

const FixtureSchema = z.object({
  propertyId: z.string().uuid(),
  category: z.enum(['lighting', 'faucet', 'boiler', 'appliance', 'lock', 'ac', 'washer', 'dryer', 'vent', 'other']),
  name: z.string().min(1, { message: '시설물 이름을 입력해주세요.' }).trim(),
  location: z.string().min(1, { message: '위치를 입력해주세요.' }).trim(),
  brand: z.string().optional(),
  modelNumber: z.string().optional(),
  specNotes: z.string().optional(),
  installedAt: z.string().optional(),
  notes: z.string().optional(),
})

// ─── Types ────────────────────────────────────────────────────────────────────

export type FixtureFormState =
  | {
      errors?: {
        name?: string[]
        location?: string[]
        category?: string[]
      }
      message?: string
    }
  | undefined

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function getAuthUser() {
  const supabase = await createServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  return user
}

/** Verify the property belongs to the user */
async function verifyPropertyOwnership(propertyId: string, userId: string) {
  const result = await db
    .select({ id: properties.id })
    .from(properties)
    .where(and(eq(properties.id, propertyId), eq(properties.hostId, userId)))
    .limit(1)
  return result.length > 0
}

// ─── Actions ──────────────────────────────────────────────────────────────────

export async function createFixture(
  state: FixtureFormState,
  formData: FormData,
): Promise<FixtureFormState> {
  const user = await getAuthUser()

  const propertyId = formData.get('propertyId') as string

  const owned = await verifyPropertyOwnership(propertyId, user.id)
  if (!owned) return { message: '권한이 없습니다.' }

  const validated = FixtureSchema.safeParse({
    propertyId,
    category: formData.get('category'),
    name: formData.get('name'),
    location: formData.get('location'),
    brand: formData.get('brand') || undefined,
    modelNumber: formData.get('modelNumber') || undefined,
    specNotes: formData.get('specNotes') || undefined,
    installedAt: formData.get('installedAt') || undefined,
    notes: formData.get('notes') || undefined,
  })

  if (!validated.success) {
    return { errors: validated.error.flatten().fieldErrors }
  }

  const { category, name, location, brand, modelNumber, specNotes, installedAt, notes } = validated.data

  let fixtureId: string
  try {
    const [created] = await db
      .insert(fixtures)
      .values({
        propertyId,
        category,
        name,
        location,
        brand,
        modelNumber,
        specNotes,
        installedAt: installedAt || null,
        notes,
      })
      .returning({ id: fixtures.id })
    fixtureId = created.id
  } catch {
    return { message: '시설물 등록 중 오류가 발생했습니다. 다시 시도해주세요.' }
  }

  // Save photo storage paths if provided
  const photoPaths = formData.getAll('photoPaths[]') as string[]
  if (photoPaths.length > 0) {
    await db.insert(fixturePhotos).values(
      photoPaths.map((path, i) => ({
        fixtureId,
        storagePath: path,
        sortOrder: i,
      })),
    )
  }

  revalidatePath(`/dashboard/properties/${propertyId}`)
  redirect(`/dashboard/properties/${propertyId}`)
}

export async function updateFixture(
  state: FixtureFormState,
  formData: FormData,
): Promise<FixtureFormState> {
  const user = await getAuthUser()

  const fixtureId = formData.get('fixtureId') as string
  const propertyId = formData.get('propertyId') as string

  if (!fixtureId || !propertyId) return { message: '잘못된 요청입니다.' }

  const owned = await verifyPropertyOwnership(propertyId, user.id)
  if (!owned) return { message: '권한이 없습니다.' }

  // Verify fixture belongs to this property
  const existingFixture = await db
    .select({ id: fixtures.id })
    .from(fixtures)
    .where(and(eq(fixtures.id, fixtureId), eq(fixtures.propertyId, propertyId)))
    .limit(1)

  if (!existingFixture.length) return { message: '시설물을 찾을 수 없습니다.' }

  const validated = FixtureSchema.safeParse({
    propertyId,
    category: formData.get('category'),
    name: formData.get('name'),
    location: formData.get('location'),
    brand: formData.get('brand') || undefined,
    modelNumber: formData.get('modelNumber') || undefined,
    specNotes: formData.get('specNotes') || undefined,
    installedAt: formData.get('installedAt') || undefined,
    notes: formData.get('notes') || undefined,
  })

  if (!validated.success) {
    return { errors: validated.error.flatten().fieldErrors }
  }

  const { category, name, location, brand, modelNumber, specNotes, installedAt, notes } = validated.data

  try {
    await db
      .update(fixtures)
      .set({
        category,
        name,
        location,
        brand,
        modelNumber,
        specNotes,
        installedAt: installedAt || null,
        notes,
        updatedAt: new Date(),
      })
      .where(eq(fixtures.id, fixtureId))
  } catch {
    return { message: '시설물 수정 중 오류가 발생했습니다. 다시 시도해주세요.' }
  }

  // Append new photos if provided
  const photoPaths = formData.getAll('photoPaths[]') as string[]
  if (photoPaths.length > 0) {
    // Get current max sort_order
    const existing = await db
      .select({ sortOrder: fixturePhotos.sortOrder })
      .from(fixturePhotos)
      .where(eq(fixturePhotos.fixtureId, fixtureId))

    const maxOrder = existing.length > 0
      ? Math.max(...existing.map((p) => p.sortOrder ?? 0))
      : -1

    await db.insert(fixturePhotos).values(
      photoPaths.map((path, i) => ({
        fixtureId,
        storagePath: path,
        sortOrder: maxOrder + 1 + i,
      })),
    )
  }

  revalidatePath(`/dashboard/properties/${propertyId}`)
  revalidatePath(`/dashboard/properties/${propertyId}/fixtures/${fixtureId}`)
  redirect(`/dashboard/properties/${propertyId}/fixtures/${fixtureId}`)
}

export async function deleteFixture(formData: FormData) {
  const user = await getAuthUser()

  const fixtureId = formData.get('fixtureId') as string
  const propertyId = formData.get('propertyId') as string

  if (!fixtureId || !propertyId) return

  const owned = await verifyPropertyOwnership(propertyId, user.id)
  if (!owned) return

  await db
    .delete(fixtures)
    .where(and(eq(fixtures.id, fixtureId), eq(fixtures.propertyId, propertyId)))

  revalidatePath(`/dashboard/properties/${propertyId}`)
  redirect(`/dashboard/properties/${propertyId}`)
}

export async function deleteFixturePhoto(formData: FormData) {
  const user = await getAuthUser()

  const photoId = formData.get('photoId') as string
  const propertyId = formData.get('propertyId') as string
  const fixtureId = formData.get('fixtureId') as string

  if (!photoId || !propertyId) return

  const owned = await verifyPropertyOwnership(propertyId, user.id)
  if (!owned) return

  await db.delete(fixturePhotos).where(eq(fixturePhotos.id, photoId))

  revalidatePath(`/dashboard/properties/${propertyId}/fixtures/${fixtureId}`)
}
