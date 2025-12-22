#!/usr/bin/env bash
set -euo pipefail

ID="${1:-}"
SLUG="${2:-}"

if [[ -z "$ID" || -z "$SLUG" ]]; then
  echo "usage: ops/new_proof.sh REQ-003 v3.4-LONG_map_precheck"
  exit 1
fi

mkdir -p docs/PROOFS

STAMP="$(date +%Y%m%d)"
FILE="docs/PROOFS/${STAMP}_${ID}_${SLUG}.md"

if [[ -f "$FILE" ]]; then
  echo "ERROR: already exists: $FILE"
  exit 1
fi

cat > "$FILE" <<EOF
[PROOF-${ID}-v0.1-LONG 제공]
# PROOF: ${ID} / ${SLUG}

- date: $(date +%Y-%m-%d)
- rule: 원문 출력만(요약/의역/생략 금지)

## Output
(여기에 [M]~[P] 같은 원문 출력 붙여넣기)

[PROOF-${ID}-v0.1-LONG 제공완료]
EOF

echo "created: $FILE"
