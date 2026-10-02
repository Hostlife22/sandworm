export interface TerrainParameters {
  amplitude: number;
  frequency: number;
  size: number;
  resolution: number;
}
export const TERRAIN: TerrainParameters = {
  amplitude: 1.35,
  frequency: 0.065,
  size: 340,
  resolution: 240,
};
// Keep this analytic expression identical to terrainGLSL. The mesh samples it.
export function terrainHeight(x: number, z: number): number {
  return (
    1.35 * Math.sin(x * 0.065 + z * 0.035) +
    0.8 * Math.sin(z * 0.105 - x * 0.025) +
    0.24 * Math.sin(x * 0.19 + z * 0.13) +
    8 * Math.exp(-((x + 42) ** 2 + (z + 35) ** 2) / 650) +
    6 * Math.exp(-((x - 48) ** 2 + (z - 32) ** 2) / 480)
  );
}
export const terrainGLSL = `float surfaceHeight(vec2 p) {
 return 1.35*sin(p.x*0.065+p.y*0.035)+0.8*sin(p.y*0.105-p.x*0.025)+0.24*sin(p.x*0.19+p.y*0.13)+8.0*exp(-dot(p+vec2(42.0,35.0),p+vec2(42.0,35.0))/650.0)+6.0*exp(-dot(p-vec2(48.0,32.0),p-vec2(48.0,32.0))/480.0);
}`;
export function random(seed: number): number {
  const n = Math.sin(seed * 127.1 + 311.7) * 43758.5453123;
  return n - Math.floor(n);
}
