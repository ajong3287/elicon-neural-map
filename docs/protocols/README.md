# Protocols 버전 관리

**목적**: elicon-neural-map 프로젝트 작업 프로토콜 버전 관리

---

## 프로토콜 체인

```
새 세션 시작
    ↓
NEXTCHAT-STARTER v0.9 (상태 확정 + Exit 0 검증)
    ↓
NEWCHAT-PACKET v0.1/v0.2 (OPS-ACTIONS 구현)
    ↓
빌드 문제 발견?
    ↓
FIXPACK v0.1 (/map Suspense 해결)
    ↓
통합 필요?
    ↓
MERGEPACK v0.4 (안전 통합)
    ↓
충돌/빌드 실패?
    ↓
RESOLVEPACK v0.5 (원인 확정 → 해결)
    ↓
정밀 패치 필요?
    ↓
LINEPATCHPACK v0.6 (라인 단위 스냅샷)
    ↓
PATCHSCRIPT v0.7 (자동 패치 적용)
    ↓
Exit 0 복구 완료?
    ↓
PRPACK v0.8 (PR 생성/리뷰/머지)
    ↓
최종 마감?
    ↓
PRPACK v0.14 (리베이스 + 푸시 + PR 템플릿)
    ↓
PR 승인/로컬 머지?
    ↓
MERGE-MAIN v0.15 (main 안전 머지 + 원격 반영)
    ↓
머지 충돌 발생?
    ↓
CONFLICT-SNAPSHOT v0.16 (충돌 라인 스냅샷 수집)
    ↓
충돌 해결?
    ↓
CONFLICT-PATCH v0.17 (apply_patch 충돌 해결)
    ↓
머지 후 빌드 실패?
    ↓
BUILD-FAIL-SNAPSHOT v0.18 (에러 라인 스냅샷 수집)
    ↓
빌드 복구?
    ↓
BUILD-FAIL-PATCH v0.19 (apply_patch 빌드 복구)
    ↓
최종 문서화?
    ↓
RELEASE-NOTES v0.20 (CHANGELOG/릴리즈 노트 마감)
    ↓
최종 검증?
    ↓
FINAL-SMOKE v0.21 (최종 스모크 테스트 예정)
    ↓
최종 요약?
    ↓
FINAL-SUMMARY-PACK v0.22 (PR 요약문 5줄)
    ↓
PR 본문 작성?
    ↓
PR-DESCRIPTION-FINAL v0.23 (PR 본문 완성형)
    ↓
릴리즈 카드 제작?
    ↓
RELEASE-CARD-COPY v0.25 (카드 문구 + 레이아웃)
    ↓
톤 변형?
    ↓
RELEASE-CARD-TONES v0.26 (딱딱/친근 2가지 톤)
```

---

## 프로토콜 목록

### NEWCHAT-PACKET v0.1
- **파일**: `NEWCHAT-PACKET-v0.1.md`
- **생성일**: 2025-12-22
- **목적**: 새 세션에서 OPS-ACTIONS 원샷 구현
- **상태**: ✅ 완료 (feat/OPS-ACTIONS-001 → main)
- **다음 버전**: v0.2

### NEWCHAT-PACKET v0.2
- **파일**: `NEWCHAT-PACKET-v0.2.md`
- **생성일**: 2025-12-22
- **목적**: v0.1 개선 (상세 검증, slug 입력)
- **상태**: ✅ 문서화 완료
- **개선사항**:
  - 환경 점검 추가 (pwd, node -v, pnpm -v)
  - git pull --ff-only 추가
  - 빌드 실패 대응 절차 명시
  - 협업 제안 섹션 추가

### FIXPACK v0.1
- **파일**: `FIXPACK-v0.1.md`
- **생성일**: 2025-12-22
- **목적**: /map useSearchParams Suspense 오류 해결
- **상태**: ✅ 해결 완료 (d3d76cb)
- **해결 방법**: Client/Server Component 분리
- **결과**: 빌드 Exit 0

