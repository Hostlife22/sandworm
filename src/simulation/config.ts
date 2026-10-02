export const CAMERAS = [
  'front',
  'side',
  'aerial',
  'chase',
  'outpost',
  'orbit',
] as const;
export type CameraMode = (typeof CAMERAS)[number];
export type MotionPhase =
  | 'Breaching'
  | 'Surface arc'
  | 'Surface plough'
  | 'Diving'
  | 'Subsurface traversal';
export const MACHINE = {
  name: 'SANDWORM',
  revision: 'MK-X',
  id: 'AEI–SNDWRM–MKX–001',
  subtitle: 'Subterranean terrain adaptive excavation unit',
  specifications: {
    Class: 'Mega-terrain engine',
    Length: '1,312 m',
    Diameter: '187 m',
    Mass: '8.7 × 10⁹ kg',
    Propulsion: 'Peristaltic linear drive',
    'Power plant': 'Fusion / thermoelectric',
    'Depth capability': '2.5 km+',
    Crew: 'None — autonomous',
  },
} as const;
export const RING_COUNT = 36;
export const RING_SPACING = 1.38;
export const DEMO_CUES: ReadonlyArray<{
  at: number;
  camera: CameraMode;
  xray: boolean;
}> = [
  { at: 0, camera: 'front', xray: false },
  { at: 8, camera: 'aerial', xray: false },
  { at: 13.8, camera: 'front', xray: false },
  { at: 18.3, camera: 'aerial', xray: false },
  { at: 20.3, camera: 'side', xray: false },
  { at: 23, camera: 'side', xray: true },
  { at: 30.8, camera: 'front', xray: true },
  { at: 34.5, camera: 'orbit', xray: true },
  { at: 41.3, camera: 'aerial', xray: true },
  { at: 46.5, camera: 'chase', xray: true },
  { at: 49, camera: 'orbit', xray: true },
  { at: 54, camera: 'side', xray: true },
  { at: 57.3, camera: 'aerial', xray: true },
  { at: 62.5, camera: 'front', xray: true },
  { at: 69, camera: 'front', xray: false },
  { at: 71.3, camera: 'chase', xray: false },
  { at: 76.8, camera: 'front', xray: false },
];
