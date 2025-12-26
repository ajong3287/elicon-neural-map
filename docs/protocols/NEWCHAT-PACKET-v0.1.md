# NEWCHAT-PACKET v0.1

**목적**: 새 세션에서 OPS-ACTIONS 기능 구현을 원샷으로 완료

## 핵심 결론 (1줄)

아래 "원샷 프롬프트"를 새 창 첫 메시지로 그대로 붙여넣으면, 클로이가 멈춤 해제→상태 점검→A안(명령 복사) 구현→빌드 검증까지 한 번에 진행합니다.

---

## 원샷 프롬프트

```
Claude Code(클로이)님, elicon-neural-map 프로젝트 작업 부탁드립니다.
원칙: 버전 태그 유지, 불필요한 설명 금지, 실행/로그 원문 위주. (중요) 진행 중 "Pontificating…"이면 esc 또는 ctrl+c로 즉시 중단 후 계속 진행.

프로젝트 경로:
cd /Users/elicon_mark/Developer/\[개발\]02_슈퍼개발툴만들기/elicon-neural-map

0) 현재 상태 점검(원문 출력)
- git status
- git branch --show-current
- git log --oneline -10
- pnpm build && echo $?

1) main 기준선 확보(빌드 0 확인 후 진행)
- git checkout main
- pnpm build && echo $?

2) A안 구현: /ops에 "Actions(명령 복사)" 기능 추가
- 브랜치: git checkout -b feat/OPS-ACTIONS-001
- 구현 파일: src/app/ops/page.tsx (필요시 컴포넌트 분리 가능)
- 요구:
  a) Actions 섹션(상단)
  b) 입력 2개: Issue ID(기본 REQ-003), Title(기본 "build hygiene + ops workflow")
  c) 버튼 3개(클립보드 복사):
     - Copy: new issue -> ops/new_issue.sh REQ-003 "Title..."
     - Copy: new proof -> ops/new_proof.sh REQ-003 proof_slug
     - Copy: new decision -> ops/new_decision.sh REQ-003 decision_slug
  d) navigator.clipboard 실패 시 textarea select+copy fallback
  e) 복사 성공 시 "Copied!" 1줄 표시
  f) 외부 패키지 추가 금지

3) 검증(원문 출력)
- pnpm build && echo $?
- pnpm dev 실행 후 접속 URL 1줄(포트 포함)
- /ops 화면에서 버튼 클릭으로 실제 복사 1회 확인(확인 결과 1줄)

4) 커밋(1개)
- git add (변경 파일)
- git commit -m "feat: ops actions command copier (OPS-ACTIONS-v0.3.1)"
- git log --oneline -10 원문 출력

출력 규칙:
- 각 단계별로 명령 실행 로그 원문을 그대로 붙여주세요.
- 불필요한 해설/인사/요약 금지.
```

---

## 상태
- **생성일**: 2025-12-22
- **사용됨**: feat/OPS-ACTIONS-001 구현 완료 (main 병합 완료)
- **다음 버전**: v0.2로 개선됨
