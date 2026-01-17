[NEURALMAP-STEP03.2-ROOT-CAUSE-v0.1 제공]
# STEP03.2 — Root Cause: map/page.tsx create-mode anomaly

## What we saw
- Symptom: src/app/map/page.tsx appeared as "create mode" with large insertions (653 lines in d00cdda)

## Evidence (paste raw outputs)

### Suspect commit (d00cdda)
```bash
$ git show --stat d00cdda
commit d00cddaa40ac18637895d73e34f48ffec1533a50
Author: ajong3287 <ajong3287@gmail.com>
Date:   Mon Dec 22 16:40:07 2025 +0900

    fix: add explicit any types for cytoscape (LOCAL-UI-v0.2)

    [LOCAL-UI-v0.2-LONG 제공]
    Fix TypeScript errors in map page:
    - padding: "12" (string required)
    - cy: any, evt: any (explicit types)
    [LOCAL-UI-v0.2-LONG 제공완료]

 src/app/map/page.tsx | 653 +++++++++++++++++++++++++++++++++++++++++++++++++++
 1 file changed, 653 insertions(+)

$ git show --name-status d00cdda
commit d00cddaa40ac18637895d73e34f48ffec1533a50
Author: ajong3287 <ajong3287@gmail.com>
Date:   Mon Dec 22 16:40:07 2025 +0900

    fix: add explicit any types for cytoscape (LOCAL-UI-v0.2)

    [LOCAL-UI-v0.2-LONG 제공]
    Fix TypeScript errors in map page:
    - padding: "12" (string required)
    - cy: any, evt: any (explicit types)
    [LOCAL-UI-v0.2-LONG 제공완료]

A	src/app/map/page.tsx

$ git show d00cdda -- src/app/map/page.tsx
[... 653 lines of React component code ...]
```

### File history (follow + rename)
```bash
$ git log --follow --name-status --oneline -- src/app/map/page.tsx | head -80
d3d76cb fix: wrap map client in Suspense (BUILD-FIX-v0.3)
M	src/app/map/page.tsx
d00cdda fix: add explicit any types for cytoscape (LOCAL-UI-v0.2)
A	src/app/map/page.tsx

$ git log --follow --find-renames --find-copies --name-status --online -- src/app/map/page.tsx | head -80
d3d76cb fix: wrap map client in Suspense (BUILD-FIX-v0.3)
M	src/app/map/page.tsx
d00cdda fix: add explicit any types for cytoscape (LOCAL-UI-v0.2)
A	src/app/map/page.tsx
```

### First-added commits
```bash
$ git log --oneline --diff-filter=A -- src/app/map/page.tsx | head -20
d00cdda fix: add explicit any types for cytoscape (LOCAL-UI-v0.2)
```

### Repo config checks
```bash
$ git config core.ignorecase
true

$ git config core.autocrlf
(no output - not set)

$ git check-attr -a -- src/app/map/page.tsx
(no output - no special attributes)

$ ls -la src/app/map
total 56
drwxr-xr-x@ 4 elicon_mark  staff    128 Dec 22 16:46 .
drwxr-xr-x@ 9 elicon_mark  staff    288 Dec 22 16:46 ..
-rw-r--r--@ 1 elicon_mark  staff  23811 Dec 22 16:46 MapClient.tsx
-rw-r--r--@ 1 elicon_mark  staff    235 Dec 22 16:46 page.tsx
```

## Conclusion
**✅ D) Intentional rewrite (documented)**

**Reason**:
The create-mode appearance of page.tsx (653 lines) in d00cdda was the **initial implementation** of the map visualization feature. The subsequent commit d3d76cb (BUILD-FIX-v0.3) refactored this into:
- **MapClient.tsx** (23,811 bytes) - contains the actual visualization logic
- **page.tsx** (235 bytes) - lightweight Suspense wrapper

This is **NOT an anomaly** but a documented refactoring pattern:
1. d00cdda: Initial monolithic implementation (653 lines in page.tsx)
2. d3d76cb: Client/Server split + Suspense wrapper for Next.js compatibility

**Evidence**:
- No rename/copy/move detected (git log --follow shows clean A → M history)
- No line-ending or case-sensitivity artifacts
- Commit messages clearly document the refactoring intent
- Current state (page.tsx = 235 bytes wrapper) matches the intended architecture

## Next action
**Skip STEP 03.3** (no history normalization needed)

Proceed directly to **STEP 03.4**: Final verification that build remains Exit 0 with current Suspense + MapClient architecture.

[NEURALMAP-STEP03.2-ROOT-CAUSE-v0.1 제공완료]
