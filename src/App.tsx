import { lazy, Suspense, useState, useSyncExternalStore } from 'react';
import { Simulation } from './simulation/Simulation';
import { Atlas } from './ui/Atlas';
import { Controls } from './ui/Controls';
const Scene = lazy(() => import('./scene/Scene'));
// Dev-only inspection exposes the same simulation used by every rendered subsystem.
declare global {
  interface Window {
    __SANDWORM__?: Simulation;
  }
}
export default function App() {
  const [simulation] = useState(() => {
    const instance = new Simulation(
      window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    );
    if (import.meta.env.DEV) window.__SANDWORM__ = instance;
    return instance;
  });
  const state = useSyncExternalStore(
    simulation.subscribe,
    simulation.getSnapshot,
  );
  return (
    <main id="main" className={state.hud ? 'app' : 'app atlas-hidden'}>
      <a href="#viewport" className="skip-link">
        Skip to 3D viewport
      </a>
      <Controls simulation={simulation} />
      <div
        id="viewport"
        className="viewport"
        tabIndex={0}
        aria-label="Interactive 3D excavation machine. Drag to orbit, scroll to zoom. Use buttons above for camera views."
      >
        <Suspense
          fallback={
            <div className="loading" role="status">
              LOADING ENGINEERING VIEWPORT
            </div>
          }
        >
          <Scene simulation={simulation} />
        </Suspense>
      </div>
      <div className="coordinate-frame" aria-hidden="true">
        <span className="northing">NORTHING / m</span>
        <span className="easting">
          0 ┄┄ 1K ┄┄ 2K ┄┄ 3K ┄┄ 4K ┄┄ 5K ┄┄ 6K ┄┄ 7K ┄┄ 8K ┄┄ 9K
        </span>
      </div>
      {state.hud && <Atlas simulation={simulation} />}
      <footer>
        <span>AEI / RESEARCH & DEVELOPMENT DIVISION</span>
        <span>
          TECHNICAL PLATE 004 <b>◆ ◆ ◇</b>
        </span>
        <span>DESERT OPERATIONS — SECTOR 07</span>
      </footer>
    </main>
  );
}
