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
        float ripple=sin(duneWorld.x*2.6+duneWorld.z*3.8+2.0*sin(duneWorld.x*0.16)+sin(duneWorld.z*0.22));
        float grains=fract(sin(dot(duneWorld.xz,vec2(127.1,311.7)))*43758.5453);
        float attenuation=1.0-smoothstep(40.0,145.0,length(duneWorld.xz));
        diffuseColor.rgb*=1.0-(0.036*ripple+0.018*grains)*attenuation;`,
      );
      shader.fragmentShader = shader.fragmentShader.replace(
        '#include <normal_fragment_maps>',
        `#include <normal_fragment_maps>
        float rippleNormal=cos(duneWorld.x*2.6+duneWorld.z*3.8+2.0*sin(duneWorld.x*0.16)+sin(duneWorld.z*0.22));
        normal=normalize(normal+vec3(rippleNormal*0.09,0.0,rippleNormal*0.035));`,
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
