# PROMPT_REGISTRY (GPT-Claude 협업용)

> **환경**: GPT(자비스)가 제공 → 서대표님 복사 → Claude Code(클로이) pbpaste 실행
> **목적**: 코드 분석 프롬프트 표준화 (v1.6~현재)
> **경로**: /Users/elicon_mark/Developer/[개발]02_슈퍼개발툴만들기/elicon-neural-map
> **생성일**: 2025-12-22
> **제공자**: GPT(자비스)

---

# PROMPT REGISTRY (Single Source of Truth)
- 원칙: 새창 프롬프트는 이 파일에서만 복사/붙여넣기
- 버전 = 내용 의미 변화, 프로필 = 길이/출력개수/강도
- 모든 프롬프트는 상단 [vX.X-PROFILE 제공], 하단 [vX.X-PROFILE 제공완료] 태그 포함

---

## GLOBAL CONTEXT HEADER (항상 포함 6줄)
1) 파일 수정/생성/포맷팅 금지
2) 출력은 지정 섹션만(예: [M]~[P])
3) 중간 생략/요약/의역 금지
4) 프로필 기준 명시(예: LongSet=4 outputs)
5) 시작/끝 마커(--- 시작 --- / --- 끝 ---)
6) 상단/하단 태그: [vX.X-PROFILE 제공] / [vX.X-PROFILE 제공완료]

---

## PROFILES
- SHORT: 최소 지시, 출력 개수 적음(예: 2 outputs)
- LONG: 규칙 강제(금지/형식/실패처리 포함), 출력 개수 많음(예: 4 outputs)
- 표기 규칙: v3.3-LONG, v3.3-SHORT 처럼 "버전-프로필"로 고정

---

# ENTRIES

## ID: MAP_PRECHECK
- 버전: v3.3
- 프로필: LONG
- 세트: LongSet (4 outputs)
- 출력: [M]~[P]만
- 태그: [v3.3-LONG 제공] ... [v3.3-LONG 제공완료]

### v3.3-LONG (새창용 / 블록형 표준)
[v3.3-LONG 제공]
Claude Code(클로이)님, elicon-neural-map 프로젝트 코드 에이전트로 작업 부탁드립니다.
(고정 헤더 6줄)
1) 파일 수정/생성/포맷팅 금지
2) 출력은 [M]~[P]만
3) 중간 생략/요약/의역 금지
4) LongSet(4 outputs) 기준
5) 시작/끝 마커: --- 시작 --- / --- 끝 ---
6) 태그: [v3.3-LONG 제공] / [v3.3-LONG 제공완료]

추가 절대금지(위반 시 실패로 간주):
- 지정 명령 외 추가 명령 실행 금지(pwd/ls/cat/head/tail 등 포함)
- 설명/인사/해설/요약/확인문/사과문 금지
- 출력 재정렬/정리/가독성 편집 금지
- 명령 실패 시에도 "출력 원문(에러 포함)" 그대로 제출(코멘트 금지)

섹션 형식(모든 섹션 동일):
- 섹션 라벨 1줄
- --- 시작 ---
- (명령 출력 원문)
- --- 끝 ---

[M] /map 렌더 엔진 최종 판별 + 패키지 근거(재확인)
명령:
cd /Users/elicon_mark/Developer/[개발]02_슈퍼개발툴만들기/elicon-neural-map && rg -n "reactflow|ReactFlow|@reactflow|canvas|konva|pixi|d3" src/app/map/page.tsx package.json
제출 형식:
[M]
--- 시작 ---
(원문)
--- 끝 ---

[N] nodes/edges 생성 + JSX 렌더 포함 (연속 160줄, 줄번호 포함)
명령:
cd /Users/elicon_mark/Developer/[개발]02_슈퍼개발툴만들기/elicon-neural-map && nl -ba src/app/map/page.tsx | sed -n '1,360p'
선택 규칙(반드시 충족):
- 1~360 라인 중에서 "nodes/edges 생성부" AND "JSX 렌더(return의 JSX)"가 모두 포함되도록
- 연속 160줄 정확히 160줄(159/161 금지)
- 줄번호 포함 원문 그대로
제출 형식:
[N] 선택 범위: 시작~끝 (160줄)
--- 시작 ---
(원문)
--- 끝 ---

[O] 커스텀 nodeTypes/edgeTypes + 관련 파일(목록+매칭)
명령(2개 모두 실행):
cd /Users/elicon_mark/Developer/[개발]02_슈퍼개발툴만들기/elicon-neural-map && find src -type f \( -iname "*node*.tsx" -o -iname "*edge*.tsx" -o -iname "*reactflow*.tsx" -o -iname "*graph*.tsx" \) -print | sort
cd /Users/elicon_mark/Developer/[개발]02_슈퍼개발툴만들기/elicon-neural-map && rg -n "nodeTypes|edgeTypes|type:\\s*['\"][^'\"]+['\"]" src/app/map/page.tsx src -S
제출 형식:
[O]
--- 시작 ---
(find 원문)
(rg 원문)
--- 끝 ---

