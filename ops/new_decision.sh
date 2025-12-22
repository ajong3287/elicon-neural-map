#!/usr/bin/env bash
set -euo pipefail

ID="${1:-}"
SLUG="${2:-}"

if [[ -z "$ID" || -z "$SLUG" ]]; then
  echo "usage: ops/new_decision.sh REQ-003 map_engine_persistence"
  exit 1
fi

mkdir -p docs/DECISIONS

STAMP="$(date +%Y%m%d)"
FILE="docs/DECISIONS/${STAMP}_${ID}_${SLUG}.md"

if [[ -f "$FILE" ]]; then
  echo "ERROR: already exists: $FILE"
  exit 1
fi

cat > "$FILE" <<EOF
[DECISION-${ID}-v0.1-LONG 제공]
# DECISION: ${ID} / ${SLUG}

- date: $(date +%Y-%m-%d)
- status: Proposed

## 결론(3줄 이내)
-
-
-

## 근거(증거 링크)
- docs/PROOFS/${STAMP}_${ID}_*.md

## 다음 액션(3개 이내)
- [ ]
- [ ]
- [ ]

[DECISION-${ID}-v0.1-LONG 제공완료]
EOF

echo "created: $FILE"
