'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { cn } from '@/lib/cn';
import { riskColor, riskBandClass, riskBorderClass } from '@/lib/risk-color';
import { formatPScore, formatVinCode, formatRelative } from '@/lib/format';
import { springs } from '@/lib/motion';
import type { Vin } from '@gravity/shared';

interface LeadRowProps {
  vin: Vin;
  index: number;
}

export function LeadRow({ vin, index }: LeadRowProps) {
  const pColor = riskColor(vin.posterior_p);

  return (
    <motion.div
      initial={{ opacity: 0, x: -12 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ ...springs.snappy, delay: index * 0.03 }}
    >
      <Link href={`/vin/${vin.id}`} className="block group">
        <div className={cn(
          'flex items-center gap-4 px-4 py-3 rounded-lg transition-all duration-200',
          'bg-gravity-surface border border-transparent',
          'hover:bg-gravity-elevated hover:border-gravity-border',
          `hover:${riskBorderClass(vin.risk_band)}`
        )}>
          {/* Rank */}
          <span className="text-xs font-mono text-gravity-text-whisper w-8 text-right">
            {(index + 1).toString().padStart(3, '0')}
          </span>

          {/* P-Score */}
          <div className="w-20">
            <motion.span
              layoutId={`p-score-${vin.id}`}
              className={cn('font-mono text-2xl font-light tracking-wide', riskBandClass(vin.risk_band))}
              style={{ color: pColor }}
            >
              {formatPScore(vin.posterior_p)}
            </motion.span>
          </div>

          {/* VIN + Model */}
          <div className="flex-1 min-w-0">
            <p className="font-mono text-sm text-gravity-text tracking-wide truncate">
              {formatVinCode(vin.vin_code)}
            </p>
            <p className="text-xs text-gravity-text-secondary mt-0.5">
              {vin.year} {vin.make} {vin.model} {vin.trim}
            </p>
          </div>

          {/* Subsystem badge */}
          <span className={cn(
            'px-2 py-0.5 text-[10px] font-semibold uppercase tracking-widest rounded',
            vin.subsystem === 'propulsion' && 'bg-amber-400/10 text-amber-400',
            vin.subsystem === 'chassis' && 'bg-score-c/10 text-score-c',
            vin.subsystem === 'safety' && 'bg-score-s/10 text-score-s',
          )}>
            {vin.subsystem}
          </span>

          {/* Risk band */}
          <span className={cn(
            'px-2 py-0.5 text-[10px] font-semibold uppercase tracking-widest rounded',
            vin.risk_band === 'critical' && 'bg-risk-critical/10 text-risk-critical',
            vin.risk_band === 'high' && 'bg-risk-high/10 text-risk-high',
            vin.risk_band === 'medium' && 'bg-risk-medium/10 text-risk-medium',
            vin.risk_band === 'low' && 'bg-risk-low/10 text-risk-low',
          )}>
            {vin.risk_band}
          </span>

          {/* C/S mini scores */}
          <div className="flex gap-3 w-24">
            <div className="text-center">
              <div className="text-[10px] font-semibold uppercase tracking-widest text-gravity-text-whisper">C</div>
              <div className="font-mono text-sm text-score-c">{vin.posterior_c.toFixed(2)}</div>
            </div>
            <div className="text-center">
              <div className="text-[10px] font-semibold uppercase tracking-widest text-gravity-text-whisper">S</div>
              <div className="font-mono text-sm text-score-s">{vin.posterior_s.toFixed(2)}</div>
            </div>
          </div>

          {/* Last event */}
          <span className="text-xs text-gravity-text-whisper w-16 text-right font-mono">
            {formatRelative(vin.last_event_at)}
          </span>

          {/* Arrow */}
          <svg className="w-4 h-4 text-gravity-text-whisper group-hover:text-gravity-text transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5l7 7-7 7" />
          </svg>
        </div>
      </Link>
    </motion.div>
  );
}
