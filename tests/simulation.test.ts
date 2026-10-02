import { describe, expect, it } from 'vitest';
import { Simulation } from '../src/simulation/Simulation';
import { CAMERAS, RING_COUNT, RING_SPACING } from '../src/simulation/config';
import { terrainGLSL, terrainHeight, TERRAIN } from '../src/simulation/terrain';
describe('articulated trajectory', () => {
  it('keeps finite normalized orientations, ordered arc lengths and safe intervals throughout two cycles', () => {
    const sim = new Simulation();
    for (let t = 0; t < 54; t += 0.17) {
      sim.seek(t);
      sim.segments.forEach((s, i) => {
        expect(
          [...s.position.toArray(), ...s.rotation.toArray()].every(
            Number.isFinite,
          ),
        ).toBe(true);
        expect(s.rotation.length()).toBeCloseTo(1, 9);
        if (i) {
          const prior = sim.segments[i - 1];
          expect(s.distance).toBeGreaterThan(prior.distance);
          expect(s.position.distanceTo(prior.position)).toBeGreaterThan(
            RING_SPACING * 0.94,
          );
          expect(s.position.distanceTo(prior.position)).toBeLessThan(
            RING_SPACING * 1.06,
          );
          expect(Math.abs(s.rotation.dot(prior.rotation))).toBeGreaterThan(
            0.995,
          );
        }
      });
    }
  });
  it('has continuous transitions and sequential immersion', () => {
    const sim = new Simulation();
    let partial = false,
      full = false,
      high = false;
    for (let t = 0; t < 27; t += 0.1) {
      sim.seek(t);
      const before = sim.segments.map((s) => s.position.clone());
      sim.seek(t + 0.001);
      sim.segments.forEach((s, i) =>
        expect(s.position.distanceTo(before[i])).toBeLessThan(0.01),
      );
      partial ||= sim.submergedCount > 0 && sim.submergedCount < RING_COUNT;
      full ||= sim.submergedCount === RING_COUNT;
      high ||= sim.segments.some((s) => s.position.y > 8);
    }
    expect(partial && full && high).toBe(true);
  });
  it('pauses exactly and clamps long frames on resume', () => {
    const sim = new Simulation();
    sim.tick(0.02);
    sim.command({ type: 'pause' });
    const before = sim.time;
    sim.tick(100);
    expect(sim.time).toBe(before);
    sim.command({ type: 'pause' });
    sim.tick(100);
    expect(sim.time - before).toBeCloseTo(0.05);
  });
  it('camera and X-ray commands preserve time and geometry', () => {
    const sim = new Simulation();
    sim.seek(6);
    const before = sim.segments.map((s) => s.position.toArray());
    for (const camera of CAMERAS) {
      sim.command({ type: 'camera', camera });
      sim.command({ type: 'xray' });
      expect(sim.time).toBe(6);
      expect(sim.getSnapshot().camera).toBe(camera);
      expect(sim.segments.map((s) => s.position.toArray())).toEqual(before);
    }
  });
  it('converges to a deterministic reference pose and resumes from it', () => {
    const sim = new Simulation();
    const reference = sim.segments.map((s) => s.position.toArray());
    for (const start of [4, 20, 90]) {
      sim.seek(start);
      sim.command({ type: 'reference' });
      for (let i = 0; i < 400; i++) sim.tick(0.05);
      expect(sim.poseTime).toBe(0);
      expect(sim.segments.map((s) => s.position.toArray())).toEqual(reference);
      sim.command({ type: 'pause' });
      sim.tick(0.02);
      expect(sim.time).toBeCloseTo(0.02);
    }
  });
  it('starts reduced motion in a static reference pose', () => {
    const sim = new Simulation(true);
    sim.tick(4);
    expect(sim.time).toBe(0);
    expect(sim.getSnapshot().paused).toBe(true);
    expect(sim.getSnapshot().reference).toBe(true);
    sim.command({ type: 'pause' });
    sim.tick(0.02);
    expect(sim.time).toBe(0.02);
  });
  it('matches the CPU surface to the shader coefficients and a triangulated mesh', () => {
    expect(terrainGLSL).toContain('1.35*sin(p.x*0.065+p.y*0.035)');
    const step = TERRAIN.size / TERRAIN.resolution;
    let error = 0;
    for (let x = -50; x < 50; x += 1.7) {
      for (let z = -30; z < 30; z += 2.3) {
        const x0 = Math.floor((x + 170) / step) * step - 170;
        const z0 = Math.floor((z + 170) / step) * step - 170;
        const u = (x - x0) / step,
          v = (z - z0) / step;
        const a = terrainHeight(x0, z0),
          b = terrainHeight(x0 + step, z0),
          c = terrainHeight(x0, z0 + step),
          d = terrainHeight(x0 + step, z0 + step);
        const interpolated =
          u + v < 1
            ? a + (b - a) * u + (c - a) * v
            : d + (c - d) * (1 - u) + (b - d) * (1 - v);
        error = Math.max(error, Math.abs(interpolated - terrainHeight(x, z)));
      }
    }
    expect(error).toBeLessThan(0.025);
  });
  it('demo follows recording camera cues without restarting the simulation', () => {
    const sim = new Simulation();
    sim.seek(10);
    sim.command({ type: 'demo' });
    for (let i = 0; i < 470; i++) sim.tick(0.05);
    expect(sim.getSnapshot().camera).toBe('side');
    expect(sim.getSnapshot().xray).toBe(true);
    expect(sim.time).toBeCloseTo(33.5);
  });
});

describe('reference transition', () => {
  it('starts smoothly even after many locomotion cycles', () => {
    for (const time of [20, 90, 200]) {
      const sim = new Simulation();
      sim.seek(time);
      const before = sim.segments.map((s) => s.position.clone());
      sim.command({ type: 'reference' });
      sim.tick(0.001);
      sim.segments.forEach((s, i) =>
        expect(s.position.distanceTo(before[i])).toBeLessThan(0.15),
      );
    }
  });
});
