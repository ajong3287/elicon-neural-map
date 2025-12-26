# PRPACK v0.8

**목적**: Exit 0 복구 후 PR 생성/리뷰/머지까지 한 번에 마감

## 핵심 결론 (1줄)

Exit 0 복구 완료 후, PR 생성/리뷰/머지까지 "한 번에 깔끔하게" 마감하는 PRPACK입니다.

---

## 원샷 프롬프트

```
Claude Code(클로이)님, elicon-neural-map 작업을 PR 제출 가능한 상태로 마감해주세요.

원칙:
• 버전 태그 유지(이 블록의 상단/하단 태그만 사용)
• 불필요한 해설/요약/인사 금지
• "명령 + 출력 로그 원문" 그대로만 출력
• 진행 중 "Pontificating…"이면 esc 또는 ctrl+c로 즉시 중단 후 계속
• 외부 패키지 추가 금지
• build Exit 0 아니면 PR 단계 진행 금지(로그 출력 후 종료)

프로젝트 경로:
cd /Users/elicon_mark/Developer/개발02_슈퍼개발툴만들기/elicon-neural-map

0. 상태 스냅샷(원문)

• git status
• git branch --show-current
• git log --oneline -12

1. main 최신화 + 기준선 확인(원문)

• git checkout main
• git pull --ff-only
• pnpm build && echo $?

(주의) 0이 아니면:
• pnpm build 2>&1 | tail -200
• 종료

2. 작업 브랜치로 복귀(현재 작업 브랜치가 무엇인지 확인 후)(원문)

• git checkout -
• git branch --show-current

3. main 기준으로 리베이스(충돌 시 중단)(원문)

• git rebase main

(충돌이면)
• git status
• git diff --name-only --diff-filter=U || true
• 종료(해결 시도 금지)

4. 최종 검증(원문)

• pnpm build && echo $?

(0이 아니면)
• pnpm build 2>&1 | tail -220
• 종료

5. 변경 파일 목록/요약(원문)

• git diff --name-only main...HEAD
• git diff --stat main...HEAD

6. CHANGELOG 반영(존재 시)

• ls -la CHANGELOG* docs* || true
• find . -maxdepth 3 -iname "changelog" | sed -n '1,120p' || true

(CHANGELOG.md가 있으면)
• Unreleased 섹션 하위에 아래 항목이 있는지 확인하고 없으면 추가:
  • Added: /ops Actions(명령 복사) UI (OPS-ACTIONS-v0.3.1)
  • Fixed: /map Suspense boundary for useSearchParams (MAP-SUSPENSE-v0.3.2)
  • Fixed: map page tracking recovery if needed (MAP-RECOVER-v0.3.3)

7. 푸시(원문)

• BR=$(git branch --show-current); echo $BR
• git push -u origin "$BR"

8. PR 본문 템플릿 생성(텍스트로만 출력)

아래 형식으로 PR 설명을 "그대로 복사 가능"하게 출력하세요.

[PR TEMPLATE]
Title: <브랜치 목적 요약>

Summary:
• What: (무엇을 추가/수정했는지 3줄 이내)
• Why: (왜 필요한지 2줄 이내)

Changes:
• /ops: Actions 섹션(명령 복사 3버튼 + fallback + Copied! 표시)
• /map: useSearchParams Suspense boundary (page server + MapClient client)

Verification:
• pnpm build: Exit 0
• pnpm dev: /ops OK, /map OK

Risk:
• Low/Med/High 중 택1 + 근거 1줄

Rollback:
• revert 커밋 해시 1개로 가능(커밋 해시 기입)
[/PR TEMPLATE]

출력 규칙:
• 각 단계별로 명령 + 출력 로그 원문 그대로 붙여주세요.
• 해설/요약/인사 금지.
```

---

## 예상 효과 & ROI

- **"리베이스 + Exit 0 + PR 템플릿"까지 묶어서 마감**하면, PR 리뷰/머지 판단이 빨라져 의사결정 리드타임이 확 줄고(재질문 감소) 재작업 확률이 내려갑니다.

---

## 필요시 협업 제안

- **클로이**: v0.8 실행 + PR 템플릿 출력
- **자비스(나)**: 템플릿 기반으로 PR 제목/요약 문구 최적화 + 머지 순서(ops vs map) 리스크 평가까지 바로 확정 지시합니다.

---

## PR 템플릿 항목

### Title
- 브랜치 목적을 한 줄로 요약
- 예: "feat: add ops actions UI + fix map suspense"

### Summary
- **What**: 무엇을 추가/수정했는지 (3줄 이내)
- **Why**: 왜 필요한지 (2줄 이내)

### Changes
- 파일/기능별 주요 변경사항 나열
- /ops, /map 등 경로별로 구분

### Verification
- 빌드 성공 여부 (Exit 0)
- 수동 테스트 결과 (/ops OK, /map OK)

### Risk
- **Low**: 기존 기능 영향 없음
- **Med**: 일부 기능 수정, 테스트 필요
- **High**: 전체 구조 변경, 신중한 리뷰 필요

### Rollback
- revert 가능 커밋 해시 명시
- 롤백 절차 간단히 설명

---

## 체크리스트

### PR 제출 전
- [ ] main 기준 리베이스 완료
- [ ] pnpm build Exit 0 확인
- [ ] /ops, /map 수동 테스트 완료
- [ ] CHANGELOG 업데이트
- [ ] 커밋 메시지 정리 (필요 시)
- [ ] 브랜치 푸시 완료

### PR 생성 후
- [ ] PR 템플릿 작성
- [ ] 리뷰어 지정
- [ ] 라벨 추가 (feat, fix, chore 등)
- [ ] 마일스톤 설정 (해당 시)

---

## 리베이스 충돌 처리

**충돌 발생 시**:
1. 즉시 중단 (해결 시도 금지)
2. 상태 로그 출력
3. RESOLVEPACK v0.5 → LINEPATCHPACK v0.6 → PATCHSCRIPT v0.7 순서로 해결
4. 해결 후 다시 PRPACK v0.8 실행

**충돌 회피 전략**:
- main 자주 당겨오기 (git pull --ff-only)
- 작업 브랜치 작게 유지
- 빠른 머지 주기

---

## 상태
- **생성일**: 2025-12-22
- **목적**: PR 생성/리뷰/머지 마감 자동화
- **이전 버전**: v0.7 (PATCHSCRIPT)
- **다음 버전**: v0.9 (예정)
