# E2E Tests for elicon-neural-map

## STEP05.35: Seed Test Data

### Setup

1. **Install Playwright** (if not already installed):
```bash
pnpm add -D @playwright/test
pnpm exec playwright install chromium
```

2. **Verify installation**:
```bash
pnpm exec playwright --version
```

### Running Tests

**All E2E tests**:
```bash
pnpm exec playwright test
```

**Specific test file**:
```bash
pnpm exec playwright test tests/e2e/seed-dev.spec.ts
pnpm exec playwright test tests/e2e/seed-pm.spec.ts
```

**Watch mode** (for development):
```bash
pnpm exec playwright test --watch
```

**UI mode** (interactive):
```bash
pnpm exec playwright test --ui
```

### Test Coverage

#### 1. Share Dev Seed (`seed-dev.spec.ts`)
- ✅ Seed 4 dev nodes when button clicked
- ✅ Persist graph after refresh
- ✅ Block seed API in production

#### 2. Share PM Seed (`seed-pm.spec.ts`)
- ✅ Seed 5 PM nodes when button clicked
- ✅ Persist graph after refresh
- ✅ Differentiate PM nodes from Dev nodes

### Test Scenarios

**Scenario 1: Dev Seed Flow**
```
1. Navigate to /map
2. Click "Share Dev" (핑크 button)
3. Verify "🌱 Seeding Dev test data..." message
4. Verify "✅ Seeded 4 nodes, 3 links" message
5. Verify 4 nodes appear: Button.tsx, useTheme.ts, formatDate.ts, Card.tsx
```

**Scenario 2: PM Seed Flow**
```
1. Navigate to /map
2. Click "Share PM" (노란 button)
3. Verify "🌱 Seeding PM test data..." message
4. Verify "✅ Seeded 5 nodes, 4 links" message
5. Verify 5 nodes appear: Dashboard.tsx, api.ts, User.ts, Chart.tsx, data.ts
```

**Scenario 3: Production Block**
```
1. Set NODE_ENV=production
2. Call /api/seed?kind=dev
3. Verify 403 response
4. Verify error: "SEED_BLOCKED_IN_PRODUCTION"
```

### Debugging

**Run with debug mode**:
```bash
pnpm exec playwright test --debug
```

**View test report**:
```bash
pnpm exec playwright show-report
```

**Generate trace**:
```bash
pnpm exec playwright test --trace on
```

### CI/CD Integration

Add to `.github/workflows/test.yml`:
```yaml
- name: Install Playwright
  run: pnpm exec playwright install --with-deps

- name: Run E2E tests
  run: pnpm exec playwright test
```

### Notes

- Tests require dev server running on port 3001
- `playwright.config.ts` automatically starts dev server
- Tests use `data-node-id` selectors (update if DOM changes)
- Production block test only works with `NODE_ENV=production`

### ROI Metrics

**Time Savings**:
- Manual test: 30 min/cycle
- Automated test: 1 min/cycle
- **Savings: 29 min/cycle**

**Frequency**:
- 2 cycles/day × 20 days/month = 40 cycles/month
- **Monthly savings: 1,160 min = 19.3 hours**

**Regression Prevention**:
- Catch seed API production leak
- Catch graph persistence bugs
- Catch node rendering regressions
