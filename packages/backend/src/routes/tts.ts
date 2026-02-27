import { Hono } from 'hono';
import { env } from '../config/env.js';

export const ttsRoute = new Hono();

ttsRoute.post('/', async (c) => {
  const body = await c.req.json().catch(() => null);
  const text = typeof body?.text === 'string' ? body.text.trim() : '';

  if (!text) return c.json({ error: 'Missing text' }, 400);
  if (!env.OPENAI_API_KEY) return c.json({ error: 'TTS not configured' }, 500);

  const clipped = text.length > 1600 ? text.slice(0, 1600) : text;

  const upstream = await fetch('https://api.openai.com/v1/audio/speech', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${env.OPENAI_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: env.OPENAI_TTS_MODEL,
      voice: env.OPENAI_TTS_VOICE,
      input: clipped,
      response_format: 'mp3',
      instructions:
        'Calm, controlled, deliberate cadence. Executive-level clarity. Short declarative sentences. No filler.',
    }),
  });

  if (!upstream.ok || !upstream.body) {
    const details = await upstream.text().catch(() => '');
    return c.json({ error: 'TTS failed', details: details || upstream.statusText }, 502);
  }

  return new Response(upstream.body, {
    headers: {
      'Content-Type': 'audio/mpeg',
      'Cache-Control': 'no-store',
    },
  });
});

