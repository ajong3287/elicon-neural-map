# PATCHSCRIPT v0.7

**목적**: v0.6 결과를 바탕으로 자동 패치 스크립트로 라인 교체 강제 적용

## 핵심 결론 (1줄)

v0.6 결과를 받자마자 "자동 패치 스크립트(apply_patch)"로 라인 교체를 강제해서, 클로이가 그대로 실행만 하면 되는 PATCHSCRIPT 패킷입니다.

---

## 원샷 프롬프트

```
Claude Code(클로이)님, v0.6 LINEPATCH 결과를 바탕으로 자비스가 지정한 패치 블록을 "그대로 적용"하는 단계입니다.
주의: 아직 자비스가 실제 패치 블록(교체 내용)을 주기 전이라, 아래는 "틀"만 준비합니다.
v0.6 출력 로그를 이 메시지 아래에 그대로 붙여주면, 자비스가 즉시 PATCH 블록을 채워 제공합니다.

원칙:
• 버전 태그 유지
• 불필요한 해설/요약/인사 금지
• "명령 + 출력 로그 원문" 그대로만 출력
• 진행 중 "Pontificating…"이면 esc 또는 ctrl+c로 즉시 중단 후 계속
• 외부 패키지 추가 금지
• 이 단계에서는 임의 수정 금지(자비스 PATCH 블록만 적용)

프로젝트 경로:
cd /Users/elicon_mark/Developer/개발02_슈퍼개발툴만들기/elicon-neural-map

0. 준비(원문)

• git status
• git branch --show-current

1. apply_patch 유틸 확인(없으면 sed 방식으로 대체)

• command -v apply_patch || echo "NO_apply_patch"

2. (대기) v0.6 출력 로그를 아래에 그대로 붙여주세요

• echo "PASTE_v0.6_LINEPATCH_LOGS_HERE"

3. 자비스가 제공할 PATCH 블록 적용 (자리표시자)

아래 "PATCH START/END" 사이를 자비스가 채워주면,
그대로 실행하고 원문 로그를 출력하세요.

— PATCH START —

(자비스가 제공할 명령이 여기에 들어갑니다)

예:

apply_patch <<'PATCH'
*** Begin Patch
*** Update File: src/app/map/page.tsx
@@
- old
+ new
*** End Patch
PATCH

— PATCH END —

4. 적용 후 검증(원문)

• pnpm build && echo $?

(실패면)
• pnpm build 2>&1 | tail -220
• 종료(커밋 금지)

5. 커밋 1개(Exit 0일 때만)

• git add -A
• git commit -m "fix: apply line patch to restore build (PATCHSCRIPT-v0.3.6)"
• git log --oneline -12

출력 규칙:
• 각 단계별로 명령 + 출력 로그 원문 그대로 붙여주세요.
• 해설/요약/인사 금지.
```

---

## 예상 효과 & ROI

- **"말로 설명 → 구현자가 해석" 구간을 없애고**, 교체 블록을 스크립트로 강제 적용하니 실수/누락이 거의 사라집니다.
- 보통 충돌 해결에서 가장 비싼 비용(재현/추측/반복)을 제거 → 시간 50% 이상 절감.

---

## 필요시 협업 제안

- **클로이**: v0.7 틀 실행 + v0.6 로그를 붙여넣기
- **자비스(나)**: 그 즉시 "PATCH START/END" 구간을 채운 실제 apply_patch 블록을 만들어서, 클로이가 그대로 복사 실행만 하게 만들겠습니다.

---

## 패치 블록 형식

### apply_patch 형식
```bash
apply_patch <<'PATCH'
*** Begin Patch
*** Update File: <파일경로>
@@
- <삭제할 라인>
+ <추가할 라인>
*** End Patch
PATCH
```

### sed 대체 방식 (apply_patch 없을 때)
```bash
# 특정 라인 교체
sed -i '' '라인번호s/old/new/' 파일명

# 범위 교체
sed -i '' '시작,끝d' 파일명
sed -i '' '위치i\
새 내용
' 파일명
```

---

## 워크플로우

1. **v0.6 실행** → 충돌 구간 라인 번호 수집
2. **v0.7 틀 준비** → PATCH 블록 자리표시자
3. **자비스가 PATCH 작성** → 정확한 라인 교체 명령
4. **클로이가 PATCH 적용** → 스크립트 실행만
5. **빌드 검증** → Exit 0 확인
6. **커밋** → PATCHSCRIPT-v0.3.6

---

## 상태
- **생성일**: 2025-12-22
- **목적**: 자동 패치 스크립트로 충돌/빌드 실패 해결
- **의존성**: v0.6-LINEPATCHPACK 결과 필요
- **출력**: 커밋 PATCHSCRIPT-v0.3.6
