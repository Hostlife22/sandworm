import { random } from '../../simulation/terrain';
import { coast, island } from './geometry';

const MAINLAND = coast(
  [
    [14, 35],
    [29, 30],
    [30, 19],
    [43, 26],
    [55, 22],
    [61, 31],
    [76, 27],
    [91, 32],
    [109, 28],
    [121, 35],
    [132, 25],
    [149, 26],
    [158, 18],
    [173, 24],
    [183, 17],
    [192, 25],
    [207, 22],
    [218, 32],
    [212, 42],
    [223, 47],
    [213, 58],
    [197, 61],
    [188, 55],
    [177, 65],
    [162, 57],
    [153, 63],
    [140, 56],
    [133, 65],
    [124, 61],
    [117, 72],
    [102, 70],
    [94, 62],
    [80, 69],
    [69, 64],
    [61, 69],
    [52, 58],
    [43, 54],
    [45, 45],
    [32, 43],
    [26, 38],
  ],
  42,
);
export function RegionMap() {
  return (
    <svg
      viewBox="0 0 240 102"
      role="img"
      className="region-drawing"
      aria-label="Fictional regional map: coastlines, islands, highlands and primary deployment zone"
    >
      <defs>
        <clipPath id="region-land">
          <path d={MAINLAND} />
        </clipPath>
      </defs>
      <g className="diagram-grid" opacity="0.3">
        {[38, 76, 114, 152, 190, 228].map((x) => (
          <path key={x} d={`M${x} 10V90`} />
        ))}
        {[25, 50, 75].map((y) => (
          <path key={y} d={`M8 ${y}H234`} />
        ))}
      </g>
      <path d={MAINLAND} className="land" />
      {[
        [151, 78, 18, 10],
        [213, 80, 13, 5],
        [231, 48, 5, 3],
        [226, 26, 4, 3],
        [62, 79, 4, 6],
        [37, 59, 4, 5],
        [95, 82, 4, 3],
        [48, 74, 3, 4],
      ].map(([x, y, rx, ry], i) => (
        <path key={i} d={island(x, y, rx, ry, i * 51)} className="land" />
      ))}
      <g clipPath="url(#region-land)">
        {Array.from({ length: 170 }, (_, i) => {
          const x = 15 + random(i + 400) * 210,
            y = 17 + random(i + 900) * 62;
          return (
            <path
              key={i}
              d={`m${x} ${y} 1-1.8 1.4 2.5m-1.4-2.5-1.5 0.6`}
              className="highland"
            />
          );
        })}
        {Array.from({ length: 23 }, (_, i) => (
          <path
            key={i}
            d={island(
              29 + random(i + 61) * 176,
              30 + random(i + 321) * 31,
              1.4 + random(i + 11) * 3,
              1 + random(i + 54) * 2,
              i + 92,
            )}
            className="map-lake"
          />
        ))}
        <path
          d="M52 35Q81 49 119 41T199 35M63 63Q117 49 168 54"
          className="survey-line"
        />
      </g>
      <text x="53" y="23" className="map-label">
        NORTHERN ERG
      </text>
      <text x="167" y="13" className="map-label">
        PLATE 219
      </text>
      <circle cx="53" cy="33" r="6" className="zone" />
      <circle cx="53" cy="33" r="1.8" className="station" />
      <path d="M53 27V39M47 33H59" className="dimension" />
      <g className="drawing" transform="translate(16 79)">
        <circle r="5" />
        <path d="M0 -10V10m0-10-2 5 2-14 2 14Z" />
      </g>
    </svg>
  );
}
