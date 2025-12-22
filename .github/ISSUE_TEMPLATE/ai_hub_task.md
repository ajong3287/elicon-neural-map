---
name: AI Hub Task
about: AI Hub 작업 단위(1 Issue = 1 PR)
title: "TASK: <SCOPE> - <description>"
labels: ["ai-hub"]
---

## Goal
-

## Constraints
- 외부 패키지 추가 금지
- pnpm build Exit 0

## Verification
- pnpm build
- (필요시) dev 스모크(/ops, /map)

## Rollback
- git revert <commit-hash>
