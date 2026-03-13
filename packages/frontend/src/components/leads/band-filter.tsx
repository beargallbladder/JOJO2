'use client';

import { cn } from '@/lib/cn';

interface BandFilterProps {
  selected: string | null;
  onSelect: (band: string | null) => void;
}

const bands = [
  { key: 'ESCALATED', label: 'Escalated', dotClass: 'bg-red-500' },
  { key: 'MONITOR', label: 'Monitor', dotClass: 'bg-yellow-500' },
  { key: 'SUPPRESSED', label: 'Suppressed', dotClass: 'bg-gray-500' },
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
          <span className={cn('w-2 h-2 rounded-full', b.dotClass)} />
          {b.label}
        </button>
      ))}
    </div>
  );
}
