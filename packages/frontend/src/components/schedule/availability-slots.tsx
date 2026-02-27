'use client';

import { motion } from 'framer-motion';
import { cn } from '@/lib/cn';
import { formatDate } from '@/lib/format';
import type { FSRSlot, Dealer } from '@gravity/shared';

interface AvailabilitySlotsProps {
  slots: (FSRSlot & { dealer: Dealer; score: number })[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}

export function AvailabilitySlots({ slots, selectedId, onSelect }: AvailabilitySlotsProps) {
  // Group by date
  const grouped = slots.reduce<Record<string, typeof slots>>((acc, slot) => {
    const key = slot.date;
    if (!acc[key]) acc[key] = [];
    acc[key].push(slot);
    return acc;
  }, {});

  const dates = Object.keys(grouped).sort().slice(0, 7); // Show 7 days

  return (
    <div>
      <div className="text-[10px] font-semibold uppercase tracking-widest text-gravity-text-whisper mb-3">
        Available Slots
      </div>
      <div className="space-y-4">
        {dates.map((date) => (
          <div key={date}>
            <div className="text-xs text-gravity-text-secondary mb-2 font-mono">
              {formatDate(date)}
            </div>
            <div className="flex flex-wrap gap-2">
              {grouped[date].map((slot, i) => (
                <motion.button
                  key={slot.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.03 }}
                  onClick={() => onSelect(slot.id)}
                  className={cn(
                    'px-3 py-2 rounded-lg border text-xs transition-all duration-200',
                    selectedId === slot.id
                      ? 'bg-gravity-accent/10 border-gravity-accent/40 text-gravity-text'
                      : 'bg-gravity-surface border-gravity-border text-gravity-text-secondary hover:border-gravity-text-whisper'
                  )}
                >
                  <div className="font-medium capitalize">{slot.time_block}</div>
                  <div className="text-[10px] text-gravity-text-whisper mt-0.5">
                    {slot.capacity - slot.booked} open
                  </div>
                  {slot.score > 0.5 && (
                    <div className="text-[9px] text-gravity-accent mt-0.5 font-semibold uppercase tracking-wider">
                      Recommended
                    </div>
                  )}
                </motion.button>
              ))}
            </div>
          </div>
        ))}
        {dates.length === 0 && (
          <p className="text-sm text-gravity-text-whisper">No available slots found.</p>
        )}
      </div>
    </div>
  );
}
