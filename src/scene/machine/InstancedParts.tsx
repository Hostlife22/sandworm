import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import {
  DynamicDrawUsage,
  InstancedMesh,
  Matrix4,
  Quaternion,
  Vector3,
} from 'three';
import type { Material } from 'three';
import type { Simulation } from '../../simulation/Simulation';
import type { MachineBatch } from './buildMachine';
const Z = new Vector3(0, 0, 1);

export function InstancedParts({
  batch,
  simulation,
  xray,
}: {
  batch: MachineBatch;
  simulation: Simulation;
  xray: Material;
}) {
  const ref = useRef<InstancedMesh>(null);
  const ghost = useRef<InstancedMesh>(null);
  const previousTime = useRef(Number.NaN);
  const scratch = useMemo(
    () => ({
      world: new Matrix4(),
      result: new Matrix4(),
      spin: new Matrix4(),
      scale: new Vector3(1, 1, 1),
      start: new Vector3(),
      end: new Vector3(),
      direction: new Vector3(),
      rotation: new Quaternion(),
      linkScale: new Vector3(),
    }),
    [],
  );
  useEffect(() => {
    ref.current?.instanceMatrix.setUsage(DynamicDrawUsage);
  }, []);
  useFrame(({ camera }) => {
    if (!ref.current || !ghost.current) return;
    const visible =
      !batch.fine ||
      camera.position.distanceTo(simulation.segments[16].position) < 85;
    ref.current.visible = visible;
    ghost.current.visible = visible && simulation.getSnapshot().xray;
    if (!visible || previousTime.current === simulation.poseTime) return;
    previousTime.current = simulation.poseTime;
    batch.parts.forEach((p, i) => {
      const segment = simulation.segments[p.ring];
      scratch.world.compose(segment.position, segment.rotation, scratch.scale);
      if (p.animated) {
        scratch.spin.makeRotationZ(simulation.mechanismAngle);
        scratch.world.multiply(scratch.spin);
      }
      if (p.linkAngle !== undefined && p.linkRadius !== undefined) {
        const next = simulation.segments[p.ring + 1];
        const c = Math.cos(p.linkAngle),
          s = Math.sin(p.linkAngle);
        scratch.start
          .set(c * p.linkRadius, s * p.linkRadius, -0.42)
          .applyQuaternion(segment.rotation)
          .add(segment.position);
        scratch.end
          .set(c * next.radius * 0.79, s * next.radius * 0.79, 0.42)
          .applyQuaternion(next.rotation)
          .add(next.position);
        scratch.direction.subVectors(scratch.end, scratch.start);
        const length = scratch.direction.length();
        scratch.rotation.setFromUnitVectors(Z, scratch.direction.normalize());
        scratch.start.lerp(scratch.end, 0.5);
        scratch.linkScale.set(0.06, 0.06, length + 0.16);
        scratch.result.compose(
          scratch.start,
          scratch.rotation,
          scratch.linkScale,
        );
      } else scratch.result.multiplyMatrices(scratch.world, p.local);
      ref.current?.setMatrixAt(i, scratch.result);
    });
    ref.current.instanceMatrix.needsUpdate = true;
    ghost.current.instanceMatrix = ref.current.instanceMatrix;
  });
  return (
    <>
      <instancedMesh
        ref={ref}
        args={[batch.geometry, batch.material, batch.parts.length]}
        castShadow={!batch.fine}
        receiveShadow
        frustumCulled={false}
      />
      <instancedMesh
        ref={ghost}
        args={[batch.geometry, xray, batch.parts.length]}
        frustumCulled={false}
        renderOrder={10}
      />
    </>
  );
}
