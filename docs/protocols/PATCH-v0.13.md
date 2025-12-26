# PATCH v0.13

**목적**: v0.12 결과 기반 교체 블록을 apply_patch로 자동 적용

## 핵심 결론 (1줄)

다음은 v0.12 결과를 받으면 자비스가 만든 교체 블록을 apply_patch로 그대로 적용해서, 클로이는 실행만 하면 되는 v0.13-PATCH 패킷입니다.

---

## 원샷 프롬프트

```
Claude Code(클로이)님, v0.12 RESOLVE_LINE 결과 기반으로 자비스가 제공한 PATCH 블록을 그대로 적용해주세요.
주의: 임의 수정 금지, 자비스 PATCH만 적용.

원칙:
• 이 블록 상단/하단 태그 1쌍만 유지(추가 태그 금지)
• 불필요한 해설/요약/인사 금지
• "명령 + 출력 로그 원문" 그대로만 출력
• 진행 중 "Pontificating…"이면 esc 또는 ctrl+c로 즉시 중단 후 계속
• 외부 패키지 추가 금지
• build Exit 0 아니면 커밋 금지

프로젝트 경로:
cd /Users/elicon_mark/Developer/개발02_슈퍼개발툴만들기/elicon-neural-map

0. 상태(원문)

• git status
• git branch --show-current
• git log --oneline -10

1. apply_patch 존재 확인(원문)

• command -v apply_patch || echo "NO_apply_patch"

2. (대기) v0.12 출력 로그를 이 메시지 아래에 그대로 붙여주세요

• echo "PASTE_v0.12_LOGS_HERE"

3. 자비스 PATCH 적용(자리표시자)

아래 PATCH START/END 사이를 자비스가 채워주면,
그대로 실행하세요.

— PATCH START —

apply_patch <<'PATCH'
*** Begin Patch
*** Update File: <파일경로>
@@
- old
+ new
*** End Patch
PATCH

— PATCH END —

4. 검증(원문)

• pnpm build && echo $?

(실패면)
• pnpm build 2>&1 | tail -220
• 종료(커밋 금지)

5. dev 확인(원문)

• pnpm dev
• URL 1줄 출력
• /ops 확인 1줄("OPS_OK")
• /map 확인 1줄("MAP_OK")

6. 커밋 1개(Exit 0일 때만)

• git add -A
• git commit -m "fix: apply patch to restore build (PATCH-v0.13.0)"
• git log --oneline -12

출력 규칙:
• 각 단계별로 명령 + 출력 로그 원문 그대로만 출력.
• 해설/요약/인사 금지.
```

---

## 예상 효과 & ROI

- **충돌 해결을 "사람 해석"에서 "교체 블록 실행"으로 바꿔** 실수/누락을 크게 줄입니다.

---

## 필요시 협업 제안

- **클로이**: v0.13 실행 + Exit 0 확인
- **자비스(나)**: v0.13까지 끝나면, 마지막으로 v0.14-PRPACK(푸시+PR 템플릿)으로 깔끔하게 마감합니다.

---

## PATCH 블록 형식

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

## 상태
- **생성일**: 2025-12-22
- **목적**: v0.12 로그 기반 교체 블록 자동 적용
- **이전 버전**: v0.12 (RESOLVE-LINE)
- **다음 버전**: v0.14 (PRPACK 예정)
