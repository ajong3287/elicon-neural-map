# OPS Dashboard Usage Guide

**Version**: LOCAL-UI-v0.4
**Date**: 2025-12-22

---

## Routes

### `/ops` - Main Dashboard
- **Purpose**: Browse Issues, Proofs, Decisions
- **Features**:
  - Search/filter by REQ-xxx
  - Status badges for missing items
  - File metadata (size, mtime)
  - Direct links to file viewer

### `/ops/view` - File Viewer
- **Purpose**: Display file content
- **Security**: Path traversal protection
- **Format**: Raw markdown in monospace

### `/ops/today` - Today's Activity
- **Purpose**: Show files modified today
- **Filter**: Midnight cutoff (local time)
- **Categories**: Issue/Proof/Decision with color badges

---

## Status Badges

Issues table shows workflow completeness:
- **✓** - Complete (has proof + decision + evidence)
- **⚠ PROOF** - Missing proof file (PROOF-xxx.md)
- **⚠ DECISION** - Missing decision file (DECISION-xxx.md)
- **⚠ NO-EVIDENCE** - Decision exists but no `docs/PROOFS/` links

---

## File Naming Convention

- **Issues**: `REQ-001.md` → `issues/`
- **Proofs**: `PROOF-001.md` → `docs/PROOFS/`
- **Decisions**: `DECISION-001.md` → `docs/DECISIONS/`

Badges check ID matching: REQ-001 expects PROOF-001 and DECISION-001.

---

## Development Notes

- **Build**: Passes `pnpm build` (Next.js 14)
- **Server Components**: Uses `fs.promises` for file I/O
- **No External Packages**: Pure Next.js + Node.js built-ins
- **Security**: Path validation prevents directory traversal
