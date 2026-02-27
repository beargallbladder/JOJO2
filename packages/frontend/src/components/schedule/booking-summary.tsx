'use client';

import { motion } from 'framer-motion';
import { cn } from '@/lib/cn';
import { staggers } from '@/lib/motion';
import { formatDate } from '@/lib/format';
import type { BookingDraft } from '@gravity/shared';

interface BookingSummaryProps {
  booking: BookingDraft;
  dealerName?: string;
  slotDate?: string;
  slotTime?: string;
}

export function BookingSummary({ booking, dealerName, slotDate, slotTime }: BookingSummaryProps) {
  const lines = [
    { label: 'Status', value: booking.status === 'draft' ? 'Draft Request' : booking.status === 'held' ? 'Slot Held' : 'Exported' },
    { label: 'Dealer', value: dealerName || booking.dealer_id },
    { label: 'Date', value: slotDate ? formatDate(slotDate) : '—' },
    { label: 'Time', value: slotTime || '—' },
    { label: 'Reason', value: booking.reason },
    { label: 'Reference', value: booking.id.slice(0, 8).toUpperCase() },
  ];

  return (
    <div className="bg-gravity-elevated border border-gravity-border rounded-xl p-6">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-2 h-2 rounded-full bg-risk-medium animate-pulse" />
        <span className="text-[10px] font-semibold uppercase tracking-widest text-risk-medium">
          {booking.status === 'held' ? 'Slot Held' : 'Draft Created'}
        </span>
      </div>

      <div className="space-y-3">
        {lines.map((line, i) => (
          <motion.div
            key={line.label}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * staggers.normal }}
            className="flex justify-between items-start"
          >
            <span className="text-[10px] font-semibold uppercase tracking-widest text-gravity-text-whisper">
              {line.label}
            </span>
            <span className="text-sm text-gravity-text text-right max-w-[60%]">
              {line.value}
            </span>
          </motion.div>
        ))}
      </div>

      <div className="mt-4 pt-4 border-t border-gravity-border">
        <p className="text-[10px] text-gravity-text-whisper">
          This is a draft request only. No appointment has been confirmed at the dealer.
        </p>
      </div>
    </div>
  );
}
