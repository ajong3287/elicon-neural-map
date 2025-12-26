# PRPACK v0.14

**목적**: Exit 0 확인 → 리베이스 → 푸시 → PR 템플릿 출력 (최종 마감)

## 핵심 결론 (1줄)

다음은 **최종 마감(v0.14)**으로, Exit 0 확인 → 리베이스(충돌 시 중단) → 푸시 → PR 템플릿 출력까지 한 번에 끝냅니다.

---

## 원샷 프롬프트

```
Claude Code(클로이)님, elicon-neural-map 작업을 PR 제출 가능한 상태로 마감해주세요. (v0.11~v0.13 완료 후 최종 단계)

원칙:
• 이 블록 상단/하단 태그 1쌍만 유지(추가 태그 금지)
• 불필요한 해설/요약/인사 금지
• "명령 + 출력 로그 원문" 그대로만 출력
• 진행 중 "Pontificating…"이면 esc 또는 ctrl+c로 즉시 중단 후 계속
• 외부 패키지 추가 금지
• pnpm build Exit 0 아니면 푸시/PR 단계 진행 금지(로그 출력 후 종료)
• rebase 충돌 시 해결 시도 금지(상태 로그만 출력 후 종료)

프로젝트 경로:
cd /Users/elicon_mark/Developer/개발02_슈퍼개발툴만들기/elicon-neural-map

0. 상태 스냅샷(원문)

• git status
• git branch --show-current
• git log --oneline -12

1. main 기준선 확인(원문)

• git checkout main
• git pull --ff-only
• pnpm build && echo $?

(주의) 0이 아니면:
• pnpm build 2>&1 | tail -200
• 종료

2. 작업 브랜치 복귀(원문)

• git checkout -
• git branch --show-current

3. main 기준 리베이스(원문)

• git rebase main

(충돌이면)
• git status
• git diff --name-only --diff-filter=U || true
• 종료

4. 최종 검증(원문)

• pnpm build && echo $?

(0이 아니면)
• pnpm build 2>&1 | tail -220
• 종료

5. 변경 파일/통계(원문)

• git diff --name-only main...HEAD
• git diff --stat main...HEAD
• git log --oneline main..HEAD

6. 푸시(원문)

• BR=$(git branch --show-current); echo $BR
• git push -u origin "$BR"

7. PR 템플릿 출력(텍스트로만)

[PR TEMPLATE]
Title: <예: Integrate ops UI + map suspense fix>

Summary:
• What: /ops Actions(명령 복사) UI 추가, /map Suspense boundary 수정
• Why: 빌드 Exit 0 복구 및 운영 워크플로우 단축

Changes:
• /ops: Actions 섹션 + 3 copy buttons + clipboard fallback + Copied! feedback
• /map: Server page + MapClient 분리, useSearchParams를 Suspense로 감쌈

Verification:
• pnpm build: Exit 0
• pnpm dev: /ops OK, /map OK

Risk:
• Low (UI 추가 + Next 권장 패턴 적용)

Rollback:
• revert: <커밋해시 1개>

[/PR TEMPLATE]

출력 규칙:
• 각 단계별로 명령 + 출력 로그 원문 그대로만 출력.
• 해설/요약/인사 금지.
```

---

## 예상 효과 & ROI

- **PR 템플릿까지 같이 내면** 리뷰어(본인 포함)가 "무엇이 바뀌었는지/어떻게 검증했는지"를 즉시 보고 결정해서 머지 리드타임이 줄어듭니다.

---

## 필요시 협업 제안

- **클로이**: v0.14 실행 + PR 템플릿 생성
- **자비스(나)**: PR 템플릿이 나오면, 그 텍스트를 기준으로 최종 PR 제목/요약을 더 짧고 강하게 정리해드리고, 머지 순서(ops→map vs map→ops) 리스크도 1줄로 확정해드립니다.

---

## 상태
- **생성일**: 2025-12-22
- **목적**: v0.11~v0.13 완료 후 최종 PR 제출 자동화
- **이전 버전**: v0.13 (PATCH)
- **다음 버전**: 완료 (최종 마감)
