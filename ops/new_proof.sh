#!/usr/bin/env bash
set -euo pipefail
if [ $# -lt 2 ]; then
  echo "Usage: ops/new_proof.sh ISSUE_ID topic_slug"
  exit 1
fi
ID="$1"
TOPIC="$2"
DATE="$(date +%Y%m%d)"
OUT="docs/PROOFS/${DATE}_${ID}_${TOPIC}.md"
cp docs/TEMPLATES/PROOF.md "$OUT"
perl -0777 -i -pe "s/<ISSUE_ID>/${ID}/g; s/<주제>/${TOPIC}/g; s/YYYY-MM-DD/$(date +%Y-%m-%d)/g" "$OUT"
echo "Created $OUT"
