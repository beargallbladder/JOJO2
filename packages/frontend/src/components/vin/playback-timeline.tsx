'use client';

import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/cn';
import { riskColor } from '@/lib/risk-color';
import type { PosteriorSnapshot } from '@gravity/shared';

interface PlaybackTimelineProps {
  timeline: PosteriorSnapshot[];
  onFrameChange?: (frame: PosteriorSnapshot) => void;
}

export function PlaybackTimeline({ timeline, onFrameChange }: PlaybackTimelineProps) {
  const [activeFrame, setActiveFrame] = useState(timeline.length - 1);

  const width = 600;
  const height = 120;
  const padding = { top: 10, right: 20, bottom: 30, left: 20 };
  const plotW = width - padding.left - padding.right;
  const plotH = height - padding.top - padding.bottom;

  const paths = useMemo(() => {
    if (timeline.length < 2) return { p: '', c: '', s: '' };

    const xScale = (i: number) => padding.left + (i / (timeline.length - 1)) * plotW;
    const yScale = (v: number) => padding.top + (1 - v) * plotH;

    const makePath = (key: 'p_score' | 'c_score' | 's_score') =>
      timeline.map((f, i) => `${i === 0 ? 'M' : 'L'}${xScale(i).toFixed(1)},${yScale(f[key]).toFixed(1)}`).join(' ');

    return { p: makePath('p_score'), c: makePath('c_score'), s: makePath('s_score') };
  }, [timeline, plotW, plotH, padding]);

  const handleFrameClick = (index: number) => {
    setActiveFrame(index);
    if (onFrameChange && timeline[index]) {
      onFrameChange(timeline[index]);
    }
  };

  const xPos = (i: number) => padding.left + (i / Math.max(timeline.length - 1, 1)) * plotW;

  return (
    <div>
      <div className="text-[10px] font-semibold uppercase tracking-widest text-gravity-text-whisper mb-3">
        Posterior Timeline
      </div>
      <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className="w-full">
        {/* Grid lines */}
        {[0, 0.25, 0.5, 0.75, 1].map(v => (
          <line key={v} x1={padding.left} y1={padding.top + (1 - v) * plotH} x2={padding.left + plotW} y2={padding.top + (1 - v) * plotH} stroke="#1E2330" strokeWidth={0.5} />
        ))}

        {/* P line */}
        <motion.path
          d={paths.p}
          fill="none"
          stroke={riskColor(timeline[activeFrame]?.p_score || 0)}
          strokeWidth={2}
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 1.2, ease: 'easeOut' }}
        />

        {/* C line */}
        <motion.path
          d={paths.c}
          fill="none"
          stroke="#A78BFA"
          strokeWidth={1.5}
          opacity={0.6}
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 1.2, ease: 'easeOut', delay: 0.1 }}
        />

        {/* S line */}
        <motion.path
          d={paths.s}
          fill="none"
          stroke="#2DD4BF"
          strokeWidth={1.5}
          opacity={0.6}
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 1.2, ease: 'easeOut', delay: 0.2 }}
        />

        {/* Playhead */}
        {timeline.length > 0 && (
          <motion.line
            x1={xPos(activeFrame)}
            y1={padding.top}
            x2={xPos(activeFrame)}
            y2={padding.top + plotH}
            stroke="#F0F2F5"
            strokeWidth={1}
            opacity={0.3}
            animate={{ x1: xPos(activeFrame), x2: xPos(activeFrame) }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          />
        )}

        {/* Clickable frame dots */}
        {timeline.map((f, i) => (
          <circle
            key={i}
            cx={xPos(i)}
            cy={height - 12}
            r={i === activeFrame ? 4 : 2}
            fill={i === activeFrame ? '#F0F2F5' : '#4A5168'}
            className="cursor-pointer"
            onClick={() => handleFrameClick(i)}
          />
        ))}

        {/* Legend */}
        <text x={padding.left} y={height - 2} fill="#4A5168" className="text-[8px] font-mono">
          {timeline[0]?.computed_at ? new Date(timeline[0].computed_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : ''}
        </text>
        <text x={padding.left + plotW} y={height - 2} fill="#4A5168" className="text-[8px] font-mono" textAnchor="end">
          {timeline[timeline.length - 1]?.computed_at ? new Date(timeline[timeline.length - 1].computed_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : ''}
        </text>
      </svg>

      {/* Score legend */}
      <div className="flex gap-4 mt-2">
        <span className="flex items-center gap-1.5 text-[10px] text-gravity-text-whisper">
          <span className="w-3 h-0.5 rounded" style={{ backgroundColor: riskColor(timeline[activeFrame]?.p_score || 0) }} /> P-Score
        </span>
        <span className="flex items-center gap-1.5 text-[10px] text-gravity-text-whisper">
          <span className="w-3 h-0.5 rounded bg-score-c" /> Confidence
        </span>
        <span className="flex items-center gap-1.5 text-[10px] text-gravity-text-whisper">
          <span className="w-3 h-0.5 rounded bg-score-s" /> Severity
        </span>
      </div>
    </div>
  );
}
