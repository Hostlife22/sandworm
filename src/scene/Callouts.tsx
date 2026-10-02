import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Vector3 } from 'three';
import type { Simulation } from '../simulation/Simulation';
import { terrainHeight } from '../simulation/terrain';
interface Annotation {
  label: string;
  ring: number;
  angle: number;
  side: 'left' | 'right';
}
const ANNOTATIONS: Annotation[] = [
  { label: 'Segmented torso rings', ring: 18, angle: 1.5, side: 'left' },
  { label: 'Dorsal maintenance hatches', ring: 11, angle: 1.6, side: 'left' },
  { label: 'Sand flow intake vents', ring: 25, angle: 0.8, side: 'left' },
  { label: 'Thermal exhaust ports', ring: 5, angle: 1.8, side: 'right' },
  { label: 'Modular jaw assembly', ring: 0, angle: 1.1, side: 'right' },
  { label: 'Primary excavation ring', ring: 0, angle: 0.3, side: 'right' },
  { label: 'Terrain sensor suite', ring: 1, angle: -0.5, side: 'right' },
];
export function Callouts({ simulation }: { simulation: Simulation }) {
  const elements = useRef<HTMLDivElement[]>([]);
  const scratch = useMemo(
    () => ({
      offset: new Vector3(),
      position: new Vector3(),
      projected: new Vector3(),
      view: new Vector3(),
      ray: new Vector3(),
      check: new Vector3(),
    }),
    [],
  );
  useEffect(() => {
    const viewport = document.getElementById('viewport');
    const labels = ANNOTATIONS.map((a) => {
      const anchor = document.createElement('div');
      anchor.className = 'annotation-anchor';
      anchor.setAttribute('aria-hidden', 'true');
      const label = document.createElement('div');
      label.className = `callout ${a.side}`;
      const leader = document.createElement('i');
      const title = document.createElement('span');
      title.textContent = a.label;
      const detail = document.createElement('small');
      detail.textContent = `AEI / SYSTEM ${String(a.ring + 1).padStart(2, '0')}`;
      title.append(detail);
      label.append(leader, title);
      anchor.append(label);
      viewport?.append(anchor);
      return anchor;
    });
    elements.current = labels;
    return () => {
      labels.forEach((e) => e.remove());
      elements.current = [];
    };
  }, []);
  useFrame(({ camera, size }) => {
    ANNOTATIONS.forEach((a, index) => {
      const element = elements.current[index];
      if (!element) return;
      const s = simulation.segments[a.ring];
      scratch.offset
        .set(
          Math.cos(a.angle) * s.radius,
          Math.sin(a.angle) * s.radius,
          a.ring === 0 ? 0.9 : 0,
        )
        .applyQuaternion(s.rotation);
      scratch.position.copy(s.position).add(scratch.offset);
      scratch.projected.copy(scratch.position).project(camera);
      scratch.view.subVectors(camera.position, scratch.position);
      let visible =
        simulation.getSnapshot().hud &&
        size.width > 1100 &&
        scratch.position.y >
          terrainHeight(scratch.position.x, scratch.position.z) + 0.2 &&
        Math.abs(scratch.projected.x) < 0.6 &&
        Math.abs(scratch.projected.y) < 0.65 &&
        scratch.projected.z < 1 &&
        scratch.offset.dot(scratch.view) > 0 &&
        scratch.view.length() < 115;
      // Conservative terrain and neighboring-ring occlusion, without raycasting thousands of instances.
      if (visible) {
        scratch.ray.copy(scratch.view).normalize();
        for (const other of simulation.segments) {
          if (other === s) continue;
          scratch.check.subVectors(other.position, scratch.position);
          const along = scratch.check.dot(scratch.ray);
          if (
            along > 0 &&
            along < scratch.view.length() &&
            scratch.check.lengthSq() - along * along <
              (other.radius * 0.85) ** 2
          ) {
            visible = false;
            break;
          }
        }
      }
      element.style.opacity = visible ? '1' : '0';
      element.style.transform = `translate(${(scratch.projected.x * 0.5 + 0.5) * size.width}px,${(-scratch.projected.y * 0.5 + 0.5) * size.height}px)`;
    });
  });
  return null;
}
