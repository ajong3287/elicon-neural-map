[AI-HUB-GOV-v0.1 제공]

# AI Hub Governance (Claude 구현 + Codex 리뷰)

## 역할
- **Claude**: 구현(코드 변경/커밋)
- **Codex**: PR 리뷰(코멘트)

## 표준 흐름
1. Issue 생성
2. PR 생성
3. @claude 로 구현 요청
4. CI/빌드 확인
5. @codex review
6. 머지

## 필수 규칙
- PR에는 What / Verification / Rollback 3줄 포함
- 작업 단위: Issue 1개 = PR 1개

[AI-HUB-GOV-v0.1 제공완료]
