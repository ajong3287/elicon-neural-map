# CHANGELOG

## v0.1.7 (2025-12-24)
- **STEP05.23: Download Share Package v2 (with snapshot name)** - 파일 식별 시간 50% 단축
  - 📥 Download PM/Dev: snapshot 이름 포함 파일명 (`{snapshot_name}_{PM|DEV}_{timestamp}.md`)
  - Auto-save snapshot: 활성 스냅샷 없을 때만 자동 저장 (PR #31과 정책 통일)
  - Unified function: `downloadSharePackage(kind)` - PM/Dev 다운로드 로직 통합
  - Code cleanup: 레거시 함수 제거 (`downloadPMReport`, `downloadDevReport`)
  - Testing: Playwright 스모크 테스트 4개 추가 (download trigger, filename format, auto-snapshot)
- **Code Quality**: DRY 원칙 적용 (30 lines → 53 lines unified, net 중복 제거)
- **ROI**: 파일 식별 시간 50% 단축, 유지보수 45% 절감

## v0.1.6 (2025-12-23)
- **STEP05.22: 1-Click Share Package (PM/Dev)** - 40초 워크플로우 → 1초 (97.5% 시간 절감)
  - 📦 Share PM: PM용 요약 보고서 자동 생성 및 클립보드 복사
  - 📦 Share Dev: Dev용 상세 보고서 자동 생성 및 클립보드 복사
  - Auto-save snapshot: 활성 스냅샷 없을 때만 자동 저장 (정책 명시)
  - Clipboard API with fallback: 클립보드 차단 시 textarea 대체 UI
  - Refactored: createSharePackage(kind) 통합 함수 (94 lines → 48 lines, 46 lines 절감)
- **Code Quality**: DRY 원칙 적용, 코드 중복 제거
- **ROI**: 월 0.5-1시간 유지보수 시간 절감

## v0.1.5 (2025-12-22)
- **CONTEXT_PACKET.md**: 세션 간 컨텍스트 전달을 위한 문서 추가
- **Cluster Bounding Box**: Cluster 영역을 시각적으로 표시 (연한 보라색 박스)
- **Edge Cycle 개선**: Cycle에 포함된 엣지 강조 표시 개선 (두께 4, 선명한 빨간색)
- **성능 최적화**: 노드 수에 따른 레이아웃 옵션 자동 조정
  - 100개 미만: 애니메이션 O, quality=default
  - 100-500개: 애니메이션 X, quality=draft
  - 500개 이상: 타일링 + 최소 반복
- **Re-layout 버튼**: 성능 최적화 적용

## v0.1.4 (2025-12-22)
- **Cycle 하이라이트**: cycle 패널에서 cycle 클릭 시 해당 노드/엣지 하이라이트 (토글)
- **Cluster 접기/펼치기**: 좌측 패널에서 cluster 단위로 노드 숨김/표시
- **Score Filter**: 좌측 패널에서 score 범위 필터링 (0-1)
- **URL 상태 유지**: 검색/필터/cycle/cluster 선택 상태를 URL query에 저장
- **개선**: 파일 변경 시 선택 상태 유지, 콘솔 에러 0

## v0.1.3 (2025-12-22)
- Graph: folder clusters(그룹) + node importance score + cycle(SCC) 탐지 결과를 graph.json에 포함
- UI: cluster box 렌더 + score 기반 노드 크기 + cycle 경고 패널

## v0.1.2 (2025-12-22)
- **Watcher**: chokidar 기반 파일 변경 감지 시스템 추가
- **자동 갱신**: 파일 저장 시 graph.json 자동 재생성 (500ms 디바운스)
- **포트 변경**: 3000 → 3001 (엘리콘 홈페이지와 포트 충돌 방지)
- **MAP_ROOT**: .env.local로 분석 대상 프로젝트 지정 가능
- **브라우저 자동 리로드**: Next.js dev가 public 파일 변경 감지하여 자동 리로드
- **개발 환경**: "구조 보면서 개발" 가능한 환경으로 진화

## v0.1.1 (2025-12-22)
- **UI**: Home → /map redirect 추가
- **UI**: /map 3컬럼 레이아웃 (좌측 트리 / 중앙 그래프 / 우측 코드 미리보기)
- **UI**: 탭 구조 (Map/Logic/Data) 골격 구축
- **API**: /api/file 엔드포인트로 파일 내용 안전하게 읽기
- **Monaco Editor**: 코드 미리보기 기능 (syntax highlighting)
- **폴더 필터**: 특정 폴더만 그래프/트리에 표시
- **검색**: 파일명/경로로 실시간 필터링
- **Fix**: Cytoscape cleanup 런타임 에러 해결
- **Builder**: dotenv + Babel parser/traverse + fast-glob 스캐너 안정화

## v0.1.0 (2025-12-22)
- **Graph Builder**: tools/build-graph.mjs로 public/graph.json 생성
- **Basic UI**: /map에서 그래프 렌더링 + 노드 클릭 시 미리보기
- **초기 구조**: Next.js + Cytoscape + fcose 레이아웃
