'use client';

import { cn } from '@/lib/cn';

interface SubsystemFilterProps {
  selected: string | null;
  onSelect: (sub: string | null) => void;
}

const subsystems = [
  { key: 'propulsion', label: 'Propulsion', shortLabel: 'P', color: 'text-amber-400' },
  { key: 'chassis', label: 'Chassis', shortLabel: 'C', color: 'text-score-c' },
  { key: 'safety', label: 'Safety', shortLabel: 'S', color: 'text-score-s' },
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
          <span className={s.color}>{s.shortLabel}</span> {s.label}
        </button>
      ))}
    </div>
  );
}
