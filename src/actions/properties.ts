'use server'

import { z } from 'zod'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { eq, and } from 'drizzle-orm'
import { db } from '@/db'
import { properties } from '@/db/schema'
import { createServerClient } from '@/lib/supabase/server'

// ─── Zod Schemas ─────────────────────────────────────────────────────────────

const PropertySchema = z.object({
  name: z.string().min(1, { message: '숙소 이름을 입력해주세요.' }).trim(),
  address: z.string().min(1, { message: '주소를 입력해주세요.' }).trim(),
  addressDetail: z.string().optional(),
  propertyType: z.enum(['apartment', 'house', 'studio', 'villa', 'other']),
  description: z.string().optional(),
  nearbyInfo: z.string().optional(),
  checkinInfo: z.string().optional(),
  wifiSsid: z.string().optional(),
  wifiPassword: z.string().optional(),
})

// ─── Types ────────────────────────────────────────────────────────────────────

export type PropertyFormState =
  | {
      errors?: {
        name?: string[]
        address?: string[]
        propertyType?: string[]
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

// ─── Actions ──────────────────────────────────────────────────────────────────

export async function createProperty(
  state: PropertyFormState,
  formData: FormData,
): Promise<PropertyFormState> {
  const user = await getAuthUser()

  const validated = PropertySchema.safeParse({
    name: formData.get('name'),
    address: formData.get('address'),
    addressDetail: formData.get('addressDetail') || undefined,
    propertyType: formData.get('propertyType'),
    description: formData.get('description') || undefined,
    nearbyInfo: formData.get('nearbyInfo') || undefined,
    checkinInfo: formData.get('checkinInfo') || undefined,
    wifiSsid: formData.get('wifiSsid') || undefined,
    wifiPassword: formData.get('wifiPassword') || undefined,
  })

  if (!validated.success) {
    return { errors: validated.error.flatten().fieldErrors }
  }

  const { name, address, addressDetail, propertyType, description, nearbyInfo, checkinInfo, wifiSsid, wifiPassword } = validated.data

  try {
    await db.insert(properties).values({
      hostId: user.id,
      name,
      address,
      addressDetail,
      propertyType,
      description,
      nearbyInfo,
      checkinInfo,
      wifiSsid,
      wifiPassword,
    })
  } catch {
    return { message: '숙소 등록 중 오류가 발생했습니다. 다시 시도해주세요.' }
  }

  revalidatePath('/dashboard/properties')
  redirect('/dashboard/properties')
}

export async function updateProperty(
  state: PropertyFormState,
  formData: FormData,
): Promise<PropertyFormState> {
  const user = await getAuthUser()

  const id = formData.get('id') as string
  if (!id) return { message: '잘못된 요청입니다.' }

  // Ownership check
  const existing = await db
    .select({ id: properties.id })
    .from(properties)
    .where(and(eq(properties.id, id), eq(properties.hostId, user.id)))
    .limit(1)

  if (!existing.length) return { message: '숙소를 찾을 수 없거나 권한이 없습니다.' }

  const validated = PropertySchema.safeParse({
    name: formData.get('name'),
    address: formData.get('address'),
    addressDetail: formData.get('addressDetail') || undefined,
    propertyType: formData.get('propertyType'),
    description: formData.get('description') || undefined,
    nearbyInfo: formData.get('nearbyInfo') || undefined,
    checkinInfo: formData.get('checkinInfo') || undefined,
    wifiSsid: formData.get('wifiSsid') || undefined,
    wifiPassword: formData.get('wifiPassword') || undefined,
  })

  if (!validated.success) {
    return { errors: validated.error.flatten().fieldErrors }
  }

  const { name, address, addressDetail, propertyType, description, nearbyInfo, checkinInfo, wifiSsid, wifiPassword } = validated.data

  try {
    await db
      .update(properties)
      .set({
        name,
        address,
        addressDetail,
        propertyType,
        description,
        nearbyInfo,
        checkinInfo,
        wifiSsid,
        wifiPassword,
        updatedAt: new Date(),
      })
      .where(and(eq(properties.id, id), eq(properties.hostId, user.id)))
  } catch {
    return { message: '숙소 수정 중 오류가 발생했습니다. 다시 시도해주세요.' }
  }

  revalidatePath('/dashboard/properties')
  revalidatePath(`/dashboard/properties/${id}`)
  redirect(`/dashboard/properties/${id}`)
}

export async function deleteProperty(formData: FormData) {
  const user = await getAuthUser()

  const id = formData.get('id') as string
  if (!id) return

  // Ownership check
  const existing = await db
    .select({ id: properties.id })
    .from(properties)
    .where(and(eq(properties.id, id), eq(properties.hostId, user.id)))
    .limit(1)

  if (!existing.length) return

  await db
    .delete(properties)
    .where(and(eq(properties.id, id), eq(properties.hostId, user.id)))

  revalidatePath('/dashboard/properties')
  redirect('/dashboard/properties')
}
