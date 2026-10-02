import { Matrix4, Quaternion, Vector3 } from 'three';
import { CYCLE_DURATION, DEMO_CUES, RING_COUNT, RING_SPACING } from './config';
import type { CameraMode, MotionPhase } from './config';
import { terrainHeight } from './terrain';

export interface SegmentTransform {
  position: Vector3;
  rotation: Quaternion;
  radius: number;
  distance: number;
  submerged: boolean;
}
export interface UIState {
  camera: CameraMode;
  paused: boolean;
  reference: boolean;
  xray: boolean;
  hud: boolean;
  demo: boolean;
  cameraRevision: number;
}
export type Command =
  | { type: 'camera'; camera: CameraMode }
  | { type: 'pause' | 'reference' | 'xray' | 'hud' | 'demo' | 'manual-camera' };
const UP = new Vector3(0, 1, 0);
const SAMPLE_COUNT = 600;
const SAMPLE_STEP = 0.13;

export class Simulation {
  time = 0;
  poseTime = 0;
  demoTime = 0;
  phase: MotionPhase = 'Surface arc';
  submergedCount = 0;
  frameMs = 0;
  drawCalls = 0;
  triangles = 0;
  ready = false;
  readonly cameraPosition = new Vector3();
  readonly cameraTarget = new Vector3();
  cameraManual = false;
  cameraSettled = false;
  reducedMotion: boolean;
  readonly segments: SegmentTransform[] = Array.from(
    { length: RING_COUNT },
    (_, i) => ({
      position: new Vector3(),
      rotation: new Quaternion(),
      radius: 3.5 * (0.28 + 0.72 * Math.pow(1 - i / RING_COUNT, 0.36)),
      distance: 0,
      submerged: false,
    }),
  );
  private state: UIState;
  private listeners = new Set<() => void>();
  private samples = Array.from({ length: SAMPLE_COUNT }, () => new Vector3());
  private lengths = new Float64Array(SAMPLE_COUNT);
  private tangent = new Vector3();
  private right = new Vector3();
  private up = new Vector3();
  private matrix = new Matrix4();
  private cue = -1;
  private referenceTarget = 0;
  private solvedTime = Number.NaN;
  constructor(reducedMotion = false) {
    this.reducedMotion = reducedMotion;
    this.state = {
      camera: 'front',
      paused: reducedMotion,
      reference: reducedMotion,
      xray: false,
      hud: true,
      demo: false,
      cameraRevision: 0,
    };
    this.solve(0);
  }
  subscribe = (listener: () => void): (() => void) => {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  };
  getSnapshot = (): UIState => this.state;
  private set(patch: Partial<UIState>): void {
    this.state = { ...this.state, ...patch };
    this.listeners.forEach((fn) => fn());
  }
  command(command: Command): void {
    switch (command.type) {
      case 'manual-camera':
        this.set({ demo: false });
        break;
      case 'camera':
        this.cameraSettled = false;
        this.set({
          camera: command.camera,
          cameraRevision: this.state.cameraRevision + 1,
          demo: false,
        });
        break;
      case 'xray':
        this.set({ xray: !this.state.xray, demo: false });
        break;
      case 'hud':
        this.set({ hud: !this.state.hud });
        break;
      case 'pause':
        if (this.state.reference) {
          this.time = this.poseTime;
          this.set({ reference: false, paused: false });
        } else this.set({ paused: !this.state.paused });
        break;
      case 'reference':
        this.referenceTarget =
          Math.round(this.poseTime / CYCLE_DURATION) * CYCLE_DURATION;
        this.set({ reference: true, paused: true, demo: false });
        break;
      case 'demo':
        this.demoTime = 0;
        this.cue = -1;
        this.set({ demo: !this.state.demo, reference: false, paused: false });
        break;
    }
  }
  // A deterministic inspection entry point, also used by the capture suite.
  seek(time: number): void {
    this.time = time;
    this.poseTime = time;
    this.solve(time);
  }
  tick(delta: number): void {
    const dt = Math.min(Math.max(delta, 0), 0.05);
    this.frameMs += (delta * 1000 - this.frameMs) * 0.03;
    if (this.state.reference) {
      this.poseTime +=
        (this.referenceTarget - this.poseTime) * (1 - Math.exp(-dt * 4));
      if (Math.abs(this.poseTime - this.referenceTarget) < 0.0001) {
        this.poseTime = 0;
        this.referenceTarget = 0;
      }
    } else if (!this.state.paused) {
      this.time += dt;
      this.poseTime = this.time;
      if (this.state.demo) {
        this.demoTime = (this.demoTime + dt) % 78.583;
        let index = 0;
        for (let i = 0; i < DEMO_CUES.length; i++)
          if (this.demoTime >= DEMO_CUES[i].at) index = i;
        if (index !== this.cue) {
          this.cue = index;
          const cue = DEMO_CUES[index];
          this.set({
            camera: cue.camera,
            xray: cue.xray,
            cameraRevision: this.state.cameraRevision + 1,
          });
        }
      }
    }
    if (this.solvedTime !== this.poseTime) this.solve(this.poseTime);
  }
  private path(q: number, time: number, target: Vector3): void {
    const phase = time * 0.24 + 0.92;
    target.set(
      22 - q,
      -3.1 + 12 * Math.cos(phase - q * 0.049),
      4 * Math.sin(q * 0.055 + phase) - 3,
    );
  }
  solve(time: number): void {
    this.solvedTime = time;
    // Oversample once, then invert the cumulative arc-length table for all rings.
    this.lengths[0] = 0;
    for (let j = 0; j < SAMPLE_COUNT; j++) {
      this.path(j * SAMPLE_STEP, time, this.samples[j]);
      if (j)
        this.lengths[j] =
          this.lengths[j - 1] + this.samples[j].distanceTo(this.samples[j - 1]);
    }
    let distance = 0;
    let cursor = 1;
    this.submergedCount = 0;
    for (let i = 0; i < RING_COUNT; i++) {
      const segment = this.segments[i];
      if (i)
        distance +=
          RING_SPACING * (1 + 0.045 * Math.sin(i * 0.55 - time * 1.92));
      while (cursor < SAMPLE_COUNT - 1 && this.lengths[cursor] < distance)
        cursor++;
      const a = this.lengths[cursor - 1];
      const b = this.lengths[cursor];
      segment.position.lerpVectors(
        this.samples[cursor - 1],
        this.samples[cursor],
        (distance - a) / (b - a),
      );
      this.tangent
        .subVectors(this.samples[cursor - 1], this.samples[cursor])
        .normalize();
      this.right.crossVectors(UP, this.tangent).normalize();
      this.up.crossVectors(this.tangent, this.right).normalize();
      this.matrix.makeBasis(this.right, this.up, this.tangent);
      segment.rotation.setFromRotationMatrix(this.matrix);
      segment.distance = distance;
      segment.submerged =
        segment.position.y + segment.radius <
        terrainHeight(segment.position.x, segment.position.z);
      if (segment.submerged) this.submergedCount++;
    }
    const head = this.segments[0];
    const height =
      head.position.y - terrainHeight(head.position.x, head.position.z);
    const rising = -Math.sin(time * 0.24 + 0.92) > 0;
    this.phase =
      this.submergedCount === RING_COUNT
        ? 'Subsurface traversal'
        : height > head.radius * 0.75
          ? 'Surface arc'
          : rising
            ? 'Breaching'
            : height < -head.radius
              ? 'Diving'
              : 'Surface plough';
  }
}
