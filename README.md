# Map Overlap Tool

Local-first MVP for comparing API hotel contract destinations against prospect client layover destinations on a world map.

## Recommended stack

- Framework: Next.js App Router with React + TypeScript
- Styling: Tailwind CSS v4
- Map: `react-simple-maps` + `world-atlas`
- CSV parsing: `papaparse`
- Validation: `zod`
- State management: `zustand`
- Backend approach: local file-backed repository by default, Neon/Postgres-ready schema for deployment

## Architecture

- `src/app`: routes, pages, layouts, API endpoints
- `src/components`: reusable UI for uploads, map, metrics, tables, theme, and admin
- `src/components/ui`: design-system primitives and patterns
- `src/lib`: parsing, normalization, metrics, auth, repository abstraction, shared types
- `src/data`: built-in seed airport reference data
- `public/templates`: sample upload templates
- `public/demo`: demo CSVs
- `data/airports.json`: local airport override storage for admin edits
- `db/schema.sql`: Neon/Postgres schema for production deployment
- `scripts/seed-neon.mjs`: one-time sync script for airports and admin user

## Functional scope in this MVP

- Upload 2 CSVs with drag-and-drop
- Validate required columns and row values
- Auto-combine duplicate IATA rows by summing volume
- Match IATA codes against a built-in airport reference list
- Show unknown IATA codes in validation panels
- Render a world map with country borders and volume-scaled bubbles
- Distinguish API-only, client-only, and overlap destinations with user-selectable colors
- Show region filter, summary metrics, top overlap ranking, and category tables
- Support light/dark mode toggle
- Include an admin screen for airport CRUD and bulk airport upload
- Include a live design system reference page at `/design-system`

## Design system foundation

This project now has the first real layers of a reusable design system:

- Tokens: [src/app/tokens.css](/Users/ecandamo/Documents/Codex/Map Overlap Tool/src/app/tokens.css)
- Primitives: [src/components/ui/button.tsx](/Users/ecandamo/Documents/Codex/Map Overlap Tool/src/components/ui/button.tsx), [src/components/ui/field.tsx](/Users/ecandamo/Documents/Codex/Map Overlap Tool/src/components/ui/field.tsx), [src/components/ui/badge.tsx](/Users/ecandamo/Documents/Codex/Map Overlap Tool/src/components/ui/badge.tsx), [src/components/ui/surface.tsx](/Users/ecandamo/Documents/Codex/Map Overlap Tool/src/components/ui/surface.tsx)
- Patterns: [src/components/ui/section-header.tsx](/Users/ecandamo/Documents/Codex/Map Overlap Tool/src/components/ui/section-header.tsx), [src/components/ui/info-card.tsx](/Users/ecandamo/Documents/Codex/Map Overlap Tool/src/components/ui/info-card.tsx)
- Showcase: `/design-system`

If you want future apps to look consistent, reuse these layers in this order:

1. Copy the token file and global theme contract first.
2. Reuse the primitives for buttons, fields, badges, and surfaces.
3. Reuse the patterns for common section layouts and summary cards.
4. Build app-specific screens from those pieces instead of copying page-level markup.

That is the correct path to a design system. A design system is not a single page style; it is a stable set of tokens, primitives, and patterns that multiple apps can share.

## API endpoints

- `GET /api/airports`
- `POST /api/airports`
- `PUT /api/airports/:iata`
- `DELETE /api/airports/:iata`
- `POST /api/airports/bulk-upload`
- `GET /api/auth/session`
- `POST /api/auth/login`
- `POST /api/auth/logout`

## Database schema

### `airports`

- `id` UUID primary key
- `iata` unique 3-letter code
- `city`
- `country`
- `region`
- `latitude`
- `longitude`
- `created_at`
- `updated_at`

### `admin_users`

- `id` UUID primary key
- `email` unique
- `password_hash`
- `created_at`
- `updated_at`

Admin login now supports a persisted `admin_users` table when `DATABASE_URL` is configured. If no DB admin user exists yet, the app still falls back to `ADMIN_EMAIL` and `ADMIN_PASSWORD` so local development stays simple.

## Local setup

1. Copy `.env.example` to `.env.local`.
2. Set `ADMIN_EMAIL`, `ADMIN_PASSWORD`, and `SESSION_SECRET`.
3. Install dependencies:

```bash
npm install
```

4. Start the app:

```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000).
6. Open [http://localhost:3000/admin](http://localhost:3000/admin) for airport admin.
7. Use the "Load demo data" button if you want to see the full experience immediately.

## MVP behavior notes

- Unknown IATA codes remain visible in validation panels and are excluded from the map until a matching airport reference exists.
- Region filtering updates the map, summary metrics, overlap ranking, and tables together.
- Bubble sizes share one scale across all three destination categories.
- Airport admin changes affect future matching and can also re-resolve already uploaded data during the current session.

## CSV formats

### Upload CSV format

```csv
IATA,volume
LHR,320
JFK,220
```

### Airport master CSV format

```csv
IATA,city,country,region,latitude,longitude
LHR,London,United Kingdom,Europe,51.47,-0.4543
```

Template file: `public/templates/airport-master-template.csv`

## Notes on deployment

- Current default persistence is `data/airports.json`, which is perfect for local use.
- If `DATABASE_URL` is set, the repository switches to Neon/Postgres-backed airport CRUD.
- For deployed environments, run `npm run db:seed-neon` once after setting `DATABASE_URL` to create tables and import the current airport/admin data into Neon.
- Bulk airport uploads use batched Postgres upserts for better performance on larger imports.
- The project structure is already aligned with Vercel deployment and Next.js API routes.

## Suggested production setup

1. Create a Neon project and copy its connection string into `DATABASE_URL`.
2. Set `ADMIN_EMAIL`, `ADMIN_PASSWORD`, and `SESSION_SECRET` in your environment.
3. Run `npm run db:seed-neon` to create tables, sync airport data, and create/update the admin user.
4. Deploy the app with the same `DATABASE_URL` and `SESSION_SECRET`.
