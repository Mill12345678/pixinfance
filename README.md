# Finance HQ — Hệ Thống Quản Lý Tài Chính Kép

Next.js web app (Mobile web + Desktop admin) for dual-book finance management.
Spec: `../PRD_Features_Stories_v2.md`.

## Stack

- **Next.js 16** (App Router, React 19)
- **Supabase** (PostgreSQL) — auth, data, RLS
- **Google Drive API** — invoice/evidence image storage

## Setup

### 1. Database (Supabase Cloud)

1. Create a project at https://supabase.com/dashboard.
2. Open **SQL Editor** → paste the contents of `supabase/migrations/0001_init.sql` → **Run**.
3. Then paste `supabase/migrations/0002_categories_and_seed.sql` → **Run** (categories + admin_settings seeds).
4. Note your credentials from **Project Settings → API**:
   - Project URL
   - `anon` public key
   - `service_role` key

### 2. Google Drive (image storage)

Follow `../Google_Cloud_Service_Account_Guide.md`:

1. Create a Service Account + JSON key, rename it `google-credentials.json`.
2. Place it inside this folder (`webapp/`).
3. Create a Drive folder `Finance_Invoices`, share it with the service-account email as **Editor**.
4. Copy the folder ID from the URL (`drive.google.com/drive/folders/<FOLDER_ID>`).

### 3. Environment

```bash
copy .env.local.example .env.local
```

Fill in `.env.local`:

```
NEXT_PUBLIC_SUPABASE_URL=https://<ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon-key>
SUPABASE_SERVICE_ROLE_KEY=<service-role-key>
GOOGLE_DRIVE_SERVICE_ACCOUNT_FILE=./google-credentials.json
GOOGLE_DRIVE_INVOICE_FOLDER_ID=<drive-folder-id>
```

`.env.local` and `google-credentials.json` are git-ignored. Never commit them.

### 4. Run

```bash
npm install
npm run dev
```

Open http://localhost:3000. You'll be redirected to `/login` — sign up or sign in.
The first user created is `accountant`; change the role to `admin` in Supabase
(Table Editor → `profiles` → set `role = 'admin'`) to enable delete + admin settings.

## Auth & RLS

- Session cookie via `@supabase/ssr`; `src/proxy.ts` (Next 16 proxy) refreshes
  the session and protects pages.
- A DB trigger auto-creates a `profiles` row on signup (`handle_new_user`).
- API routes use the session client (RLS applies). Soft-delete is admin-only
  (enforced by DB trigger + UI).

## API Routes

| Route | Method | Purpose |
|---|---|---|
| `/api/auth/signin` · `/signup` · `/signout` · `/me` | POST/GET | Auth |
| `/api/transactions` | GET / POST | List / create transactions (+ `evidence_pending`, notification) |
| `/api/transactions/[id]` | PATCH / DELETE | Update / soft-delete (F7 status rules) |
| `/api/students` | GET | Search students for STEM income (F11) |
| `/api/notifications` | GET / POST | List + mark-read notifications (F13) |
| `/api/admin/categories` + `[id]` | GET/POST/PATCH/DELETE | Category CRUD (F14, admin) |
| `/api/admin/settings` | GET/POST | Alert thresholds (F14, admin) |
| `/api/upload` | POST | Upload evidence file to Google Drive |

## Pages

- `/` — Quick Add (F1/F2 + F10/F11 fields)
- `/dashboard` — F3 overview + F9 alerts + recent 20 + quick search
- `/ledger` — F5 DataGrid + F6 CRUD + F8 filters + CSV export
- `/analytics` — F8 monthly income/expense + by-niche charts
- `/notifications` — F13 notification center
- `/admin` — F14 admin settings (categories + thresholds)

## Project layout

```
src/
  proxy.ts                 # Auth guard (Next 16 proxy)
  app/
    login/                 # Sign in / sign up
    admin/                 # F14 settings (admin-only)
    analytics/             # F8 charts
    dashboard/             # F3 overview + F9 alerts
    ledger/                # F5/F6/F8
    notifications/         # F13
    api/
      auth/                # signin / signup / signout / me
      students/            # student lookup (F11)
      notifications/       # F13
      admin/               # categories + settings (F14)
      transactions/        # CRUD + debt_impact (PRD v2 §5.4) + F7 rules
      upload/              # Google Drive upload
  components/
    Sidebar.tsx            # AXIUS nav + unread badge
    QuickAddForm.tsx       # F1/F2 + F10/F11 fields
    LedgerClient.tsx       # filters + CRUD + CSV export (client)
    DashboardClient.tsx    # recent 20 + search + debt detail
    AnalyticsClient.tsx    # CSS bar charts
    NotificationsClient.tsx# F13 list
    AdminSettingsClient.tsx# F14 UI
  lib/
    supabase/              # client.ts (browser), server.ts (session+admin), middleware.ts, types.ts
    google/drive.ts        # Drive service-account upload
```

## Scripts

- `npm run dev` — dev server
- `npm run build` — production build
- `npm run lint` — ESLint
