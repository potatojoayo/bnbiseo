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
- **Geist** font family (sans + mono)

## Architecture

- App Router only (`src/app/`), no Pages Router
- Path alias: `@/*` → `./src/*`
- No backend, database, or auth yet — pure frontend
- `docs/` contains product spec (`plan.md`, in Korean) and MVP landing page design (`bnbiseo-mvp-landing.jsx`)

## Product Context

BnBiseo (비엔비서) — a digital assistant for Airbnb hosts. Manages property specs/inventory, provides AI guest chatbot (via QR code), and streamlines repair coordination. Service docs are in Korean.
