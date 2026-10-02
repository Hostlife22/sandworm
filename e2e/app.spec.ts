import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';
async function ready(page: Page) {
  await page.goto('./');
  await page.waitForFunction(() => window.__SANDWORM__?.ready);
}
async function settle(page: Page) {
  await page.waitForFunction(
    () => window.__SANDWORM__?.cameraSettled,
    {},
    { timeout: 30000 },
  );
}
async function freeze(page: Page, time = 0) {
  await page.evaluate((t) => {
    const s = window.__SANDWORM__!;
    if (!s.getSnapshot().paused) s.command({ type: 'pause' });
    s.seek(t);
  }, time);
  await page.waitForTimeout(400);
}
test('keyboard, pause, camera interrupts, X-ray and inspection on pause', async ({
  page,
}) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text());
  });
  await ready(page);
  await freeze(page, 5);
  const time = await page.evaluate(() => window.__SANDWORM__!.time);
  await page.keyboard.press('2');
  await expect(
    page.getByRole('button', { name: 'side', exact: true }),
  ).toHaveAttribute('aria-pressed', 'true');
  await page.keyboard.press('3');
  await page.keyboard.press('1');
  await page.keyboard.press('x');
  await expect(
    page.getByRole('button', { name: 'X-RAY', exact: true }),
  ).toHaveAttribute('aria-pressed', 'true');
  expect(await page.evaluate(() => window.__SANDWORM__!.time)).toBe(time);
  await page.keyboard.press('Space');
  await expect(
    page.getByRole('button', { name: 'Ⅱ PAUSE', exact: true }),
  ).toBeVisible();
  await page.keyboard.press('Space');
  await page.keyboard.press('r');
  await expect(
    page.getByRole('button', { name: 'REFERENCE POSE', exact: true }),
  ).toHaveAttribute('aria-pressed', 'true');
  await page.keyboard.press('h');
  await expect(
    page.getByRole('heading', { name: 'SANDWORM MK-X' }),
  ).toHaveCount(0);
  await page.keyboard.press('h');
  await expect(
    page.getByRole('heading', { name: 'SANDWORM MK-X' }),
  ).toBeVisible();
  await page.evaluate(() => {
    const input = document.createElement('input');
    input.id = 'keyboard-test';
    document.body.append(input);
    input.focus();
  });
  await page.keyboard.type('x23rh');
  await expect(
    page.getByRole('button', { name: 'X-RAY', exact: true }),
  ).toHaveAttribute('aria-pressed', 'true');
  expect(errors).toEqual([]);
});
test('reduced motion waits for explicit playback', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await ready(page);
  await page.waitForTimeout(300);
  expect(await page.evaluate(() => window.__SANDWORM__!.time)).toBe(0);
  await page.getByRole('button', { name: '▶ PLAY', exact: true }).click();
  await expect
    .poll(() => page.evaluate(() => window.__SANDWORM__!.time))
    .toBeGreaterThan(0);
});
test('WebGL fallback keeps atlas and recovery visible', async ({ page }) => {
  await page.addInitScript(() => {
    const original = HTMLCanvasElement.prototype.getContext;
    Object.defineProperty(HTMLCanvasElement.prototype, 'getContext', {
      value: function (
        this: HTMLCanvasElement,
        type: string,
        options: unknown,
      ) {
        return type.startsWith('webgl')
          ? null
          : Reflect.apply(original, this, [type, options]);
      },
    });
  });
  await page.goto('./');
  await expect(
    page.getByRole('heading', { name: '3D rendering is unavailable' }),
  ).toBeVisible();
  await expect(
    page.getByRole('button', { name: 'RETRY VIEWPORT' }),
  ).toBeVisible();
  await expect(
    page.getByRole('heading', { name: 'SANDWORM MK-X' }),
  ).toBeVisible();
});
test('reference screenshots and renderer measurements', async ({ page }) => {
  test.setTimeout(180000);
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => {
    if (m.type() === 'error') errors.push(m.text());
  });
  await ready(page);
  await freeze(page);
  await settle(page);
  await expect(page.locator('canvas')).toBeVisible();
  await expect(
    page.getByRole('heading', { name: '3D rendering is unavailable' }),
  ).toHaveCount(0);
  await page.screenshot({ path: 'docs/screenshots/01-front.png' });
  for (const [camera, name] of [
    ['side', '02-side'],
    ['aerial', '03-aerial'],
    ['chase', '04-chase'],
    ['orbit', '05-orbit'],
  ] as const) {
    await page.getByRole('button', { name: camera, exact: true }).click();
    await settle(page);
    await expect(page.locator('canvas')).toBeVisible();
    await expect(
      page.getByRole('heading', { name: '3D rendering is unavailable' }),
    ).toHaveCount(0);
    await page.screenshot({ path: `docs/screenshots/${name}.png` });
  }
  await page.getByRole('button', { name: 'side', exact: true }).click();
  await page.getByRole('button', { name: 'X-RAY', exact: true }).click();
  await freeze(page, 7);
  await settle(page);
  await expect(page.locator('canvas')).toBeVisible();
  await expect(
    page.getByRole('heading', { name: '3D rendering is unavailable' }),
  ).toHaveCount(0);
  await page.screenshot({ path: 'docs/screenshots/06-partial-xray.png' });
  await freeze(page, 14);
  await expect(page.locator('canvas')).toBeVisible();
  await expect(
    page.getByRole('heading', { name: '3D rendering is unavailable' }),
  ).toHaveCount(0);
  await page.screenshot({ path: 'docs/screenshots/07-subsurface-xray.png' });
  expect(await page.evaluate(() => window.__SANDWORM__!.submergedCount)).toBe(
    36,
  );
  await page.getByRole('button', { name: 'X-RAY', exact: true }).click();
  await expect(page.locator('canvas')).toBeVisible();
  await expect(
    page.getByRole('heading', { name: '3D rendering is unavailable' }),
  ).toHaveCount(0);
  await page.screenshot({ path: 'docs/screenshots/08-subsurface-hidden.png' });
  const metrics = await page.evaluate(() => ({
    frameMs: window.__SANDWORM__!.frameMs,
    drawCalls: window.__SANDWORM__!.drawCalls,
    triangles: window.__SANDWORM__!.triangles,
  }));
  console.log(
    'Renderer measurement (Playwright Chromium):',
    JSON.stringify(metrics),
  );
  await page.setViewportSize({ width: 390, height: 844 });
  await freeze(page, 0);
  await page.getByRole('button', { name: 'front', exact: true }).click();
  await settle(page);
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(
    390,
  );
  await expect(page.locator('canvas')).toBeVisible();
  await expect(
    page.getByRole('heading', { name: '3D rendering is unavailable' }),
  ).toHaveCount(0);
  await page.screenshot({
    path: 'docs/screenshots/09-mobile.png',
    fullPage: true,
  });
  await expect(
    page.getByRole('button', { name: 'X-RAY', exact: true }),
  ).toBeInViewport();
  expect(errors).toEqual([]);
});

