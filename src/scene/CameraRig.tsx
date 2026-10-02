import { useMemo, useRef } from 'react';
import type { ComponentRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { Vector3 } from 'three';
import type { Simulation } from '../simulation/Simulation';
import { terrainHeight } from '../simulation/terrain';
export function CameraRig({ simulation }: { simulation: Simulation }) {
  const controls = useRef<ComponentRef<typeof OrbitControls>>(null);
  const manual = useRef(false);
  const revision = useRef(-1);
  const scratch = useMemo(
    () => ({ position: new Vector3(), target: new Vector3() }),
    [],
  );
  useFrame(({ camera, size }, delta) => {
    const ui = simulation.getSnapshot();
    const c = controls.current;
    if (!c) return;
    if (revision.current !== ui.cameraRevision) {
      revision.current = ui.cameraRevision;
      manual.current = false;
    }
    const head = simulation.segments[0].position;
    const tail = simulation.segments[35].position;
    if (!manual.current) {
      scratch.target.set(-1, 0, 0);
      switch (ui.camera) {
        case 'front':
          scratch.target.set(6, 0, 0);
          scratch.position.set(52, 16, 37);
          break;
        case 'side':
          scratch.position.set(0, 18, 84);
          scratch.target.set(-2, 0, 0);
          break;
        case 'aerial':
          scratch.position.set(20, 91, 29);
          scratch.target.set(0, 0, 0);
          break;
        case 'chase':
          scratch.position.set(
            tail.x - 17,
            Math.max(tail.y + 10, 9),
            tail.z + 7,
          );
          scratch.target.copy(head).lerp(tail, 0.35);
          scratch.target.y = Math.max(2, scratch.target.y);
          break;
        case 'outpost':
          scratch.position.set(-32, 4.8, 25);
          scratch.target.set(5, 3, -3);
          break;
        case 'orbit': {
          const angle = simulation.poseTime * 0.085 + 0.45;
          scratch.position.set(Math.sin(angle) * 54, 21, Math.cos(angle) * 54);
          break;
        }
      }
      if (size.width < 768 && ui.camera !== 'chase' && ui.camera !== 'outpost')
        scratch.position.multiplyScalar(1.4);
      const alpha = simulation.reducedMotion
        ? 1
        : 1 - Math.exp(-Math.min(delta, 0.25) * 3.3);
      camera.position.lerp(scratch.position, alpha);
      c.target.lerp(scratch.target, alpha);
    }
    camera.position.y = Math.max(
      camera.position.y,
      terrainHeight(camera.position.x, camera.position.z) + 1.2,
    );
    c.update();
    simulation.cameraPosition.copy(camera.position);
    simulation.cameraTarget.copy(c.target);
    simulation.cameraManual = manual.current;
    simulation.cameraSettled =
      manual.current ||
      (camera.position.distanceTo(scratch.position) < 0.2 &&
        c.target.distanceTo(scratch.target) < 0.2);
  });
  return (
    <OrbitControls
      ref={controls}
      makeDefault
      enableDamping
      dampingFactor={0.09}
      minDistance={9}
      maxDistance={155}
      maxPolarAngle={Math.PI * 0.49}
      enablePan={false}
      onStart={() => {
        manual.current = true;
        simulation.command({ type: 'manual-camera' });
      }}
    />
  );
}
