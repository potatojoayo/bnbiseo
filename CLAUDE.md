# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Build & Dev Commands

- `bun dev` — start dev server (port 3000)
- `bun run build` — production build
- `bun start` — start production server
- `bun lint` — run ESLint

## Tech Stack

- **Next.js 16** (App Router, `src/app/`) — read `node_modules/next/dist/docs/` before writing code
- **React 19**, **TypeScript 5**
- **Tailwind CSS v4** via `@tailwindcss/postcss` plugin
- **Hono** — API framework, mounted at `/api/[...route]`
- **Drizzle ORM** + PostgreSQL
- **Supabase** — Auth (client-side JS SDK) + Storage
- **Geist** font family (sans + mono)

## Architecture

- App Router only (`src/app/`), no Pages Router
- Path alias: `@/*` → `./src/*`
- **API-first**: All mutations and data reads go through Hono API routes, no server actions
- **Auth**: Client-side Supabase JS SDK (localStorage tokens), API uses `Authorization: Bearer <token>` header
- **Capacitor-ready**: No cookie-based auth, no server component data fetching — everything works via API calls
- `docs/` contains product spec (`plan.md`, in Korean) and MVP landing page design (`bnbiseo-mvp-landing.jsx`)

## API Structure

```
src/server/app.ts           — Hono app instance (basePath: /api)
src/server/middleware/auth.ts — Bearer token verification via supabase.auth.getUser()
src/server/routes/           — Route modules (auth, properties, fixtures, profiles, airroi)
src/app/api/[...route]/route.ts — Next.js catch-all that delegates to Hono
```

## Client-side Patterns

- `src/lib/api-client.ts` — `api.get/post/patch/delete()` with auto token injection
- `src/lib/auth-provider.tsx` — React context providing `useAuth()` (user, session, loading)
- `src/lib/supabase/client.ts` — Re-exports shared Supabase client (for Storage uploads)
- All dashboard/onboarding pages are client components that fetch via API

## Product Context

BnBiseo (비엔비서) — a digital assistant for Airbnb hosts. Manages property specs/inventory, provides AI guest chatbot (via QR code), and streamlines repair coordination. Service docs are in Korean.
