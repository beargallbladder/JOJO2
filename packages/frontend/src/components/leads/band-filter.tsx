'use client';

import { cn } from '@/lib/cn';
import { RISK_BANDS } from '@gravity/shared';

interface BandFilterProps {
  selected: string | null;
  onSelect: (band: string | null) => void;
}

const bands = [
  { key: 'critical', label: 'Critical', color: 'bg-risk-critical' },
  { key: 'high', label: 'High', color: 'bg-risk-high' },
  { key: 'medium', label: 'Medium', color: 'bg-risk-medium' },
  { key: 'low', label: 'Low', color: 'bg-risk-low' },
];

export function BandFilter({ selected, onSelect }: BandFilterProps) {
  return (
    <div className="flex gap-2">
      <button
        onClick={() => onSelect(null)}
        className={cn(
          'px-3 py-1.5 text-xs font-medium uppercase tracking-wider rounded-md transition-colors',
          !selected ? 'bg-gravity-elevated text-gravity-text' : 'bg-gravity-surface text-gravity-text-secondary hover:text-gravity-text'
        )}
      >
        All
      </button>
      {bands.map((b) => (
        <button
          key={b.key}
          onClick={() => onSelect(selected === b.key ? null : b.key)}
          className={cn(
            'px-3 py-1.5 text-xs font-medium uppercase tracking-wider rounded-md transition-colors flex items-center gap-1.5',
            selected === b.key ? 'bg-gravity-elevated text-gravity-text' : 'bg-gravity-surface text-gravity-text-secondary hover:text-gravity-text'
          )}
        >
          <span className={cn('w-2 h-2 rounded-full', b.color)} />
          {b.label}
        </button>
      ))}
    </div>
  );
}
