# CONTEXT_PACKET.md - 세션 간 컨텍스트 전달

**버전**: 0.1.5
**날짜**: 2025-12-22
**목적**: Claude Code 세션 간 프로젝트 상태 및 컨텍스트 유지

---

## 프로젝트 개요

**이름**: elicon-neural-map
**현재 버전**: 0.1.5
**목적**: 코드베이스 시각화 도구 (의존성 그래프 + 실시간 미리보기)

**핵심 기능**:
- 코드 의존성 그래프 시각화 (Cytoscape.js)
- 실시간 파일 변경 감지 (chokidar)
- 코드 미리보기 (Monaco Editor)
- Cycle 탐지 및 하이라이트
- Cluster 기반 그룹 관리

---

## 기술 스택

**Frontend**:
- Next.js 14 (App Router)
- React 18
- Cytoscape.js 3.28 + fcose layout
- Monaco Editor

**Builder**:
- Node.js + Babel parser/traverse
- fast-glob (파일 스캔)
- dotenv (환경 변수)

**Watcher**:
- chokidar (500ms debounce)
- 자동 graph.json 재생성

---

## 프로젝트 구조

```
elicon-neural-map/
├── src/app/
│   ├── map/page.tsx          # 메인 UI (그래프 + 트리 + 미리보기)
│   └── api/file/route.ts     # 파일 읽기 API
├── tools/
│   ├── build-graph.mjs       # 그래프 생성기
│   └── watch-graph.mjs       # 파일 감지 워처
├── public/
│   └── graph.json            # 생성된 그래프 데이터
├── docs/
│   ├── STATE.md              # 버전별 상태 문서
│   └── CONTEXT_PACKET.md     # 이 문서
└── logs/
    └── CHANGELOG.md          # 변경 이력
```

---

## 현재 상태 (v0.1.5)

### 완료된 기능 (v0.1.4)

✅ **Cycle 하이라이트**:
- src/app/map/page.tsx:86-87, 169-203, 327-340
- cycle 클릭 시 관련 노드/엣지 빨간색 점선 테두리
- 재클릭 시 해제

✅ **Cluster 접기/펼치기**:
- src/app/map/page.tsx:99-100, 111-118, 410-449
- 좌측 패널에서 cluster 단위 노드 숨김/표시
- collapsedClusters Set 상태 관리

✅ **Score Filter**:
- src/app/map/page.tsx:84, 94, 124-127, 402-431
- min-max 범위 입력 (0-1)
- score 범위 밖 노드 필터링

✅ **URL 상태 유지**:
- src/app/map/page.tsx:5, 77-78, 84-88, 93-100, 115-126
- Query 파라미터: ?q=검색어, ?cycle=cycle:1, ?clusters=..., ?scoreMin=0.5&scoreMax=1
- 페이지 리로드 시 상태 복원

### 진행 중 (v0.1.5)

🔄 **CONTEXT_PACKET.md 생성** (이 문서)

⏳ **Cluster bounding box 시각화**
⏳ **Edge cycle 하이라이트 개선**
⏳ **성능 최적화 (500+ nodes)**

---

## 주요 파일 참조

### src/app/map/page.tsx (메인 UI)

**핵심 State**:
```typescript
// Line 84-100
const [search, setSearch] = useState('');
const [selectedFolder, setSelectedFolder] = useState('all');
const [selectedFile, setSelectedFile] = useState<string | null>(null);
const [selectedCycleId, setSelectedCycleId] = useState<string | null>(null);
const [scoreRange, setScoreRange] = useState({ min: 0, max: 1 });
const [collapsedClusters, setCollapsedClusters] = useState<Set<string>>(new Set());
```

**Cytoscape 스타일** (Line 327-340):
```javascript
{
  selector: '.cycle-highlight',
  style: {
    'border-width': 4,
    'border-color': '#f87171',
    'border-style': 'dashed',
    'line-color': '#f87171',
    'target-arrow-color': '#f87171'
  }
}
```

### tools/build-graph.mjs (그래프 생성)

**핵심 기능**:
- Babel parser로 import/require 추출
- Cluster 자동 탐지 (폴더 기반)
- Score 계산 (PageRank 알고리즘)
- Cycle(SCC) 탐지 (Tarjan's algorithm)

**출력**: public/graph.json

### tools/watch-graph.mjs (실시간 감지)

**동작**:
- chokidar로 MAP_ROOT 폴더 감시
- 파일 변경 시 500ms debounce 후 build-graph.mjs 실행
- Next.js가 public/graph.json 변경 감지 → 브라우저 자동 리로드

---

## 환경 설정

**.env.local**:
```bash
MAP_ROOT=/Users/elicon_mark/Developer/[개발]02_슈퍼개발툴만들기/elicon-neural-map
```

**포트**: 3001 (충돌 방지)

**실행 명령어**:
```bash
pnpm dev                # Next.js 서버만
pnpm build:graph        # 그래프 생성만
pnpm dev:all            # 워처 + 서버 동시
```

---

## 다음 세션 체크리스트

새 세션 시작 시 확인할 항목:

### 1. 프로젝트 상태 확인
```bash
# 현재 버전 확인
cat package.json | grep version

# 최근 변경 확인
cat docs/STATE.md
cat logs/CHANGELOG.md
```

### 2. 개발 서버 상태
```bash
# 포트 3001 확인
lsof -i :3001

# 서버 로그 확인
tail -f /tmp/elicon-neural-map-dev.log
```

### 3. Todo 확인
```bash
# 진행 중인 작업 확인
# (TodoWrite 도구 사용)
```

### 4. 주요 파일 변경 여부
```bash
# 핵심 파일 최근 수정 시간
ls -lt src/app/map/page.tsx tools/*.mjs public/graph.json
```

---

## 알려진 이슈 및 제약

### 성능

**현재 상태**:
- ~100 nodes: 부드러움
- ~500 nodes: 약간 느려짐
- 1000+ nodes: 최적화 필요

**계획**:
- Virtual rendering 검토
- Clustering 레벨 조정
- Layout 알고리즘 튜닝

### 브라우저 호환성

**테스트 완료**:
- Chrome/Edge: ✅
- Safari: ✅
- Firefox: ⚠️ (일부 스타일 이슈)

### 파일 크기

**제약**:
- Monaco Editor: 큰 파일(>1MB) 느림
- Cytoscape: 엣지 >5000개 시 렌더링 지연

---

## 버전 히스토리 요약

- **v0.1.0**: 기본 그래프 + 미리보기
- **v0.1.1**: 3컬럼 레이아웃 + 검색
- **v0.1.2**: 파일 감지 + 자동 갱신
- **v0.1.3**: Cluster + Score + Cycle 탐지
- **v0.1.4**: Cycle 하이라이트 + Cluster 접기 + Score Filter + URL 상태 유지
- **v0.1.5**: (진행 중) CONTEXT_PACKET + Cluster box + Edge 개선 + 성능 최적화

---

## 참고 문서

- **STATE.md**: 버전별 상세 증거 및 달성 현황
- **CHANGELOG.md**: 사용자용 변경 이력
- **package.json**: 버전 및 의존성
- **/tmp/elicon-neural-map-dev.log**: 개발 서버 로그

---

**최종 업데이트**: 2025-12-22
**작성자**: Claude (elicon-neural-map v0.1.5)
