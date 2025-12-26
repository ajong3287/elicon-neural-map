# NEXTCHAT-STARTER v0.9

**목적**: 새 세션 시작 시 현재 상태 확정 + Exit 0 검증 + 이슈 파악

## 핵심 결론 (1줄)

오케이, 이번 "다음"은 태그가 절대 안 깨지게 프롬프트 블록 전체를 1쌍 태그로만 감싼 v0.9-NEXTCHAT-STARTER 입니다.

---

## 원샷 프롬프트

```
Claude Code(클로이)님, elicon-neural-map 프로젝트에서 "현재 상태 확정 → 빌드 Exit 0 여부 확인 → 남은 이슈가 map(useSearchParams Suspense)인지 확인"만 수행해주세요.

원칙:
• 이 블록의 상단/하단 태그 1쌍만 유지(추가 태그 금지)
• 불필요한 해설/요약/인사 금지
• "명령 + 출력 로그 원문" 그대로만 출력
• 진행 중 "Pontificating…"이면 esc 또는 ctrl+c로 즉시 중단 후 계속
• 외부 패키지 추가 금지

프로젝트 경로:
cd /Users/elicon_mark/Developer/개발02_슈퍼개발툴만들기/elicon-neural-map

0. 상태 확정(원문)

• pwd
• git status
• git branch --show-current
• git log --oneline -15

1. 문제 커밋/파일 트래킹 확인(원문)

• git show --stat d00cdda || true
• git show --name-status d00cdda || true
• git log --follow --oneline -- src/app/map/page.tsx | head -40 || true

2. 빌드 실패 원인 확정(원문)

• pnpm build 2>&1 | tee /tmp/build.log
• echo "=== BUILD_TAIL ==="
• tail -120 /tmp/build.log

3. 결론 1줄만(해설 금지)

• echo "RESULT: EXIT_CODE=<여기에 pnpm build 종료코드>, KEY_ERROR=<가장 핵심 에러 1줄>"
```

---

## 예상 효과 & ROI

- **"지금 어디까지 됐지?"를 이 패킷 1회 실행 로그로 100% 확정**해서, 재작업/재지시 시간을 바로 제거합니다.

---

## 필요시 협업 제안

- **클로이**: v0.9 로그 제출
- **자비스(나)**: 로그 기준으로 **v1.0-고정 지시(수정 파일/교체 라인 포함)** 즉시 제공

---

## 상태
- **생성일**: 2025-12-22
- **목적**: 새 세션 시작 시 현재 상태 확정 및 빌드 검증
- **이전 버전**: v0.8 (PRPACK)
- **다음 버전**: v1.0 (예정)
