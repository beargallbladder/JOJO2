'use client';

import { motion } from 'framer-motion';
import { cn } from '@/lib/cn';

interface VoiceTriggerProps {
  onClick: () => void;
  mode: 'vin' | 'fleet';
}

export function VoiceTrigger({ onClick, mode }: VoiceTriggerProps) {
  return (
    <motion.button
      onClick={onClick}
      className={cn(
        'fixed bottom-6 right-6 z-30',
        'w-14 h-14 rounded-full',
        'bg-gravity-accent hover:bg-gravity-accent/90',
        'shadow-lg shadow-gravity-accent/20',
        'flex items-center justify-center',
        'transition-colors'
      )}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 400, damping: 20 }}
    >
      {/* Microphone / AI icon */}
      <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456z" />
      </svg>

      {/* Mode indicator dot */}
      <div className={cn(
        'absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full text-[8px] font-bold flex items-center justify-center text-white',
        mode === 'vin' ? 'bg-risk-high' : 'bg-score-c'
      )}>
        {mode === 'vin' ? 'V' : 'F'}
      </div>
    </motion.button>
  );
}
