# RELEASE-CARD-COPY v0.25

**목적**: 릴리즈 카드(이미지 1장)용 문구 + 레이아웃 스펙

## 핵심 결론 (1줄)

다음(v0.25)은 릴리즈 카드(이미지 1장)용 문구 + 레이아웃 스펙을 만들어서, 노션/블로그/SNS에 바로 붙일 수 있게 하는 패킷입니다.

---

## 릴리즈 카드 문구 패키지

릴리즈 카드(이미지 1장) 제작용 "문구 패키지"입니다. 아래를 그대로 디자이너/이미지 제작툴(캔바 등)에 붙여넣어 사용하세요.

### RELEASE CARD COPY

**1. 헤드라인(택1)**
• "Ops 명령 복사 버튼 추가 + /map 빌드 안정화"
• "한 번 클릭으로 ops 명령 복사, /map 빌드 에러 해결"
• "Ops 워크플로우 빨라짐 + Map 페이지 빌드 안정화"

**2. 서브헤드(1줄)**
• "/ops에서 new issue/proof/decision 명령을 즉시 복사하고, /map은 Suspense 패턴으로 빌드 규칙을 준수합니다."

**3. 핵심 포인트(불릿 3개)**
• "/ops: Actions 섹션 + 3개 Copy 버튼 + 실패 시 fallback"
• "/map: Server + MapClient 분리, useSearchParams는 Client에서만"
• "검증: pnpm build Exit 0 / dev에서 /ops·/map OK"

**4. 작은 글씨(footer, 1줄)**
• "Release: v0.21.0 (ops actions + map suspense fix)"

**5. CTA(택1)**
• "업데이트 내용 확인하기"
• "새 기능 사용해보기"
• "빌드 안정화 확인하기"

---

## 레이아웃 스펙

### LAYOUT SPEC

**캔버스**:
• 1080×1080 (정사각) 또는 1200×628(가로형)

**구조**:
• 상단: 헤드라인
• 중단: 서브헤드
• 하단: 3불릿
• 우하단: footer

**글자 수**:
• 헤드라인: 18자 내외
• 불릿: 줄당 18자 내외

---

## 예상 효과 & ROI

- **카드 1장으로 "무슨 업데이트인지"가 한눈에 보여서**, 설명/문의 대응 시간이 줄어듭니다.

---

## 필요시 협업 제안

- **클로이**: v0.25 문구 패키지 제공
- **자비스(나)**: 원하시면, 위 문구로 캔바/노션용 2가지 톤(딱딱/친근) 버전도 v0.26으로 바로 이어서 만들겠습니다.

---

## 사용 예시

### 캔바용 카드 (정사각 1080×1080)

```
[상단 - 큰 글씨]
Ops 워크플로우 빨라짐 + Map 페이지 빌드 안정화

[중단 - 중간 글씨]
/ops에서 new issue/proof/decision 명령을 즉시 복사하고,
/map은 Suspense 패턴으로 빌드 규칙을 준수합니다.

[하단 - 불릿]
✓ /ops: Actions 섹션 + 3개 Copy 버튼 + 실패 시 fallback
✓ /map: Server + MapClient 분리, useSearchParams는 Client에서만
✓ 검증: pnpm build Exit 0 / dev에서 /ops·/map OK

[우하단 - 작은 글씨]
Release: v0.21.0 (ops actions + map suspense fix)
```

---

## 상태
- **생성일**: 2025-12-22
- **목적**: 릴리즈 카드 문구 및 레이아웃 스펙 제공
- **이전 버전**: v0.23 (PR-DESCRIPTION-FINAL)
- **다음 버전**: v0.26 (캔바/노션 톤 버전 예정)
