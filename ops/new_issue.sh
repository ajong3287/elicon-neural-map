#!/usr/bin/env bash
set -euo pipefail
if [ $# -lt 2 ]; then
  echo "Usage: ops/new_issue.sh ISSUE_ID \"Title\""
  exit 1
fi
ID="$1"
TITLE="$2"
OUT="issues/${ID}.md"
if [ -f "$OUT" ]; then
  echo "Already exists: $OUT"
  exit 1
fi
cp docs/TEMPLATES/ISSUE_REQ.md "$OUT"
perl -0777 -i -pe "s/<ISSUE_ID>/${ID}/g; s/<제목>/${TITLE}/g" "$OUT"
echo "Created $OUT"
