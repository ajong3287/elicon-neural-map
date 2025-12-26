# BUILD-FAIL-PATCH v0.19

**목적**: v0.18 스냅샷 기반 빌드 복구 자동 적용 (apply_patch)

## 핵심 결론 (1줄)

다음은 v0.18 스냅샷을 기반으로 자비스가 제공한 교체 블록을 apply_patch로 적용해 빌드를 복구하는 v0.19-BUILD-FAIL-PATCH입니다.

---

## 원샷 프롬프트

```
Claude Code(클로이)님, v0.18(BUILD_FAIL_SNAPSHOT) 로그를 바탕으로 자비스가 제공한 PATCH를 그대로 적용해 pnpm build Exit 0을 복구해주세요.
주의: 임의 수정 금지, 자비스 PATCH만 적용.

원칙:
• 이 블록 상단/하단 태그 1쌍만 유지(추가 태그 금지)
• 불필요한 해설/요약/인사 금지
• "명령 + 출력 로그 원문" 그대로만 출력
• 진행 중 "Pontificating…"이면 esc 또는 ctrl+c로 즉시 중단 후 계속
• 외부 패키지 추가 금지
• pnpm build Exit 0 아니면 커밋/푸시 금지

프로젝트 경로:
cd /Users/elicon_mark/Developer/개발02_슈퍼개발툴만들기/elicon-neural-map

0. 상태(원문)

• git status
• git branch --show-current
• git log --oneline -10

1. apply_patch 존재 확인(원문)

• command -v apply_patch || echo "NO_apply_patch"

2. (대기) v0.18 출력 로그를 이 메시지 아래에 그대로 붙여주세요

• echo "PASTE_v0.18_BUILD_FAIL_LOGS_HERE"

3. 자비스 PATCH 적용(자리표시자)
아래 PATCH START/END 사이를 자비스가 채워주면 그대로 실행하세요.

— PATCH START —

apply_patch <<'PATCH'
*** Begin Patch
*** Update File: <파일경로>
@@
-<에러 라인>
+<수정 라인>
*** End Patch
PATCH

— PATCH END —

4. 검증(원문)

• pnpm build && echo $?
(실패면)
• pnpm build 2>&1 | tail -260
• 종료(커밋 금지)

5. dev 확인(원문)

• pnpm dev
• URL 1줄 출력
• /ops 확인 1줄("OPS_OK")
• /map 확인 1줄("MAP_OK")

6. 커밋 1개(Exit 0일 때만)

• git add -A
• git commit -m "fix: restore build after merge (BUILD-FIX-v0.19.0)"
• git log --oneline -12

7. 원격 반영(작업 브랜치에 푸시)(원문)

• BR=$(git branch --show-current); echo $BR
• git push -u origin "$BR"

출력 규칙:
• 각 단계별로 명령 + 출력 로그 원문 그대로만 출력.
• 해설/요약/인사 금지.
```

---

## 예상 효과 & ROI

- **빌드 실패 해결을 "패치 블록 적용"으로 표준화해**, 동일 유형 이슈의 해결 시간을 반복적으로 줄입니다.

---

## 필요시 협업 제안

- **클로이**: v0.19 실행 + 빌드 복구 완료
- **자비스(나)**: v0.19가 끝나면, 최종적으로 **v0.20-RELEASE-NOTES**로 CHANGELOG/릴리즈 노트를 짧게 정리해 메인 반영까지 마감합니다.

---

## PATCH 형식

### apply_patch 빌드 복구 형식
```bash
apply_patch <<'PATCH'
*** Begin Patch
*** Update File: <파일경로>
@@
-<에러 발생 라인>
+<수정된 라인>
*** End Patch
PATCH
```

---

## 상태
- **생성일**: 2025-12-22
- **목적**: v0.18 스냅샷 기반 빌드 복구 자동 적용
- **이전 버전**: v0.18 (BUILD-FAIL-SNAPSHOT)
- **다음 버전**: v0.20 (RELEASE-NOTES 예정)
