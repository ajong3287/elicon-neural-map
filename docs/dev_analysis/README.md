# 개발 버전 분석 보관소

**목적**: GPT 코드 분석 과정 기록 (v1.6 ~ v2.2)
**날짜**: 2025-12-22
**분석 대상**: elicon-neural-map v0.1.5 코드베이스

---

## 파일 목록

| 버전 | 파일명 | 분석 내용 |
|------|--------|-----------|
| v1.6 | `v1.6_ui_render_analysis.md` | UI 렌더링 방식 (Cytoscape), nodes/edges 로직 80줄 |
| v1.7 | `v1.7_ui_render_analysis.md` | v1.6과 동일 (포맷 개선) |
| v1.8 | `v1.8_ui_render_analysis.md` | v1.7과 동일 (톤 조정) |
| v1.9 | `v1.9_ui_render_analysis.md` | v1.8 계속 |
| v2.0 | `v2.0_imports_dataflow_analysis.md` | imports/state/데이터 흐름, map 관련 파일 |
| v2.1 | `v2.1_data_source_styles_analysis.md` | 데이터 소스, 스타일/레이아웃 80줄 |
| v2.2 | `v2.2_interactions_types_analysis.md` | 인터랙션 이벤트, 커스텀 타입 |

---

## 주요 발견 사항 요약

### 기술 스택
- **UI 라이브러리**: Cytoscape.js (ReactFlow 아님)
- **레이아웃 알고리즘**: fcose (force-directed)
- **프레임워크**: Next.js 14 (App Router)
- **상태 관리**: React hooks (useState, useEffect, useMemo, useRef)

### 아키텍처
- **파일 구조**: 모놀리식 (단일 파일 page.tsx)
- **데이터 소스**: `/graph.json` (public 폴더, fetch로 로드)
- **상태 관리**: URL query params로 지속성 유지

### 핵심 기능
1. **Compound Nodes**: cluster parent nodes로 그룹화
2. **필터링**: search, folder, score range, collapsed clusters
3. **Cycle Highlight**: 빨간색 점선/실선으로 강조
4. **성능 최적화**: 노드 수 기반 조건부 레이아웃 옵션

### 성능 전략
- **<100 nodes**: animate=true, quality=default, numIter=2500
- **100-500 nodes**: animate=false, quality=draft, numIter=1500
- **500+ nodes**: tile=true, numIter=1000, boxSelection=false

---

## 분석 목적

이 분석은 GPT가 v0.1.6 기능 구현을 위한 사전 조사로 진행했습니다.

**다음 단계**: v0.1.6 실제 기능 구현 (GPT 지시 대기 중)

---

**분석자**: Claude (elicon-neural-map v0.1.5)
**분석 방법**: GPT 요청 → Claude 명령 실행 → 결과 제공
**협업 방식**: 사용자가 GPT 프롬프트 복사 → Claude가 pbpaste로 읽기
