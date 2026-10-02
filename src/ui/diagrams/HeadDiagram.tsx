import type { Simulation } from '../../simulation/Simulation';
import { useDiagramAnimation } from '../hooks/useDiagramAnimation';
import { DIAGRAM } from './geometry';

function rotate(node: Element | null, angle: number, x = 110, y = 108) {
  node?.setAttribute('transform', `rotate(${angle.toFixed(3)} ${x} ${y})`);
}
function animateHead(svg: SVGSVGElement, simulation: Simulation) {
  const angle = (simulation.mechanismAngle * 180) / Math.PI;
  rotate(svg.querySelector('[data-head-rotor]'), angle);
  rotate(svg.querySelector('[data-head-auger]'), -angle * 1.5);
  rotate(svg.querySelector('[data-head-index]'), angle);
}
export function HeadDiagram({ simulation }: { simulation: Simulation }) {
  const ref = useDiagramAnimation(simulation, animateHead);
  return (
    <svg
      ref={ref}
      viewBox="0 0 220 250"
      role="img"
      className="head-drawing"
      aria-label="Animated head cross section: drill blades, hammer ring, intake auger and 187 metre diameter"
    >
      <defs>
        <pattern
          id="head-hatch"
          width="3"
          height="3"
          patternUnits="userSpaceOnUse"
          patternTransform="rotate(35)"
        >
          <path d="M0 0V3" className="hatching" />
        </pattern>
      </defs>
      <g className="diagram-grid">
        <path d="M110 3V213M7 108H213" strokeDasharray="4 2 1 2" />
        <circle cx="110" cy="108" r="101" strokeDasharray="1 3" />
      </g>
      <g className="drawing">
        <circle cx="110" cy="108" r="97" />
        {Array.from({ length: 48 }, (_, i) => (
          <g key={i} transform={`rotate(${i * 7.5} 110 108)`}>
            <path d="M108 9V13H112V9M110 15V19" />
            <circle cx="110" cy="12" r="1.1" className="diagram-metal" />
          </g>
        ))}
        <circle cx="110" cy="108" r="82" className="diagram-solid" />
        <circle cx="110" cy="108" r="78" className="diagram-paper" />
        <circle cx="110" cy="108" r="73" fill="url(#head-hatch)" />
        {Array.from({ length: 40 }, (_, i) => (
          <g key={i} transform={`rotate(${i * 9} 110 108)`}>
            <path d="M107 30H113V34H107Z" className="diagram-metal" />
            <path d="M109 26V29" />
          </g>
        ))}
        <g data-head-rotor="">
          {Array.from({ length: DIAGRAM.head.blades }, (_, i) => (
            <g
              key={i}
              transform={`rotate(${(i * 360) / DIAGRAM.head.blades} 110 108)`}
            >
              <path
                d="M108 73 105 40Q110 37 115 40L112 73Z"
                className={i % 5 === 0 ? 'diagram-metal' : 'diagram-paper'}
              />
              <path d="M108 43 109 66M112 44 111 68M108 59H112M107 51H113" />
              <circle cx="110" cy="44" r="1.8" className="diagram-solid" />
              <circle cx="110" cy="44" r="0.65" className="diagram-paper" />
              <path d="M108 72H112V79H108Z" className="diagram-metal" />
            </g>
          ))}
        </g>
        <circle cx="110" cy="108" r="30" className="diagram-metal" />
        <circle cx="110" cy="108" r="25" className="diagram-paper" />
        <g data-head-auger="">
          <path
            d="M110 108c-2-5 5-9 10-5 8 8-2 19-13 13-14-9-4-29 12-25"
            className="auger"
          />
          <path d="M110 108c-6 0-8 7-3 11" />
          <circle cx="110" cy="108" r="4" className="diagram-solid" />
        </g>
      </g>
      <g data-head-index="" className="head-index">
        <path d="M25 47A105 105 0 0 1 62 15" />
        <path d="m62 15-7 1 4 5Z" className="station" />
        <path d="M180 187A105 105 0 0 1 148 206" className="index-band" />
      </g>
      <g className="dimension">
        <path d="M13 233H207" />
        {Array.from({ length: 17 }, (_, i) => (
          <path
            key={i}
            d={`M${13 + i * 12.125} ${i % 4 === 0 ? 229 : 231}v${i % 4 === 0 ? 8 : 4}`}
          />
        ))}
        {['0', '50', '100', '150', '187 m'].map((label, i) => (
          <text
            key={label}
            x={13 + i * 48.5}
            y="226"
            textAnchor={i === 4 ? 'end' : 'start'}
          >
            {label}
          </text>
        ))}
      </g>
    </svg>
  );
}
