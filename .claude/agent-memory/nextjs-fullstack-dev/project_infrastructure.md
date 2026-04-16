---
name: BnBiseo Infrastructure Setup
description: Core infrastructure files — Drizzle schema, Supabase clients, proxy.ts, TopLoader
type: project
---

## Completed in Step 1

### Package Stack
- `drizzle-orm` + `postgres` + `drizzle-kit` — ORM + migration tooling
- `@supabase/supabase-js` + `@supabase/ssr` — Auth (server) + Storage (client)
- `@anthropic-ai/sdk` — AI chatbot
- `next-nprogress-bar` — TopLoader (use `AppProgressBar` from this package, NOT default export)
- `zod` — validation

### Key File Paths
- `src/db/schema.ts` — all 11 Drizzle table definitions + relations
- `src/db/index.ts` — Drizzle client (pgbouncer, `prepare: false`)
- `src/lib/supabase/server.ts` — `createServerClient()` async helper (awaits `cookies()`)
- `src/lib/supabase/client.ts` — `createClient()` browser helper (Storage only)
- `src/proxy.ts` — Next.js 16 proxy (replaces middleware.ts), protects /dashboard/**
- `drizzle.config.ts` — uses `DIRECT_URL` env var for migrations

### DB Scripts (package.json)
- `bun run db:generate` — generate SQL migrations
- `bun run db:migrate` — run migrations
- `bun run db:push` — push schema directly (dev)
- `bun run db:studio` — Drizzle Studio UI

### Schema Tables
profiles, properties, property_photos, fixtures, fixture_photos,
repair_requests, repair_photos, repair_parts, guest_sessions,
chat_sessions, chat_messages

### Proxy Behavior
- `/dashboard/**` → redirects to `/login?redirectTo=...` if unauthenticated
- `/login` + `/signup` → redirects to `/dashboard` if already authenticated
- `/guest/**` → allowed without auth (QR guest access)

### Next.js 16 Breaking Changes Applied
- `middleware.ts` → `proxy.ts`, function named `proxy` (not `middleware`)
- `cookies()` is async — always `await cookies()`
- `AppProgressBar` from `next-nprogress-bar` (not default export `NextTopLoader`)

**Why:** Next.js 16 renamed middleware to proxy, broke `cookies()` sync API.
**How to apply:** Always use proxy.ts + async cookies in all new server code.

## Completed in Step 2 — Auth

### New File Paths
- `src/actions/auth.ts` — `login`, `signup`, `logout` server actions using `useActionState` pattern
- `src/app/(auth)/layout.tsx` — centered auth shell with 비엔비서 logo link
- `src/app/(auth)/login/page.tsx` + `login-form.tsx` — login page (server + client form split)
- `src/app/(auth)/signup/page.tsx` + `signup-form.tsx` — signup page (server + client form split)
- `src/app/auth/callback/route.ts` — Supabase code exchange callback route
- `src/app/dashboard/page.tsx` — placeholder dashboard (server component, checks auth)

### Auth Action Patterns
- `login` / `signup` take `(state, formData)` — compatible with `useActionState`
- `signup` inserts into `profiles` table via Drizzle after `supabase.auth.signUp`
- `redirect()` called OUTSIDE try/catch (it throws internally)
- Zod v4 used: `z.string().email(...)` (both top-level `z.email` and chained work)
- Error messages in Korean

### Form Component Pattern
- Page file (server component) imports form file (client component `'use client'`)
- `useActionState<StateType, FormData>(action, undefined)` for typed state
- Separate `SubmitButton` component using `useFormStatus` for pending state
- Field-level errors from `state.errors.fieldName[0]`, global from `state.message`

### Design Tokens Used in Auth
- Background: `#F6F4F0` (from globals.css body)
- Input background: `#FDFCFA`
- Border: `#D1C9BC` (neutral), `#D4421E` (error/focus)
- Brand red: `#D4421E`
- Error bg: `#FEE2E2`, error text: `#991B1B`
- Rounded inputs: `rounded-xl`
- Font: `var(--font-display)` for headings
