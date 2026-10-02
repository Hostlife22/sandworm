# Architecture and ownership

## Simulation

`src/simulation/Simulation.ts` owns time, commands, UI state and the current segment
transforms. React subscribes to command changes; moving geometry reads mutable
transforms directly without triggering a React render every frame.

`Trajectory.ts` owns the fixed world route and its arc-length lookup. `terrain.ts`
provides matching CPU and shader height equations. `mapProjection.ts` provides both
world-to-map and map-to-world conversion, so contours, markers and the route share
one projection. Segment radii, ring count and drill/armor counts live in `config.ts`.

## 3D rendering

`scene/Machine.tsx` creates resources, composes the instance batches and disposes
resources on unmount. `scene/machine/buildMachine.ts` describes the procedural parts
and creates their shared geometry, materials and surface texture.
`scene/machine/InstancedParts.tsx` updates instance matrices, articulated rods,
visibility and the X-ray copy. Construction does not run in the frame loop.

Camera, terrain, lighting, environment and dust stay in their existing scene modules.
They consume the same simulation; UI drawings do not drive the renderer.

## Atlas

`ui/Atlas.tsx` composes the layout. `ui/Panel.tsx` owns the shared panel frame and
heading. Each drawing has its own component under `ui/diagrams/`: head cross section,
regional map, terrain map, longitudinal profile, ring detail and locomotion cycle.

Pure contour/projection calculations live in `ui/diagrams/geometry.ts`.
`ui/hooks/useDiagramAnimation.ts` updates SVG attributes only when simulation time
or scan state changes and cancels its animation callback on unmount. It has no
independent clock, so pause and reduced-motion startup cannot drift from the machine.
The regional map is intentionally static, matching the reference recording.

## Styles and layout

`styles.css` is an import entry point. `styles/tokens.css` defines shared values;
base rules, controls, scene overlays, atlas layout and drawing styles have separate
files. `responsive.css` contains media overrides and is imported last.

The atlas grid sizes its first row from the left column's content. Specifications
and maps are flex siblings with a gap; the lower drawings occupy the second row.
Short windows scroll the document. Panels accept normal pointer/wheel input, while
empty atlas space allows interaction with the underlying 3D viewport.

## Verification and delivery

`npm run check` validates formatting, lint, strict types, simulation tests and the
production build. `npm run test:e2e` checks browser behavior and produces captures,
including animated SVG geometry, pause/resume, six layout sizes and short-window
scrolling. Browser tests can also be launched with **Actions → Browser tests → Run
workflow**. Push/PR CI runs the faster checks; successful `master` checks deploy Pages.
