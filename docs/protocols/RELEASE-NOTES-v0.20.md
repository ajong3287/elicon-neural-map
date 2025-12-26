# RELEASE-NOTES v0.20

**목적**: CHANGELOG/릴리즈 노트 정리 + 태그/버전 스냅샷 기록 + main 반영 준비

## 핵심 결론 (1줄)

다음은 마지막 마감으로, CHANGELOG/릴리즈 노트 정리 + 태그/버전 스냅샷 기록 + main 반영 준비까지 끝내는 v0.20-RELEASE-NOTES입니다.

---

## 원샷 프롬프트

```
Claude Code(클로이)님, elicon-neural-map 변경사항에 대한 CHANGELOG/릴리즈 노트 마감 정리를 진행해주세요.
목표: 기록(문서) + 버전 스냅샷 + 최종 build Exit 0 확인.

원칙:
• 이 블록 상단/하단 태그 1쌍만 유지(추가 태그 금지)
• 불필요한 해설/요약/인사 금지
• "명령 + 출력 로그 원문" 그대로만 출력
• 진행 중 "Pontificating…"이면 esc 또는 ctrl+c로 즉시 중단 후 계속
• 외부 패키지 추가 금지
• pnpm build Exit 0 아니면 문서/커밋 진행 금지(로그 출력 후 종료)

프로젝트 경로:
cd /Users/elicon_mark/Developer/개발02_슈퍼개발툴만들기/elicon-neural-map

0. 상태 스냅샷(원문)

• git status
• git branch --show-current
• git log --oneline -15

1. 최종 빌드 확인(원문)

• pnpm build && echo $?
(주의) 0이 아니면:
• pnpm build 2>&1 | tail -240
• 종료

2. CHANGELOG 파일 찾기(원문)

• ls -la CHANGELOG* docs* || true
• find . -maxdepth 3 -iname "changelog" -o -iname "release" -o -iname "version" | sed -n '1,220p' || true

3. 문서 업데이트(있으면 수정, 없으면 생성)

A) CHANGELOG.md가 있으면:
• Unreleased 섹션에 아래 항목이 있는지 확인하고 없으면 추가:
  • Added: /ops Actions(명령 복사) UI (OPS-ACTIONS-v0.3.1)
  • Fixed: /map useSearchParams Suspense boundary (MAP-SUSPENSE-v0.10.0)
  • Fixed: merge conflict/build restore patches (v0.17~v0.19, if applied)

B) CHANGELOG.md가 없으면:
• 루트에 CHANGELOG.md 생성하고 아래 템플릿 사용:

—– FILE: CHANGELOG.md —–
Changelog

Unreleased
• Added: /ops Actions(명령 복사) UI (OPS-ACTIONS-v0.3.1)
• Fixed: /map useSearchParams Suspense boundary (MAP-SUSPENSE-v0.10.0)
• Fixed: merge conflict/build restore patches (v0.17~v0.19, if applied)
—– END FILE —–

4. 릴리즈 노트(있으면 docs/RELEASE_NOTES.md, 없으면 생성)

• 아래 템플릿으로 docs/RELEASE_NOTES.md 생성 또는 갱신:

—– FILE: docs/RELEASE_NOTES.md —–
Release Notes

Unreleased

Highlights
• /ops: Actions 섹션에서 ops 스크립트 명령을 클릭 한 번으로 복사(clipboard fallback 포함)
• /map: useSearchParams 사용 위치를 Client로 분리하고 Suspense boundary 적용으로 build 안정화

Verification
• pnpm build: Exit 0
• pnpm dev: /ops OK, /map OK
—– END FILE —–

5. 문서 변경 확인(원문)

• git status
• git diff --stat

6. 커밋 1개(문서만)(원문)

• git add -A
• git commit -m "docs: update changelog + release notes (DOCS-v0.20.0)"
• git log --oneline -15

7. 푸시(원문)

• BR=$(git branch --show-current); echo $BR
• git push -u origin "$BR"

출력 규칙:
• 각 단계별로 명령 + 출력 로그 원문 그대로만 출력.
• 해설/요약/인사 금지.
```

---

## 예상 효과 & ROI

- **문서(CHANGELOG/RELEASE_NOTES)가 있으면** "어디까지 했는지"가 코드 밖에서도 추적되어, 새 창/새 세션에서도 의사결정 속도가 유지됩니다.

---

## 필요시 협업 제안

- **클로이**: v0.20 실행 + 문서 업데이트 완료
- **자비스(나)**: v0.20이 끝나면, PR 본문을 "릴리즈 노트 기반 5줄 요약"으로 압축해서 리뷰 시간을 더 줄이겠습니다.

---

## 문서 템플릿

### CHANGELOG.md
```markdown
Changelog

Unreleased
• Added: /ops Actions(명령 복사) UI (OPS-ACTIONS-v0.3.1)
• Fixed: /map useSearchParams Suspense boundary (MAP-SUSPENSE-v0.10.0)
• Fixed: merge conflict/build restore patches (v0.17~v0.19, if applied)
```

### docs/RELEASE_NOTES.md
```markdown
Release Notes

Unreleased

Highlights
• /ops: Actions 섹션에서 ops 스크립트 명령을 클릭 한 번으로 복사(clipboard fallback 포함)
• /map: useSearchParams 사용 위치를 Client로 분리하고 Suspense boundary 적용으로 build 안정화

Verification
• pnpm build: Exit 0
• pnpm dev: /ops OK, /map OK
```

---

## 상태
- **생성일**: 2025-12-22
- **목적**: CHANGELOG/릴리즈 노트 정리 및 main 반영 준비
- **이전 버전**: v0.19 (BUILD-FAIL-PATCH)
- **다음 버전**: 프로토콜 체인 종료 (필요 시 추가 버전)
