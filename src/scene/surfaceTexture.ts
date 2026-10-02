import {
  DataTexture,
  LinearFilter,
  LinearMipmapLinearFilter,
  RepeatWrapping,
  RGBAFormat,
} from 'three';
import { random } from '../simulation/terrain';

const SIZE = 256;
// Small, seeded surface variation. UV mapping keeps wear attached to moving plates.
export function createWearTexture(): DataTexture {
  const pixels = new Uint8Array(SIZE * SIZE * 4);
  for (let y = 0; y < SIZE; y++)
    for (let x = 0; x < SIZE; x++) {
      const i = (y * SIZE + x) * 4;
      const grain = random(y * SIZE + x + 419) - 0.5;
      const mottling =
        Math.sin(x * 0.047) * Math.sin(y * 0.063) +
        Math.sin(x * 0.19 + y * 0.09) * 0.35;
      pixels[i] = 215 + mottling * 9 + grain * 16;
      pixels[i + 1] = 217 + grain * 24;
      pixels[i + 2] = 255;
      pixels[i + 3] = 255;
    }
  for (let mark = 0; mark < 75; mark++) {
    const x = Math.floor(random(mark + 17) * SIZE),
      y = Math.floor(random(mark + 397) * SIZE);
    const length = 2 + Math.floor(random(mark + 69) * 22);
    for (let k = 0; k < length; k++) {
      const index =
        (((y + Math.floor(k * 0.08)) % SIZE) * SIZE + ((x + k) % SIZE)) * 4;
      pixels[index] = Math.min(
        pixels[index],
        155 + Math.floor(random(mark + 7) * 35),
      );
      pixels[index + 1] = 239;
    }
  }
  const texture = new DataTexture(pixels, SIZE, SIZE, RGBAFormat);
  texture.wrapS = texture.wrapT = RepeatWrapping;
  texture.magFilter = LinearFilter;
  texture.minFilter = LinearMipmapLinearFilter;
  texture.generateMipmaps = true;
  texture.needsUpdate = true;
  return texture;
}
