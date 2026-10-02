import { ARMOR_SECTOR_COUNT } from '../simulation/config';
import {
  BoxGeometry,
  CylinderGeometry,
  ExtrudeGeometry,
  Shape,
  TorusGeometry,
} from 'three';
// A bevelled annular armor tile. Local z is the machine's longitudinal axis.
export function armorTile() {
  const shape = new Shape();
  const half = (Math.PI / ARMOR_SECTOR_COUNT) * 0.94;
  shape.absarc(0, 0, 1, -half, half, false);
  shape.absarc(0, 0, 0.92, half, -half, true);
  shape.closePath();
  const geometry = new ExtrudeGeometry(shape, {
    depth: 0.82,
    bevelEnabled: true,
    bevelSegments: 1,
    steps: 1,
    bevelSize: 0.012,
    bevelThickness: 0.025,
    curveSegments: 3,
  });
  geometry.translate(0, 0, -0.41);
  return geometry;
}
export function createGeometries() {
  const cylinder = new CylinderGeometry(1, 1, 1, 8);
  cylinder.rotateX(Math.PI / 2);
  return {
    tile: armorTile(),
    rim: new TorusGeometry(1, 0.032, 5, 64),
    core: new TorusGeometry(0.85, 0.08, 5, 48),
    box: new BoxGeometry(1, 1, 1),
    bolt: cylinder,
    lip: new TorusGeometry(1, 0.08, 7, 80),
  };
}
