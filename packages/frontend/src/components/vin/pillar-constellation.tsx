'use client';

import { motion } from 'framer-motion';
import { PillarNode } from './pillar-node';
import { polygonPoints } from '@/lib/pillar-geometry';
import type { PillarEvent } from '@gravity/shared';

const PILLAR_LABELS: Record<string, { label: string; letter: string }> = {
  short_trip_density: { label: 'Short Trips', letter: 'A' },
  ota_stress: { label: 'Software Updates', letter: 'B' },
  cold_soak: { label: 'Cold Weather', letter: 'C' },
  cranking_degradation: { label: 'Starting Health', letter: 'D' },
  hmi_reset: { label: 'Driver Reset', letter: 'E' },
  service_record: { label: 'Dealer Service', letter: 'F' },
  parts_purchase: { label: 'Parts Purchased', letter: 'G' },
  cohort_prior: { label: 'Fleet Pattern', letter: 'H' },
};

interface PillarConstellationProps {
  pillars: PillarEvent[];
  className?: string;
}

export function PillarConstellation({ pillars, className }: PillarConstellationProps) {
  const size = 280;
  const cx = size / 2;
  const cy = size / 2;
  const radius = 100;

  const pillarNames = [...new Set(pillars.map(p => p.pillar_name))];
  const nodeCount = Math.max(pillarNames.length, 5);
  const points = polygonPoints(nodeCount, radius, cx, cy);

  const latestStates: Record<string, PillarEvent> = {};
  for (const p of pillars) {
    if (!latestStates[p.pillar_name] || p.occurred_at > latestStates[p.pillar_name].occurred_at) {
      latestStates[p.pillar_name] = p;
    }
  }

  const pathD = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p[0]},${p[1]}`).join(' ') + ' Z';

  return (
    <div className={className}>
      <div className="text-[10px] font-semibold uppercase tracking-widest text-gravity-text-whisper mb-3">
        Evidence Constellation
      </div>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <motion.path
          d={pathD}
          fill="none"
          stroke="#1E2330"
          strokeWidth={1}
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 1, ease: 'easeInOut' }}
        />

        {points.map((p, i) => (
          <line key={`line-${i}`} x1={cx} y1={cy} x2={p[0]} y2={p[1]} stroke="#1E2330" strokeWidth={0.5} opacity={0.5} />
        ))}

        <circle cx={cx} cy={cy} r={3} fill="#6B7280" opacity={0.6} />

        {pillarNames.map((name, i) => {
          const point = points[i] || [cx, cy];
          const def = PILLAR_LABELS[name];
          const latest = latestStates[name];
          return (
            <PillarNode
              key={name}
              name={name}
              label={def?.letter ? `${def.letter} ${def.label}` : name}
              state={latest?.pillar_state || 'unknown'}
              x={point[0]}
              y={point[1]}
              color="#8B92A5"
            />
          );
        })}
      </svg>
    </div>
  );
}
