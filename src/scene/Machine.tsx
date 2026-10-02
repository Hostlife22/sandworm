import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import {
  DynamicDrawUsage,
  InstancedMesh,
  Matrix4,
  Quaternion,
  Vector3,
} from 'three';
import type { BufferGeometry, Material } from 'three';
import { RING_COUNT } from '../simulation/config';
import type { Simulation } from '../simulation/Simulation';
import { createGeometries } from './geometry';
import { machineMaterial, PALETTE, xrayMaterial } from './materials';

interface Part {
  ring: number;
  local: Matrix4;
  animated?: boolean;
  linkAngle?: number;
  linkRadius?: number;
}
interface Batch {
  geometry: BufferGeometry;
  material: Material;
  parts: Part[];
  fine?: boolean;
}
const Z = new Vector3(0, 0, 1);
function local(
  x: number,
  y: number,
  z: number,
  sx: number,
  sy: number,
  sz: number,
  angle = 0,
): Matrix4 {
  return new Matrix4().compose(
    new Vector3(x, y, z),
    new Quaternion().setFromAxisAngle(Z, angle),
    new Vector3(sx, sy, sz),
  );
}
function buildBatches(): { batches: Batch[]; dispose: () => void } {
  const g = createGeometries();
  const m = {
    armor: machineMaterial(PALETTE.armor, 0.28, 0.72),
    edge: machineMaterial(PALETTE.edge, 0.4, 0.55),
    dark: machineMaterial(PALETTE.dark, 0.65, 0.58),
    steel: machineMaterial(PALETTE.steel, 0.78, 0.32),
    bronze: machineMaterial(PALETTE.bronze, 0.65, 0.45),
  };
  const armor: Batch = { geometry: g.tile, material: m.armor, parts: [] };
  const rims: Batch = { geometry: g.rim, material: m.edge, parts: [] };
  const core: Batch = { geometry: g.core, material: m.dark, parts: [] };
  const vents: Batch = { geometry: g.box, material: m.dark, parts: [] };
  const hatches: Batch = { geometry: g.box, material: m.edge, parts: [] };
  const bronze: Batch = { geometry: g.box, material: m.bronze, parts: [] };
  const bolts: Batch = {
    geometry: g.bolt,
    material: m.dark,
    parts: [],
    fine: true,
  };
  const pipes: Batch = { geometry: g.bolt, material: m.steel, parts: [] };
  const jaw: Batch = { geometry: g.box, material: m.armor, parts: [] };
  const lips: Batch = { geometry: g.lip, material: m.steel, parts: [] };
  for (let i = 0; i < RING_COUNT; i++) {
    const r = 3.5 * (0.28 + 0.72 * Math.pow(1 - i / RING_COUNT, 0.36));
    for (const z of [-0.42, 0.42])
      rims.parts.push({ ring: i, local: local(0, 0, z, r, r, 1) });
    for (const z of [-0.38, 0, 0.38])
      core.parts.push({ ring: i, local: local(0, 0, z, r, r, 1) });
    for (let j = 0; j < 12; j++) {
      const a = (j * Math.PI) / 6;
      const c = Math.cos(a);
      const s = Math.sin(a);
      armor.parts.push({ ring: i, local: local(0, 0, 0, r, r, 1, a) });
      const variant = (i + j) % 3;
      vents.parts.push({
        ring: i,
        local: local(
          c * (r + 0.025),
          s * (r + 0.025),
          0,
          0.04,
          r * 0.28,
          0.47,
          a,
        ),
      });
      if (variant === 0) {
        for (let k = 0; k < 5; k++)
          hatches.parts.push({
            ring: i,
            local: local(
              c * (r + 0.06) - s * (k - 2) * r * 0.047,
              s * (r + 0.06) + c * (k - 2) * r * 0.047,
              0,
              0.04,
              r * 0.016,
              0.44,
              a,
            ),
          });
      } else {
        hatches.parts.push({
          ring: i,
          local: local(
            c * (r + 0.075),
            s * (r + 0.075),
            0,
            0.085,
            r * 0.24,
            variant === 1 ? 0.38 : 0.2,
            a,
          ),
        });
        bronze.parts.push({
          ring: i,
          local: local(
            c * (r + 0.13),
            s * (r + 0.13),
            0,
            0.028,
            r * 0.085,
            0.14,
            a,
          ),
        });
      }
      for (const offset of [-0.15, 0.15]) {
        const b = a + offset;
        for (const z of [-0.31, 0.31])
          bolts.parts.push({
            ring: i,
            local: local(
              Math.cos(b) * (r + 0.025),
              Math.sin(b) * (r + 0.025),
              z,
              0.037,
              0.037,
              0.045,
            ),
          });
      }
      if (i < RING_COUNT - 1)
        pipes.parts.push({
          ring: i,
          local: new Matrix4(),
          linkAngle: a,
          linkRadius: r * 0.79,
        });
      if (j % 3 === 0)
        bronze.parts.push({
          ring: i,
          local: local(c * r * 0.87, s * r * 0.87, -0.61, 0.14, 0.14, 1.2, a),
        });
    }
  }
  for (const [r, z] of [
    [3.45, 0.58],
    [3.28, 0.84],
    [2.86, 0.92],
    [2.36, 0.35],
    [1.92, -0.5],
    [1.48, -1.45],
    [1.16, -2.25],
  ])
    lips.parts.push({ ring: 0, local: local(0, 0, z, r, r, 1) });
  for (let j = 0; j < 40; j++) {
    const a = (j * Math.PI) / 20;
    const c = Math.cos(a);
    const s = Math.sin(a);
    jaw.parts.push({
      ring: 0,
      local: local(c * 3.12, s * 3.12, 0.76, 0.62, 0.19, 0.44, a),
    });
    bronze.parts.push({
      ring: 0,
      local: local(c * 2.81, s * 2.81, 0.83, 0.25, 0.095, 0.15, a),
    });
    // Tapered, angled ribs recede into a genuinely open, deep throat.
    const mat = new Matrix4()
      .makeTranslation(c * 2.03, s * 2.03, -0.68)
      .multiply(new Matrix4().makeRotationZ(a))
      .multiply(new Matrix4().makeRotationY(0.38))
      .multiply(new Matrix4().makeScale(0.15, 0.19, 3.1));
    jaw.parts.push({ ring: 0, local: mat, animated: true });
    for (const r of [2.96, 3.36])
      bolts.parts.push({
        ring: 0,
        local: local(c * r, s * r, 1.0, 0.055, 0.055, 0.055),
      });
  }
  for (let j = 0; j < 4; j++) {
    const a = (j * Math.PI) / 2;
    hatches.parts.push({
      ring: RING_COUNT - 1,
      local: local(
        Math.cos(a) * 1.2,
        Math.sin(a) * 1.2,
        -0.9,
        0.12,
        0.8,
        1.8,
        a,
      ),
    });
  }
  return {
    batches: [
      armor,
      rims,
      core,
      vents,
      hatches,
      bronze,
      bolts,
      pipes,
      jaw,
      lips,
    ],
    dispose: () => {
      Object.values(g).forEach((v) => v.dispose());
      Object.values(m).forEach((v) => v.dispose());
    },
  };
}
function Instances({
  batch,
  simulation,
  xray,
}: {
  batch: Batch;
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
        scratch.spin.makeRotationZ(simulation.poseTime * 0.24);
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
export function Machine({ simulation }: { simulation: Simulation }) {
  const resources = useMemo(buildBatches, []);
  const xray = useMemo(() => xrayMaterial(), []);
  useEffect(
    () => () => {
      resources.dispose();
      xray.dispose();
    },
    [resources, xray],
  );
  return (
    <group>
      {resources.batches.map((batch, i) => (
        <Instances key={i} batch={batch} simulation={simulation} xray={xray} />
      ))}
    </group>
  );
}
