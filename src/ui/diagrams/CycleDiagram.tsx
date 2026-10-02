import type { Simulation } from '../../simulation/Simulation';
import { useDiagramAnimation } from '../hooks/useDiagramAnimation';
import { cyclePose, DIAGRAM } from './geometry';

function animateCycle(root: HTMLDivElement, simulation: Simulation) {
  root.dataset.phase = String(Math.floor(simulation.cycleProgress * 4));
  root.querySelectorAll<SVGSVGElement>('svg').forEach((svg, row) => {
    const poses = cyclePose(simulation.cycleProgress, row);
    svg
      .querySelectorAll<SVGGElement>('[data-cycle-ring]')
      .forEach((node, i) => {
        const p = poses[i];
        node.setAttribute(
          'transform',
          `translate(${p.x.toFixed(3)} ${p.y.toFixed(3)}) rotate(${p.angle.toFixed(3)}) scale(1 ${p.height.toFixed(3)})`,
        );
      });
    const phase = (simulation.cycleProgress + row / 4) * Math.PI * 2;
    svg
      .querySelector('[data-cycle-arrow]')
      ?.setAttribute(
        'transform',
        `translate(${(Math.sin(phase) * 8).toFixed(3)} 0)`,
      );
  });
}
export function CycleDiagram({ simulation }: { simulation: Simulation }) {
  const ref = useDiagramAnimation(simulation, animateCycle);
  return (
    <div ref={ref} className="cycle">
      {['EXTEND', 'ANCHOR', 'CONTRACT', 'ADVANCE'].map((label, i) => (
        <div key={label} data-step={i}>
          <span>{i + 1}</span>
          <svg
            viewBox="0 0 210 32"
            role="img"
            aria-label={`${label}: peristaltic segment motion`}
          >
            <defs>
              <pattern
                id={`cycle-hatch-${i}`}
                width="3"
                height="3"
                patternUnits="userSpaceOnUse"
                patternTransform="rotate(30)"
              >
                <path d="M0 0V3" className="hatching" />
              </pattern>
            </defs>
            <path d="M3 19H207V29H3Z" className="earth" />
            <path d="M3 19H207V29H3Z" fill={`url(#cycle-hatch-${i})`} />
            <path d="M3 19H207" className="dimension" />
            <g className="drawing">
              {Array.from({ length: DIAGRAM.cycle.rings }, (_, j) => (
                <g key={j} data-cycle-ring={j}>
                  <path d="M-1.8-1H1.8V1H-1.8Z" className="diagram-paper" />
                  <path d="M-1 0H1M1.8-0.7H2.4M1.8 0.7H2.4" />
                </g>
              ))}
              <g data-cycle-arrow="">
                <path
                  d={i < 2 ? 'M20 14H47m-4-2 4 2-4 2' : 'M47 14H20m4-2-4 2 4 2'}
                />
              </g>
            </g>
            <text x="10" y="8" className="cycle-label">
              {label}
            </text>
          </svg>
        </div>
      ))}
    </div>
  );
}
