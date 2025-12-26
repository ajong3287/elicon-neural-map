# LINEPATCHPACK v0.6

**목적**: 충돌/빌드 실패를 라인 번호 기반으로 정확히 스냅샷 수집

## 핵심 결론 (1줄)

충돌/빌드 실패를 "라인 번호 기반으로 딱 잘라 패치"할 수 있게, 클로이가 충돌 구간만 정확히 뽑아오는 LINEPATCH 패킷입니다.

---

## 원샷 프롬프트

```
Claude Code(클로이)님, elicon-neural-map에서 충돌/빌드 실패를 "라인 단위로 확정"하기 위한 스냅샷만 수집해주세요.
목표: 자비스가 파일/라인 단위 패치를 바로 지시할 수 있도록, 충돌 구간만 정확히 뽑아오기.

원칙:
• 버전 태그 유지
• 불필요한 해설/요약/인사 금지
• "명령 + 출력 로그 원문" 그대로만 출력
• 진행 중 "Pontificating…"이면 esc 또는 ctrl+c로 즉시 중단 후 계속
• 외부 패키지 추가 금지
• 이 단계에서는 "해결 시도" 금지(수집만)

프로젝트 경로:
cd /Users/elicon_mark/Developer/개발02_슈퍼개발툴만들기/elicon-neural-map

0. 기본 상태(원문)

• git status
• git branch --show-current
• git log --oneline -8

1. Merge conflict 존재 여부 판단(원문)

• git diff --name-only --diff-filter=U || true
• (충돌 파일이 있으면) 아래를 파일마다 반복:

  a) echo "=== FILE: <파일명> ==="
  b) grep -nE '^(<<<<<<<|=======|>>>>>>>)' <파일명> || true
  c) (충돌 마커 라인 기준으로 앞뒤 60줄씩 출력)

  • python3 - <<'PY'
import sys, re, pathlib
p = pathlib.Path("<파일명>")
s = p.read_text(errors="ignore").splitlines()
marks = [i for i,l in enumerate(s, start=1) if re.match(r'^(<<<<<<<|=======|>>>>>>>)', l)]
print("MARKS:", marks)
for m in marks:
  a = max(1, m-60); b = min(len(s), m+60)
  print(f"\n— CONTEXT {p} L{a}-L{b} (around L{m}) —")
  for i in range(a, b+1):
    print(f"{i:4d} | {s[i-1]}")
PY

(주의) 위 python 블록에서 <파일명>은 실제 파일 경로로 바꿔서 실행

2. 충돌이 없다면(=build fail 수집 모드)(원문)

• pnpm build 2>&1 | tee /tmp/build_fail.log
• echo "=== BUILD_FAIL_TAIL ==="
• tail -220 /tmp/build_fail.log

3. build fail의 "핵심 파일/라인 후보" 뽑기(원문)

(가능하면 아래 3개도 출력)

• echo "=== NEXT_ERRORS (grep) ==="
• grep -nE "useSearchParams\(|should be wrapped in a suspense boundary|Error:|Type error:|Failed to compile" /tmp/build_fail.log | tail -80 || true
• echo "=== TS/Next related files touched (recent) ==="
• git diff --name-only HEAD~1..HEAD || true
• git diff --stat HEAD~1..HEAD || true

4. 수집 종료

• echo "LINEPATCH_READY"
• git status

출력 규칙:
• 각 단계별 명령 + 출력 로그 원문 그대로 붙여주세요.
• 해설/요약/인사/추측 금지.
```

---

## 예상 효과 & ROI

- **충돌/에러를 "감으로 수정"하지 않고 충돌 마커 라인±60만 뽑아서**, 수정 범위를 수십 줄로 제한 → 재작업/사이드이펙트 비용이 크게 줄어듭니다.

---

## 필요시 협업 제안

- **클로이**: v0.6 패킷으로 충돌 구간 라인 출력만 제출
- **자비스(나)**: 그 출력 기반으로 **파일별 "어느 라인부터 어느 라인까지 무엇으로 교체"**하는 v0.7-PATCHSCRIPT(apply_patch/ed 기반) 지시문을 바로 제공합니다.

---

## 수집 항목

### 1. 기본 상태
- git status
- 현재 브랜치
- 최근 8개 커밋

### 2. Merge Conflict 모드
- 충돌 파일 목록
- 각 파일의 충돌 마커 라인 번호
- 충돌 마커 주변 ±60줄 컨텍스트

### 3. Build Fail 모드
- 전체 빌드 로그 (/tmp/build_fail.log)
- 마지막 220줄
- 에러 패턴 grep 결과

### 4. 파일 변경 이력
- 최근 변경된 파일 목록
- 파일별 변경 통계

---

## Python 스크립트 설명

**충돌 마커 추출 스크립트**:
```python
import sys, re, pathlib
p = pathlib.Path("<파일명>")
s = p.read_text(errors="ignore").splitlines()
marks = [i for i,l in enumerate(s, start=1) if re.match(r'^(<<<<<<<|=======|>>>>>>>)', l)]
print("MARKS:", marks)
for m in marks:
  a = max(1, m-60); b = min(len(s), m+60)
  print(f"\n— CONTEXT {p} L{a}-L{b} (around L{m}) —")
  for i in range(a, b+1):
    print(f"{i:4d} | {s[i-1]}")
```

**동작**:
1. 파일 전체를 줄 단위로 읽기
2. `<<<<<<<`, `=======`, `>>>>>>>` 마커 라인 번호 찾기
3. 각 마커 주변 ±60줄 출력 (라인 번호 포함)

---

## 에러 패턴

**grep 대상**:
- `useSearchParams()`
- `should be wrapped in a suspense boundary`
- `Error:`
- `Type error:`
- `Failed to compile`

**목적**: 빌드 실패 원인을 빠르게 특정

---

## 상태
- **생성일**: 2025-12-22
- **목적**: 충돌/빌드 실패 라인 단위 스냅샷 수집
- **다음 버전**: v0.7-PATCHSCRIPT (라인 단위 패치 적용)
