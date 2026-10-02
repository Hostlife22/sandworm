import { useEffect, useRef } from 'react';
import { MACHINE } from '../simulation/config';
import type { Simulation } from '../simulation/Simulation';
import {
  CycleDiagram,
  HeadDiagram,
  Panel,
  ProfileDiagram,
  RegionMap,
  RingDiagram,
  TerrainMap,
} from './Diagrams';
export function Atlas({ simulation }: { simulation: Simulation }) {
  const live = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const timer = setInterval(() => {
      if (live.current)
        live.current.textContent = `${String(Math.floor(simulation.poseTime)).padStart(4, '0')} s / ${Math.round((simulation.travelDistance * 187) / 7)} m TRAVEL / ${simulation.submergedCount.toString().padStart(2, '0')} BELOW DATUM`;
    }, 100);
    return () => clearInterval(timer);
  }, [simulation]);
  return (
    <div className="atlas">
      <aside className="specifications">
        <div className="eyebrow">
          FIELD ENGINEERING ATLAS <span>VOL. 07 / 2194</span>
        </div>
        <h1>
          {MACHINE.name} <em>{MACHINE.revision}</em>
        </h1>
        <p className="subtitle">{MACHINE.subtitle}</p>
        <div className="title-rule">
          <span>01 — MACHINE OVERVIEW</span>
          <span>CLASS IV</span>
        </div>
        <dl>
          {Object.entries(MACHINE.specifications).map(([label, value]) => (
            <div key={label}>
              <dt>{label}</dt>
              <dd>{value}</dd>
            </div>
          ))}
        </dl>
        <div className="region">
          <RegionMap />
          <div>
            <i />
            PRIMARY DEPLOYMENT ZONE <span>ERG–07</span>
          </div>
        </div>
        <p className="fiction">CONCEPT STUDY · FICTIONAL SPECIFICATIONS</p>
      </aside>
      <Panel
        title="Head section — cross view"
        number="02"
        className="head-panel"
      >
        <HeadDiagram simulation={simulation} />
        <div className="systems">
          <h3>HEAD SYSTEMS</h3>
          <ul>
            {[
              'Rotary drill assembly',
              'Percussive hammer ring',
              'Displacement blades (×40)',
              'Intake auger cone',
              'Debris transport conduit',
              'Terrain sensor array',
              'Thermal management ducts',
            ].map((s, i) => (
              <li key={s}>
                <span>{String(i + 1).padStart(2, '0')}</span>
                {s}
              </li>
            ))}
          </ul>
          <div className="system-status">
            <i /> CORE SYSTEMS NOMINAL <span>99.8%</span>
          </div>
        </div>
      </Panel>
      <Panel
        title="Terrain schematic — surface map"
        number="03"
        className="terrain-panel"
      >
        <TerrainMap simulation={simulation} />
        <div className="map-legend">
          <span>△ AEI OUTPOST</span>
          <span>○ SURVEY BEACON</span>
          <span>┄ MACHINE ROUTE</span>
          <span>● LIVE POSITION</span>
        </div>
      </Panel>
      <div className="scene-caption">
        <span>PLATE 004 / AUTONOMOUS EXCAVATION SYSTEMS</span>
        <span ref={live}>0000 s / SURFACE DATUM</span>
      </div>
      <div className="bottom-panels">
        <Panel
          title="Sectional view — subsurface profile"
          number="04"
          className="profile-panel"
        >
          <ProfileDiagram simulation={simulation} />
        </Panel>
        <Panel title="Segment detail — typical ring" number="05">
          <RingDiagram />
        </Panel>
        <Panel title="Locomotion cycle" number="06">
          <CycleDiagram simulation={simulation} />
        </Panel>
      </div>
    </div>
  );
}
