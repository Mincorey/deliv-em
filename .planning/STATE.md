# STATE: Deliv'em

## Current Status
- **Active Phase:** Complete — all 9 phases shipped
- **Milestone:** 1 (Foundation → Launch) ✓
- **Last Updated:** 2026-04-13

## Completed Phases
- Phase 1: Project Setup & Design System ✓
- Phase 2: Auth System ✓
- Phase 3: Dashboard & Navigation ✓
- Phase 4: Tasks — Customer Flow ✓
- Phase 5: Tasks — Courier Flow ✓
- Phase 6: Real-time Chat ✓
- Phase 7: Ratings & Wallet ✓
- Phase 8: Couriers Directory & Favorites ✓
- Phase 9: Polish & Production Readiness ✓

## What Was Built
- Next.js 15 App Router + TypeScript + Tailwind v4 + Supabase
- 17 dynamic routes across (auth) and (app) route groups
- Role-based UI: customers vs couriers see different dashboards/feeds
- Supabase Realtime chat (postgres_changes subscription)
- AnyPay webhook payment integration
- Supabase Storage for avatar uploads
- loading.tsx skeletons for all routes
- Mobile bottom navigation (BottomNav component, md:hidden)

## Key Decisions
- Stack: Next.js 15 + TypeScript + Tailwind v4 (CSS-based) + Supabase
- Existing index.html → source of UI/UX truth
- delivem_schema.sql → Supabase DB schema
- Deploy target: Vercel
- Tailwind v4: CSS-based @theme inline, NOT tailwind.config.js
- Google Fonts @import must come BEFORE @import "tailwindcss" in globals.css
- Server/Client separation: all mutations in actions.ts (server), interactivity in *.tsx (client)
- export const dynamic = 'force-dynamic' on app layout and auth layout (prevents Supabase URL errors at build time)

## Blockers / Open Questions
- AnyPay live credentials needed for production payments (currently demo mode: direct balance update)
- Supabase project URL + anon key (set in .env.local)
- Yandex Maps API key (Phase 4 map feature deferred — not yet implemented)
