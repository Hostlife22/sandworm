# Validation and visual comparison

Validation environment: macOS 26.6.2, x86_64, Node.js 22.22.0,
Chromium through Playwright. Desktop captures use 1440 × 1000; mobile uses
390 × 844 with a full-page capture.

## Automated coverage

- Strict TypeScript, ESLint and Prettier.
- Production Vite build with `/sandworm/` as the repository base.
- Fourteen pure simulation tests: finite transforms, normalized quaternions, arc-length
  ordering, bounded neighbor distances, continuous motion, all immersion states,
  pause/resume, suspension handling, deterministic reference pose, continuous
  reference entry after many cycles, camera/scan invariance, reduced motion,
  terrain/GLSL agreement, demonstration cue timing, real world travel, head/tail path
  agreement, route bounds, seam continuity and equal travel at 1–60 FPS.
- Browser tests: keyboard and text-input exclusions, pause/resume, scan state,
  reference pose, atlas visibility, reduced motion, WebGL fallback, camera transition
  interruption, mouse takeover, all required captures, fixed-camera travel and horizontal mobile overflow.
- Browser exceptions and console errors (including shader compilation) are checked.
  The screenshot suite asserts that a live canvas exists and no fallback is showing
  before each capture.

Command results and frame measurements are recorded below.

## Captures and reference comparison

Open images at full resolution to inspect the joints and head. The original video
and extracted contact sheets remain local reference material; they are not served
by the application or included in the production build.

| Capture                                                                                              | Source comparison               | Observations                                                                                                                               |
| ---------------------------------------------------------------------------------------------------- | ------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| [Initial Front](screenshots/01-front.png)                                                            | 0–2 s                           | Right-hand head, raised arc, alternating pale armor and dark joints. The drill has a thicker outer lip; tooth geometry remains simplified. |
| [Side](screenshots/02-side.png)                                                                      | 20–23 s and 54–57 s             | Overall body length, gaps and height relative to terrain are readable. Capture uses the reference arc; source shows a lower phase.         |
| [Aerial](screenshots/03-aerial.png)                                                                  | 8–13 s and 18–20 s              | Route and complete body can be inspected from above. Terrain layout is independently generated.                                            |
| [Chase](screenshots/04-chase.png)                                                                    | 46.5–49 s and 71–76 s           | Rear rings establish depth along the machine. Source drifts more freely and uses a different emergence phase.                              |
| [Orbit](screenshots/05-orbit.png)                                                                    | 34.5–41 s and 49–54 s           | Close armor belts, vents, fasteners and connecting rods. Repeated service panels are more regular than in the source.                      |
| [Partial scan](screenshots/06-partial-xray.png)                                                      | 23–30 s and 62.5–69 s           | Sand intersects individual rings; only buried fragments are cyan. Visible armor is protected by the stencil mask.                          |
| [Full scan](screenshots/07-subsurface-xray.png)                                                      | 57.3–62.5 s                     | All 36 rings are below the surface and visible through it. The overlay is paler and more transparent than the reference.                   |
| [Scan off, same pose](screenshots/08-subsurface-hidden.png)                                          | 69–71 s                         | The entire buried model disappears while the terrain and camera remain.                                                                    |
| [Travel start](screenshots/10-travel-start.png) / [6 seconds later](screenshots/11-travel-later.png) | 14–20 s                         | Same stationary Outpost camera; the head advances over 20 scene units horizontally.                                                        |
| [Mobile](screenshots/09-mobile.png)                                                                  | Adaptation, not shown in source | Controls and a dedicated 3D gesture area precede the scrollable atlas. No horizontal document overflow.                                    |

## Rendering decisions and limits

- The analytic centerline reproduces the repeated emergence/arch/burial vocabulary.
  The head advances along a fixed closed route and every ring follows its history.
  Tracking cameras follow it while stations and terrain remain fixed. Tour camera timing follows the recording, while motion
  phases are independent; there is no claim of frame-exact reproduction.
- Armor and drill geometry are original procedural reconstructions. The source's
  fine asymmetric greebles and irregular dunes remain simplified. UV-attached wear,
  matte panel variation and fine broken sand ridges replace world-space checker noise. Rocks and outposts are deliberately inexpensive geometry.
- Large dunes are displaced geometry; fine ripples perturb shading. The surface
  mesh approximates the analytic function. A unit test bounds the near-machine
  interpolation discrepancy below 0.025 scene units, less than the 0.035 scan bias.
- X-ray uses identical instance transforms, analytic per-fragment burial and a
  stencil guard on visible armor. Alpha accumulation reveals internal structure;
  it is not physically accurate volumetric absorption or order-independent rendering.
- Callouts use projected attachment points and a conservative neighboring-ring
  occlusion approximation. They are intentionally suppressed on narrow screens.
- The model does not deform the soil mesh, create a persistent trench or solve
  granular collisions. Dust has finite lifetime and tracks live contact positions.
- Desktop micro-labels match the atlas style but remain small. Accessibility checks
  are functional; no formal WCAG certification or physical-device touch audit was run.
- Chromium is covered automatically. Safari, Firefox and real mobile GPUs require
  their own device testing. Hardware performance must not be inferred from a
  headless software renderer.

## Deployment

GitHub Actions runs quality checks, then publishes `master` through the reusable
Pages workflow. Pull requests do not deploy; manual publication is also available.
E2E runs separately through the **Browser tests** workflow (`workflow_dispatch` only).
Automatic CI retains formatting, lint, TypeScript, unit tests and the production build.
See the repository Actions history for deployment results. Source video rights are separate from the MIT-licensed implementation.

## Recorded checks and performance

2026-10-02:

- `npm run check`: passed (format, lint, strict types, 14 unit tests and production build).
- `npm run test:e2e`: 14 passed, including console/shader error assertions, diagram motion/pause,
  six viewport sizes and scrolling to the lower drawings.
- After module and stylesheet decomposition, six affected browser cases passed
  again: keyboard, fallback, subsurface/mobile captures, camera interruption, atlas
  animation/pause and responsive layout/scrolling.
- Updated fourteen captures, including fixed-camera travel, diagram phases and
  access to the lower drawings in a 720 px high window.

Initial delivery checks (before the motion/material revision): a clean `npm ci` and
`npm audit` reported zero vulnerabilities. Production preview loaded the canvas,
toggled X-ray without browser errors and omitted the development inspection hook.
Dependencies and the production hook guard are unchanged in this revision.

The dedicated moving-frame benchmark samples 35 animation-frame intervals after
warm-up, without screenshots during the sampling window. At 1440 × 1000 and DPR 1,
Chromium reported **ANGLE / Vulkan SwiftShader Device (Subzero)**: software rendering.
Measured median was **1,250 ms/frame**, p95 **1,683.3 ms/frame** (about 0.8 frames/s at the
median), with **26 draw calls** and **361,784 triangles** including active shadow work.
This is a slow software-rendering result, not a hardware GPU benchmark or a promised
frame rate. Smooth interactive use requires hardware acceleration; hardware FPS has
not been established in this environment. The captured paused view is cheaper because
its shadow map and instance transforms are reused.

The Vite build reports a large Three.js vendor chunk (approximately 704 kB before gzip,
181 kB gzipped). It is separated from the UI and renderer chunks, but remains a material
first-load cost. Fonts are locally bundled Latin subsets.
