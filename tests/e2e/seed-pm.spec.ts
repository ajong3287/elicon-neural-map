import { test, expect } from "@playwright/test";

/**
 * STEP05.35 E2E Test: Share PM Seed
 *
 * Test Flow:
 * 1. Navigate to /map
 * 2. Click Share PM button (노란)
 * 3. Verify "Seeded 5 nodes" message
 * 4. Verify 5 nodes appear on the map
 * 5. Verify graph persists after refresh
 */

test.describe("Seed PM Test", () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the map page
    await page.goto("http://localhost:3001/map");
    await page.waitForLoadState("networkidle");
  });

  test("should seed 5 PM nodes when Share PM button is clicked", async ({
    page,
  }) => {
    // Step 1: Click Share PM button
    // Note: Update selector based on actual button in MapClient.tsx
    const sharePMButton = page.locator('button:has-text("Share PM")');
    await expect(sharePMButton).toBeVisible();
    await sharePMButton.click();

    // Step 2: Verify seeding message appears
    const seedingMessage = page.locator('text="🌱 Seeding PM test data..."');
    await expect(seedingMessage).toBeVisible({ timeout: 3000 });

    // Step 3: Verify success message with 5 nodes
    const successMessage = page.locator('text="✅ Seeded 5 nodes, 4 links"');
    await expect(successMessage).toBeVisible({ timeout: 5000 });

    // Step 4: Wait for graph to load
    await page.waitForTimeout(2000);

    // Step 5: Verify 5 nodes are rendered on the map
    // Note: Update selector based on actual node rendering in D3 visualization
    const nodes = page.locator('[data-node-id]');
    await expect(nodes).toHaveCount(5, { timeout: 5000 });

    // Step 6: Verify node IDs match pm-seed.json
    const expectedNodeIds = [
      "src/pages/Dashboard.tsx",
      "src/services/api.ts",
      "src/models/User.ts",
      "src/components/Chart.tsx",
      "src/utils/data.ts",
    ];

    for (const nodeId of expectedNodeIds) {
      const node = page.locator(`[data-node-id="${nodeId}"]`);
      await expect(node).toBeVisible({ timeout: 2000 });
    }
  });

  test("should persist PM graph after refresh", async ({ page }) => {
    // Step 1: Click Share PM to seed data
    const sharePMButton = page.locator('button:has-text("Share PM")');
    await sharePMButton.click();

    // Step 2: Wait for seeding to complete
    await page.waitForTimeout(3000);

    // Step 3: Refresh the page
    await page.reload();
    await page.waitForLoadState("networkidle");

    // Step 4: Verify nodes still exist
    const nodes = page.locator('[data-node-id]');
    await expect(nodes).toHaveCount(5, { timeout: 5000 });
  });

  test("should differentiate PM nodes from Dev nodes", async ({ page }) => {
    // Step 1: Click Share PM to seed PM data
    const sharePMButton = page.locator('button:has-text("Share PM")');
    await sharePMButton.click();
    await page.waitForTimeout(3000);

    // Step 2: Verify PM-specific nodes exist
    const dashboardNode = page.locator(
      '[data-node-id="src/pages/Dashboard.tsx"]'
    );
    await expect(dashboardNode).toBeVisible();

    const apiNode = page.locator('[data-node-id="src/services/api.ts"]');
    await expect(apiNode).toBeVisible();

    // Step 3: Verify Dev-specific nodes do NOT exist
    const buttonNode = page.locator(
      '[data-node-id="src/components/Button.tsx"]'
    );
    await expect(buttonNode).not.toBeVisible();
  });
});
