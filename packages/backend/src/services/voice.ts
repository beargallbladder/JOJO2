import Anthropic from '@anthropic-ai/sdk';
import { env } from '../config/env.js';

const VIN_SYSTEM_PROMPT = `You are a senior automotive risk analyst at a vehicle intelligence platform called Gravity. You have access ONLY to the VIN data provided. Reference specific pillars, P/C/S scores, absences, and governance actions. Be authoritative and concise. Use technical language but remain accessible. Never say "I think" - state findings directly.`;

const FLEET_SYSTEM_PROMPT = `You are a fleet intelligence advisor at a vehicle intelligence platform called Gravity. You see aggregated fleet data only. Reference top-ranked VINs, subsystem trends, and scheduling recommendations. Do not reference individual VIN details until the user asks about one. Be strategic and data-driven.`;

export async function* streamVoiceResponse(params: {
  scope: 'vin' | 'fleet';
  message: string;
  context: Record<string, unknown>;
}): AsyncGenerator<{ type: 'text' | 'done' | 'error'; content: string }> {
  if (!env.ANTHROPIC_API_KEY) {
    yield { type: 'text', content: 'Voice is available when ANTHROPIC_API_KEY is configured. This is a demo placeholder response summarizing the data for ' };
    yield { type: 'text', content: params.scope === 'vin' ? `VIN ${(params.context as any).vin_code || 'unknown'}. ` : 'the fleet. ' };
    yield { type: 'text', content: 'The posterior probability indicates ' };
    yield { type: 'text', content: params.scope === 'vin' ? `a risk level that warrants attention based on the pillar analysis.` : `several high-priority vehicles requiring scheduling.` };
    yield { type: 'done', content: '' };
    return;
  }

  try {
    const client = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY });
    const systemPrompt = params.scope === 'vin' ? VIN_SYSTEM_PROMPT : FLEET_SYSTEM_PROMPT;

    const stream = await client.messages.stream({
      model: 'claude-sonnet-4-6-20250514',
      max_tokens: 1024,
      system: systemPrompt,
      messages: [
        {
          role: 'user',
          content: `Context data:\n${JSON.stringify(params.context, null, 2)}\n\nUser question: ${params.message}`,
        },
      ],
    });

    for await (const event of stream) {
      if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
        yield { type: 'text', content: event.delta.text };
      }
    }
    yield { type: 'done', content: '' };
  } catch (err: any) {
    yield { type: 'error', content: err.message || 'Voice streaming failed' };
  }
}
