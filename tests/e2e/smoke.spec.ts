import { test, expect } from "@playwright/test";

/**
 * Core user journey: signup → post chirp → follow another user → see their
 * chirp in the home feed → like it.
 *
 * This is intentionally a single, sequential flow so failures are easy to
 * locate.  Run with `npm run e2e`.
 */
const uid = () => Math.random().toString(36).slice(2, 8);

test("core user journey: signup → post → follow → feed → like", async ({ page }) => {
  // ── 1. Sign up as Alice ──────────────────────────────────────────────────
  const aliceEmail = `alice-${uid()}@example.com`;
  const aliceHandle = `alice${uid()}`;
  const alicePassword = "Password123!";

  await page.goto("/signup");
  await page.getByLabel(/email/i).fill(aliceEmail);
  await page.getByLabel(/handle/i).fill(aliceHandle);
  await page.getByLabel(/display name/i).fill("Alice");
  await page.getByLabel(/password/i).fill(alicePassword);
  await page.getByRole("button", { name: /sign up|register|create account/i }).click();

  // Should redirect to the home feed after signup
  await expect(page).toHaveURL(/\/(home|feed|$)/);

  // ── 2. Post a chirp as Alice ─────────────────────────────────────────────
  const aliceChirpText = `Hello from Alice! ${uid()}`;
  const composerInput = page.getByPlaceholder(/what.*happening|chirp/i).or(
    page.getByRole("textbox", { name: /compose|write/i })
  );
  await composerInput.fill(aliceChirpText);
  await page.getByRole("button", { name: /post|chirp|submit/i }).click();

  await expect(page.getByText(aliceChirpText)).toBeVisible();

  // ── 3. Sign out, sign up as Bob ──────────────────────────────────────────
  await page.getByRole("button", { name: /sign out|log out/i }).click();
  await page.waitForURL(/\/(login|signin|$)/);

  const bobEmail = `bob-${uid()}@example.com`;
  const bobHandle = `bob${uid()}`;

  await page.goto("/signup");
  await page.getByLabel(/email/i).fill(bobEmail);
  await page.getByLabel(/handle/i).fill(bobHandle);
  await page.getByLabel(/display name/i).fill("Bob");
  await page.getByLabel(/password/i).fill("Password123!");
  await page.getByRole("button", { name: /sign up|register|create account/i }).click();

  await expect(page).toHaveURL(/\/(home|feed|$)/);

  // ── 4. Bob follows Alice ─────────────────────────────────────────────────
  await page.goto(`/${aliceHandle}`);
  await page.getByRole("button", { name: /follow/i }).click();

  // After following, the button should switch to "Following" or "Unfollow"
  await expect(
    page.getByRole("button", { name: /following|unfollow/i })
  ).toBeVisible();

  // ── 5. Bob's home feed shows Alice's chirp ───────────────────────────────
  await page.goto("/");
  await expect(page.getByText(aliceChirpText)).toBeVisible();

  // ── 6. Bob likes Alice's chirp ───────────────────────────────────────────
  const chirpCard = page.locator("article, [data-testid='chirp']").filter({
    hasText: aliceChirpText,
  });
  await chirpCard.getByRole("button", { name: /like|heart/i }).click();

  // Like count should become 1 (or the button state should change)
  await expect(
    chirpCard.getByRole("button", { name: /liked|unlike|1/i }).or(
      chirpCard.locator("[aria-label*='liked']")
    )
  ).toBeVisible();
});

test("sign in with existing credentials", async ({ page }) => {
  // Register a fresh account then sign out and sign back in.
  const email = `signin-${uid()}@example.com`;
  const handle = `signuser${uid()}`;

  await page.goto("/signup");
  await page.getByLabel(/email/i).fill(email);
  await page.getByLabel(/handle/i).fill(handle);
  await page.getByLabel(/display name/i).fill("SignIn User");
  await page.getByLabel(/password/i).fill("Password123!");
  await page.getByRole("button", { name: /sign up|register|create account/i }).click();
  await expect(page).toHaveURL(/\/(home|feed|$)/);

  await page.getByRole("button", { name: /sign out|log out/i }).click();
  await page.waitForURL(/\/(login|signin|$)/);

  await page.getByLabel(/email/i).fill(email);
  await page.getByLabel(/password/i).fill("Password123!");
  await page.getByRole("button", { name: /sign in|log in|login/i }).click();

  await expect(page).toHaveURL(/\/(home|feed|$)/);
});

test("wrong password shows an error", async ({ page }) => {
  const email = `wrongpw-${uid()}@example.com`;

  await page.goto("/signup");
  await page.getByLabel(/email/i).fill(email);
  await page.getByLabel(/handle/i).fill(`wrongpw${uid()}`);
  await page.getByLabel(/display name/i).fill("WrongPw");
  await page.getByLabel(/password/i).fill("Password123!");
  await page.getByRole("button", { name: /sign up|register|create account/i }).click();
  await page.getByRole("button", { name: /sign out|log out/i }).click();
  await page.waitForURL(/\/(login|signin|$)/);

  await page.getByLabel(/email/i).fill(email);
  await page.getByLabel(/password/i).fill("wrongpassword");
  await page.getByRole("button", { name: /sign in|log in|login/i }).click();

  await expect(page.getByText(/invalid|incorrect|error/i)).toBeVisible();
});
