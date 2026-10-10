# Restoq

A mobile first household restock assistant for Indian homes, built with React 18, TypeScript (strict), Vite, Tailwind CSS, React Router, TanStack Query, react-hook-form, zod, lucide-react and vite-plugin-pwa.

**Current delivery: Phase 1 — interactive frontend and PWA foundation.** This is a clearly labelled local demo, not a production connected service. No photo, email, or household information is sent to a provider. Rename the app in `src/app/config.ts`; the header, document title, and PWA manifest use that constant.

## Run

Requires Node 24+ and npm 11.

```sh
npm ci
npm run dev -- --port 5173
```

Open http://localhost:5173. Vite serves nested routes through its SPA fallback. To check the production PWA:

```sh
npm run build
npm run preview -- --port 4173
```

Production hosting must use HTTPS and rewrite frontend routes to `index.html`. Localhost is allowed for PWA development. The generated service worker is enabled for production builds. Install availability depends on browser support; iOS uses Add to Home Screen.

## Phases

The supplied brief repeats and ends at “DO NOT BUILD” without a phase list. The following boundaries are assumed; stop after each phase for approval to continue.

1. **Frontend and PWA foundation (this delivery).** Dark mobile interface, routed screens, reusable primitives, responsive 480px shell, local demo persistence, purchase confirmation, file preview/compression, restock actions, history, item preferences, household list, CSV export, typed demo deletion, manifest and install prompt.
2. **Supabase and core logic.** Migrations, RLS and storage policies, secure RPCs, Google and magic link auth, household creation/invites, live shared state, cycle engine and normaliser with required tests. Replace demo state with TanStack Query queries/mutations.
3. **AI photo processing.** Provider adapter, upload lifecycle, server validation, matching, retry/polling/timeouts, transactional confirmation, corrections and aliases. All AI output goes through Confirm.
4. **Privacy, scheduled jobs and release checks.** Image deletion, account deletion semantics, export, recurring recomputation, retention cleanup, isolation tests and deployment checks.

## What works in Phase 1

- Home shows six due and three upcoming example products, plus confidence and purchase context. Bought adds a purchase. Snooze hides for three days. Not needed hides for half the current gap; three consecutive skips reduce confidence and offer to ignore. Due items cap at 15.
- Changes persist locally in a versioned, schema validated browser store. Storage failures display a notice. Reset demo reseeds relative to today; delete demo data empties purchases, products and shopping list.
- Add supports separate camera and gallery inputs, validates 8 MB before decoding, resizes to a 1600px long edge, produces JPEG at 0.8 quality, and rejects output over 5 MB. Photo blobs stay in memory and are revoked when leaving the screen. There is no OCR or pretend AI extraction. Enter purchases manually or use an explicitly labelled example bill.
- Confirm validates editable name, quantity, line total, store and real nonfuture date. Nothing enters history until saved. New products remain learning; inference is a later phase.
- History filters by store, groups by date, and adds pages of 30 using IntersectionObserver with a button fallback. Item details show actual local price history and allow reminder gap/ignore preferences.
- Demo household name/city, list additions/ticks/deletions, CSV export with formula prefix protection, and typed deletion work. Example members are explicitly labelled; invite/account buttons explain the pending integration.
- UI copy is in `src/i18n/en.json` (synthetic household/product records are data). Dates use Asia/Kolkata for “today”; prices use INR.
- Self-hosted Manrope font and generated icons are cached with the app shell. No runtime cache is configured; API, auth, and storage paths are excluded from navigation fallback. Install prompt is shown after a confirmed purchase.

## Deliberately pending

Supabase migrations, RLS, storage, auth, network queries, image upload/reading, server matching, cycle inference, automatic recomputation, cloud sharing, invite tokens, deletion of real accounts and scheduled cleanup are not implemented yet. The Supabase client library and TanStack Query provider are installed as the foundation; no fake credentials or service client is created. The required `supabase/` functions and migrations belong to the next phases, not placeholder endpoints.

The Welcome screen includes the intended production privacy copy, but also explicitly explains the demo. Photo previews here never leave the device. Production photo deletion should happen immediately after successful confirmation; the hourly saved >24h cleanup in the brief should be a recovery safety net. Account deletion behavior for data shared with other members needs a concrete policy in the backend phase.

## Configuration for the connected phases

No environment variables are required for Phase 1. `.env.example` lists future public client configuration.

| Variable | Where to set it | Purpose |
| --- | --- | --- |
| `VITE_SUPABASE_URL` | Client `.env.local` / frontend hosting environment | Project URL |
| `VITE_SUPABASE_ANON_KEY` | Client `.env.local` / frontend hosting environment | Public anonymous key; requires RLS |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase Edge Function secrets only | Privileged server operations; never client code |
| `AI_PROVIDER` | Edge Function secrets only | Provider adapter selection |
| `AI_API_KEY` | Edge Function secrets only | Private provider key |
| `VISION_MODEL` | Edge Function secrets only | Vision model identifier |
| `TEXT_MODEL` | Edge Function secrets only | Product matching model identifier |
| `APP_ORIGIN` | Edge Function secrets only | Exact allowed frontend origin for strict CORS |

Never add a service role or AI key to a `VITE_` variable. No email, SMS, or inbox access is part of this product.

## Checks

```sh
npm run build
npm test
npm audit
```

Vitest covers confirmation/date/quantity/price boundaries, household validation, image file size/type rejection, CSV escaping and spreadsheet safety, and demo due filtering. Cycle engine and normaliser tests will ship with those implementations in Phase 2. Browser checks cover 390px and desktop views, purchase actions, manual confirmation, history, shared list, persistence and PWA shell behavior.

### Original repository profile

The original profile README is preserved in `PROFILE.md`.
