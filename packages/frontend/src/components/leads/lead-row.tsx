'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { cn } from '@/lib/cn';
import { riskColor } from '@/lib/risk-color';
import { formatPScore, formatVinCode, formatRelative } from '@/lib/format';
import { springs } from '@/lib/motion';
import type { Vin } from '@gravity/shared';

interface LeadRowProps {
  vin: Vin;
  index: number;
}

const bandStyles: Record<string, string> = {
  ESCALATED: 'bg-red-500/10 text-red-400',
  MONITOR: 'bg-yellow-500/10 text-yellow-400',
  SUPPRESSED: 'bg-gray-500/10 text-gray-400',
};

const subsystemLabels: Record<string, string> = {
  battery_12v: '12V',
  oil_maintenance: 'OIL',
  brake_wear: 'BRK',
};

export function LeadRow({ vin, index }: LeadRowProps) {
  const pColor = riskColor(vin.posterior_p);
  const govBand = vin.governance_band || 'SUPPRESSED';

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
          govBand === 'ESCALATED' && 'border-l-2 border-l-red-500/40',
        )}>
          <span className="text-xs font-mono text-gravity-text-whisper w-8 text-right">
            {(index + 1).toString().padStart(3, '0')}
          </span>

          <div className="w-20">
            <span
              className="font-mono text-2xl font-light tracking-wide"
              style={{ color: pColor }}
            >
              {formatPScore(vin.posterior_p)}
            </span>
          </div>

          <div className="flex-1 min-w-0">
            <p className="font-mono text-sm text-gravity-text tracking-wide truncate">
              {formatVinCode(vin.vin_code)}
            </p>
            <p className="text-xs text-gravity-text-secondary mt-0.5">
              {vin.year} {vin.make} {vin.model} {vin.trim}
            </p>
          </div>

          <span className="px-2 py-0.5 text-[10px] font-semibold uppercase tracking-widest rounded bg-gravity-elevated text-gravity-text-secondary">
            {subsystemLabels[vin.subsystem] || vin.subsystem}
          </span>

          <span className={cn(
            'px-2 py-0.5 text-[10px] font-semibold uppercase tracking-widest rounded',
            bandStyles[govBand] || bandStyles.SUPPRESSED,
          )}>
            {govBand}
          </span>

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

          <span className="text-xs text-gravity-text-whisper w-16 text-right font-mono">
            {formatRelative(vin.last_event_at)}
          </span>

          <svg className="w-4 h-4 text-gravity-text-whisper group-hover:text-gravity-text transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5l7 7-7 7" />
          </svg>
        </div>
      </Link>
    </motion.div>
  );
}
