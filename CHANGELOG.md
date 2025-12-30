# Changelog

All notable changes to elicon-neural-map will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.8] - 2025-12-30

### Added - STEP05.35: Seed Test Data API
- **Seed API** (`/api/seed`)
  - `GET /api/seed?kind=dev` - Seed 4 dev nodes (Button, useTheme, formatDate, Card)
  - `GET /api/seed?kind=pm` - Seed 5 PM nodes (Dashboard, api, User, Chart, data)
  - Auto-write to `.data/graph.json`
  - Production blocked (403) via `NODE_ENV=production` check

- **Share Button Auto-Seed**
  - Share Dev/PM buttons now auto-seed test data before package creation
  - Progressive UX messages: 🌱 Seeding → ✅ Seeded X nodes → 🔄 Creating Package
  - Error handling: seed failure → fallback to existing graph

- **E2E Tests** (Playwright)
  - `tests/e2e/seed-dev.spec.ts` - 3 tests for Dev seed flow
  - `tests/e2e/seed-pm.spec.ts` - 3 tests for PM seed flow
  - `playwright.config.ts` - Auto-start dev server configuration
  - `tests/README.md` - Setup guide and ROI metrics

### Changed
- MapClient: Added seed logic in `createSharePackage()` (Line 1221-1256)
- Graph loading: Auto-reload after successful seed

### Performance
- **Time Savings**: Manual test 30 min → Automated 1 min (29 min/cycle)
- **Monthly Savings**: 19.3 hours (40 cycles × 29 min)
- **Regression Prevention**: Production seed leak, graph persistence, node rendering

### Dependencies
- Added `@playwright/test@1.57.0` (devDependency)

---

## [0.1.7] - 2025-12-30

### Fixed - STEP05.34: Graph 404 Handling
- **TypeError Fix**: `graph.nodes.map` undefined error
- Added `r.ok` check to ignore 404 responses
- Added `g.nodes` validation before `setGraph`
- Graceful empty state when no graph data exists

---

## [0.1.6] - 2025-12-30

### Added - STEP05.32: Button Feedback
- **Share Dev/PM Button Responsiveness**
  - Immediate click feedback: `🔄 Creating Package...`
  - Upload progress: `⬆️ Uploading Package...`
  - Condition messages:
    - `ℹ️ Auto Upload is OFF - clipboard only`
    - `⚠️ Share Upload Token missing - clipboard only`

### Changed
- MapClient: Always show status message on button click (Line 1215-1295)

---

## [0.1.5] - 2025-12-30

### Fixed - STEP05.31: Graph Route Conflict
- **SyntaxError Resolution**: Removed `public/graph.json`
- Eliminated conflict between static file and API route
- `/graph.json` now properly returns JSON from API route
- Console error loop eliminated (500 → clean)

---

## Earlier Versions

See Git history for earlier version details.

---

## Version Format

**MAJOR.MINOR.PATCH**
- **MAJOR**: Breaking changes
- **MINOR**: New features (backward-compatible)
- **PATCH**: Bug fixes (backward-compatible)

## Categories

- **Added**: New features
- **Changed**: Changes to existing features
- **Deprecated**: Soon-to-be removed features
- **Removed**: Removed features
- **Fixed**: Bug fixes
- **Security**: Security improvements
- **Performance**: Performance improvements
- **Dependencies**: Dependency updates
