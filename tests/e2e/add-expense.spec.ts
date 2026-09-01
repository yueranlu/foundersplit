import { expect, test } from "@playwright/test";
import { cleanupExpensesByTag, testTag } from "./support/db";

test.describe("add expense flow", () => {
  const tag = testTag();

  test.afterAll(async () => {
    await cleanupExpensesByTag(tag);
  });

  test("adds an expense and it appears in Recent activity", async ({ page }) => {
    await page.goto("/login");
    await page.getByLabel("Your name").fill("yueran");
    await page.getByRole("button", { name: "Continue" }).click();
    await expect(page).toHaveURL("/");

    const description = `${tag} SaaS subscription`;
    await page.getByLabel("Description").fill(description);
    await page.getByLabel("Amount").fill("40.00");
    await page.getByLabel("Category").selectOption("software");
    await page.getByRole("button", { name: "Add expense" }).click();

    // Server action revalidates and re-renders the home page.
    await expect(page.getByText(description)).toBeVisible({ timeout: 10_000 });
    // Amount formatted.
    await expect(page.getByText(/\$40\.00/).first()).toBeVisible();
  });

  test("appears on the Activity page too", async ({ page }) => {
    await page.goto("/login");
    await page.getByLabel("Your name").fill("yueran");
    await page.getByRole("button", { name: "Continue" }).click();

    await page.getByRole("link", { name: "Activity" }).click();
    await expect(page).toHaveURL(/\/expenses$/);
    await expect(page.getByRole("heading", { name: "Activity" })).toBeVisible();
    await expect(page.getByText(new RegExp(tag))).toBeVisible();
  });
});
