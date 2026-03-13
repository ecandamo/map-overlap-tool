# Map Overlap Tool

Local-first MVP for comparing API hotel contract destinations against prospect client layover destinations on a world map.

## Recommended stack

- Framework: Next.js App Router with React + TypeScript
- Styling: Tailwind CSS v4
- Map: `react-simple-maps` + `world-atlas`
- CSV parsing: `papaparse`
- Validation: `zod`
- State management: `zustand`
- Backend approach: local file-backed repository by default, Neon/Postgres-ready schema for later deployment

## Architecture

- `src/app`: routes, pages, layouts, API endpoints
- `src/components`: reusable UI for uploads, map, metrics, tables, theme, and admin
- `src/lib`: parsing, normalization, metrics, auth, repository abstraction, shared types
- `src/data`: built-in seed airport reference data
- `public/templates`: sample upload templates
- `public/demo`: demo CSVs
- `data/airports.json`: local airport override storage for admin edits
- `db/schema.sql`: Neon/Postgres schema for future deployment

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

## API endpoints

- `GET /api/airports`
- `POST /api/airports`
- `PUT /api/airports/:iata`
- `DELETE /api/airports/:iata`
- `POST /api/airports/bulk-upload`
- `GET /api/auth/session`
- `POST /api/auth/login`
- `POST /api/auth/logout`

## Database schema for later Neon/Postgres use

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

The live MVP uses environment-based admin credentials for simple local setup, but the schema is included for a future persisted admin table.

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
IATA,city,country,region,volume
LHR,London,United Kingdom,Europe,320
JFK,New York,United States,North America,220
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
- The project structure is already aligned with Vercel deployment and Next.js API routes.
