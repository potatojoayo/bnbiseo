import { Hono } from 'hono'
import { z } from 'zod'
import { createClient } from '@supabase/supabase-js'
import { eq, and, isNull } from 'drizzle-orm'
import { db } from '@/db'
import { profiles } from '@/db/schema'
import { authMiddleware, type AuthEnv } from '../middleware/auth'

const LoginSchema = z.object({
  email: z.string().email({ message: '유효한 이메일 주소를 입력해주세요.' }).trim(),
  password: z.string().min(1, { message: '비밀번호를 입력해주세요.' }),
})

// SignupSchema removed — signup validation is client-side,
// server /signup route only creates the profile

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY!,
  )
}


export const authRoutes = new Hono<AuthEnv>()

authRoutes.post('/check-email', async (c) => {
  const { email } = await c.req.json()
  const parsed = z.string().email().safeParse(email)
  if (!parsed.success) {
    return c.json({ error: '유효한 이메일 주소를 입력해주세요.' }, 400)
  }

  const [profile] = await db
    .select({ id: profiles.id })
    .from(profiles)
    .where(and(eq(profiles.email, parsed.data), isNull(profiles.deletedAt)))
    .limit(1)
  const exists = !!profile

  return c.json({ exists })
})

authRoutes.post('/login', async (c) => {
  const body = await c.req.json()
  const validated = LoginSchema.safeParse(body)

  if (!validated.success) {
    return c.json({ errors: validated.error.flatten().fieldErrors }, 400)
  }

  const { email, password } = validated.data
  const supabase = getSupabase()

  const { data, error } = await supabase.auth.signInWithPassword({ email, password })

  if (error) {
    return c.json({ message: '이메일 또는 비밀번호가 올바르지 않습니다.' }, 401)
  }

  return c.json({
    session: {
      accessToken: data.session.access_token,
      refreshToken: data.session.refresh_token,
      expiresAt: data.session.expires_at,
    },
    user: { id: data.user.id, email: data.user.email },
  })
})

authRoutes.post('/signup', authMiddleware, async (c) => {
  const userId = c.get('userId')
  const body = await c.req.json()
  const { fullName, email } = z.object({
    fullName: z.string().min(1),
    email: z.string().email().optional(),
  }).parse(body)

  await db
    .insert(profiles)
    .values({ id: userId, fullName, email })
    .onConflictDoNothing()

  return c.json({ ok: true })
})

authRoutes.post('/refresh', async (c) => {
  const { refreshToken } = await c.req.json()
  if (!refreshToken) {
    return c.json({ error: 'refreshToken이 필요합니다.' }, 400)
  }

  const supabase = getSupabase()
  const { data, error } = await supabase.auth.refreshSession({ refresh_token: refreshToken })

  if (error || !data.session) {
    return c.json({ error: '세션을 갱신할 수 없습니다.' }, 401)
  }

  return c.json({
    session: {
      accessToken: data.session.access_token,
      refreshToken: data.session.refresh_token,
      expiresAt: data.session.expires_at,
    },
  })
})
