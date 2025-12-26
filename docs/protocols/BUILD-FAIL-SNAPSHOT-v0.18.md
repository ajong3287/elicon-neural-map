# BUILD-FAIL-SNAPSHOT v0.18

**목적**: 머지 후 빌드 실패 시 에러 라인 스냅샷 수집 (해결 시도 금지)

## 핵심 결론 (1줄)

다음은 머지 후 빌드가 깨졌을 때 "해결 시도 없이" 에러 라인만 확정해서, 제가 즉시 교체 패치를 만들 수 있게 하는 v0.18-BUILD-FAIL-SNAPSHOT입니다.

---

## 원샷 프롬프트

```
Claude Code(클로이)님, 머지 이후 pnpm build가 실패한 경우에만 아래를 실행해주세요.
목표: 원인 로그/핵심 라인 스냅샷만 수집(수정/해결 시도 금지).

원칙:
• 이 블록 상단/하단 태그 1쌍만 유지(추가 태그 금지)
• 불필요한 해설/요약/인사 금지
• "명령 + 출력 로그 원문" 그대로만 출력
• 진행 중 "Pontificating…"이면 esc 또는 ctrl+c로 즉시 중단 후 계속
• 외부 패키지 추가 금지
• 이 단계에서는 임의 수정/해결 시도 금지(수집만)

프로젝트 경로:
cd /Users/elicon_mark/Developer/개발02_슈퍼개발툴만들기/elicon-neural-map

0. 현재 상태(원문)

• git status
• git branch --show-current
• git log --oneline -12

1. 빌드 실패 로그 수집(원문)

• pnpm build 2>&1 | tee /tmp/build_fail.log
• echo "=== BUILD_FAIL_TAIL ==="
• tail -260 /tmp/build_fail.log

2. 핵심 에러 라인 추출(원문)

• echo "=== KEY_LINES ==="
• grep -nE "useSearchParams\(|should be wrapped in a suspense boundary|Type error:|Failed to compile|Error:|Module not found|Cannot find module|TS\\d{3,5}" /tmp/build_fail.log | tail -160 || true

3. 최근 변경 파일(원문)

• echo "=== RECENT_DIFF (name-only) ==="
• git diff --name-only HEAD~1..HEAD || true
• echo "=== RECENT_DIFF (stat) ==="
• git diff --stat HEAD~1..HEAD || true

4. /map /ops 관련 파일 존재 확인(원문)

• ls -la src/app/map src/app/ops 2>/dev/null || true
• find src/app -maxdepth 3 -type f \( -path "*/map/*" -o -path "*/ops/*" \) | sed -n '1,220p' || true

5. 종료 플래그(원문)

• echo "BUILD_FAIL_SNAPSHOT_READY"
• git status

출력 규칙:
• 각 단계별로 명령 + 출력 로그 원문 그대로만 출력.
• 해설/요약/인사 금지.
```

---

## 예상 효과 & ROI

- **빌드 실패를 "추측 수정"으로 키우지 않고**, 에러 라인만 확정해서 1회 패치로 끝낼 확률을 극대화합니다.

---

## 필요시 협업 제안

- **클로이**: v0.18 실행 + 에러 라인 스냅샷 수집만
- **자비스(나)**: v0.18 로그를 주면, 바로 **v0.19-BUILD-FAIL-PATCH(apply_patch 교체 블록)**로 이어서 클로이는 복붙 실행만 하면 끝나게 만듭니다.

---

## 수집 항목

### 빌드 실패 로그
- 전체 빌드 로그 (/tmp/build_fail.log)
- 마지막 260줄
- 핵심 에러 라인 (useSearchParams, Suspense, Type error 등)

### 최근 변경 정보
- 마지막 커밋 이후 변경 파일 목록
- 변경 파일 통계

### 프로젝트 구조
- /map, /ops 관련 파일 목록
- 파일 존재 여부 확인

---

## 상태
- **생성일**: 2025-12-22
- **목적**: 머지 후 빌드 실패 시 에러 라인 스냅샷 수집
- **이전 버전**: v0.17 (CONFLICT-PATCH)
- **다음 버전**: v0.19 (BUILD-FAIL-PATCH 예정)
