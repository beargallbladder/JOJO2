'use client';

import { motion } from 'framer-motion';

interface PulseIndicatorProps {
  active: boolean;
  size?: number;
}

export function PulseIndicator({ active, size = 40 }: PulseIndicatorProps) {
  const r = size / 2;

  return (
    <div className="relative" style={{ width: size, height: size }}>
      {/* Concentric rings */}
      {active && (
        <>
          <motion.div
            className="absolute inset-0 rounded-full border border-gravity-accent/30"
            animate={{ scale: [1, 1.8], opacity: [0.4, 0] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: 'easeOut' }}
          />
          <motion.div
            className="absolute inset-0 rounded-full border border-gravity-accent/20"
            animate={{ scale: [1, 2.2], opacity: [0.3, 0] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: 'easeOut', delay: 0.3 }}
          />
          <motion.div
            className="absolute inset-0 rounded-full border border-gravity-accent/10"
            animate={{ scale: [1, 2.6], opacity: [0.2, 0] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: 'easeOut', delay: 0.6 }}
          />
        </>
      )}

      {/* Center dot */}
      <motion.div
        className="absolute inset-0 flex items-center justify-center"
        animate={active ? { scale: [1, 1.1, 1] } : {}}
        transition={{ duration: 0.8, repeat: Infinity }}
      >
        <div
          className="rounded-full bg-gravity-accent"
          style={{ width: r, height: r }}
        />
      </motion.div>
    </div>
  );
}
