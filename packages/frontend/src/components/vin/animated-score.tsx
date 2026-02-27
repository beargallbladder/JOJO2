'use client';

import { useEffect, useState } from 'react';
import { motion, useSpring, useTransform } from 'framer-motion';

interface AnimatedScoreProps {
  value: number;
  decimals?: number;
  className?: string;
}

export function AnimatedScore({ value, decimals = 3, className }: AnimatedScoreProps) {
  const spring = useSpring(0, { stiffness: 100, damping: 30 });
  const display = useTransform(spring, (v) => v.toFixed(decimals));
  const [current, setCurrent] = useState(value.toFixed(decimals));

  useEffect(() => {
    spring.set(value);
    const unsubscribe = display.on('change', (v) => setCurrent(v));
    return unsubscribe;
  }, [value, spring, display]);

  return <span className={className}>{current}</span>;
}
