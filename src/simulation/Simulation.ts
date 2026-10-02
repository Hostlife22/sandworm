import { Matrix4, Quaternion, Vector3 } from 'three';
import { DEMO_CUES, RING_COUNT, RING_SPACING, ringRadius } from './config';
import type { CameraMode, MotionPhase } from './config';
import { terrainHeight } from './terrain';
import { Trajectory, TRAVEL_SPEED } from './Trajectory';

export interface SegmentTransform {
  position: Vector3;
  rotation: Quaternion;
  radius: number;
  distance: number;
  routeDistance: number;
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

export class Simulation {
  readonly trajectory = new Trajectory();
  readonly focus = new Vector3();
  readonly initialFocus = new Vector3();
  heading = 0;
  travelDistance = 0;
  cycleProgress = 0;
  mechanismAngle = 0;
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
      radius: ringRadius(i),
      distance: 0,
      routeDistance: 0,
      submerged: false,
    }),
  );
  private state: UIState;
  private listeners = new Set<() => void>();

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
    this.initialFocus.copy(this.focus);
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
          Math.round(this.poseTime / this.trajectory.duration) *
          this.trajectory.duration;
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
    this.cameraSettled = false;
    this.time = time;
    this.poseTime = time;
    this.solve(time);
  }
  tick(delta: number): void {
    // Analytic motion needs no integration steps: retain real time at 5–60 FPS.
    // Discard long suspension gaps rather than replaying time spent in a hidden tab.
    const dt = Number.isFinite(delta) && delta >= 0 && delta <= 5 ? delta : 0;
    this.frameMs += (delta * 1000 - this.frameMs) * 0.03;
    if (this.state.reference) {
      const remaining = this.referenceTarget - this.poseTime;
      this.poseTime +=
        Math.sign(remaining) *
        Math.min(Math.abs(remaining) * (1 - Math.exp(-dt * 4)), dt * 8);
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
  solve(time: number): void {
    this.solvedTime = time;
    this.travelDistance = time * TRAVEL_SPEED;
    const lap = this.travelDistance / this.trajectory.length;
    const drivePhase = lap * Math.PI * 2 * 24;
    this.cycleProgress = (((lap * 24) % 1) + 1) % 1;
    this.mechanismAngle = lap * Math.PI * 2 * 3;
    let distance = 0;
    this.submergedCount = 0;
    let rising = false;
    for (let i = 0; i < RING_COUNT; i++) {
      const segment = this.segments[i];
      if (i)
        distance +=
          RING_SPACING * (1 + 0.045 * Math.sin(i * 0.55 - drivePhase));
      segment.routeDistance = this.travelDistance - distance;
      this.trajectory.sample(
        segment.routeDistance,
        segment.position,
        this.tangent,
      );
      if (i === 0) {
        this.heading = Math.atan2(-this.tangent.z, this.tangent.x);
        rising = this.tangent.y > 0;
      }
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
    const tail = this.segments[RING_COUNT - 1];
    this.focus.copy(head.position).lerp(tail.position, 0.5);
    const ground = terrainHeight(this.focus.x, this.focus.z);
    this.focus.y = ground + Math.min(0, this.focus.y - ground) * 0.4;
    const height =
      head.position.y - terrainHeight(head.position.x, head.position.z);
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