### MERGEPACK v0.4
- **파일**: 미저장 (클립보드에서만 확인)
- **목적**: 안전 통합 (Integration branch)
- **상태**: 🔍 확인 완료 (통합 불필요)
- **확인 결과**: 모든 작업 이미 main에 병합됨

### RESOLVEPACK v0.5
- **파일**: `RESOLVEPACK-v0.5.md`
- **생성일**: 2025-12-22
- **목적**: 충돌/빌드 실패 해결 자동화
- **상태**: 📝 문서화 완료
- **다음 버전**: v0.6 (LINEPATCHPACK)
- **해결 규칙**:
  - 규칙-1: /map Suspense 구조
  - 규칙-2: /ops Actions 섹션
  - 규칙-3: 타입 shim 유지

### LINEPATCHPACK v0.6
- **파일**: `LINEPATCHPACK-v0.6.md`
- **생성일**: 2025-12-22
- **목적**: 충돌/빌드 실패 라인 단위 스냅샷
- **상태**: 📝 문서화 완료
- **다음 버전**: v0.7 (PATCHSCRIPT)
- **수집 항목**:
  - 충돌 마커 ±60줄
  - 빌드 에러 로그 220줄
  - 에러 패턴 grep

### PATCHSCRIPT v0.7
- **파일**: `PATCHSCRIPT-v0.7.md`
- **생성일**: 2025-12-22
- **목적**: 자동 패치 스크립트 적용
- **상태**: 📝 문서화 완료
- **의존성**: v0.6 LINEPATCHPACK 결과
- **출력**: PATCHSCRIPT-v0.3.6 커밋

### PRPACK v0.8
- **파일**: `PRPACK-v0.8.md`
- **생성일**: 2025-12-22
- **목적**: Exit 0 복구 후 PR 생성/리뷰/머지 자동화
- **상태**: 📝 문서화 완료
- **다음 버전**: v0.9 (NEXTCHAT-STARTER)
- **출력**: PR 템플릿 + 푸시 완료
- **주요 절차**:
  - main 최신화 + 기준선 확인
  - 리베이스 + 최종 검증
  - 변경 파일 목록/요약
  - CHANGELOG 반영
  - PR 본문 템플릿 생성

### NEXTCHAT-STARTER v0.9
- **파일**: `NEXTCHAT-STARTER-v0.9.md`
- **생성일**: 2025-12-22
- **목적**: 새 세션 시작 시 현재 상태 확정 + Exit 0 검증
- **상태**: 📝 문서화 완료
- **다음 버전**: v0.10 (MAP-SUSPENSE-FIX)
- **주요 절차**:
  - 현재 상태 확정 (pwd, git status, git log)
  - 문제 커밋/파일 트래킹 확인
  - 빌드 실패 원인 확정
  - 결론 1줄 출력

### MAP-SUSPENSE-FIX v0.10
- **파일**: `MAP-SUSPENSE-FIX-v0.10.md`
- **생성일**: 2025-12-22
- **목적**: /map useSearchParams Suspense 빌드 실패 확정 해결
- **상태**: 📝 문서화 완료
- **다음 버전**: v0.11 (예정)
- **주요 절차**:
  - 기준선 확인 (이미 OK면 종료)
  - 작업 브랜치 생성 (fix/MAP-SUSPENSE-001)
  - 파일 분리: MapClient.tsx (Client) + page.tsx (Server + Suspense)
  - 빌드 검증 + dev 확인
  - Exit 0일 때만 커밋

### RESOLVE-LINE v0.12
- **파일**: `RESOLVE-LINE-v0.12.md`
- **생성일**: 2025-12-22
- **목적**: v0.11 통합 실패 시 원인 로그/라인 스냅샷 수집
- **상태**: 📝 문서화 완료
- **다음 버전**: v0.13 (PATCH)
- **주요 절차**:
  - 현재 상태 확인
  - 충돌 여부 판단
  - Merge Conflict: 충돌 마커 ±80줄 수집
  - Build Fail: 빌드 로그 220줄 + 핵심 에러 라인 수집
  - 해결 시도 금지 (수집만)

