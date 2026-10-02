import type { Simulation } from '../../simulation/Simulation';
import { useDiagramAnimation } from '../hooks/useDiagramAnimation';
import { useMemo } from 'react';
import { Vector3 } from 'three';
import { mapPosition } from '../../simulation/mapProjection';
import { OUTPOSTS } from '../../simulation/Trajectory';
import { terrainContours, mapBody, path } from './geometry';

function animateMap(svg: SVGSVGElement, simulation: Simulation) {
  const head = simulation.segments[0].position;
  const [x, y] = mapPosition(head.x, head.z);
  const marker = svg.querySelector('[data-map-head]');
  marker?.setAttribute(
    'transform',
    `translate(${x.toFixed(3)} ${y.toFixed(3)}) rotate(${((-simulation.heading * 180) / Math.PI).toFixed(3)})`,
  );
  svg.querySelector('[data-map-body]')?.setAttribute('d', mapBody(simulation));
  svg
    .querySelector('[data-map-pulse]')
    ?.setAttribute(
      'r',
      String(4 + Math.sin(simulation.cycleProgress * Math.PI * 2) * 1.2),
    );
}
export function TerrainMap({ simulation }: { simulation: Simulation }) {
  const ref = useDiagramAnimation(simulation, animateMap);
  const contours = useMemo(terrainContours, []);
  const route = useMemo(() => {
    const p = new Vector3();
    return path(
      Array.from({ length: 193 }, (_, i) => {
        simulation.trajectory.sample(
          (i / 192) * simulation.trajectory.length,
          p,
        );
        return mapPosition(p.x, p.z);
      }),
    );
  }, [simulation]);
  return (
    <svg
      ref={ref}
      viewBox="0 0 250 155"
      role="img"
      aria-label="Live topographic map: 10 metre contours, machine body, direction of travel, survey beacons and outposts"
    >
      <defs>
        <clipPath id="mapclip">
          <rect width="250" height="155" />
        </clipPath>
      </defs>
      <g clipPath="url(#mapclip)">
        <g className="contours">
          {contours.map((contour, i) => (
            <path
              key={i}
              d={contour.d}
              className={contour.major ? 'major-contour' : undefined}
            />
          ))}
        </g>
        <g className="map-grid">
          {[50, 100, 150, 200].map((x) => (
            <path key={x} d={`M${x} 0V155`} />
          ))}
          {[40, 80, 120].map((y) => (
            <path key={y} d={`M0 ${y}H250`} />
          ))}
        </g>
        <path d={route} className="route" />
        {Array.from({ length: 12 }, (_, i) => {
          const p = new Vector3();
          simulation.trajectory.sample(
            (i / 12) * simulation.trajectory.length,
            p,
          );
          const [x, y] = mapPosition(p.x, p.z);
          return (
            <circle
              key={i}
              cx={x + 6}
              cy={y - 5}
              r="1.7"
              className="survey-beacon"
            />
          );
        })}
        {OUTPOSTS.map(([x, z], i) => {
          const [mx, my] = mapPosition(x, z);
          return (
            <g key={i} transform={`translate(${mx} ${my})`}>
              <path d="m-3 3 3-6 3 6Z" className="station" />
              <text x="5" y="2" className="map-label">
                0{i + 1}
              </text>
            </g>
          );
        })}
        <path data-map-body="" className="map-machine" />
        <g data-map-head="">
          <circle data-map-pulse="" r="4" className="zone" />
          <path d="m4 0-6-2v4Z" className="map-direction" />
        </g>
      </g>
      <path d="M233 128V145m-3-12 3-5 3 5" className="drawing" />
      <text x="230" y="123">
        N
      </text>
    </svg>
  );
}
