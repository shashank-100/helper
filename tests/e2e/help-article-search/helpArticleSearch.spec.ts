import { expect, test } from "@playwright/test";
import { eq } from "drizzle-orm";
import { db } from "../../../db/client";
import { conversations, userProfiles } from "../../../db/schema";
import { authUsers } from "../../../db/supabaseSchema/auth";
import { conversationFactory } from "../../../tests/support/factories/conversations";

test.use({ storageState: "tests/e2e/.auth/user.json" });

test.describe("Help Article Search", () => {
  let testConversationId: number | null = null;
  let testUserId: string | null = null;

  test.beforeAll(async () => {
    // Find the test user
    const user = await db
      .select({
        id: userProfiles.id,
        displayName: userProfiles.displayName,
        email: authUsers.email,
      })
      .from(userProfiles)
      .innerJoin(authUsers, eq(userProfiles.id, authUsers.id))
      .where(eq(authUsers.email, "support@gumroad.com"))
      .limit(1);

    if (user.length > 0) {
      testUserId = user[0].id;

      // Create a test conversation for this user
      const { conversation } = await conversationFactory.create({
        emailFrom: "test@example.com",
        emailFromName: "Test User",
        subject: "Test conversation for help article search",
        subjectPlaintext: "Test conversation for help article search",
        status: "open",
        conversationProvider: "gmail",
        assignedToId: testUserId,
      });

      testConversationId = conversation.id;
    }
  });

  test.afterAll(async () => {
    // Clean up the test conversation
    if (testConversationId) {
      await db.delete(conversations).where(eq(conversations.id, testConversationId));
    }
  });

  test.beforeEach(async ({ page }) => {
    await page.goto("/mine", { timeout: 15000 });
    await page.waitForLoadState("networkidle", { timeout: 10000 });

    // Wait for conversations to load
    await page.waitForSelector('a[href*="/conversations?id="]', { timeout: 30000 });

    // Click on first conversation
    await page.click('a[href*="/conversations?id="]');
    await page.waitForLoadState("networkidle", { timeout: 15000 });
  });

  test("should trigger popover when typing @", async ({ page }) => {
    const editor = page.locator('[contenteditable="true"][role="textbox"]').first();
    await editor.waitFor({ timeout: 10000 });
    await editor.click();

    await page.keyboard.type("@");

    // Wait for popover to appear using cross-browser compatible selector
    const popover = page.locator("body > div").filter({
      has: page.locator("span", { hasText: "Search help center articles" }),
    });
    await expect(popover).toBeVisible({ timeout: 10000 });
  });

  test("should show help articles in popover", async ({ page }) => {
    const editor = page.locator('[contenteditable="true"][role="textbox"]').first();
    await editor.waitFor({ timeout: 10000 });
    await editor.click();

    await page.keyboard.type("@");

    // Wait for popover to appear using cross-browser compatible selector
    const popover = page.locator("body > div").filter({
      has: page.locator("span", { hasText: "Search help center articles" }),
    });
    await expect(popover).toBeVisible({ timeout: 10000 });

    // Wait for articles to appear using cross-browser compatible selector
    const articleItems = page.locator("body > div li").filter({
      has: page.locator("span.font-medium"),
    });
    await expect(articleItems.first()).toBeVisible({ timeout: 5000 });

    // Check that articles are displayed
    const count = await articleItems.count();
    expect(count).toBeGreaterThan(0);
  });

  test("should filter articles when typing search query", async ({ page }) => {
    const editor = page.locator('[contenteditable="true"][role="textbox"]').first();
    await editor.waitFor({ timeout: 10000 });
    await editor.click();

    await page.keyboard.type("@");

    // Wait for popover to appear using cross-browser compatible selector
    const popover = page.locator("body > div").filter({
      has: page.locator("span", { hasText: "Search help center articles" }),
    });
    await expect(popover).toBeVisible({ timeout: 10000 });

    // Wait for articles to appear using cross-browser compatible selector
    const articleItems = page.locator("body > div li").filter({
      has: page.locator("span.font-medium"),
    });
    await expect(articleItems.first()).toBeVisible({ timeout: 5000 });

    // Type search query
    await page.keyboard.type("account");

    // Check that filtered results are shown
    const count = await articleItems.count();
    expect(count).toBeGreaterThan(0);

    // Verify first article contains "account"
    const firstArticle = articleItems.first().locator("span.font-medium");
    const text = await firstArticle.textContent();
    expect(text?.toLowerCase()).toContain("account");
  });

  test("should insert article link when selected", async ({ page }) => {
    const editor = page.locator('[contenteditable="true"][role="textbox"]').first();
    await editor.waitFor({ timeout: 10000 });
    await editor.click();

    await page.keyboard.type("@");

    // Wait for popover to appear using cross-browser compatible selector
    const popover = page.locator("body > div").filter({
      has: page.locator("span", { hasText: "Search help center articles" }),
    });
    await expect(popover).toBeVisible({ timeout: 10000 });

    // Wait for articles to appear using cross-browser compatible selector
    const articleItems = page.locator("body > div li").filter({
      has: page.locator("span.font-medium"),
    });
    await expect(articleItems.first()).toBeVisible({ timeout: 5000 });

    // Select first article
    await page.keyboard.press("Enter");

    // Wait for popover to disappear
    await expect(popover).not.toBeVisible({ timeout: 5000 });

    // Check that link was inserted
    const content = await editor.innerHTML();
    expect(content).toContain("href=");
    expect(content).toContain('target="_blank"');
  });

  test("should close popover with Escape key", async ({ page }) => {
    const editor = page.locator('[contenteditable="true"][role="textbox"]').first();
    await editor.waitFor({ timeout: 10000 });
    await editor.click();

    await page.keyboard.type("@");

    // Wait for popover to appear using cross-browser compatible selector
    const popover = page.locator("body > div").filter({
      has: page.locator("span", { hasText: "Search help center articles" }),
    });
    await expect(popover).toBeVisible({ timeout: 10000 });

    // Close popover with Escape key
    await page.keyboard.press("Escape");

    // Wait for popover to disappear
    await expect(popover).not.toBeVisible({ timeout: 5000 });
  });
});
