'use client';

import { motion } from 'framer-motion';
import { PillarNode } from './pillar-node';
import { polygonPoints } from '@/lib/pillar-geometry';
import { PILLARS, type PillarName } from '@gravity/shared';
import type { PillarEvent } from '@gravity/shared';

interface PillarConstellationProps {
  pillars: PillarEvent[];
  className?: string;
}

export function PillarConstellation({ pillars, className }: PillarConstellationProps) {
  const size = 280;
  const cx = size / 2;
  const cy = size / 2;
  const radius = 100;

  // Get unique pillar names from events
  const pillarNames = [...new Set(pillars.map(p => p.pillar_name))] as PillarName[];
  const nodeCount = Math.max(pillarNames.length, 5);
  const points = polygonPoints(nodeCount, radius, cx, cy);

  // Get latest state for each pillar
  const latestStates: Record<string, PillarEvent> = {};
  for (const p of pillars) {
    if (!latestStates[p.pillar_name] || p.occurred_at > latestStates[p.pillar_name].occurred_at) {
      latestStates[p.pillar_name] = p;
    }
  }

  // Build polygon path
  const pathD = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p[0]},${p[1]}`).join(' ') + ' Z';

  return (
    <div className={className}>
      <div className="text-[10px] font-semibold uppercase tracking-widest text-gravity-text-whisper mb-3">
        Pillar Constellation
      </div>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {/* Background polygon */}
        <motion.path
          d={pathD}
          fill="none"
          stroke="#1E2330"
          strokeWidth={1}
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 1, ease: 'easeInOut' }}
        />

        {/* Connection lines from center */}
        {points.map((p, i) => (
          <line key={`line-${i}`} x1={cx} y1={cy} x2={p[0]} y2={p[1]} stroke="#1E2330" strokeWidth={0.5} opacity={0.5} />
        ))}

        {/* Center dot */}
        <circle cx={cx} cy={cy} r={3} fill="#3B82F6" opacity={0.6} />

        {/* Pillar nodes */}
        {pillarNames.map((name, i) => {
          const point = points[i] || [cx, cy];
          const pillarDef = PILLARS[name as keyof typeof PILLARS];
          const latest = latestStates[name];
          return (
            <PillarNode
              key={name}
              name={name}
              label={pillarDef?.label || name}
              state={latest?.pillar_state || 'unknown'}
              x={point[0]}
              y={point[1]}
              color={pillarDef?.color || '#8B92A5'}
            />
          );
        })}
      </svg>
    </div>
  );
}
