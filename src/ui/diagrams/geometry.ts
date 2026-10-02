import type { Simulation } from '../../simulation/Simulation';
import { terrainHeight, random } from '../../simulation/terrain';
import { mapPosition, worldPosition } from '../../simulation/mapProjection';
import { DRILL_BLADE_COUNT } from '../../simulation/config';

export const DIAGRAM = {
  head: { cx: 110, cy: 108, blades: DRILL_BLADE_COUNT },
  profile: { left: 42, width: 820, datum: 78, verticalScale: 0.65 },
  ring: { cx: 64, cy: 66, radius: 46, innerRadius: 38, depth: 24, plates: 14 },
  cycle: { rings: 25, left: 92, width: 104, datum: 19 },
} as const;
const TAU = Math.PI * 2;
export type Point = readonly [number, number];
const fmt = (n: number) => n.toFixed(2);
export function path(points: ReadonlyArray<Point>, close = false): string {
  return (
    points.map(([x, y], i) => `${i ? 'L' : 'M'}${fmt(x)} ${fmt(y)}`).join(' ') +
    (close ? 'Z' : '')
  );
}
export function coast(points: ReadonlyArray<Point>, seed: number): string {
  const shore: Point[] = [];
  points.forEach(([x, y], i) => {
    const next = points[(i + 1) % points.length];
    const dx = next[0] - x,
      dy = next[1] - y,
      length = Math.hypot(dx, dy);
    for (let step = 0; step < 6; step++) {
      const t = step / 6;
      const jitter = step ? (random(seed + i * 6 + step) - 0.5) * 3 : 0;
      shore.push([
        x + dx * t - (dy / length) * jitter,
        y + dy * t + (dx / length) * jitter,
      ]);
    }
  });
  return path(shore, true);
}
export function island(
  cx: number,
  cy: number,
  rx: number,
  ry: number,
  seed: number,
): string {
  return path(
    Array.from({ length: 32 }, (_, i) => {
      const a = (i / 32) * TAU;
      const r = 0.78 + random(seed + i) * 0.22 + Math.sin(a * 5 + seed) * 0.14;
      return [cx + Math.cos(a) * rx * r, cy + Math.sin(a) * ry * r] as Point;
    }),
    true,
  );
}
// Marching triangles over the SAME height function as the 3D desert.
// The fixed triangulation also resolves saddle cells without ambiguous joins.
export function terrainContours(): Array<{ d: string; major: boolean }> {
  const columns = 100,
    rows = 62,
    step = 2.5;
  const samples = Array.from({ length: (columns + 1) * (rows + 1) }, (_, i) => {
    const x = (i % (columns + 1)) * step,
      y = Math.floor(i / (columns + 1)) * step;
    return {
      x,
      y,
      h: terrainHeight(...worldPosition(x, y)),
    };
  });
  const interval = 10 / (187 / 7);
  const min = Math.floor(Math.min(...samples.map((p) => p.h)) / interval);
  const max = Math.ceil(Math.max(...samples.map((p) => p.h)) / interval);
  const contours = [];
  for (let level = min; level <= max; level++) {
    const h = level * interval;
    const pieces: string[] = [];
    for (let row = 0; row < rows; row++)
      for (let col = 0; col < columns; col++) {
        const a = row * (columns + 1) + col,
          b = a + 1,
          c = a + columns + 1,
          d = c + 1;
        for (const ids of [
          [a, b, c],
          [b, d, c],
        ]) {
          const crossings: Point[] = [];
          for (let edge = 0; edge < 3; edge++) {
            const p = samples[ids[edge]],
              q = samples[ids[(edge + 1) % 3]];
            if (p.h < h !== q.h < h) {
              const t = (h - p.h) / (q.h - p.h);
              crossings.push([p.x + t * (q.x - p.x), p.y + t * (q.y - p.y)]);
            }
          }
          if (crossings.length === 2) pieces.push(path(crossings));
        }
      }
    if (pieces.length)
      contours.push({ d: pieces.join(' '), major: level % 5 === 0 });
  }
  return contours;
}
export function profilePose(simulation: Simulation) {
  const { left, width, datum, verticalScale } = DIAGRAM.profile;
  const tail = simulation.segments[simulation.segments.length - 1];
  const referenceHeight = terrainHeight(simulation.focus.x, simulation.focus.z);
  return simulation.segments.map((s) => ({
    x: left + width * (1 - s.distance / tail.distance),
    y: datum - (s.position.y - referenceHeight) * verticalScale,
    ground:
      datum -
      (terrainHeight(s.position.x, s.position.z) - referenceHeight) *
        verticalScale,
    radius: s.radius * 4.7,
  }));
}
export function mapBody(simulation: Simulation): string {
  return path(
    simulation.segments.map((s) => mapPosition(s.position.x, s.position.z)),
  );
}
export function ringPoint(
  angle: number,
  radius: number,
  depth: number,
  yaw: number,
): Point {
  const { cx, cy } = DIAGRAM.ring;
  return [
    cx + depth * Math.cos(yaw) + radius * Math.cos(angle) * Math.sin(yaw),
    cy +
      radius * Math.sin(angle) -
      radius * Math.cos(angle) * Math.cos(yaw) * 0.18 +
      depth * Math.sin(yaw) * 0.18,
  ];
}
export function ringArc(radius: number, depth: number, yaw: number): string {
  return path(
    Array.from({ length: 65 }, (_, i) =>
      ringPoint((i / 64) * TAU, radius, depth, yaw),
    ),
    true,
  );
}
export function ringPanel(
  index: number,
  yaw: number,
  roll: number,
  inset = 0,
): string {
  const { plates, radius, depth } = DIAGRAM.ring;
  const a = (index / plates) * TAU + roll + 0.025 + inset * 0.035;
  const b = ((index + 1) / plates) * TAU + roll - 0.025 - inset * 0.035;
  const r = radius + (inset ? 0.6 : 0);
  const z = depth / 2 - inset * 3;
  return path(
    [
      ringPoint(a, r, -z, yaw),
      ringPoint(b, r, -z, yaw),
      ringPoint(b, r, z, yaw),
      ringPoint(a, r, z, yaw),
    ],
    true,
  );
}
export function cyclePose(progress: number, row: number) {
  const phase = (progress + row / 4) * TAU;
  return Array.from({ length: DIAGRAM.cycle.rings }, (_, i) => {
    const u = i / (DIAGRAM.cycle.rings - 1);
    const wave = u * TAU - phase;
    return {
      x:
        DIAGRAM.cycle.left +
        u * DIAGRAM.cycle.width +
        Math.sin(phase) * 4 +
        Math.sin(wave) * 1.4,
      y: DIAGRAM.cycle.datum - 3 - Math.sin(wave) * 2.2,
      angle: Math.cos(wave) * -8,
      height: 1.3 + 2.4 * Math.pow(u, 0.4),
    };
  });
}
