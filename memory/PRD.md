# The Notice Board — Product Requirements

## Problem
Transform a single-file HTML South African opportunity site into a world-class, editorial-premium opportunity discovery platform that rivals LinkedIn Jobs, Indeed, and Pnet — positioned as "South Africa's intelligent opportunity operating system."

## Architecture (delivered)
- **Backend**: FastAPI + MongoDB with auto-seeded rich opportunity data (12 opportunities across 10 categories). Endpoints: `/api/opportunities` (with q/category/province/remote/featured/experience filters), `/api/opportunities/stats`, `/api/opportunities/{id}`, `/api/saved` (CRUD), `/api/report`, `/api/preferences`, `/api/seed`.
- **Frontend**: React SPA with shadcn/ui, react-router routes, tailwind design tokens, editorial serif (Playfair Display) + Plus Jakarta Sans + JetBrains Mono, deep intelligent blue on warm off-white.
- **State**: `AppContext` — server-loaded opportunities + localStorage-persisted saved / recently viewed / preferences + server sync via device_id + global ⌘K listener.

## User Personas
- **Career starters** (youth, no experience) — learnerships, internships, apprenticeships, bursaries
- **Career builders** — jobs, remote roles, government positions
- **Students** — bursaries, skills programmes, scholarships
- **SMME owners** — tenders, RFQs, funding, supplier programmes

## Implemented (Feb 2026)
- Editorial hero + universal search + live pulse strip
- Discover-by-goal (4 human pathways) + Closing Soon + Featured sections
- Discover feed page: search + filter rail (category/province/experience/remote/closing-soon) + 3 sort orders + mobile filter drawer
- Business & Tenders portal with specialised tender cards (ref numbers, briefing dates) + tabs
- Opportunity detail: sticky action panel (Apply / Save / Share / Report), AI Match panel, Source & Verification block, Safety guidance, Related, mobile action bar
- Saved workspace: All / Closing soon / Recently viewed
- Preferences: category / province / experience / remote / frequency / channel (email + WhatsApp) with server sync
- Trust & Safety centre: 5 verification badges + scam warning list
- Global Command Palette (⌘K, /) with categories/provinces/opportunities
- Mobile bottom nav + WhatsApp community + Facebook links
- Report suspicious opportunity dialog with reason chips + persistence

## Verified
- iteration_1: backend 100% (7/7 endpoint groups), frontend ~78%
- iteration_2: frontend 100% (8/8 targeted fixes + 5/5 regressions), 0 console errors

## Backlog (P1 / P2)
- Real AI opportunity match (currently stubbed score) — wire Claude Sonnet 5 via Emergent LLM key
- AI Summary chip on long listings
- Smart Recommendations engine ("Because you saved…")
- Admin dashboard to submit / verify opportunities
- Public opportunity page indexing + Open Graph share previews
- Email/WhatsApp digest job (Resend + scheduled task)
- Real WhatsApp community + Facebook page URL replacement
- SAICA-style organisation logo uploads (object storage)

## Next tasks
1. Real WhatsApp community + Facebook URLs when user provides
2. AI-powered Opportunity Match using saved-interests + Emergent LLM key
3. Public Opportunity page SEO / structured data
4. Daily digest email via Resend
