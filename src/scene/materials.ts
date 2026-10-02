import {
  Color,
  MeshStandardMaterial,
  MeshBasicMaterial,
  AlwaysStencilFunc,
  NotEqualStencilFunc,
  ReplaceStencilOp,
} from 'three';
import type { Texture } from 'three';
import { terrainGLSL } from '../simulation/terrain';
export const PALETTE = {
  background: '#ece9dd',
  sand: '#dbd3bc',
  armor: '#bcb9a8',
  edge: '#c9c6b6',
  dark: '#252922',
  steel: '#74766c',
  bronze: '#928065',
  xray: '#7aafad',
} as const;
export function machineMaterial(
  color: string,
  metalness: number,
  roughness: number,
  wear: Texture,
): MeshStandardMaterial {
  const material = new MeshStandardMaterial({
    color,
    metalness,
    roughness,
    stencilWrite: true,
    stencilRef: 1,
    stencilFunc: AlwaysStencilFunc,
    stencilZPass: ReplaceStencilOp,
  });
  material.onBeforeCompile = (shader) => {
    shader.uniforms.surfaceWear = { value: wear };
    shader.vertexShader =
      'varying vec3 machineWorld; varying vec2 plateUV; varying float plateSeed;\n' +
      shader.vertexShader;
    shader.vertexShader = shader.vertexShader.replace(
      '#include <project_vertex>',
      `plateUV=uv;
      plateSeed=0.0;
      vec4 machinePosition = vec4(transformed, 1.0);
      #ifdef USE_INSTANCING
      machinePosition = instanceMatrix * machinePosition;
      plateSeed=fract(float(gl_InstanceID)*0.6180339887);
      #endif
      machineWorld = (modelMatrix * machinePosition).xyz;
      #include <project_vertex>`,
    );
    shader.fragmentShader =
      'varying vec3 machineWorld; varying vec2 plateUV; varying float plateSeed; uniform sampler2D surfaceWear;\n' +
      terrainGLSL +
      '\n' +
      shader.fragmentShader;
    shader.fragmentShader = shader.fragmentShader.replace(
      '#include <color_fragment>',
      `#include <color_fragment>
      vec2 wearUV=plateUV*0.7+vec2(plateSeed,plateSeed*0.37);
      vec4 wearSample=texture2D(surfaceWear,wearUV);
      float plateTone=0.98+plateSeed*0.04;
      float contactDirt=0.12*(1.0-smoothstep(-0.5,2.5,machineWorld.y-surfaceHeight(machineWorld.xz)));
      diffuseColor.rgb *= plateTone*(0.88+wearSample.r*0.14)-contactDirt;`,
    );
    shader.fragmentShader = shader.fragmentShader.replace(
      '#include <roughnessmap_fragment>',
      `#include <roughnessmap_fragment>
      roughnessFactor *= 0.88 + wearSample.g * 0.15;`,
    );
  };
  material.customProgramCacheKey = () => 'machine-uv-wear-v2';
  return material;
}
export function xrayMaterial(wireframe = false): MeshBasicMaterial {
  const material = new MeshBasicMaterial({
    color: new Color(PALETTE.xray),
    transparent: true,
    opacity: wireframe ? 0.24 : 0.22,
    stencilWrite: true,
    stencilWriteMask: 0,
    stencilRef: 1,
    stencilFunc: NotEqualStencilFunc,
    depthTest: false,
    depthWrite: false,
    wireframe,
    polygonOffset: true,
    polygonOffsetFactor: -1,
  });
  material.onBeforeCompile = (shader) => {
    shader.vertexShader =
      'varying vec3 undergroundWorld;\n' + shader.vertexShader;
    shader.vertexShader = shader.vertexShader.replace(
      '#include <project_vertex>',
      `vec4 underPosition = vec4(transformed,1.0);
      #ifdef USE_INSTANCING
      underPosition = instanceMatrix * underPosition;
      #endif
      undergroundWorld = (modelMatrix * underPosition).xyz;
      #include <project_vertex>`,
    );
    shader.fragmentShader =
      'varying vec3 undergroundWorld;\n' +
      terrainGLSL +
      '\n' +
      shader.fragmentShader;
    shader.fragmentShader = shader.fragmentShader.replace(
      '#include <clipping_planes_fragment>',
      `#include <clipping_planes_fragment>
      if (undergroundWorld.y > surfaceHeight(undergroundWorld.xz) - 0.035) discard;`,
    );
  };
  material.customProgramCacheKey = () => `terrain-xray-${wireframe}`;
  return material;
}
