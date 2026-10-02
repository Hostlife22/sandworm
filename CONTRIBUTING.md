# Contributing

Use Node.js 22.12 or later and npm. Run `npm ci`, then `npm run dev`.
Before submitting a change, run `npm run check` and `npm run test:e2e`.
Install the browser once with `npx playwright install chromium`.

## Project conventions

- Keep strict TypeScript; avoid `any`, suppression comments and frame-level React state.
- Commands and serializable UI state belong to `Simulation`; mutable transforms and
  clocks stay outside React. Frame callbacks consume the same simulation instance.
- Declare types after imports, then constants and implementation.
- Put shared visual values in the CSS tokens and material palette.
- Reuse geometry and materials. Use instancing for repeated mechanical parts.
- Dispose manually constructed GPU resources; remove subscriptions and event handlers.
- Keep CPU terrain and its GLSL expression synchronized. Test the sampled mesh error
  when changing frequencies or resolution.
- Add behavior tests for kinematics and state changes. Inspect actual WebGL screenshots
  for visual edits; unit tests cannot establish visual similarity.
- Keep the supplied video out of the application bundle. Do not redistribute reference
  extracts without checking their rights.

## Review checks

Verify Front, Side, Aerial, Chase, Orbit and Outpost. Check partial and complete
burial with X-ray on and off. Pause and inspect the model. Toggle cameras during a
transition, then drag to interrupt. Check keyboard focus, reduced motion, 390 px
mobile layout and WebGL fallback. Document measured performance and its environment;
do not infer a universal frame rate from one machine.

The repository base path is `/sandworm/`. Update `vite.config.ts`, Playwright URLs and
README together if the repository is renamed. Successful CI on `master` triggers
Pages publication. Pull requests do not deploy. E2E is a separate manual workflow:
**Actions → Browser tests → Run workflow**. It does not delay automatic publication.
Run it when changing UI, animation or browser behavior. A manual Pages run is also available.

## Policies

Original contributions are covered by the [MIT license](LICENSE). Keep third-party
license notices and verify asset rights before adding files. Follow the
[security reporting policy](SECURITY.md) for vulnerabilities and the
[accessibility guidance](ACCESSIBILITY.md) for UI changes.
