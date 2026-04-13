import { createMiddleware } from 'hono/factory'
import { createClient } from '@supabase/supabase-js'

export type AuthEnv = {
  Variables: {
    userId: string
  }
}

export const authMiddleware = createMiddleware<AuthEnv>(async (c, next) => {
  const header = c.req.header('Authorization')
  if (!header?.startsWith('Bearer ')) {
    return c.json({ error: '로그인이 필요합니다.' }, 401)
  }

  const token = header.slice(7)
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY!,
  )

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser(token)

  if (error || !user) {
    return c.json({ error: '유효하지 않은 인증 정보입니다.' }, 401)
  }

  c.set('userId', user.id)
  await next()
})
