import { useEffect, useRef, useMemo } from 'react';
import type { ReactNode } from 'react';
import type { Simulation } from '../simulation/Simulation';
import { Vector3 } from 'three';
import { mapPosition, OUTPOSTS } from '../simulation/Trajectory';
export function Panel({
  title,
  number,
  children,
  className = '',
}: {
  title: string;
  number: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={`panel ${className}`}>
      <h2>
        <span>{number}</span>
        {title}
        <i>↗</i>
      </h2>
      {children}
    </section>
  );
}
export function HeadDiagram({ simulation }: { simulation: Simulation }) {
  const spin = useRef<SVGGElement>(null);
  useEffect(() => {
    let frame = 0;
    const update = () => {
      spin.current?.setAttribute(
        'transform',
        `rotate(${(simulation.mechanismAngle * 180) / Math.PI} 110 108)`,
      );
      frame = requestAnimationFrame(update);
    };
    update();
    return () => cancelAnimationFrame(frame);
  }, [simulation]);
  return (
    <svg
      viewBox="0 0 220 242"
      role="img"
      aria-label="Head cross section: concentric excavation rings, 40 radial blades and 187 metre diameter"
    >
      <g className="diagram-grid">
        <path d="M110 3V215M6 108H214" />
        <circle cx="110" cy="108" r="98" strokeDasharray="2 4" />
      </g>
      <g className="drawing">
        {[91, 85, 74, 66, 37, 29, 16].map((r) => (
          <circle key={r} cx="110" cy="108" r={r} />
        ))}
        <g ref={spin}>
          {Array.from({ length: 40 }, (_, i) => (
            <g key={i} transform={`rotate(${i * 9} 110 108)`}>
              <path d="M108 70 106 39 113 39 112 70Z" />
              <path d="M107 23 107 18 113 18 113 23" />
              <circle cx="110" cy="33" r="1.4" />
              <path d="M109 75V68" />
            </g>
          ))}
        </g>
        <circle cx="110" cy="108" r="8" />
        <path d="m110 101 6 7-6 7-6-7Z" />
      </g>
      <g className="dimension">
        <path d="M17 220H203M17 216V224M63 218V222M110 216V224M156 218V222M203 216V224" />
        <text x="16" y="236">
          0
        </text>
        <text x="58" y="236">
          50
        </text>
        <text x="102" y="236">
          100
        </text>
        <text x="175" y="236">
          187 m
        </text>
      </g>
    </svg>
  );
}
export function RegionMap() {
  return (
    <svg
      viewBox="0 0 240 85"
      role="img"
      aria-label="Fictional region: operation zone in the southern erg"
    >
      <defs>
        <pattern
          id="mapgrid"
          width="16"
          height="16"
          patternUnits="userSpaceOnUse"
        >
          <path
            d="M16 0H0V16"
            fill="none"
            stroke="currentColor"
            strokeWidth="0.3"
          />
        </pattern>
      </defs>
      <rect width="240" height="85" fill="url(#mapgrid)" opacity="0.2" />
      <path
        d="m18 35 11-7 6-16 14 5 14-7 18 16 19-5 10 8 19-8 14 9 12-16 20 7 11-12 17 10-5 12 15 8-11 13-17 2-13-8-9 9-12-3-6 14-16 1-11-12-18 7-5-10-19 4-16-9-13 7-5-17-14 1Z"
        className="land"
      />
      <path d="m170 64 15-3 10 8-7 6-16-2Z" className="land" />
      <path
        d="M34 30 79 41 113 29 139 40 184 31M56 24 72 59M146 25 160 48"
        className="diagram-grid"
      />
      <circle cx="118" cy="48" r="9" className="zone" />
      <circle cx="118" cy="48" r="2" fill="currentColor" />
      <text x="135" y="64">
        SECTOR 07
      </text>
      <path d="M20 64V77m-3-9 3-4 3 4" className="drawing" />
    </svg>
  );
}
export function TerrainMap({ simulation }: { simulation: Simulation }) {
  const marker = useRef<SVGCircleElement>(null);
  const route = useMemo(() => {
    const point = new Vector3();
    return Array.from({ length: 97 }, (_, i) => {
      simulation.trajectory.sample(
        (i / 96) * simulation.trajectory.length,
        point,
      );
      const [x, y] = mapPosition(point.x, point.z);
      return `${i === 0 ? 'M' : 'L'}${x.toFixed(2)} ${y.toFixed(2)}`;
    }).join(' ');
  }, [simulation]);
  useEffect(() => {
    const timer = setInterval(() => {
      const s = simulation.segments[0];
      marker.current?.setAttribute(
        'cx',
        String(mapPosition(s.position.x, s.position.z)[0]),
      );
      marker.current?.setAttribute(
        'cy',
        String(mapPosition(s.position.x, s.position.z)[1]),
      );
    }, 100);
    return () => clearInterval(timer);
  }, [simulation]);
  return (
    <svg
      viewBox="0 0 250 155"
      role="img"
      aria-label="Surface map with machine position, survey route, contour lines and outposts"
    >
      <defs>
        <clipPath id="mapclip">
          <rect width="250" height="155" />
        </clipPath>
      </defs>
      <g clipPath="url(#mapclip)" className="contours">
        {Array.from({ length: 22 }, (_, i) => (
          <path
            key={i}
            d={`M${-100 + i * 18} -10 C${-40 + i * 11} 32,${-55 + i * 15} 49,${-8 + i * 12} 64 S${-12 + i * 13} 115,${-27 + i * 18} 169`}
          />
        ))}
        {Array.from({ length: 7 }, (_, i) => (
          <ellipse
            key={i}
            cx="206"
            cy="34"
            rx={9 + i * 7}
            ry={5 + i * 6}
            transform="rotate(-28 206 34)"
          />
        ))}
      </g>
      <path d={route} className="route" />
      {OUTPOSTS.map(([x, z], i) => {
        const [mx, my] = mapPosition(x, z);
        return (
          <g key={i} transform={`translate(${mx} ${my})`}>
            <path d="m-3 3 3-6 3 6Z" className="station" />
            <text x="6" y="2">
              AEI–0{i + 1}
            </text>
          </g>
        );
      })}
      <circle ref={marker} cx="163" cy="72" r="4" className="position-marker" />
      <text x="11" y="145">
        24°17′ N / 08°42′ E
      </text>
      <path d="M230 123V145m-3-17 3-5 3 5" className="drawing" />
    </svg>
  );
}
export function ProfileDiagram({ simulation }: { simulation: Simulation }) {
  const line = useRef<SVGPolylineElement>(null);
  useEffect(() => {
    const timer = setInterval(() => {
      line.current?.setAttribute(
        'points',
        [...simulation.segments]
          .reverse()
          .map((s, i) => `${24 + i * 15.1},${72 - s.position.y * 0.8}`)
          .join(' '),
      );
    }, 100);
    return () => clearInterval(timer);
  }, [simulation]);
  return (
    <svg
      viewBox="0 0 600 128"
      role="img"
      aria-label="Longitudinal sectional view: tail stabilizer, reactor modules, central drive and head excavation module"
    >
      <path
        d="M12 65Q85 58 150 66T290 63 430 64 585 58V97H12Z"
        className="earth"
      />
      <g className="drawing">
        {Array.from({ length: 36 }, (_, i) => {
          const h = 10 + 10 * Math.sin((i / 36) * 1.8);
          return (
            <g
              key={i}
              transform={`translate(${22 + i * 15.3} ${79 - Math.sin(i * 0.15) * 2})`}
            >
              <path
                d={`M0 ${-h / 2} 9 ${-h / 2 - 1} 9 ${h / 2 + 1} 0 ${h / 2}Z`}
              />
              <path
                d={`M2 ${-h / 2}V${h / 2}M7 ${-h / 2}V${h / 2}M9 -3H15M9 3H15`}
              />
            </g>
          );
        })}
        <path d="M10 76 3 73V83L10 80M576 63V91H586V63Z" />
      </g>
      <polyline ref={line} fill="none" className="telemetry-line" />
      <g className="dimension">
        <path d="M27 108H574M27 104V112M162 105V111M298 104V112M434 105V111M574 104V112" />
        <text x="24" y="123">
          0
        </text>
        <text x="150" y="123">
          325
        </text>
        <text x="286" y="123">
          650
        </text>
        <text x="420" y="123">
          975
        </text>
        <text x="543" y="123">
          1,312 m
        </text>
        <path d="M68 44V62M183 34V60M345 40V62M543 35V58" />
      </g>
      <text x="32" y="28">
        TAIL STABILIZER
      </text>
      <text x="154" y="20">
        REACTOR MODULES
      </text>
      <text x="304" y="26">
        CENTRAL LINEAR DRIVE
      </text>
      <text x="500" y="20">
        HEAD ASSEMBLY
      </text>
      <text x="154" y="31" className="faint">
        FUSION / THERMOELECTRIC
      </text>
    </svg>
  );
}
export function RingDiagram() {
  return (
    <div className="ring-detail">
      <svg
        viewBox="0 0 155 135"
        role="img"
        aria-label="Axonometric drawing of a ring with armor, structural ring, actuator and cooling channels"
      >
        <g className="drawing" transform="rotate(-19 73 67)">
          {[0, 18, 27].map((x) => (
            <g key={x}>
              <ellipse cx={62 + x} cy="68" rx="36" ry="53" />
              <ellipse cx={62 + x} cy="68" rx="29" ry="45" />
            </g>
          ))}
          {Array.from({ length: 14 }, (_, i) => {
            const a = (i / 14) * Math.PI * 2;
            const x = 62 + 36 * Math.cos(a),
              y = 68 + 53 * Math.sin(a);
            return (
              <g key={i}>
                <path d={`M${x} ${y}h27`} />
                <rect x={x + 7} y={y - 2} width="10" height="4" />
              </g>
            );
          })}
        </g>
        <g className="dimension">
          <path d="M23 18 45 35M125 25 106 49M133 104 109 95" />
          <text x="17" y="17">
            01
          </text>
          <text x="124" y="22">
            02
          </text>
          <text x="133" y="113">
            03
          </text>
        </g>
      </svg>
      <ol>
        <li>Flexible armor plate</li>
        <li>Structural ring</li>
        <li>Hydraulic actuator</li>
        <li>Linear drive piston</li>
        <li>Power / data bus</li>
        <li>Cooling channels</li>
      </ol>
    </div>
  );
}
export function CycleDiagram({ simulation }: { simulation: Simulation }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const timer = setInterval(() => {
      if (ref.current)
        ref.current.dataset.phase = String(
          Math.floor(simulation.cycleProgress * 4),
        );
    }, 100);
    return () => clearInterval(timer);
  }, [simulation]);
  return (
    <div ref={ref} className="cycle">
      {['EXTEND', 'ANCHOR', 'CONTRACT', 'ADVANCE'].map((label, i) => (
        <div key={label} data-step={i}>
          <span>0{i + 1}</span>
          <svg viewBox="0 0 175 24" aria-hidden="true">
            <path d="M0 16H175" className="diagram-grid" />
            <path
              d={`M15 15Q55 ${3 + i * 3} 90 13T160 ${10 - i * 2}`}
              className="cycle-body"
            />
            <path d="M5 5H28m-4-3 4 3-4 3" className="drawing" />
          </svg>
          <small>{label}</small>
        </div>
      ))}
    </div>
  );
}
