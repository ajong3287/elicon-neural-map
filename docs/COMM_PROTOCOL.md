# COMM_PROTOCOL (Local Git Only)

## 목적
- 대화/출력/결정을 Git에 고정해 컨텍스트 누락을 제거한다.
- "요청 → 증거(출력) → 결정 → 다음 작업" 루프를 표준화한다.

## 단일원본(SSOT)
- 프롬프트: docs/PROMPT_REGISTRY.md
- 증거(출력 원문): docs/PROOFS/
- 결정(ADR): docs/DECISIONS/
- 요청/이슈: issues/

## 작업 모드(필수)
- ANALYSIS-LOCK: 코드/문서 변경 금지, 출력 원문만 PROOFS에 저장
- DOC-ONLY: docs/*만 변경 가능(Registry/Decision/Protocol)
- CODE-CHANGE: src/* 변경 허용(구현/리팩터/버그픽스)

## 브랜치 규칙
- 이슈 시작: req/<ISSUE_ID>
- 분석/수집: lock/<ISSUE_ID>
- 문서정리: doc/<ISSUE_ID>
- 코드변경: feat/<ISSUE_ID>, fix/<ISSUE_ID>

## 커밋 규칙(접두어 고정)
- proof: <ISSUE_ID> <요약>   (docs/PROOFS/*)
- decision: <ISSUE_ID> <요약> (docs/DECISIONS/*)
- prompt: <ISSUE_ID> <요약>   (docs/PROMPT_REGISTRY.md)
- doc: <ISSUE_ID> <요약>      (docs/*)
- feat/fix/chore: <ISSUE_ID> <요약>

## 파일명 규칙
- proofs: docs/PROOFS/YYYYMMDD_<ISSUE_ID>_<topic>.md
- decisions: docs/DECISIONS/YYYYMMDD_<ISSUE_ID>_<topic>.md
- issues: issues/<ISSUE_ID>.md

## 최소 운영 루프
1) issues/<ISSUE_ID>.md 생성(요청/완료조건/금지/필요증거)
2) lock/<ISSUE_ID> 브랜치에서 출력 수집 → docs/PROOFS 저장 → proof 커밋
3) doc/<ISSUE_ID> 브랜치에서 결정 정리 → docs/DECISIONS 저장 → decision 커밋
4) 필요하면 feat/fix 브랜치에서 구현 → 테스트/빌드 → PR 없이도 merge(로컬) 가능
