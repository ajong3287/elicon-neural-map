[AI-HUB-TPL-v0.2 제공]

# PR Comment Templates

## (1) Claude 구현 요청 템플릿

```
@claude

Goal:
- (예) /ops에 Actions(명령 복사) 섹션 추가

Constraints:
- 외부 패키지 추가 금지
- build Exit 0 유지
- 불필요한 설명 금지, 로그 원문 위주

Verification:
- pnpm build && echo $?
- pnpm dev 후 /ops OK 1줄

Output:
- 커밋 해시 1줄로 남기기
```

## (2) Codex 리뷰 요청 템플릿

```
@codex review

Focus:
- 빌드 안정성/보안/리그레션
- Next 규칙(useSearchParams/Suspense 등)
```

[AI-HUB-TPL-v0.2 제공완료]
