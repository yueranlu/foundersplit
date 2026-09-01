import { expect, test } from "@playwright/test";
import {
  cleanupExpensesByTag,
  cleanupPaymentsByTag,
  memberByName,
  testTag,
  admin,
} from "./support/db";

/**
 * End to end: Yueran pays a $20 expense, so each of the other cofounders
 * owes Yueran their share. Then Dory pays Yueran back her exact share. The
 * home page should mark Dory as settled and record the payment in Activity.
 */
test.describe("settle-up flow", () => {
  const tag = testTag();

  test.afterAll(async () => {
    await cleanupPaymentsByTag(tag);
    await cleanupExpensesByTag(tag);
  });

  test("full cycle: add expense → settle → check activity", async ({ page }) => {
    // Seed the expense directly via the DB so we know the exact amount and
    // Playwright doesn't have to race the UI's revalidation.
    const yueran = await memberByName("yueran");
    const description = `${tag} Legal filing`;
    const amountCents = 2000; // $20 total. Split across N members.

    await admin()
      .from("expenses")
      .insert({
        date: new Date().toISOString().slice(0, 10),
        paid_by: yueran.id,
        description,
        category: "legal",
        amount_cents: amountCents,
        note: null,
        created_by: yueran.id,
      });

    // Sign in as Dory (she owes Yueran her share).
    await page.goto("/login");
    await page.getByLabel("Your name").fill("dory");
    await page.getByRole("button", { name: "Continue" }).click();
    await expect(page).toHaveURL("/");

    // Dory's row from her perspective should show she owes Yueran something.
    const yueranCard = page.locator("li", {
      has: page.getByRole("link", { name: /Settle$/ }),
    }).filter({ hasText: /Yueran/ });

    await expect(yueranCard).toBeVisible();

    // Open settle up from Dory's side.
    await page
      .getByRole("link", { name: /Settle$/ })
      .first()
      .click();
    await expect(page).toHaveURL(/\/settle\//);
    await expect(page.getByRole("heading", { name: "Settle up" })).toBeVisible();

    // Method + note + submit.
    await page.getByLabel("How").selectOption("e_transfer");
    await page.getByLabel("Note (optional)").fill(tag);
    await page.getByRole("button", { name: "Record payment" }).click();
    await expect(page).toHaveURL("/");

    // Activity should now show a payment from Dory to Yueran with our tag.
    await page.getByRole("link", { name: "Activity" }).click();
    await expect(page).toHaveURL(/\/expenses$/);
    // The tag now appears at least twice (expense description + payment note).
    // Assert both exist to confirm end-to-end wiring.
    await expect(page.getByText(new RegExp(`${tag}.*Legal filing`))).toBeVisible();
    await expect(page.getByText(new RegExp(`e-Transfer.*${tag}`))).toBeVisible();
  });
});
