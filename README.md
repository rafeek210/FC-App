# Fitness Management App

## Setup
1. Copy `.env.local.example` to `.env.local` and fill in your Supabase Project URL and anon key (Project Settings > Data API, and Project Settings > API Keys > Legacy API Keys).
2. `npm install`
3. `npm run dev`

## Database
Run `db/schema.sql` in the Supabase SQL Editor before first use.

## Roles
- /admin — Admin dashboard
- /trainer — Trainer dashboard
- /client — Client dashboard
Role-based access is enforced in `src/proxy.ts` (edge-layer redirect) and `src/lib/auth.ts` (`requireRole`, checked again in every page per CVE-2025-29927 guidance — never rely on proxy/middleware alone for auth).
