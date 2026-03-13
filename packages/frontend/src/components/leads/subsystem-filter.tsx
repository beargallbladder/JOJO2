'use client';

import { cn } from '@/lib/cn';

interface SubsystemFilterProps {
  selected: string | null;
  onSelect: (sub: string | null) => void;
}

const subsystems = [
  { key: 'battery_12v', label: 'Battery 12V', shortLabel: '12V' },
  { key: 'oil_maintenance', label: 'Oil', shortLabel: 'OIL' },
  { key: 'brake_wear', label: 'Brakes', shortLabel: 'BRK' },
];

export function SubsystemFilter({ selected, onSelect }: SubsystemFilterProps) {
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
      {subsystems.map((s) => (
        <button
          key={s.key}
          onClick={() => onSelect(selected === s.key ? null : s.key)}
          className={cn(
            'px-3 py-1.5 text-xs font-medium uppercase tracking-wider rounded-md transition-colors',
            selected === s.key ? 'bg-gravity-elevated text-gravity-text' : 'bg-gravity-surface text-gravity-text-secondary hover:text-gravity-text'
          )}
        >
          {s.shortLabel}
        </button>
      ))}
    </div>
  );
}
