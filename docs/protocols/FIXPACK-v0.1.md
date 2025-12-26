# FIXPACK v0.1

**목적**: /map Suspense 빌드 오류 해결 및 d00cdda create mode 꼬임 정리

## 핵심 결론 (1줄)

빌드 Exit 0 실패의 주 원인은 /map의 useSearchParams Suspense 이슈이며, d00cdda의 create mode 꼬임이 그 원인 코드를 유입/변형시켰을 가능성이 큽니다.

---

## 실행 방안 (구체적 단계)

### A. (우선순위 1) 상태 확정 4커맨드

서대표님이 적어둔 4개는 정확히 핵심만 찌르는 최소 세트입니다.
특히 `git show --stat d00cdda` + `pnpm build tail`이 "원인+증상"을 한 번에 잡습니다.

### B. (우선순위 2) /map Suspense 해결 "정답 패턴"

**해결 원칙**: useSearchParams()를 쓰는 코드는 Client Component로 분리하고, Server page에서 `<Suspense>`로 감싸기.

**권장 구조**:
- `src/app/map/page.tsx` : Server Component (기본)
- `src/app/map/MapClient.tsx` : Client Component ("use client" + useSearchParams 여기서만 사용)

**예시 코드 (그대로 적용 가능)**:

`src/app/map/page.tsx`:
```typescript
import { Suspense } from "react";
import MapClient from "./MapClient";

export default function MapPage() {
  return (
    <Suspense fallback={<div>Loading map…</div>}>
      <MapClient />
    </Suspense>
  );
}
```

`src/app/map/MapClient.tsx`:
```typescript
"use client";

import { useSearchParams } from "next/navigation";

export default function MapClient() {
  const sp = useSearchParams();
  const q = sp.get("q") ?? "";
  // TODO: 기존 map UI/로직을 여기에 이관
  return <div>Map (q={q})</div>;
}
```

### C. (우선순위 3) d00cdda create mode 꼬임 정리 절차

d00cdda가 page.tsx를 "새 파일처럼" 만든 게 사실이면, 아래 순서로 복구/정리합니다.

1. `git show --name-status d00cdda`로 진짜 create인지 확인
2. `git log --follow -- src/app/map/page.tsx`로 원래 파일 히스토리 추적
3. 원래 정상 버전이 있으면
   - `git checkout <정상커밋> -- src/app/map/page.tsx`로 복구
   - 이후 필요한 변경만 다시 반영
4. 위의 Suspense 분리(페이지/클라이언트)로 최종 고정

---

## 예상 효과 & ROI

- **빌드 Exit 0 복구 = 배포/머지 재개**: 지금 병목(빌드 실패)을 제거하면, /ops 같이 "이미 커밋된 성과"가 메인에 들어가는 속도가 즉시 올라갑니다.
- **create mode 꼬임 정리 = 재작업 방지**: 파일 히스토리 깨짐은 나중에 2~3배 비용으로 돌아오니, 지금 정리하는 게 ROI가 가장 큽니다(특히 --follow로 한번에 해결).

---

## 원샷 프롬프트 (Claude Code용)

```
Claude Code(클로이)님, 아래만 명령+원문 로그로 진행해주세요(설명 금지).

1. cd /Users/elicon_mark/Developer/개발02_슈퍼개발툴만들기/elicon-neural-map
2. git status
3. git log --oneline -12
4. git show --stat d00cdda
5. git show --name-status d00cdda
6. pnpm build 2>&1 | tail -120

그 다음, /map Suspense 해결을 위해 아래 파일 분리로 수정하세요(외부 패키지 금지).
• src/app/map/page.tsx : <Suspense><MapClient/></Suspense> 형태로 변경
• src/app/map/MapClient.tsx : "use client" 선언 후 useSearchParams 사용 코드를 이관

수정 후 pnpm build && echo $? 원문 출력.
```

---

## 필요시 협업 제안

원하시면, 위 로그가 나오자마자 **"어느 커밋으로 복구할지 + 어떤 코드만 남길지"**를 바로 확정 지시로 내려드리겠습니다.

---

## 상태
- **생성일**: 2025-12-22
- **관련 이슈**: /map useSearchParams Suspense 오류, d00cdda create mode 꼬임
- **해결 방법**: Client/Server Component 분리 + Suspense boundary
