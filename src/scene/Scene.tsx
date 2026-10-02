import { Component, Suspense, useEffect, useState, useRef } from 'react';
import type { ReactNode } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import type { Simulation } from '../simulation/Simulation';
import { Machine } from './Machine';
import { Terrain } from './Terrain';
import { Environment } from './Environment';
import { Dust } from './Dust';
import { CameraRig } from './CameraRig';
import { PALETTE } from './materials';
import { Callouts } from './Callouts';
interface BoundaryProps {
  children: ReactNode;
}
class SceneBoundary extends Component<BoundaryProps, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? <Fallback /> : this.props.children;
  }
}
function Fallback() {
  return (
    <div className="scene-fallback" role="alert">
      <span className="eyebrow">VIEWPORT OFFLINE</span>
      <h2>3D rendering is unavailable</h2>
      <p>
        Enable WebGL / hardware acceleration in your browser, then reload. The
        engineering atlas remains available below.
      </p>
      <button onClick={() => location.reload()}>RETRY VIEWPORT</button>
    </div>
  );
}
function Clock({
  simulation,
  onReady,
}: {
  simulation: Simulation;
  onReady: () => void;
}) {
  const previousTime = useRef(Number.NaN);
  useEffect(() => {
    simulation.ready = true;
    onReady();
    return () => {
      simulation.ready = false;
    };
  }, [simulation, onReady]);
  useFrame(({ gl }, delta) => {
    simulation.tick(document.hidden ? 0 : delta);
    gl.shadowMap.autoUpdate = false;
    gl.shadowMap.needsUpdate = previousTime.current !== simulation.poseTime;
    previousTime.current = simulation.poseTime;
    simulation.drawCalls = gl.info.render.calls;
    simulation.triangles = gl.info.render.triangles;
  }, -3);
  return null;
}
const readyEvent = () => document.dispatchEvent(new Event('scene-ready'));
export default function Scene({ simulation }: { simulation: Simulation }) {
  const [ready, setReady] = useState(false);
  const [supported] = useState(() => {
    try {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl2');
      if (!gl) return false;
      gl.getExtension('WEBGL_lose_context')?.loseContext();
      return true;
    } catch {
      return false;
    }
  });
  useEffect(() => {
    const loaded = () => setReady(true);
    document.addEventListener('scene-ready', loaded);
    return () => document.removeEventListener('scene-ready', loaded);
  }, []);
  const [lost, setLost] = useState(false);
  const cleanupContext = useRef<(() => void) | null>(null);
  useEffect(() => () => cleanupContext.current?.(), []);
  return (
    <SceneBoundary>
      {!supported || lost ? (
        <Fallback />
      ) : (
        <>
          {!ready && (
            <div className="loading" role="status">
              INITIALIZING EXCAVATION SYSTEMS
              <span>Building terrain & articulated geometry</span>
            </div>
          )}
          <Canvas
            shadows
            dpr={[1, 1.5]}
            camera={{ position: [52, 16, 37], fov: 36, near: 0.1, far: 400 }}
            gl={{
              antialias: true,
              stencil: true,
              alpha: false,
              powerPreference: 'high-performance',
            }}
            onCreated={({ gl }) => {
              const handleLoss = (event: Event) => {
                event.preventDefault();
                setLost(true);
              };
              gl.domElement.addEventListener('webglcontextlost', handleLoss);
              cleanupContext.current = () =>
                gl.domElement.removeEventListener(
                  'webglcontextlost',
                  handleLoss,
                );
            }}
          >
            <color attach="background" args={[PALETTE.background]} />
            <fog attach="fog" args={[PALETTE.background, 85, 235]} />
            <hemisphereLight args={['#f7f3e8', '#9b8d6f', 2.0]} />
            <ambientLight intensity={0.3} />
            <directionalLight
              position={[-24, 34, -18]}
              intensity={3.2}
              color="#fff3d7"
              castShadow
              shadow-mapSize={[1024, 1024]}
              shadow-camera-left={-65}
              shadow-camera-right={65}
              shadow-camera-top={50}
              shadow-camera-bottom={-50}
              shadow-camera-far={140}
              shadow-bias={-0.0003}
              shadow-normalBias={0.06}
            />
            <Suspense fallback={null}>
              <Clock simulation={simulation} onReady={readyEvent} />
              <Terrain />
              <Machine simulation={simulation} />
              <Environment simulation={simulation} />
              <Dust simulation={simulation} />
              <CameraRig simulation={simulation} />
              <Callouts simulation={simulation} />
            </Suspense>
          </Canvas>
        </>
      )}
    </SceneBoundary>
  );
}
