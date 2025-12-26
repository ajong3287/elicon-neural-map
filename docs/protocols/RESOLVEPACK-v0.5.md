# RESOLVEPACK v0.5

**목적**: 통합 중 충돌/빌드 실패 시 원인 확정 → 해결 → 재검증

## 핵심 결론 (1줄)

통합 과정에서 "충돌/빌드 실패가 났을 때" 즉시 원인 확정 → 해결 지시 → 재검증 → 최소 커밋까지 처리하는 RESOLVE 패킷입니다.

---

## 원샷 프롬프트

```
Claude Code(클로이)님, elicon-neural-map 통합 중 충돌 또는 빌드 실패가 발생한 상태입니다.
아래 절차로 "원인 로그 확정 → 해결 → Exit 0 재확인"만 수행해주세요.

원칙:
• 버전 태그 유지
• 불필요한 해설/요약/인사 금지
• "명령 + 출력 로그 원문" 그대로만 출력
• 진행 중 "Pontificating…"이면 esc 또는 ctrl+c로 즉시 중단 후 계속
• 외부 패키지 추가 금지
• 해결 후에도 build Exit 0 아니면 커밋 금지

프로젝트 경로:
cd /Users/elicon_mark/Developer/개발02_슈퍼개발툴만들기/elicon-neural-map

0. 현재 상태 스냅샷(원문)

• git status
• git branch --show-current
• git log --oneline -8
• pnpm -v
• node -v

1. 충돌 유형 분기(둘 중 하나만 해당될 것)

A) Merge conflict인 경우:

• git diff --name-only --diff-filter=U || true
• git diff || true
• (충돌 파일 목록이 나오면) 각 파일의 충돌 구간을 1개씩만 출력:
  • sed -n '1,240p' <파일명>
  • sed -n '241,520p' <파일명>

B) Build fail인 경우(충돌 없는데 실패):

• pnpm build 2>&1 | tee /tmp/build_fail.log
• tail -160 /tmp/build_fail.log

2. 해결 지시(자비스 규칙 적용)

(아래는 "원칙"이며, 실제 수정은 충돌/로그에 맞춰 수행)

[규칙-1] /map 관련 충돌:
• 최종 형태는 반드시:
  • src/app/map/page.tsx = Server Component + Suspense로 MapClient 감싸기
  • src/app/map/MapClient.tsx = "use client" + useSearchParams 여기만 사용
• useSearchParams가 page.tsx에 남아있으면 제거하고 MapClient로 이동

[규칙-2] /ops 관련 충돌:
• src/app/ops/page.tsx 는:
  • 상단 Actions 섹션 유지
  • Issue ID 기본 REQ-003
  • Title 기본 "build hygiene + ops workflow"
  • Copy 3버튼 + clipboard 실패 fallback(textarea select+copy)
  • Copied! 표시 유지
  • 외부 패키지 추가 금지

[규칙-3] 타입 shim 관련 충돌:
• react-cytoscapejs / cytoscape-fcose shim은 유지(타입 에러 재발 방지)

3. 수정 후 검증(원문)

• pnpm build && echo $?

(실패면)
• pnpm build 2>&1 | tail -200
• 종료(커밋 금지)

4. dev 확인(원문)

• pnpm dev
• URL 1줄 출력
• /map 접속 확인 1줄
• /ops 접속 확인 1줄

5. 커밋 1개(Exit 0일 때만)

• git add -A
• git commit -m "fix: resolve conflicts + restore build (RESOLVE-v0.3.5)"
• git log --oneline -10

출력 규칙:
• 각 단계별로 명령 실행 로그 원문을 그대로 붙여주세요.
• 불필요한 해설/인사/요약 금지.
```

---

## 예상 효과 & ROI

- **충돌/실패를 "감"으로 때우지 않고 로그 기반으로 원인 확정** → 규칙 기반 해결로 바꿔서, 보통 1-3시간 걸리는 디버깅을 **20-40분** 수준으로 압축합니다(특히 map Suspense는 재발률이 높아 ROI 큼).

---

## 필요시 협업 제안

- **클로이**: 위 패킷 실행 + 원문 로그만 전달
- **자비스(나)**: 로그에서 에러/충돌 구간을 보면, 파일별로 어떤 블록을 살리고 버릴지를 "라인 단위"로 지정하는 v0.6-LINEPATCH 지시로 바로 이어가겠습니다.

---

## 해결 규칙

### 규칙-1: /map 관련 충돌
**최종 구조**:
- `src/app/map/page.tsx`: Server Component + Suspense wrapper
- `src/app/map/MapClient.tsx`: "use client" + useSearchParams

**수정 방향**:
- useSearchParams가 page.tsx에 있으면 → MapClient로 이동
- page.tsx는 무조건 Suspense boundary 유지

### 규칙-2: /ops 관련 충돌
**최종 구조**:
- Actions 섹션 상단 배치
- 3개 버튼: new issue, new proof, new decision
- clipboard API + fallback (textarea select+copy)

**수정 방향**:
- Actions 섹션 제거된 경우 → 복원
- 기본값 변경된 경우 → REQ-003, "build hygiene + ops workflow"로 복원

### 규칙-3: 타입 shim 관련
**유지 파일**:
- `react-cytoscapejs.d.ts`
- `cytoscape-fcose.d.ts`

**수정 방향**:
- shim 파일 삭제된 경우 → 복원 (타입 에러 재발 방지)

---

## 상태
- **생성일**: 2025-12-22
- **목적**: 통합 과정 충돌/빌드 실패 해결 자동화
- **다음 버전**: v0.6-LINEPATCH (라인 단위 패치)
