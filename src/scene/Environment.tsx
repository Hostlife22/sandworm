import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { InstancedMesh, Object3D } from 'three';
import type { Group } from 'three';
import { random, terrainHeight } from '../simulation/terrain';
import type { Simulation } from '../simulation/Simulation';
import { PALETTE } from './materials';
import { OUTPOSTS } from '../simulation/Trajectory';
export function Environment({ simulation }: { simulation: Simulation }) {
  const rocks = useRef<InstancedMesh>(null);
  const drones = useRef<Group>(null);
  const stations = useMemo(() => OUTPOSTS, []);
  useEffect(() => {
    if (!rocks.current) return;
    const o = new Object3D();
    for (let i = 0; i < 95; i++) {
      const x = (random(i * 3) - 0.5) * 220;
      const z = (random(i * 3 + 1) - 0.5) * 180;
      const s = 0.16 + random(i + 800) * 1.5;
      o.position.set(x, terrainHeight(x, z) + s * 0.2, z);
      o.scale.set(s, s * 0.52, s * 0.75);
      o.rotation.set(random(i), random(i + 9) * 6, random(i + 88));
      o.updateMatrix();
      rocks.current.setMatrixAt(i, o.matrix);
    }
    rocks.current.instanceMatrix.needsUpdate = true;
  }, []);
  useFrame(() => {
    if (drones.current) {
      drones.current.position
        .copy(simulation.focus)
        .sub(simulation.initialFocus);
      drones.current.position.y =
        terrainHeight(simulation.focus.x, simulation.focus.z) +
        13 +
        Math.sin(simulation.poseTime * 0.7) * 0.5;
      drones.current.rotation.y = simulation.heading;
    }
  });
  return (
    <group>
      <instancedMesh
        ref={rocks}
        args={[undefined, undefined, 95]}
        castShadow
        receiveShadow
      >
        <dodecahedronGeometry args={[1, 0]} />
        <meshStandardMaterial color="#9b8b6d" roughness={0.95} />
      </instancedMesh>
      {stations.map(([x, z], i) => (
        <group key={i} position={[x, terrainHeight(x, z), z]}>
          <mesh position={[0, 0.45, 0]} castShadow>
            <boxGeometry args={[1.7, 0.9, 1.2]} />
            <meshStandardMaterial color={PALETTE.armor} />
          </mesh>
          <mesh position={[1.3, 0.3, 0]} castShadow>
            <boxGeometry args={[0.7, 0.6, 0.9]} />
            <meshStandardMaterial color={PALETTE.dark} />
          </mesh>
          <mesh position={[0, 1.5, 0]}>
            <cylinderGeometry args={[0.025, 0.04, 2.5, 5]} />
            <meshStandardMaterial color={PALETTE.dark} />
          </mesh>
          <mesh position={[0, 2.6, 0]} rotation={[0, 0, 0.3]}>
            <boxGeometry args={[0.55, 0.04, 0.2]} />
            <meshStandardMaterial color={PALETTE.bronze} />
          </mesh>
        </group>
      ))}
      <group ref={drones}>
        {[-13, 15, 29].map((x, i) => (
          <group key={x} position={[x, i * 0.6, -3 + i * 5]}>
            <mesh castShadow>
              <boxGeometry args={[0.5, 0.13, 0.2]} />
              <meshStandardMaterial color={PALETTE.dark} />
            </mesh>
            <mesh>
              <boxGeometry args={[0.13, 0.05, 1.4]} />
              <meshStandardMaterial color={PALETTE.steel} />
            </mesh>
            {[-0.55, 0.55].map((z) => (
              <mesh key={z} position={[0, 0, z]} rotation={[Math.PI / 2, 0, 0]}>
                <torusGeometry args={[0.23, 0.025, 4, 12]} />
                <meshStandardMaterial color={PALETTE.dark} />
              </mesh>
            ))}
          </group>
        ))}
      </group>
      {[-90, -72, -62, 85].map((x, i) => (
        <mesh key={x} position={[x, terrainHeight(x, -95) + 3, -95]} castShadow>
          <boxGeometry args={[5, 6 + i * 2, 3]} />
          <meshStandardMaterial color="#b8ad93" />
        </mesh>
      ))}
    </group>
  );
}
