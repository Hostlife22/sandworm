import type { Simulation } from '../../simulation/Simulation';
import { useDiagramAnimation } from '../hooks/useDiagramAnimation';
import { ringPoint, ringArc, ringPanel, DIAGRAM, path } from './geometry';

function animateRing(svg: SVGSVGElement, simulation: Simulation) {
  const roll = simulation.mechanismAngle * 0.24,
    yaw = 0.72 + Math.sin(simulation.mechanismAngle * 0.5) * 0.2;
  svg.querySelectorAll<SVGPathElement>('[data-ring-rim]').forEach((node) => {
    const depth = Number(node.dataset.depth),
      radius = Number(node.dataset.radius);
    node.setAttribute('d', ringArc(radius, depth, yaw));
  });
  svg.querySelectorAll<SVGGElement>('[data-ring-tile]').forEach((node, i) => {
    node
      .querySelector('[data-shell]')
      ?.setAttribute('d', ringPanel(i, yaw, roll));
    node
      .querySelector('[data-hatch]')
      ?.setAttribute('d', ringPanel(i, yaw, roll, 1));
    const a = ((i + 0.5) / DIAGRAM.ring.plates) * Math.PI * 2 + roll;
    const [x, y] = ringPoint(
      a,
      DIAGRAM.ring.radius,
      DIAGRAM.ring.depth / 2 + 1,
      yaw,
    );
    node.querySelector('circle')?.setAttribute('cx', String(x));
    node.querySelector('circle')?.setAttribute('cy', String(y));
  });
  svg.querySelectorAll<SVGPathElement>('[data-ring-rod]').forEach((node, i) => {
    const a = (i / 7) * Math.PI * 2 + roll;
    node.setAttribute(
      'd',
      path([ringPoint(a, 39, -16, yaw), ringPoint(a, 39, 16, yaw)]),
    );
  });
}
export function RingDiagram({ simulation }: { simulation: Simulation }) {
  const ref = useDiagramAnimation(simulation, animateRing);
  return (
    <div className="ring-detail">
      <svg
        ref={ref}
        viewBox="0 0 140 135"
        role="img"
        aria-label="Animated axonometric ring detail: armor, structural rims, actuators and service panels"
      >
        <g className="drawing" transform="rotate(-12 68 66)">
          {[
            [-14, 46],
            [-14, 38],
          ].map(([depth, radius], i) => (
            <path
              key={i}
              data-ring-rim=""
              data-depth={depth}
              data-radius={radius}
              className={i === 0 ? 'diagram-solid' : 'diagram-paper'}
            />
          ))}
          {Array.from({ length: 7 }, (_, i) => (
            <path key={i} data-ring-rod="" className="ring-actuator" />
          ))}
          {Array.from({ length: DIAGRAM.ring.plates }, (_, i) => (
            <g key={i} data-ring-tile={i}>
              <path data-shell="" className="diagram-paper" />
              <path
                data-hatch=""
                className={i % 3 === 0 ? 'diagram-metal' : 'diagram-paper'}
              />
              <circle r="1.2" className="diagram-metal" />
            </g>
          ))}
          {[
            [14, 46],
            [14, 43],
            [14, 38],
          ].map(([depth, radius], i) => (
            <path
              key={i}
              data-ring-rim=""
              data-depth={depth}
              data-radius={radius}
            />
          ))}
        </g>
        <g className="dimension">
          <path d="M18 14 38 30M112 18 96 39M125 111 102 97" />
          <text x="12" y="12">
            01
          </text>
          <text x="110" y="15">
            02
          </text>
          <text x="124" y="118">
            03
          </text>
        </g>
      </svg>
      <ol>
        {[
          'Flexible armor plate',
          'Structural ring',
          'Hydraulic actuator',
          'Linear drive piston',
          'Power / data bus',
          'Cooling channels',
          'Sensor node',
        ].map((label) => (
          <li key={label}>{label}</li>
        ))}
      </ol>
    </div>
  );
}
