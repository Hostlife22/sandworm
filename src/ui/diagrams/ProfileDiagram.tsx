import type { Simulation } from '../../simulation/Simulation';
import { useDiagramAnimation } from '../hooks/useDiagramAnimation';
import { profilePose, path } from './geometry';

function animateProfile(svg: SVGSVGElement, simulation: Simulation) {
  const points = profilePose(simulation);
  svg
    .querySelectorAll<SVGGElement>('[data-profile-ring]')
    .forEach((node, i) => {
      const p = points[i],
        q = points[Math.max(0, i - 1)],
        r = points[Math.min(points.length - 1, i + 1)];
      const angle = (Math.atan2(q.y - r.y, q.x - r.x) * 180) / Math.PI;
      node.setAttribute(
        'transform',
        `translate(${p.x.toFixed(3)} ${p.y.toFixed(3)}) rotate(${angle.toFixed(3)}) scale(1.4 ${(p.radius / 10).toFixed(3)})`,
      );
    });
  const ground = points
    .slice()
    .reverse()
    .map((p) => [p.x, p.ground] as const);
  svg
    .querySelector('[data-profile-earth]')
    ?.setAttribute(
      'd',
      path([[8, 78], ...ground, [892, 78], [892, 111], [8, 111]], true),
    );
  svg
    .querySelector('[data-profile-links]')
    ?.setAttribute('d', path(points.map((p) => [p.x, p.y])));
}
function SectionGlyph({
  head = false,
  tail = false,
}: {
  head?: boolean;
  tail?: boolean;
}) {
  return (
    <>
      <path d="M-7-8H7V8H-7Z" className="diagram-solid" />
      <path d="M-6-10 4-10 6-8V8L4 10H-6Z" className="diagram-paper" />
      <path d="M-4-9V9M3-9V9M-7-3H7M-7 3H7M-4-6H3M-4 6H3M-4-1H3V1H-4Z" />
      <path d="M-7-7H-10M-7 7H-10M6-7H10M6 7H10" />
      {[-7, -4, 4, 7].map((y) => (
        <path key={y} d={`M-2 ${y}h3m-2-0.7v1.4`} className="fine-detail" />
      ))}
      <path d="M-6-8h2v3h-2Zm0 13h2v3h-2Z" className="diagram-metal" />
      {head && (
        <>
          <path d="M7-12H12V12H7ZM12-10H16V10H12Z" className="diagram-paper" />
          {[-8, -4, 0, 4, 8].map((y) => (
            <path key={y} d={`M12 ${y}h4`} />
          ))}
        </>
      )}
      {tail && (
        <path
          d="M-7-5-22-10-24-7-8-1M-7 5-22 10-24 7-8 1"
          className="diagram-paper"
        />
      )}
    </>
  );
}
export function ProfileDiagram({ simulation }: { simulation: Simulation }) {
  const ref = useDiagramAnimation(simulation, animateProfile);
  return (
    <svg
      ref={ref}
      viewBox="0 0 900 145"
      role="img"
      aria-label="Animated longitudinal section: articulated rings, tail stabilizer, reactor modules, linear drive and excavation head"
    >
      <defs>
        <pattern
          id="section-soil"
          width="7"
          height="5"
          patternUnits="userSpaceOnUse"
        >
          <path d="M1 1h0.7M4 3h0.6" className="soil-grain" />
        </pattern>
      </defs>
      <path data-profile-earth="" className="earth" />
      <path d="M8 104H892V112H8Z" fill="url(#section-soil)" />
      <path d="M8 78H892" className="datum-line" />
      <g className="drawing profile-machine">
        <path data-profile-links="" className="profile-drive" />
        {simulation.segments.map((_, i) => (
          <g key={i} data-profile-ring={i}>
            <SectionGlyph head={i === 0} tail={i === 35} />
          </g>
        ))}
      </g>
      <g className="dimension">
        <path d="M42 126H862M42 122V130M247 123V129M452 122V130M657 123V129M862 122V130M42 126H124" />
        {['0', '325', '650', '975', '1,312 m'].map((v, i) => (
          <text
            key={v}
            x={42 + i * 205}
            y="139"
            textAnchor={i === 4 ? 'end' : 'start'}
          >
            {v}
          </text>
        ))}
        <path d="M80 48V64M290 49V62M540 48V62M815 49V61" />
      </g>
      {[
        [58, 'TAIL STABILIZER', 'ANCHOR & TRACTION', 'CONTROL'],
        [
          233,
          'POWER & REACTOR MODULES',
          'FUSION CORE / POWER DISTRIBUTION',
          'THERMAL MANAGEMENT',
        ],
        [
          490,
          'CENTRAL ACTUATION ASSEMBLY',
          'PERISTALTIC DRIVE / SEGMENT EXTENSION',
          'TERRAIN ADAPTATION',
        ],
        [
          740,
          'HEAD EXCAVATION MODULE',
          'DRILL / HAMMER / DISPLACEMENT',
          'DEBRIS TRANSPORT',
        ],
      ].map(([x, title, sub, detail]) => (
        <g key={title} transform={`translate(${x} 29)`}>
          <text className="diagram-title">{title}</text>
          <text y="9" className="faint">
            {sub}
          </text>
          <text y="16" className="faint">
            {detail}
          </text>
        </g>
      ))}
    </svg>
  );
}
