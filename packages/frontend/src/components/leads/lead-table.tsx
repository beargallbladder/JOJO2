'use client';

import { motion } from 'framer-motion';
import { LeadRow } from './lead-row';
import { staggerContainer, staggers } from '@/lib/motion';
import type { Vin } from '@gravity/shared';

interface LeadTableProps {
  leads: Vin[];
  page: number;
  limit: number;
}

export function LeadTable({ leads, page, limit }: LeadTableProps) {
  const startIndex = (page - 1) * limit;

  return (
    <motion.div
      variants={staggerContainer(staggers.fast)}
      initial="initial"
      animate="animate"
      className="space-y-1"
    >
      {/* Header */}
      <div className="flex items-center gap-4 px-4 py-2 text-[10px] font-semibold uppercase tracking-widest text-gravity-text-whisper">
        <span className="w-8 text-right">#</span>
        <span className="w-20">P-Score</span>
        <span className="flex-1">VIN / Vehicle</span>
        <span className="w-20 text-center">System</span>
        <span className="w-20 text-center">Band</span>
        <span className="w-24 text-center">C / S</span>
        <span className="w-16 text-right">Updated</span>
        <span className="w-4" />
      </div>

      {/* Rows */}
      {leads.map((vin, i) => (
        <LeadRow key={vin.id} vin={vin} index={startIndex + i} />
      ))}

      {leads.length === 0 && (
        <div className="text-center py-12 text-gravity-text-secondary">
          No leads match the current filters.
        </div>
      )}
    </motion.div>
  );
}
