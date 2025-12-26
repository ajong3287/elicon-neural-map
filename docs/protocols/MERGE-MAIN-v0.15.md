# MERGE-MAIN v0.15

**목적**: PR 승인 후 main 안전 머지 + Exit 0 재검증 + 원격 반영

## 핵심 결론 (1줄)

v0.14로 PR 준비가 끝났다면, 다음은 **main에 "안전 머지 + Exit 0 재검증 + 원격 반영"**까지 마감하는 v0.15-MERGE-MAIN입니다.

---

## 원샷 프롬프트

```
Claude Code(클로이)님, PR이 승인되었거나(또는 로컬 머지로 마감하려는 경우) main 반영까지 진행해주세요.

원칙:
• 이 블록 상단/하단 태그 1쌍만 유지(추가 태그 금지)
• 불필요한 해설/요약/인사 금지
• "명령 + 출력 로그 원문" 그대로만 출력
• 진행 중 "Pontificating…"이면 esc 또는 ctrl+c로 즉시 중단 후 계속
• 외부 패키지 추가 금지
• pnpm build Exit 0 아니면 merge/push 진행 금지(로그 출력 후 종료)
• merge conflict 발생 시 해결 시도 금지(상태 로그만 출력 후 종료)

프로젝트 경로:
cd /Users/elicon_mark/Developer/개발02_슈퍼개발툴만들기/elicon-neural-map

0. 현재 상태(원문)

• git status
• git branch --show-current
• git log --oneline -10

1. 원격 최신화(원문)

• git fetch --all --prune

2. main 기준선 확인(원문)

• git checkout main
• git pull --ff-only
• pnpm build && echo $?

(주의) 0이 아니면:
• pnpm build 2>&1 | tail -200
• 종료

3. 머지 대상 브랜치 지정(원문)
(현재 작업 브랜치명을 <작업브랜치>로 가정)

• git branch --all | sed -n '1,200p'
• echo "WORK_BRANCH_CANDIDATE=$(git for-each-ref --sort=-committerdate refs/remotes/origin --format='%(refname:short)' | head -20 | sed -n '1,20p')"

(아래 중 하나 선택)
A) 방금 작업 브랜치가 로컬에 남아 있으면:
• WORK=$(git branch --show-current) && echo $WORK
(만약 main이라면)
• git branch --format='%(refname:short)' | sed -n '1,120p'
• WORK=<여기서 작업 브랜치명 1개 선택 후 echo로 출력>
• echo $WORK

B) 원격만 있고 로컬에 없으면(원격 브랜치 체크아웃):
• git checkout -b <작업브랜치> origin/<작업브랜치>

4. main에 머지(원문)

• git checkout main
• git merge --no-ff <작업브랜치> -m "merge: ops ui + map suspense fixes (MERGE-v0.15.0)"

(충돌 검사)
• git status
(충돌이면)
• git diff --name-only --diff-filter=U || true
• 종료

5. 최종 검증(원문)

• pnpm build && echo $?
(실패면)
• pnpm build 2>&1 | tail -220
• 종료

6. 원격 main 푸시(원문)

• git push origin main

7. 반영 확인(원문)

• git log --oneline -12
• git status

출력 규칙:
• 각 단계별로 명령 + 출력 로그 원문 그대로만 출력.
• 해설/요약/인사 금지.
```

---

## 예상 효과 & ROI

- **"로컬에서 되는 것"을 main 반영 + Exit 0 재검증까지 닫아서**, 다음 작업 시작 시 재현/역추적 시간을 크게 줄입니다.

---

## 필요시 협업 제안

- **클로이**: v0.15 실행 + main 머지 완료
- **자비스(나)**: v0.15에서 충돌이 뜨면, 그 즉시 **v0.16-CONFLICT-SNAPSHOT(충돌 라인 수집 전용)**으로 이어서 "살릴 블록/버릴 블록"을 라인 단위로 확정해드립니다.

---

## 상태
- **생성일**: 2025-12-22
- **목적**: PR 승인 후 main 안전 머지 및 원격 반영
- **이전 버전**: v0.14 (PRPACK)
- **다음 버전**: v0.16 (CONFLICT-SNAPSHOT 예정)
