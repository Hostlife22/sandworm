import { useEffect, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import {
  BufferAttribute,
  BufferGeometry,
  ShaderMaterial,
  Vector3,
} from 'three';
import type { Simulation } from '../simulation/Simulation';
import { random, terrainHeight } from '../simulation/terrain';
const COUNT = 220;
export function Dust({ simulation }: { simulation: Simulation }) {
  const resources = useMemo(() => {
    const positions = new Float32Array(COUNT * 3);
    const alpha = new Float32Array(COUNT);
    const sizes = new Float32Array(COUNT);
    const geometry = new BufferGeometry();
    geometry.setAttribute('position', new BufferAttribute(positions, 3));
    geometry.setAttribute('alpha', new BufferAttribute(alpha, 1));
    geometry.setAttribute('size', new BufferAttribute(sizes, 1));
    const material = new ShaderMaterial({
      transparent: true,
      depthWrite: false,
      uniforms: {},
      vertexShader: `attribute float alpha; attribute float size; varying float opacity; void main(){opacity=alpha; vec4 p=modelViewMatrix*vec4(position,1.0);gl_Position=projectionMatrix*p;gl_PointSize=clamp(size*380.0/-p.z,1.0,65.0);}`,
      fragmentShader: `varying float opacity;void main(){float d=length(gl_PointCoord-0.5)*2.0;float a=exp(-d*d*4.5)*(1.0-smoothstep(0.6,1.0,d));gl_FragColor=vec4(0.66,0.59,0.43,a*opacity);}`,
    });
    return {
      positions,
      alpha,
      sizes,
      geometry,
      material,
      birth: new Float64Array(COUNT).fill(-10),
      origin: new Float32Array(COUNT * 3),
      previous: simulation.poseTime,
      lateral: new Vector3(),
      forward: new Vector3(),
    };
  }, [simulation]);
  useEffect(
    () => () => {
      resources.geometry.dispose();
      resources.material.dispose();
    },
    [resources],
  );
  useFrame(() => {
    const t = simulation.poseTime;
    const dt = t - resources.previous;
    resources.previous = t;
    if (dt === 0) return;
    if (dt < 0 || dt > 1) resources.birth.fill(-10);
    for (let i = 0; i < COUNT; i++) {
      let age = t - resources.birth[i];
      const lifetime = 1.3 + random(i) * 1.3;
      const s = simulation.segments[i % simulation.segments.length];
      const h = terrainHeight(s.position.x, s.position.z);
      if (
        age > lifetime &&
        Math.abs(s.position.y - h) < s.radius + 0.45 &&
        random(i + Math.floor(t * 30)) < Math.min(dt * 12, 1)
      ) {
        resources.birth[i] = t;
        age = 0;
        const side = i % 2 === 0 ? 1 : -1;
        resources.lateral.set(1, 0, 0).applyQuaternion(s.rotation);
        resources.forward.set(0, 0, 1).applyQuaternion(s.rotation);
        const spread =
          side *
          Math.sqrt(Math.max(0, s.radius * s.radius - (s.position.y - h) ** 2));
        const scatter = (random(i + 1) - 0.5) * 1.8;
        resources.origin[i * 3] =
          s.position.x +
          resources.lateral.x * spread +
          resources.forward.x * scatter;
        resources.origin[i * 3 + 2] =
          s.position.z +
          resources.lateral.z * spread +
          resources.forward.z * scatter;
        resources.origin[i * 3 + 1] = h + 0.15;
      }
      const alive = age >= 0 && age < lifetime;
      resources.alpha[i] = alive
        ? Math.sin((age / lifetime) * Math.PI) * 0.3
        : 0;
      resources.positions[i * 3] =
        resources.origin[i * 3] + age * (0.4 + random(i + 200));
      resources.positions[i * 3 + 1] = resources.origin[i * 3 + 1] + age * 0.8;
      resources.positions[i * 3 + 2] = resources.origin[i * 3 + 2] + age * 0.5;
      resources.sizes[i] = 1.4 + Math.max(0, age) * 1.5;
    }
    for (const name of ['position', 'alpha', 'size'])
      resources.geometry.attributes[name].needsUpdate = true;
  });
  return (
    <points
      geometry={resources.geometry}
      material={resources.material}
      frustumCulled={false}
      renderOrder={2}
    />
  );
}
