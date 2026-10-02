import { Matrix4, Quaternion, Vector3 } from 'three';
import type { BufferGeometry, Material } from 'three';
import {
  RING_COUNT,
  DRILL_BLADE_COUNT,
  ARMOR_SECTOR_COUNT,
  ringRadius,
} from '../../simulation/config';
import { createGeometries } from '../geometry';
import { createWearTexture } from '../surfaceTexture';
import { machineMaterial, PALETTE } from '../materials';

interface Part {
  ring: number;
  local: Matrix4;
  animated?: boolean;
  linkAngle?: number;
  linkRadius?: number;
}
export interface MachineBatch {
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
export function buildMachine(): {
  batches: MachineBatch[];
  dispose: () => void;
} {
  const g = createGeometries();
  const wear = createWearTexture();
  const m = {
    armor: machineMaterial(PALETTE.armor, 0.12, 0.88, wear),
    edge: machineMaterial(PALETTE.edge, 0.2, 0.72, wear),
    dark: machineMaterial(PALETTE.dark, 0.55, 0.68, wear),
    steel: machineMaterial(PALETTE.steel, 0.78, 0.4, wear),
    bronze: machineMaterial(PALETTE.bronze, 0.62, 0.58, wear),
  };
  const armor: MachineBatch = {
    geometry: g.tile,
    material: m.armor,
    parts: [],
  };
  const rims: MachineBatch = { geometry: g.rim, material: m.edge, parts: [] };
  const core: MachineBatch = { geometry: g.core, material: m.dark, parts: [] };
  const vents: MachineBatch = { geometry: g.box, material: m.dark, parts: [] };
  const hatches: MachineBatch = {
    geometry: g.box,
    material: m.edge,
    parts: [],
  };
  const bronze: MachineBatch = {
    geometry: g.box,
    material: m.bronze,
    parts: [],
  };
  const bolts: MachineBatch = {
    geometry: g.bolt,
    material: m.dark,
    parts: [],
    fine: true,
  };
  const pipes: MachineBatch = {
    geometry: g.bolt,
    material: m.steel,
    parts: [],
  };
  const jaw: MachineBatch = { geometry: g.box, material: m.armor, parts: [] };
  const lips: MachineBatch = { geometry: g.lip, material: m.steel, parts: [] };
  for (let i = 0; i < RING_COUNT; i++) {
    const r = ringRadius(i);
    for (const z of [-0.42, 0.42])
      rims.parts.push({ ring: i, local: local(0, 0, z, r, r, 1) });
    for (const z of [-0.38, 0, 0.38])
      core.parts.push({ ring: i, local: local(0, 0, z, r, r, 1) });
    for (let j = 0; j < ARMOR_SECTOR_COUNT; j++) {
      const a = (j * Math.PI * 2) / ARMOR_SECTOR_COUNT;
      const c = Math.cos(a);
      const s = Math.sin(a);
      armor.parts.push({ ring: i, local: local(0, 0, 0, r, r, 1, a) });
      const variant = (i * 7 + j * 3) % 5;
      if (variant !== 3)
        vents.parts.push({
          ring: i,
          local: local(
            c * (r + 0.025),
            s * (r + 0.025),
            0,
            0.04,
            r * (variant === 0 || variant === 4 ? 0.28 : 0.235),
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
      } else if (variant !== 4) {
        hatches.parts.push({
          ring: i,
          local: local(
            c * (r + 0.075),
            s * (r + 0.075),
            0,
            0.045,
            r * 0.24,
            variant === 1 ? 0.42 : variant === 3 ? 0.48 : 0.25,
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
    [3.45, 0.82],
    [3.28, 1.03],
    [2.86, 1.18],
    [2.36, 0.35],
    [1.92, -0.5],
    [1.48, -1.45],
    [1.16, -2.25],
  ])
    lips.parts.push({ ring: 0, local: local(0, 0, z, r, r, 1) });
  for (let j = 0; j < DRILL_BLADE_COUNT; j++) {
    const a = (j * Math.PI * 2) / DRILL_BLADE_COUNT;
    const c = Math.cos(a);
    const s = Math.sin(a);
    jaw.parts.push({
      ring: 0,
      local: local(c * 3.12, s * 3.12, 1.16, 0.7, 0.32, 0.48, a),
    });
    bronze.parts.push({
      ring: 0,
      local: local(c * 2.81, s * 2.81, 1.28, 0.25, 0.095, 0.15, a),
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
        local: local(c * r, s * r, 1.44, 0.045, 0.045, 0.055),
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
      wear.dispose();
      Object.values(g).forEach((v) => v.dispose());
      Object.values(m).forEach((v) => v.dispose());
    },
  };
}
