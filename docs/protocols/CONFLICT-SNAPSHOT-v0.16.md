# CONFLICT-SNAPSHOT v0.16

**목적**: v0.15 머지 충돌 발생 시 충돌 라인 스냅샷 수집 (해결 시도 금지)

## 핵심 결론 (1줄)

다음은 v0.15에서 머지 충돌이 났을 때 "해결 시도 없이" 충돌 라인만 수집해서, 제가 라인 교체 지시를 바로 내릴 수 있게 하는 v0.16-CONFLICT-SNAPSHOT입니다.

---

## 원샷 프롬프트

```
Claude Code(클로이)님, main 머지 과정(v0.15)에서 merge conflict가 발생한 경우에만 아래를 실행해주세요.
목표: 해결 시도 금지, 충돌 파일/라인 스냅샷만 수집.

원칙:
• 이 블록 상단/하단 태그 1쌍만 유지(추가 태그 금지)
• 불필요한 해설/요약/인사 금지
• "명령 + 출력 로그 원문" 그대로만 출력
• 진행 중 "Pontificating…"이면 esc 또는 ctrl+c로 즉시 중단 후 계속
• 외부 패키지 추가 금지
• 이 단계에서는 임의 수정/충돌 해결 시도 금지(수집만)

프로젝트 경로:
cd /Users/elicon_mark/Developer/개발02_슈퍼개발툴만들기/elicon-neural-map

0. 현재 상태(원문)

• git status
• git branch --show-current
• git log --oneline -10

1. 충돌 파일 목록(원문)

• git diff --name-only --diff-filter=U || true

2. 각 충돌 파일에 대해 "마커 라인 + 주변 컨텍스트" 수집
(충돌 파일마다 아래를 반복)

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

3. 머지 상태 추가 정보(원문)

• git merge --abort --no-edit 2>/dev/null || echo "NO_ABORT_DONE"
• echo "CONFLICT_SNAPSHOT_READY"
• git status

출력 규칙:
• 각 단계별로 명령 + 출력 로그 원문 그대로만 출력.
• 해설/요약/인사 금지.
```

---

## 예상 효과 & ROI

- **충돌을 손대기 전에 라인 근거를 확보해서**, 재작업/반복 머지 시간을 크게 줄입니다.

---

## 필요시 협업 제안

- **클로이**: v0.16 실행 + 충돌 라인 스냅샷 수집만
- **자비스(나)**: v0.16 로그를 주면, 바로 **v0.17-CONFLICT-PATCH(apply_patch 교체 블록)**을 만들어서 클로이는 복붙 실행만 하면 끝나게 합니다.

---

## 수집 항목

### 충돌 파일 정보
- 충돌 파일 목록 (git diff --name-only --diff-filter=U)
- 각 파일의 충돌 마커 라인 번호
- 충돌 마커 주변 ±80줄 컨텍스트

### 머지 상태
- 현재 브랜치 상태
- 머지 진행 상태
- 충돌 해결 전 스냅샷

---

## 상태
- **생성일**: 2025-12-22
- **목적**: v0.15 머지 충돌 시 충돌 라인 스냅샷 수집
- **이전 버전**: v0.15 (MERGE-MAIN)
- **다음 버전**: v0.17 (CONFLICT-PATCH 예정)
