import { test, expect } from "@playwright/test";

/**
 * Smoke test for the class of regression that shipped twice in one day:
 * a missing postcss.config.js silently no-op'd every Tailwind utility
 * class (src/components/SvgSprite.tsx's hidden-sprite container rendered
 * as a normal in-flow block instead), and a missing space in a template
 * literal (`` `menu${isHidden ? "hide" : ""}` ``) left the settings menu
 * permanently visible over the fireworks. Neither broke the build, lint,
 * typecheck, or any unit test — only an actual rendered page shows them.
 */

test.beforeEach(async ({ page }) => {
  await page.goto("/");
  // Controls only mounts once the app finishes its init sequence
  // (sound preload -> doInit() -> setReady(true)).
  await page.locator(".controls").waitFor({ state: "attached", timeout: 15_000 });
});

test("the fireworks stage fills the viewport instead of being pushed down", async ({ page }) => {
  const viewport = page.viewportSize()!;
  const box = await page.locator(".stage-container").boundingBox();

  expect(box).not.toBeNull();
  expect(box!.y).toBeLessThan(5);
  expect(box!.x).toBeLessThan(5);
  expect(box!.width).toBeGreaterThanOrEqual(viewport.width - 5);
  expect(box!.height).toBeGreaterThanOrEqual(viewport.height - 5);
});

test("the settings menu is not visible until the settings button is clicked", async ({ page }) => {
  // Menu is conditionally rendered - doesn't exist in DOM until opened
  const menu = page.locator(".menu");
  await expect(menu).not.toBeAttached();

  await page.locator(".settings-btn").click();
  await expect(menu).toBeAttached();
  await expect(menu).toHaveCSS("visibility", "visible");
  await expect(menu).toHaveCSS("opacity", "1");

  await page.locator(".close-menu-btn").click();
  await expect(menu).not.toBeAttached();
});

test("both canvases are sized to match the stage, not left at their default 300x150", async ({
  page,
}) => {
  const mainCanvas = page.locator("#main-canvas");
  const box = await mainCanvas.boundingBox();

  expect(box).not.toBeNull();
  expect(box!.width).toBeGreaterThan(150);
  expect(box!.height).toBeGreaterThan(150);
});

test("clicking the canvas actually launches a firework (no silent Shell.launch crash)", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (err) => errors.push(err.message));
  page.on("console", (msg) => {
    if (msg.type() === "error" && /Cannot read properties/.test(msg.text())) {
      errors.push(msg.text());
    }
  });

  const canvas = page.locator("#main-canvas");
  await canvas.click({ position: { x: 200, y: 200 } });
  // Let the interaction handler and a few frames run
  await page.waitForTimeout(800);

  expect(errors, `pageerror/console should not contain launch crash: ${errors.join("\n")}`).toEqual(
    [],
  );
});

test("loads with no Content-Security-Policy violations from the app's own code", async ({
  page,
}) => {
  // next dev's devtools overlay (chunk path contains "next-devtools") sets
  // its own inline styles and trips this app's strict style-src in dev
  // mode only — it isn't present in the production build that actually
  // ships (verified: `pnpm build` + serving out/ has none of this noise).
  // Filtering it out here keeps the check meaningful without needing a
  // second, production-mode webServer just for this one assertion.
  const cspViolations: string[] = [];
  page.on("console", (msg) => {
    if (
      msg.type() === "error" &&
      /Content Security Policy/i.test(msg.text()) &&
      !/next-devtools/.test(msg.location().url)
    ) {
      cspViolations.push(msg.text());
    }
  });

  await page.reload();
  await page.locator(".controls").waitFor({ state: "attached", timeout: 15_000 });
  // Let a frame or two of the animation loop run, in case a deferred asset
  // (audio decode, background image) trips a directive on first use.
  await page.waitForTimeout(500);

  expect(cspViolations).toEqual([]);
});
