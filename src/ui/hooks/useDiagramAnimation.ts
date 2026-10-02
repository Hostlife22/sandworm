import { useEffect, useRef } from 'react';
import type { Simulation } from '../../simulation/Simulation';

// SVGs consume the simulation clock, so pause, reference and reduced motion agree
// with the model. No CSS clocks, React frame state or layout reads are needed.
export function useDiagramAnimation<T extends Element>(
  simulation: Simulation,
  draw: (element: T, simulation: Simulation) => void,
) {
  const ref = useRef<T>(null);
  useEffect(() => {
    let frame = 0,
      lastTime = Number.NaN,
      lastScan: boolean | undefined;
    const update = () => {
      const scan = simulation.getSnapshot().xray;
      if (
        ref.current &&
        (lastTime !== simulation.poseTime || lastScan !== scan)
      ) {
        draw(ref.current, simulation);
        lastTime = simulation.poseTime;
        lastScan = scan;
      }
      frame = requestAnimationFrame(update);
    };
    update();
    return () => cancelAnimationFrame(frame);
  }, [simulation, draw]);
  return ref;
}
