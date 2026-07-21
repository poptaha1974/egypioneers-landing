# Project TODO

- [x] Fix filesystem corruption and reinstall node_modules
- [x] Fix pnpm version mismatch (packageManager: pnpm@10.4.1)
- [x] Remove stale wouter@3.7.1 patch from patchedDependencies
- [x] Create leads table in database schema (drizzle/schema.ts)
- [x] Run database migration (CREATE TABLE leads)
- [x] Add THINC Intent Score calculation in server/db.ts
- [x] Add leads tRPC router (submit, list, byStatus) in server/routers.ts
- [x] Connect Home.tsx form to tRPC leads.submit mutation
- [x] Keep webhook (n8n) as parallel fallback for lead submission
- [x] Add vitest test for leads submission endpoint
- [x] Create Admin Dashboard page with leads table (filterable by HOT/WARM/COLD)
- [x] Add search functionality in dashboard (by name, phone, email)
- [x] Add Excel/CSV export button in dashboard
- [x] Improve Success Animation in the form (confetti/checkmark animation)
- [x] Auto-clear form fields after successful submission
- [x] Register dashboard route in App.tsx (admin-only)
