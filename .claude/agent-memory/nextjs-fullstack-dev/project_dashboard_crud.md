---
name: Dashboard CRUD Implementation
description: shadcn/ui setup, dashboard layout, property+fixture CRUD routes and actions completed in Step 3
type: project
---

Dashboard CRUD (Step 3) is fully implemented and passing build + lint.

**Why:** MVP Step 3 — properties and fixtures management for Airbnb hosts.

**How to apply:** Use as reference for any additional CRUD domains added later.

## UI Components (src/components/ui/)
- button.tsx, input.tsx, textarea.tsx, label.tsx, card.tsx, select.tsx, badge.tsx, separator.tsx
- cn() utility at src/lib/utils.ts
- No shadcn CLI used — components written manually with Radix UI primitives
- Radix packages installed: @radix-ui/react-slot, react-dialog, react-select, react-label, react-separator, react-dropdown-menu
- Additional: class-variance-authority, clsx, tailwind-merge, lucide-react

## Server Actions
- src/actions/properties.ts — createProperty, updateProperty, deleteProperty
- src/actions/fixtures.ts — createFixture, updateFixture, deleteFixture, deleteFixturePhoto

## Route Structure
- /dashboard — home with summary cards + property list
- /dashboard/properties — property list
- /dashboard/properties/new — create form
- /dashboard/properties/[id] — detail with fixtures list
- /dashboard/properties/[id]/edit — edit form
- /dashboard/properties/[id]/fixtures/new — create fixture
- /dashboard/properties/[id]/fixtures/[fixtureId] — fixture detail with photo gallery
- /dashboard/properties/[id]/fixtures/[fixtureId]/edit — edit fixture

## Layout (updated: shadcn SidebarProvider architecture)
- src/app/dashboard/layout.tsx — server component: auth check + Drizzle properties query → SidebarProvider wrapping AppSidebar + SidebarInset(children)
- src/components/app-sidebar.tsx — client component, receives user:{email} + userProperties:{id,name}[] as props from layout server component
- src/components/nav-main.tsx — collapsible nav with Link, usePathname for active state; supports sub-items for property links
- src/components/nav-secondary.tsx — secondary nav (수리 이력)
- src/components/nav-user.tsx — shows user email initial, dropdown with logout server action
- src/components/site-header.tsx — accepts title prop, renders SidebarTrigger + title
- TooltipProvider fix: added inside SidebarProvider in src/components/ui/sidebar.tsx
- Collapsible component installed: src/components/ui/collapsible.tsx (via shadcn CLI)
- nav-documents.tsx deleted (demo only)
- Demo files deleted: chart-area-interactive.tsx, data-table.tsx, section-cards.tsx, data.json

## Photo Upload
- Client-side upload to Supabase Storage bucket "fixture-photos"
- PhotoUploader component in fixtures/components/photo-uploader.tsx
- After upload, paths stored as hidden form inputs (photoPaths[]) and saved to fixture_photos table
- Supabase Storage bucket name: fixture-photos

## Key Patterns
- params is Promise<{id: string}> — always await in Next.js 16
- Input/Textarea props use `type =` alias instead of `interface` to avoid @typescript-eslint/no-empty-object-type
- Ownership always verified: property.hostId === user.id before any CUD
- deleteProperty/deleteFixture use confirm() via client wrapper component
