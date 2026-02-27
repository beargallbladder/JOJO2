'use client';

import { motion } from 'framer-motion';
import { cn } from '@/lib/cn';
import type { Dealer } from '@gravity/shared';

interface DealerCardProps {
  dealer: Dealer & { is_preferred?: boolean };
  selected: boolean;
  onSelect: () => void;
  index: number;
}

export function DealerCard({ dealer, selected, onSelect, index }: DealerCardProps) {
  return (
    <motion.button
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      onClick={onSelect}
      className={cn(
        'w-full text-left p-4 rounded-lg border transition-all duration-200',
        selected
          ? 'bg-gravity-accent/10 border-gravity-accent/40'
          : 'bg-gravity-surface border-gravity-border hover:border-gravity-text-whisper'
      )}
    >
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gravity-text">{dealer.name}</span>
            {dealer.is_preferred && (
              <span className="text-[10px] font-semibold uppercase tracking-widest text-gravity-accent bg-gravity-accent/10 px-1.5 py-0.5 rounded">
                Preferred
              </span>
            )}
          </div>
          <p className="text-xs text-gravity-text-secondary mt-1">{dealer.address}</p>
          <p className="text-xs text-gravity-text-whisper mt-0.5 font-mono">{dealer.code}</p>
        </div>
        <div className={cn(
          'w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors',
          selected ? 'border-gravity-accent bg-gravity-accent' : 'border-gravity-border'
        )}>
          {selected && (
            <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          )}
        </div>
      </div>

      {/* Capabilities */}
      <div className="flex gap-1.5 mt-2 flex-wrap">
        {(dealer.capabilities as string[]).map((cap) => (
          <span key={cap} className="text-[9px] font-medium uppercase tracking-wider text-gravity-text-whisper bg-gravity-elevated px-1.5 py-0.5 rounded">
            {cap.replace(/_/g, ' ')}
          </span>
        ))}
      </div>
    </motion.button>
  );
}