test('camera transitions can be interrupted and manually inspected on pause', async ({
  page,
}) => {
  await ready(page);
  await freeze(page);
  await page.getByRole('button', { name: 'side', exact: true }).click();
  await page.waitForTimeout(250);
  const before = await page.evaluate(() =>
    window.__SANDWORM__!.cameraPosition.toArray(),
  );
  await page.getByRole('button', { name: 'aerial', exact: true }).click();
  const after = await page.evaluate(() =>
    window.__SANDWORM__!.cameraPosition.toArray(),
  );
  expect(Math.hypot(...after.map((v, i) => v - before[i]))).toBeLessThan(
    Math.hypot(20 - before[0], 91 - before[1], 29 - before[2]),
  );
  await page.keyboard.press('x');
  await expect(
    page.getByRole('button', { name: 'X-RAY', exact: true }),
  ).toHaveAttribute('aria-pressed', 'true');
  await page.mouse.move(720, 470);
  await page.mouse.down();
  await page.mouse.move(850, 510, { steps: 8 });
  await page.mouse.up();
  await expect
    .poll(() => page.evaluate(() => window.__SANDWORM__!.cameraManual))
    .toBe(true);
  expect(await page.evaluate(() => window.__SANDWORM__!.time)).toBe(0);
  await page.getByRole('button', { name: 'outpost', exact: true }).click();
  await expect
    .poll(() => page.evaluate(() => window.__SANDWORM__!.cameraManual))
    .toBe(false);
});

test('measure moving WebGL frames after warm-up', async ({
  page,
}, testInfo) => {
  test.setTimeout(90000);
  await ready(page);
  await page.waitForTimeout(2500);
  const metrics = await page.evaluate(async () => {
    const intervals: number[] = [];
    let previous = performance.now();
    for (let i = 0; i < 40; i++) {
      const time = await new Promise<number>((resolve) =>
        requestAnimationFrame(resolve),
      );
      if (i >= 5) intervals.push(time - previous);
      previous = time;
    }
    intervals.sort((a, b) => a - b);
    const gl = document.querySelector('canvas')?.getContext('webgl2');
    const extension = gl?.getExtension('WEBGL_debug_renderer_info');
    return {
      samples: intervals.length,
      medianMs: intervals[Math.floor(intervals.length / 2)],
      p95Ms: intervals[Math.floor(intervals.length * 0.95)],
      drawCalls: window.__SANDWORM__!.drawCalls,
      triangles: window.__SANDWORM__!.triangles,
      renderer:
        gl && extension
          ? String(gl.getParameter(extension.UNMASKED_RENDERER_WEBGL))
          : 'unknown',
      viewport: [innerWidth, innerHeight],
      devicePixelRatio,
    };
  });
  console.log('Moving frame benchmark:', JSON.stringify(metrics));
  await testInfo.attach('frame-benchmark.json', {
    body: JSON.stringify(metrics, null, 2),
    contentType: 'application/json',
  });
  expect(Number.isFinite(metrics.medianMs)).toBe(true);
});