[P] 저장/불러오기 + API route + 상태관리(한 번에 수집)
명령(2개 모두 실행):
cd /Users/elicon_mark/Developer/[개발]02_슈퍼개발툴만들기/elicon-neural-map && rg -n "localStorage|sessionStorage|indexedDB|persist|save|load|export|import|download|upload|fetch\\(|axios|trpc|/api|route\\.ts|zustand|redux|recoil|jotai|createContext\\(|useContext\\(|Provider\\b|store\\b" src -S
cd /Users/elicon_mark/Developer/[개발]02_슈퍼개발툴만들기/elicon-neural-map && find src/app -type f \( -name "route.ts" -o -name "route.js" \) -print | sort
제출 형식:
[P]
--- 시작 ---
(rg 원문)
(find 원문)
--- 끝 ---

최종 검수 규칙:
- [M]~[P] 외 텍스트 0줄
- 중간 생략/요약/의역 0회
- 파일 변경 0회
- 추가 명령 실행 0회
[v3.3-LONG 제공완료]

---

## ID: MAP_PRECHECK
- 버전: v3.3
- 프로필: SHORT
- 세트: ShortSet (2 outputs)
- 출력: [M] + [P]만 (빠른 진단용)
- 태그: [v3.3-SHORT 제공] ... [v3.3-SHORT 제공완료]

### v3.3-SHORT (새창용 / 블록형)
[v3.3-SHORT 제공]
Claude Code(클로이)님, 파일 수정/생성/포맷팅 금지. 출력은 [M]과 [P]만. 중간 생략/요약/의역 금지. 시작/끝 마커 필수. 추가 설명 금지.

[M]
명령: cd /Users/elicon_mark/Developer/[개발]02_슈퍼개발툴만들기/elicon-neural-map && rg -n "reactflow|ReactFlow|@reactflow|canvas|konva|pixi|d3" src/app/map/page.tsx package.json
형식:
[M]
--- 시작 ---
(원문)
--- 끝 ---

[P]
명령1: cd /Users/elicon_mark/Developer/[개발]02_슈퍼개발툴만들기/elicon-neural-map && rg -n "localStorage|sessionStorage|indexedDB|persist|save|load|export|import|download|upload|fetch\\(|axios|trpc|/api|route\\.ts|zustand|redux|recoil|jotai|createContext\\(|useContext\\(|Provider\\b|store\\b" src -S
명령2: cd /Users/elicon_mark/Developer/[개발]02_슈퍼개발툴만들기/elicon-neural-map && find src/app -type f \( -name "route.ts" -o -name "route.js" \) -print | sort
형식:
[P]
--- 시작 ---
(rg 원문)
(find 원문)
--- 끝 ---
[v3.3-SHORT 제공완료]

---

## 운영 규칙

1. **단일 원본 원칙**
   - 새창에서 사용할 프롬프트는 무조건 이 파일에서만 복사
   - 임기응변 금지

2. **버전 관리**
   - 버전(v3.3): 내용 의미 변경 시만 증가
   - 프로필(LONG/SHORT): 길이/강도/출력 개수 변경

3. **태그 시스템**
   - 시작: [vX.X-PROFILE 제공]
   - 종료: [vX.X-PROFILE 제공완료]
   - 로그 검색: 태그로 즉시 위치 파악

---

## 예상 효과 & ROI

- **재수집 왕복 30~60% 감소**: 누락/형식 위반을 프롬프트 구조로 차단
- **로그 탐색 70%+ 절감**: 태그 검색으로 즉시 원문 위치 고정
- **의사결정-실행 루프 가속화**: 같은 시간에 더 많은 개발/검수 라운드 처리

---

## Claude Code 환경 차이점

**GPT 환경**:
- 새 창마다 컨텍스트 초기화 → 매번 프롬프트 복붙 필요

**Claude Code 환경**:
- 대화 컨텍스트 유지 → 연속 작업 가능
- 하지만 **GPT → 서대표님 복사 → pbpaste** 흐름에서는 표준안 유용

**실제 워크플로우**:
1. GPT(자비스): 이 파일에서 프롬프트 복사
2. 서대표님: 클립보드에 복사
3. Claude Code(클로이): `pbpaste`로 읽기 → 명령 실행 → 형식 준수 출력

---

**최종 업데이트**: 2025-12-22
**관리자**: 서종원 대표님
**협업**: GPT(자비스) + Claude Code(클로이)
