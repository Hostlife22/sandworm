import { useEffect, useMemo } from 'react';
import type { Simulation } from '../simulation/Simulation';
import { xrayMaterial } from './materials';
import { buildMachine } from './machine/buildMachine';
import { InstancedParts } from './machine/InstancedParts';

export function Machine({ simulation }: { simulation: Simulation }) {
  const resources = useMemo(buildMachine, []);
  const xray = useMemo(() => xrayMaterial(), []);
  useEffect(
    () => () => {
      resources.dispose();
      xray.dispose();
    },
    [resources, xray],
  );
  return (
    <group>
      {resources.batches.map((batch, i) => (
        <InstancedParts
          key={i}
          batch={batch}
          simulation={simulation}
          xray={xray}
        />
      ))}
    </group>
  );
}
