# CHANGELOG

All notable changes to elicon-neural-map will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [Unreleased]

### Planned
- Healthcheck script for /ops workflow validation
- Auto-migration from issues/ to docs/PROOFS/DECISIONS/

---

## [local-ui-v0.4] - 2025-12-22

### Added
- **Status badges** in /ops dashboard:
  - ⚠ PROOF: Missing proof file (PROOF-xxx.md)
  - ⚠ DECISION: Missing decision file (DECISION-xxx.md)
  - ⚠ NO-EVIDENCE: Decision exists but no `docs/PROOFS/` links
- **/ops/today** route: Shows files modified today (mtime-based)
  - Category badges (Issue/Proof/Decision)
  - Midnight cutoff for "today" filter
- **docs/OPS_USAGE.md**: Usage guide for /ops dashboard

### Changed
- Issues table: Added "Status" column with completeness indicators

### Notes
- Feature branch: `feat/LOCAL-UI-002`
- Merge status: Pending (awaiting approval)
- Build: ✅ Passing (Exit 0)

---

## [local-ui-v0.2] - 2025-12-22

### Added
- **/ops** dashboard: Browse Issues, Proofs, Decisions via browser
  - Search/filter by REQ-xxx
  - File metadata (size, mtime)
  - Direct links to file viewer
- **/ops/view** route: Display markdown file content
  - Security: Path traversal protection
  - Raw content in monospace
- **Type shims** for untyped packages:
  - `src/types/react-cytoscapejs.d.ts`
  - `src/types/cytoscape-fcose.d.ts`

### Fixed
- TypeScript errors blocking production build:
  - react-cytoscapejs module not found → type shim
  - cytoscape-fcose module not found → type shim
  - padding type mismatch → changed to string ("12")
  - Implicit any types → added explicit : any
- Next.js prerendering error:
  - useSearchParams() Suspense boundary → split MapClient.tsx
  - Server/Client component separation

### Notes
- Merge status: ✅ Merged to main
- Tag: `local-ui-v0.2`
- Build: ✅ Passing (Exit 0)

---

## Version Naming Convention

- **PATCH** (v0.2.1 → v0.2.2): Documentation, wording, no functional changes
- **MINOR** (v0.2.x → v0.3.0): New features (e.g., badges, routes)
- **MAJOR** (v0.x → v1.0): Breaking changes (workflow, folder structure, compatibility)

---

## Tag Message Format

All tags follow this 3-line structure:

1. **Added/Changed**: Major features or fixes
2. **Notes**: Build status, dependencies
3. **Risks**: Known issues (if any)

Example:
```
Added: /ops dashboard + type shims + Suspense fix
Notes: Build passing, no external packages
Risks: None
```
