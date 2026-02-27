export interface VoiceRequest {
  message: string;
  context?: Record<string, unknown>;
}

export interface VoiceChunk {
  type: 'text' | 'done' | 'error';
  content: string;
}

export type VoiceScope = 'vin' | 'fleet';
