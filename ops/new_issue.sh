#!/usr/bin/env bash
set -euo pipefail

ID="${1:-}"
TITLE="${2:-}"

if [[ -z "$ID" || -z "$TITLE" ]]; then
  echo "usage: ops/new_issue.sh REQ-003 \"short title\""
  exit 1
fi

mkdir -p issues

DATE="$(date +%Y-%m-%d)"
FILE="issues/${ID}.md"

if [[ -f "$FILE" ]]; then
  echo "ERROR: already exists: $FILE"
  exit 1
fi

cat > "$FILE" <<EOF
[${ID}-v0.1-LONG 제공]
# ISSUE: ${ID} / ${TITLE}

## 목적(1줄)
-

## 범위
-

## 작업 모드
- DOC-ONLY → PROOF(LOCK) → DECISION → CODE-CHANGE

## 금지
- src 변경은 Decision 승인 전 금지
- 출력 요약/의역/생략 금지(Proof는 원문만)

## 완료조건(체크리스트)
- [ ] docs/PROOFS/*${ID}*.md 생성(원문 출력 포함)
- [ ] docs/DECISIONS/*${ID}*.md 생성(결론3줄+다음액션3개)
- [ ] pnpm build (Exit 0)  (필요 작업일 때만)

## 진행 로그
- ${DATE}: created
[${ID}-v0.1-LONG 제공완료]
EOF

echo "created: $FILE"
