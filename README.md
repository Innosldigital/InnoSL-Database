# Innovation SL — Ecosystem Intelligence Platform

A full-stack digital database system for Innovation Sierra Leone.
Built with Next.js 14, Supabase (PostgreSQL), Clerk auth, and Python workers.

---

## Project structure

```
innovationsl/
├── frontend/                    # Next.js 14 web application
│   ├── app/
│   │   ├── dashboard/           # Analytics dashboard
│   │   ├── people/              # Beneficiary registry + profiles
│   │   │   └── [id]/            # Individual person profile
│   │   ├── events/              # Events & attendance
│   │   ├── pitches/             # Pitch competitions
│   │   ├── training/            # Training & workshops
│   │   ├── cohorts/             # Incubation & acceleration
│   │   ├── grants/              # Grants & capital
│   │   ├── diagnostics/         # Business diagnostics
│   │   ├── reports/             # Impact reports
│   │   ├── import/              # Data import & cleaning tool
│   │   └── api/                 # API routes
│   ├── components/
│   │   ├── shared/              # Sidebar, Topbar, PageHeader, YearFilter
│   │   ├── dashboard/           # KPIGrid, charts, equity panel
│   │   ├── people/              # PeopleTable, PersonHero, PersonTimeline…
│   │   └── import/              # Upload, FieldMapper, ValidationPanel…
│   ├── lib/
│   │   ├── supabase.ts          # Supabase client helpers
│   │   ├── queries.ts           # All DB queries
│   │   ├── cleaning-engine.ts   # Client-side cleaning rules
│   │   └── utils.ts             # Helpers, formatters, avatars
│   └── types/index.ts           # All TypeScript types
│
├── backend/
│   ├── workers/
│   │   ├── cleaning_worker.py   # Nightly data cleaner
│   │   └── sync_worker.py       # Google Drive sync
│   └── requirements.txt
│
└── database/
    ├── migrations/              # SQL schema files
    └── seeds/                   # Seed data scripts
```

---

## Quick start

### 1. Clone and install

```bash
git clone <your-repo>
cd innovationsl/frontend
npm install
```

### 2. Environment variables

```bash
cp .env.example .env.local
# Fill in your Supabase URL, anon key, and Clerk keys
```

### 3. Run the database schema

Open `database/migrations/001_initial_schema.sql` in your Supabase SQL editor and run it.

### 4. Start the frontend

```bash
npm run dev
# → http://localhost:3000
```

### 5. Start backend workers (optional — for Drive sync)

```bash
cd backend
pip install -r requirements.txt
python workers/sync_worker.py
```

---

## Environment variables needed

| Variable | Where to get it |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project → Settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase project → Settings → API |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase project → Settings → API |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Clerk dashboard → API Keys |
| `CLERK_SECRET_KEY` | Clerk dashboard → API Keys |
| `GOOGLE_CLIENT_ID` | Google Cloud Console → Credentials |
| `GOOGLE_CLIENT_SECRET` | Google Cloud Console → Credentials |
| `GOOGLE_REFRESH_TOKEN` | OAuth2 flow |
| `DRIVE_ROOT_FOLDER_ID` | Google Drive folder URL |

---

## User roles (set in Clerk metadata)

| Role | Access |
|---|---|
| `superadmin` | Everything including audit log and user management |
| `admin` | Full data access, import approval |
| `management` | Analytics, reports, read-only financials |
| `staff` | Data entry, import, cleaning queue |
| `donor` | Their programme dashboards only |
| `public` | Aggregate impact stats only |

Set a user's role in Clerk Dashboard → Users → select user → Metadata:
```json
{ "role": "staff" }
```

---

## Deployment

**Frontend** → Vercel (connect GitHub repo, set env vars)
**Backend workers** → Railway (Python service, set env vars)
**Database** → Supabase (already hosted)
**CDN** → Cloudflare (proxy Vercel domain for SL performance)

---

Built by: Ngevao Sesay (CTO) · Innovation Sierra Leone · 2026
