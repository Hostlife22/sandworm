import { Vector3 } from 'three';
import { terrainHeight } from './terrain';

export const TRAVEL_SPEED = 5;
export const ROUTE_RADIUS_X = 95;
export const ROUTE_RADIUS_Z = 45;
export const OUTPOSTS: ReadonlyArray<readonly [number, number]> = [
  [-30, 15],
  [32, -19],
  [-14, -55],
  [55, 35],
];
const SAMPLE_COUNT = 4096;
const TAU = Math.PI * 2;

// One fixed world-space path. Head and tail visit the SAME points at different times.
// Its closed loop stays inside the desert and has four emergence/diving sections.
export class Trajectory {
  readonly length: number;
  readonly duration: number;
  private points = Array.from(
    { length: SAMPLE_COUNT + 1 },
    () => new Vector3(),
  );
  private lengths = new Float64Array(SAMPLE_COUNT + 1);
  constructor() {
    for (let i = 0; i <= SAMPLE_COUNT; i++) {
      const angle = (i / SAMPLE_COUNT) * TAU;
      const x = 22 + ROUTE_RADIUS_X * Math.sin(angle);
      const z = -ROUTE_RADIUS_Z * (1 - Math.cos(angle));
      this.points[i].set(x, 0, z);
      if (i)
        this.lengths[i] =
          this.lengths[i - 1] + this.points[i].distanceTo(this.points[i - 1]);
    }
    // Space vertical cycles along horizontal distance, avoiding sharp bends at ellipse ends.
    const horizontalLength = this.lengths[SAMPLE_COUNT];
    const horizontalDistances = this.lengths.slice();
    for (let i = 0; i <= SAMPLE_COUNT; i++) {
      const point = this.points[i];
      point.y =
        terrainHeight(point.x, point.z) -
        3.1 +
        12 *
          Math.cos(
            0.92 + (TAU * 4 * horizontalDistances[i]) / horizontalLength,
          );
      if (i)
        this.lengths[i] =
          this.lengths[i - 1] + point.distanceTo(this.points[i - 1]);
    }
    // Identical endpoints avoid numerical seams when the tail crosses the loop origin.
    this.points[SAMPLE_COUNT].copy(this.points[0]);
    this.length = this.lengths[SAMPLE_COUNT];
    this.duration = this.length / TRAVEL_SPEED;
  }
  sample(distance: number, position: Vector3, tangent?: Vector3): number {
    const wrapped = ((distance % this.length) + this.length) % this.length;
    let low = 0,
      high = SAMPLE_COUNT;
    while (low + 1 < high) {
      const middle = (low + high) >>> 1;
      if (this.lengths[middle] <= wrapped) low = middle;
      else high = middle;
    }
    const alpha =
      (wrapped - this.lengths[low]) / (this.lengths[high] - this.lengths[low]);
    position.lerpVectors(this.points[low], this.points[high], alpha);
    if (tangent)
      tangent.subVectors(this.points[high], this.points[low]).normalize();
    return (low + alpha) / SAMPLE_COUNT;
  }
}
export function mapPosition(x: number, z: number): [number, number] {
  return [17 + (x + 90) * 0.92, 13 + (z + 115) * 0.8];
}
