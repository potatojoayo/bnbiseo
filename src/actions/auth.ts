'use server'

import { z } from 'zod'
import { redirect } from 'next/navigation'
import { createServerClient } from '@/lib/supabase/server'
import { db } from '@/db'
import { profiles } from '@/db/schema'

// ─── Zod Schemas ─────────────────────────────────────────────────────────────

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

// ─── Types ────────────────────────────────────────────────────────────────────

export type LoginFormState =
  | {
      errors?: {
        email?: string[]
        password?: string[]
      }
      message?: string
    }
  | undefined

export type SignupFormState =
  | {
      errors?: {
        fullName?: string[]
        email?: string[]
        password?: string[]
      }
      message?: string
    }
  | undefined

// ─── Actions ──────────────────────────────────────────────────────────────────

export async function login(
  state: LoginFormState,
  formData: FormData,
): Promise<LoginFormState> {
  const validated = LoginSchema.safeParse({
    email: formData.get('email'),
    password: formData.get('password'),
  })

  if (!validated.success) {
    return { errors: validated.error.flatten().fieldErrors }
  }

  const { email, password } = validated.data
  const supabase = await createServerClient()

  const { error } = await supabase.auth.signInWithPassword({ email, password })

  if (error) {
    return { message: '이메일 또는 비밀번호가 올바르지 않습니다.' }
  }

  redirect('/dashboard')
}

export async function signup(
  state: SignupFormState,
  formData: FormData,
): Promise<SignupFormState> {
  const validated = SignupSchema.safeParse({
    fullName: formData.get('fullName'),
    email: formData.get('email'),
    password: formData.get('password'),
  })

  if (!validated.success) {
    return { errors: validated.error.flatten().fieldErrors }
  }

  const { fullName, email, password } = validated.data
  const supabase = await createServerClient()

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name: fullName },
    },
  })

  if (error) {
    if (error.message.toLowerCase().includes('already registered')) {
      return { message: '이미 가입된 이메일입니다. 로그인해주세요.' }
    }
    return { message: '회원가입 중 오류가 발생했습니다. 다시 시도해주세요.' }
  }

  // Insert into profiles table if user was created
  if (data.user) {
    await db
      .insert(profiles)
      .values({ id: data.user.id, fullName })
      .onConflictDoNothing()
  }

  redirect('/dashboard')
}

export async function logout() {
  const supabase = await createServerClient()
  await supabase.auth.signOut()
  redirect('/')
}
