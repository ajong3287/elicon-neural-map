# CONFLICT-PATCH v0.17

**목적**: v0.16 스냅샷 기반 충돌 해결 자동 적용 (apply_patch)

## 핵심 결론 (1줄)

다음은 v0.16 스냅샷을 받자마자 충돌 마커 구간을 apply_patch로 교체해서 머지를 끝내는 v0.17-CONFLICT-PATCH입니다.

---

## 원샷 프롬프트

```
Claude Code(클로이)님, v0.16(CONFLICT_SNAPSHOT) 로그를 바탕으로 자비스가 제공한 교체 PATCH를 그대로 적용해 머지 충돌을 해결해주세요.
주의: 임의 해결 금지, 자비스 PATCH만 적용.

원칙:
• 이 블록 상단/하단 태그 1쌍만 유지(추가 태그 금지)
• 불필요한 해설/요약/인사 금지
• "명령 + 출력 로그 원문" 그대로만 출력
• 진행 중 "Pontificating…"이면 esc 또는 ctrl+c로 즉시 중단 후 계속
• 외부 패키지 추가 금지
• pnpm build Exit 0 아니면 커밋/푸시 금지

프로젝트 경로:
cd /Users/elicon_mark/Developer/개발02_슈퍼개발툴만들기/elicon-neural-map

0. 현재 상태(원문)

• git status
• git branch --show-current
• git log --oneline -10

1. apply_patch 존재 확인(원문)

• command -v apply_patch || echo "NO_apply_patch"

2. (대기) v0.16 출력 로그를 이 메시지 아래에 그대로 붙여주세요

• echo "PASTE_v0.16_CONFLICT_LOGS_HERE"

3. 자비스 PATCH 적용(자리표시자)
아래 PATCH START/END 사이를 자비스가 채워주면 그대로 실행하세요.

— PATCH START —

apply_patch <<'PATCH'
*** Begin Patch
*** Update File: <파일경로>
@@
-<<<<<<< HEAD
-…
-=======
-…
->>>>>>> <브랜치명>
+<RESOLVED_BLOCK>
*** End Patch
PATCH

— PATCH END —

4. 머지 완료 처리(원문)

• git status
• git add -A
• git commit -m "fix: resolve merge conflicts (CONFLICT-v0.17.0)"

5. 최종 검증(원문)

• pnpm build && echo $?
(실패면)
• pnpm build 2>&1 | tail -220
• 종료(푸시 금지)

6. 원격 main 푸시(원문)

• git checkout main
• git log --oneline -12
• git push origin main

7. 종료(원문)

• git status
• echo "CONFLICT_PATCH_DONE"

출력 규칙:
• 각 단계별로 명령 + 출력 로그 원문 그대로만 출력.
• 해설/요약/인사 금지.
```

---

## 예상 효과 & ROI

- **충돌 해결을 "수동 편집"에서 "교체 블록 적용"으로 바꿔** 실수/재충돌을 줄이고, 머지 시간을 크게 단축합니다.

---

## 필요시 협업 제안

- **클로이**: v0.17 실행 + 교체 PATCH 적용
- **자비스(나)**: 머지 후에도 build가 깨지면, 즉시 **v0.18-BUILD-FAIL-SNAPSHOT**으로 넘어가서 에러 라인만 뽑아 1회 패치로 끝내겠습니다.

---

## PATCH 형식

### apply_patch 충돌 해결 형식
```bash
apply_patch <<'PATCH'
*** Begin Patch
*** Update File: <파일경로>
@@
-<<<<<<< HEAD
-<충돌 마커 전체 블록>
-=======
-<충돌 마커 전체 블록>
->>>>>>> <브랜치명>
+<해결된 코드 블록>
*** End Patch
PATCH
```

---

## 상태
- **생성일**: 2025-12-22
- **목적**: v0.16 스냅샷 기반 충돌 해결 자동 적용
- **이전 버전**: v0.16 (CONFLICT-SNAPSHOT)
- **다음 버전**: v0.18 (BUILD-FAIL-SNAPSHOT 예정)
