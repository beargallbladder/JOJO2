'use client';

import { motion } from 'framer-motion';
import { cn } from '@/lib/cn';

interface PillarNodeProps {
  name: string;
  label: string;
  state: 'present' | 'absent' | 'unknown';
  x: number;
  y: number;
  color: string;
}

const stateColors = {
  present: '#22C55E',
  absent: '#EF4444',
  unknown: '#4A5168',
};

export function PillarNode({ name, label, state, x, y, color }: PillarNodeProps) {
  const fill = stateColors[state];

  return (
    <g>
      {/* Ripple on present */}
      {state === 'present' && (
        <motion.circle
          cx={x} cy={y} r={14}
          fill="none"
          stroke={fill}
          strokeWidth={1}
          initial={{ r: 8, opacity: 0.6 }}
          animate={{ r: 20, opacity: 0 }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeOut' }}
        />
      )}

      {/* Pulse on absent */}
      {state === 'absent' && (
        <motion.circle
          cx={x} cy={y} r={10}
          fill={fill}
          opacity={0.15}
          animate={{ r: [10, 14, 10], opacity: [0.15, 0.05, 0.15] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        />
      )}

      {/* Main node */}
      <motion.circle
        cx={x} cy={y} r={8}
        fill={fill}
        stroke={fill}
        strokeWidth={state === 'present' ? 2 : 1}
        opacity={state === 'unknown' ? 0.4 : 1}
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', stiffness: 300, damping: 20, delay: 0.1 }}
      />

      {/* Inner dot */}
      <circle cx={x} cy={y} r={3} fill={state === 'present' ? '#fff' : 'transparent'} opacity={0.8} />

      {/* Label */}
      <text
        x={x}
        y={y + 22}
        textAnchor="middle"
        className="text-[9px] font-semibold uppercase tracking-wider"
        fill={state === 'unknown' ? '#4A5168' : '#8B92A5'}
      >
        {label}
      </text>
    </g>
  );
}
