# Changelog

All notable changes to this project will be documented in this file.

## [Unreleased] - 2026-01-26

### Removed
- Removed unused `app/my-orders` directory (legacy duplicate).
- Removed unused `xlsx` dependency (replaced by `exceljs`).
- Archived root clutter scripts to `_archive/`:
  - `debug_api.js`, `debug_categories.js`, `debug_db.js`, `debug_deadline.js`
  - `repair_db.bat`, `run-dev.bat`, `start.bat`, `start_server.bat`
  - `clear_deadline.sql`
  - `DEPLOY.md`, `QUICK_START.md` (merged into main instructions).

### Changed
- **Renamed** `app/mijn-bestellingen` to `app/my-orders` for English consistency.
- **Refactored** `app/page.tsx`:
  - Split large file into components: `HomeHeader`, `ProductFilterBar`, `ProductGrid`.
  - Moved components to `components/home/`.
- **Restructured** Seed Data:
  - Moved `seed-products.ts` and json files to `prisma/seeds/`.
  - Updated imports in `prisma/seed.ts` and `app/api/products/route.ts`.
- **Updated** Sidebar navigation to point to `/my-orders`.

### Added
- Added `smoke-test` script to `package.json` (`npm run smoke-test` runs a build check).
- Created `components/home/` directory for page-specific components.
