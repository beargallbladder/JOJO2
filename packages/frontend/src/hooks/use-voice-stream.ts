'use client';

import { useState, useCallback, useRef } from 'react';
import { createVoiceStream } from '@/lib/api-client';

interface VoiceState {
  isStreaming: boolean;
  text: string;
  error: string | null;
}

export function useVoiceStream() {
  const [state, setState] = useState<VoiceState>({ isStreaming: false, text: '', error: null });
  const abortRef = useRef<AbortController | null>(null);

  const stream = useCallback(async (scope: 'vin' | 'fleet', id: string | null, message: string) => {
    // Abort previous stream
    if (abortRef.current) abortRef.current.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setState({ isStreaming: true, text: '', error: null });

    try {
      const response = await createVoiceStream(scope, id, message);

      if (!response.ok) {
        throw new Error(`Voice request failed: ${response.status}`);
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error('No response body');

      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        if (controller.signal.aborted) break;

        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const chunk = JSON.parse(line.slice(6));
              if (chunk.type === 'text') {
                setState(prev => ({ ...prev, text: prev.text + chunk.content }));
              } else if (chunk.type === 'done') {
                setState(prev => ({ ...prev, isStreaming: false }));
              } else if (chunk.type === 'error') {
                setState(prev => ({ ...prev, isStreaming: false, error: chunk.content }));
              }
            } catch {
              // Skip malformed JSON
            }
          }
        }
      }

      setState(prev => ({ ...prev, isStreaming: false }));
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        setState(prev => ({ ...prev, isStreaming: false, error: err.message }));
      }
    }
  }, []);

  const stop = useCallback(() => {
    if (abortRef.current) {
      abortRef.current.abort();
      abortRef.current = null;
    }
    setState(prev => ({ ...prev, isStreaming: false }));
  }, []);

  const reset = useCallback(() => {
    stop();
    setState({ isStreaming: false, text: '', error: null });
  }, [stop]);

  return { ...state, stream, stop, reset };
}