### PATCH v0.13
- **파일**: `PATCH-v0.13.md`
- **생성일**: 2025-12-22
- **목적**: v0.12 로그 기반 교체 블록 자동 적용
- **상태**: 📝 문서화 완료
- **다음 버전**: v0.14 (PRPACK)
- **주요 절차**:
  - 상태 확인
  - apply_patch 존재 확인
  - v0.12 로그 대기
  - 자비스 PATCH 블록 적용
  - 빌드 검증 + dev 확인
  - Exit 0일 때만 커밋

### PRPACK v0.14
- **파일**: `PRPACK-v0.14.md`
- **생성일**: 2025-12-22
- **목적**: 최종 PR 제출 자동화 (리베이스 + 푸시 + PR 템플릿)
- **상태**: 📝 문서화 완료
- **다음 버전**: v0.15 (MERGE-MAIN)
- **주요 절차**:
  - main 기준선 확인 (Exit 0 검증)
  - 작업 브랜치 리베이스 (충돌 시 중단)
  - 최종 빌드 검증
  - 변경 파일/통계 확인
  - 원격 푸시
  - PR 템플릿 생성

### MERGE-MAIN v0.15
- **파일**: `MERGE-MAIN-v0.15.md`
- **생성일**: 2025-12-22
- **목적**: PR 승인 후 main 안전 머지 및 원격 반영
- **상태**: 📝 문서화 완료
- **다음 버전**: v0.16 (CONFLICT-SNAPSHOT)
- **주요 절차**:
  - 원격 최신화
  - main 기준선 확인 (Exit 0 검증)
  - 머지 대상 브랜치 지정
  - main에 머지 (충돌 시 중단)
  - 최종 검증
  - 원격 main 푸시
  - 반영 확인

### CONFLICT-SNAPSHOT v0.16
- **파일**: `CONFLICT-SNAPSHOT-v0.16.md`
- **생성일**: 2025-12-22
- **목적**: v0.15 머지 충돌 발생 시 충돌 라인 스냅샷 수집
- **상태**: 📝 문서화 완료
- **다음 버전**: v0.17 (CONFLICT-PATCH)
- **주요 절차**:
  - 현재 상태 확인
  - 충돌 파일 목록 수집
  - 충돌 마커 라인 + 주변 ±80줄 컨텍스트 수집
  - 머지 abort 및 상태 확인
  - 해결 시도 금지 (수집만)

### CONFLICT-PATCH v0.17
- **파일**: `CONFLICT-PATCH-v0.17.md`
- **생성일**: 2025-12-22
- **목적**: v0.16 스냅샷 기반 충돌 해결 자동 적용
- **상태**: 📝 문서화 완료
- **다음 버전**: v0.18 (BUILD-FAIL-SNAPSHOT)
- **주요 절차**:
  - apply_patch 존재 확인
  - v0.16 로그 대기
  - 자비스 PATCH 블록 적용
  - 머지 완료 처리
  - 최종 빌드 검증
  - 원격 main 푸시

### BUILD-FAIL-SNAPSHOT v0.18
- **파일**: `BUILD-FAIL-SNAPSHOT-v0.18.md`
- **생성일**: 2025-12-22
- **목적**: 머지 후 빌드 실패 시 에러 라인 스냅샷 수집
- **상태**: 📝 문서화 완료
- **다음 버전**: v0.19 (BUILD-FAIL-PATCH)
- **주요 절차**:
  - 현재 상태 확인
  - 빌드 실패 로그 수집 (260줄)
  - 핵심 에러 라인 추출
  - 최근 변경 파일 확인
  - /map, /ops 파일 존재 확인
  - 해결 시도 금지 (수집만)

