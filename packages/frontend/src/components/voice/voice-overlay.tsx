'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/cn';
import { springs } from '@/lib/motion';
import { PulseIndicator } from './pulse-indicator';
import { StreamingText } from './streaming-text';
import { useVoiceStream } from '@/hooks/use-voice-stream';
import type { VoiceScope } from '@gravity/shared';

interface VoiceOverlayProps {
  open: boolean;
  onClose: () => void;
  scope: VoiceScope;
  vinId?: string;
}

const QUICK_PROMPTS = {
  vin: [
    'Summarize this vehicle\'s risk profile.',
    'Which pillars are most concerning?',
    'Should this vehicle be scheduled for service?',
    'Explain the P-score trajectory.',
  ],
  fleet: [
    'Summarize the fleet risk overview.',
    'Which vehicles need immediate attention?',
    'What are the top subsystem trends?',
    'Recommend a scheduling priority.',
  ],
};

export function VoiceOverlay({ open, onClose, scope, vinId }: VoiceOverlayProps) {
  const [input, setInput] = useState('');
  const { isStreaming, text, error, stream, stop, reset } = useVoiceStream();

  const handleSubmit = (message: string) => {
    if (!message.trim()) return;
    stream(scope, vinId || null, message.trim());
    setInput('');
  };

  const handleClose = () => {
    stop();
    reset();
    onClose();
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40"
            onClick={handleClose}
          />

          {/* Bottom sheet */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={springs.snappy}
            className="fixed bottom-0 left-0 right-0 z-50 max-h-[70vh]"
          >
            <div className="bg-gravity-elevated/95 backdrop-blur-xl rounded-t-2xl border-t border-gravity-border overflow-hidden">
              {/* Handle */}
              <div className="flex justify-center pt-3 pb-2">
                <div className="w-10 h-1 rounded-full bg-gravity-border" />
              </div>

              {/* Header */}
              <div className="px-6 pb-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <PulseIndicator active={isStreaming} size={32} />
                  <div>
                    <h3 className="text-sm font-medium">
                      {scope === 'vin' ? 'VIN Analyst' : 'Fleet Advisor'}
                    </h3>
                    <p className="text-[10px] text-gravity-text-whisper uppercase tracking-widest">
                      {isStreaming ? 'Analyzing...' : 'Ready'}
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleClose}
                  className="w-8 h-8 rounded-full bg-gravity-surface flex items-center justify-center hover:bg-gravity-border transition-colors"
                >
                  <svg className="w-4 h-4 text-gravity-text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Streaming response */}
              <div className="px-6 pb-4">
                <StreamingText text={text} isStreaming={isStreaming} />
                {error && (
                  <p className="text-xs text-risk-critical mt-2">{error}</p>
                )}
              </div>

              {/* Quick prompts */}
              {!text && !isStreaming && (
                <div className="px-6 pb-4">
                  <div className="text-[10px] font-semibold uppercase tracking-widest text-gravity-text-whisper mb-2">
                    Quick Prompts
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {QUICK_PROMPTS[scope].map((prompt) => (
                      <button
                        key={prompt}
                        onClick={() => handleSubmit(prompt)}
                        className="text-xs px-3 py-1.5 bg-gravity-surface border border-gravity-border rounded-full text-gravity-text-secondary hover:text-gravity-text hover:border-gravity-text-whisper transition-colors"
                      >
                        {prompt}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Input */}
              <div className="px-6 pb-6">
                <div className="flex gap-2">
                  <input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSubmit(input)}
                    placeholder={`Ask about ${scope === 'vin' ? 'this vehicle' : 'the fleet'}...`}
                    className="flex-1 px-4 py-2.5 bg-gravity-surface border border-gravity-border rounded-lg text-sm text-gravity-text placeholder:text-gravity-text-whisper focus:outline-none focus:border-gravity-accent/40"
                    disabled={isStreaming}
                  />
                  {isStreaming ? (
                    <button
                      onClick={stop}
                      className="px-4 py-2.5 bg-risk-critical/20 text-risk-critical text-sm font-medium rounded-lg hover:bg-risk-critical/30 transition-colors"
                    >
                      Stop
                    </button>
                  ) : (
                    <button
                      onClick={() => handleSubmit(input)}
                      disabled={!input.trim()}
                      className="px-4 py-2.5 bg-gravity-accent hover:bg-gravity-accent/90 disabled:opacity-30 text-white text-sm font-medium rounded-lg transition-colors"
                    >
                      Ask
                    </button>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
