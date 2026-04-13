import { Hono } from 'hono'
import { z } from 'zod'
import { createClient } from '@supabase/supabase-js'
import { sql } from 'drizzle-orm'
import { db } from '@/db'
import { profiles } from '@/db/schema'

const LoginSchema = z.object({
  email: z.string().email({ message: '유효한 이메일 주소를 입력해주세요.' }).trim(),
  password: z.string().min(1, { message: '비밀번호를 입력해주세요.' }),
})

const SignupSchema = z.object({
  fullName: z.string().min(2, { message: '이름은 2자 이상 입력해주세요.' }).trim(),
  email: z.string().email({ message: '유효한 이메일 주소를 입력해주세요.' }).trim(),
  password: z
    .string()
    .min(8, { message: '비밀번호는 8자 이상이어야 합니다.' })
    .regex(/[a-zA-Z]/, { message: '영문자를 포함해야 합니다.' })
    .regex(/[0-9]/, { message: '숫자를 포함해야 합니다.' }),
})

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY!,
  )
}


export const authRoutes = new Hono()

authRoutes.post('/check-email', async (c) => {
  const { email } = await c.req.json()
  const parsed = z.string().email().safeParse(email)
  if (!parsed.success) {
    return c.json({ error: '유효한 이메일 주소를 입력해주세요.' }, 400)
  }

  const result = await db.execute<{ exists: boolean }>(
    sql`SELECT EXISTS(SELECT 1 FROM auth.users WHERE email = ${parsed.data}) AS exists`
  )
  const exists = result[0]?.exists ?? false

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

authRoutes.post('/signup', async (c) => {
  const body = await c.req.json()
  const validated = SignupSchema.safeParse(body)

  if (!validated.success) {
    return c.json({ errors: validated.error.flatten().fieldErrors }, 400)
  }

  const { fullName, email, password } = validated.data
  const supabase = getSupabase()

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { full_name: fullName } },
  })

  if (error) {
    if (error.message.toLowerCase().includes('already registered')) {
      return c.json({ message: '이미 가입된 이메일입니다. 로그인해주세요.' }, 409)
    }
    return c.json({ message: '회원가입 중 오류가 발생했습니다. 다시 시도해주세요.' }, 500)
  }

  if (data.user) {
    await db
      .insert(profiles)
      .values({ id: data.user.id, fullName })
      .onConflictDoNothing()
  }

  return c.json({
    session: data.session
      ? {
          accessToken: data.session.access_token,
          refreshToken: data.session.refresh_token,
          expiresAt: data.session.expires_at,
        }
      : null,
    user: data.user ? { id: data.user.id, email: data.user.email } : null,
  })
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