### BUILD-FAIL-PATCH v0.19
- **파일**: `BUILD-FAIL-PATCH-v0.19.md`
- **생성일**: 2025-12-22
- **목적**: v0.18 스냅샷 기반 빌드 복구 자동 적용
- **상태**: 📝 문서화 완료
- **다음 버전**: v0.20 (RELEASE-NOTES)
- **주요 절차**:
  - apply_patch 존재 확인
  - v0.18 로그 대기
  - 자비스 PATCH 블록 적용
  - 빌드 검증 (Exit 0)
  - dev 확인 (/ops, /map)
  - Exit 0일 때만 커밋
  - 작업 브랜치 원격 푸시

### RELEASE-NOTES v0.20
- **파일**: `RELEASE-NOTES-v0.20.md`
- **생성일**: 2025-12-22
- **목적**: CHANGELOG/릴리즈 노트 정리 및 main 반영 준비
- **상태**: 📝 문서화 완료
- **다음 버전**: v0.21 (FINAL-SMOKE)
- **주요 절차**:
  - 상태 스냅샷 확인
  - 최종 빌드 검증 (Exit 0)
  - CHANGELOG 파일 찾기
  - CHANGELOG.md 생성/업데이트
  - docs/RELEASE_NOTES.md 생성/업데이트
  - 문서 커밋 및 푸시

### FINAL-SMOKE v0.21
- **파일**: 예정
- **생성일**: 예정
- **목적**: 최종 스모크 테스트
- **상태**: ⏳ 예정
- **다음 버전**: v0.22 (FINAL-SUMMARY-PACK)

### FINAL-SUMMARY-PACK v0.22
- **파일**: `FINAL-SUMMARY-PACK-v0.22.md`
- **생성일**: 2025-12-22
- **목적**: 최종 산출물 및 PR 요약문 5줄 정리
- **상태**: 📝 문서화 완료
- **다음 버전**: v0.23 (PR-DESCRIPTION-FINAL)
- **주요 절차**:
  - main 기준 스냅샷 확인
  - 최종 빌드 검증 (Exit 0)
  - 문서 존재 확인
  - CHANGELOG.md, RELEASE_NOTES.md 내용 출력
  - 최종 요약 5줄 생성 (What, Why, Key changes, Verification, Rollback)

### PR-DESCRIPTION-FINAL v0.23
- **파일**: `PR-DESCRIPTION-FINAL-v0.23.md`
- **생성일**: 2025-12-22
- **목적**: PR 본문 완성형 생성 및 머지/태그 최종 확인
- **상태**: 📝 문서화 완료
- **다음 버전**: v0.25 (RELEASE-CARD-COPY)
- **주요 절차**:
  - main 스냅샷 + 빌드 검증 (Exit 0)
  - 태그 확인
  - PR 본문 완성형 출력 (Summary, Changes, Verification, Risk, Rollback)
  - 롤백 해시 후보 1개 출력

### RELEASE-CARD-COPY v0.25
- **파일**: `RELEASE-CARD-COPY-v0.25.md`
- **생성일**: 2025-12-22
- **목적**: 릴리즈 카드 문구 및 레이아웃 스펙 제공
- **상태**: 📝 문서화 완료
- **다음 버전**: v0.26 (RELEASE-CARD-TONES)
- **주요 절차**:
  - 헤드라인 3가지 옵션 제공
  - 서브헤드 1줄
  - 핵심 포인트 3불릿
  - Footer 1줄 (릴리즈 버전)
  - CTA 3가지 옵션 제공
  - 레이아웃 스펙 (1080×1080 또는 1200×628)

### RELEASE-CARD-TONES v0.26
- **파일**: `RELEASE-CARD-TONES-v0.26.md`
- **생성일**: 2025-12-22
- **목적**: 릴리즈 카드 톤 버전 제공 (딱딱/친근)
- **상태**: 📝 문서화 완료
- **다음 버전**: v0.27 (노션/블로그 1페이지 릴리즈 노트 예정)
- **주요 절차**:
  - SET A: 딱딱(업무용) - 내부 보고서, 이메일, 공식 문서
  - SET B: 친근(SNS용) - 블로그, SNS, 팀 채팅
  - 각 세트별 헤드라인, 서브헤드, 핵심 포인트, 푸터, CTA 제공

