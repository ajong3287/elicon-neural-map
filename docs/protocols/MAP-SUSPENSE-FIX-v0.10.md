# MAP-SUSPENSE-FIX v0.10

**목적**: /map 빌드 실패(useSearchParams Suspense)를 확정 패턴으로 해결

## 핵심 결론 (1줄)

/map Suspense를 무조건 끝내는 확정 지시로, 태그 1쌍 고정 + Exit 0까지 게이트를 걸었습니다.

---

## 원샷 프롬프트

```
Claude Code(클로이)님, elicon-neural-map에서 /map 빌드 실패(useSearchParams Suspense)를 확정 패턴으로 해결해주세요.

원칙:
• 이 블록 상단/하단 태그 1쌍만 유지(추가 태그 금지)
• 불필요한 해설/요약/인사 금지
• "명령 + 출력 로그 원문" 그대로만 출력
• 진행 중 "Pontificating…"이면 esc 또는 ctrl+c로 즉시 중단 후 계속
• 외부 패키지 추가 금지
• pnpm build Exit 0 아니면 커밋 금지

프로젝트 경로:
cd /Users/elicon_mark/Developer/개발02_슈퍼개발툴만들기/elicon-neural-map

0. 기준선 확인(원문)

• git status
• git branch --show-current
• pnpm build && echo $?

(주의) 여기서 이미 0이면: 아래 수정 없이 종료하고 "ALREADY_OK" 1줄만 출력

1. 작업 브랜치 생성

• git checkout -b fix/MAP-SUSPENSE-001

2. 파일 분리로 해결(강제)

A) src/app/map/MapClient.tsx 새로 생성(없으면 생성, 있으면 덮어쓰기)

• 내용은 아래를 그대로 사용:

—– FILE: src/app/map/MapClient.tsx —–
"use client";

import { useSearchParams } from "next/navigation";

export default function MapClient() {
  const sp = useSearchParams();
  const q = sp.get("q") ?? "";

  return (
    <div style={{ padding: 12 }}>
      <div style={{ fontWeight: 600 }}>Map</div>
      <div>q: {q}</div>
    </div>
  );
}
—– END FILE —–

B) src/app/map/page.tsx 수정(서버 컴포넌트 유지 + Suspense로 감싸기)

—– FILE: src/app/map/page.tsx —–
import { Suspense } from "react";
import MapClient from "./MapClient";

export default function MapPage() {
  return (
    <Suspense fallback={<div>Loading map…</div>}>
      <MapClient />
    </Suspense>
  );
}
—– END FILE —–

주의:
• useSearchParams()가 page.tsx에 남아있으면 안 됨
• 외부 패키지 추가 금지

3. 검증(원문)

• pnpm build && echo $?

(실패면)
• pnpm build 2>&1 | tail -200
• 종료(커밋 금지)

4. dev 확인(원문)

• pnpm dev
• URL 1줄 출력(포트 포함)
• /map 접속 확인 1줄("MAP_OK")

5. 커밋 1개(Exit 0일 때만)

• git add -A
• git commit -m "fix: wrap map searchparams in suspense (MAP-SUSPENSE-v0.10.0)"
• git log --oneline -12

출력 규칙:
• 각 단계별로 명령 + 출력 로그 원문 그대로 붙여주세요.
• 해설/요약/인사 금지.
```

---

## 예상 효과 & ROI

- **/map이 빌드를 깨는 병목이 제거**되면, /ops 포함 전체 기능이 Exit 0 기반으로 안전하게 머지/배포 가능한 상태로 복귀합니다.

---

## 필요시 협업 제안

- **클로이**: v0.10 실행 + Exit 0 확인
- **자비스(나)**: 이 패치 후 v0.11(통합/검증/커밋)까지 연속 버전으로 이어갑니다.

---

## 상태
- **생성일**: 2025-12-22
- **목적**: /map Suspense 빌드 실패 확정 해결
- **이전 버전**: v0.9 (NEXTCHAT-STARTER)
- **다음 버전**: v0.11 (예정)
