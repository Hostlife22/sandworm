import { useEffect, useMemo } from 'react';
import {
  Color,
  MeshStandardMaterial,
  PlaneGeometry,
  AlwaysStencilFunc,
  ReplaceStencilOp,
} from 'three';
import { terrainHeight, TERRAIN } from '../simulation/terrain';
import { PALETTE } from './materials';
export function Terrain() {
  const resources = useMemo(() => {
    const geometry = new PlaneGeometry(
      TERRAIN.size,
      TERRAIN.size,
      TERRAIN.resolution,
      TERRAIN.resolution,
    );
    geometry.rotateX(-Math.PI / 2);
    const p = geometry.attributes.position;
    for (let i = 0; i < p.count; i++)
      p.setY(i, terrainHeight(p.getX(i), p.getZ(i)));
    geometry.computeVertexNormals();
    const material = new MeshStandardMaterial({
      color: new Color(PALETTE.sand),
      roughness: 0.96,
      metalness: 0,
      stencilWrite: true,
      stencilRef: 0,
      stencilFunc: AlwaysStencilFunc,
      stencilZPass: ReplaceStencilOp,
    });
    material.onBeforeCompile = (shader) => {
      shader.vertexShader = 'varying vec3 duneWorld;\n' + shader.vertexShader;
      shader.vertexShader = shader.vertexShader.replace(
        '#include <begin_vertex>',
        '#include <begin_vertex>\nduneWorld=(modelMatrix*vec4(position,1.0)).xyz;',
      );
      shader.fragmentShader =
        'varying vec3 duneWorld;\n' + shader.fragmentShader;
      shader.fragmentShader = shader.fragmentShader.replace(
        '#include <color_fragment>',
        `#include <color_fragment>
        float phase=duneWorld.x*1.8+duneWorld.z*2.2+8.0*sin(duneWorld.x*0.16+duneWorld.z*0.13)+5.0*cos(duneWorld.z*0.22-duneWorld.x*0.11)+1.5*sin(duneWorld.x*0.41+duneWorld.z*0.36);
        float rippleFade=1.0-smoothstep(1.0,4.0,fwidth(phase));
        float windPatch=0.12+0.88*smoothstep(-0.3,0.8,sin(duneWorld.x*0.11-duneWorld.z*0.07)+0.45*sin(duneWorld.x*0.24+duneWorld.z*0.15));
        float ridge=pow(0.5+0.5*sin(phase),16.0)*rippleFade*windPatch;
        float broad=sin(duneWorld.x*0.17)*sin(duneWorld.z*0.11);
        diffuseColor.rgb*=1.0-0.24*ridge+0.018*broad;
        float sandHeight=0.012*ridge;`,
      );
      shader.fragmentShader = shader.fragmentShader.replace(
        '#include <normal_fragment_maps>',
        `#include <normal_fragment_maps>
        vec3 q0=dFdx(-vViewPosition),q1=dFdy(-vViewPosition);
        vec3 r1=cross(q1,normal),r2=cross(normal,q0);
        float det=dot(q0,r1);
        normal=normalize(abs(det)*normal-sign(det)*(dFdx(sandHeight)*r1+dFdy(sandHeight)*r2));`,
      );
    };
    return { geometry, material };
  }, []);
  useEffect(
    () => () => {
      resources.geometry.dispose();
      resources.material.dispose();
    },
    [resources],
  );
  return (
    <mesh
      geometry={resources.geometry}
      material={resources.material}
      receiveShadow
    />
  );
}
