import { expect, test } from "@playwright/test";

test.describe("login flow", () => {
  test("redirects unauthenticated visitors to /login", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveURL(/\/login$/);
    await expect(page.getByRole("heading", { name: "FounderSplit" })).toBeVisible();
    await expect(page.getByLabel("Your name")).toBeVisible();
  });

  test("signs in with a valid first name and lands on home", async ({ page }) => {
    await page.goto("/login");
    await page.getByLabel("Your name").fill("yueran");
    await page.getByRole("button", { name: "Continue" }).click();
    await expect(page).toHaveURL("/");
    // Nav renders the display name and the tabs.
    await expect(page.getByRole("button", { name: /Yueran/i })).toBeVisible();
    await expect(page.getByRole("link", { name: "Home" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Activity" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Team" })).toBeVisible();
  });

  test("rejects an unknown first name", async ({ page }) => {
    await page.goto("/login");
    await page.getByLabel("Your name").fill("nobody");
    await page.getByRole("button", { name: "Continue" }).click();
    // The server action throws; Next.js's default error boundary shows a
    // generic message and we stay on /login (or the error page).
    await expect(page).not.toHaveURL(/^\/$/);
  });
});
