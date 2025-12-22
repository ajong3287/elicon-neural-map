# Deploy (Vercel) — elicon-neural-map

## 목적
- 웹에서 /map을 열고, URL 스냅샷(필터/포커스/줌/팬)을 공유/재현한다.
- 그래프 업로드(있다면)는 토큰으로 보호한다.

## 필수 엔드포인트
- UI: /map
- Health: /api/health  (배포 직후 정상 여부 확인)
- Graph JSON: /graph.json
- Upload (옵션): /api/graph (POST)

## Vercel 배포 절차 (UI 기준)
1. Vercel에서 GitHub repo 연결: ajong3287/elicon-neural-map
2. Framework: Next.js (자동 인식)
3. Environment Variables
   - GRAPH_UPLOAD_TOKEN = (임의의 긴 토큰 값)
4. Deploy

## 배포 후 체크리스트
1. /api/health → {"ok":true,…} 확인
2. /map 진입 → 노드가 렌더되는지 확인
3. /graph.json 확인 (data/public fallback 동작)
4. (옵션) 업로드: /map에서 token 입력 후 graph.json 업로드 테스트
5. URL 스냅샷:
   - 필터/포커스/줌/팬 설정
   - "링크 복사" 버튼 클릭
   - 새 창에서 링크 열어 상태가 재현되는지 확인