---

## 버전 네이밍 규칙

### 프로토콜 버전
- **형식**: `<프로토콜명>-v<Major>.<Minor>`
- **예시**: NEWCHAT-PACKET-v0.1, RESOLVEPACK-v0.5

### 커밋 버전
- **형식**: `<기능>-v<Major>.<Minor>.<Patch>`
- **예시**: OPS-ACTIONS-v0.3.1, MAP-RECOVER-v0.3.3

### 버전 증가 규칙
- **Major**: 프로토콜 구조 변경
- **Minor**: 기능 추가, 개선
- **Patch**: 버그 수정, 문서 수정

---

## 파일 위치

```
docs/protocols/
├── README.md                      ← 이 파일 (버전 관리)
├── NEWCHAT-PACKET-v0.1.md         ← v0.1 (2.3K)
├── NEWCHAT-PACKET-v0.2.md         ← v0.2 (4.7K)
├── FIXPACK-v0.1.md                ← v0.1 (3.6K)
├── RESOLVEPACK-v0.5.md            ← v0.5 (4.5K)
├── LINEPATCHPACK-v0.6.md          ← v0.6 (4.7K)
├── PATCHSCRIPT-v0.7.md            ← v0.7 (4.8K)
├── PRPACK-v0.8.md                 ← v0.8 (5.2K)
├── NEXTCHAT-STARTER-v0.9.md       ← v0.9 (2.1K)
├── MAP-SUSPENSE-FIX-v0.10.md      ← v0.10 (2.8K)
├── RESOLVE-LINE-v0.12.md          ← v0.12 (3.1K)
├── PATCH-v0.13.md                 ← v0.13 (2.9K)
├── PRPACK-v0.14.md                ← v0.14 (3.2K)
├── MERGE-MAIN-v0.15.md            ← v0.15 (3.0K)
├── CONFLICT-SNAPSHOT-v0.16.md     ← v0.16 (3.1K)
├── CONFLICT-PATCH-v0.17.md        ← v0.17 (3.0K)
├── BUILD-FAIL-SNAPSHOT-v0.18.md   ← v0.18 (3.2K)
├── BUILD-FAIL-PATCH-v0.19.md      ← v0.19 (3.1K)
├── RELEASE-NOTES-v0.20.md         ← v0.20 (3.4K)
├── FINAL-SUMMARY-PACK-v0.22.md    ← v0.22 (2.8K)
├── PR-DESCRIPTION-FINAL-v0.23.md  ← v0.23 (3.2K)
├── RELEASE-CARD-COPY-v0.25.md     ← v0.25 (2.9K)
└── RELEASE-CARD-TONES-v0.26.md    ← v0.26 (3.1K)
```

---

## 사용 가이드

### 1. 새 세션 시작
```bash
# NEXTCHAT-STARTER v0.9 사용 (상태 확정 우선)
cat docs/protocols/NEXTCHAT-STARTER-v0.9.md

# NEWCHAT-PACKET v0.2 사용 (기능 구현)
cat docs/protocols/NEWCHAT-PACKET-v0.2.md
```

### 2. 빌드 오류 발생
```bash
# FIXPACK v0.1 확인
cat docs/protocols/FIXPACK-v0.1.md
```

### 3. 충돌 발생
```bash
# RESOLVEPACK v0.5 → LINEPATCHPACK v0.6 → PATCHSCRIPT v0.7 순서
cat docs/protocols/RESOLVEPACK-v0.5.md
cat docs/protocols/LINEPATCHPACK-v0.6.md
cat docs/protocols/PATCHSCRIPT-v0.7.md
```

### 4. PR 생성
```bash
# PRPACK v0.8 사용 (Exit 0 복구 후)
cat docs/protocols/PRPACK-v0.8.md

# PRPACK v0.14 사용 (최종 마감: 리베이스 + 푸시 + PR 템플릿)
cat docs/protocols/PRPACK-v0.14.md
```

