// Shared affine projection for terrain contours, route, markers and inverse lookup.
const MAP = {
  x: { origin: 17, offset: 90, scale: 0.92 },
  z: { origin: 13, offset: 115, scale: 0.8 },
} as const;
export function mapPosition(x: number, z: number): [number, number] {
  return [
    MAP.x.origin + (x + MAP.x.offset) * MAP.x.scale,
    MAP.z.origin + (z + MAP.z.offset) * MAP.z.scale,
  ];
}
export function worldPosition(x: number, y: number): [number, number] {
  return [
    (x - MAP.x.origin) / MAP.x.scale - MAP.x.offset,
    (y - MAP.z.origin) / MAP.z.scale - MAP.z.offset,
  ];
}
