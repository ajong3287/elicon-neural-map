# RESOLVE-LINE v0.12

**목적**: 통합 과정 충돌/빌드 실패 시 원인 로그/라인 스냅샷만 수집

## 핵심 결론 (1줄)

다음은 v0.11에서 충돌/빌드 실패가 나면 즉시 "원인 로그만" 뽑아와서 라인패치로 바로 끝내는 v0.12-RESOLVE-LINE 패킷입니다.

---

## 원샷 프롬프트

```
Claude Code(클로이)님, v0.11 통합 과정에서 merge conflict 또는 build fail이 발생한 경우에만 아래를 실행해주세요.
목표: 해결 시도 금지, 원인 로그/라인 스냅샷만 수집.

원칙:
• 이 블록 상단/하단 태그 1쌍만 유지(추가 태그 금지)
• 불필요한 해설/요약/인사 금지
• "명령 + 출력 로그 원문" 그대로만 출력
• 진행 중 "Pontificating…"이면 esc 또는 ctrl+c로 즉시 중단 후 계속
• 외부 패키지 추가 금지
• 이 패킷에서는 "임의 수정/해결 시도" 금지(수집만)

프로젝트 경로:
cd /Users/elicon_mark/Developer/개발02_슈퍼개발툴만들기/elicon-neural-map

0. 현재 상태(원문)

• git status
• git branch --show-current
• git log --oneline -12

1. 충돌 여부(원문)

• git diff --name-only --diff-filter=U || true

2-A) merge conflict인 경우: 충돌 마커 라인만 수집(파일마다)

(충돌 파일이 출력되면, 각 파일에 대해 아래 실행)

• echo "=== FILE: <파일명> ==="
• grep -nE '^(<<<<<<<|=======|>>>>>>>)' <파일명> || true
• python3 - <<'PY'
import re, pathlib
p = pathlib.Path("<파일명>")
s = p.read_text(errors="ignore").splitlines()
marks = [i for i,l in enumerate(s, start=1) if re.match(r'^(<<<<<<<|=======|>>>>>>>)', l)]
print("MARKS:", marks)
for m in marks:
  a = max(1, m-80); b = min(len(s), m+80)
  print(f"\n— CONTEXT {p} L{a}-L{b} (around L{m}) —")
  for i in range(a, b+1):
    print(f"{i:4d} | {s[i-1]}")
PY

(주의) 위 python 블록에서 <파일명>은 실제 파일 경로로 바꿔서 실행

2-B) 충돌이 없다면(build fail 수집 모드)

• pnpm build 2>&1 | tee /tmp/build_fail.log
• echo "=== BUILD_FAIL_TAIL ==="
• tail -220 /tmp/build_fail.log
• echo "=== KEY_LINES ==="
• grep -nE "useSearchParams\(|should be wrapped in a suspense boundary|Type error:|Failed to compile|Error:" /tmp/build_fail.log | tail -120 || true

3. 종료 플래그

• echo "RESOLVE_LINE_READY"

출력 규칙:
• 각 단계별로 명령 + 출력 로그 원문 그대로만 출력.
• 해설/요약/인사 금지.
```

---

## 예상 효과 & ROI

- **충돌/실패를 고치려다 더 꼬이는 걸 막고**, 라인 스냅샷만 뽑아 제가 바로 "교체 블록"으로 지시할 수 있게 해서 총 시간을 줄입니다.

---

## 필요시 협업 제안

- **클로이**: v0.12 실행 + 로그 수집만
- **자비스(나)**: v0.12 로그가 오면, 즉시 **v0.13-PATCH(교체 블록 apply_patch)**를 만들어서 클로이가 복붙 실행만 하게 하겠습니다.

---

## 수집 항목

### Merge Conflict 모드
- 충돌 파일 목록
- 각 파일의 충돌 마커 라인 번호
- 충돌 마커 주변 ±80줄 컨텍스트

### Build Fail 모드
- 전체 빌드 로그 (/tmp/build_fail.log)
- 마지막 220줄
- 핵심 에러 라인 (useSearchParams, Suspense, Type error 등)

---

## 상태
- **생성일**: 2025-12-22
- **목적**: v0.11 통합 실패 시 원인 로그/라인 스냅샷 수집
- **이전 버전**: v0.10 (MAP-SUSPENSE-FIX)
- **다음 버전**: v0.13 (PATCH 예정)
