#!/usr/bin/env bash
set -euo pipefail
if [ $# -lt 2 ]; then
  echo "Usage: ops/new_decision.sh ISSUE_ID topic_slug"
  exit 1
fi
ID="$1"
TOPIC="$2"
DATE="$(date +%Y%m%d)"
OUT="docs/DECISIONS/${DATE}_${ID}_${TOPIC}.md"
cp docs/TEMPLATES/DECISION_ADR.md "$OUT"
perl -0777 -i -pe "s/<ISSUE_ID>/${ID}/g; s/<제목>/${TOPIC}/g; s/YYYY-MM-DD/$(date +%Y-%m-%d)/g" "$OUT"
echo "Created $OUT"
