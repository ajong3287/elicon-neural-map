import { test, expect } from "@playwright/test";

/**
 * STEP05.35 E2E Test: Share Dev Seed
 *
 * Test Flow:
 * 1. Navigate to /map
 * 2. Click Share Dev button (핑크)
 * 3. Verify "Seeded 4 nodes" message
 * 4. Verify 4 nodes appear on the map
 * 5. Verify graph persists after refresh
 */

test.describe("Seed Dev Test", () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the map page
    await page.goto("http://localhost:3001/map");
    await page.waitForLoadState("networkidle");
  });

  test("should seed 4 dev nodes when Share Dev button is clicked", async ({
    page,
  }) => {
    // Step 1: Click Share Dev button
    // Note: Update selector based on actual button in MapClient.tsx
    const shareDevButton = page.locator('button:has-text("Share Dev")');
    await expect(shareDevButton).toBeVisible();
    await shareDevButton.click();

    // Step 2: Verify seeding message appears
    const seedingMessage = page.locator('text="🌱 Seeding Dev test data..."');
    await expect(seedingMessage).toBeVisible({ timeout: 3000 });

    // Step 3: Verify success message with 4 nodes
    const successMessage = page.locator('text="✅ Seeded 4 nodes, 3 links"');
    await expect(successMessage).toBeVisible({ timeout: 5000 });

    // Step 4: Wait for graph to load
    await page.waitForTimeout(2000);

    // Step 5: Verify 4 nodes are rendered on the map
    // Note: Update selector based on actual node rendering in D3 visualization
    const nodes = page.locator('[data-node-id]');
    await expect(nodes).toHaveCount(4, { timeout: 5000 });

    // Step 6: Verify node IDs match dev-seed.json
    const expectedNodeIds = [
      "src/components/Button.tsx",
      "src/hooks/useTheme.ts",
      "src/utils/formatDate.ts",
      "src/components/Card.tsx",
    ];

    for (const nodeId of expectedNodeIds) {
      const node = page.locator(`[data-node-id="${nodeId}"]`);
      await expect(node).toBeVisible({ timeout: 2000 });
    }
  });

  test("should persist dev graph after refresh", async ({ page }) => {
    // Step 1: Click Share Dev to seed data
    const shareDevButton = page.locator('button:has-text("Share Dev")');
    await shareDevButton.click();

    // Step 2: Wait for seeding to complete
    await page.waitForTimeout(3000);

    // Step 3: Refresh the page
    await page.reload();
    await page.waitForLoadState("networkidle");

    // Step 4: Verify nodes still exist
    const nodes = page.locator('[data-node-id]');
    await expect(nodes).toHaveCount(4, { timeout: 5000 });
  });

  test("should block seed API in production", async ({ page }) => {
    // This test should be run with NODE_ENV=production
    // For now, we'll simulate by calling the API directly

    const response = await page.request.get("/api/seed?kind=dev");

    // In development: expect 200
    // In production: expect 403
    if (process.env.NODE_ENV === "production") {
      expect(response.status()).toBe(403);

      const body = await response.json();
      expect(body.error).toBe("SEED_BLOCKED_IN_PRODUCTION");
    } else {
      expect(response.status()).toBe(200);
    }
  });
});
