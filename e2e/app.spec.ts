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
async function freeze(page: Page, time = 0, instantCamera = false) {
  await page.evaluate(
    ({ t, instantCamera }) => {
      const s = window.__SANDWORM__!;
      // Capture cases need settled geometry; camera tweening is tested separately.
      if (instantCamera) s.reducedMotion = true;
      if (!s.getSnapshot().paused) s.command({ type: 'pause' });
      s.seek(t);
    },
    { t: time, instantCamera },
  );
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
for (const [camera, name] of [
  ['front', '01-front'],
  ['side', '02-side'],
  ['aerial', '03-aerial'],
  ['chase', '04-chase'],
  ['orbit', '05-orbit'],
] as const) {
  test(`reference screenshot: ${camera}`, async ({ page }) => {
    test.setTimeout(90000);
    const errors: string[] = [];
    page.on('pageerror', (e) => errors.push(e.message));
    page.on('console', (m) => {
      if (m.type() === 'error') errors.push(m.text());
    });
    await ready(page);
    await freeze(page, 0, true);
    await page.getByRole('button', { name: camera, exact: true }).click();
    await settle(page);
    await expect(page.locator('canvas')).toBeVisible();
    await expect(
      page.getByRole('heading', { name: '3D rendering is unavailable' }),
    ).toHaveCount(0);
    await page.screenshot({ path: `docs/screenshots/${name}.png` });
    expect(errors).toEqual([]);
  });
}
test('subsurface and mobile screenshots and renderer measurements', async ({
  page,
}) => {
  test.setTimeout(180000);
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => {
    if (m.type() === 'error') errors.push(m.text());
  });
  await ready(page);
  await freeze(page, 0, true);
  await page.getByRole('button', { name: 'side', exact: true }).click();
  await page.getByRole('button', { name: 'X-RAY', exact: true }).click();
  await freeze(page, 7);
  await settle(page);
  await expect(page.locator('canvas')).toBeVisible();
  await expect(
    page.getByRole('heading', { name: '3D rendering is unavailable' }),
  ).toHaveCount(0);
  await page.screenshot({ path: 'docs/screenshots/06-partial-xray.png' });
  const buriedTime = await page.evaluate(() => {
    const s = window.__SANDWORM__!;
    for (let t = 0; t < s.trajectory.duration; t += 0.1) {
      s.seek(t);
      if (s.submergedCount === 36) return t;
    }
    throw new Error('Route never fully submerges');
  });
  await freeze(page, buriedTime);
  await settle(page);
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

test('machine travels past a fixed outpost camera', async ({ page }) => {
  test.setTimeout(90000);
  await ready(page);
  await freeze(page, 0, true);
  await page.getByRole('button', { name: 'outpost', exact: true }).click();
  await settle(page);
  await page.waitForFunction(() => {
    const p = window.__SANDWORM__!.cameraPosition;
    return Math.hypot(p.x + 32, p.y - 4.8, p.z - 25) < 0.001;
  });
  const before = await page.evaluate(() => ({
    head: window.__SANDWORM__!.segments[0].position.toArray(),
    camera: window.__SANDWORM__!.cameraPosition.toArray(),
  }));
  await page.screenshot({ path: 'docs/screenshots/10-travel-start.png' });
  await freeze(page, 6);
  await settle(page);
  const after = await page.evaluate(() => ({
    head: window.__SANDWORM__!.segments[0].position.toArray(),
    camera: window.__SANDWORM__!.cameraPosition.toArray(),
  }));
  expect(
    Math.hypot(after.head[0] - before.head[0], after.head[2] - before.head[2]),
  ).toBeGreaterThan(20);
  expect(
    Math.hypot(...after.camera.map((v, i) => v - before.camera[i])),
  ).toBeLessThan(0.01);
  await page.screenshot({ path: 'docs/screenshots/11-travel-later.png' });
});

test('atlas drawings articulate together and freeze on pause', async ({
  page,
}) => {
  test.setTimeout(120000);
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await ready(page);
  await freeze(page, 0, true);
  await settle(page);
  const selectors = [
    '[data-head-rotor]',
    '[data-head-auger]',
    '[data-head-index]',
    '[data-profile-ring="12"]',
    '[data-ring-tile="3"] [data-shell]',
    '[data-map-body]',
    '[data-map-head]',
    '[data-step="0"] [data-cycle-ring="12"]',
    '[data-step="0"] [data-cycle-arrow]',
  ];
  const read = () =>
    page.evaluate(
      (selectors) =>
        selectors.map((selector) => {
          const element = document.querySelector(selector)!;
          return element.getAttribute('transform') ?? element.getAttribute('d');
        }),
      selectors,
    );
  await expect.poll(async () => (await read()).every(Boolean)).toBe(true);
  const before = await read();
  await page.waitForTimeout(700);
  expect(await read()).toEqual(before);
  const bounds = await page.evaluate(() => {
    const region = document.querySelector('.region')!.getBoundingClientRect();
    const terrain = document
      .querySelector('.terrain-panel')!
      .getBoundingClientRect();
    const bottoms = [
      ...document.querySelectorAll('.bottom-panels > .panel'),
    ].map((p) => p.getBoundingClientRect().bottom);
    return {
      regionBottom: region.bottom,
      terrainTop: terrain.top,
      bottom: Math.max(...bottoms),
      height: innerHeight,
    };
  });
  expect(bounds.regionBottom + 8).toBeLessThan(bounds.terrainTop);
  expect(bounds.bottom).toBeLessThanOrEqual(bounds.height - 27);
  await page.screenshot({ path: 'docs/screenshots/12-atlas-reference.png' });
  await freeze(page, 2);
  await expect
    .poll(async () => (await read()).every((value, i) => value !== before[i]))
    .toBe(true);
  const after = await read();
  await page.waitForTimeout(700);
  expect(await read()).toEqual(after);
  await settle(page);
  await page.screenshot({ path: 'docs/screenshots/13-atlas-moving-phase.png' });
  await page.getByRole('button', { name: '▶ PLAY', exact: true }).click();
  await expect
    .poll(async () => (await read()).every((value, i) => value !== after[i]))
    .toBe(true);
  await page.getByRole('button', { name: 'Ⅱ PAUSE', exact: true }).click();
  await page.setViewportSize({ width: 1280, height: 720 });
  const map = await page.locator('.terrain-panel').boundingBox();
  await page.mouse.move(map!.x + 20, Math.min(map!.y + 25, 690));
  await page.mouse.wheel(0, 650);
  await expect.poll(() => page.evaluate(() => scrollY)).toBeGreaterThan(0);
  await expect(page.locator('.profile-panel')).toBeInViewport({ ratio: 1 });
  await page.screenshot({ path: 'docs/screenshots/14-atlas-short-window.png' });
  expect(errors).toEqual([]);
});

test('atlas panels remain separate on short, wide and mobile screens', async ({
  page,
}) => {
  // Layout must also hold when the 3D viewport cannot start. No GPU is needed here.
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
  await page.getByRole('heading', { name: 'SANDWORM MK-X' }).waitFor();
  for (const [width, height] of [
    [1920, 900],
    [1440, 900],
    [1280, 720],
    [1024, 768],
    [768, 1024],
    [390, 844],
  ]) {
    await page.setViewportSize({ width, height });
    const layout = await page.evaluate(() => {
      const box = (selector: string) => {
        const r = document.querySelector(selector)!.getBoundingClientRect();
        return { top: r.top, bottom: r.bottom, left: r.left, right: r.right };
      };
      return {
        region: box('.region'),
        terrain: box('.terrain-panel'),
        head: box('.head-panel'),
        bottom: box('.bottom-panels'),
        documentWidth: document.documentElement.scrollWidth,
      };
    });
    expect(
      layout.region.bottom + 8,
      `${width}×${height}: regional and terrain maps`,
    ).toBeLessThanOrEqual(layout.terrain.top);
    expect(
      layout.terrain.bottom + 8,
      `${width}×${height}: terrain and lower drawings`,
    ).toBeLessThanOrEqual(layout.bottom.top);
    expect(
      layout.head.bottom + 8,
      `${width}×${height}: head and lower drawings`,
    ).toBeLessThanOrEqual(layout.bottom.top);
    expect(
      layout.documentWidth,
      `${width}×${height}: horizontal overflow`,
    ).toBe(width);
  }
});