### 5. main 머지
```bash
# MERGE-MAIN v0.15 사용 (PR 승인 후 main 반영)
cat docs/protocols/MERGE-MAIN-v0.15.md
```

### 6. 머지 충돌 발생
```bash
# CONFLICT-SNAPSHOT v0.16 사용 (충돌 라인 스냅샷 수집)
cat docs/protocols/CONFLICT-SNAPSHOT-v0.16.md

# CONFLICT-PATCH v0.17 사용 (apply_patch 충돌 해결)
cat docs/protocols/CONFLICT-PATCH-v0.17.md
```

---

## 변경 이력

### 2025-12-22
- ✅ NEWCHAT-PACKET v0.1 생성
- ✅ NEWCHAT-PACKET v0.2 생성 (v0.1 개선)
- ✅ FIXPACK v0.1 생성
- ✅ RESOLVEPACK v0.5 생성
- ✅ LINEPATCHPACK v0.6 생성
- ✅ PATCHSCRIPT v0.7 생성
- ✅ PRPACK v0.8 생성
- ✅ NEXTCHAT-STARTER v0.9 생성
- ✅ MAP-SUSPENSE-FIX v0.10 생성
- ✅ RESOLVE-LINE v0.12 생성
- ✅ PATCH v0.13 생성
- ✅ PRPACK v0.14 생성
- ✅ MERGE-MAIN v0.15 생성
- ✅ CONFLICT-SNAPSHOT v0.16 생성
- ✅ CONFLICT-PATCH v0.17 생성
- ✅ BUILD-FAIL-SNAPSHOT v0.18 생성
- ✅ BUILD-FAIL-PATCH v0.19 생성
- ✅ RELEASE-NOTES v0.20 생성
- ✅ FINAL-SUMMARY-PACK v0.22 생성
- ✅ PR-DESCRIPTION-FINAL v0.23 생성
- ✅ RELEASE-CARD-COPY v0.25 생성
- ✅ RELEASE-CARD-TONES v0.26 생성
- ✅ README.md 생성 (버전 관리)
- ✅ 버전 규칙 고정 (연속 증가: v0.9 → v0.10 → v0.11...)

---

## 다음 버전 계획

### v0.27 (예정)
- 노션/블로그 1페이지 릴리즈 노트
- 짧고 읽기 쉬운 릴리즈 노트 형식

### v0.21 (예정)
- FINAL-SMOKE: 최종 스모크 테스트
- main 브랜치 최종 검증
- 프로덕션 배포 전 마지막 확인

### v0.11 (예정)
- 통합/검증/커밋 자동화
- v0.10과 v0.12 사이 중간 단계
- 연속 버전 관리 강화

### NEWCHAT-PACKET v0.3 (예정)
- 더 많은 예외 처리
- 자동 롤백 기능

### 참고
- v0.14-PRPACK: PR 제출 자동화 (완료)
- v0.15-MERGE-MAIN: main 머지 자동화 (완료)
- v0.16-CONFLICT-SNAPSHOT: 충돌 라인 수집 (완료)
- v0.17-CONFLICT-PATCH: 충돌 해결 자동화 (완료)
- v0.18-BUILD-FAIL-SNAPSHOT: 빌드 에러 스냅샷 수집 (완료)
- v0.19-BUILD-FAIL-PATCH: 빌드 복구 자동화 (완료)
- v0.20-RELEASE-NOTES: CHANGELOG/릴리즈 노트 마감 (완료)
- v0.21-FINAL-SMOKE: 최종 스모크 테스트 (예정)
- v0.22-FINAL-SUMMARY-PACK: PR 요약문 5줄 정리 (완료)
- v0.23-PR-DESCRIPTION-FINAL: PR 본문 완성형 생성 (완료)
- v0.25-RELEASE-CARD-COPY: 릴리즈 카드 문구 + 레이아웃 스펙 (완료)

---

**최종 업데이트**: 2025-12-22
**관리자**: Claude Code (클로이)
