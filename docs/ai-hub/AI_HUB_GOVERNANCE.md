[AI-HUB-GOV-v0.2 제공]

# AI Hub Governance (GitHub 중심: Claude 구현 + Codex 리뷰)

## 목표(데모 성공 기준)
- PR 1개에서 @claude 커밋 + @codex review 코멘트 + 빌드/CI 결과가 남는다.

## 역할
- **Claude**: 구현/커밋/푸시
- **Codex**: PR 코드리뷰
- **Jarvis**: 최종 결정(승인/리젝/다음 지시)

## 표준 흐름
1. Issue 생성
2. PR 생성
3. @claude 구현 요청
4. 빌드/테스트 확인
5. @codex review
6. 반영 여부 결정
7. 머지/태그/노트

## 브랜치 규칙
- feat/-, fix/-, chore/INTEGRATE-

## PR 게이트
- **필수**: pnpm build Exit 0 (또는 CI green)
- **권장**: Risk + Rollback 1줄

[AI-HUB-GOV-v0.2 제공완료]
