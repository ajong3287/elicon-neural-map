# NEWCHAT-PACKET v0.2

**목적**: v0.1 개선 - 더 상세한 검증 절차와 예외 처리 추가

## 핵심 결론 (1줄)

아래 "원샷 프롬프트"를 새 창 첫 메시지로 붙여넣으면, 상태 점검 → main 기준선 빌드 확인 → A안(명령 복사) 구현 → 로컬 검증 → 단일 커밋까지 한 번에 끝냅니다.

---

## 원샷 프롬프트

```
Claude Code(클로이)님, elicon-neural-map 프로젝트 작업 부탁드립니다.

원칙
• 버전 태그 유지, 불필요한 설명/요약/인사 금지
• "실행 명령 + 출력 로그 원문" 위주로만 응답
• (중요) 진행 중 "Pontificating…"이면 esc 또는 ctrl+c로 즉시 중단 후 계속 진행
• 외부 패키지 추가 금지

프로젝트 경로
cd /Users/elicon_mark/Developer/개발02_슈퍼개발툴만들기/elicon-neural-map

---

0) 현재 상태 점검 (원문 출력)

아래를 순서대로 실행하고, 각 출력 로그를 그대로 붙여주세요.
• pwd
• node -v
• pnpm -v
• git status
• git branch --show-current
• git remote -v
• git log --oneline -10
• ls -la ops || true
• pnpm build && echo $?

만약 여기서 build가 실패하면:
• 실패 로그 원문 그대로 출력
• 그 즉시 중단하지 말고 pnpm -s build도 1회 실행하여 로그 원문 출력 후 다음 단계로 진행하지 말고 보고

---

1) main 기준선 확보 (빌드 0 확인 후 진행)
• git checkout main
• git pull --ff-only
• pnpm build && echo $?

main에서 build가 실패하면: 실패 로그 원문 출력 후 즉시 종료(구현 진행 금지)

---

2) A안 구현: /ops에 "Actions(명령 복사)" 섹션 추가
• git checkout -b feat/OPS-ACTIONS-001

구현 파일(기본): src/app/ops/page.tsx
(필요 시 컴포넌트 분리 가능. 단, 외부 패키지 금지)

요구사항
a) /ops 페이지 상단에 Actions 섹션 추가
b) 입력 2개
• Issue ID (기본값: REQ-003)
• Title (기본값: build hygiene + ops workflow)
c) 버튼 3개(클립보드 복사)

1. Copy: new issue
   • 복사 문자열: ops/new_issue.sh REQ-003 "Title..."
   • (Issue ID, Title을 입력값으로 치환 / Title은 쌍따옴표 포함)

2. Copy: new proof
   • proof_slug 입력값(기본값 proof_slug)을 별도 입력으로 받거나, 버튼 클릭 시 prompt로 받아도 됨
   • 복사 문자열: ops/new_proof.sh REQ-003 proof_slug

3. Copy: new decision
   • decision_slug 입력값(기본값 decision_slug)을 별도 입력으로 받거나, 버튼 클릭 시 prompt로 받아도 됨
   • 복사 문자열: ops/new_decision.sh REQ-003 decision_slug

d) navigator.clipboard.writeText 실패 시 textarea에 문자열 삽입 → select() → execCommand('copy') fallback 구현
e) 복사 성공 시 "Copied!" 1줄 표시(예: 1.5초 후 자동 사라짐이면 더 좋음)
f) 외부 패키지 추가 금지

---

3) 검증(원문 출력)
• pnpm build && echo $?
• pnpm dev

그리고 dev 서버가 뜨면, 아래를 원문 1줄로 출력:
• 접속 URL 1줄(포트 포함)

추가로, /ops 화면에서:
• 버튼 1개를 실제 클릭하여 복사가 되었는지 확인
• 확인 결과를 1줄로만 출력(예: "Copy new issue: OK")

---

4) 커밋(1개) + 로그 출력
• git add -A
• git commit -m "feat: ops actions command copier (OPS-ACTIONS-v0.3.1)"
• git log --oneline -10

---

출력 규칙(반복)
• 각 단계별로 명령 + 출력 로그 원문을 그대로 붙여주세요.
• 불필요한 해설/인사/요약 금지.
```

---

## 예상 효과 & ROI

• **의사결정/실행 시간 절감**: ops 스크립트 실행 명령을 화면에서 즉시 복사 → 반복 입력/오타 제거로 작업당 1~3분 절감(하루 10회면 10~30분).
• **빌드 안정성**: main 기준선 빌드 0 확인 후 진행 → "작업했는데 원래 깨져있었음" 리스크 차단(재작업 비용 최소화).
• **운영 품질**: 단일 커밋/명확한 버전 태깅으로 PR/리뷰 시간 단축.

---

## 필요시 협업 제안

• **클로이(Claude Code)**: 위 원샷 실행 + 구현/로그 원문 제공
• **자비스(나)**: 클로이 로그 기반으로 즉시 코드 리뷰 포인트(UX/예외처리/버전규칙/Changelog 반영 여부) 체크리스트 제공, 다음 v0.3.2 패치 항목(UX 미세개선/슬러그 입력 UI 고정 등) 분리 지시
• **제미나이**: (선택) UI 마이크로카피/레이아웃 2~3안만 빠르게 제안(코드 변경은 클로이가 담당)

---

## 상태
- **생성일**: 2025-12-22
- **v0.1 대비 개선점**:
  - 더 상세한 환경 점검 (pwd, node -v, pnpm -v)
  - git pull --ff-only 추가
  - 빌드 실패 시 대응 절차 명시
  - slug 입력 방식 유연화 (별도 입력 또는 prompt)
  - 협업 제안 섹션 추가
