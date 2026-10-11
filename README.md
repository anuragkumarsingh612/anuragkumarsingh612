# Restoq

A mobile-first grocery restock PWA built with React, TypeScript, Tailwind CSS and Supabase. Charcoal surfaces, a lavender gradient wordmark, responsive desktop navigation, and large mobile controls.

## Run locally

Node 24+ and npm 11:

```sh
npm ci
npm run dev -- --port 5173
```

Open **http://localhost:5173**. With no environment variables, the app opens a clearly labeled demo household and stores changes on this device. The example receipt demonstrates the editable confirmation flow. Selecting a real image does not fabricate extraction results.

## Features

- Due Now, Coming Up and All Items views with category filters.
- Bought, three-day snooze, skip, per-item reminder overrides, and purchase history.
- Bill, order screenshot and item photo capture, image validation/compression, and preview.
- GPT-4o receipt extraction followed by editable item names, quantities, line totals, store and date. Low-confidence rows are highlighted.
- Atomic purchase confirmation, normalized product matching and median cycle recomputation.
- Owner-isolated Supabase households, products, purchases and item_cycles tables, with RLS and authenticated functions.
- Household details, local shopping notes, CSV export and install prompt.
- Production service worker caches the app shell, fonts, product artwork and hero image. Cloud mutations and AI reading require a connection. Photos are never cached or stored by Restoq.

## Connect Supabase and OpenAI

1. Create a Supabase project and enable **Authentication → Providers → Anonymous Sign-Ins**. The initial implementation uses a persistent anonymous session: one owner per household. Cross-device login and household invitations are not implemented. Keep the browser session to retain access; anonymous sessions are not account recovery.
2. Apply `supabase/migrations/202610110001_restock.sql` in the SQL editor, or link the Supabase CLI and run `supabase db push`. The migration creates tables, RLS, an idempotent household initializer, an atomic receipt-confirmation function, and a 20-photos-per-account hourly quota.
3. Copy `.env.example` to `.env.local` and set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` to your project URL and public anon key. Restart Vite.
4. Set these **Edge Function secrets** in Supabase:
   - `OPENAI_API_KEY`: a private OpenAI API key with GPT-4o access.
   - `APP_ORIGIN`: the exact browser origin, e.g. `http://localhost:5173` locally or your deployed HTTPS origin, without a trailing slash.
   - `OPENAI_BASE_URL`: optional; defaults to `https://api.openai.com/v1`.
5. Deploy with `supabase functions deploy parse-receipt`. JWT gateway verification is disabled in `supabase/config.toml` because the handler verifies the bearer token itself with `auth.getUser` before any paid API call. Do not remove that check.
6. Upload a grocery image, choose **Read photo with AI**, review the rows, then confirm.

Only public Supabase configuration is exposed to the browser. A service-role key is not required. Never put the OpenAI key in a `VITE_` environment variable. Enable Supabase's anonymous signup abuse controls/CAPTCHA before a public production launch; the per-account quota does not replace signup controls.

### Receipt API

`POST https://<project>.supabase.co/functions/v1/parse-receipt`

Authenticated multipart form with `image` (JPEG, PNG or WebP, maximum 5 MB) and `type` (`bill`, `order_screen`, `items`). Returns:

```json
{
  "store": "D-Mart",
  "items": [
    { "name": "Tata Salt 1 kg", "quantity": 1, "price": 28, "confidence": 0.95 }
  ]
}
```

`price` is the line total in INR, nullable when unknown. The route bounds the incoming stream, validates MIME and file signatures, checks the session and quota, sends the image to **GPT-4o**, validates JSON, and returns safe errors. AI output never writes to the database automatically. Images exist only in request memory; OpenAI's API retention policy applies to submitted images.

API reference: [OpenAI image inputs](https://developers.openai.com/api/docs/guides/images-vision).

## Plain-math prediction engine

`src/lib/cycles.ts` and the SQL confirmation function implement the same approach:

1. Sort unique purchase dates per product; multiple purchases on one day count once for intervals.
2. Calculate positive intervals in calendar days.
3. Use the median interval (average the middle pair for an even number).
4. Due date = latest purchase date + rounded median days. The dashboard starts nudging at 85% of the cycle.
5. Fewer than two intervals (three distinct purchase dates) means the item is still learning. A manual interval override takes priority.

No model call is used to predict restock dates. Quantities and prices are recorded, but intervals are based on purchase dates rather than estimated consumption volume.

## Validation

```sh
npm run build       # TypeScript and production PWA
npm test            # Client validation, image boundaries and median engine
npm run test:db     # Real PostgreSQL semantics via PGlite; no server required
npm audit
```

With Deno 2 installed:

```sh
npm run test:edge    # Deterministic auth/provider boundary tests; no live credentials
```

Database tests apply the actual migration and verify two-household isolation, anonymous access denial, matching, median cycles, duplicate dates, future-date validation, all-or-nothing receipt saving, protected writes and the hourly quota. Deno tests mock network boundaries; they do not establish live GPT-4o extraction quality or prove a project is deployed.

The database migration and Edge Function must be deployed to your own project for live operation. No cloud credentials or remote project were supplied with this checkout.

## Production PWA

```sh
npm run build
npm run preview -- --port 4173
```

Host `dist/` over HTTPS and rewrite frontend routes to `index.html`. Keep Supabase auth/API routes outside the navigation fallback. Installation availability depends on the browser; iOS uses Add to Home Screen. Supabase calls require internet; existing local demo purchases and the cached shell work offline after a successful first load.

Grocery photo: [Unsplash](https://images.unsplash.com/photo-1543168256-418811576931) (locally bundled). Product illustrations are repository SVG artwork. The original profile README is preserved in `PROFILE.md`.
