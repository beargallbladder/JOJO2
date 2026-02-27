import Anthropic from '@anthropic-ai/sdk';
import { env } from '../config/env.js';

const VIN_SYSTEM_PROMPT = `You are Gravity Wingman — a vehicle health and prognostics operator.

You are the user’s partner. Think Maverick and Goose: tight callouts, calm authority, mutual trust.

Guardrails:
- Use ONLY the provided context. If something is missing, say “Not in the current record.”
- No speculation. No hype. No emojis.
- Short declarative sentences. Clear next action.

Always reference:
- Posterior P (risk probability)
- Confidence C
- Severity S
- The pillars that support the call (and any notable absences)

Output structure:
1) What’s up (one sentence)
2) Numbers: P / C / S
3) Drivers: 2–4 pillars
4) Gaps: missing/weak evidence
5) Next move: one action`;

const FLEET_SYSTEM_PROMPT = `You are Gravity Wingman — fleet health operator.

Guardrails:
- Use ONLY the provided fleet context.
- Do not invent VINs. Reference only the provided top leads list.
- No speculation. No filler.

Tone:
Calm. Controlled. Operator cadence. Partner mindset.

Output structure:
1) What’s up (one sentence)
2) Priority list (top 3) with P and band
3) Subsystem trend (one sentence)
4) Next move (one action)`;

function safeFallback(params: { scope: 'vin' | 'fleet'; message: string; context: Record<string, unknown> }) {
  if (params.scope === 'vin') {
    const ctx: any = params.context || {};
    const vin = ctx.vin || {};
    const pillars = Array.isArray(ctx.pillars) ? ctx.pillars : [];
    const governance = Array.isArray(ctx.governance) ? ctx.governance : [];
    const topPillars = pillars
      .slice()
      .sort((a: any, b: any) => String(b.occurred_at).localeCompare(String(a.occurred_at)))
      .slice(0, 3)
      .map((p: any) => `${p.pillar_name}=${p.pillar_state}`);

    return [
      `What’s up: ${vin.risk_band || 'unknown'} risk signal on VIN ${vin.vin_code || 'unknown'}.`,
      `Numbers: P ${Number(vin.posterior_p ?? 0).toFixed(2)} / C ${Number(vin.posterior_c ?? 0).toFixed(2)} / S ${Number(vin.posterior_s ?? 0).toFixed(2)}`,
      `Drivers: ${topPillars.length ? topPillars.join(', ') : 'Not in the current record.'}`,
      `Governance: ${governance.length ? governance[0].action_type : 'None recorded.'}`,
      `Next move: Open the timeline. Verify the last event window. If needed, schedule service hold/recommendation.`,
    ].join('\n');
  }

  const ctx: any = params.context || {};
  const top = Array.isArray(ctx.top_leads) ? ctx.top_leads : [];
  const top3 = top.slice(0, 3).map((v: any, i: number) => `${i + 1}) ${v.vin_code} P ${Number(v.p ?? 0).toFixed(2)} (${v.band})`);
  return [
    `What’s up: Fleet risk is concentrated in the top banded VINs.`,
    `Priority:`,
    top3.length ? top3.join('\n') : 'Not in the current record.',
    `Next move: Pull the #1 VIN detail. Confirm pillars. Decide schedule vs hold.`,
  ].join('\n');
}

export async function* streamVoiceResponse(params: {
  scope: 'vin' | 'fleet';
  message: string;
  context: Record<string, unknown>;
}): AsyncGenerator<{ type: 'text' | 'done' | 'error'; content: string }> {
  if (!env.ANTHROPIC_API_KEY) {
    yield { type: 'text', content: safeFallback(params) };
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
    const msg = err?.message || 'Voice streaming failed';
    // If the upstream key is invalid/misconfigured, keep the demo alive with a deterministic fallback.
    if (msg.includes('authentication_error') || msg.includes('invalid') || msg.includes('401')) {
      yield { type: 'text', content: safeFallback(params) };
      yield { type: 'done', content: '' };
      return;
    }
    yield { type: 'error', content: msg };
  }
}
