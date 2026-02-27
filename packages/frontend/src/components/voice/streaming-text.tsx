'use client';

import { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';

interface StreamingTextProps {
  text: string;
  isStreaming: boolean;
}

export function StreamingText({ text, isStreaming }: StreamingTextProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll as text streams in
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [text]);

  if (!text && !isStreaming) return null;

  return (
    <div
      ref={containerRef}
      className="max-h-[200px] overflow-y-auto pr-2 scrollbar-thin"
    >
      <p className="text-sm leading-relaxed text-gravity-text">
        {text}
        {isStreaming && (
          <motion.span
            className="inline-block w-1.5 h-4 bg-gravity-accent ml-0.5 align-middle"
            animate={{ opacity: [1, 0] }}
            transition={{ duration: 0.5, repeat: Infinity }}
          />
        )}
      </p>
    </div>
  );
}
