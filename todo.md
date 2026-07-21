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
