import { useEffect, useRef, useSyncExternalStore } from 'react';
import { CAMERAS, MACHINE } from '../simulation/config';
import type { Simulation } from '../simulation/Simulation';
export function Controls({ simulation }: { simulation: Simulation }) {
  const state = useSyncExternalStore(
    simulation.subscribe,
    simulation.getSnapshot,
  );
  const phase = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const keydown = (event: KeyboardEvent) => {
      const target = event.target;
      if (
        target instanceof HTMLElement &&
        (target.isContentEditable ||
          ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName) ||
          (target.tagName === 'BUTTON' && event.key === ' '))
      )
        return;
      if (event.altKey || event.ctrlKey || event.metaKey) return;
      const index = Number(event.key) - 1;
      if (index >= 0 && index < CAMERAS.length) {
        event.preventDefault();
        simulation.command({ type: 'camera', camera: CAMERAS[index] });
      }
      const key = event.key.toLowerCase();
      if ([' ', 'x', 'r', 'h'].includes(key)) {
        event.preventDefault();
        if (event.repeat) return;
        simulation.command({
          type:
            key === ' '
              ? 'pause'
              : key === 'x'
                ? 'xray'
                : key === 'r'
                  ? 'reference'
                  : 'hud',
        });
      }
    };
    window.addEventListener('keydown', keydown);
    const timer = setInterval(() => {
      if (phase.current) phase.current.textContent = simulation.phase;
    }, 120);
    return () => {
      window.removeEventListener('keydown', keydown);
      clearInterval(timer);
    };
  }, [simulation]);
  return (
    <>
      <header className="topbar">
        <a
          className="brand"
          href="#main"
          aria-label="ABRAXIS Excavation Initiative"
        >
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="m12 2 10 10-10 10L2 12Z" />
            <path d="m12 7 5 5-5 5-5-5Z" />
          </svg>
          <span>
            ABRAXIS <b>EXCAVATION INITIATIVE</b>
          </span>
        </a>
        <span className="machine-id">◆ {MACHINE.id} ◆</span>
        <nav aria-label="Camera views">
          {CAMERAS.map((camera, i) => (
            <button
              key={camera}
              aria-pressed={state.camera === camera}
              title={`${camera} camera (${i + 1})`}
              onClick={() => simulation.command({ type: 'camera', camera })}
            >
              {camera}
            </button>
          ))}
        </nav>
        <div className="actions">
          <button
            className="xray"
            aria-pressed={state.xray}
            onClick={() => simulation.command({ type: 'xray' })}
          >
            X-RAY
          </button>
          <button
            aria-pressed={state.paused}
            onClick={() => simulation.command({ type: 'pause' })}
          >
            {state.paused ? '▶ PLAY' : 'Ⅱ PAUSE'}
          </button>
          <button
            className="reference-button"
            aria-pressed={state.reference}
            onClick={() => simulation.command({ type: 'reference' })}
          >
            REFERENCE POSE
          </button>
        </div>
      </header>
      <div className="statusbar">
        <div>
          <i className={state.paused ? 'status-dot paused' : 'status-dot'} />
          <span>{state.camera.toUpperCase()} VIEW</span>
          <span className="status-divider">/</span>
          <span ref={phase}>Surface arc</span>
          <span className="state-tag">
            {state.reference
              ? 'REFERENCE POSE · PLAY TO RESUME'
              : state.paused
                ? 'SIMULATION PAUSED'
                : 'UNDER WAY'}
          </span>
          {state.xray && <span className="xray-label">SUBSURFACE SCAN ON</span>}
        </div>
        <span className="help">
          DRAG TO ORBIT · SCROLL TO ZOOM · 1–6 VIEWS · SPACE PAUSE · X SCAN · R
          POSE · H HUD
        </span>
      </div>
      <div className="utility-controls">
        <button
          aria-pressed={state.demo}
          onClick={() => simulation.command({ type: 'demo' })}
        >
          {state.demo ? '■ STOP DEMO' : '▷ REFERENCE TOUR'}
        </button>
        <button
          aria-pressed={!state.hud}
          onClick={() => simulation.command({ type: 'hud' })}
        >
          {state.hud ? '− HIDE ATLAS' : '+ SHOW ATLAS'}
        </button>
      </div>
    </>
  );
}
