import { mapPosition } from '../src/simulation/mapProjection';
import { describe, expect, it } from 'vitest';
import { Vector3 } from 'three';
import { Trajectory, TRAVEL_SPEED } from '../src/simulation/Trajectory';
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
  it('pauses exactly and discards suspended time on resume', () => {
    const sim = new Simulation();
    sim.tick(0.02);
    sim.command({ type: 'pause' });
    const before = sim.time;
    sim.tick(100);
    expect(sim.time).toBe(before);
    sim.command({ type: 'pause' });
    sim.tick(100);
    expect(sim.time).toBe(before);
    sim.tick(0.2);
    expect(sim.time - before).toBeCloseTo(0.2);
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
    for (let x = -100; x < 130; x += 1.7) {
      for (let z = -105; z < 40; z += 2.3) {
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

describe('world-space travel', () => {
  it('advances across fixed terrain instead of flexing around a stationary head', () => {
    const sim = new Simulation();
    const start = sim.segments[0].position.clone();
    sim.seek(10);
    expect(sim.travelDistance).toBe(50);
    const head = sim.segments[0].position;
    expect(Math.hypot(head.x - start.x, head.z - start.z)).toBeGreaterThan(38);
  });
  it('makes every ring follow positions previously occupied by the head', () => {
    const sim = new Simulation(),
      history = new Simulation();
    sim.seek(15);
    for (const ring of sim.segments) {
      history.seek(ring.routeDistance / TRAVEL_SPEED);
      expect(
        ring.position.distanceTo(history.segments[0].position),
      ).toBeLessThan(1e-8);
    }
  });
  it('keeps travel speed independent of normal foreground frame rate', () => {
    const positions: Vector3[] = [];
    for (const fps of [60, 30, 10, 5, 2, 1]) {
      const sim = new Simulation();
      for (let i = 0; i < fps * 5; i++) sim.tick(1 / fps);
      expect(sim.time).toBeCloseTo(5, 8);
      positions.push(sim.segments[0].position.clone());
    }
    for (const position of positions)
      expect(position.distanceTo(positions[0])).toBeLessThan(1e-8);
  });
  it('crosses route seams continuously and keeps the route inside the map and terrain', () => {
    const route = new Trajectory();
    const before = new Vector3(),
      after = new Vector3();
    route.sample(route.length - 0.001, before);
    route.sample(0.001, after);
    expect(before.distanceTo(after)).toBeCloseTo(0.002, 4);
    for (let distance = 0; distance < route.length; distance += 1) {
      route.sample(distance, before);
      const [x, y] = mapPosition(before.x, before.z);
      expect(x).toBeGreaterThan(0);
      expect(x).toBeLessThan(250);
      expect(y).toBeGreaterThan(0);
      expect(y).toBeLessThan(155);
      expect(Math.abs(before.x)).toBeLessThan(TERRAIN.size / 2 - 10);
      expect(Math.abs(before.z)).toBeLessThan(TERRAIN.size / 2 - 10);
    }
  });
  it('retains ordered gaps and finite orientations for an entire world route', () => {
    const sim = new Simulation();
    for (let time = 0; time < sim.trajectory.duration + 2; time += 0.4) {
      sim.seek(time);
      sim.segments.forEach((ring, i) => {
        expect(ring.rotation.length()).toBeCloseTo(1, 8);
        if (i) {
          const prior = sim.segments[i - 1];
          expect(ring.routeDistance).toBeLessThan(prior.routeDistance);
          expect(ring.position.distanceTo(prior.position)).toBeGreaterThan(1.3);
          expect(ring.position.distanceTo(prior.position)).toBeLessThan(1.46);
        }
      });
    }
  });
});
