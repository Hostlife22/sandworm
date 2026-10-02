import {
  Color,
  MeshStandardMaterial,
  MeshBasicMaterial,
  AlwaysStencilFunc,
  NotEqualStencilFunc,
  ReplaceStencilOp,
} from 'three';
import { terrainGLSL } from '../simulation/terrain';
export const PALETTE = {
  background: '#ece9dd',
  sand: '#d7c9aa',
  armor: '#c9c4b0',
  edge: '#e0dcca',
  dark: '#333731',
  steel: '#74766c',
  bronze: '#99815a',
  xray: '#7aafad',
} as const;
export function machineMaterial(
  color: string,
  metalness: number,
  roughness: number,
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
    shader.vertexShader = 'varying vec3 machineWorld;\n' + shader.vertexShader;
    shader.vertexShader = shader.vertexShader.replace(
      '#include <project_vertex>',
      `vec4 machinePosition = vec4(transformed, 1.0);
      #ifdef USE_INSTANCING
      machinePosition = instanceMatrix * machinePosition;
      #endif
      machineWorld = (modelMatrix * machinePosition).xyz;
      #include <project_vertex>`,
    );
    shader.fragmentShader =
      'varying vec3 machineWorld;\n' +
      terrainGLSL +
      '\n' +
      shader.fragmentShader;
    shader.fragmentShader = shader.fragmentShader.replace(
      '#include <color_fragment>',
      `#include <color_fragment>
      float dirt = 0.08*sin(machineWorld.x*17.0)*sin(machineWorld.z*29.0);
      float contactDirt = 0.16*(1.0-smoothstep(0.0, 2.5, machineWorld.y-surfaceHeight(machineWorld.xz)));
      diffuseColor.rgb *= 1.0-dirt-contactDirt;`,
    );
  };
  material.customProgramCacheKey = () => 'machine-dirt-v1';
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
