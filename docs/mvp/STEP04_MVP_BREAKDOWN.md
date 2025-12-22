[NEURALMAP-STEP04.1-MVP-BREAKDOWN-v0.1 제공]
# STEP04.1 — Friend App → MVP Breakdown (Elicon Neural Map)

## 목표(초간단)
- "폴더를 지정하면 → 화면에 점(노드)과 선(엣지)이 나오고 → 클릭하면 오른쪽에 정보가 뜬다" 까지.

---

## MVP 기능을 '레고 블록'으로 쪼개기
### A. 데이터(파일/폴더) 레이어
- A1. 프로젝트 폴더 지정(경로 입력 또는 환경변수)
- A2. 파일 스캔(확장자: md/ts/tsx/json 등)
- A3. 노드/엣지 생성 규칙(예: 파일=노드, import/링크=엣지)
- A4. 캐시(스캔 결과 저장) + 재스캔 버튼

### B. 화면(시각화) 레이어
- B1. 그래프 캔버스(줌/패닝)
- B2. 레이아웃(자동 정렬)
- B3. 노드 스타일(종류별 색/아이콘은 나중)
- B4. 선택/하이라이트(클릭한 노드 중심)

### C. 조작(사용자 인터랙션) 레이어
- C1. 검색(노드 이름)
- C2. 필터(파일 타입/점수/태그)
- C3. 우측 패널(상세: 경로/요약/연관)
- C4. 단축키(ESC 선택 해제 등)

### D. 운영(개발/배포) 레이어
- D1. build Exit 0 유지 규칙
- D2. PR 템플릿/체크리스트
- D3. 릴리즈 노트/태그

---

## "친구 화면"을 따라가기 위한 핵심 6개(우선순위)
1) 그래프가 뜬다(B1)
2) 자동 정렬된다(B2)
3) 클릭하면 우측에 정보(C3)
4) 검색으로 노드 찾기(C1)
5) 필터 1개(예: 확장자)(C2)
6) 폴더 재스캔(A4)

---

## PR 단위(10개 내로 끝내기) — 번호 고정
- STEP04.2: Graph canvas scaffold (empty graph)
- STEP04.3: Load sample graph (hardcoded nodes/edges)
- STEP04.4: Node select + right panel
- STEP04.5: Search box + jump to node
- STEP04.6: Filter (extension/type)
- STEP04.7: Local scan v1 (simple file list)
- STEP04.8: Edge building v1 (imports/links)
- STEP04.9: Rescan + cache
- STEP04.10: UX polish (loading/error/empty states)
- STEP04.11: Release tag v0.1.0 + notes

---

## Done 정의(완료 기준)
- /map에서 그래프가 보이고(노드>=20, 엣지>=20)
- 노드 클릭 시 우측 패널에 경로 1줄 + 요약 1줄
- 검색으로 노드 이동 가능
- pnpm build Exit 0

[NEURALMAP-STEP04.1-MVP-BREAKDOWN-v0.1 제공완료]
